const db = require("../database/db");
const repository = require("../repositories/match-schedule.repository");
const { createMatchSchedule, SchedulingError } = require("../engine/scheduling");

function error(code, message) {
    const value = new Error(message);
    value.code = code;
    return value;
}

async function scheduleMatch(competitionId, matchId, data = {}) {
    let schedule;
    try {
        schedule = createMatchSchedule({ ...data, competitionId, matchId });
    } catch (cause) {
        if (!(cause instanceof SchedulingError)) throw cause;
        throw error("VALIDATION_ERROR", cause.message);
    }

    return db.withTransaction(async (connection) => {
        if (!await repository.findMatch(schedule.competitionId, schedule.matchId, connection, true)) {
            throw error("NOT_FOUND", "Match not found");
        }
        if (await repository.findByMatch(schedule.competitionId, schedule.matchId, connection)) {
            throw error("DUPLICATE_SCHEDULE", "Match is already scheduled");
        }

        try {
            return { schedule: await repository.create(schedule, connection) };
        } catch (cause) {
            if (cause.code === "ER_DUP_ENTRY") {
                throw error("DUPLICATE_SCHEDULE", "Match is already scheduled");
            }
            throw cause;
        }
    });
}

async function getMatchSchedule(competitionId, matchId) {
    let identity;
    try {
        identity = createMatchSchedule({ competitionId, matchId, scheduledAt: new Date(0) });
    } catch (cause) {
        if (!(cause instanceof SchedulingError)) throw cause;
        throw error("VALIDATION_ERROR", cause.message);
    }
    const schedule = await repository.findByMatch(identity.competitionId, identity.matchId);
    if (!schedule) throw error("NOT_FOUND", "Match schedule not found");
    return { schedule };
}

module.exports = { scheduleMatch, getMatchSchedule };
