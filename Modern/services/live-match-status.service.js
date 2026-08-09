const repository = require("../repositories/live-match-status.repository");

function validationError(message) {
  const error = new Error(message);
  error.code = "VALIDATION_ERROR";
  return error;
}

async function getLiveMatchStatus(value) {
  const competitionId = Number(value);
  if (!Number.isInteger(competitionId) || competitionId <= 0) {
    throw validationError("Valid competition id is required");
  }

  const projection = await repository.findByCompetitionId(competitionId);
  return { competitionId, ...projection };
}

module.exports = { getLiveMatchStatus };
