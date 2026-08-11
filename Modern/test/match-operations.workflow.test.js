const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const repository = require("../repositories/match-operation.repository");
const readinessRepository = require("../repositories/participant-readiness.repository");
const officialRecordRepository = require("../repositories/match-official-record.repository");
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

test("API -> service -> domain -> repository completes the assigned Referee result loop with trusted record", async (t) => {
  const originals = {
    transaction: db.withTransaction,
    find: repository.findById,
    assign: repository.assign,
    accept: repository.acceptResponsibility,
    start: repository.start,
    score: repository.recordScore,
    confirm: repository.confirm,
    officialCreate: officialRecordRepository.create,
    officialFindByMatch: officialRecordRepository.findByMatch
  };
  t.after(() => {
    db.withTransaction = originals.transaction;
    repository.findById = originals.find;
    repository.assign = originals.assign;
    repository.acceptResponsibility = originals.accept;
    repository.start = originals.start;
    repository.recordScore = originals.score;
    repository.confirm = originals.confirm;
    officialRecordRepository.create = originals.officialCreate;
    officialRecordRepository.findByMatch = originals.officialFindByMatch;
  });

  let stored = { id: 9, tournamentId: 3, refereeId: null, status: "idle", score1: null, score2: null };
  let storedOfficialRecord = null;
  let nextRecordId = 1;

  const mockConnection = {
    transaction: true,
    query: async () => [{ insertId: nextRecordId++ }]
  };
  db.withTransaction = (work) => work(mockConnection);
  repository.findById = async () => ({ ...stored });
  repository.assign = async (_tid, _mid, refereeId) => (stored = { ...stored, refereeId, status: "assigned" });
  repository.acceptResponsibility = async () => (stored = { ...stored, status: "accepted" });
  repository.start = async () => (stored = { ...stored, status: "playing" });
  const originalReadiness = readinessRepository.listForCompetition;
  t.after(() => { readinessRepository.listForCompetition = originalReadiness; });
  readinessRepository.listForCompetition = async () => [
    { participant_id: 11, checked_in: 1 },
    { participant_id: 12, checked_in: 1 }
  ];
  stored.participantIds = [11, 12];
  repository.recordScore = async (_tid, _mid, score1, score2) =>
    (stored = { ...stored, score1, score2, status: "scored" });
  repository.confirm = async (_tid, _mid, refereeId) =>
    (stored = {
      ...stored,
      status: "confirmed",
      resultConfirmedBy: refereeId,
      officialRecord: { recordId: 101 }
    });

  officialRecordRepository.create = async (record) => {
    storedOfficialRecord = { id: nextRecordId++, ...record };
    return storedOfficialRecord;
  };
  officialRecordRepository.findByMatch = async () => storedOfficialRecord ? [storedOfficialRecord] : [];

  const steps = [
    ["/:tournamentId/matches/:matchId/assignment", "put", { refereeId: "referee-7" }, "assigned"],
    ["/:tournamentId/matches/:matchId/referee-responsibility", "post", { refereeId: "referee-7" }, "accepted"],
    ["/:tournamentId/matches/:matchId/start", "post", { refereeId: "referee-7" }, "playing"],
    ["/:tournamentId/matches/:matchId/score", "put", { refereeId: "referee-7", score1: 11, score2: 8 }, "scored"],
    ["/:tournamentId/matches/:matchId/result-confirmation", "post", {
      actorId: "master-1", actorType: "master",
      evidenceReference: "scorecard://match/9",
      evidenceMetadata: { capturedBy: "court-tablet-2" }
    }, "confirmed"]
  ];

  let confirmPayload = null;
  for (const [path, method, body, expectedStatus] of steps) {
    const res = response();
    await route(path, method)({ params: { tournamentId: "3", matchId: "9" }, body }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload.match.status, expectedStatus);
    if (expectedStatus === "confirmed") {
      confirmPayload = res.payload;
    }
  }

  assert.equal(stored.resultConfirmedBy, "master-1");
  assert.deepEqual([stored.score1, stored.score2], [11, 8]);
  assert.equal(stored.officialRecord.recordId, 101);

  // Verify trusted record was created
  assert.ok(confirmPayload.officialRecord, "Official record must be returned");
  assert.equal(confirmPayload.officialRecord.refereeId, "referee-7");
  assert.equal(confirmPayload.officialRecord.score1, 11);
  assert.equal(confirmPayload.officialRecord.score2, 8);
  assert.equal(confirmPayload.officialRecord.confirmedBy, "master-1");
  assert.equal(confirmPayload.officialRecord.evidenceReference, "scorecard://match/9");
  assert.equal(confirmPayload.officialRecord.confirmationResponsibility, "referee_result_confirmation");

  // Verify trusted competition record structure
  const tcr = confirmPayload.trustedCompetitionRecord;
  assert.ok(tcr, "Trusted competition record must be returned");
  assert.equal(tcr.matchResult.matchId, "9");
  assert.deepEqual(tcr.matchResult.score, [11, 8]);
  assert.equal(tcr.officialConfirmation.responsibility, "referee_result_confirmation");
  assert.equal(tcr.officialConfirmation.confirmedBy, "master-1");
  assert.ok(tcr.evidenceReferences.length > 0, "Evidence references must be present");
  assert.equal(tcr.evidenceReferences[0].reference, "scorecard://match/9");
});

