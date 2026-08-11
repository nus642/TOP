const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const competitionService = require("../services/competition.service");
const schedulingService = require("../services/scheduling.service");
const matchOperationsService = require("../services/match-operations.service");
const resultService = require("../services/competition-result.service");
const tournamentRepository = require("../repositories/tournament.repository");
const playerRepository = require("../repositories/player.repository");
const matchRepository = require("../repositories/match.repository");
const scheduleRepository = require("../repositories/match-schedule.repository");
const operationRepository = require("../repositories/match-operation.repository");
const officialRecordRepository = require("../repositories/match-official-record.repository");
const standingRepository = require("../repositories/competition-standing.repository");

function installTournamentHarness(t) {
    const originals = [];
    const replace = (owner, name, implementation) => {
        originals.push([owner, name, owner[name]]);
        owner[name] = implementation;
    };
    t.after(() => {
        for (const [owner, name, implementation] of originals.reverse()) owner[name] = implementation;
    });

    const state = {
        competition: null,
        players: [],
        matches: [],
        schedules: [],
        officialRecords: [],
        standings: []
    };
    const connection = { inMemoryTournament: true };
    replace(db, "withTransaction", (work) => work(connection));

    replace(tournamentRepository, "createTournament", async (value) => (
        state.competition = { id: 1, ...value }
    ));
    replace(tournamentRepository, "getTournamentByIdWithConnection", async (id) => (
        state.competition?.id === Number(id) ? { ...state.competition } : null
    ));
    replace(tournamentRepository, "getTournamentByIdForUpdate", async (id) => (
        state.competition?.id === Number(id) ? { ...state.competition } : null
    ));
    replace(tournamentRepository, "updateLifecycleState", async (_id, status) => (
        state.competition = { ...state.competition, status }
    ));

    replace(playerRepository, "createPlayer", async (value) => {
        const player = { id: state.players.length + 1, ...value };
        state.players.push(player);
        return { ...player };
    });
    replace(playerRepository, "getPlayersByTournament", async (id) => (
        state.players.filter((player) => player.tournament_id === Number(id)).map((player) => ({ ...player }))
    ));

    replace(matchRepository, "createMatch", async (value) => {
        const match = {
            id: state.matches.length + 1,
            tournamentId: value.tournament_id,
            refereeId: null,
            ...value
        };
        state.matches.push(match);
        return { ...match };
    });

    replace(scheduleRepository, "findMatch", async (competitionId, matchId) => (
        state.matches.find((match) => match.tournamentId === Number(competitionId) && match.id === Number(matchId)) || null
    ));
    replace(scheduleRepository, "findByMatch", async (competitionId, matchId) => (
        state.schedules.find((schedule) => schedule.competitionId === Number(competitionId) && schedule.matchId === Number(matchId)) || null
    ));
    replace(scheduleRepository, "create", async (value) => {
        const schedule = { id: state.schedules.length + 1, ...value };
        state.schedules.push(schedule);
        return { ...schedule };
    });

    replace(operationRepository, "findById", async (competitionId, matchId) => {
        const match = state.matches.find((item) => item.tournamentId === Number(competitionId) && item.id === Number(matchId));
        return match && { ...match };
    });
    const updateMatch = (matchId, values) => {
        const index = state.matches.findIndex((match) => match.id === Number(matchId));
        state.matches[index] = { ...state.matches[index], ...values };
        return { ...state.matches[index] };
    };
    replace(operationRepository, "assign", async (_competitionId, matchId, refereeId) => (
        updateMatch(matchId, { refereeId, status: "assigned" })
    ));
    replace(operationRepository, "acceptResponsibility", async (_competitionId, matchId) => (
        updateMatch(matchId, { status: "playing" })
    ));
    replace(operationRepository, "recordScore", async (_competitionId, matchId, score1, score2) => (
        updateMatch(matchId, { score1, score2, status: "scored" })
    ));
    replace(operationRepository, "confirm", async (_competitionId, matchId, refereeId) => (
        updateMatch(matchId, { status: "confirmed", resultConfirmedBy: refereeId })
    ));

    replace(officialRecordRepository, "create", async (value) => {
        const record = { id: state.officialRecords.length + 1, ...value };
        state.officialRecords.push(record);
        return { ...record };
    });
    replace(officialRecordRepository, "findLatestConfirmedResults", async (competitionId) => (
        state.officialRecords
            .filter((record) => record.tournamentId === Number(competitionId))
            .map((record) => {
                const match = state.matches.find((item) => item.id === record.matchId);
                return {
                    matchId: match.id,
                    sideOneId: match.player1_id,
                    sideTwoId: match.player3_id,
                    sideOneScore: record.score1,
                    sideTwoScore: record.score2,
                    confirmed: true
                };
            })
    ));
    replace(standingRepository, "replaceForCompetition", async (_competitionId, standings) => (
        state.standings = standings.map((standing) => ({ ...standing }))
    ));

    return state;
}

