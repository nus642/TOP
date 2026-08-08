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
  repository.confirm = async (_tid, _mid, refereeId, officialRecord) =>
    (stored = {
      ...stored,
      status: "confirmed",
      resultConfirmedBy: refereeId,
      officialRecord: { recordId: 101, confirmedAt: officialRecord.outcome.confirmedAt }
    });

  const steps = [
    ["/:tournamentId/matches/:matchId/assignment", "put", { refereeId: "referee-7" }, "assigned"],
    ["/:tournamentId/matches/:matchId/referee-responsibility", "post", { refereeId: "referee-7" }, "playing"],
    ["/:tournamentId/matches/:matchId/score", "put", { refereeId: "referee-7", score1: 11, score2: 8 }, "scored"],
    ["/:tournamentId/matches/:matchId/result-confirmation", "post", {
      refereeId: "referee-7",
      evidenceReference: "scorecard://match/9",
      evidenceMetadata: { capturedBy: "court-tablet-2" }
    }, "confirmed"]
  ];

  for (const [path, method, body, expectedStatus] of steps) {
    const res = response();
    await route(path, method)({ params: { tournamentId: "3", matchId: "9" }, body }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.match.status, expectedStatus);
  }
  assert.equal(stored.resultConfirmedBy, "referee-7");
  assert.deepEqual([stored.score1, stored.score2], [11, 8]);
  assert.equal(stored.officialRecord.recordId, 101);
});

test("official confirmation creates a trusted record and preserves its evidence", async (t) => {
  const originals = {
    transaction: db.withTransaction,
    find: repository.findById,
    confirm: repository.confirm
  };
  t.after(() => {
    db.withTransaction = originals.transaction;
    repository.findById = originals.find;
    repository.confirm = originals.confirm;
  });

  db.withTransaction = (work) => work({ transaction: true });
  repository.findById = async () => ({
    id: 9, tournamentId: 3, refereeId: "referee-7", status: "scored", score1: 11, score2: 8
  });
  let persisted;
  repository.confirm = async (tournamentId, matchId, refereeId, record) => {
    persisted = record;
    return {
      id: matchId,
      tournamentId,
      status: "confirmed",
      officialRecord: { recordId: 501, confirmedBy: refereeId }
    };
  };

  const result = await service.confirmResult(3, 9, {
    refereeId: "referee-7",
    evidenceReference: "scorecard://match/9",
    evidenceMetadata: { device: "court-tablet-2", checksum: "sha256:abc" }
  });

  assert.equal(result.match.officialRecord.recordId, 501);
  assert.equal(persisted.outcome.officialConfirmation.confirmedBy, "referee-7");
  assert.equal(persisted.outcome.confirmedAt, persisted.outcome.officialConfirmation.confirmedAt);
  assert.deepEqual(persisted.outcome.matchResult.score, { score1: 11, score2: 8 });
  const [evidence] = persisted.outcome.officialConfirmation.evidenceReferences;
  assert.equal(evidence.reference, "scorecard://match/9");
  assert.deepEqual(evidence.captureMetadata, { device: "court-tablet-2", checksum: "sha256:abc" });
  assert.deepEqual(persisted.provenance, {
    workflow: "match-operations",
    operation: "official-confirmation",
    tournamentId: 3,
    matchId: 9
  });
});

test("confirmation history remains attributable", async () => {
  const connection = {
    async query(sql, values) {
      assert.match(sql, /ORDER BY confirmed_at, id/);
      assert.deepEqual(values, [3, 9]);
      return [[
        {
          id: 501, tournament_id: 3, match_id: 9,
          result_data: '{"score1":11,"score2":8}', confirmed_at: "2026-08-08T10:00:00.000Z",
          confirmed_by: "referee-7", evidence_reference: "scorecard://match/9",
          evidence_metadata: '{"checksum":"sha256:abc"}',
          provenance: '{"workflow":"match-operations"}'
        },
        {
          id: 502, tournament_id: 3, match_id: 9,
          result_data: { score1: 11, score2: 8 }, confirmed_at: "2026-08-08T10:05:00.000Z",
          confirmed_by: "referee-8", evidence_reference: null,
          evidence_metadata: {}, provenance: { workflow: "match-operations" }
        }
      ]];
    }
  };

  const history = await repository.findOfficialRecords(3, 9, connection);

  assert.deepEqual(history.map(({ recordId, confirmedBy }) => ({ recordId, confirmedBy })), [
    { recordId: 501, confirmedBy: "referee-7" },
    { recordId: 502, confirmedBy: "referee-8" }
  ]);
  assert.deepEqual(history[0].evidenceMetadata, { checksum: "sha256:abc" });
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
