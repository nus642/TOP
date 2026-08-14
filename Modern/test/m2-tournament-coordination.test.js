const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { MatchOperation, MATCH_OPERATION_STATES } = require("../engine/operations/domain");
const courtService = require("../services/court-coordination.service");
const masterRouter = require("../api/master-workflow");
const refereeRouter = require("../api/referee-workflow");

function playingMatch(overrides = {}) {
  return new MatchOperation({
    id: 17,
    tournamentId: 4,
    refereeId: "referee-7",
    status: "playing",
    ...overrides
  });
}

test("only the assigned Referee can interrupt and explicitly resume execution", () => {
  const match = playingMatch();
  assert.throws(
    () => match.interrupt({ actorType: "referee", actorId: "referee-8" }),
    (error) => error.code === "REFEREE_RESPONSIBILITY_MISMATCH"
  );
  match.interrupt({ actorType: "referee", actorId: "referee-7" });
  assert.equal(match.status, MATCH_OPERATION_STATES.INTERRUPTED);
  assert.throws(
    () => match.resume({ actorType: "master", actorId: "master-1" }),
    (error) => error.code === "INVALID_OPERATION_ACTOR"
  );
  match.resume({ actorType: "referee", actorId: "referee-7" });
  assert.equal(match.status, MATCH_OPERATION_STATES.PLAYING);
});

test("Master Court reporting rejects unauthorized actors and occupied input before persistence", () => {
  assert.throws(
    () => courtService.reportCondition(4, "court-1", { actorType: "referee", actorId: "referee-7" }, {
      condition: "constrained", expectedVersion: 0
    }),
    (error) => error.code === "VALIDATION_ERROR" && /Only a master/.test(error.message)
  );
  assert.throws(
    () => courtService.reportCondition(4, "court-1", { actorType: "master", actorId: "master-1" }, {
      condition: "occupied", expectedVersion: 0
    }),
    (error) => error.code === "VALIDATION_ERROR" && /only available, constrained, or uncertain/i.test(error.message)
  );
});

test("M2 authenticated routes expose only the bounded coordination operations", () => {
  const masterPaths = masterRouter.stack.map((layer) => layer.route?.path).filter(Boolean);
  const refereePaths = refereeRouter.stack.map((layer) => layer.route?.path).filter(Boolean);
  assert.ok(masterPaths.includes("/:competitionId/courts/:courtId/condition"));
  assert.ok(masterPaths.includes("/:competitionId/courts/:courtId/defer"));
  assert.ok(refereePaths.includes("/:tournamentId/referees/:refereeId/matches/:matchId/interrupt"));
  assert.ok(refereePaths.includes("/:tournamentId/referees/:refereeId/matches/:matchId/resume"));
  assert.equal(masterPaths.some((route) => /reassign|move/.test(route)), false);
});

test("M2 schema is additive and preserves separate Court, disruption, chronology, and Official Result truth", () => {
  const sql = fs.readFileSync(path.join(__dirname, "..", "db.sql"), "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS court_operating_conditions/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS court_disruptions/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS tournament_coordination_chronology/);
  assert.match(sql, /UNIQUE KEY uq_coordination_correlation/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS match_official_records/);
  assert.match(sql, /migration_match_execution/);
});

test("resolving a disruption preserves recovery attribution", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "repositories", "court-coordination.repository.js"), "utf8"
  );
  const resolveBody = source.slice(source.indexOf("async function resolveDisruption"), source.indexOf("async function recoverDisruption"));
  assert.match(resolveBody, /resolved_at/);
  assert.doesNotMatch(resolveBody, /recovered_by|recovered_at/);
});
