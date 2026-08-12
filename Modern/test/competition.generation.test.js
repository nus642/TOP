const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const competitionService = require("../services/competition.service");
const matchOperationsService = require("../services/match-operations.service");
const matchRepository = require("../repositories/match.repository");
const operationsRepository = require("../repositories/match-operation.repository");
const playerRepository = require("../repositories/player.repository");
const tournamentRepository = require("../repositories/tournament.repository");
const { generateRoundRobinMatches } = require("../engine/competition");
const competitionRouter = require("../api/competition");

function route(path, method) {
    return competitionRouter.stack.find((layer) => (
        layer.route?.path === path && layer.route.methods[method]
    )).route.stack[0].handle;
}

function response() {
    return {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.payload = payload; return this; }
    };
}

test("round-robin engine creates every unique pairing once across balanced rounds", () => {
    const matches = generateRoundRobinMatches([
        { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }
    ]);

    assert.equal(matches.length, 10);
    assert.equal(new Set(matches.map((match) => (
        [match.sideOneId, match.sideTwoId].sort((a, b) => a - b).join(":")
    ))).size, 10);

    for (const roundNumber of new Set(matches.map((match) => match.roundNumber))) {
        const roundParticipants = matches
            .filter((match) => match.roundNumber === roundNumber)
            .flatMap((match) => [match.sideOneId, match.sideTwoId]);
        assert.equal(new Set(roundParticipants).size, roundParticipants.length);
    }
});

test("match generation API delegates the scoped competition to the service", async (t) => {
    const original = competitionService.generateRoundRobin;
    t.after(() => { competitionService.generateRoundRobin = original; });
    const calls = [];
    competitionService.generateRoundRobin = async (...args) => {
        calls.push(args);
        return { competitionId: args[0], format: "round-robin", matches: [] };
    };

    const res = response();
    await route("/:competitionId/matches/generate", "post")({
        params: { competitionId: "17" },
        body: {}
    }, res);

    assert.deepEqual(calls, [[17]]);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.payload, {
        competitionId: 17,
        format: "round-robin",
        matches: []
    });
});

test("generated matches enter the unchanged Match Operations lifecycle", async (t) => {
    const originals = {
        transaction: db.withTransaction,
        tournament: tournamentRepository.getTournamentByIdWithConnection,
        players: playerRepository.getPlayersByTournament,
        createMatch: matchRepository.createMatch,
        find: operationsRepository.findById,
        assign: operationsRepository.assign,
        accept: operationsRepository.acceptResponsibility,
        score: operationsRepository.recordScore
    };
    t.after(() => {
        db.withTransaction = originals.transaction;
        tournamentRepository.getTournamentByIdWithConnection = originals.tournament;
        playerRepository.getPlayersByTournament = originals.players;
        matchRepository.createMatch = originals.createMatch;
        operationsRepository.findById = originals.find;
        operationsRepository.assign = originals.assign;
        operationsRepository.acceptResponsibility = originals.accept;
        operationsRepository.recordScore = originals.score;
    });

    const connection = { transaction: true };
    const stored = new Map();
    let nextId = 1;
    db.withTransaction = (work) => work(connection);
    tournamentRepository.getTournamentByIdWithConnection = async () => ({ id: 7 });
    playerRepository.getPlayersByTournament = async () => [{ id: 11 }, { id: 12 }, { id: 13 }];
    matchRepository.createMatch = async (match) => {
        assert.notEqual(match.court, null, "matches.court must satisfy the persistence constraint");
        assert.equal(match.court, "", "unscheduled matches must not claim a court assignment");
        const created = { id: nextId++, tournamentId: match.tournament_id, refereeId: null, ...match };
        stored.set(created.id, created);
        return created;
    };
    operationsRepository.findById = async (_tournamentId, matchId) => stored.get(matchId) || null;
    operationsRepository.assign = async (_tid, matchId, refereeId) => {
        const match = { ...stored.get(matchId), refereeId, status: "assigned" };
        stored.set(matchId, match);
        return match;
    };
    operationsRepository.acceptResponsibility = async (_tid, matchId) => {
        const match = { ...stored.get(matchId), status: "playing" };
        stored.set(matchId, match);
        return match;
    };
    operationsRepository.recordScore = async (_tid, matchId, score1, score2) => {
        const match = { ...stored.get(matchId), score1, score2, status: "scored" };
        stored.set(matchId, match);
        return match;
    };

    const generation = await competitionService.generateRoundRobin(7);
    assert.equal(generation.matches.length, 3);
    assert.ok(generation.matches.every((match) => match.status === "idle"));
    assert.ok(generation.matches.every((match) => match.court === ""));

    const matchId = generation.matches[0].id;
    await matchOperationsService.assignMatch(7, matchId, { refereeId: "referee-4" });
    await matchOperationsService.acceptRefereeResponsibility(7, matchId, { refereeId: "referee-4" });
    const result = await matchOperationsService.recordScore(7, matchId, {
        refereeId: "referee-4", score1: 11, score2: 6
    });

    assert.equal(result.match.status, "scored");
    assert.deepEqual([result.match.score1, result.match.score2], [11, 6]);
});
