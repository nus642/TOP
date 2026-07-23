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
    getPlayerByIdForTournament: playerRepository.getPlayerByIdForTournament,
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
    playerRepository.getPlayerByIdForTournament = original.getPlayerByIdForTournament;
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
