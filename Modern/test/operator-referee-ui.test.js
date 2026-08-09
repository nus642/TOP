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
  await api.accept(3, "referee/7", 9);
  await api.recordScore(3, "referee/7", 9, { score1: 11, score2: 8 });
  await api.confirm(3, "referee/7", 9);
  assert.deepEqual(calls, [
    ["/api/match-operations/3/referees/referee%2F7/matches", "GET", undefined],
    ["/api/referee-workflow/3/referees/referee%2F7/matches/9/accept", "POST", "{}"],
    ["/api/referee-workflow/3/referees/referee%2F7/matches/9/score", "POST", '{"score1":11,"score2":8}'],
    ["/api/referee-workflow/3/referees/referee%2F7/matches/9/confirm", "POST", "{}"]
  ]);
});

test("thin workflow delegates actions and refreshes authoritative matches", async () => {
  const calls = [];
  const api = {
    assignedMatches: async (...args) => { calls.push(["list", ...args]); return { matches: [{ id: 9, status: "scored" }] }; },
    accept: async (...args) => calls.push(["accept", ...args]),
    recordScore: async (...args) => calls.push(["score", ...args]),
    confirm: async (...args) => calls.push(["confirm", ...args])
  };
  const rendered = [];
  const view = { loading() {}, busy() {}, error: assert.fail, matches: (matches) => rendered.push(matches) };
  const workflow = createRefereeWorkflow({ api, view });
  await workflow.start({ tournamentId: 3, refereeId: "referee-7" });
  await workflow.run({ type: "score", matchId: 9, score: { score1: 11, score2: 8 } });
  await workflow.run({ type: "confirm", matchId: 9 });
  assert.deepEqual(calls, [
    ["list", 3, "referee-7"], ["score", 3, "referee-7", 9, { score1: 11, score2: 8 }],
    ["list", 3, "referee-7"], ["confirm", 3, "referee-7", 9], ["list", 3, "referee-7"]
  ]);
  assert.equal(rendered.length, 3);
});

test("API errors are exposed without inventing local workflow state", async () => {
  const fetchImpl = async () => ({ ok: false, json: async () => ({ error: "Match is not scored" }) });
  await assert.rejects(createRefereeApi({ fetchImpl }).confirm(3, "referee-7", 9), /Match is not scored/);
});
