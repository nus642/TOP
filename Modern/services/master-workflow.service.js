const matchOperationsService = require("./match-operations.service");
const courtCoordinationService = require("./court-coordination.service");
const dispatchService = require("./dispatch.service");
const refereeCoordinationService = require("./referee-coordination.service");

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

// Atomic dispatch: Master submits matchId + courtId + refereeId + expectedVersion + correlationId
// Returns waiting_acceptance status until referee accepts.
function dispatchReferee(competitionValue, matchValue, data, actor) {
  const competitionId = positiveId(competitionValue, "competition id");
  const matchId = positiveId(matchValue, "match id");

  return dispatchService.dispatch(competitionId, matchId, {
    courtId: refereeId(data.courtId),
    refereeId: refereeId(data.refereeId),
    correlationId: data.correlationId
  }, actor);
}

// Withdraw dispatch: Master can withdraw a waiting_acceptance dispatch
function withdrawDispatch(competitionValue, matchValue, actor, data = {}) {
  const competitionId = positiveId(competitionValue, "competition id");
  const matchId = positiveId(matchValue, "match id");

  return dispatchService.withdrawDispatch(competitionId, matchId, actor, data);
}

// Reassign dispatch: Master can reassign to a different referee while waiting
function reassignDispatch(competitionValue, matchValue, newRefereeId, actor, data = {}) {
  const competitionId = positiveId(competitionValue, "competition id");
  const matchId = positiveId(matchValue, "match id");

  return dispatchService.reassignDispatch(competitionId, matchId, refereeId(newRefereeId), actor, data);
}

// Backend-authoritative candidates query
function listDispatchCandidates(competitionValue, matchValue, actor) {
  const competitionId = positiveId(competitionValue, "competition id");
  const matchId = positiveId(matchValue, "match id");

  return refereeCoordinationService.listAvailableCandidates(competitionId, matchId, actor);
}

function confirmResult(competitionValue, matchValue, actor) {
  const competitionId = positiveId(competitionValue, "competition id");
  const matchId = positiveId(matchValue, "match id");
  return matchOperationsService.confirmResult(competitionId, matchId, actor);
}

function reportCourtCondition(competitionId, courtId, actor, data) {
  return courtCoordinationService.reportCondition(competitionId, courtId, actor, data);
}

function deferCourtDisruption(competitionId, courtId, actor, data) {
  return courtCoordinationService.deferDisruption(competitionId, courtId, actor, data);
}

module.exports = { 
  assignReferee, 
  dispatchReferee,
  withdrawDispatch,
  reassignDispatch,
  listDispatchCandidates,
  confirmResult, 
  reportCourtCondition, 
  deferCourtDisruption 
};
