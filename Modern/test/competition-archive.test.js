const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repository = require("../repositories/competition-archive.repository");
const service = require("../services/competition-archive.service");
const router = require("../api/competition-archive");

function routeHandler() {
  return router.stack.find(layer => layer.route?.path === "/:competitionId/archive")
    .route.stack[0].handle;
}

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; }
  };
}

test("repository reads only authoritative archive facts", async () => {
  const statements = [];
  const connection = {
    async query(sql, values) {
      statements.push([sql, values]);
      if (sql.includes("FROM tournaments")) {
        return [[{ competition_id: 1, competition_status: "completed" }]];
      }
      if (sql.includes("FROM matches")) {
        return [[{ match_id: 10, round_number: 1, match_status: "confirmed", score1: 11, score2: 8 }]];
      }
      return [[{ participant_id: 1, wins: 3, losses: 0, score_difference: 12 }]];
    }
  };

  const result = await repository.findByCompetitionId(1, connection);
  assert.equal(result.competition.competition_status, "completed");
  assert.equal(result.matches.length, 1);
  assert.equal(result.standings.length, 1);
  assert.match(statements[1][0], /JOIN match_official_records mor/);
  assert.match(statements[1][0], /m\.status IN \('confirmed', 'finished'\)/);
  assert.match(statements[2][0], /FROM competition_standings/);
  assert.deepEqual(statements.map(([, values]) => values), [[1], [1, 1], [1]]);
});

test("service composes a completed competition archive without operational fields", async (t) => {
  const original = repository.findByCompetitionId;
  t.after(() => { repository.findByCompetitionId = original; });
  repository.findByCompetitionId = async () => ({
    competition: { competition_id: 1, competition_status: "completed", updated_at: "must-not-leak" },
    matches: [{
      match_id: 10,
      round_number: 1,
      match_status: "confirmed",
      score1: 11,
      score2: 8,
      referee_id: "must-not-leak",
      evidence_reference: "must-not-leak",
      result_confirmed_at: "must-not-leak"
    }],
    standings: [{
      participant_id: 1,
      wins: 3,
      losses: 0,
      score_difference: 12,
      updated_at: "must-not-leak"
    }]
  });

  const result = await service.getCompetitionArchive("1");
  assert.deepEqual(result, {
    competitionId: 1,
    competitionStatus: "completed",
    matches: [{
      matchId: 10,
      roundNumber: 1,
      status: "confirmed",
      score: { sideOne: 11, sideTwo: 8 },
      confirmed: true
    }],
    standings: [{ participantId: 1, wins: 3, losses: 0, scoreDifference: 12 }]
  });
  assert.doesNotMatch(JSON.stringify(result), /referee|evidence|confirmedAt|updatedAt/);
  await assert.rejects(service.getCompetitionArchive("invalid"),
    error => error.code === "VALIDATION_ERROR");
});

test("public archive endpoint returns the projection and maps invalid ids to 400", async (t) => {
  const original = service.getCompetitionArchive;
  t.after(() => { service.getCompetitionArchive = original; });
  const handler = routeHandler();

  service.getCompetitionArchive = async id => ({ competitionId: Number(id), matches: [], standings: [] });
  const ok = response();
  await handler({ params: { competitionId: "3" } }, ok);
  assert.deepEqual(ok.payload, { competitionId: 3, matches: [], standings: [] });

  service.getCompetitionArchive = async () => {
    const error = new Error("Valid competition id is required");
    error.code = "VALIDATION_ERROR";
    throw error;
  };
  const invalid = response();
  await handler({ params: { competitionId: "bad" } }, invalid);
  assert.equal(invalid.statusCode, 400);
});

test("competition archive introduces no persistence authority", () => {
  const files = [
    "repositories/competition-archive.repository.js",
    "services/competition-archive.service.js",
    "api/competition-archive.js"
  ];
  const source = files.map(file => fs.readFileSync(path.join(__dirname, "..", file), "utf8")).join("\n");
  assert.doesNotMatch(source, /\b(INSERT|UPDATE|DELETE|CREATE TABLE)\b/i);
  assert.doesNotMatch(source, /archive_(table|record)|historical_match|event_store/i);
});
