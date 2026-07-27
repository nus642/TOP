const test = require("node:test");
const assert = require("node:assert/strict");

const {
    Competition,
    Group,
    Event,
    Entry
} = require("../../engine/competition/domain");

const { OperationsError } = require("../../engine/operations/domain/operations-error");
const { MatchContext } = require("../../engine/operations/domain/match-context");
const { MasterOperationalContext } = require("../../engine/operations/domain/master-operational-context");
const { RefereeOperationalContext } = require("../../engine/operations/domain/referee-operational-context");

function buildEntry() {
    const competition = new Competition({ id: 1, name: "Summer Open" });
    const group = new Group({ id: 2, name: "Adult", competition });
    const event = new Event({ id: 3, name: "Doubles", format: "round-robin", group });
    const entry = new Entry({ id: 4, name: "Team One", event });
    return entry;
}

function buildMatchContext() {
    const entry = buildEntry();
    const drawPosition = { round: "QF", court: 1, sequence: 1 };
    return new MatchContext({ entry, drawPosition });
}

// --- Construction validation ---

test("creates MatchContext with valid Entry and draw position", () => {
    const entry = buildEntry();
    const drawPosition = { round: "QF", court: 1, sequence: 1 };
    const mc = new MatchContext({ entry, drawPosition });

    assert.equal(mc.entry, entry);
    assert.equal(mc.drawPosition, drawPosition);
});

test("rejects missing constructor options", () => {
    assert.throws(() => new MatchContext(), {
        code: "INVALID_CONSTRUCTOR_OPTIONS"
    });
});

test("rejects missing entry", () => {
    assert.throws(
        () => new MatchContext({ drawPosition: { round: "QF", court: 1, sequence: 1 } }),
        { code: "INVALID_ENTRY" }
    );
});

test("rejects invalid entry type", () => {
    assert.throws(
        () => new MatchContext({ entry: {}, drawPosition: { round: "QF", court: 1, sequence: 1 } }),
        { code: "INVALID_ENTRY" }
    );
});

test("rejects missing draw position", () => {
    const entry = buildEntry();
    assert.throws(() => new MatchContext({ entry }), {
        code: "INVALID_DRAW_POSITION"
    });
});

// --- Master context attachment ---

test("attaches valid MasterOperationalContext", () => {
    const mc = buildMatchContext();
    const masterCtx = new MasterOperationalContext({ matchContext: mc });
    mc.attachMasterContext(masterCtx);

    assert.equal(mc.masterContext, masterCtx);
});

test("rejects duplicate master context attachment", () => {
    const mc = buildMatchContext();
    const masterCtx = new MasterOperationalContext({ matchContext: mc });
    mc.attachMasterContext(masterCtx);

    assert.throws(() => mc.attachMasterContext(masterCtx), {
        code: "DUPLICATE_MASTER_CONTEXT"
    });
});

test("rejects invalid master context type", () => {
    const mc = buildMatchContext();

    assert.throws(() => mc.attachMasterContext({}), {
        code: "INVALID_MASTER_CONTEXT_TYPE"
    });
});

test("rejects master context bound to different MatchContext", () => {
    const mc = buildMatchContext();
    const otherMc = buildMatchContext();
    const masterCtx = new MasterOperationalContext({ matchContext: otherMc });

    assert.throws(() => mc.attachMasterContext(masterCtx), {
        code: "WRONG_MATCH_CONTEXT"
    });
});

// --- Referee context attachment ---

test("attaches valid RefereeOperationalContext", () => {
    const mc = buildMatchContext();
    const refereeCtx = new RefereeOperationalContext({ matchContext: mc });
    mc.attachRefereeContext(refereeCtx);

    assert.equal(mc.refereeContext, refereeCtx);
});

test("rejects duplicate referee context attachment", () => {
    const mc = buildMatchContext();
    const refereeCtx = new RefereeOperationalContext({ matchContext: mc });
    mc.attachRefereeContext(refereeCtx);

    assert.throws(() => mc.attachRefereeContext(refereeCtx), {
        code: "DUPLICATE_REFEEE_CONTEXT"
    });
});

