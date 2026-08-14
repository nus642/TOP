const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const matchRepository = require("../repositories/match-operation.repository");
const courtRepository = require("../repositories/court-coordination.repository");
const readinessRepository = require("../repositories/participant-readiness.repository");
const tournamentRepository = require("../repositories/tournament.repository");
const matchOperations = require("../services/match-operations.service");
const courtCoordination = require("../services/court-coordination.service");

function preserve(t, object, methods) {
  const originals = Object.fromEntries(methods.map((method) => [method, object[method]]));
  t.after(() => Object.assign(object, originals));
}

test("concurrent starts on one Court commit exactly one Match and one chronology event", async (t) => {
  preserve(t, db, ["withTransaction"]);
  preserve(t, tournamentRepository, ["getTournamentByIdForUpdate"]);
  preserve(t, matchRepository, ["findById", "start"]);
  preserve(t, readinessRepository, ["listForCompetition"]);
  preserve(t, courtRepository, [
    "findScheduledCourt", "lockCondition", "findPlayingMatch", "updateCondition", "appendEvent"
  ]);

  const matches = new Map([
    [11, { id: 11, tournamentId: 3, refereeId: "referee-1", status: "accepted", participantIds: [101, 102] }],
    [12, { id: 12, tournamentId: 3, refereeId: "referee-2", status: "accepted", participantIds: [103, 104] }]
  ]);
  let court = { tournamentId: 3, courtId: "court-1", condition: "available", version: 0 };
  const chronology = [];
  let transactionTail = Promise.resolve();

  // This transaction queue models the serialization supplied by the locked
  // Tournament/Court rows. It deliberately starts both service promises before
  // either mutation has completed.
  db.withTransaction = (work) => {
    const run = transactionTail.then(() => work({ transaction: true }));
    transactionTail = run.catch(() => undefined);
    return run;
  };
  tournamentRepository.getTournamentByIdForUpdate = async () => ({ id: 3, status: "running" });
  matchRepository.findById = async (_tournamentId, matchId) => ({ ...matches.get(Number(matchId)) });
  matchRepository.start = async (_tournamentId, matchId) => {
    const next = { ...matches.get(Number(matchId)), status: "playing" };
    matches.set(Number(matchId), next);
    return { ...next };
  };
  readinessRepository.listForCompetition = async () => [101, 102, 103, 104]
    .map((participantId) => ({ participant_id: participantId, checked_in: 1 }));
  courtRepository.findScheduledCourt = async () => "court-1";
  courtRepository.lockCondition = async () => ({ ...court });
  courtRepository.findPlayingMatch = async () => [...matches.values()].find((match) => match.status === "playing")?.id || null;
  courtRepository.updateCondition = async (data) => (court = { ...court, ...data, version: court.version + 1 });
  courtRepository.appendEvent = async (event) => { chronology.push(event); return chronology.length; };

  const results = await Promise.allSettled([
    matchOperations.startMatch(3, 11, { refereeId: "referee-1", correlationId: "start-11" }),
    matchOperations.startMatch(3, 12, { refereeId: "referee-2", correlationId: "start-12" })
  ]);

  assert.equal(results.filter(({ status }) => status === "fulfilled").length, 1);
  const rejection = results.find(({ status }) => status === "rejected").reason;
  assert.equal(rejection.code, "VALIDATION_ERROR");
  assert.match(rejection.message, /Court is not available/);
  assert.equal([...matches.values()].filter((match) => match.status === "playing").length, 1);
  assert.equal([...matches.values()].filter((match) => match.status === "accepted").length, 1);
  assert.equal(court.condition, "occupied");
  assert.equal(court.version, 1);
  assert.equal(chronology.length, 1);
  assert.equal(chronology[0].eventType, "match_started_court_occupied");
});

test("a stale Court report rolls back without condition, disruption, or chronology advancement", async (t) => {
  preserve(t, db, ["withTransaction"]);
  preserve(t, tournamentRepository, ["getTournamentByIdForUpdate"]);
  preserve(t, courtRepository, [
    "isKnownCourt", "lockCondition", "lockScheduledMatch", "findPlayingMatch",
    "lockOpenDisruption", "updateCondition", "createDisruption", "appendEvent"
  ]);

  const before = { tournamentId: 3, courtId: "court-1", condition: "available", version: 2 };
  let condition = { ...before };
  let disruptionWrites = 0;
  let chronologyWrites = 0;
  db.withTransaction = async (work) => {
    const snapshot = { ...condition };
    try {
      return await work({ transaction: true });
    } catch (error) {
      condition = snapshot;
      throw error;
    }
  };
  tournamentRepository.getTournamentByIdForUpdate = async () => ({ id: 3, status: "running" });
  courtRepository.isKnownCourt = async () => true;
  courtRepository.lockCondition = async () => ({ ...condition });
  courtRepository.lockScheduledMatch = async () => null;
  courtRepository.findPlayingMatch = async () => null;
  courtRepository.lockOpenDisruption = async () => null;
  courtRepository.updateCondition = async (data) => (condition = { ...condition, ...data, version: condition.version + 1 });
  courtRepository.createDisruption = async () => { disruptionWrites += 1; };
  courtRepository.appendEvent = async () => { chronologyWrites += 1; };

  await assert.rejects(
    courtCoordination.reportCondition(3, "court-1", { actorType: "master", actorId: "master-1" }, {
      condition: "constrained", expectedVersion: 1, correlationId: "stale-report"
    }),
    (error) => error.code === "VALIDATION_ERROR" && /Stale Court condition version/.test(error.message)
  );

  assert.deepEqual(condition, before);
  assert.equal(disruptionWrites, 0);
  assert.equal(chronologyWrites, 0);
});
