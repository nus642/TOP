const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const { createCompetitionArchiveApi } = require("../archive/api-client");
const { createArchiveWorkflow, renderArchive } = require("../archive/archive");

test("archive API client uses the existing public archive endpoint", async () => {
  const calls = [];
  const api = createCompetitionArchiveApi({ fetchImpl: async (url, options) => {
    calls.push([url, options]);
    return { ok: true, json: async () => ({ competitionId: 7, standings: [], matches: [] }) };
  }});
  await api.archive("summer/7");
  assert.deepEqual(calls, [["/api/public/competitions/summer%2F7/archive", undefined]]);
});

test("archive UI replaces backend English errors with safe Chinese messages", async () => {
  const api = createCompetitionArchiveApi({ fetchImpl: async () => ({
    ok: false, status: 400, json: async () => ({ error: "Invalid competition id" })
  }) });
  await assert.rejects(api.archive("bad"), (error) => {
    assert.equal(error.message, "比赛编号无效，请检查后重试。");
    assert.doesNotMatch(error.message, /Invalid competition id/);
    return true;
  });
});

test("archive workflow loads and renders the backend projection", async () => {
  const snapshot = { competitionId: 7, competitionStatus: "completed", standings: [{ participantId: 3, wins: 4, losses: 1, scoreDifference: 9 }], matches: [{ matchId: 12, roundNumber: 3, status: "confirmed", score: { sideOne: 11, sideTwo: 8 }, confirmed: true }] };
  const loaded = [];
  const workflow = createArchiveWorkflow({
    api: { archive: async (id) => { loaded.push(id); return snapshot; } },
    view: { loading() {}, error: assert.fail, archive(data) { loaded.push(renderArchive(data)); } }
  });
  await workflow.load(7);
  assert.equal(loaded[0], 7);
  assert.match(loaded[1].summary, /比赛 7[\s\S]*已结束/);
  assert.match(loaded[1].standings, /选手 3[\s\S]*4[\s\S]*1[\s\S]*\+9/);
  assert.match(loaded[1].results, /比赛 12[\s\S]*11[\s\S]*8/);
});

test("archive renderer presents every competition lifecycle status in Chinese", () => {
  const lifecycleStatuses = [
    ["draft", "草稿"],
    ["registration_open", "报名开放"],
    ["ready", "准备就绪"],
    ["running", "进行中"],
    ["completed", "已结束"],
    ["archived", "已归档"]
  ];

  for (const [status, expectedLabel] of lifecycleStatuses) {
    const rendered = renderArchive({ competitionId: 7, competitionStatus: status, standings: [], matches: [] });
    assert.match(rendered.summary, new RegExp(expectedLabel), status);
    assert.doesNotMatch(rendered.summary, new RegExp(status, "i"), status);
  }
});

test("archive renderer presents unknown competition lifecycle statuses with a Chinese fallback", () => {
  const rendered = renderArchive({ competitionId: 7, competitionStatus: "DRAFT", standings: [], matches: [] });
  assert.match(rendered.summary, /未知状态/);
  assert.doesNotMatch(rendered.summary, /DRAFT/);
});

test("archive loads the shared lifecycle mapping as browser scripts", () => {
  const context = vm.createContext({ window: {} });
  for (const file of ["presentation/competition-lifecycle-status.js", "archive/archive.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", file), "utf8"), context);
  }
  const draft = context.window.CompetitionArchive.renderArchive({
    competitionId: 7, competitionStatus: "draft", standings: [], matches: []
  });
  const unknown = context.window.CompetitionArchive.renderArchive({
    competitionId: 8, competitionStatus: "DRAFT", standings: [], matches: []
  });
  assert.match(draft.summary, /草稿/);
  assert.match(unknown.summary, /未知状态/);
});

test("archive presents all static user-visible copy in Simplified Chinese", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "archive", "index.html"), "utf8");
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /赛事档案/);
  assert.match(html, /<script src="\/presentation\/competition-lifecycle-status\.js"><\/script>[\s\S]*<script src="\/archive\/archive\.js"><\/script>/);
  assert.doesNotMatch(html, />\s*(Competition|Official|Standings|Open archive|Final table)\b/);
});

test("archive renderer does not display internal fields", () => {
  const secrets = { refereeId: "secret-referee", evidenceReference: "secret-evidence", workflowState: "secret-workflow", internalId: "secret-id", assignedAt: "secret-date" };
  const rendered = renderArchive({ competitionId: 7, competitionStatus: "completed", standings: [{ participantId: 3, wins: 1, losses: 0, scoreDifference: 2, ...secrets }], matches: [{ matchId: 2, roundNumber: 1, status: "confirmed", score: { sideOne: 11, sideTwo: 5 }, ...secrets }], ...secrets });
  assert.doesNotMatch(Object.values(rendered).join(""), /secret-|referee|evidence|workflow|internal|assigned/i);
});

test("archive UI introduces no persistence or backend authority", () => {
  const directory = path.join(__dirname, "..", "archive");
  const source = fs.readdirSync(directory).map((file) => fs.readFileSync(path.join(directory, file), "utf8")).join("\n");
  assert.doesNotMatch(source, /\b(localStorage|sessionStorage|indexedDB|WebSocket)\b/);
  assert.doesNotMatch(source, /\b(POST|PUT|PATCH|DELETE|INSERT|UPDATE|CREATE TABLE)\b/);
  assert.doesNotMatch(source, /repositories|services|database\/|\.\.\/api\//);
});
