const db = require("../database/db");
const repository = require("../repositories/match-operation.repository");
const competitionRefereeRepository = require("../repositories/competition-referee.repository");
const courtRepository = require("../repositories/court-coordination.repository");
const tournamentRepository = require("../repositories/tournament.repository");
const { randomUUID } = require("node:crypto");
const { assertCompetitionLifecycleEligible } = require("./competition-lifecycle-eligibility");

function validationError(message) {
  const error = new Error(message);
  error.code = "VALIDATION_ERROR";
  return error;
}

function forbiddenError(message) {
  const error = new Error(message);
  error.code = "FORBIDDEN";
  return error;
}

function positiveId(value, name) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw validationError(`Valid ${name} is required`);
  }
  return id;
}

function requireInteger(value, name) {
  if (value === undefined || value === null || !Number.isInteger(Number(value))) {
    throw validationError(`Valid ${name} is required`);
  }
  return Number(value);
}

function requireMaster(actor) {
  if (actor?.actorType !== "master") {
    throw forbiddenError("Only a master may perform dispatch operations");
  }
  return actor.actorId;
}

function requireReferee(actor) {
  if (actor?.actorType !== "referee") {
    throw forbiddenError("Only a referee may accept a dispatch");
  }
  return actor.actorId;
}

// Lock order rationale (stable lock ordering to prevent deadlocks):
// 1. tournaments - Competition row locked first (coarsest scope)
// 2. match_schedules - Court authorization facts
// 3. matches - Match state and dispatch fields
// 4. referee_dispatch_reservations - Dispatch reservations
// 5. competition_referees - Roster validation (read-only within transaction)
//
// This order ensures that when multiple transactions compete for the same
// resources (e.g., same court or same referee), they serialize in a
// predictable sequence, avoiding circular waits.

