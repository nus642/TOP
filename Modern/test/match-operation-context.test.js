const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const matchRepository = require("../repositories/match-operation.repository");
const readinessRepository = require("../repositories/participant-readiness.repository");
const service = require("../services/match-operations.service");
const { MatchOperation } = require("../engine/operations/domain");

test("acceptance is observable separately from starting play", () => {
  const match = new MatchOperation({
    id: 9, tournamentId: 3, refereeId: "referee-7", status: "assigned"
  });

  match.acceptResponsibility("referee-7");
  assert.equal(match.status, "accepted");
  match.start("referee-7", [
    { participantId: 11, state: "ready" },
    { participantId: 12, state: "ready" }
  ]);
  assert.equal(match.status, "playing");
});

test("match authority rejects start for a wrong referee or unready participant", () => {
  const record = { id: 9, tournamentId: 3, refereeId: "referee-7", status: "accepted" };

  assert.throws(
    () => new MatchOperation(record).start("referee-8", [{ participantId: 11, state: "ready" }]),
    { code: "REFEREE_RESPONSIBILITY_MISMATCH" }
  );
  assert.throws(
    () => new MatchOperation(record).start("referee-7", [
      { participantId: 11, state: "ready" },
      { participantId: 12, state: "not_ready" }
    ]),
    (error) => error.code === "PARTICIPANTS_NOT_READY" && /12/.test(error.message)
  );
});

test("operation context projects authoritative readiness and gates explicit start", async (t) => {
  const originals = {
    transaction: db.withTransaction,
    find: matchRepository.findById,
    readiness: readinessRepository.listForCompetition,
    start: matchRepository.start
  };
  t.after(() => {
    db.withTransaction = originals.transaction;
    matchRepository.findById = originals.find;
    readinessRepository.listForCompetition = originals.readiness;
    matchRepository.start = originals.start;
  });

  const record = {
    id: 9, tournamentId: 3, refereeId: "referee-7", status: "accepted",
    participantIds: [11, 12]
  };
  db.withTransaction = (work) => work({
    transaction: true,
    query: async () => [[{ id: 3, status: "running" }]]
  });
  matchRepository.findById = async () => ({ ...record });
  readinessRepository.listForCompetition = async () => [
    { participant_id: 11, checked_in: 1 },
    { participant_id: 12, checked_in: 0 }
  ];
  matchRepository.start = async () => ({ ...record, status: "playing" });

  const context = await service.getMatchOperationContext(3, 9);
  assert.equal(context.allParticipantsReady, false);
  assert.deepEqual(context.participantReadiness, [
    { participantId: 11, state: "ready" },
    { participantId: 12, state: "not_ready" }
  ]);
  await assert.rejects(
    service.startMatch(3, 9, { refereeId: "referee-7" }),
    (error) => error.code === "VALIDATION_ERROR" && /12/.test(error.message)
  );

  readinessRepository.listForCompetition = async () => [
    { participant_id: 11, checked_in: 1 },
    { participant_id: 12, checked_in: 1 }
  ];
  const started = await service.startMatch(3, 9, { refereeId: "referee-7" });
  assert.equal(started.match.status, "playing");
  assert.ok(started.participantReadiness.every(({ state }) => state === "ready"));
});
