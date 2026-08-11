const matchOperationsService = require("./match-operations.service");

// This module provides referee operational access while Match Operations
// remains the authority for match execution.
function refereeId(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    const error = new Error("Valid referee id is required");
    error.code = "VALIDATION_ERROR";
    throw error;
  }
  return String(value).trim();
}

function acceptMatch(tournamentId, refereeValue, matchId) {
  return matchOperationsService.acceptRefereeResponsibility(tournamentId, matchId, {
    refereeId: refereeId(refereeValue)
  });
}

function recordScore(tournamentId, refereeValue, matchId, data = {}) {
  const actorId = refereeId(refereeValue);
  return matchOperationsService.submitResult(
    tournamentId, matchId, { actorId, actorType: "referee" }, data
  );
}

function startMatch(tournamentId, refereeValue, matchId) {
  return matchOperationsService.startMatch(tournamentId, matchId, {
    refereeId: refereeId(refereeValue)
  });
}

module.exports = { acceptMatch, startMatch, recordScore };