async function dispatch(competitionValue, matchValue, data, actor) {
  const competitionId = positiveId(competitionValue, "competition id");
  const matchId = positiveId(matchValue, "match id");
  const { courtId, refereeId, correlationId } = data;
  
  const masterId = requireMaster(actor);
  
  // expectedVersion is mandatory — missing or non-integer → 400
  const clientExpectedVersion = requireInteger(data.expectedVersion, "expectedVersion");
  
  if (!courtId || String(courtId).trim() === "") {
    throw validationError("Valid court id is required");
  }
  
  if (!refereeId || String(refereeId).trim() === "") {
    throw validationError("Valid referee id is required");
  }
  
  const dispatchCorrelationId = correlationId || randomUUID();
  
  return db.withTransaction(async (connection) => {
    // 1. Lock competition row
    const tournament = await tournamentRepository.getTournamentByIdForUpdate(competitionId, connection);
    if (!tournament) {
      const error = new Error("Competition not found");
      error.code = "NOT_FOUND";
      throw error;
    }
    assertCompetitionLifecycleEligible(tournament.status, "refereeAssignment");
    
    // 2. Verify court is authorized by match_schedules for this match
    const scheduledCourt = await courtRepository.findScheduledCourt(competitionId, matchId, connection);
    if (scheduledCourt !== courtId) {
      throw validationError("Court is not authorized for this match by schedule");
    }
    
    // 3. Lock match row
    const record = await repository.findById(competitionId, matchId, connection, true);
    if (!record) {
      const error = new Error("Match not found");
      error.code = "NOT_FOUND";
      throw error;
    }
    
    // Verify match is in a state that allows dispatch
    if (!["idle", "upcoming", "assigned"].includes(record.status)) {
      throw validationError(`Match cannot be dispatched in status ${record.status}`);
    }
    
    // 4. Check for duplicate correlationId (idempotency) — scoped by competition
    //    Must be checked BEFORE active reservation conflicts to allow idempotent retries.
    const existingReservation = await competitionRefereeRepository.findByCorrelationId(competitionId, dispatchCorrelationId, connection);
    if (existingReservation) {
      // Verify fingerprint: same match/court/referee
      if (existingReservation.matchId !== matchId || 
          String(existingReservation.courtId) !== String(courtId) ||
          String(existingReservation.refereeId) !== String(refereeId)) {
        const error = new Error("IDEMPOTENCY_FINGERPRINT_MISMATCH: CorrelationId exists but for different dispatch parameters");
        error.code = "CONFLICT";
        throw error;
      }
      // Return existing reservation without creating duplicate chronology
      return {
        match: record,
        reservation: existingReservation,
        idempotent: true
      };
    }
    
    // 5. Check active reservation conflicts (court & referee)
    const activeCourtReservation = await competitionRefereeRepository.findActiveReservationByCourt(courtId, competitionId, connection);
    if (activeCourtReservation && activeCourtReservation.matchId !== matchId) {
      const error = new Error(`COURT_CONFLICT: Court ${courtId} already has an active dispatch reservation for match ${activeCourtReservation.matchId}`);
      error.code = "CONFLICT";
      throw error;
    }
    
    const activeRefereeReservation = await competitionRefereeRepository.findActiveReservationByReferee(refereeId, competitionId, connection);
    if (activeRefereeReservation) {
      const error = new Error(`REFEREE_CONFLICT: Referee ${refereeId} already has an active dispatch reservation for match ${activeRefereeReservation.matchId}`);
      error.code = "CONFLICT";
      throw error;
    }
    
    // 6. Verify referee is eligible
    const rosterEntry = await competitionRefereeRepository.findByRefereeInRoster(competitionId, refereeId, connection);
    if (!rosterEntry) {
      throw validationError("Referee is not in the competition roster");
    }
    if (!rosterEntry.active || !rosterEntry.eligible) {
      throw validationError("Referee is not eligible for dispatch");
    }
    
    // 7. Explicit expectedVersion check: client must agree with current server state
    const currentVersion = record.dispatchVersion != null ? Number(record.dispatchVersion) : 0;
    if (clientExpectedVersion !== currentVersion) {
      const error = new Error("STALE_DISPATCH_VERSION: Dispatch version mismatch");
      error.code = "CONFLICT";
      throw error;
    }
    
    // 8. Create dispatch reservation
    const dispatchId = randomUUID();
    
    const reservation = await competitionRefereeRepository.createReservation(dispatchId, {
      matchId,
      courtId,
      refereeId,
      expectedVersion: currentVersion,
      correlationId: dispatchCorrelationId,
      competitionId
    }, connection);
    
    // 9. Update match to assigned with dispatch tracking
    const updatedMatch = await repository.dispatch(competitionId, matchId, {
      dispatchId,
      dispatchVersion: currentVersion + 1,
      refereeId
    }, connection);
    
    // 10. Write chronology event
    await courtRepository.appendEvent({
      tournamentId: competitionId,
      courtId,
      matchId,
      eventType: "referee_dispatch",
      sourceType: "master_dispatch",
      actorId: masterId,
      correlationId: dispatchCorrelationId,
      details: { dispatchId, refereeId, expectedVersion: currentVersion + 1 }
    }, connection);
    
    return {
      match: updatedMatch,
      reservation,
      idempotent: false
    };
  });
}

