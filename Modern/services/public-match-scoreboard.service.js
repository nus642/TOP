const repository = require("../repositories/public-match-scoreboard.repository");

function validationError(message) {
  const error = new Error(message);
  error.code = "VALIDATION_ERROR";
  return error;
}

function timestamp(value) {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toPublicMatch(row) {
  return {
    matchId: row.match_id,
    roundNumber: row.round_number,
    courtId: row.court_id,
    scheduledAt: timestamp(row.scheduled_at),
    status: row.match_status,
    score: {
      sideOne: row.score1,
      sideTwo: row.score2
    },
    confirmed: Boolean(row.has_official_record)
  };
}

async function getPublicMatches(value) {
  const competitionId = Number(value);
  if (!Number.isInteger(competitionId) || competitionId <= 0) {
    throw validationError("Valid competition id is required");
  }

  const rows = await repository.findByCompetitionId(competitionId);
  return { competitionId, matches: rows.map(toPublicMatch) };
}

module.exports = { getPublicMatches };
