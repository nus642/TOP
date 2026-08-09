const STATES = Object.freeze({
    DRAFT: "draft",
    REGISTRATION_OPEN: "registration_open",
    READY: "ready",
    RUNNING: "running",
    COMPLETED: "completed",
    ARCHIVED: "archived"
});

const VALUES = Object.freeze(Object.values(STATES));

class CompetitionLifecycleState {
    constructor(value) {
        if (!VALUES.includes(value)) {
            const error = new Error(`Unknown competition lifecycle state: ${value}`);
            error.code = "VALIDATION_ERROR";
            throw error;
        }
        this.value = value;
        Object.freeze(this);
    }

    static from(value) {
        if (value instanceof CompetitionLifecycleState) return value;
        if (typeof value !== "string" || value.trim() === "") {
            const error = new Error("Competition lifecycle state is required");
            error.code = "VALIDATION_ERROR";
            throw error;
        }
        return new CompetitionLifecycleState(value.trim());
    }
}

module.exports = { CompetitionLifecycleState, COMPETITION_LIFECYCLE_STATES: STATES };
