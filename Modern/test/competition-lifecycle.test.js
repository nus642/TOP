const assert = require("node:assert/strict");
const test = require("node:test");
const {
    CompetitionLifecycleState,
    COMPETITION_LIFECYCLE_STATES: STATES,
    transition
} = require("../engine/competition/lifecycle");

test("lifecycle model exposes the six explicit competition states", () => {
    assert.deepEqual(Object.values(STATES), [
        "draft", "registration_open", "ready", "running", "completed", "archived"
    ]);
    assert.equal(CompetitionLifecycleState.from("draft").value, "draft");
});

test("every forward lifecycle transition succeeds", () => {
    const sequence = Object.values(STATES);
    for (let index = 0; index < sequence.length - 1; index += 1) {
        assert.equal(transition(sequence[index], sequence[index + 1]).value, sequence[index + 1]);
    }
});

test("skipped and reverse lifecycle transitions are rejected", () => {
    assert.throws(() => transition("draft", "ready"), { code: "VALIDATION_ERROR" });
    assert.throws(() => transition("completed", "running"), { code: "VALIDATION_ERROR" });
    assert.throws(() => transition("archived", "completed"), { code: "VALIDATION_ERROR" });
});
