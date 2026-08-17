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

test("public UI replaces backend English errors with safe Chinese messages", async () => {
  const api = createPublicScoreboardApi({ fetchImpl: async () => ({
    ok: false, status: 404, json: async () => ({ error: "Competition not found" })
  }) });
  await assert.rejects(api.matches(404), (error) => {
    assert.equal(error.message, "未找到该比赛。");
    assert.doesNotMatch(error.message, /Competition not found/);
    return true;
  });
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
  assert.match(rendered[0], /第 2 轮/);
  assert.match(rendered[0], /场地 1/);
  assert.match(rendered[0], /11[\s\S]*9/);
  assert.match(rendered[0], /赛果已确认/);
});

test("public scoreboard presents all static user-visible copy in Simplified Chinese", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /公开记分牌/);
  assert.doesNotMatch(html, />\s*(Match scoreboard|Public scoreboard|View matches|Refresh)\b/);
});

test("renderer never displays internal operational fields", () => {
  const html = renderScoreboard({ matches: [{ matchId: 4, status: "playing", score: {}, confirmed: false, refereeId: "secret-referee", assignedAt: "secret-time", responsibilityState: "secret-state", evidenceReference: "secret-evidence" }] });
  assert.doesNotMatch(html, /secret-|referee|evidence|responsibility|assigned/i);
});

test("idle and upcoming statuses render in Chinese without changing confirmation meaning", () => {
  const html = renderScoreboard({ matches: [
    { matchId: 1, status: "idle", score: {}, confirmed: false },
    { matchId: 2, status: "upcoming", score: {}, confirmed: true }
  ] });
  assert.match(html, /等待中/);
  assert.match(html, /即将开始/);
  assert.match(html, /等待确认/);
  assert.match(html, /赛果已确认/);
  assert.doesNotMatch(html, />idle<|>upcoming</);
});

test("unknown public status values fall back without exposing internal English", () => {
  const html = renderScoreboard({ matches: [{ matchId: 3, status: "internal_delayed", score: {}, confirmed: false }] });
  assert.match(html, /状态待定/);
  assert.doesNotMatch(html, /internal_delayed/);
});

test("public UI introduces no persistence or backend authority", () => {
  const directory = path.join(__dirname, "..", "public");
  // Explicit allowlist: dev-login.html is a development-only authentication
  // boundary (gitignored, never deployed). Any other new file in public/
  // must still pass the no-persistence / no-backend-authority guard.
  const devOnlyFiles = new Set(["dev-login.html"]);
  const source = fs.readdirSync(directory)
    .filter((file) => !devOnlyFiles.has(file))
    .map((file) => fs.readFileSync(path.join(directory, file), "utf8")).join("\n");
  assert.doesNotMatch(source, /\b(localStorage|sessionStorage|indexedDB|WebSocket)\b/);
  assert.doesNotMatch(source, /\b(POST|PUT|PATCH|DELETE|INSERT|UPDATE|CREATE TABLE)\b/);
  assert.doesNotMatch(source, /refereeId|assignmentTimestamp|responsibilityState|evidenceReference/);
});
