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

function positiveId(value, name) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw validationError(`Valid ${name} is required`);
  }
  return id;
}

function requireMaster(actor) {
  if (actor?.actorType !== "master") {
    throw validationError("Only a master may perform dispatch operations");
  }
  return actor.actorId;
}

function requireReferee(actor) {
  if (actor?.actorType !== "referee") {
    throw validationError("Only a referee may accept a dispatch");
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
    
    // 4. Verify referee is eligible
    const rosterEntry = await competitionRefereeRepository.findByReferee(competitionId, refereeId, connection);
    if (!rosterEntry) {
      throw validationError("Referee is not in the competition roster");
    }
    if (!rosterEntry.active || !rosterEntry.eligible) {
      throw validationError("Referee is not eligible for dispatch");
    }
    
    // Check for duplicate correlationId (idempotency)
    const existingReservation = await competitionRefereeRepository.findByCorrelationId(dispatchCorrelationId, connection);
    if (existingReservation) {
      // Return existing reservation without creating duplicate chronology
      return {
        match: record,
        reservation: existingReservation,
        idempotent: true
      };
    }
    
    // 5. Create dispatch reservation
    const dispatchId = randomUUID();
    const expectedVersion = record.dispatchVersion ? Number(record.dispatchVersion) : 0;
    
    const reservation = await competitionRefereeRepository.createReservation(dispatchId, {
      matchId,
      courtId,
      refereeId,
      expectedVersion,
      correlationId: dispatchCorrelationId
    }, connection);
    
    // 6. Update match to waiting_acceptance
    const updatedMatch = await repository.dispatch(competitionId, matchId, {
      dispatchId,
      dispatchVersion: expectedVersion + 1,
      refereeId
    }, connection);
    
    // 7. Write chronology event
    await courtRepository.appendEvent({
      tournamentId: competitionId,
      courtId,
      matchId,
      eventType: "referee_dispatch",
      sourceType: "master_dispatch",
      actorId: masterId,
      correlationId: dispatchCorrelationId,
      details: { dispatchId, refereeId, expectedVersion: expectedVersion + 1 }
    }, connection);
    
    // Court runtime condition remains available during waiting_acceptance
    // (no change to court_operating_conditions)
    
    return {
      match: updatedMatch,
      reservation,
      idempotent: false
    };
  });
}

async function acceptDispatch(competitionValue, matchValue, actor) {
  const competitionId = positiveId(competitionValue, "competition id");
  const matchId = positiveId(matchValue, "match id");
  
  const refereeId = requireReferee(actor);
  
  return db.withTransaction(async (connection) => {
    // Lock order: matches → referee_dispatch_reservations
    
    // 1. Lock match row
    const record = await repository.findById(competitionId, matchId, connection, true);
    if (!record) {
      const error = new Error("Match not found");
      error.code = "NOT_FOUND";
      throw error;
    }
    
    // Verify match is in waiting_acceptance status
    if (record.status !== "waiting_acceptance") {
      throw validationError(`Match cannot be accepted in status ${record.status}`);
    }
    
    // Verify this referee is the assigned referee
    if (record.refereeId !== refereeId) {
      throw validationError("Only the assigned referee may accept this dispatch");
    }
    
    // 2. Lock and update reservation
    const reservation = await competitionRefereeRepository.findByMatch(matchId, connection);
    if (!reservation) {
      throw validationError("No active dispatch reservation found");
    }
    
    if (reservation.refereeId !== refereeId) {
      throw validationError("Referee does not match dispatch reservation");
    }
    
    if (reservation.acceptedAt || reservation.rejectedAt) {
      throw validationError("Dispatch has already been resolved");
    }
    
    await competitionRefereeRepository.markAccepted(reservation.dispatchId, refereeId, connection);
    
    // 3. Update match to accepted
    const updatedMatch = await repository.acceptDispatch(competitionId, matchId, reservation.dispatchId, connection);
    
    // 4. Write chronology event
    await courtRepository.appendEvent({
      tournamentId: competitionId,
      courtId: reservation.courtId,
      matchId,
      eventType: "referee_acceptance",
      sourceType: "referee_acceptance",
      actorId: refereeId,
      correlationId: reservation.correlationId,
      details: { dispatchId: reservation.dispatchId }
    }, connection);
    
    // Court runtime condition remains available after acceptance
    // (no change to court_operating_conditions)
    
    return {
      match: updatedMatch,
      reservation: { ...reservation, acceptedAt: new Date().toISOString() }
    };
  });
}

