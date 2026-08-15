const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const matchOperationsService = require("../services/match-operations.service");
const dispatchService = require("../services/dispatch.service");
const courtRepository = require("../repositories/court-coordination.repository");
const masterWorkflowService = require("../services/master-workflow.service");
const router = require("../api/master-workflow");

function assignRoute() {
  return router.stack.find((layer) =>
    layer.route?.path === "/:competitionId/matches/:matchId/assign"
  ).route.stack[0].handle;
}

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; }
  };
}

test("master assignment delegates once to the authoritative dispatch service", async (t) => {
  const origDispatch = dispatchService.dispatch;
  const origCourt = courtRepository.findScheduledCourt;
  t.after(() => { dispatchService.dispatch = origDispatch; courtRepository.findScheduledCourt = origCourt; });

  const calls = [];
  courtRepository.findScheduledCourt = async () => "court-1";
  dispatchService.dispatch = async (...args) => {
    calls.push(args);
    return { match: { id: 9, tournamentId: 3, refereeId: "referee-7", status: "assigned" } };
  };

  const actor = { actorId: "master-1", actorType: "master" };
  const result = await masterWorkflowService.assignReferee("3", "9", {
    refereeId: " referee-7 "
  }, actor);

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 3); // competitionId
  assert.equal(calls[0][1], 9); // matchId
  assert.equal(calls[0][2].refereeId, "referee-7");
  assert.equal(calls[0][2].courtId, "court-1");
  assert.equal(result.match.refereeId, "referee-7");
  assert.equal(result.match.status, "assigned");
});

test("master service validates its request boundary before delegation", async (t) => {
  const origDispatch = dispatchService.dispatch;
  t.after(() => { dispatchService.dispatch = origDispatch; });
  dispatchService.dispatch = async () => assert.fail("must not delegate invalid input");

  const invalidRequests = [
    ["bad", 9, { refereeId: "referee-7" }],
    [3, 0, { refereeId: "referee-7" }],
    [3, 9, {}],
    [3, 9, { refereeId: "  " }]
  ];
  for (const request of invalidRequests) {
    await assert.rejects(
      Promise.resolve().then(() => masterWorkflowService.assignReferee(...request)),
      (error) => error.code === "VALIDATION_ERROR"
    );
  }
});

test("master assignment API maps validation, missing match, and delegated errors", async (t) => {
  const original = masterWorkflowService.assignReferee;
  t.after(() => { masterWorkflowService.assignReferee = original; });
  const handler = assignRoute();

  const cases = [
    ["VALIDATION_ERROR", 400],
    ["NOT_FOUND", 404],
    ["DATABASE_ERROR", 500]
  ];
  for (const [code, status] of cases) {
    masterWorkflowService.assignReferee = async () => {
      const error = new Error(`delegated ${code}`);
      error.code = code;
      throw error;
    };
    const res = response();
    await handler({ params: { competitionId: "3", matchId: "9" }, body: { refereeId: "r7" } }, res);
    assert.equal(res.statusCode, status);
    assert.deepEqual(res.payload, { error: `delegated ${code}` });
  }
});

test("master workflow has no repository or persistence authority", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "services", "master-workflow.service.js"),
    "utf8"
  );
  assert.match(source, /dispatchService\.dispatch/);
  assert.doesNotMatch(source, /database\/db|UPDATE\s+matches/i);

  const schema = fs.readFileSync(path.join(__dirname, "..", "db.sql"), "utf8");
  assert.doesNotMatch(schema, /CREATE TABLE\s+(master_actions|master_assignments|operational_tasks|workflow_events)/i);
});
