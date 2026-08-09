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
  return matchOperationsService.recordScore(tournamentId, matchId, {
    ...data,
    refereeId: refereeId(refereeValue)
  });
}

function confirmResult(tournamentId, refereeValue, matchId, data = {}) {
  return matchOperationsService.confirmResult(tournamentId, matchId, {
    ...data,
    refereeId: refereeId(refereeValue)
  });
}

module.exports = { acceptMatch, recordScore, confirmResult };