async function withdrawDispatch(competitionValue, matchValue, actor, data = {}) {
  const competitionId = positiveId(competitionValue, "competition id");
  const matchId = positiveId(matchValue, "match id");
  
  const masterId = requireMaster(actor);
  const reason = data.reason || "withdrawn_by_master";
  
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
    
    // Verify match is in waiting_acceptance status
    if (record.status !== "waiting_acceptance") {
      throw validationError(`Match cannot be withdrawn in status ${record.status}`);
    }
    
    // 3. Update reservation
    const reservation = await competitionRefereeRepository.findByMatch(matchId, connection);
    if (!reservation) {
      throw validationError("No active dispatch reservation found");
    }
    
    await competitionRefereeRepository.markRejected(reservation.dispatchId, reservation.refereeId, reason, connection);
    
    // 4. Update match to upcoming (release court and referee reservations)
    const updatedMatch = await repository.withdrawDispatch(competitionId, matchId, connection);
    
    // 5. Write chronology event
    await courtRepository.appendEvent({
      tournamentId: competitionId,
      courtId: reservation.courtId,
      matchId,
      eventType: "referee_withdraw",
      sourceType: "master_dispatch",
      actorId: masterId,
      correlationId: reservation.correlationId,
      details: { dispatchId: reservation.dispatchId, reason }
    }, connection);
    
    // Court runtime condition remains available after withdraw
    // (no change to court_operating_conditions)
    
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
    
    // Verify match is in waiting_acceptance status
    if (record.status !== "waiting_acceptance") {
      throw validationError(`Match cannot be reassigned in status ${record.status}`);
    }
    
    // 3. Verify new referee is eligible
    const rosterEntry = await competitionRefereeRepository.findByReferee(competitionId, newRefereeId, connection);
    if (!rosterEntry) {
      throw validationError("New referee is not in the competition roster");
    }
    if (!rosterEntry.active || !rosterEntry.eligible) {
      throw validationError("New referee is not eligible for dispatch");
    }
    
    // 4. Update reservation
    const reservation = await competitionRefereeRepository.findByMatch(matchId, connection);
    if (!reservation) {
      throw validationError("No active dispatch reservation found");
    }
    
    const oldRefereeId = reservation.refereeId;
    await competitionRefereeRepository.markRejected(reservation.dispatchId, oldRefereeId, reason, connection);
    
    // 5. Create new reservation for reassignment
    const newDispatchId = randomUUID();
    const newCorrelationId = randomUUID();
    const expectedVersion = record.dispatchVersion ? Number(record.dispatchVersion) : 0;
    
    const newReservation = await competitionRefereeRepository.createReservation(newDispatchId, {
      matchId,
      courtId: reservation.courtId,
      refereeId: newRefereeId,
      expectedVersion: expectedVersion + 1,
      correlationId: newCorrelationId
    }, connection);
    
    // 6. Update match with new referee and dispatch version
    const updatedMatch = await repository.reassignDispatch(competitionId, matchId, newRefereeId, connection);
    
    // 7. Write chronology event
    await courtRepository.appendEvent({
      tournamentId: competitionId,
      courtId: reservation.courtId,
      matchId,
      eventType: "referee_reassign",
      sourceType: "master_dispatch",
      actorId: masterId,
      correlationId: newCorrelationId,
      details: { oldRefereeId, newRefereeId, dispatchId: newDispatchId, reason }
    }, connection);
    
    // Court runtime condition remains available after reassign
    // (no change to court_operating_conditions)
    
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