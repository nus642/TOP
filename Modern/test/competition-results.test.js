const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const officialRecords = require("../repositories/match-official-record.repository");
const standingsRepository = require("../repositories/competition-standing.repository");
const resultService = require("../services/competition-result.service");
const competitionRouter = require("../api/competition");
const { calculateRoundRobinStandings } = require("../engine/competition");

test("confirmed round-robin matches generate wins, losses, and score difference", () => {
    const standings = calculateRoundRobinStandings([
        { confirmed: true, sideOneId: 1, sideTwoId: 2, sideOneScore: 11, sideTwoScore: 7 },
        { confirmed: true, sideOneId: 3, sideTwoId: 1, sideOneScore: 9, sideTwoScore: 11 },
        { confirmed: true, sideOneId: 2, sideTwoId: 3, sideOneScore: 11, sideTwoScore: 5 }
    ]);

    assert.deepEqual(standings.map(({ participantId, played, wins, losses, scoreDifference }) =>
        ({ participantId, played, wins, losses, scoreDifference })), [
        { participantId: 1, played: 2, wins: 2, losses: 0, scoreDifference: 6 },
        { participantId: 2, played: 2, wins: 1, losses: 1, scoreDifference: 2 },
        { participantId: 3, played: 2, wins: 0, losses: 2, scoreDifference: -8 }
    ]);
});

test("unconfirmed and unfinished matches are ignored", () => {
    const standings = calculateRoundRobinStandings([
        { confirmed: true, sideOneId: 1, sideTwoId: 2, sideOneScore: 11, sideTwoScore: 4 },
        { confirmed: false, sideOneId: 2, sideTwoId: 3, sideOneScore: 11, sideTwoScore: 0 },
        { sideOneId: 3, sideTwoId: 1 }
    ]);
    assert.deepEqual(standings.map(item => item.participantId), [1, 2]);
    assert.equal(standings[0].wins, 1);
});

test("standings persistence replaces one competition atomically", async () => {
    const statements = [];
    const rows = [{ competition_id: 7, participant_id: 1, played: 1, wins: 1, losses: 0,
        score_for: 11, score_against: 8, score_difference: 3, updated_at: "now" }];
    const connection = { query: async (sql, values) => {
        statements.push([sql, values]);
        return sql.includes("SELECT *") ? [rows] : [{ affectedRows: 1 }];
    } };
    const saved = await standingsRepository.replaceForCompetition(7, [{
        participantId: 1, played: 1, wins: 1, losses: 0, scoreFor: 11, scoreAgainst: 8, scoreDifference: 3
    }], connection);
    assert.match(statements[0][0], /DELETE FROM competition_standings/);
    assert.match(statements[1][0], /INSERT INTO competition_standings/);
    assert.deepEqual(saved[0], { competitionId: 7, participantId: 1, played: 1, wins: 1,
        losses: 0, scoreFor: 11, scoreAgainst: 8, scoreDifference: 3, updatedAt: "now" });
});

test("result service reads official records and persists calculated standings", async (t) => {
    const originals = {
        transaction: db.withTransaction,
        results: officialRecords.findLatestConfirmedResults,
        replace: standingsRepository.replaceForCompetition
    };
    t.after(() => {
        db.withTransaction = originals.transaction;
        officialRecords.findLatestConfirmedResults = originals.results;
        standingsRepository.replaceForCompetition = originals.replace;
    });
    const connection = { transaction: true };
    db.withTransaction = work => work(connection);
    officialRecords.findLatestConfirmedResults = async (id, usedConnection) => {
        assert.deepEqual([id, usedConnection], [7, connection]);
        return [{ confirmed: true, sideOneId: 10, sideTwoId: 11, sideOneScore: 11, sideTwoScore: 8 }];
    };
    standingsRepository.replaceForCompetition = async (id, values, usedConnection) => {
        assert.equal(id, 7);
        assert.equal(usedConnection, connection);
        return values;
    };
    const result = await resultService.getStandings("7");
    assert.equal(result.format, "round-robin");
    assert.deepEqual(result.standings.map(value => value.wins), [1, 0]);
});

test("standings API exposes the result service without changing operations routes", () => {
    const standingsRoute = competitionRouter.stack.find(layer => layer.route?.path === "/:competitionId/standings");
    assert.ok(standingsRoute?.route.methods.get);
    const operationsRouter = require("../api/match-operations");
    assert.ok(operationsRouter.stack.some(layer => layer.route?.path === "/:tournamentId/matches/:matchId/result-confirmation"));
});
