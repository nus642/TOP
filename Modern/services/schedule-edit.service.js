const db = require("../database/db");
const tournamentRepository = require("../repositories/tournament.repository");
const playerRepository = require("../repositories/player.repository");
const matchRepository = require("../repositories/match.repository");
const scheduleRepository = require("../repositories/match-schedule.repository");

// Single-match arrangement CRUD is only safe before a match enters execution.
const EDITABLE_MATCH_STATUSES = new Set(["idle", "upcoming"]);

function makeValidationError(message) {
  const err = new Error(message);
  err.code = "VALIDATION_ERROR";
  return err;
}

function makeNotFoundError(message) {
  const err = new Error(message);
  err.code = "NOT_FOUND";
  return err;
}

function makeForbiddenError(message) {
  const err = new Error(message);
  err.code = "FORBIDDEN";
  return err;
}

function parsePositiveId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw makeValidationError(`Valid ${label} id is required`);
  }
  return id;
}

function requireMaster(actor) {
  if (!actor || actor.actorType !== "master") {
    throw makeForbiddenError("Only a master may edit the match arrangement");
  }
}

function normalizeCourt(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw makeValidationError("Court is required");
  }
  return value.trim().replace(/\s+/g, " ");
}

function normalizeScheduledAt(value) {
  if (!value) throw makeValidationError("Scheduled time is required");
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw makeValidationError("Invalid scheduled time");
  return d;
}

// Resolve p1..p4 player names to ids; doubles matches need all four.
// Also derives team display names for the UI (e.g. "张三 & 李四").
function resolveParticipants(data, playerMap) {
  const names = [];
  const ids = [];
  for (const field of ["p1", "p2", "p3", "p4"]) {
    const name = typeof data[field] === "string" ? data[field].trim() : "";
    if (!name) throw makeValidationError(`${field} is required`);
    const playerId = playerMap[name];
    if (!playerId) throw makeValidationError(`Unknown player reference: ${name}`);
    names.push(name);
    ids.push(playerId);
  }
  if (new Set(ids).size !== 4) {
    throw makeValidationError("Duplicate participant within a single match");
  }
  return {
    player1Id: ids[0], player2Id: ids[1], player3Id: ids[2], player4Id: ids[3],
    team1Name: `${names[0]} & ${names[1]}`,
    team2Name: `${names[2]} & ${names[3]}`
  };
}

async function requireCompetition(competitionId, connection) {
  const competition = await tournamentRepository.getTournamentByIdWithConnection(
    competitionId, connection
  );
  if (!competition) throw makeNotFoundError("Competition not found");
  return competition;
}

async function assertCourtFree(competitionId, courtId, scheduledAt, excludeMatchId, connection) {
  const conflict = await scheduleRepository.findCourtTimeConflict(
    competitionId, courtId, scheduledAt, excludeMatchId, connection
  );
  if (conflict) {
    throw makeValidationError(`Court-time conflict with match ${conflict.match_id}`);
  }
}

/**
 * Edit one match's arrangement (round, court, time, participants).
 * The authoritative match_schedules row is kept in sync in the same transaction.
 */
async function editMatch(competitionIdValue, matchIdValue, data = {}, actor) {
  requireMaster(actor);
  const competitionId = parsePositiveId(competitionIdValue, "competition");
  const matchId = parsePositiveId(matchIdValue, "match");

  const court = normalizeCourt(data.court);
  const scheduledAt = normalizeScheduledAt(data.scheduledAt);
  const roundNum = data.roundNum !== undefined
    ? parsePositiveId(data.roundNum, "round number")
    : null;

  return db.withTransaction(async (connection) => {
    await requireCompetition(competitionId, connection);

    // Lock match_schedules FIRST to maintain the global lock order:
    // tournaments → match_schedules → matches → reservations → referees
    const existingSchedule = await scheduleRepository.findByMatchForUpdate(competitionId, matchId, connection);

    const record = await matchRepository.findByIdForUpdate(competitionId, matchId, connection);
    if (!record) throw makeNotFoundError("Match not found");
    if (!EDITABLE_MATCH_STATUSES.has(record.status)) {
      throw makeValidationError(`Match cannot be edited in status ${record.status}`);
    }

    const playerMap = await playerRepository.getPlayerMap(competitionId, connection);
    const participants = resolveParticipants(data, playerMap);
    const finalRoundNum = roundNum ?? record.round_num;

    await assertCourtFree(competitionId, court, scheduledAt, matchId, connection);

    await matchRepository.updateMatchArrangement(competitionId, matchId, {
      roundNum: finalRoundNum, court, ...participants
    }, connection);

    if (existingSchedule) {
      await scheduleRepository.updateByMatch({
        competitionId, matchId, scheduledAt, courtId: court
      }, connection);
    } else {
      await scheduleRepository.create({
        competitionId, matchId, scheduledAt, courtId: court
      }, connection);
    }

    return { success: true, matchId, court, scheduledAt: scheduledAt.toISOString(), roundNum: finalRoundNum };
  });
}

/**
 * Add one match to the arrangement.
 */
async function addMatch(competitionIdValue, data = {}, actor) {
  requireMaster(actor);
  const competitionId = parsePositiveId(competitionIdValue, "competition");

  const court = normalizeCourt(data.court);
  const scheduledAt = normalizeScheduledAt(data.scheduledAt);
  const roundNum = parsePositiveId(data.roundNum, "round number");

  return db.withTransaction(async (connection) => {
    await requireCompetition(competitionId, connection);

    const playerMap = await playerRepository.getPlayerMap(competitionId, connection);
    const participants = resolveParticipants(data, playerMap);

    await assertCourtFree(competitionId, court, scheduledAt, 0, connection);

    const created = await matchRepository.createMatch({
      tournament_id: competitionId,
      round_num: roundNum,
      court,
      player1_id: participants.player1Id,
      player2_id: participants.player2Id,
      player3_id: participants.player3Id,
      player4_id: participants.player4Id,
      team1_name: participants.team1Name,
      team2_name: participants.team2Name,
      score1: null,
      score2: null,
      status: "idle"
    }, connection);

    await scheduleRepository.create({
      competitionId, matchId: created.id, scheduledAt, courtId: court
    }, connection);

    return { success: true, matchId: created.id, court, scheduledAt: scheduledAt.toISOString(), roundNum };
  });
}

/**
 * Delete one match that has not entered execution.
 */
async function deleteMatch(competitionIdValue, matchIdValue, actor) {
  requireMaster(actor);
  const competitionId = parsePositiveId(competitionIdValue, "competition");
  const matchId = parsePositiveId(matchIdValue, "match");

  return db.withTransaction(async (connection) => {
    await requireCompetition(competitionId, connection);

    // Lock match_schedules FIRST to maintain the global lock order:
    // tournaments → match_schedules → matches → reservations → referees
    await scheduleRepository.findByMatchForUpdate(competitionId, matchId, connection);

    const record = await matchRepository.findByIdForUpdate(competitionId, matchId, connection);
    if (!record) throw makeNotFoundError("Match not found");
    if (!EDITABLE_MATCH_STATUSES.has(record.status)) {
      throw makeValidationError(`Match cannot be deleted in status ${record.status}`);
    }

    await scheduleRepository.deleteByMatch(competitionId, matchId, connection);
    await matchRepository.deleteMatchById(competitionId, matchId, connection);

    return { success: true, matchId };
  });
}

module.exports = { editMatch, addMatch, deleteMatch };
