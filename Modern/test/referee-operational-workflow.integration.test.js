const assert = require("node:assert/strict");
const test = require("node:test");

const repository = require("../repositories/match-operation.repository");
const service = require("../services/match-operations.service");
const router = require("../api/match-operations");

function route(path, method) {
  return router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method])
    .route.stack[0].handle;
}

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(value) { this.payload = value; return this; }
  };
}

test("repository reads the assigned referee workflow from match and schedule persistence", async () => {
  const connection = {
    async query(sql, values) {
      assert.match(sql, /FROM matches m/);
      assert.match(sql, /LEFT JOIN match_schedules/);
      assert.match(sql, /m\.tournament_id = \? AND m\.referee_id = \?/);
      assert.deepEqual(values, [3, "referee-7"]);
      return [[{
        id: 9,
        tournament_id: 3,
        referee_id: "referee-7",
        status: "assigned",
        round_num: 2,
        court: "Court 1",
        scheduled_at: "2026-08-09T10:00:00.000Z",
        team1_name: "Alpha",
        team2_name: "Bravo",
        player1_id: 11,
        player2_id: 12,
        player3_id: 21,
        player4_id: 22,
        score1: null,
        score2: null,
        assigned_at: "2026-08-09T09:00:00.000Z",
        responsibility_accepted_at: null,
        result_confirmed_at: null
      }]];
    }
  };

  const matches = await repository.findByReferee(3, "referee-7", connection);

  assert.equal(matches[0].status, "assigned");
  assert.equal(matches[0].scheduledAt, "2026-08-09T10:00:00.000Z");
  assert.deepEqual(matches[0].team1, { name: "Alpha", playerIds: [11, 12] });
  assert.deepEqual(matches[0].team2, { name: "Bravo", playerIds: [21, 22] });
});

test("API exposes only the referee's existing match-operation records", async (t) => {
  const original = repository.findByReferee;
  t.after(() => { repository.findByReferee = original; });
  repository.findByReferee = async (tournamentId, refereeId) => [{
    id: 9,
    tournamentId,
    refereeId,
    status: "playing",
    court: "Court 1"
  }];

  const res = response();
  await route("/:tournamentId/referees/:refereeId/matches", "get")({
    params: { tournamentId: "3", refereeId: "referee-7" }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.payload, {
    tournamentId: 3,
    refereeId: "referee-7",
    matches: [{
      id: 9,
      tournamentId: 3,
      refereeId: "referee-7",
      status: "playing",
      court: "Court 1"
    }]
  });
});

test("referee workflow access validates its operational scope", async (t) => {
  const original = repository.findByReferee;
  t.after(() => { repository.findByReferee = original; });
  repository.findByReferee = async () => { throw new Error("repository must not be called"); };

  await assert.rejects(
    service.getRefereeWorkflow("invalid", "referee-7"),
    (error) => error.code === "VALIDATION_ERROR"
  );
  await assert.rejects(
    service.getRefereeWorkflow(3, "  "),
    (error) => error.code === "VALIDATION_ERROR"
  );
});
