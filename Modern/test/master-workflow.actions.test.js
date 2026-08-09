const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const matchOperationsService = require("../services/match-operations.service");
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

test("master assignment delegates once to Match Operations", async (t) => {
  const original = matchOperationsService.assignMatch;
  t.after(() => { matchOperationsService.assignMatch = original; });

  const calls = [];
  matchOperationsService.assignMatch = async (...args) => {
    calls.push(args);
    return { match: { id: 9, tournamentId: 3, refereeId: "referee-7", status: "assigned" } };
  };

  const result = await masterWorkflowService.assignReferee("3", "9", {
    refereeId: " referee-7 "
  });

  assert.deepEqual(calls, [[3, 9, { refereeId: "referee-7" }]]);
  assert.equal(result.match.refereeId, "referee-7");
  assert.equal(result.match.status, "assigned");
});

test("master service validates its request boundary before delegation", async (t) => {
  const original = matchOperationsService.assignMatch;
  t.after(() => { matchOperationsService.assignMatch = original; });
  matchOperationsService.assignMatch = async () => assert.fail("must not delegate invalid input");

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
  assert.match(source, /matchOperationsService\.assignMatch/);
  assert.doesNotMatch(source, /repositories|database\/db|UPDATE\s+matches/i);

  const schema = fs.readFileSync(path.join(__dirname, "..", "db.sql"), "utf8");
  assert.doesNotMatch(schema, /CREATE TABLE\s+(master_actions|master_assignments|operational_tasks|workflow_events)/i);
});
