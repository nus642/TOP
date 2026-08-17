const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const matchRepository = require("../repositories/match.repository");
const playerRepository = require("../repositories/player.repository");
const scheduleRepository = require("../repositories/match-schedule.repository");
const tournamentRepository = require("../repositories/tournament.repository");
const scheduleEditService = require("../services/schedule-edit.service");

const original = {
  withTransaction: db.withTransaction,
  getTournamentByIdWithConnection: tournamentRepository.getTournamentByIdWithConnection,
  getPlayerMap: playerRepository.getPlayerMap,
  findByIdForUpdate: matchRepository.findByIdForUpdate,
  updateMatchArrangement: matchRepository.updateMatchArrangement,
  deleteMatchById: matchRepository.deleteMatchById,
  createMatch: matchRepository.createMatch,
  findByMatch: scheduleRepository.findByMatch,
  findByMatchForUpdate: scheduleRepository.findByMatchForUpdate,
  create: scheduleRepository.create,
  updateByMatch: scheduleRepository.updateByMatch,
  deleteByMatch: scheduleRepository.deleteByMatch,
  findCourtTimeConflict: scheduleRepository.findCourtTimeConflict
};

const masterActor = { actorId: "master-1", actorType: "master" };

const playerMap = { A1: 11, A2: 12, A3: 13, A4: 14 };

const validBody = {
  roundNum: 2,
  court: "B2",
  scheduledAt: "2026-08-20T10:00:00Z",
  p1: "A1", p2: "A2", p3: "A3", p4: "A4"
};

test.beforeEach(() => {
  db.withTransaction = async (work) => work({});
  tournamentRepository.getTournamentByIdWithConnection = async (id) => ({ id, status: "draft" });
  playerRepository.getPlayerMap = async () => playerMap;
  scheduleRepository.findCourtTimeConflict = async () => null;
});

test.afterEach(() => {
  Object.assign(db, { withTransaction: original.withTransaction });
  tournamentRepository.getTournamentByIdWithConnection = original.getTournamentByIdWithConnection;
  playerRepository.getPlayerMap = original.getPlayerMap;
  matchRepository.findByIdForUpdate = original.findByIdForUpdate;
  matchRepository.updateMatchArrangement = original.updateMatchArrangement;
  matchRepository.deleteMatchById = original.deleteMatchById;
  matchRepository.createMatch = original.createMatch;
  scheduleRepository.findByMatch = original.findByMatch;
  scheduleRepository.findByMatchForUpdate = original.findByMatchForUpdate;
  scheduleRepository.create = original.create;
  scheduleRepository.updateByMatch = original.updateByMatch;
  scheduleRepository.deleteByMatch = original.deleteByMatch;
  scheduleRepository.findCourtTimeConflict = original.findCourtTimeConflict;
});

test("editMatch updates match and existing schedule row in one pass", async () => {
  scheduleRepository.findByMatchForUpdate = async () => ({ matchId: 5 });
  matchRepository.findByIdForUpdate = async () => ({ id: 5, status: "idle", round_num: 1 });
  const writes = [];
  matchRepository.updateMatchArrangement = async (tid, mid, data) => writes.push(["match", tid, mid, data]);
  scheduleRepository.updateByMatch = async (data) => writes.push(["schedule-update", data.courtId]);

  const result = await scheduleEditService.editMatch(1, 5, validBody, masterActor);

  assert.equal(result.success, true);
  assert.equal(writes[0][0], "match");
  assert.equal(writes[0][3].roundNum, 2);
  assert.equal(writes[0][3].player1Id, 11);
  assert.equal(writes[0][3].team1Name, "A1 & A2");
  assert.equal(writes[0][3].team2Name, "A3 & A4");
  assert.equal(writes[1][0], "schedule-update");
  assert.equal(writes[1][1], "B2");
});

test("editMatch creates schedule row when absent", async () => {
  scheduleRepository.findByMatchForUpdate = async () => null;
  matchRepository.findByIdForUpdate = async () => ({ id: 5, status: "idle", round_num: 1 });
  matchRepository.updateMatchArrangement = async () => {};
  let created = null;
  scheduleRepository.create = async (data) => { created = data; };

  await scheduleEditService.editMatch(1, 5, validBody, masterActor);

  assert.equal(created.matchId, 5);
  assert.equal(created.courtId, "B2");
});

test("editMatch keeps existing round when roundNum omitted", async () => {
  scheduleRepository.findByMatchForUpdate = async () => ({ matchId: 5 });
  matchRepository.findByIdForUpdate = async () => ({ id: 5, status: "idle", round_num: 7 });
  let saved = null;
  matchRepository.updateMatchArrangement = async (tid, mid, data) => { saved = data; };
  scheduleRepository.updateByMatch = async () => 1;

  const { roundNum, ...body } = validBody;
  const result = await scheduleEditService.editMatch(1, 5, body, masterActor);

  assert.equal(saved.roundNum, 7);
  assert.equal(result.roundNum, 7);
});