async function acceptDispatch(competitionValue, matchValue, actor, data = {}) {
  const competitionId = positiveId(competitionValue, "competition id");
  const matchId = positiveId(matchValue, "match id");
  
  const refereeId = requireReferee(actor);
  const clientExpectedVersion = requireInteger(data.expectedVersion, "expectedVersion");
  // Each action uses its own correlationId — never reuse the dispatch correlationId
  const acceptCorrelationId = data.correlationId || randomUUID();
  
  return db.withTransaction(async (connection) => {
    // Lock order: tournaments → matches → referee_dispatch_reservations
    
    // 1. Lock tournament row for lifecycle verification
    const tournament = await tournamentRepository.getTournamentByIdForUpdate(competitionId, connection);
    if (!tournament) {
      const error = new Error("Competition not found");
      error.code = "NOT_FOUND";
      throw error;
    }
    assertCompetitionLifecycleEligible(tournament.status, "responsibilityAcceptance");
    
    // 2. Lock match row
    const record = await repository.findById(competitionId, matchId, connection, true);
    if (!record) {
      const error = new Error("Match not found");
      error.code = "NOT_FOUND";
      throw error;
    }
    
    // Verify match is in assigned status
    if (record.status !== "assigned") {
      throw validationError(`Match cannot be accepted in status ${record.status}`);
    }
    
    // Verify this referee is the assigned referee
    if (record.refereeId !== refereeId) {
      throw validationError("Only the assigned referee may accept this dispatch");
    }
    
    // Explicit expectedVersion check
    const currentVersion = record.dispatchVersion != null ? Number(record.dispatchVersion) : 0;
    if (clientExpectedVersion !== currentVersion) {
      const error = new Error("STALE_DISPATCH_VERSION: Dispatch version mismatch");
      error.code = "CONFLICT";
      throw error;
    }
    
    // 3. Handle dispatch reservation if present
    const reservation = await competitionRefereeRepository.findByMatch(matchId, connection);
    
    if (reservation) {
      if (reservation.refereeId !== refereeId) {
        throw validationError("Referee does not match dispatch reservation");
      }
      
      if (reservation.acceptedAt || reservation.rejectedAt) {
        throw validationError("Dispatch has already been resolved");
      }
      
      await competitionRefereeRepository.markAccepted(reservation.dispatchId, refereeId, connection);
    }
    
    // 4. Update match to accepted
    let updatedMatch;
    if (reservation && reservation.dispatchId) {
      updatedMatch = await repository.acceptDispatch(competitionId, matchId, reservation.dispatchId, connection);
    } else {
      // Simple assign (no dispatch reservation) — use acceptResponsibility path
      updatedMatch = await repository.acceptResponsibility(competitionId, matchId, connection);
    }
    
    // 5. Write chronology event with a UNIQUE correlationId (never reuse dispatch correlationId)
    const courtId = reservation ? reservation.courtId : null;
    await courtRepository.appendEvent({
      tournamentId: competitionId,
      courtId: courtId || "unassigned",
      matchId,
      eventType: "referee_acceptance",
      sourceType: "referee_acceptance",
      actorId: refereeId,
      correlationId: acceptCorrelationId,
      details: { dispatchId: reservation ? reservation.dispatchId : null }
    }, connection);
    
    return {
      match: updatedMatch,
      reservation: reservation ? { ...reservation, acceptedAt: new Date().toISOString() } : null
    };
  });
}

async function withdrawDispatch(competitionValue, matchValue, actor, data = {}) {
  const competitionId = positiveId(competitionValue, "competition id");
  const matchId = positiveId(matchValue, "match id");
  
  const masterId = requireMaster(actor);
  const reason = data.reason || "withdrawn_by_master";
  const clientExpectedVersion = requireInteger(data.expectedVersion, "expectedVersion");
  // Each action uses its own correlationId — never reuse the dispatch correlationId
  const withdrawCorrelationId = data.correlationId || randomUUID();
  
  return db.withTransaction(async (connection) => {
    // Lock order: tournaments → matches → referee_dispatch_reservations
    
    // 1. Lock competition row
    const tournament = await tournamentRepository.getTournamentByIdForUpdate(competitionId, connection);
    if (!tournament) {
      const error = new Error("Competition not found");
      error.code = "NOT_FOUND";
      throw error;
    }
    assertCompetitionLifecycleEligible(tournament.status, "refereeAssignment");
    
    // 2. Lock match row
    const record = await repository.findById(competitionId, matchId, connection, true);
    if (!record) {
      const error = new Error("Match not found");
      error.code = "NOT_FOUND";
      throw error;
    }
    
    // Verify match is in assigned status with active dispatch
    if (record.status !== "assigned" || !record.dispatchId) {
      throw validationError(`Match cannot be withdrawn in status ${record.status}`);
    }
    
    // Explicit expectedVersion check
    const currentVersion = record.dispatchVersion != null ? Number(record.dispatchVersion) : 0;
    if (clientExpectedVersion !== currentVersion) {
      const error = new Error("STALE_DISPATCH_VERSION: Dispatch version mismatch");
      error.code = "CONFLICT";
      throw error;
    }
    
    // 3. Update reservation
    const reservation = await competitionRefereeRepository.findByMatch(matchId, connection);
    if (!reservation) {
      throw validationError("No active dispatch reservation found");
    }
    
    await competitionRefereeRepository.markRejected(reservation.dispatchId, reservation.refereeId, reason, connection);
    
    // 4. Update match to upcoming (release court and referee reservations)
    const updatedMatch = await repository.withdrawDispatch(competitionId, matchId, connection);
    
    // 5. Write chronology event with a UNIQUE correlationId
    await courtRepository.appendEvent({
      tournamentId: competitionId,
      courtId: reservation.courtId,
      matchId,
      eventType: "referee_withdraw",
      sourceType: "master_dispatch",
      actorId: masterId,
      correlationId: withdrawCorrelationId,
      details: { dispatchId: reservation.dispatchId, reason }
    }, connection);
    
    return {
      match: updatedMatch,
      reservation: { ...reservation, rejectedAt: new Date().toISOString(), rejectedReason: reason }
    };
  });
}

