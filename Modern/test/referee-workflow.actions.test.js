const assert = require("node:assert/strict");
const test = require("node:test");

const matchOperationsService = require("../services/match-operations.service");
const dispatchService = require("../services/dispatch.service");
const refereeWorkflowService = require("../services/referee-workflow.service");
const router = require("../api/referee-workflow");

function route(path) {
  return router.stack.find((layer) => layer.route?.path === path && layer.route.methods.post)
    .route.stack[0].handle;
}

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; }
  };
}

test("referee actions delegate to the authoritative dispatch service with the route referee identity", async (t) => {
  assert.throws(
    () => refereeWorkflowService.acceptMatch(3, "  ", 9),
    (error) => error.code === "VALIDATION_ERROR"
  );

  const originals = {
    accept: dispatchService.acceptDispatch,
    start: matchOperationsService.startMatch,
    score: matchOperationsService.submitResult
  };
  t.after(() => {
    dispatchService.acceptDispatch = originals.accept;
    matchOperationsService.startMatch = originals.start;
    matchOperationsService.submitResult = originals.score;
  });

  const calls = [];
  dispatchService.acceptDispatch = async (...args) => { calls.push(["accept", ...args]); return { match: { status: "accepted" } }; };
  matchOperationsService.startMatch = async (...args) => { calls.push(["start", ...args]); return { match: { status: "playing" } }; };
  matchOperationsService.submitResult = async (...args) => { calls.push(["score", ...args]); return { match: { status: "scored" } }; };

  await refereeWorkflowService.acceptMatch("3", " referee-7 ", "9");
  await refereeWorkflowService.startMatch("3", "referee-7", "9");
  await refereeWorkflowService.recordScore("3", "referee-7", "9", { refereeId: "spoofed", score1: 11, score2: 8 });

  assert.equal(calls.length, 3);
  assert.equal(calls[0][0], "accept");
  assert.equal(calls[0][1], "3");
  assert.equal(calls[0][2], "9");
  assert.deepEqual(calls[0][3], { actorId: "referee-7", actorType: "referee" });
  assert.equal(calls[1][0], "start");
  assert.equal(calls[2][0], "score");
});

test("referee action API exposes accept and score submission entry points", async (t) => {
  const originals = {
    accept: refereeWorkflowService.acceptMatch,
    start: refereeWorkflowService.startMatch,
    score: refereeWorkflowService.recordScore
  };
  t.after(() => Object.assign(refereeWorkflowService, originals));

  const calls = [];
  refereeWorkflowService.acceptMatch = async (...args) => { calls.push(args); return { action: "accepted" }; };
  refereeWorkflowService.startMatch = async (...args) => { calls.push(args); return { action: "started" }; };
  refereeWorkflowService.recordScore = async (...args) => { calls.push(args); return { action: "scored" }; };

  const paths = [
    ["/:tournamentId/referees/:refereeId/matches/:matchId/accept", {}],
    ["/:tournamentId/referees/:refereeId/matches/:matchId/start", {}],
    ["/:tournamentId/referees/:refereeId/matches/:matchId/score", { score1: 11, score2: 8 }]
  ];
  for (const [path, body] of paths) {
    const res = response();
    await route(path)({
      params: { tournamentId: "3", refereeId: "referee-7", matchId: "9" },
      actor: { actorId: "referee-7", actorType: "referee" },
      body
    }, res);
    assert.equal(res.statusCode, 200);
  }
  assert.deepEqual(calls, paths.map(([, body]) => [
    "3", { actorId: "referee-7", actorType: "referee" }, "9", body
  ]));
});

test("referee workflow API maps delegated errors", async (t) => {
  const original = refereeWorkflowService.recordScore;
  t.after(() => { refereeWorkflowService.recordScore = original; });
  refereeWorkflowService.recordScore = async () => {
    const error = new Error("Match not found");
    error.code = "NOT_FOUND";
    throw error;
  };
  const res = response();
  await route("/:tournamentId/referees/:refereeId/matches/:matchId/score")({
    params: { tournamentId: "3", refereeId: "unassigned", matchId: "999" },
    actor: { actorId: "unassigned" },
    body: { score1: 11, score2: 8 }
  }, res);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.payload, { error: "Match not found" });
});