test("editMatch rejects a match already in execution", async () => {
  scheduleRepository.findByMatchForUpdate = async () => ({ matchId: 5 });
  matchRepository.findByIdForUpdate = async () => ({ id: 5, status: "playing", round_num: 1 });

  await assert.rejects(
    () => scheduleEditService.editMatch(1, 5, validBody, masterActor),
    /cannot be edited in status playing/
  );
});

test("editMatch rejects unknown player references", async () => {
  scheduleRepository.findByMatchForUpdate = async () => ({ matchId: 5 });
  matchRepository.findByIdForUpdate = async () => ({ id: 5, status: "idle", round_num: 1 });

  await assert.rejects(
    () => scheduleEditService.editMatch(1, 5, { ...validBody, p3: "GHOST" }, masterActor),
    /Unknown player reference: GHOST/
  );
});

test("editMatch rejects duplicate participants", async () => {
  scheduleRepository.findByMatchForUpdate = async () => ({ matchId: 5 });
  matchRepository.findByIdForUpdate = async () => ({ id: 5, status: "idle", round_num: 1 });

  await assert.rejects(
    () => scheduleEditService.editMatch(1, 5, { ...validBody, p4: "A1" }, masterActor),
    /Duplicate participant/
  );
});

test("editMatch rejects court-time conflicts", async () => {
  scheduleRepository.findByMatchForUpdate = async () => ({ matchId: 5 });
  matchRepository.findByIdForUpdate = async () => ({ id: 5, status: "idle", round_num: 1 });
  scheduleRepository.findCourtTimeConflict = async () => ({ match_id: 9 });

  await assert.rejects(
    () => scheduleEditService.editMatch(1, 5, validBody, masterActor),
    /Court-time conflict with match 9/
  );
});

test("arrangement mutations reject non-master actors", async () => {
  const referee = { actorId: "referee-1", actorType: "referee" };

  await assert.rejects(() => scheduleEditService.editMatch(1, 5, validBody, referee), { code: "FORBIDDEN" });
  await assert.rejects(() => scheduleEditService.addMatch(1, validBody, referee), { code: "FORBIDDEN" });
  await assert.rejects(() => scheduleEditService.deleteMatch(1, 5, referee), { code: "FORBIDDEN" });
});

test("addMatch creates match and authoritative schedule row", async () => {
  let createdMatch = null;
  let createdSchedule = null;
  matchRepository.createMatch = async (data) => { createdMatch = data; return { id: 77, ...data }; };
  scheduleRepository.create = async (data) => { createdSchedule = data; };

  const result = await scheduleEditService.addMatch(1, validBody, masterActor);

  assert.equal(result.matchId, 77);
  assert.equal(createdMatch.status, "idle");
  assert.equal(createdMatch.player4Id ?? createdMatch.player4_id, 14);
  assert.equal(createdMatch.team1_name, "A1 & A2");
  assert.equal(createdMatch.team2_name, "A3 & A4");
  assert.equal(createdSchedule.matchId, 77);
  assert.equal(createdSchedule.courtId, "B2");
});

test("deleteMatch locks schedules before matches and removes in correct order", async () => {
  const order = [];
  scheduleRepository.findByMatchForUpdate = async () => { order.push("schedule-lock"); };
  matchRepository.findByIdForUpdate = async () => { order.push("match-lock"); return { id: 5, status: "idle" }; };
  scheduleRepository.deleteByMatch = async () => order.push("schedule-delete");
  matchRepository.deleteMatchById = async () => order.push("match-delete");

  const result = await scheduleEditService.deleteMatch(1, 5, masterActor);

  assert.equal(result.success, true);
  assert.deepEqual(order, ["schedule-lock", "match-lock", "schedule-delete", "match-delete"]);
});

test("deleteMatch rejects executed matches", async () => {
  scheduleRepository.findByMatchForUpdate = async () => ({ matchId: 5 });
  matchRepository.findByIdForUpdate = async () => ({ id: 5, status: "confirmed" });

  await assert.rejects(
    () => scheduleEditService.deleteMatch(1, 5, masterActor),
    /cannot be deleted in status confirmed/
  );
});

test("editMatch rejects invalid ids and missing fields", async () => {
  await assert.rejects(() => scheduleEditService.editMatch("abc", 5, validBody, masterActor), { code: "VALIDATION_ERROR" });
  await assert.rejects(() => scheduleEditService.editMatch(1, 5, { ...validBody, court: "  " }, masterActor), /Court is required/);
  await assert.rejects(() => scheduleEditService.editMatch(1, 5, { ...validBody, scheduledAt: "nope" }, masterActor), /Invalid scheduled time/);
});
