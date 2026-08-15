const competitionRefereeRepository = require("../repositories/competition-referee.repository");
const courtRepository = require("../repositories/court-coordination.repository");

function validationError(message) {
  const error = new Error(message);
  error.code = "VALIDATION_ERROR";
  return error;
}

function positiveId(value, name) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw validationError(`Valid ${name} is required`);
  }
  return id;
}

// Competition Referee Roster management
// The Master controls which referees can be assigned to matches in this competition.

async function createRoster(competitionValue, refereeIds) {
  const competitionId = positiveId(competitionValue, "competition id");
  return competitionRefereeRepository.createRoster(competitionId, refereeIds);
}

async function listRoster(competitionValue) {
  const competitionId = positiveId(competitionValue, "competition id");
  return competitionRefereeRepository.listRoster(competitionId);
}

async function listEligibleReferees(competitionValue) {
  const competitionId = positiveId(competitionValue, "competition id");
  return competitionRefereeRepository.listEligibleReferees(competitionId);
}

async function findByReferee(competitionValue, refereeId) {
  const competitionId = positiveId(competitionValue, "competition id");
  return competitionRefereeRepository.findByRefereeInRoster(competitionId, refereeId);
}

async function updateRefereeStatus(competitionValue, refereeId, updates) {
  const competitionId = positiveId(competitionValue, "competition id");
  return competitionRefereeRepository.updateRefereeStatus(competitionId, refereeId, updates);
}

// Backend-authoritative candidates query
// Returns available referees for a specific match and court, based on the
// competition referee roster and current match schedule authorization.

async function listAvailableCandidates(competitionValue, matchValue, actor, excludeMatchId = null) {
  const competitionId = positiveId(competitionValue, "competition id");
  const matchId = positiveId(matchValue, "match id");
  
  if (actor?.actorType !== "master") {
    throw validationError("Only a master may query dispatch candidates");
  }
  
  // Get eligible referees from roster
  const eligibleReferees = await competitionRefereeRepository.listEligibleReferees(competitionId);
  
  // Get the court authorized by match_schedules for this match
  const courtId = await courtRepository.findScheduledCourt(competitionId, matchId);
  
  // Filter out referees with active dispatch reservations for OTHER matches.
  // excludeMatchId allows the current match's own reservation to be ignored
  // (e.g. reassign scenario where the current referee still holds a reservation
  // for this same match and must remain selectable).
  const availableReferees = [];
  for (const r of eligibleReferees) {
    const activeReservation = await competitionRefereeRepository.findActiveReservationByRefereeExcluding(
      r.refereeId, competitionId, excludeMatchId
    );
    if (!activeReservation) {
      availableReferees.push({
        refereeId: r.refereeId,
        active: r.active,
        eligible: r.eligible
      });
    }
  }
  
  return {
    matchId,
    courtId,
    eligibleReferees: availableReferees
  };
}

module.exports = {
  createRoster,
  listRoster,
  listEligibleReferees,
  findByReferee,
  updateRefereeStatus,
  listAvailableCandidates
};