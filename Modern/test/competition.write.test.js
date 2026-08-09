const assert = require("node:assert/strict");
const test = require("node:test");

process.env.MYSQL_HOST = process.env.MYSQL_HOST || "localhost";

const db = require("../database/db");
const tournamentRepository = require("../repositories/tournament.repository");
const pairingRepository = require("../repositories/pairing.repository");
const matchRepository = require("../repositories/match.repository");
const playerRepository = require("../repositories/player.repository");
const competitionService = require("../services/competition.service");

const original = {
    withTransaction: db.withTransaction,
    createTournament: tournamentRepository.createTournament,
    updateTournament: tournamentRepository.updateTournament,
    deleteTournament: tournamentRepository.deleteTournament,
    getTournamentByIdWithConnection: tournamentRepository.getTournamentByIdWithConnection,
    getTournamentByIdForUpdate: tournamentRepository.getTournamentByIdForUpdate,
    updateLifecycleState: tournamentRepository.updateLifecycleState,
    updateTournamentName: tournamentRepository.updateTournamentName,
    deletePairingsByTournament: pairingRepository.deletePairingsByTournament,
    createPairing: pairingRepository.createPairing,
    deleteMatchesByTournament: matchRepository.deleteMatchesByTournament,
    createMatch: matchRepository.createMatch,
    updateMatchScore: matchRepository.updateMatchScore,
    deletePlayersByTournament: playerRepository.deletePlayersByTournament,
    deletePlayerPartnersByTournament: playerRepository.deletePlayerPartnersByTournament,
    deletePlayerOpponentsByTournament: playerRepository.deletePlayerOpponentsByTournament,
    createPlayer: playerRepository.createPlayer,
    getPlayerMap: playerRepository.getPlayerMap,
    resetPlayerRuntimeStatsByTournament: playerRepository.resetPlayerRuntimeStatsByTournament
};

test.beforeEach(() => {
    db.withTransaction = async (work) => work({});
});

test.afterEach(() => {
    db.withTransaction = original.withTransaction;
    tournamentRepository.createTournament = original.createTournament;
    tournamentRepository.updateTournament = original.updateTournament;
    tournamentRepository.deleteTournament = original.deleteTournament;
    tournamentRepository.getTournamentByIdWithConnection = original.getTournamentByIdWithConnection;
    tournamentRepository.getTournamentByIdForUpdate = original.getTournamentByIdForUpdate;
    tournamentRepository.updateLifecycleState = original.updateLifecycleState;
    tournamentRepository.updateTournamentName = original.updateTournamentName;
    pairingRepository.deletePairingsByTournament = original.deletePairingsByTournament;
    pairingRepository.createPairing = original.createPairing;
    matchRepository.deleteMatchesByTournament = original.deleteMatchesByTournament;
    matchRepository.createMatch = original.createMatch;
    matchRepository.updateMatchScore = original.updateMatchScore;
    playerRepository.deletePlayersByTournament = original.deletePlayersByTournament;
    playerRepository.deletePlayerPartnersByTournament = original.deletePlayerPartnersByTournament;
    playerRepository.deletePlayerOpponentsByTournament = original.deletePlayerOpponentsByTournament;
    playerRepository.createPlayer = original.createPlayer;
    playerRepository.getPlayerMap = original.getPlayerMap;
    playerRepository.resetPlayerRuntimeStatsByTournament = original.resetPlayerRuntimeStatsByTournament;
});


