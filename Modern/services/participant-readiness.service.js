const db = require("../database/db");
const readinessRepository = require("../repositories/participant-readiness.repository");
const tournamentRepository = require("../repositories/tournament.repository");
const checkinService = require("./checkin.service");
const { ReadinessState } = require("../engine/readiness");

function parseId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error(`Valid ${label} id is required`);
    error.code = "VALIDATION_ERROR";
    throw error;
  }
  return id;
}

function competitionNotFound() {
  const error = new Error("Competition not found");
  error.code = "NOT_FOUND";
  return error;
}

function response(competitionId, participantId, row) {
  const readiness = ReadinessState.fromPersistence(participantId, row);
  return {
    competitionId,
    participantId: readiness.participantId,
    state: readiness.state,
    checkedInAt: readiness.checkedInAt
  };
}

async function checkIn(competitionIdValue, participantIdValue, data = {}) {
  const competitionId = parseId(competitionIdValue, "competition");
  const participantId = parseId(participantIdValue, "participant");
  const result = await checkinService.checkInPlayer(competitionId, participantId, data);
  return response(competitionId, participantId, result.checkIn);
}

async function getReadiness(competitionIdValue, participantIdValue) {
  const competitionId = parseId(competitionIdValue, "competition");
  const participantId = parseId(participantIdValue, "participant");

  const result = await checkinService.getCheckInStatus(competitionId, participantId);
  return response(competitionId, participantId, result.checkIn);
}

async function listReadiness(competitionIdValue) {
  const competitionId = parseId(competitionIdValue, "competition");
  return db.withTransaction(async (connection) => {
    const competition = await tournamentRepository.getTournamentByIdWithConnection(
      competitionId,
      connection
    );
    if (!competition) throw competitionNotFound();

    const rows = await readinessRepository.listForCompetition(competitionId, connection);
    return {
      competitionId,
      participants: rows.map((row) => response(competitionId, row.participant_id, row))
    };
  });
}

module.exports = { checkIn, getReadiness, listReadiness };
