const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const playerRepository = require("../repositories/player.repository");
const repository = require("../repositories/participant-readiness.repository");
const service = require("../services/participant-readiness.service");
const router = require("../api/participant-readiness");
const { ReadinessState, READINESS_STATES } = require("../engine/readiness");

const original = {
  withTransaction: db.withTransaction,
  registration: playerRepository.getPlayerByIdForTournament,
  find: repository.find,
  markCheckedIn: repository.markCheckedIn,
  list: repository.listForCompetition,
  checkIn: service.checkIn,
  listReadiness: service.listReadiness
};

test.beforeEach(() => {
  db.withTransaction = async (work) => work({});
  playerRepository.getPlayerByIdForTournament = async (competitionId, participantId) => ({
    id: participantId,
    tournament_id: competitionId
  });
  repository.find = async () => null;
  repository.listForCompetition = async () => [];
});

test.afterEach(() => {
  db.withTransaction = original.withTransaction;
  playerRepository.getPlayerByIdForTournament = original.registration;
  repository.find = original.find;
  repository.markCheckedIn = original.markCheckedIn;
  repository.listForCompetition = original.list;
  service.checkIn = original.checkIn;
  service.listReadiness = original.listReadiness;
});

test("readiness state represents an absent check-in without creating registration or identity", () => {
  const state = ReadinessState.fromPersistence(8, null);
  assert.equal(state.state, READINESS_STATES.NOT_CHECKED_IN);
  assert.equal(state.checkedInAt, null);
});

test("checkIn persists readiness for an existing participant registration", async () => {
  repository.markCheckedIn = async (competitionId, participantId, at) => ({
    tournament_id: competitionId,
    player_id: participantId,
    checked_in: 1,
    checked_in_at: at
  });

  const result = await service.checkIn("3", "8");
  assert.equal(result.competitionId, 3);
  assert.equal(result.participantId, 8);
  assert.equal(result.state, READINESS_STATES.READY);
  assert.ok(result.checkedInAt instanceof Date);
});

test("getReadiness returns not_checked_in when no readiness row exists", async () => {
  assert.deepEqual(await service.getReadiness(3, 8), {
    competitionId: 3,
    participantId: 8,
    state: "not_checked_in",
    checkedInAt: null
  });
});

test("checkIn rejects a participant not registered in the competition", async () => {
  playerRepository.getPlayerByIdForTournament = async () => null;
  await assert.rejects(() => service.checkIn(3, 99), { code: "NOT_FOUND" });
});

test("listReadiness projects every registration and its readiness", async () => {
  repository.listForCompetition = async () => [
    { participant_id: 8, checked_in: 1, checked_in_at: "2026-08-09T10:00:00.000Z" },
    { participant_id: 9, checked_in: null, checked_in_at: null }
  ];
  const result = await service.listReadiness(3);
  assert.deepEqual(result.participants.map(({ participantId, state }) => ({ participantId, state })), [
    { participantId: 8, state: "ready" },
    { participantId: 9, state: "not_checked_in" }
  ]);
});

test("check-in API delegates identifiers and maps the response", async () => {
  const layer = router.stack.find((candidate) => candidate.route
    && candidate.route.path.endsWith("/check-in"));
  const handler = layer.route.stack[0].handle;
  service.checkIn = async (...args) => ({ args, state: "ready" });
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };

  await handler({ params: { competitionId: "3", participantId: "8" } }, res);
  assert.deepEqual(res.payload, { args: ["3", "8"], state: "ready" });
});

test("readiness query API returns the competition participant projection", async () => {
  const layer = router.stack.find((candidate) => candidate.route
    && candidate.route.path === "/:competitionId/participants");
  const handler = layer.route.stack[0].handle;
  service.listReadiness = async (competitionId) => ({ competitionId, participants: [] });
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };

  await handler({ params: { competitionId: "3" } }, res);
  assert.deepEqual(res.payload, { competitionId: "3", participants: [] });
});

test("repository check-in is idempotent and preserves the first timestamp", async () => {
  const calls = [];
  const connection = {
    async query(sql, values) {
      calls.push({ sql, values });
      return calls.length === 1 ? [{}] : [[{ checked_in: 1 }]];
    }
  };
  await repository.markCheckedIn(3, 8, new Date("2026-08-09T10:00:00Z"), connection);
  assert.match(calls[0].sql, /ON DUPLICATE KEY UPDATE/);
  assert.match(calls[0].sql, /COALESCE\(player_check_ins\.checked_in_at/);
  assert.deepEqual(calls[0].values.slice(0, 2), [3, 8]);
});
