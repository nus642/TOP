const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const repository = require("../repositories/match-operation.repository");
const matchRepository = require("../repositories/match.repository");
const playerRepository = require("../repositories/player.repository");
const service = require("../services/match-operations.service");
const competitionService = require("../services/competition.service");
const router = require("../api/match-operations");
const { MatchOperation } = require("../engine/operations/domain");

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

test("API -> service -> domain -> repository completes the assigned Referee result loop", async (t) => {
  const originals = {
    transaction: db.withTransaction,
    find: repository.findById,
    assign: repository.assign,
    accept: repository.acceptResponsibility,
    score: repository.recordScore,
    confirm: repository.confirm
  };
  t.after(() => {
    db.withTransaction = originals.transaction;
    repository.findById = originals.find;
    repository.assign = originals.assign;
    repository.acceptResponsibility = originals.accept;
    repository.recordScore = originals.score;
    repository.confirm = originals.confirm;
  });

  let stored = { id: 9, tournamentId: 3, refereeId: null, status: "idle", score1: null, score2: null };
  db.withTransaction = (work) => work({ transaction: true });
  repository.findById = async () => ({ ...stored });
  repository.assign = async (_tid, _mid, refereeId) => (stored = { ...stored, refereeId, status: "assigned" });
  repository.acceptResponsibility = async () => (stored = { ...stored, status: "playing" });
  repository.recordScore = async (_tid, _mid, score1, score2) =>
    (stored = { ...stored, score1, score2, status: "scored" });
  repository.confirm = async (_tid, _mid, refereeId) =>
    (stored = { ...stored, status: "confirmed", resultConfirmedBy: refereeId });

  const steps = [
    ["/:tournamentId/matches/:matchId/assignment", "put", { refereeId: "referee-7" }, "assigned"],
    ["/:tournamentId/matches/:matchId/referee-responsibility", "post", { refereeId: "referee-7" }, "playing"],
    ["/:tournamentId/matches/:matchId/score", "put", { refereeId: "referee-7", score1: 11, score2: 8 }, "scored"],
    ["/:tournamentId/matches/:matchId/result-confirmation", "post", { refereeId: "referee-7" }, "confirmed"]
  ];

  for (const [path, method, body, expectedStatus] of steps) {
    const res = response();
    await route(path, method)({ params: { tournamentId: "3", matchId: "9" }, body }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.match.status, expectedStatus);
  }
  assert.equal(stored.resultConfirmedBy, "referee-7");
  assert.deepEqual([stored.score1, stored.score2], [11, 8]);
});

test("a different Referee cannot record or confirm an assigned match", async (t) => {
  const originals = { transaction: db.withTransaction, find: repository.findById };
  t.after(() => { db.withTransaction = originals.transaction; repository.findById = originals.find; });
  db.withTransaction = (work) => work({});
  repository.findById = async () => ({
    id: 9, tournamentId: 3, refereeId: "referee-7", status: "playing", score1: null, score2: null
  });

  await assert.rejects(
    service.recordScore(3, 9, { refereeId: "referee-8", score1: 11, score2: 8 }),
    (error) => error.code === "VALIDATION_ERROR" && /assigned Referee/.test(error.message)
  );
});

test("existing playing matches retain their score-recording behavior", () => {
  const match = new MatchOperation({
    id: 9,
    tournamentId: 3,
    refereeId: "referee-7",
    status: "playing"
  });

  match.recordScore("referee-7", 11, 8);

  assert.equal(match.status, "scored");
  assert.deepEqual([match.score1, match.score2], [11, 8]);
});

test("official confirmation remains compatible with the existing finished lifecycle", async (t) => {
  const originals = {
    transaction: db.withTransaction,
    update: matchRepository.updateMatchScore,
    reset: playerRepository.resetPlayerRuntimeStatsByTournament
  };
  t.after(() => {
    db.withTransaction = originals.transaction;
    matchRepository.updateMatchScore = originals.update;
    playerRepository.resetPlayerRuntimeStatsByTournament = originals.reset;
  });

  const match = new MatchOperation({
    id: 9,
    tournamentId: 3,
    refereeId: "referee-7",
    status: "scored",
    score1: 11,
    score2: 8
  });
  match.confirm("referee-7");
  assert.equal(match.status, "confirmed");

  const writes = [];
  db.withTransaction = (work) => work({ transaction: true });
  matchRepository.updateMatchScore = async (...args) => {
    writes.push(args.slice(0, 5));
    return { affectedRows: 1 };
  };
  playerRepository.resetPlayerRuntimeStatsByTournament = async () => {};

  await competitionService.updateMatch(3, 9, match.score1, match.score2, "finished");

  assert.deepEqual(writes, [[3, 9, 11, 8, "finished"]]);
});
