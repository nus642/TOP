const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const checkinService = require("../services/checkin.service");
const tournamentRepository = require("../repositories/tournament.repository");
const repository = require("../repositories/participant-readiness.repository");
const service = require("../services/participant-readiness.service");
const router = require("../api/participant-readiness");
const { ReadinessState, READINESS_STATES } = require("../engine/readiness");

const original = {
  withTransaction: db.withTransaction,
  checkInPlayer: checkinService.checkInPlayer,
  getCheckInStatus: checkinService.getCheckInStatus,
  getCompetition: tournamentRepository.getTournamentByIdWithConnection,
  list: repository.listForCompetition,
  checkIn: service.checkIn,
  listReadiness: service.listReadiness
};

test.beforeEach(() => {
  db.withTransaction = async (work) => work({});
  tournamentRepository.getTournamentByIdWithConnection = async (id) => ({ id });
  repository.listForCompetition = async () => [];
  checkinService.getCheckInStatus = async () => ({ checkIn: null });
});

test.afterEach(() => {
  db.withTransaction = original.withTransaction;
  checkinService.checkInPlayer = original.checkInPlayer;
  checkinService.getCheckInStatus = original.getCheckInStatus;
  tournamentRepository.getTournamentByIdWithConnection = original.getCompetition;
  repository.listForCompetition = original.list;
  service.checkIn = original.checkIn;
  service.listReadiness = original.listReadiness;
});

test("readiness state represents an absent check-in without creating registration or identity", () => {
  const state = ReadinessState.fromPersistence(8, null);
  assert.equal(state.state, READINESS_STATES.NOT_CHECKED_IN);
  assert.equal(state.checkedInAt, null);
});

test("checkIn delegates mutation and waiver data to the existing check-in authority", async () => {
  const calls = [];
  const checkedInAt = new Date("2026-08-09T10:00:00Z");
  checkinService.checkInPlayer = async (...args) => {
    calls.push(args);
    return { checkIn: { checked_in: 1, checked_in_at: checkedInAt } };
  };

  const waiver = { acceptWaiver: true, waiverVersion: "v2" };
  const result = await service.checkIn("3", "8", waiver);

  assert.deepEqual(calls, [[3, 8, waiver]]);
  assert.deepEqual(result, {
    competitionId: 3,
    participantId: 8,
    state: READINESS_STATES.READY,
    checkedInAt,
    source: null
  });
});

test("checkIn cannot bypass the existing waiver requirement", async () => {
  checkinService.checkInPlayer = async (_competitionId, _participantId, data) => {
    assert.deepEqual(data, {});
    const error = new Error("Accepted waiver is required before check-in");
    error.code = "VALIDATION_ERROR";
    throw error;
  };

  await assert.rejects(() => service.checkIn(3, 8), {
    code: "VALIDATION_ERROR",
    message: "Accepted waiver is required before check-in"
  });
});

test("getReadiness delegates registration and check-in lookup to the existing workflow", async () => {
  const calls = [];
  checkinService.getCheckInStatus = async (...args) => {
    calls.push(args);
    return { checkIn: null };
  };

  assert.deepEqual(await service.getReadiness(3, 8), {
    competitionId: 3,
    participantId: 8,
    state: "not_checked_in",
    checkedInAt: null,
    source: null
  });
  assert.deepEqual(calls, [[3, 8]]);
});

test("listReadiness validates competition existence and projects registrations", async () => {
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

test("listReadiness rejects an unknown competition before querying readiness", async () => {
  let queried = false;
  tournamentRepository.getTournamentByIdWithConnection = async () => null;
  repository.listForCompetition = async () => { queried = true; return []; };

  await assert.rejects(() => service.listReadiness(404), {
    code: "NOT_FOUND",
    message: "Competition not found"
  });
  assert.equal(queried, false);
});

test("check-in API forwards waiver input to the existing workflow", async () => {
  const layer = router.stack.find((candidate) => candidate.route
    && candidate.route.path.endsWith("/check-in"));
  const handler = layer.route.stack[0].handle;
  service.checkIn = async (...args) => ({ args, state: "ready" });
  const res = createResponse();
  const body = { acceptWaiver: true, waiverVersion: "v2" };

  await handler({ params: { competitionId: "3", participantId: "8" }, actor: { actorId: "8" }, body }, res);
  assert.deepEqual(res.payload, { args: ["3", "8", body], state: "ready" });
});

test("readiness API maps existing waiver validation failures to HTTP 400", async () => {
  const layer = router.stack.find((candidate) => candidate.route
    && candidate.route.path.endsWith("/check-in"));
  const handler = layer.route.stack[0].handle;
  service.checkIn = async () => {
    const error = new Error("Accepted waiver is required before check-in");
    error.code = "VALIDATION_ERROR";
    throw error;
  };
  const res = createResponse();

  await handler({ params: { competitionId: "3", participantId: "8" }, actor: { actorId: "8" }, body: {} }, res);
  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.payload, { error: "Accepted waiver is required before check-in" });
});

function createResponse() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}
