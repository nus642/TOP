const { OperationsError } = require("./operations-error");

const STATES = Object.freeze({
  IDLE: "idle",
  UPCOMING: "upcoming",
  ASSIGNED: "assigned", // Referee dispatched / assigned; awaiting acceptance or responsibility.
  ACCEPTED: "accepted", // The assigned Referee acknowledged responsibility.
  PLAYING: "playing", // Match execution is in progress.
  INTERRUPTED: "interrupted", // The assigned Referee explicitly paused execution.
  SCORED: "scored", // The score is captured but is not official yet.
  CONFIRMED: "confirmed", // The assigned Referee officially confirmed the result.
  FINISHED: "finished" // The existing Match lifecycle is completed.
});

function required(value, field) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new OperationsError("INVALID_MATCH_OPERATION", `${field} is required`);
  }
  return value;
}

class MatchOperation {
  constructor(record) {
    if (!record || typeof record !== "object") {
      throw new OperationsError("INVALID_MATCH_OPERATION", "Match operation record is required");
    }
    this.id = required(record.id, "matchId");
    this.tournamentId = required(record.tournamentId, "tournamentId");
    this.refereeId = record.refereeId || null;
    this.status = record.status || STATES.IDLE;
    this.score1 = record.score1 ?? null;
    this.score2 = record.score2 ?? null;
    this.dispatchId = record.dispatchId || null;
    this.dispatchVersion = record.dispatchVersion ?? null;
  }

  assign(refereeId) {
    required(refereeId, "refereeId");
    if (![STATES.IDLE, STATES.UPCOMING].includes(this.status)) {
      throw new OperationsError("INVALID_OPERATION_STATE", "Only an idle match can be assigned");
    }
    this.refereeId = refereeId;
    this.status = STATES.ASSIGNED;
    return this;
  }

  // Dispatch a match to a referee. The match enters assigned status with dispatch tracking.
  dispatch(refereeId, dispatchId, expectedVersion) {
    required(refereeId, "refereeId");
    required(dispatchId, "dispatchId");
    if (![STATES.IDLE, STATES.UPCOMING, STATES.ASSIGNED].includes(this.status)) {
      throw new OperationsError("INVALID_OPERATION_STATE", "Only idle/upcoming/assigned matches can be dispatched");
    }
    if (this.dispatchId && this.dispatchId !== dispatchId) {
      throw new OperationsError("DISPATCH_CONFLICT", "Match already has an active dispatch");
    }
    this.refereeId = refereeId;
    this.dispatchId = dispatchId;
    this.dispatchVersion = expectedVersion;
    this.status = STATES.ASSIGNED;
    return this;
  }

  // Accept a dispatched assignment. Only the assigned referee can accept.
  acceptDispatch(refereeId, expectedVersion) {
    this.assertAssignedReferee(refereeId);
    if (this.status !== STATES.ASSIGNED || !this.dispatchId) {
      throw new OperationsError("INVALID_OPERATION_STATE", "Match is not awaiting referee acceptance");
    }
    if (this.dispatchVersion !== expectedVersion) {
      throw new OperationsError("STALE_DISPATCH_VERSION", "Dispatch version mismatch");
    }
    this.status = STATES.ACCEPTED;
    return this;
  }

  // Withdraw a dispatched assignment. Match returns to upcoming status.
  withdrawDispatch() {
    if (this.status !== STATES.ASSIGNED || !this.dispatchId) {
      throw new OperationsError("INVALID_OPERATION_STATE", "Only dispatched matches awaiting acceptance can be withdrawn");
    }
    this.refereeId = null;
    this.dispatchId = null;
    this.dispatchVersion = null;
    this.status = STATES.UPCOMING;
    return this;
  }

  // Reassign a dispatched assignment to a different referee.
  reassignDispatch(newRefereeId, newDispatchId, expectedVersion) {
    required(newRefereeId, "newRefereeId");
    required(newDispatchId, "newDispatchId");
    if (this.status !== STATES.ASSIGNED || !this.dispatchId) {
      throw new OperationsError("INVALID_OPERATION_STATE", "Only dispatched matches awaiting acceptance can be reassigned");
    }
    if (this.dispatchVersion !== expectedVersion) {
      throw new OperationsError("STALE_DISPATCH_VERSION", "Dispatch version mismatch");
    }
    this.refereeId = newRefereeId;
    this.dispatchId = newDispatchId;
    this.dispatchVersion = expectedVersion + 1;
    return this;
  }

