const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repository = require("../repositories/public-match-scoreboard.repository");
const service = require("../services/public-match-scoreboard.service");
const router = require("../api/public-match-scoreboard");

function routeHandler() {
  return router.stack.find((layer) => layer.route?.path === "/:competitionId/matches")
    .route.stack[0].handle;
}

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; }
  };
}

test("repository reads authoritative scoreboard facts in spectator order", async () => {
  const connection = {
    async query(sql, values) {
      assert.match(sql, /FROM tournaments t/);
      assert.match(sql, /JOIN matches m/);
      assert.match(sql, /LEFT JOIN match_schedules ms/);
      assert.match(sql, /FROM match_official_records mor/);
      assert.match(sql, /ORDER BY ms\.scheduled_at IS NULL, ms\.scheduled_at, m\.round_num/);
      assert.deepEqual(values, [1]);
      return [[{
        competition_id: 1,
        competition_status: "running",
        match_id: 10,
        round_number: 1,
        court_id: "court-1",
        scheduled_at: new Date("2026-08-09T10:00:00Z"),
        match_status: "playing",
        score1: 11,
        score2: 9,
        result_confirmed_at: null,
        has_official_record: 0
      }]];
    }
  };

  const rows = await repository.findByCompetitionId(1, connection);
  assert.equal(rows.length, 1);
});

test("service maps scores, schedule, court, and official confirmation to the public model", async (t) => {
  const original = repository.findByCompetitionId;
  t.after(() => { repository.findByCompetitionId = original; });
  repository.findByCompetitionId = async () => [{
    competition_id: 2,
    competition_status: "running",
    match_id: 10,
    round_number: 1,
    court_id: "court-1",
    scheduled_at: new Date("2026-08-09T10:00:00Z"),
    match_status: "playing",
    score1: 11,
    score2: 9,
    result_confirmed_at: new Date(),
    has_official_record: 1,
    referee_id: "must-not-leak",
    responsibility_accepted_at: new Date(),
    evidence_reference: "must-not-leak"
  }];

  const result = await service.getPublicMatches("2");
  assert.deepEqual(result, {
    competitionId: 2,
    matches: [{
      matchId: 10,
      roundNumber: 1,
      courtId: "court-1",
      scheduledAt: "2026-08-09T10:00:00.000Z",
      status: "playing",
      score: { sideOne: 11, sideTwo: 9 },
      confirmed: true
    }]
  });
  assert.equal(JSON.stringify(result).includes("referee"), false);
  assert.equal(JSON.stringify(result).includes("evidence"), false);
  await assert.rejects(service.getPublicMatches("invalid"),
    (error) => error.code === "VALIDATION_ERROR");
});

test("public endpoint returns matches and maps invalid ids to 400", async (t) => {
  const original = service.getPublicMatches;
  t.after(() => { service.getPublicMatches = original; });
  const handler = routeHandler();

  service.getPublicMatches = async (id) => ({ competitionId: Number(id), matches: [{ matchId: 10 }] });
  const ok = response();
  await handler({ params: { competitionId: "3" } }, ok);
  assert.deepEqual(ok.payload, { competitionId: 3, matches: [{ matchId: 10 }] });

  service.getPublicMatches = async () => {
    const error = new Error("Valid competition id is required");
    error.code = "VALIDATION_ERROR";
    throw error;
  };
  const invalid = response();
  await handler({ params: { competitionId: "bad" } }, invalid);
  assert.equal(invalid.statusCode, 400);
});

test("public scoreboard introduces no persistence or workflow authority", () => {
  const files = [
    "repositories/public-match-scoreboard.repository.js",
    "services/public-match-scoreboard.service.js",
    "api/public-match-scoreboard.js"
  ];
  const source = files.map((file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8")).join("\n");
  assert.doesNotMatch(source, /\b(INSERT|UPDATE|DELETE|CREATE TABLE)\b/i);
  assert.doesNotMatch(source, /referee_id|assigned_at|responsibility_accepted_at|evidence_reference/i);
  assert.doesNotMatch(source, /websocket|notification|public_score|scoreboard_state/i);
});
