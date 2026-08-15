const matchOperationsService = require("./match-operations.service");
const dispatchService = require("./dispatch.service");

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

// Accept: unified authority through dispatch service.
// Handles both dispatch-tracked and simple assign acceptance.
function acceptMatch(tournamentId, refereeValue, matchId) {
  const actor = refereeActor(refereeValue);
  return dispatchService.acceptDispatch(tournamentId, matchId, actor);
}

// Accept dispatch: same authority as acceptMatch (unified)
function acceptDispatch(tournamentId, refereeValue, matchId) {
  const actor = refereeActor(refereeValue);
  return dispatchService.acceptDispatch(tournamentId, matchId, actor);
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

function interruptMatch(tournamentId, refereeValue, matchId, data = {}) {
  return matchOperationsService.interruptMatch(tournamentId, matchId, refereeActor(refereeValue), data);
}

function resumeMatch(tournamentId, refereeValue, matchId, data = {}) {
  return matchOperationsService.resumeMatch(tournamentId, matchId, refereeActor(refereeValue), data);
}

module.exports = { acceptMatch, acceptDispatch, startMatch, recordScore, interruptMatch, resumeMatch };