async function reassignDispatch(competitionValue, matchValue, newRefereeId, actor, data = {}) {
  const competitionId = positiveId(competitionValue, "competition id");
  const matchId = positiveId(matchValue, "match id");
  
  const masterId = requireMaster(actor);
  const reason = data.reason || "reassigned_by_master";
  const clientExpectedVersion = requireInteger(data.expectedVersion, "expectedVersion");
  const reassignCorrelationId = data.correlationId || randomUUID();
  
  if (!newRefereeId || String(newRefereeId).trim() === "") {
    throw validationError("Valid new referee id is required");
  }
  
  return db.withTransaction(async (connection) => {
    // Lock order: tournaments → matches → referee_dispatch_reservations → competition_referees
    
    // 1. Lock competition row
    const tournament = await tournamentRepository.getTournamentByIdForUpdate(competitionId, connection);
    if (!tournament) {
      const error = new Error("Competition not found");
      error.code = "NOT_FOUND";
      throw error;
    }
    assertCompetitionLifecycleEligible(tournament.status, "refereeAssignment");
    
    // 2. Lock match row
    const record = await repository.findById(competitionId, matchId, connection, true);
    if (!record) {
      const error = new Error("Match not found");
      error.code = "NOT_FOUND";
      throw error;
    }
    
    // Verify match is in assigned status with active dispatch
    if (record.status !== "assigned" || !record.dispatchId) {
      throw validationError(`Match cannot be reassigned in status ${record.status}`);
    }
    
    // Explicit expectedVersion check
    const currentVersion = record.dispatchVersion != null ? Number(record.dispatchVersion) : 0;
    if (clientExpectedVersion !== currentVersion) {
      const error = new Error("STALE_DISPATCH_VERSION: Dispatch version mismatch");
      error.code = "CONFLICT";
      throw error;
    }
    
    // 3. Verify new referee is eligible
    const rosterEntry = await competitionRefereeRepository.findByRefereeInRoster(competitionId, newRefereeId, connection);
    if (!rosterEntry) {
      throw validationError("New referee is not in the competition roster");
    }
    if (!rosterEntry.active || !rosterEntry.eligible) {
      throw validationError("New referee is not eligible for dispatch");
    }
    
    // 4. Check active reservation conflict for new referee
    const activeRefereeReservation = await competitionRefereeRepository.findActiveReservationByReferee(newRefereeId, competitionId, connection);
    if (activeRefereeReservation) {
      const error = new Error(`REFEREE_CONFLICT: Referee ${newRefereeId} already has an active dispatch reservation for match ${activeRefereeReservation.matchId}`);
      error.code = "CONFLICT";
      throw error;
    }
    
    // 5. Update reservation
    const reservation = await competitionRefereeRepository.findByMatch(matchId, connection);
    if (!reservation) {
      throw validationError("No active dispatch reservation found");
    }
    
    const oldRefereeId = reservation.refereeId;
    await competitionRefereeRepository.markRejected(reservation.dispatchId, oldRefereeId, reason, connection);
    
    // 6. Create new reservation for reassignment
    const newDispatchId = randomUUID();
    
    const newReservation = await competitionRefereeRepository.createReservation(newDispatchId, {
      matchId,
      courtId: reservation.courtId,
      refereeId: newRefereeId,
      expectedVersion: currentVersion + 1,
      correlationId: reassignCorrelationId,
      competitionId
    }, connection);
    
    // 7. Update match with new referee and dispatch version
    const updatedMatch = await repository.reassignDispatch(competitionId, matchId, newRefereeId, connection);
    
    // 8. Write chronology event
    await courtRepository.appendEvent({
      tournamentId: competitionId,
      courtId: reservation.courtId,
      matchId,
      eventType: "referee_reassign",
      sourceType: "master_dispatch",
      actorId: masterId,
      correlationId: reassignCorrelationId,
      details: { oldRefereeId, newRefereeId, dispatchId: newDispatchId, reason }
    }, connection);
    
    return {
      match: updatedMatch,
      reservation: newReservation
    };
  });
}

module.exports = {
  dispatch,
  acceptDispatch,
  withdrawDispatch,
  reassignDispatch
};