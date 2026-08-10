const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
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

test("archive workflow loads and renders the backend projection", async () => {
  const snapshot = { competitionId: 7, competitionStatus: "completed", standings: [{ participantId: 3, wins: 4, losses: 1, scoreDifference: 9 }], matches: [{ matchId: 12, roundNumber: 3, status: "confirmed", score: { sideOne: 11, sideTwo: 8 }, confirmed: true }] };
  const loaded = [];
  const workflow = createArchiveWorkflow({
    api: { archive: async (id) => { loaded.push(id); return snapshot; } },
    view: { loading() {}, error: assert.fail, archive(data) { loaded.push(renderArchive(data)); } }
  });
  await workflow.load(7);
  assert.equal(loaded[0], 7);
  assert.match(loaded[1].summary, /Competition 7[\s\S]*Completed/);
  assert.match(loaded[1].standings, /Participant 3[\s\S]*4[\s\S]*1[\s\S]*\+9/);
  assert.match(loaded[1].results, /Match 12[\s\S]*11[\s\S]*8/);
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