function stubScheduleLifecycleWrites(calls) {
    tournamentRepository.updateTournamentName = async (id, name, activeConnection) => {
        calls.push(["updateTournamentName", id, name, activeConnection]);
    };
    matchRepository.deleteMatchesByTournament = async (id, activeConnection) => {
        calls.push(["deleteMatches", id, activeConnection]);
    };
    pairingRepository.deletePairingsByTournament = async (id, activeConnection) => {
        calls.push(["deletePairings", id, activeConnection]);
    };
    playerRepository.deletePlayersByTournament = async (id, activeConnection) => {
        calls.push(["deletePlayers", id, activeConnection]);
    };
    playerRepository.deletePlayerPartnersByTournament = async (id, activeConnection) => {
        calls.push(["deletePartners", id, activeConnection]);
    };
    playerRepository.deletePlayerOpponentsByTournament = async (id, activeConnection) => {
        calls.push(["deleteOpponents", id, activeConnection]);
    };
    playerRepository.createPlayer = async (player, activeConnection) => {
        calls.push(["createPlayer", player.tournament_id, player.name, activeConnection]);
        return { id: player.name === "Ada" ? 7 : 8, ...player };
    };
    playerRepository.getPlayerMap = async (id, activeConnection) => {
        calls.push(["getPlayerMap", id, activeConnection]);
        return { Ada: 7, Lin: 8 };
    };
    pairingRepository.createPairing = async (pairing, activeConnection) => {
        calls.push(["createPairing", pairing.tournament_id, pairing.player1_id, pairing.player2_id, activeConnection]);
    };
    matchRepository.createMatch = async (match, activeConnection) => {
        calls.push(["createMatch", match.tournament_id, match.player1_id, match.player2_id, activeConnection]);
    };
}

const lifecyclePayload = {
    tournamentName: "Summer Open",
    mode: "fixed-pair",
    players: [
        { name: "Ada", lv: 4, paired: true },
        { name: "Lin", lv: 3, paired: true }
    ],
    pairs: [{ name: "Ada & Lin" }],
    rounds: [[{
        court: "Court 1",
        p1: "Ada",
        p2: "Lin",
        p3: "Ada",
        p4: "Lin",
        team1: "Ada & Lin",
        team2: "Ada & Lin"
    }]]
};


test("updateMatch scopes score updates to the supplied competition", async () => {
    const connection = { marker: "transaction" };
    const calls = [];

    db.withTransaction = async (work) => work(connection);
    matchRepository.updateMatchScore = async (tournamentId, matchId, score1, score2, status, activeConnection) => {
        calls.push(["updateMatchScore", tournamentId, matchId, score1, score2, status, activeConnection]);
        return { affectedRows: 1 };
    };
    playerRepository.resetPlayerRuntimeStatsByTournament = async (tournamentId, activeConnection) => {
        calls.push(["resetRuntimeStats", tournamentId, activeConnection]);
    };

    const result = await competitionService.updateMatch(7, 42, 11, 9, "finished");

    assert.deepEqual(result, { success: true });
    assert.deepEqual(calls, [
        ["updateMatchScore", 7, 42, 11, 9, "finished", connection],
        ["resetRuntimeStats", 7, connection]
    ]);
});

test("updateMatch rejects matches outside the supplied competition", async () => {
    let resetCalled = false;

    matchRepository.updateMatchScore = async () => ({ affectedRows: 0 });
    playerRepository.resetPlayerRuntimeStatsByTournament = async () => {
        resetCalled = true;
    };

    await assert.rejects(
        () => competitionService.updateMatch(7, 42, 11, 9, "finished"),
        { code: "NOT_FOUND" }
    );

    assert.equal(resetCalled, false);
});

test("POST service creates competitions in draft regardless of supplied state", async () => {
    tournamentRepository.createTournament = async (data) => ({ id: 12, ...data });
    const result = await competitionService.createCompetition({
        name: "Guangzhou Open", sport: "pickleball", status: "running"
    });
    assert.equal(result.competition.status, "draft");
});

test("POST service defaults status to draft", async () => {
    tournamentRepository.createTournament = async (data) => ({ id: 13, ...data });
    const result = await competitionService.createCompetition({ name: "Open", sport: "pickleball" });
    assert.equal(result.competition.status, "draft");
});

