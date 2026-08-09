const { CompetitionLifecycleState, COMPETITION_LIFECYCLE_STATES: STATES } =
    require("./competition-lifecycle-state");

const NEXT_STATE = Object.freeze({
    [STATES.DRAFT]: STATES.REGISTRATION_OPEN,
    [STATES.REGISTRATION_OPEN]: STATES.READY,
    [STATES.READY]: STATES.RUNNING,
    [STATES.RUNNING]: STATES.COMPLETED,
    [STATES.COMPLETED]: STATES.ARCHIVED
});

function transition(currentValue, requestedValue) {
    const current = CompetitionLifecycleState.from(currentValue);
    const requested = CompetitionLifecycleState.from(requestedValue);
    if (NEXT_STATE[current.value] !== requested.value) {
        const error = new Error(`Cannot transition competition from ${current.value} to ${requested.value}`);
        error.code = "VALIDATION_ERROR";
        throw error;
    }
    return requested;
}

module.exports = { transition, NEXT_STATE };