test("official confirmation creates a trusted record and preserves its evidence", async (t) => {
  const originals = {
    transaction: db.withTransaction,
    find: repository.findById,
    confirm: repository.confirm,
    officialCreate: officialRecordRepository.create
  };
  t.after(() => {
    db.withTransaction = originals.transaction;
    repository.findById = originals.find;
    repository.confirm = originals.confirm;
    officialRecordRepository.create = originals.officialCreate;
  });

  const mockConnection = { transaction: true, query: async () => [{ insertId: 501 }] };
  db.withTransaction = (work) => work(mockConnection);
  repository.findById = async () => ({
    id: 9, tournamentId: 3, refereeId: "referee-7", status: "scored", score1: 11, score2: 8
  });
  let persisted;
  repository.confirm = async (tournamentId, matchId, refereeId) => {
    return {
      id: matchId,
      tournamentId,
      status: "confirmed",
      officialRecord: { recordId: 501, confirmedBy: refereeId }
    };
  };

  let createdRecord = null;
  officialRecordRepository.create = async (record) => {
    createdRecord = { id: 501, ...record };
    return createdRecord;
  };

  const result = await service.confirmResult(3, 9, {
    actorId: "master-1", actorType: "master",
    evidenceReference: "scorecard://match/9",
    evidenceMetadata: { device: "court-tablet-2", checksum: "sha256:abc" }
  });

  assert.equal(result.match.officialRecord.recordId, 501);
  assert.ok(result.officialRecord, "Official record must be created");
  assert.equal(result.officialRecord.refereeId, "referee-7");
  assert.equal(result.officialRecord.score1, 11);
  assert.equal(result.officialRecord.score2, 8);
  assert.equal(result.officialRecord.confirmedBy, "master-1");
  assert.equal(result.officialRecord.evidenceReference, "scorecard://match/9");
  assert.deepEqual(result.officialRecord.evidenceMetadata, { device: "court-tablet-2", checksum: "sha256:abc" });
  assert.equal(result.officialRecord.confirmationResponsibility, "referee_result_confirmation");
  assert.equal(result.officialRecord.provenance.source, "match_operations_workflow");
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

test("confirmation without evidence still creates trusted record", async (t) => {
  const originals = {
    transaction: db.withTransaction,
    find: repository.findById,
    confirm: repository.confirm,
    officialCreate: officialRecordRepository.create
  };
  t.after(() => {
    db.withTransaction = originals.transaction;
    repository.findById = originals.find;
    repository.confirm = originals.confirm;
    officialRecordRepository.create = originals.officialCreate;
  });

  db.withTransaction = (work) => work({});
  repository.findById = async () => ({
    id: 10, tournamentId: 3, refereeId: "referee-5", status: "scored", score1: 6, score2: 11
  });

  let createdRecord = null;
  repository.confirm = async () => ({ id: 10, tournamentId: 3, status: "confirmed" });
  officialRecordRepository.create = async (record) => {
    createdRecord = { id: 1, ...record };
    return createdRecord;
  };

  const result = await service.confirmResult(3, 10, { actorId: "master-1", actorType: "master" });

  assert.ok(result.officialRecord, "Official record must be created");
  assert.equal(result.officialRecord.refereeId, "referee-5");
  assert.equal(result.officialRecord.score1, 6);
  assert.equal(result.officialRecord.score2, 11);
  assert.equal(result.officialRecord.evidenceReference, null);
  assert.equal(result.officialRecord.confirmationResponsibility, "referee_result_confirmation");
  assert.ok(result.trustedCompetitionRecord, "Trusted competition record must be returned");
});

test("confirmation preserves evidence metadata", async (t) => {
  const originals = {
    transaction: db.withTransaction,
    find: repository.findById,
    confirm: repository.confirm,
    officialCreate: officialRecordRepository.create
  };
  t.after(() => {
    db.withTransaction = originals.transaction;
    repository.findById = originals.find;
    repository.confirm = originals.confirm;
    officialRecordRepository.create = originals.officialCreate;
  });

  db.withTransaction = (work) => work({});
  repository.findById = async () => ({
    id: 11, tournamentId: 3, refereeId: "referee-6", status: "scored", score1: 11, score2: 3
  });

  let createdRecord = null;
  repository.confirm = async () => ({ id: 11, tournamentId: 3, status: "confirmed" });
  officialRecordRepository.create = async (record) => {
    createdRecord = { id: 2, ...record };
    return createdRecord;
  };

  const result = await service.confirmResult(3, 11, {
    actorId: "master-1", actorType: "master",
    evidenceReference: "digital-scorecard-11",
    evidenceMetadata: { source: "referee_app", version: "2.1" }
  });

  assert.ok(result.officialRecord, "Official record must be created");
  assert.equal(result.officialRecord.evidenceReference, "digital-scorecard-11");
  assert.deepEqual(result.officialRecord.evidenceMetadata, { source: "referee_app", version: "2.1" });
  assert.equal(result.officialRecord.provenance.source, "match_operations_workflow");
});

test("getOfficialRecord returns persisted records", async (t) => {
  const originals = {
    find: repository.findById,
    officialFindByMatch: officialRecordRepository.findByMatch
  };
  t.after(() => {
    repository.findById = originals.find;
    officialRecordRepository.findByMatch = originals.officialFindByMatch;
  });

  repository.findById = async () => ({
    id: 12, tournamentId: 3, refereeId: "referee-8", status: "confirmed", score1: 11, score2: 5
  });

  const mockRecords = [
    { id: 1, tournamentId: 3, matchId: 12, refereeId: "referee-8", score1: 11, score2: 5,
      confirmedBy: "referee-8", confirmedAt: "2026-08-09T10:00:00Z",
      confirmationResponsibility: "referee_result_confirmation",
      evidenceReference: "sheet-12", evidenceMetadata: null, provenance: null, createdAt: "2026-08-09T10:00:00Z" }
  ];
  officialRecordRepository.findByMatch = async () => mockRecords;

  const result = await service.getOfficialRecord(3, 12);

  assert.equal(result.hasTrustedRecord, true);
  assert.equal(result.officialRecords.length, 1);
  assert.equal(result.officialRecords[0].refereeId, "referee-8");
  assert.equal(result.officialRecords[0].evidenceReference, "sheet-12");
});

test("getOfficialRecord returns empty for unconfirmed match", async (t) => {
  const originals = {
    find: repository.findById,
    officialFindByMatch: officialRecordRepository.findByMatch
  };
  t.after(() => {
    repository.findById = originals.find;
    officialRecordRepository.findByMatch = originals.officialFindByMatch;
  });

  repository.findById = async () => ({
    id: 13, tournamentId: 3, refereeId: "referee-9", status: "scored", score1: 7, score2: 11
  });
  officialRecordRepository.findByMatch = async () => [];

  const result = await service.getOfficialRecord(3, 13);

  assert.equal(result.hasTrustedRecord, false);
  assert.equal(result.officialRecords.length, 0);
});

test("getOfficialRecord returns NOT_FOUND for unknown match", async (t) => {
  const originals = { find: repository.findById, officialFindByMatch: officialRecordRepository.findByMatch };
  t.after(() => { repository.findById = originals.find; officialRecordRepository.findByMatch = originals.officialFindByMatch; });

  repository.findById = async () => null;
  officialRecordRepository.findByMatch = async () => [];

  await assert.rejects(
    service.getOfficialRecord(3, 999),
    (error) => error.code === "NOT_FOUND" && /Match not found/.test(error.message)
  );
});
