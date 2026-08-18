const assert = require("node:assert/strict");
const test = require("node:test");

process.env.MYSQL_HOST = process.env.MYSQL_HOST || "localhost";

const db = require("../database/db");
const repository = require("../repositories/match-operation.repository");
const matchRepository = require("../repositories/match.repository");
const service = require("../services/match-operations.service");
const router = require("../api/referee-workflow");

// M2 Referee Match Operation Experience (ED-M2-RMO-001):
// format columns + lightweight score snapshot read/write paths.

test("writeScoreSnapshot writes scores only and guards on status playing", async (t) => {
  const original = db.query;
  t.after(() => { db.query = original; });

  let capturedSql;
  let capturedParams;
  db.query = async (sql, params) => {
    capturedSql = sql;
    capturedParams = params;
    return [{ affectedRows: 1 }];
  };

  const affected = await repository.writeScoreSnapshot(3, 9, 7, 5);

  assert.equal(affected, 1);
  assert.match(capturedSql, /UPDATE matches SET score1 = \?, score2 = \?/);
  assert.match(capturedSql, /AND status = 'playing'/);
  // Snapshot must not touch status or any other column.
  assert.doesNotMatch(capturedSql, /status = \?/);
  assert.doesNotMatch(capturedSql, /FOR UPDATE/i);
  assert.deepEqual(capturedParams, [7, 5, 3, 9]);
});

test("writeScoreSnapshot returns 0 affected rows when match is not playing", async (t) => {
  const original = db.query;
  t.after(() => { db.query = original; });
  db.query = async () => [{ affectedRows: 0 }];

  const affected = await repository.writeScoreSnapshot(3, 9, 7, 5);
  assert.equal(affected, 0);
});

test("findById maps format configuration with defaults", async (t) => {
  const original = db.query;
  t.after(() => { db.query = original; });
  db.query = async () => [[{
    id: 9, tournament_id: 3, referee_id: "r1", status: "playing",
    score1: null, score2: null,
    game_format: 1, score_rule: "rally", target_score: 21, cap_score: 25
  }]];

  const match = await repository.findById(3, 9);
  assert.deepEqual(match.format, { gameFormat: 1, scoreRule: "rally", targetScore: 21, capScore: 25 });
});

test("findByReferee maps format configuration for referee work list", async (t) => {
  const original = db.query;
  t.after(() => { db.query = original; });
  db.query = async () => [[{
    id: 9, tournament_id: 3, referee_id: "r1", status: "accepted",
    round_num: 2, court_id: "court-1", team1_name: "A", team2_name: "B",
    score1: null, score2: null,
    game_format: 3, score_rule: "rally", target_score: 11, cap_score: 15
  }]];

  const [work] = await repository.findByReferee(3, "r1");
  assert.deepEqual(work.format, { gameFormat: 3, scoreRule: "rally", targetScore: 11, capScore: 15 });
});

test("createMatch inserts format columns with rally defaults", async (t) => {
  const original = db.query;
  t.after(() => { db.query = original; });

  let capturedSql;
  let capturedParams;
  db.query = async (sql, params) => {
    capturedSql = sql;
    capturedParams = params;
    return [{ insertId: 42 }];
  };

  const created = await matchRepository.createMatch({
    tournament_id: 3, round_num: 1, court: "court-1",
    player1_id: 1, player2_id: 2, player3_id: 3, player4_id: 4,
    team1_name: null, team2_name: null, score1: null, score2: null, status: "idle"
  });

  assert.equal(created.id, 42);
  assert.match(capturedSql, /game_format,\s*score_rule,\s*target_score,\s*cap_score,/);
  assert.deepEqual(capturedParams.slice(11, 15), [1, "rally", 21, 21]);
});

