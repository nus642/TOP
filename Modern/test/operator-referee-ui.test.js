const assert = require("node:assert/strict");
const test = require("node:test");
const { createRefereeApi } = require("../operator/api-client");
const { createRefereeWorkflow } = require("../operator/referee-workflow");

test("operator API client targets only existing referee workflow boundaries", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push([url, options.method || "GET", options.body]);
    return { ok: true, json: async () => ({ matches: [] }) };
  };
  const api = createRefereeApi({ fetchImpl, baseUrl: "/api" });
  await api.assignedMatches(3, "referee/7");
  await api.accept(3, "referee/7", 9, 2);
  await api.start(3, "referee/7", 9);
  await api.interrupt(3, "referee/7", 9);
  await api.resume(3, "referee/7", 9);
  await api.recordScore(3, "referee/7", 9, { score1: 11, score2: 8 });
  // The accept body carries a timestamped correlationId, so compare its parsed fields.
  const [acceptUrl, acceptMethod, acceptBody] = calls[1];
  const acceptPayload = JSON.parse(acceptBody);
  assert.equal(acceptUrl, "/api/referee-workflow/3/referees/referee%2F7/matches/9/accept");
  assert.equal(acceptMethod, "POST");
  assert.equal(acceptPayload.expectedVersion, 2);
  assert.equal(typeof acceptPayload.correlationId, "string");
  assert.deepEqual([calls[0], ...calls.slice(2)], [
    ["/api/match-operations/3/referees/referee%2F7/matches", "GET", undefined],
    ["/api/referee-workflow/3/referees/referee%2F7/matches/9/start", "POST", "{}"],
    ["/api/referee-workflow/3/referees/referee%2F7/matches/9/interrupt", "POST", "{}"],
    ["/api/referee-workflow/3/referees/referee%2F7/matches/9/resume", "POST", "{}"],
    ["/api/referee-workflow/3/referees/referee%2F7/matches/9/score", "POST", '{"score1":11,"score2":8}']
  ]);
});

test("thin workflow delegates actions and refreshes authoritative matches", async () => {
  const calls = [];
  const api = {
    assignedMatches: async (...args) => { calls.push(["list", ...args]); return { matches: [{ id: 9, status: "scored" }] }; },
    accept: async (...args) => calls.push(["accept", ...args]),
    recordScore: async (...args) => calls.push(["score", ...args])
  };
  const rendered = [];
  const view = { loading() {}, busy() {}, error: assert.fail, matches: (matches) => rendered.push(matches) };
  const workflow = createRefereeWorkflow({ api, view });
  await workflow.start({ tournamentId: 3, refereeId: "referee-7" });
  await workflow.run({ type: "accept", matchId: 9, dispatchVersion: 2 });
  await workflow.run({ type: "score", matchId: 9, score: { score1: 11, score2: 8 } });
  assert.deepEqual(calls, [
    ["list", 3, "referee-7"], ["accept", 3, "referee-7", 9, 2], ["list", 3, "referee-7"],
    ["score", 3, "referee-7", 9, { score1: 11, score2: 8 }],
    ["list", 3, "referee-7"]
  ]);
  assert.equal(rendered.length, 3);
});

test("API errors are exposed without inventing local workflow state", async () => {
  const fetchImpl = async () => ({ ok: false, status: 409, json: async () => ({ error: "Match is not scored" }) });
  await assert.rejects(
    createRefereeApi({ fetchImpl }).recordScore(3, "referee-7", 9, { score1: 11, score2: 8 }),
    (error) => error.message === "Match is not scored" && error.statusCode === 409
  );
});

test("score snapshot targets the dedicated PUT endpoint and aborts superseded writes", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push([url, options.method, options.body, options.signal]);
    return { ok: true, json: async () => ({}) };
  };
  const api = createRefereeApi({ fetchImpl, baseUrl: "/api" });
  await api.scoreSnapshot(3, "referee-7", 9, { score1: 7, score2: 5 });
  await api.scoreSnapshot(3, "referee-7", 9, { score1: 8, score2: 5 });
  assert.equal(calls[0][0], "/api/referee-workflow/3/referees/referee-7/matches/9/score-snapshot");
  assert.equal(calls[0][1], "PUT");
  assert.equal(calls[0][2], '{"score1":7,"score2":5}');
  // The newer snapshot aborts the in-flight older one (M2 ED-04 polling lifecycle).
  assert.equal(calls[0][3].aborted, true);
  assert.equal(calls[1][3].aborted, false);
});

test("score snapshot treats AbortError as a superseded write, not a failure", async () => {
  const fetchImpl = async () => {
    const error = new Error("The operation was aborted");
    error.name = "AbortError";
    throw error;
  };
  const result = await createRefereeApi({ fetchImpl }).scoreSnapshot(3, "referee-7", 9, { score1: 1, score2: 0 });
  assert.equal(result, null);
});

test("referee workflow delegates explicit start, interrupt, and resume without local advancement", async () => {
  const calls = [];
  const api = {
    assignedMatches: async () => ({ matches: [] }),
    start: async (...args) => calls.push(["start", ...args]),
    interrupt: async (...args) => calls.push(["interrupt", ...args]),
    resume: async (...args) => calls.push(["resume", ...args])
  };
  const workflow = createRefereeWorkflow({ api, view: {
    loading() {}, busy() {}, error: assert.fail, matches() {}
  } });
  await workflow.start({ tournamentId: 3, refereeId: "referee-7" });
  await workflow.run({ type: "start", matchId: 9 });
  await workflow.run({ type: "interrupt", matchId: 9 });
  await workflow.run({ type: "resume", matchId: 9 });
  assert.deepEqual(calls, [
    ["start", 3, "referee-7", 9],
    ["interrupt", 3, "referee-7", 9],
    ["resume", 3, "referee-7", 9]
  ]);
});
