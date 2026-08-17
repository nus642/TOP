const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const checkinRepository = require("../repositories/checkin.repository");
const playerRepository = require("../repositories/player.repository");
const tournamentRepository = require("../repositories/tournament.repository");
const waiverRepository = require("../repositories/waiver.repository");
const checkinService = require("../services/checkin.service");

const original = {
    withTransaction: db.withTransaction,
    getCheckInState: checkinRepository.getCheckInState,
    upsertCheckInState: checkinRepository.upsertCheckInState,
    bulkUpsertReadiness: checkinRepository.bulkUpsertReadiness,
    getPlayerByIdForTournament: playerRepository.getPlayerByIdForTournament,
    getPlayersByTournament: playerRepository.getPlayersByTournament,
    getTournamentByIdWithConnection: tournamentRepository.getTournamentByIdWithConnection,
    createWaiver: waiverRepository.createWaiver,
    getLatestWaiver: waiverRepository.getLatestWaiver
};

test.beforeEach(() => {
    db.withTransaction = async (work) => work({});
    tournamentRepository.getTournamentByIdWithConnection = async (id) => ({ id });
    playerRepository.getPlayerByIdForTournament = async (competitionId, playerId) => ({
        id: playerId,
        tournament_id: competitionId,
        name: "Ada"
    });
    checkinRepository.getCheckInState = async () => null;
    waiverRepository.getLatestWaiver = async () => null;
});

test.afterEach(() => {
    db.withTransaction = original.withTransaction;
    checkinRepository.getCheckInState = original.getCheckInState;
    checkinRepository.upsertCheckInState = original.upsertCheckInState;
    checkinRepository.bulkUpsertReadiness = original.bulkUpsertReadiness;
    playerRepository.getPlayerByIdForTournament = original.getPlayerByIdForTournament;
    playerRepository.getPlayersByTournament = original.getPlayersByTournament;
    tournamentRepository.getTournamentByIdWithConnection = original.getTournamentByIdWithConnection;
    waiverRepository.createWaiver = original.createWaiver;
    waiverRepository.getLatestWaiver = original.getLatestWaiver;
});

test("checkInPlayer creates waiver and check-in state", async () => {
    const calls = [];

    waiverRepository.createWaiver = async (data) => {
        calls.push(["waiver", data.competitionId, data.playerId, data.waiverVersion]);
        return { id: 10, tournament_id: data.competitionId, player_id: data.playerId };
    };
    checkinRepository.upsertCheckInState = async (data) => {
        calls.push(["check-in", data.competitionId, data.playerId, data.checkedIn]);
        return { id: 11, checked_in: 1, player_id: data.playerId };
    };

    const result = await checkinService.checkInPlayer(1, 2, {
        acceptWaiver: true,
        waiverVersion: "2026-07",
        acceptedBy: " Ada "
    });

    assert.equal(result.player.id, 2);
    assert.equal(result.waiver.id, 10);
    assert.equal(result.checkIn.checked_in, 1);
    assert.deepEqual(calls, [
        ["waiver", 1, 2, "2026-07"],
        ["check-in", 1, 2, true]
    ]);
});

test("acceptWaiver persists a waiver record", async () => {
    waiverRepository.createWaiver = async (data) => ({
        id: 20,
        tournament_id: data.competitionId,
        player_id: data.playerId,
        waiver_version: data.waiverVersion,
        accepted_by: data.acceptedBy
    });

    const result = await checkinService.acceptWaiver(3, 4, {
        acceptWaiver: true,
        waiverVersion: "v2"
    });

    assert.deepEqual(result.waiver, {
        id: 20,
        tournament_id: 3,
        player_id: 4,
        waiver_version: "v2",
        accepted_by: "Ada"
    });
});

test("checkInPlayer rejects unknown competition", async () => {
    tournamentRepository.getTournamentByIdWithConnection = async () => null;

    await assert.rejects(
        () => checkinService.checkInPlayer(404, 2, { acceptWaiver: true }),
        { code: "NOT_FOUND" }
    );
});

