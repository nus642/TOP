const matchOperationsService = require("./match-operations.service");

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

function refereeId(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw validationError("Valid referee id is required");
  }
  return String(value).trim();
}

// Master workflow is an operational entry point only. Match Operations owns
// assignment rules, match state transitions, and persistence.
function assignReferee(competitionValue, matchValue, data = {}) {
  const competitionId = positiveId(competitionValue, "competition id");
  const matchId = positiveId(matchValue, "match id");

  return matchOperationsService.assignMatch(competitionId, matchId, {
    refereeId: refereeId(data.refereeId)
  });
}

function confirmResult(competitionValue, matchValue, actor) {
  const competitionId = positiveId(competitionValue, "competition id");
  const matchId = positiveId(matchValue, "match id");
  return matchOperationsService.confirmResult(competitionId, matchId, actor);
}

module.exports = { assignReferee, confirmResult };
