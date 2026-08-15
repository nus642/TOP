const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { MatchOperation, MATCH_OPERATION_STATES } = require("../engine/operations/domain");
const courtService = require("../services/court-coordination.service");
const masterRouter = require("../api/master-workflow");
const refereeRouter = require("../api/referee-workflow");
const courtRepository = require("../repositories/court-coordination.repository");
const liveStatusRepository = require("../repositories/live-match-status.repository");

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
  // Issue #138 adds dispatch, withdraw, and reassign operations for Master
  assert.ok(masterPaths.includes("/:competitionId/matches/:matchId/dispatch"));
  assert.ok(masterPaths.includes("/:competitionId/matches/:matchId/withdraw"));
  assert.ok(masterPaths.includes("/:competitionId/matches/:matchId/reassign"));
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

test("a duplicate correlation is rejected as a governed conflict", async () => {
  const connection = {
    async query() {
      const duplicate = new Error("duplicate");
      duplicate.code = "ER_DUP_ENTRY";
      throw duplicate;
    }
  };
  await assert.rejects(
    courtRepository.appendEvent({
      tournamentId: 4, courtId: "court-1", matchId: 17,
      eventType: "court_condition_reported", sourceType: "master_report",
      actorId: "master-1", correlationId: "report-1"
    }, connection),
    (error) => error.code === "VALIDATION_ERROR" && /already been used/.test(error.message)
  );
});

test("the combined projection identifies the correct next responsible actor", async () => {
  const base = {
    competition_status: "running", round_number: 1, court_id: "court-1",
    scheduled_at: new Date("2026-08-14T10:00:00Z"), referee_id: "referee-7",
    responsibility_accepted_at: new Date(), score1: null, score2: null,
    has_official_record: 0, court_source_type: "master_report",
    court_source_reference: "report-1", court_actor_id: "master-1",
    court_effective_at: new Date("2026-08-14T10:15:00Z"), court_version: 2,
    disruption_id: 5, disruption_match_id: 17,
    disruption_disposition: "deferred", disruption_version: 1
  };
  const connection = { query: async () => [[{
    ...base, match_id: 17, match_status: "interrupted", court_condition: "constrained"
  }]] };
  let projection = await liveStatusRepository.findByCompetitionId(4, connection);
  assert.equal(projection.courts[0].nextResponsibleActor, "master");

  connection.query = async () => [[{
    ...base, match_id: 17, match_status: "interrupted", court_condition: "available"
  }]];
  projection = await liveStatusRepository.findByCompetitionId(4, connection);
  assert.equal(projection.courts[0].nextResponsibleActor, "referee");
});

test("M2 operator UI exposes the bounded Master and Referee recovery course", () => {
  const master = fs.readFileSync(path.join(__dirname, "..", "operator", "master-app.js"), "utf8");
  const referee = fs.readFileSync(path.join(__dirname, "..", "operator", "app.js"), "utf8");
  const masterHtml = fs.readFileSync(path.join(__dirname, "..", "operator", "master.html"), "utf8");
  assert.match(masterHtml, /场地协调/);
  assert.match(master, /提交可追溯报告/);
  assert.match(master, /记录延后协调/);
  assert.match(master, /等待裁判明确中断/);
  assert.match(referee, /data-action="start"/);
  assert.match(referee, /data-action="interrupt"/);
  assert.match(referee, /data-action="resume"/);
  assert.match(referee, /等待主控报告场地恢复/);
  assert.doesNotMatch(master + referee, /reassign|重新分配场地/i);
});
