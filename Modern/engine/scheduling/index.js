class SchedulingError extends Error {
    constructor(message) {
        super(message);
        this.name = "SchedulingError";
    }
}

function positiveId(value, label) {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
        throw new SchedulingError(`Valid ${label} is required`);
    }
    return id;
}

/**
 * Creates a scheduling fact without performing I/O or making resource decisions.
 * The caller supplies the human-selected time and optional court reference.
 */
function createMatchSchedule({ competitionId, matchId, scheduledAt, courtId = null } = {}) {
    const instant = typeof scheduledAt === "string" ? new Date(scheduledAt) : scheduledAt;
    if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) {
        throw new SchedulingError("Valid scheduled time is required");
    }

    if (courtId !== null && (typeof courtId !== "string" || courtId.trim() === "")) {
        throw new SchedulingError("Court reference must be a non-empty string");
    }

    return Object.freeze({
        competitionId: positiveId(competitionId, "competition id"),
        matchId: positiveId(matchId, "match id"),
        scheduledAt: instant.toISOString(),
        courtId: courtId === null ? null : courtId.trim()
    });
}

module.exports = { createMatchSchedule, SchedulingError };
