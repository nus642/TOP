const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { createPublicScoreboardApi } = require("../public/api-client");
const { createScoreboardWorkflow, renderScoreboard } = require("../public/scoreboard");

test("public UI API client targets the existing scoreboard endpoint", async () => {
  const calls = [];
  const api = createPublicScoreboardApi({ fetchImpl: async (url, options) => {
    calls.push([url, options]);
    return { ok: true, json: async () => ({ competitionId: 7, matches: [] }) };
  }});
  await api.matches("summer/7");
  assert.deepEqual(calls, [["/api/public/competitions/summer%2F7/matches", undefined]]);
});

test("workflow loads and renders the backend scoreboard snapshot", async () => {
  const snapshot = { competitionId: 7, matches: [{ matchId: 4, roundNumber: 2, courtId: "court-1", scheduledAt: "2026-08-09T10:00:00Z", status: "playing", score: { sideOne: 11, sideTwo: 9 }, confirmed: true }] };
  const calls = [];
  const rendered = [];
  const workflow = createScoreboardWorkflow({
    api: { matches: async (id) => { calls.push(id); return snapshot; } },
    view: { loading() {}, error: assert.fail, scoreboard: (data) => rendered.push(renderScoreboard(data)) }
  });
  await workflow.load(7);
  assert.deepEqual(calls, [7]);
  assert.match(rendered[0], /Round 2/);
  assert.match(rendered[0], /Court 1/);
  assert.match(rendered[0], /11[\s\S]*9/);
  assert.match(rendered[0], /Result confirmed/);
});

test("renderer never displays internal operational fields", () => {
  const html = renderScoreboard({ matches: [{ matchId: 4, status: "playing", score: {}, confirmed: false, refereeId: "secret-referee", assignedAt: "secret-time", responsibilityState: "secret-state", evidenceReference: "secret-evidence" }] });
  assert.doesNotMatch(html, /secret-|referee|evidence|responsibility|assigned/i);
});

test("public UI introduces no persistence or backend authority", () => {
  const directory = path.join(__dirname, "..", "public");
  const source = fs.readdirSync(directory).map((file) => fs.readFileSync(path.join(directory, file), "utf8")).join("\n");
  assert.doesNotMatch(source, /\b(localStorage|sessionStorage|indexedDB|WebSocket)\b/);
  assert.doesNotMatch(source, /\b(POST|PUT|PATCH|DELETE|INSERT|UPDATE|CREATE TABLE)\b/);
  assert.doesNotMatch(source, /refereeId|assignmentTimestamp|responsibilityState|evidenceReference/);
});
