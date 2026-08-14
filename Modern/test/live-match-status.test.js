const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const repository = require("../repositories/live-match-status.repository");
const service = require("../services/live-match-status.service");
const router = require("../api/master-workflow");

function liveStatusRoute() {
  return router.stack.find((layer) => layer.route?.path === "/:competitionId/live-status")
    .route.stack[0].handle;
}

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; }
  };
}

test("repository projects every match and reads each existing authority", async () => {
  const connection = {
    async query(sql, values) {
      assert.match(sql, /FROM matches m/);
      assert.match(sql, /JOIN tournaments t/);
      assert.match(sql, /LEFT JOIN match_schedules ms/);
      assert.match(sql, /FROM match_official_records mor/);
      assert.deepEqual(values, [1]);
      return [[
        {
          competition_status: "running",
          match_id: 10, round_number: 1, court_id: "court-1",
          scheduled_at: new Date("2026-08-09T10:00:00Z"), match_status: "playing",
          referee_id: "ref-1", assigned_at: new Date(),
          responsibility_accepted_at: new Date(), score1: 11, score2: 8,
          result_confirmed_at: null, has_official_record: 0
        },
        {
          competition_status: "running",
          match_id: 11, round_number: 1, court_id: null, scheduled_at: null,
          match_status: "idle", referee_id: null, assigned_at: null,
          responsibility_accepted_at: null, score1: null, score2: null,
          result_confirmed_at: null, has_official_record: 0
        },
        {
          competition_status: "running",
          match_id: 12, round_number: 2, court_id: "court-2",
          scheduled_at: "2026-08-09 11:00:00", match_status: "confirmed",
          referee_id: "ref-2", assigned_at: new Date(),
          responsibility_accepted_at: new Date(), score1: 7, score2: 11,
          result_confirmed_at: new Date(), has_official_record: 1
        }
      ]];
    }
  };

  const projection = await repository.findByCompetitionId(1, connection);
  const matches = projection.matches;
  assert.equal(projection.competitionStatus, "running");
  assert.equal(matches.length, 3, "unassigned matches remain in the operational view");
  assert.deepEqual(matches[0], {
    matchId: 10, roundNumber: 1, courtId: "court-1",
    scheduledAt: "2026-08-09T10:00:00.000Z", status: "playing",
    refereeId: "ref-1", refereeAccepted: true,
    score: { sideOne: 11, sideTwo: 8 }, confirmed: false
  });
  assert.equal(matches[1].refereeId, null);
  assert.equal(matches[1].scheduledAt, null);
  assert.equal(matches[2].confirmed, true);
});

test("service validates competition id and returns the operational view model", async (t) => {
  const original = repository.findByCompetitionId;
  t.after(() => { repository.findByCompetitionId = original; });
  repository.findByCompetitionId = async (competitionId) => ({
    competitionStatus: "running", matches: [{ matchId: competitionId * 10 }]
  });

  assert.deepEqual(await service.getLiveMatchStatus("3"), {
    competitionId: 3, competitionStatus: "running", matches: [{ matchId: 30 }]
  });
  await assert.rejects(service.getLiveMatchStatus("bad"),
    (error) => error.code === "VALIDATION_ERROR");
});

test("master workflow exposes GET live status and maps validation errors", async (t) => {
  const original = service.getLiveMatchStatus;
  t.after(() => { service.getLiveMatchStatus = original; });
  const handler = liveStatusRoute();

  service.getLiveMatchStatus = async (competitionId) => ({ competitionId: Number(competitionId), matches: [] });
  const ok = response();
  await handler({ params: { competitionId: "4" }, actor: { actorType: "master", actorId: "master-1" } }, ok);
  assert.deepEqual(ok.payload, { competitionId: 4, matches: [] });

  service.getLiveMatchStatus = async () => {
    const error = new Error("Valid competition id is required");
    error.code = "VALIDATION_ERROR";
    throw error;
  };
  const invalid = response();
  await handler({ params: { competitionId: "bad" }, actor: { actorType: "master", actorId: "master-1" } }, invalid);
  assert.equal(invalid.statusCode, 400);

  const forbidden = response();
  await handler({ params: { competitionId: "4" }, actor: { actorType: "referee", actorId: "referee-1" } }, forbidden);
  assert.equal(forbidden.statusCode, 400);
  assert.match(forbidden.payload.error, /Only a master/);
});

test("live visibility introduces no persistence or workflow authority", () => {
  const repositorySource = fs.readFileSync(
    path.join(__dirname, "..", "repositories", "live-match-status.repository.js"), "utf8"
  );
  const serviceSource = fs.readFileSync(
    path.join(__dirname, "..", "services", "live-match-status.service.js"), "utf8"
  );
  assert.doesNotMatch(repositorySource, /\b(INSERT|UPDATE|DELETE|CREATE TABLE)\b/i);
  assert.doesNotMatch(serviceSource, /match-operations|scheduling|standings|database\/db/i);
});
