const assert = require("node:assert/strict");
const test = require("node:test");

const matchOperationsService = require("../services/match-operations.service");
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

test("referee actions delegate to Match Operations with the route referee identity", async (t) => {
  assert.throws(
    () => refereeWorkflowService.acceptMatch(3, "  ", 9),
    (error) => error.code === "VALIDATION_ERROR"
  );

  const originals = {
    accept: matchOperationsService.acceptRefereeResponsibility,
    start: matchOperationsService.startMatch,
    score: matchOperationsService.recordScore,
    confirm: matchOperationsService.confirmResult
  };
  t.after(() => {
    matchOperationsService.acceptRefereeResponsibility = originals.accept;
    matchOperationsService.startMatch = originals.start;
    matchOperationsService.recordScore = originals.score;
    matchOperationsService.confirmResult = originals.confirm;
  });

  const calls = [];
  matchOperationsService.acceptRefereeResponsibility = async (...args) => { calls.push(["accept", ...args]); return { match: { status: "accepted" } }; };
  matchOperationsService.startMatch = async (...args) => { calls.push(["start", ...args]); return { match: { status: "playing" } }; };
  matchOperationsService.recordScore = async (...args) => { calls.push(["score", ...args]); return { match: { status: "scored" } }; };
  matchOperationsService.confirmResult = async (...args) => { calls.push(["confirm", ...args]); return { match: { status: "confirmed" }, officialRecord: { id: 1 } }; };

  await refereeWorkflowService.acceptMatch("3", " referee-7 ", "9");
  await refereeWorkflowService.startMatch("3", "referee-7", "9");
  await refereeWorkflowService.recordScore("3", "referee-7", "9", { refereeId: "spoofed", score1: 11, score2: 8 });
  const confirmed = await refereeWorkflowService.confirmResult("3", "referee-7", "9", { evidenceReference: "scorecard://9" });

  assert.deepEqual(calls, [
    ["accept", "3", "9", { refereeId: "referee-7" }],
    ["start", "3", "9", { refereeId: "referee-7" }],
    ["score", "3", "9", { refereeId: "referee-7", score1: 11, score2: 8 }],
    ["confirm", "3", "9", { evidenceReference: "scorecard://9", refereeId: "referee-7" }]
  ]);
  assert.equal(confirmed.officialRecord.id, 1);
});

test("referee action API exposes accept, score, and confirm entry points", async (t) => {
  const originals = {
    accept: refereeWorkflowService.acceptMatch,
    start: refereeWorkflowService.startMatch,
    score: refereeWorkflowService.recordScore,
    confirm: refereeWorkflowService.confirmResult
  };
  t.after(() => Object.assign(refereeWorkflowService, originals));

  const calls = [];
  refereeWorkflowService.acceptMatch = async (...args) => { calls.push(args); return { action: "accepted" }; };
  refereeWorkflowService.startMatch = async (...args) => { calls.push(args); return { action: "started" }; };
  refereeWorkflowService.recordScore = async (...args) => { calls.push(args); return { action: "scored" }; };
  refereeWorkflowService.confirmResult = async (...args) => { calls.push(args); return { action: "confirmed" }; };

  const paths = [
    ["/:tournamentId/referees/:refereeId/matches/:matchId/accept", {}],
    ["/:tournamentId/referees/:refereeId/matches/:matchId/start", {}],
    ["/:tournamentId/referees/:refereeId/matches/:matchId/score", { score1: 11, score2: 8 }],
    ["/:tournamentId/referees/:refereeId/matches/:matchId/confirm", { evidenceReference: "scorecard://9" }]
  ];
  for (const [path, body] of paths) {
    const res = response();
    await route(path)({
      params: { tournamentId: "3", refereeId: "referee-7", matchId: "9" },
      actor: { actorId: "referee-7" },
      body
    }, res);
    assert.equal(res.statusCode, 200);
  }
  assert.deepEqual(calls, paths.map(([, body]) => ["3", "referee-7", "9", body]));
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