test("createMatch honors explicit format values when provided", async (t) => {
  const original = db.query;
  t.after(() => { db.query = original; });

  let capturedParams;
  db.query = async (sql, params) => {
    capturedParams = params;
    return [{ insertId: 43 }];
  };

  await matchRepository.createMatch({
    tournament_id: 3, round_num: 1, court: "court-1",
    player1_id: 1, player2_id: 2, player3_id: null, player4_id: null,
    team1_name: null, team2_name: null, score1: null, score2: null,
    game_format: 3, score_rule: "rally", target_score: 11, cap_score: 0, status: "idle"
  });

  assert.deepEqual(capturedParams.slice(11, 15), [3, "rally", 11, 0]);
});

test("service writeScoreSnapshot persists scores without status change for assigned referee", async (t) => {
  const originals = { find: repository.findById, snapshot: repository.writeScoreSnapshot };
  t.after(() => {
    repository.findById = originals.find;
    repository.writeScoreSnapshot = originals.snapshot;
  });

  repository.findById = async () => ({ id: 9, tournamentId: 3, refereeId: "r1", status: "playing" });
  let written;
  repository.writeScoreSnapshot = async (tid, mid, s1, s2) => {
    written = { tid, mid, s1, s2 };
    return 1;
  };

  const result = await service.writeScoreSnapshot(3, 9, { actorId: "r1" }, { score1: 7, score2: 5 });
  assert.deepEqual(result, { matchId: 9, score1: 7, score2: 5 });
  assert.deepEqual(written, { tid: 3, mid: 9, s1: 7, s2: 5 });
});

test("service writeScoreSnapshot rejects a referee who is not assigned (FORBIDDEN)", async (t) => {
  const originals = { find: repository.findById, snapshot: repository.writeScoreSnapshot };
  t.after(() => {
    repository.findById = originals.find;
    repository.writeScoreSnapshot = originals.snapshot;
  });

  repository.findById = async () => ({ id: 9, tournamentId: 3, refereeId: "r1", status: "playing" });
  repository.writeScoreSnapshot = async () => 1;

  await assert.rejects(
    service.writeScoreSnapshot(3, 9, { actorId: "r2" }, { score1: 1, score2: 0 }),
    (error) => error.code === "FORBIDDEN"
  );
});

test("service writeScoreSnapshot rejects missing match (NOT_FOUND)", async (t) => {
  const originals = { find: repository.findById };
  t.after(() => { repository.findById = originals.find; });
  repository.findById = async () => null;

  await assert.rejects(
    service.writeScoreSnapshot(3, 9, { actorId: "r1" }, { score1: 1, score2: 0 }),
    (error) => error.code === "NOT_FOUND"
  );
});

test("service writeScoreSnapshot rejects when match is not playing (CONFLICT)", async (t) => {
  const originals = { find: repository.findById, snapshot: repository.writeScoreSnapshot };
  t.after(() => {
    repository.findById = originals.find;
    repository.writeScoreSnapshot = originals.snapshot;
  });

  repository.findById = async () => ({ id: 9, tournamentId: 3, refereeId: "r1", status: "playing" });
  repository.writeScoreSnapshot = async () => 0;

  await assert.rejects(
    service.writeScoreSnapshot(3, 9, { actorId: "r1" }, { score1: 1, score2: 0 }),
    (error) => error.code === "CONFLICT"
  );
});

test("service writeScoreSnapshot rejects invalid scores (VALIDATION_ERROR)", async () => {
  await assert.rejects(
    service.writeScoreSnapshot(3, 9, { actorId: "r1" }, { score1: -1, score2: 0 }),
    (error) => error.code === "VALIDATION_ERROR"
  );
  await assert.rejects(
    service.writeScoreSnapshot(3, 9, { actorId: "r1" }, { score1: "abc", score2: 0 }),
    (error) => error.code === "VALIDATION_ERROR"
  );
});

test("referee-workflow exposes score-snapshot route for assigned referee", () => {
  const layer = router.stack.find(
    (entry) => entry.route?.path === "/:tournamentId/referees/:refereeId/matches/:matchId/score-snapshot"
  );
  assert.ok(layer, "score-snapshot route must be registered");
  assert.ok(layer.route.methods.put, "score-snapshot route must accept PUT");
});