  acceptResponsibility(refereeId) {
    this.assertAssignedReferee(refereeId);
    if (this.status !== STATES.ASSIGNED) {
      throw new OperationsError("INVALID_OPERATION_STATE", "Assigned responsibility is not awaiting acceptance");
    }
    if (this.dispatchId) {
      throw new OperationsError("INVALID_OPERATION_STATE", "Dispatched matches must use acceptDispatch with version verification");
    }
    this.status = STATES.ACCEPTED;
    return this;
  }

  start(refereeId, participantReadiness) {
    this.assertAssignedReferee(refereeId);
    if (this.status !== STATES.ACCEPTED) {
      throw new OperationsError("INVALID_OPERATION_STATE", "Accepted referee responsibility is required before starting");
    }
    if (!Array.isArray(participantReadiness) || participantReadiness.length === 0) {
      throw new OperationsError("MATCH_PARTICIPANTS_REQUIRED", "Match participants are required before starting");
    }
    const blockers = participantReadiness.filter((participant) => participant.state !== "ready");
    if (blockers.length > 0) {
      throw new OperationsError(
        "PARTICIPANTS_NOT_READY",
        `Participants not ready: ${blockers.map((participant) => participant.participantId).join(", ")}`
      );
    }
    this.status = STATES.PLAYING;
    return this;
  }

  submitResult(actor, score1, score2) {
    this.assertActor(actor, "referee");
    this.assertAssignedReferee(actor.actorId);
    if (this.status !== STATES.PLAYING) {
      throw new OperationsError("INVALID_OPERATION_STATE", "Score can only be recorded during assigned execution");
    }
    if (![score1, score2].every((score) => Number.isInteger(score) && score >= 0) || score1 === score2) {
      throw new OperationsError("INVALID_SCORE", "Scores must be non-negative integers and identify a result");
    }
    this.score1 = score1;
    this.score2 = score2;
    // A captured score is not yet an officially confirmed result.
    this.status = STATES.SCORED;
    return this;
  }

  interrupt(actor) {
    this.assertActor(actor, "referee");
    this.assertAssignedReferee(actor.actorId);
    if (this.status !== STATES.PLAYING) {
      throw new OperationsError("INVALID_OPERATION_STATE", "Only a playing match can be interrupted");
    }
    this.status = STATES.INTERRUPTED;
    return this;
  }

  resume(actor) {
    this.assertActor(actor, "referee");
    this.assertAssignedReferee(actor.actorId);
    if (this.status !== STATES.INTERRUPTED) {
      throw new OperationsError("INVALID_OPERATION_STATE", "Only an interrupted match can be resumed");
    }
    this.status = STATES.PLAYING;
    return this;
  }

  confirmResult(actor) {
    this.assertActor(actor, "master");
    if (this.status !== STATES.SCORED) {
      throw new OperationsError("INVALID_OPERATION_STATE", "A recorded result is required before confirmation");
    }
    this.status = STATES.CONFIRMED;
    return this;
  }

  // Compatibility for callers that record an in-progress score directly in the
  // domain. New workflow boundaries use submitResult with authenticated context.
  recordScore(refereeId, score1, score2) {
    return this.submitResult({ actorId: refereeId, actorType: "referee" }, score1, score2);
  }

  confirm(actorId) {
    return this.confirmResult({ actorId, actorType: "master" });
  }

  assertActor(actor, expectedType) {
    if (!actor || actor.actorType !== expectedType ||
        actor.actorId === undefined || actor.actorId === null || String(actor.actorId).trim() === "") {
      throw new OperationsError(
        "INVALID_OPERATION_ACTOR",
        `Only a ${expectedType} may perform this match operation`
      );
    }
  }

  assertAssignedReferee(refereeId) {
    required(refereeId, "refereeId");
    if (String(this.refereeId) !== String(refereeId)) {
      throw new OperationsError("REFEREE_RESPONSIBILITY_MISMATCH", "Only the assigned Referee may perform this match work");
    }
  }
}

module.exports = { MatchOperation, MATCH_OPERATION_STATES: STATES };
