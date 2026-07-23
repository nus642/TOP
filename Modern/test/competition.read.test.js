const assert = require("node:assert/strict");
const test = require("node:test");

process.env.MYSQL_HOST = process.env.MYSQL_HOST || "localhost";

const matchRepository = require("../repositories/match.repository");
const playerRepository = require("../repositories/player.repository");
const pairingRepository = require("../repositories/pairing.repository");
const tournamentRepository = require("../repositories/tournament.repository");
const competitionService = require("../services/competition.service");

const originalRepositories = {
    getTournamentById: tournamentRepository.getTournamentById,
    getPlayersByTournament: playerRepository.getPlayersByTournament,
    getMatchesByTournament: matchRepository.getMatchesByTournament,
    getPairingsByTournament: pairingRepository.getPairingsByTournament
};

test.afterEach(() => {
    tournamentRepository.getTournamentById = originalRepositories.getTournamentById;
    playerRepository.getPlayersByTournament = originalRepositories.getPlayersByTournament;
    matchRepository.getMatchesByTournament = originalRepositories.getMatchesByTournament;
    pairingRepository.getPairingsByTournament = originalRepositories.getPairingsByTournament;
});

test("getCompetition reads tournament, players, matches, and pairings", async () => {
    tournamentRepository.getTournamentById = async (tournamentId) => ({
        id: tournamentId,
        name: "Summer Open"
    });
    playerRepository.getPlayersByTournament = async () => ([
        { id: 10, name: "Ada" }
    ]);
    matchRepository.getMatchesByTournament = async () => ([
        { id: 20, round_num: 1 }
    ]);
    pairingRepository.getPairingsByTournament = async () => ([
        { id: 30, player1_id: 10, player2_id: 11 }
    ]);

    const result = await competitionService.getCompetition(7);

    assert.deepEqual(result, {
        tournament: { id: 7, name: "Summer Open" },
        players: [{ id: 10, name: "Ada" }],
        matches: [{ id: 20, round_num: 1 }],
        pairings: [{ id: 30, player1_id: 10, player2_id: 11 }],
        mode: "fixed-pair"
    });
});

test("getSchedule preserves legacy-compatible response shape", async () => {
    tournamentRepository.getTournamentById = async () => ({ id: 1 });
    playerRepository.getPlayersByTournament = async () => ([]);
    matchRepository.getMatchesByTournament = async () => ([]);
    pairingRepository.getPairingsByTournament = async () => ([]);

    const result = await competitionService.getSchedule(1);

    assert.deepEqual(Object.keys(result), [
        "tournament",
        "players",
        "matches",
        "pairings",
        "mode"
    ]);
    assert.equal(result.mode, "round-robin");
});
