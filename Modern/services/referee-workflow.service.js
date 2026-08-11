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

function refereeActor(value) {
  if (!value || typeof value !== "object") return { actorId: refereeId(value), actorType: "referee" };
  return value;
}

function acceptMatch(tournamentId, refereeValue, matchId) {
  const actor = refereeActor(refereeValue);
  return matchOperationsService.acceptRefereeResponsibility(tournamentId, matchId, {
    refereeId: refereeId(actor.actorId)
  });
}

function recordScore(tournamentId, refereeValue, matchId, data = {}) {
  const actor = refereeActor(refereeValue);
  return matchOperationsService.submitResult(
    tournamentId, matchId, actor, data
  );
}

function startMatch(tournamentId, refereeValue, matchId) {
  const actor = refereeActor(refereeValue);
  return matchOperationsService.startMatch(tournamentId, matchId, {
    refereeId: refereeId(actor.actorId)
  });
}

module.exports = { acceptMatch, startMatch, recordScore };
