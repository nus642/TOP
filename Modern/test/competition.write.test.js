const assert = require("node:assert/strict");
const test = require("node:test");

process.env.MYSQL_HOST = process.env.MYSQL_HOST || "localhost";

const db = require("../database/db");
const tournamentRepository = require("../repositories/tournament.repository");
const competitionService = require("../services/competition.service");

const original = {
    withTransaction: db.withTransaction,
    createTournament: tournamentRepository.createTournament,
    updateTournament: tournamentRepository.updateTournament,
    deleteTournament: tournamentRepository.deleteTournament
};

test.beforeEach(() => {
    db.withTransaction = async (work) => work({});
});

test.afterEach(() => {
    db.withTransaction = original.withTransaction;
    tournamentRepository.createTournament = original.createTournament;
    tournamentRepository.updateTournament = original.updateTournament;
    tournamentRepository.deleteTournament = original.deleteTournament;
});

test("POST service creates a competition", async () => {
    tournamentRepository.createTournament = async (data) => ({
        id: 12,
        ...data
    });

    const result = await competitionService.createCompetition({
        name: "Guangzhou Open",
        sport: "pickleball",
        status: "published"
    });

    assert.deepEqual(result, {
        competition: {
            id: 12,
            name: "Guangzhou Open",
            sport: "pickleball",
            status: "published"
        }
    });
});

test("POST service defaults status to draft", async () => {
    tournamentRepository.createTournament = async (data) => ({
        id: 13,
        ...data
    });

    const result = await competitionService.createCompetition({
        name: "Guangzhou Open",
        sport: "pickleball"
    });

    assert.equal(result.competition.status, "draft");
});

test("POST service rejects missing name", async () => {
    await assert.rejects(
        () => competitionService.createCompetition({ sport: "pickleball" }),
        { code: "VALIDATION_ERROR" }
    );
});

test("POST service rejects missing sport", async () => {
    await assert.rejects(
        () => competitionService.createCompetition({ name: "Guangzhou Open" }),
        { code: "VALIDATION_ERROR" }
    );
});

test("PUT service updates allowed fields", async () => {
    tournamentRepository.updateTournament = async (id, data) => ({
        id,
        name: data.name,
        sport: data.sport,
        status: data.status
    });

    const result = await competitionService.updateCompetition(21, {
        name: "Updated Open",
        sport: "pickleball",
        status: "active",
        ignored: "value"
    });

    assert.deepEqual(result, {
        competition: {
            id: 21,
            name: "Updated Open",
            sport: "pickleball",
            status: "active"
        }
    });
});

test("PUT service preserves unspecified fields", async () => {
    tournamentRepository.updateTournament = async (id, data) => {
        assert.deepEqual(data, { status: "active" });

        return {
            id,
            name: "Existing Open",
            sport: "pickleball",
            status: data.status
        };
    };

    const result = await competitionService.updateCompetition(22, {
        status: "active",
        name: undefined,
        sport: null
    });

    assert.deepEqual(result.competition, {
        id: 22,
        name: "Existing Open",
        sport: "pickleball",
        status: "active"
    });
});

test("PUT service returns not found for an unknown id", async () => {
    tournamentRepository.updateTournament = async () => null;

    await assert.rejects(
        () => competitionService.updateCompetition(999, { name: "Missing" }),
        { code: "NOT_FOUND" }
    );
});

test("DELETE service removes an existing competition", async () => {
    tournamentRepository.deleteTournament = async (id) => {
        assert.equal(id, 31);
        return true;
    };

    const result = await competitionService.deleteCompetition(31);

    assert.deepEqual(result, { success: true });
});

test("DELETE service returns not found for an unknown id", async () => {
    tournamentRepository.deleteTournament = async () => false;

    await assert.rejects(
        () => competitionService.deleteCompetition(999),
        { code: "NOT_FOUND" }
    );
});
