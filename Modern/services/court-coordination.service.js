const { randomUUID } = require("node:crypto");
const db = require("../database/db");
const repository = require("../repositories/court-coordination.repository");
const tournamentRepository = require("../repositories/tournament.repository");
const { assertCompetitionLifecycleEligible } = require("./competition-lifecycle-eligibility");

function error(message, code = "VALIDATION_ERROR") {
  const value = new Error(message); value.code = code; return value;
}
function positiveId(value, name) {
  const id = Number(value); if (!Number.isInteger(id) || id <= 0) throw error(`Valid ${name} is required`); return id;
}
function actorId(actor, type) {
  if (!actor || actor.actorType !== type || !String(actor.actorId || "").trim()) {
    throw error(`Only a ${type} may perform this operation`);
  }
  return String(actor.actorId).trim();
}
function courtId(value) {
  const id = String(value || "").trim(); if (!id) throw error("Valid court id is required"); return id;
}
function expected(actual, supplied, name) {
  if (!Number.isInteger(Number(supplied)) || Number(supplied) !== actual) throw error(`Stale ${name} version`);
}
function optionalMatchId(value) {
  if (value === undefined || value === null || value === "") return null;
  return positiveId(value, "affected match id");
}
async function lockTournament(tournamentId, connection) {
  const tournament = await tournamentRepository.getTournamentByIdForUpdate(tournamentId, connection);
  if (!tournament) throw error("Competition not found", "NOT_FOUND");
  assertCompetitionLifecycleEligible(tournament.status, "matchStart");
}

function reportCondition(tournamentValue, courtValue, actor, data = {}) {
  const tournamentId = positiveId(tournamentValue, "competition id");
  const court = courtId(courtValue); const masterId = actorId(actor, "master");
  const affectedMatchId = optionalMatchId(data.affectedMatchId);
  if (!["available", "constrained", "uncertain"].includes(data.condition)) throw error("Master may report only available, constrained, or uncertain");
  const correlationId = String(data.correlationId || randomUUID());
  return db.withTransaction(async (connection) => {
    await lockTournament(tournamentId, connection);
    if (!await repository.isKnownCourt(tournamentId, court, connection)) throw error("Court is not known to the Tournament schedule", "NOT_FOUND");
    let condition = await repository.lockCondition(tournamentId, court, connection);
    expected(condition.version, data.expectedVersion, "Court condition");
    let matchContext = null;
    if (affectedMatchId) {
      matchContext = await repository.lockScheduledMatch(tournamentId, court, affectedMatchId, connection);
      if (!matchContext) throw error("Affected Match is not scheduled on this Court", "NOT_FOUND");
    }
    const activeMatchId = matchContext?.status === "playing"
      ? affectedMatchId
      : await repository.findPlayingMatch(tournamentId, court, connection);
    const matchId = affectedMatchId || activeMatchId;
    if (data.condition === "available" && activeMatchId) throw error("Court cannot be available while a Match is playing");
    let disruption = await repository.lockOpenDisruption(tournamentId, court, connection);
    condition = await repository.updateCondition({ tournamentId, courtId: court, condition: data.condition,
      sourceType: "master_report", sourceReference: correlationId, actorId: masterId }, connection);
    if (data.condition === "available" && disruption) {
      disruption = await repository.recoverDisruption(disruption.id, masterId, connection);
    } else if (data.condition !== "available" && !disruption) {
      disruption = await repository.createDisruption({ tournamentId, courtId: court,
        affectedMatchId: matchId, condition: data.condition, actorId: masterId }, connection);
    }
    await repository.appendEvent({ tournamentId, courtId: court, matchId,
      eventType: data.condition === "available" ? "court_recovered" : "court_condition_reported",
      sourceType: "master_report", actorId: masterId, correlationId,
      courtVersion: condition.version, disruptionVersion: disruption?.version }, connection);
    return { courtCondition: condition, disruption };
  });
}

function deferDisruption(tournamentValue, courtValue, actor, data = {}) {
  const tournamentId = positiveId(tournamentValue, "competition id");
  const court = courtId(courtValue); const masterId = actorId(actor, "master");
  const correlationId = String(data.correlationId || randomUUID());
  return db.withTransaction(async (connection) => {
    await lockTournament(tournamentId, connection);
    if (!await repository.isKnownCourt(tournamentId, court, connection)) throw error("Court is not known to the Tournament schedule", "NOT_FOUND");
    const condition = await repository.lockCondition(tournamentId, court, connection);
    const current = await repository.lockOpenDisruption(tournamentId, court, connection);
    if (!current) throw error("Open Court disruption not found", "NOT_FOUND");
    expected(current.version, data.expectedVersion, "Court disruption");
    const disruption = await repository.updateDisruption(current.id, "deferred", masterId, connection);
    await repository.appendEvent({ tournamentId, courtId: court, matchId: disruption.affectedMatchId,
      eventType: "court_disruption_deferred", sourceType: "master_coordination", actorId: masterId,
      correlationId, courtVersion: condition.version,
      disruptionVersion: disruption.version }, connection);
    return { courtCondition: condition, disruption };
  });
}

module.exports = { reportCondition, deferDisruption };
