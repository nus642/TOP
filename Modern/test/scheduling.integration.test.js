const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const schedulingService = require("../services/scheduling.service");
const matchOperationsService = require("../services/match-operations.service");
const scheduleRepository = require("../repositories/match-schedule.repository");
const operationsRepository = require("../repositories/match-operation.repository");
const { createMatchSchedule, SchedulingError } = require("../engine/scheduling");

test("scheduling engine creates an immutable implementation-neutral scheduling fact", () => {
    const schedule = createMatchSchedule({
        competitionId: 7,
        matchId: 42,
        scheduledAt: "2026-09-12T10:30:00Z",
        courtId: " court-2 "
    });

    assert.deepEqual(schedule, {
        competitionId: 7,
        matchId: 42,
        scheduledAt: "2026-09-12T10:30:00.000Z",
        courtId: "court-2"
    });
    assert.ok(Object.isFrozen(schedule));
    assert.throws(() => createMatchSchedule({ competitionId: 7, matchId: 42 }), SchedulingError);
});

test("generated matches receive persisted schedules once and still enter Match Operations", async (t) => {
    const originals = {
        transaction: db.withTransaction,
        findMatch: scheduleRepository.findMatch,
        findSchedule: scheduleRepository.findByMatch,
        createSchedule: scheduleRepository.create,
        findOperation: operationsRepository.findById,
        assign: operationsRepository.assign,
        accept: operationsRepository.acceptResponsibility
    };
    t.after(() => {
        db.withTransaction = originals.transaction;
        scheduleRepository.findMatch = originals.findMatch;
        scheduleRepository.findByMatch = originals.findSchedule;
        scheduleRepository.create = originals.createSchedule;
        operationsRepository.findById = originals.findOperation;
        operationsRepository.assign = originals.assign;
        operationsRepository.acceptResponsibility = originals.accept;
    });

    const generatedMatch = {
        id: 42, tournamentId: 7, refereeId: null, status: "idle", score1: null, score2: null
    };
    let persistedSchedule = null;
    let operation = generatedMatch;
    db.withTransaction = (work) => work({
        transaction: true,
        query: async () => [[{ id: 7, status: "running" }]]
    });
    scheduleRepository.findMatch = async (competitionId, matchId) => (
        competitionId === 7 && matchId === generatedMatch.id ? { id: matchId } : null
    );
    scheduleRepository.findByMatch = async () => persistedSchedule;
    scheduleRepository.create = async (schedule) => {
        persistedSchedule = { id: 1, ...schedule };
        return persistedSchedule;
    };
    operationsRepository.findById = async () => operation;
    operationsRepository.assign = async (_competitionId, _matchId, refereeId) => (
        operation = { ...operation, refereeId, status: "assigned" }
    );
    operationsRepository.acceptResponsibility = async () => (
        operation = { ...operation, status: "playing" }
    );

    const first = await schedulingService.scheduleMatch(7, generatedMatch.id, {
        scheduledAt: "2026-09-12T10:30:00Z",
        courtId: "court-2"
    });
    assert.deepEqual(await schedulingService.getMatchSchedule(7, generatedMatch.id), first);

    await assert.rejects(
        schedulingService.scheduleMatch(7, generatedMatch.id, {
            scheduledAt: "2026-09-12T11:00:00Z"
        }),
        (error) => error.code === "DUPLICATE_SCHEDULE"
    );

    await matchOperationsService.assignMatch(7, generatedMatch.id, { refereeId: "referee-4" });
    const lifecycle = await matchOperationsService.acceptRefereeResponsibility(
        7, generatedMatch.id, { refereeId: "referee-4" }
    );
    assert.equal(lifecycle.match.status, "playing");
    assert.deepEqual(persistedSchedule, first.schedule);
});

test("schedule repository persists schedule facts separately from matches", async (t) => {
    const originalQuery = db.query;
    t.after(() => { db.query = originalQuery; });
    let statement;
    let values;
    db.query = async (sql, params) => {
        statement = sql;
        values = params;
        return [{ insertId: 9 }];
    };

    const schedule = await scheduleRepository.create({
        competitionId: 7,
        matchId: 42,
        scheduledAt: "2026-09-12T10:30:00.000Z",
        courtId: "court-2"
    });

    assert.match(statement, /INSERT INTO match_schedules/);
    assert.deepEqual(values.slice(0, 2), [7, 42]);
    assert.equal(values[2].toISOString(), "2026-09-12T10:30:00.000Z");
    assert.equal(values[3], "court-2");
    assert.equal(schedule.id, 9);
});