test("checkInPlayer rejects unknown player", async () => {
    playerRepository.getPlayerByIdForTournament = async () => null;

    await assert.rejects(
        () => checkinService.checkInPlayer(1, 404, { acceptWaiver: true }),
        { code: "NOT_FOUND" }
    );
});

test("checkInPlayer is idempotent when waiver already exists", async () => {
    let waiversCreated = 0;

    waiverRepository.getLatestWaiver = async () => ({ id: 30, player_id: 5 });
    waiverRepository.createWaiver = async () => {
        waiversCreated += 1;
        return { id: 31 };
    };
    checkinRepository.upsertCheckInState = async (data) => ({
        id: 32,
        checked_in: 1,
        player_id: data.playerId
    });

    const result = await checkinService.checkInPlayer(1, 5, {});

    assert.equal(result.waiver.id, 30);
    assert.equal(result.checkIn.player_id, 5);
    assert.equal(waiversCreated, 0);
});

test("getCheckInStatus returns unchecked status without a row", async () => {
    waiverRepository.getLatestWaiver = async () => ({ id: 40 });

    const result = await checkinService.getCheckInStatus(1, 2);

    assert.equal(result.checkedIn, false);
    assert.equal(result.checkIn, null);
    assert.deepEqual(result.waiver, { id: 40 });
});

test("checkInPlayer rejects missing waiver acceptance", async () => {
    await assert.rejects(
        () => checkinService.checkInPlayer(1, 2, {}),
        { code: "VALIDATION_ERROR" }
    );
});

test("checkInAll bulk checks in every registered player without waivers", async () => {
    playerRepository.getPlayersByTournament = async (competitionId) => [
        { id: 101, tournament_id: competitionId, name: "P1" },
        { id: 102, tournament_id: competitionId, name: "P2" },
        { id: 103, tournament_id: competitionId, name: "P3" }
    ];
    const calls = [];
    checkinRepository.bulkUpsertReadiness = async (competitionId, playerIds, source) => {
        calls.push([competitionId, playerIds, source]);
    };
    waiverRepository.createWaiver = async () => {
        throw new Error("bulk check-in must not create waivers");
    };

    const result = await checkinService.checkInAll(7, { actorId: "master-1", actorType: "master" });

    assert.equal(result.competitionId, 7);
    assert.equal(result.checkedInCount, 3);
    assert.deepEqual(calls, [[7, [101, 102, 103], "master-bulk-check-in"]]);
});

test("checkInAll is idempotent across repeated runs", async () => {
    playerRepository.getPlayersByTournament = async () => [{ id: 101 }, { id: 102 }];
    checkinRepository.bulkUpsertReadiness = async () => {};

    const first = await checkinService.checkInAll(7, { actorType: "master" });
    const second = await checkinService.checkInAll(7, { actorType: "master" });

    assert.equal(first.checkedInCount, 2);
    assert.equal(second.checkedInCount, 2);
});

test("checkInAll rejects non-master actors", async () => {
    await assert.rejects(
        () => checkinService.checkInAll(7, { actorId: "referee-1", actorType: "referee" }),
        { code: "FORBIDDEN" }
    );
});

test("checkInAll rejects unknown competition", async () => {
    tournamentRepository.getTournamentByIdWithConnection = async () => null;

    await assert.rejects(
        () => checkinService.checkInAll(404, { actorType: "master" }),
        { code: "NOT_FOUND" }
    );
});

test("checkInAll tolerates an empty roster", async () => {
    playerRepository.getPlayersByTournament = async () => [];
    checkinRepository.bulkUpsertReadiness = async () => {
        throw new Error("bulk upsert must not run for an empty roster");
    };

    const result = await checkinService.checkInAll(7, { actorType: "master" });

    assert.equal(result.checkedInCount, 0);
});

test("checkInAll rejects invalid competition id", async () => {
    await assert.rejects(
        () => checkinService.checkInAll("abc", { actorType: "master" }),
        { code: "VALIDATION_ERROR" }
    );
});