test("rejects invalid referee context type", () => {
    const mc = buildMatchContext();

    assert.throws(() => mc.attachRefereeContext({}), {
        code: "INVALID_REFEEE_CONTEXT_TYPE"
    });
});

test("rejects referee context bound to different MatchContext", () => {
    const mc = buildMatchContext();
    const otherMc = buildMatchContext();
    const refereeCtx = new RefereeOperationalContext({ matchContext: otherMc });

    assert.throws(() => mc.attachRefereeContext(refereeCtx), {
        code: "WRONG_MATCH_CONTEXT"
    });
});

// --- MasterOperationalContext boundary validation ---

test("MasterOperationalContext validates allowed operations", () => {
    const mc = buildMatchContext();
    const masterCtx = new MasterOperationalContext({ matchContext: mc });

    assert.equal(masterCtx.validateOperation("calling_control"), true);
    assert.equal(masterCtx.validateOperation("result_confirmation"), true);
    assert.equal(masterCtx.validateOperation("exception_handling"), true);
    assert.equal(masterCtx.validateOperation("operational_override"), true);
    assert.equal(masterCtx.validateOperation("match_cancellation"), true);
});

test("MasterOperationalContext rejects disallowed operations", () => {
    const mc = buildMatchContext();
    const masterCtx = new MasterOperationalContext({ matchContext: mc });

    assert.throws(() => masterCtx.validateOperation("modify_competition_structure"), {
        code: "OPERATION_NOT_ALLOWED"
    });
    assert.throws(() => masterCtx.validateOperation("modify_entry"), {
        code: "OPERATION_NOT_ALLOWED"
    });
});

test("MasterOperationalContext rejects missing matchContext", () => {
    assert.throws(() => new MasterOperationalContext({}), {
        code: "INVALID_CONSTRUCTOR_OPTIONS"
    });
});

// --- RefereeOperationalContext boundary validation ---

test("RefereeOperationalContext validates allowed operations", () => {
    const mc = buildMatchContext();
    const refereeCtx = new RefereeOperationalContext({ matchContext: mc });

    assert.equal(refereeCtx.validateOperation("participant_verification"), true);
    assert.equal(refereeCtx.validateOperation("result_recording"), true);
    assert.equal(refereeCtx.validateOperation("readiness_confirmation"), true);
    assert.equal(refereeCtx.validateOperation("match_execution"), true);
    assert.equal(refereeCtx.validateOperation("issue_reporting"), true);
});

test("RefereeOperationalContext rejects disallowed operations", () => {
    const mc = buildMatchContext();
    const refereeCtx = new RefereeOperationalContext({ matchContext: mc });

    assert.throws(() => refereeCtx.validateOperation("calling_initiation"), {
        code: "OPERATION_NOT_ALLOWED"
    });
    assert.throws(() => refereeCtx.validateOperation("result_confirmation"), {
        code: "OPERATION_NOT_ALLOWED"
    });
});

test("RefereeOperationalContext rejects missing matchContext", () => {
    assert.throws(() => new RefereeOperationalContext({}), {
        code: "INVALID_CONSTRUCTOR_OPTIONS"
    });
});

// --- Cross-boundary rejection ---

test("Master cannot perform Referee-only operations", () => {
    const mc = buildMatchContext();
    const masterCtx = new MasterOperationalContext({ matchContext: mc });

    assert.throws(() => masterCtx.validateOperation("participant_verification"), {
        code: "OPERATION_NOT_ALLOWED"
    });
});

test("Referee cannot perform Master-only operations", () => {
    const mc = buildMatchContext();
    const refereeCtx = new RefereeOperationalContext({ matchContext: mc });

    assert.throws(() => refereeCtx.validateOperation("operational_override"), {
        code: "OPERATION_NOT_ALLOWED"
    });
});
