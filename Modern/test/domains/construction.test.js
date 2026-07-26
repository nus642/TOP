const assert = require("node:assert/strict");
const test = require("node:test");

const {
    Competition,
    Group,
    Event,
    Entry,
    Participant,
    DomainError
} = require("../../engine/competition/domain");

function buildHierarchy() {
    const competition = new Competition({ id: 1, name: "Summer Open" });
    const group = new Group({ id: 2, name: "Adult", competition });
    const event = new Event({ id: 3, name: "Doubles", format: "round-robin", group });
    const entry = new Entry({ id: 4, name: "Team One", event });
    const participant = new Participant({ id: 5, identityId: "player-10", entry });

    return { competition, group, event, entry, participant };
}

test("constructs the complete competition domain hierarchy", () => {
    const { competition, group, event, entry, participant } = buildHierarchy();

    assert.equal(group.competition, competition);
    assert.equal(event.group, group);
    assert.equal(event.competition, competition);
    assert.equal(entry.event, event);
    assert.equal(entry.competition, competition);
    assert.equal(participant.entry, entry);
    assert.equal(participant.identityId, "player-10");
    assert.equal(participant.competition, competition);
});

test("validates required entity construction fields", () => {
    const { competition, group, event, entry } = buildHierarchy();

    assert.throws(() => new Competition(), DomainError);
    assert.throws(() => new Competition({ id: 1, name: "  " }), {
        code: "INVALID_COMPETITION_NAME"
    });
    assert.throws(() => new Group({ id: 2, name: "Adult" }), {
        code: "INVALID_GROUP_OWNER"
    });
    assert.throws(() => new Event({ id: 3, name: "Doubles", group: {} }), {
        code: "INVALID_EVENT_OWNER"
    });
    assert.throws(() => new Entry({ id: 4 }), {
        code: "INVALID_ENTRY_OWNER"
    });
    assert.throws(() => new Participant({ id: 5, identityId: "player-10" }), {
        code: "INVALID_PARTICIPANT_OWNER"
    });
    assert.throws(() => new Participant({ id: 5, identityId: " ", entry }), {
        code: "INVALID_IDENTITY_REFERENCE"
    });

    assert.ok(competition);
    assert.ok(group);
    assert.ok(event);
});

test("domain failures expose a stable error type and code", () => {
    assert.throws(
        () => new Competition({ id: null, name: "Summer Open" }),
        (error) => error instanceof DomainError
            && error.name === "DomainError"
            && error.code === "INVALID_COMPETITION_ID"
    );
});
