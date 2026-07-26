const assert = require("node:assert/strict");
const test = require("node:test");

const {
    Competition,
    Group,
    Event,
    Entry,
    Participant
} = require("../../engine/competition/domain");

function createChain(prefix, competition) {
    const group = new Group({ id: `${prefix}-group`, name: `${prefix} Group`, competition });
    const event = new Event({ id: `${prefix}-event`, name: `${prefix} Event`, group });
    const entry = new Entry({ id: `${prefix}-entry`, event });
    const participant = new Participant({
        id: `${prefix}-participant`,
        identityId: `${prefix}-player`,
        entry
    });

    return { group, event, entry, participant };
}

test("owners associate the valid child hierarchy", () => {
    const competition = new Competition({ id: "competition", name: "Open" });
    const { group, event, entry, participant } = createChain("valid", competition);

    assert.equal(competition.addGroup(group), group);
    assert.equal(group.addEvent(event), event);
    assert.equal(event.addEntry(entry), entry);
    assert.equal(entry.addParticipant(participant), participant);

    assert.deepEqual(competition.groups, [group]);
    assert.deepEqual(group.events, [event]);
    assert.deepEqual(event.entries, [entry]);
    assert.deepEqual(entry.participants, [participant]);
});

test("rejects cross-competition and mismatched ownership associations", () => {
    const first = new Competition({ id: "first", name: "First" });
    const second = new Competition({ id: "second", name: "Second" });
    const firstChain = createChain("first", first);
    const secondChain = createChain("second", second);

    assert.throws(() => second.addGroup(firstChain.group), {
        code: "GROUP_OWNERSHIP_MISMATCH"
    });
    assert.throws(() => secondChain.group.addEvent(firstChain.event), {
        code: "EVENT_OWNERSHIP_MISMATCH"
    });
    assert.throws(() => secondChain.event.addEntry(firstChain.entry), {
        code: "ENTRY_OWNERSHIP_MISMATCH"
    });
    assert.throws(() => secondChain.entry.addParticipant(firstChain.participant), {
        code: "PARTICIPANT_OWNERSHIP_MISMATCH"
    });
});

test("rejects invalid and duplicate associations", () => {
    const competition = new Competition({ id: 1, name: "Open" });
    const { group, event, entry, participant } = createChain("valid", competition);

    assert.throws(() => competition.addGroup({}), { code: "INVALID_GROUP_ASSOCIATION" });
    competition.addGroup(group);
    assert.throws(() => competition.addGroup(group), { code: "DUPLICATE_GROUP_ASSOCIATION" });

    assert.throws(() => group.addEvent({}), { code: "INVALID_EVENT_ASSOCIATION" });
    group.addEvent(event);
    assert.throws(() => group.addEvent(event), { code: "DUPLICATE_EVENT_ASSOCIATION" });

    assert.throws(() => event.addEntry({}), { code: "INVALID_ENTRY_ASSOCIATION" });
    event.addEntry(entry);
    assert.throws(() => event.addEntry(entry), { code: "DUPLICATE_ENTRY_ASSOCIATION" });

    assert.throws(() => entry.addParticipant({}), { code: "INVALID_PARTICIPANT_ASSOCIATION" });
    entry.addParticipant(participant);
    assert.throws(() => entry.addParticipant(participant), {
        code: "DUPLICATE_PARTICIPANT_ASSOCIATION"
    });
});

test("collection access cannot bypass association validation", () => {
    const competition = new Competition({ id: 1, name: "Open" });
    const { group } = createChain("valid", competition);
    const exposedGroups = competition.groups;

    exposedGroups.push(group);

    assert.deepEqual(competition.groups, []);
});
