const db = require("../database/db");
const playerRepository = require("../repositories/player.repository");
const readinessRepository = require("../repositories/participant-readiness.repository");
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

function notFound() {
  const error = new Error("Participant registration not found");
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

async function requireRegistration(competitionId, participantId, connection) {
  const registration = await playerRepository.getPlayerByIdForTournament(
    competitionId,
    participantId,
    connection
  );
  if (!registration) throw notFound();
}

async function checkIn(competitionIdValue, participantIdValue) {
  const competitionId = parseId(competitionIdValue, "competition");
  const participantId = parseId(participantIdValue, "participant");

  return db.withTransaction(async (connection) => {
    await requireRegistration(competitionId, participantId, connection);
    const row = await readinessRepository.markCheckedIn(
      competitionId,
      participantId,
      new Date(),
      connection
    );
    return response(competitionId, participantId, row);
  });
}

async function getReadiness(competitionIdValue, participantIdValue) {
  const competitionId = parseId(competitionIdValue, "competition");
  const participantId = parseId(participantIdValue, "participant");

  return db.withTransaction(async (connection) => {
    await requireRegistration(competitionId, participantId, connection);
    const row = await readinessRepository.find(competitionId, participantId, connection);
    return response(competitionId, participantId, row);
  });
}

async function listReadiness(competitionIdValue) {
  const competitionId = parseId(competitionIdValue, "competition");
  const rows = await readinessRepository.listForCompetition(competitionId);
  return {
    competitionId,
    participants: rows.map((row) => response(competitionId, row.participant_id, row))
  };
}

module.exports = { checkIn, getReadiness, listReadiness };