async function openCompetition(competitionId) {
    for (const status of ["registration_open", "ready", "running"]) {
        await competitionService.transitionCompetitionState(competitionId, status);
    }
}

test("Modern services complete a round-robin tournament lifecycle without the Legacy API", async (t) => {
    const state = installTournamentHarness(t);
    const { competition } = await competitionService.createCompetition({
        name: "Modern replacement tournament",
        sport: "pickleball"
    });
    for (const name of ["Ada", "Grace", "Linus"]) {
        await competitionService.registerPlayer(competition.id, { name });
    }
    await openCompetition(competition.id);

    const generated = await competitionService.generateRoundRobin(competition.id);
    assert.equal(generated.matches.length, 3);
    for (const match of generated.matches) {
        await schedulingService.scheduleMatch(competition.id, match.id, {
            scheduledAt: `2026-09-12T1${match.id}:00:00Z`,
            courtId: `court-${match.id}`
        });
    }

    const match = generated.matches[0];
    await matchOperationsService.assignMatch(competition.id, match.id, { refereeId: "referee-7" });
    await matchOperationsService.acceptRefereeResponsibility(competition.id, match.id, { refereeId: "referee-7" });
    await matchOperationsService.recordScore(competition.id, match.id, {
        refereeId: "referee-7", score1: 11, score2: 8
    });
    const confirmation = await matchOperationsService.confirmResult(competition.id, match.id, {
        actorId: "master-1", actorType: "master", evidenceReference: "scorecard://modern/1"
    });
    const result = await resultService.getStandings(competition.id);
    await competitionService.transitionCompetitionState(competition.id, "completed");

    assert.equal(state.competition.status, "completed");
    assert.equal(state.schedules.length, generated.matches.length);
    assert.equal(confirmation.match.status, "confirmed");
    assert.equal(confirmation.officialRecord.confirmedBy, "master-1");
    assert.deepEqual(result.standings.map(({ played, wins, losses }) => ({ played, wins, losses })), [
        { played: 1, wins: 1, losses: 0 },
        { played: 1, wins: 0, losses: 1 }
    ]);
});

test("Modern competition lifecycle rejects a skipped transition", async (t) => {
    installTournamentHarness(t);
    const { competition } = await competitionService.createCompetition({ name: "Invalid transition", sport: "pickleball" });

    await assert.rejects(
        competitionService.transitionCompetitionState(competition.id, "running"),
        (error) => error.code === "VALIDATION_ERROR" && /draft to running/.test(error.message)
    );
});

test("standings exclude scheduled and scored matches until official confirmation", async (t) => {
    installTournamentHarness(t);
    const { competition } = await competitionService.createCompetition({ name: "Confirmation boundary", sport: "pickleball" });
    for (const name of ["One", "Two", "Three"]) await competitionService.registerPlayer(competition.id, { name });
    await openCompetition(competition.id);
    const { matches } = await competitionService.generateRoundRobin(competition.id);
    const match = matches[0];
    await schedulingService.scheduleMatch(competition.id, match.id, { scheduledAt: "2026-09-12T10:00:00Z" });
    await matchOperationsService.assignMatch(competition.id, match.id, { refereeId: "referee-2" });
    await matchOperationsService.acceptRefereeResponsibility(competition.id, match.id, { refereeId: "referee-2" });
    await matchOperationsService.recordScore(competition.id, match.id, {
        refereeId: "referee-2", score1: 11, score2: 0
    });

    assert.deepEqual((await resultService.getStandings(competition.id)).standings, []);
    await matchOperationsService.confirmResult(competition.id, match.id, { actorId: "master-1", actorType: "master" });
    assert.equal((await resultService.getStandings(competition.id)).standings.length, 2);
});
