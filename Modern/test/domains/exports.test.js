const assert = require("node:assert/strict");
const test = require("node:test");

const domain = require("../../engine/competition/domain");

test("exports the competition domain through CommonJS", () => {
    assert.deepEqual(Object.keys(domain).sort(), [
        "Competition",
        "DomainError",
        "Entry",
        "Event",
        "Group",
        "Participant"
    ]);

    for (const exportedValue of Object.values(domain)) {
        assert.equal(typeof exportedValue, "function");
    }
});
