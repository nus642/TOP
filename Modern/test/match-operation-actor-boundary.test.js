const assert = require("node:assert/strict");
const test = require("node:test");

const service = require("../services/match-operations.service");
const matchOperationsRouter = require("../api/match-operations");
const refereeWorkflowService = require("../services/referee-workflow.service");
const refereeWorkflowRouter = require("../api/referee-workflow");

function route(router, path, method) {
  return router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method])
    .route.stack[0].handle;
}

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; }
  };
}

test("score endpoint ignores spoofed body actor and uses the authenticated session actor", async (t) => {
  const original = service.submitResult;
  t.after(() => { service.submitResult = original; });
  let received;
  service.submitResult = async (...args) => {
    received = args;
    const error = new Error("Only a referee may perform this match operation");
    error.code = "VALIDATION_ERROR";
    throw error;
  };

  const res = response();
  await route(matchOperationsRouter, "/:tournamentId/matches/:matchId/score", "put")({
    params: { tournamentId: "3", matchId: "9" },
    actor: { actorId: "master-1", actorType: "master" },
    body: { actorId: "referee-7", actorType: "referee", refereeId: "referee-7", score1: 11, score2: 8 }
  }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(received, [
    "3", "9",
    { actorId: "master-1", actorType: "master" },
    { score1: 11, score2: 8 }
  ]);
});

test("confirmation endpoint ignores a spoofed Master in the request body", async (t) => {
  const original = service.confirmResult;
  t.after(() => { service.confirmResult = original; });
  let received;
  service.confirmResult = async (...args) => {
    received = args;
    const error = new Error("Only a master may perform this match operation");
    error.code = "VALIDATION_ERROR";
    throw error;
  };

  const res = response();
  await route(matchOperationsRouter, "/:tournamentId/matches/:matchId/result-confirmation", "post")({
    params: { tournamentId: "3", matchId: "9" },
    actor: { actorId: "referee-7", actorType: "referee" },
    body: { actorId: "master-1", actorType: "master" }
  }, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(received, ["3", "9", { actorId: "referee-7", actorType: "referee" }]);
});

test("referee workflow forwards session actor context instead of body identity", async (t) => {
  const original = refereeWorkflowService.recordScore;
  t.after(() => { refereeWorkflowService.recordScore = original; });
  let received;
  refereeWorkflowService.recordScore = async (...args) => {
    received = args;
    return { match: { status: "scored" } };
  };

  const res = response();
  await route(refereeWorkflowRouter, "/:tournamentId/referees/:refereeId/matches/:matchId/score", "post")({
    params: { tournamentId: "3", refereeId: "referee-7", matchId: "9" },
    actor: { actorId: "referee-7", actorType: "referee" },
    body: { actorId: "master-1", actorType: "master", score1: 11, score2: 8 }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(received, [
    "3", { actorId: "referee-7", actorType: "referee" }, "9",
    { score1: 11, score2: 8 }
  ]);
});