test("POST service validates required facts", async () => {
    await assert.rejects(() => competitionService.createCompetition({ sport: "pickleball" }), { code: "VALIDATION_ERROR" });
    await assert.rejects(() => competitionService.createCompetition({ name: "Open" }), { code: "VALIDATION_ERROR" });
});

test("PUT service cannot bypass lifecycle authority", async () => {
    tournamentRepository.updateTournament = async (id, data) => ({ id, ...data, status: "draft" });
    const result = await competitionService.updateCompetition(21, {
        name: "Updated Open", sport: "pickleball", status: "archived"
    });
    assert.deepEqual(result.competition, {
        id: 21, name: "Updated Open", sport: "pickleball", status: "draft"
    });
});

test("transitionCompetition persists a valid lifecycle transition", async () => {
    const connection = { marker: "transaction" };
    db.withTransaction = async (work) => work(connection);
    tournamentRepository.getTournamentByIdForUpdate = async (id, active) => {
        assert.equal(active, connection);
        return { id, status: "ready" };
    };
    tournamentRepository.updateLifecycleState = async (id, state, active) => {
        assert.equal(active, connection);
        return { id, status: state };
    };
    const result = await competitionService.transitionCompetitionState(73, "running");
    assert.equal(result.competition.status, "running");
});

test("transitionCompetition rejects invalid transitions including completed to running", async () => {
    tournamentRepository.getTournamentByIdForUpdate = async () => ({ id: 75, status: "completed" });
    await assert.rejects(
        () => competitionService.transitionCompetitionState(75, "running"),
        { code: "VALIDATION_ERROR" }
    );
});

