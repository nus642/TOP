const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repository = require("../repositories/master-operational-visibility.repository");
const service = require("../services/master-operational-visibility.service");
const router = require("../api/master-operational-visibility");

function route() {
  return router.stack.find((layer) => layer.route?.path === "/:competitionId/matches")
    .route.stack[0].handle;
}

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; }
  };
}

test("persistence defines a read-only projection over existing authority tables", () => {
  const schema = fs.readFileSync(path.join(__dirname, "..", "db.sql"), "utf8");
  const view = schema.slice(schema.indexOf("CREATE OR REPLACE VIEW master_operational_match_overview"));
  assert.match(view, /JOIN tournaments/);
  assert.match(view, /LEFT JOIN match_schedules/);
  assert.doesNotMatch(view, /CREATE TABLE[^;]*master_operational/i);
});

test("repository queries schedule, court, referee, and status visibility from the projection", async () => {
  const connection = {
    async query(sql, values) {
      assert.match(sql, /FROM master_operational_match_overview/);
      assert.match(sql, /court_id = \?/);
      assert.match(sql, /operation_status = \?/);
      assert.deepEqual(values, [7, "court-2", "playing"]);
      return [[{
        competition_id: 7,
        competition_status: "active",
        match_id: 42,
        round_number: 3,
        team1_name: "Alpha",
        team2_name: "Bravo",
        scheduled_at: new Date("2026-09-12T10:30:00Z"),
        court_id: "court-2",
        referee_id: "referee-4",
        operation_status: "playing",
        assigned_at: null,
        responsibility_accepted_at: null,
        result_confirmed_at: null
      }]];
    }
  };

  const matches = await repository.findMatchOverview(7, {
    courtId: "court-2", status: "playing"
  }, connection);
  assert.deepEqual(matches[0].schedule, {
    scheduledAt: "2026-09-12T10:30:00.000Z", courtId: "court-2"
  });
  assert.deepEqual(matches[0].referee, {
    refereeId: "referee-4", assignedAt: null, responsibilityAcceptedAt: null
  });
  assert.equal(matches[0].operationStatus, "playing");
});

test("API provides the master operational overview without a write route", async (t) => {
  const original = repository.findMatchOverview;
  t.after(() => { repository.findMatchOverview = original; });
  repository.findMatchOverview = async (competitionId, filters) => [{
    competitionId, matchId: 42, schedule: { courtId: filters.courtId },
    referee: { refereeId: "referee-4" }, operationStatus: filters.status
  }];

  assert.equal(router.stack.filter((layer) => layer.route).length, 1);
  assert.deepEqual(Object.keys(router.stack.find((layer) => layer.route).route.methods), ["get"]);

  const res = response();
  await route()({
    params: { competitionId: "7" },
    query: { courtId: "court-2", status: "playing" }
  }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.matches[0].referee.refereeId, "referee-4");
  assert.equal(res.payload.matches[0].schedule.courtId, "court-2");
  assert.equal(res.payload.matches[0].operationStatus, "playing");
});

test("service rejects invalid scope and status before querying persistence", async (t) => {
  const original = repository.findMatchOverview;
  t.after(() => { repository.findMatchOverview = original; });
  repository.findMatchOverview = async () => { throw new Error("must not query"); };

  await assert.rejects(service.getMatchOperationalOverview("bad"),
    (error) => error.code === "VALIDATION_ERROR");
  await assert.rejects(service.getMatchOperationalOverview(7, { status: "new-state" }),
    (error) => error.code === "VALIDATION_ERROR");
});
