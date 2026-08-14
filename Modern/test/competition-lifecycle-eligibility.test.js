const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const tournamentRepository = require("../repositories/tournament.repository");
const matchRepository = require("../repositories/match-operation.repository");
const officialRecordRepository = require("../repositories/match-official-record.repository");
const publicRepository = require("../repositories/public-match-scoreboard.repository");
const archiveRepository = require("../repositories/competition-archive.repository");
const matchOperations = require("../services/match-operations.service");
const publicScoreboard = require("../services/public-match-scoreboard.service");
const competitionArchive = require("../services/competition-archive.service");
const {
  ELIGIBLE_STATES,
  assertCompetitionLifecycleEligible
} = require("../services/competition-lifecycle-eligibility");
const { COMPETITION_LIFECYCLE_STATES: STATES } = require("../engine/competition");

const ALL_STATES = Object.values(STATES);
const POLICY = {
  refereeAssignment: [STATES.READY, STATES.RUNNING],
  responsibilityAcceptance: [STATES.READY, STATES.RUNNING],
  matchStart: [STATES.RUNNING],
  scoreSubmission: [STATES.RUNNING],
  resultConfirmation: [STATES.RUNNING],
  publicScoreboard: [STATES.READY, STATES.RUNNING, STATES.COMPLETED, STATES.ARCHIVED],
  competitionArchive: [STATES.COMPLETED, STATES.ARCHIVED]
};

test("central eligibility assertion implements every positive and negative policy cell", () => {
  assert.deepEqual(ELIGIBLE_STATES, POLICY);
  for (const [capability, allowed] of Object.entries(POLICY)) {
    for (const state of ALL_STATES) {
      if (allowed.includes(state)) {
        assert.equal(assertCompetitionLifecycleEligible(state, capability), state,
          `${capability} should be available in ${state}`);
      } else {
        assert.throws(
          () => assertCompetitionLifecycleEligible(state, capability),
          error => error.code === "VALIDATION_ERROR",
          `${capability} should be rejected in ${state}`
        );
      }
    }
  }
});

test("every Match Operations mutation locks and reads the tournament in its transaction", async (t) => {
  const originals = {
    transaction: db.withTransaction,
    tournament: tournamentRepository.getTournamentByIdForUpdate,
    match: matchRepository.findById
  };
  t.after(() => {
    db.withTransaction = originals.transaction;
    tournamentRepository.getTournamentByIdForUpdate = originals.tournament;
    matchRepository.findById = originals.match;
  });

  const connection = { transaction: true };
  db.withTransaction = work => work(connection);
  matchRepository.findById = async () => assert.fail("match must not be read after lifecycle rejection");

  const calls = [];
  tournamentRepository.getTournamentByIdForUpdate = async (id, usedConnection) => {
    calls.push([id, usedConnection]);
    return { id, status: STATES.DRAFT };
  };

  const mutations = [
    () => matchOperations.assignMatch(3, 9, { refereeId: "referee-1" }),
    () => matchOperations.acceptRefereeResponsibility(3, 9, { refereeId: "referee-1" }),
    () => matchOperations.startMatch(3, 9, { refereeId: "referee-1" }),
    () => matchOperations.recordScore(3, 9, { refereeId: "referee-1", score1: 11, score2: 8 }),
    () => matchOperations.submitResult(3, 9, { actorId: "referee-1", actorType: "referee" }, { score1: 11, score2: 8 }),
    () => matchOperations.confirmResult(3, 9, { actorId: "master-1", actorType: "master" })
  ];

  for (const mutate of mutations) {
    await assert.rejects(mutate(), error => error.code === "VALIDATION_ERROR");
  }
  assert.equal(calls.length, mutations.length);
  assert.ok(calls.every(([id, usedConnection]) => id === 3 && usedConnection === connection));
});

test("rejected result confirmation creates no Official Record", async (t) => {
  const originals = {
    transaction: db.withTransaction,
    tournament: tournamentRepository.getTournamentByIdForUpdate,
    match: matchRepository.findById,
    create: officialRecordRepository.create
  };
  t.after(() => {
    db.withTransaction = originals.transaction;
    tournamentRepository.getTournamentByIdForUpdate = originals.tournament;
    matchRepository.findById = originals.match;
    officialRecordRepository.create = originals.create;
  });

  const connection = { transaction: true };
  db.withTransaction = work => work(connection);
  tournamentRepository.getTournamentByIdForUpdate = async () => ({ id: 3, status: STATES.COMPLETED });
  matchRepository.findById = async () => assert.fail("match must not be read after lifecycle rejection");
  let officialRecordsCreated = 0;
  officialRecordRepository.create = async () => { officialRecordsCreated += 1; };

  await assert.rejects(
    matchOperations.confirmResult(3, 9, { actorId: "master-1", actorType: "master" }),
    error => error.code === "VALIDATION_ERROR"
  );
  assert.equal(officialRecordsCreated, 0);
});

test("Public Scoreboard and Competition Archive hide unavailable lifecycle projections", async (t) => {
  const originals = {
    tournament: tournamentRepository.getTournamentById,
    publicFind: publicRepository.findByCompetitionId,
    archiveFind: archiveRepository.findByCompetitionId
  };
  t.after(() => {
    tournamentRepository.getTournamentById = originals.tournament;
    publicRepository.findByCompetitionId = originals.publicFind;
    archiveRepository.findByCompetitionId = originals.archiveFind;
  });

  let projectionReads = 0;
  publicRepository.findByCompetitionId = async () => { projectionReads += 1; return []; };
  archiveRepository.findByCompetitionId = async () => {
    projectionReads += 1;
    return { competition: { competition_status: STATES.READY }, matches: [], standings: [] };
  };
  tournamentRepository.getTournamentById = async () => ({ id: 3, status: STATES.DRAFT });

  await assert.rejects(publicScoreboard.getPublicMatches(3), error => error.code === "NOT_FOUND");
  await assert.rejects(competitionArchive.getCompetitionArchive(3), error => error.code === "NOT_FOUND");
  assert.equal(projectionReads, 1, "scoreboard is gated before its projection; archive reads its authoritative projection once");
});