test("transitionCompetition rejects unknown states", async () => {
    tournamentRepository.getTournamentByIdForUpdate = async () => ({ id: 77, status: "draft" });
    await assert.rejects(
        () => competitionService.transitionCompetitionState(77, "unknown"),
        { code: "VALIDATION_ERROR" }
    );
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


test("registerPlayer creates a player for an existing competition", async () => {
    const saved = {
        getTournamentByIdWithConnection: tournamentRepository.getTournamentByIdWithConnection,
    getTournamentByIdForUpdate: tournamentRepository.getTournamentByIdForUpdate,
    updateLifecycleState: tournamentRepository.updateLifecycleState,
        createPlayer: playerRepository.createPlayer
    };

    tournamentRepository.getTournamentByIdWithConnection = async (id) => ({
        id,
        name: "Registration Open"
    });
    playerRepository.createPlayer = async (data) => ({
        id: 44,
        ...data
    });

    const result = await competitionService.registerPlayer(41, {
        name: " Ada ",
        level: 4,
        paired: true
    });

    assert.deepEqual(result, {
        player: {
            id: 44,
            tournament_id: 41,
            name: "Ada",
            level: 4,
            paired: true
        }
    });

    tournamentRepository.getTournamentByIdWithConnection = saved.getTournamentByIdWithConnection;
    playerRepository.createPlayer = saved.createPlayer;
});

test("registerPlayer rejects an unknown competition", async () => {
    const saved = tournamentRepository.getTournamentByIdWithConnection;
    tournamentRepository.getTournamentByIdWithConnection = async () => null;

    await assert.rejects(
        () => competitionService.registerPlayer(404, { name: "Ada" }),
        { code: "NOT_FOUND" }
    );

    tournamentRepository.getTournamentByIdWithConnection = saved;
});

test("withdrawPlayer removes a player from an existing competition", async () => {
    const saved = {
        getTournamentByIdWithConnection: tournamentRepository.getTournamentByIdWithConnection,
    getTournamentByIdForUpdate: tournamentRepository.getTournamentByIdForUpdate,
    updateLifecycleState: tournamentRepository.updateLifecycleState,
        getPlayerByIdForTournament: playerRepository.getPlayerByIdForTournament,
        deletePlayerRelations: playerRepository.deletePlayerRelations,
        deletePlayerByTournament: playerRepository.deletePlayerByTournament
    };
    const savedPairing = pairingRepository.deletePairingsByPlayer;
    const calls = [];

    tournamentRepository.getTournamentByIdWithConnection = async (id) => ({ id });
    playerRepository.getPlayerByIdForTournament = async (competitionId, playerId) => ({
        id: playerId,
        tournament_id: competitionId
    });
    pairingRepository.deletePairingsByPlayer = async (competitionId, playerId) => {
        calls.push(["pairings", competitionId, playerId]);
    };
    playerRepository.deletePlayerRelations = async (competitionId, playerId) => {
        calls.push(["relations", competitionId, playerId]);
    };
    playerRepository.deletePlayerByTournament = async (competitionId, playerId) => {
        calls.push(["player", competitionId, playerId]);
        return true;
    };

    const result = await competitionService.withdrawPlayer(51, 52);

    assert.deepEqual(result, { success: true });
    assert.deepEqual(calls, [
        ["pairings", 51, 52],
        ["relations", 51, 52],
        ["player", 51, 52]
    ]);

    tournamentRepository.getTournamentByIdWithConnection = saved.getTournamentByIdWithConnection;
    pairingRepository.deletePairingsByPlayer = savedPairing;
    playerRepository.getPlayerByIdForTournament = saved.getPlayerByIdForTournament;
    playerRepository.deletePlayerRelations = saved.deletePlayerRelations;
    playerRepository.deletePlayerByTournament = saved.deletePlayerByTournament;
});

test("withdrawPlayer rejects an unknown player", async () => {
    const saved = {
        getTournamentByIdWithConnection: tournamentRepository.getTournamentByIdWithConnection,
    getTournamentByIdForUpdate: tournamentRepository.getTournamentByIdForUpdate,
    updateLifecycleState: tournamentRepository.updateLifecycleState,
        getPlayerByIdForTournament: playerRepository.getPlayerByIdForTournament
    };

    tournamentRepository.getTournamentByIdWithConnection = async (id) => ({ id });
    playerRepository.getPlayerByIdForTournament = async () => null;

    await assert.rejects(
        () => competitionService.withdrawPlayer(61, 62),
        { code: "NOT_FOUND" }
    );

    tournamentRepository.getTournamentByIdWithConnection = saved.getTournamentByIdWithConnection;
    playerRepository.getPlayerByIdForTournament = saved.getPlayerByIdForTournament;
});


for (const [methodName, invoke] of [
    ["saveSchedule", (id) => competitionService.saveSchedule(id, lifecyclePayload)],
    ["resetCompetition", (id) => competitionService.resetCompetition(id)],
    ["generateCompetition", (id) => competitionService.generateCompetition(id, lifecyclePayload)]
]) {
    test(`${methodName} rejects invalid competition ids before lifecycle writes`, async () => {
        const calls = [];
        let transactionStarted = false;

        db.withTransaction = async (work) => {
            transactionStarted = true;
            return work({});
        };
        stubScheduleLifecycleWrites(calls);

        await assert.rejects(
            () => invoke(undefined),
            { code: "VALIDATION_ERROR" }
        );
        await assert.rejects(
            () => invoke("abc"),
            { code: "VALIDATION_ERROR" }
        );

        assert.equal(transactionStarted, false);
        assert.deepEqual(calls, []);
    });

    test(`${methodName} rejects unknown competitions before lifecycle writes`, async () => {
        const connection = { marker: "transaction" };
        const calls = [];

        db.withTransaction = async (work) => work(connection);
        tournamentRepository.getTournamentByIdWithConnection = async (id, activeConnection) => {
            assert.equal(id, 999);
            assert.equal(activeConnection, connection);
            return null;
        };
        stubScheduleLifecycleWrites(calls);

        await assert.rejects(
            () => invoke(999),
            { code: "NOT_FOUND" }
        );

        assert.deepEqual(calls, []);
    });
}

test("saveSchedule propagates the existing lifecycle transaction connection", async () => {
    const connection = { marker: "transaction" };
    const calls = [];

    db.withTransaction = async (work) => work(connection);
    tournamentRepository.getTournamentByIdWithConnection = async (id, activeConnection) => {
        assert.equal(id, 7);
        assert.equal(activeConnection, connection);
        return { id };
    };
    tournamentRepository.updateTournamentName = async (id, name, activeConnection) => {
        calls.push(["updateTournamentName", id, name, activeConnection]);
    };
    matchRepository.deleteMatchesByTournament = async (id, activeConnection) => {
        calls.push(["deleteMatches", id, activeConnection]);
    };
    pairingRepository.deletePairingsByTournament = async (id, activeConnection) => {
        calls.push(["deletePairings", id, activeConnection]);
    };
    playerRepository.deletePlayersByTournament = async (id, activeConnection) => {
        calls.push(["deletePlayers", id, activeConnection]);
    };
    playerRepository.deletePlayerPartnersByTournament = async (id, activeConnection) => {
        calls.push(["deletePartners", id, activeConnection]);
    };
    playerRepository.deletePlayerOpponentsByTournament = async (id, activeConnection) => {
        calls.push(["deleteOpponents", id, activeConnection]);
    };
    playerRepository.createPlayer = async (player, activeConnection) => {
        calls.push(["createPlayer", player.tournament_id, player.name, activeConnection]);
        return { id: player.name === "Ada" ? 7 : 8, ...player };
    };
    playerRepository.getPlayerMap = async (id, activeConnection) => {
        calls.push(["getPlayerMap", id, activeConnection]);
        return { Ada: 7, Lin: 8 };
    };
    pairingRepository.createPairing = async (pairing, activeConnection) => {
        calls.push(["createPairing", pairing.tournament_id, pairing.player1_id, pairing.player2_id, activeConnection]);
    };
    matchRepository.createMatch = async (match, activeConnection) => {
        calls.push(["createMatch", match.tournament_id, match.player1_id, match.player2_id, activeConnection]);
    };

    const competitionId = 7;

    const result = await competitionService.saveSchedule(competitionId, {
        tournamentName: "Summer Open",
        mode: "fixed-pair",
        players: [
            { name: "Ada", lv: 4, paired: true },
            { name: "Lin", lv: 3, paired: true }
        ],
        pairs: [{ name: "Ada & Lin" }],
        rounds: [[{
            court: "Court 1",
            p1: "Ada",
            p2: "Lin",
            p3: "Ada",
            p4: "Lin",
            team1: "Ada & Lin",
            team2: "Ada & Lin"
        }]]
    });

    assert.equal(result.success, true);
    assert.deepEqual(
        calls.map(([name]) => name),
        [
            "updateTournamentName",
            "deleteMatches",
            "deletePairings",
            "deletePlayers",
            "deletePartners",
            "deleteOpponents",
            "createPlayer",
            "createPlayer",
            "getPlayerMap",
            "createPairing",
            "createMatch"
        ]
    );
    assert.ok(calls.every((call) => call.at(-1) === connection));
    assert.ok(calls.every((call) => {
        if (["updateTournamentName", "deleteMatches", "deletePairings", "deletePlayers", "deletePartners", "deleteOpponents", "getPlayerMap"].includes(call[0])) {
            return call[1] === competitionId;
        }

        return call[1] === competitionId;
    }));
});

test("resetCompetition propagates the existing lifecycle transaction connection", async () => {
    const connection = { marker: "transaction" };
    const calls = [];

    db.withTransaction = async (work) => work(connection);
    tournamentRepository.getTournamentByIdWithConnection = async (id, activeConnection) => {
        assert.equal(id, 7);
        assert.equal(activeConnection, connection);
        return { id };
    };
    matchRepository.deleteMatchesByTournament = async (id, activeConnection) => {
        calls.push(["deleteMatches", id, activeConnection]);
    };
    pairingRepository.deletePairingsByTournament = async (id, activeConnection) => {
        calls.push(["deletePairings", id, activeConnection]);
    };
    playerRepository.deletePlayersByTournament = async (id, activeConnection) => {
        calls.push(["deletePlayers", id, activeConnection]);
    };
    playerRepository.deletePlayerPartnersByTournament = async (id, activeConnection) => {
        calls.push(["deletePartners", id, activeConnection]);
    };
    playerRepository.deletePlayerOpponentsByTournament = async (id, activeConnection) => {
        calls.push(["deleteOpponents", id, activeConnection]);
    };
    tournamentRepository.updateTournamentName = async (id, name, activeConnection) => {
        calls.push(["updateTournamentName", id, name, activeConnection]);
    };

    const competitionId = 7;

    const result = await competitionService.resetCompetition(competitionId);

    assert.deepEqual(result, { success: true });
    assert.deepEqual(
        calls.map(([name]) => name),
        [
            "deleteMatches",
            "deletePairings",
            "deletePlayers",
            "deletePartners",
            "deleteOpponents",
            "updateTournamentName"
        ]
    );
    assert.ok(calls.every((call) => call.at(-1) === connection));
    assert.ok(calls.every((call) => call[1] === competitionId));
});

test("generateCompetition propagates the existing lifecycle transaction connection", async () => {
    const connection = { marker: "transaction" };
    const calls = [];

    db.withTransaction = async (work) => work(connection);
    tournamentRepository.getTournamentByIdWithConnection = async (id, activeConnection) => {
        assert.equal(id, 7);
        assert.equal(activeConnection, connection);
        return { id };
    };
    matchRepository.deleteMatchesByTournament = async (id, activeConnection) => {
        calls.push(["deleteMatches", id, activeConnection]);
    };
    pairingRepository.deletePairingsByTournament = async (id, activeConnection) => {
        calls.push(["deletePairings", id, activeConnection]);
    };
    playerRepository.deletePlayersByTournament = async (id, activeConnection) => {
        calls.push(["deletePlayers", id, activeConnection]);
    };
    playerRepository.deletePlayerPartnersByTournament = async (id, activeConnection) => {
        calls.push(["deletePartners", id, activeConnection]);
    };
    playerRepository.deletePlayerOpponentsByTournament = async (id, activeConnection) => {
        calls.push(["deleteOpponents", id, activeConnection]);
    };
    tournamentRepository.updateTournamentName = async (id, name, activeConnection) => {
        calls.push(["updateTournamentName", id, name, activeConnection]);
    };
    playerRepository.createPlayer = async (player, activeConnection) => {
        const id = player.name === "Ada" ? 7 : 8;
        calls.push(["createPlayer", player.tournament_id, player.name, activeConnection]);
        return { id, ...player };
    };
    pairingRepository.createPairing = async (pairing, activeConnection) => {
        calls.push(["createPairing", pairing.tournament_id, pairing.player1_id, pairing.player2_id, activeConnection]);
    };

    const competitionId = 7;

    const result = await competitionService.generateCompetition(competitionId, {
        tournamentName: "Summer Open",
        mode: "fixed-pair",
        players: [
            { name: "Ada", lv: 4, paired: true },
            { name: "Lin", lv: 3, paired: true }
        ],
        pairs: [{ name: "Ada & Lin" }]
    });

    assert.equal(result.success, true);
    assert.deepEqual(
        calls.map(([name]) => name),
        [
            "deleteMatches",
            "deletePairings",
            "deletePlayers",
            "deletePartners",
            "deleteOpponents",
            "updateTournamentName",
            "createPlayer",
            "createPlayer",
            "createPairing"
        ]
    );
    assert.ok(calls.every((call) => call.at(-1) === connection));
    assert.ok(calls.every((call) => call[1] === competitionId));
});
