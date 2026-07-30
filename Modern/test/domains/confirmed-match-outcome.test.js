const assert = require("node:assert/strict");
const test = require("node:test");

const { OperationsError, MatchResult, Confirmation, ConfirmedMatchOutcome } = require("../../engine/operations/domain");

function result() {
  return new MatchResult({ matchId: "match-1", score: [11, 7] });
}

function confirmation(responsibility = "authorized-official") {
  return new Confirmation({ responsibility, confirmedBy: "person-1", confirmedAt: "2026-07-30T10:00:00.000Z" });
}

test("constructs a confirmed match outcome for a score-only match", () => {
  const matchResult = result();
  const officialConfirmation = confirmation();
  const outcome = new ConfirmedMatchOutcome({ matchResult, officialConfirmation });

  assert.equal(outcome.matchResult, matchResult);
  assert.equal(outcome.officialConfirmation, officialConfirmation);
  assert.deepEqual(outcome.participantConfirmations, []);
  assert.deepEqual(outcome.evidenceReferences, []);
  assert.equal(outcome.confirmedAt, officialConfirmation.confirmedAt);
});

test("supports optional participant confirmations and evidence references", () => {
  const participantConfirmation = confirmation("participant");
  const evidenceReferences = [{ id: "evidence-1", kind: "signature" }];
  const outcome = new ConfirmedMatchOutcome({
    matchResult: result(),
    officialConfirmation: confirmation("scorekeeper"),
    participantConfirmations: [participantConfirmation],
    evidenceReferences
  });

  evidenceReferences[0].id = "changed";
  assert.deepEqual(outcome.participantConfirmations, [participantConfirmation]);
  assert.deepEqual(outcome.evidenceReferences, [{ id: "evidence-1", kind: "signature" }]);
});

test("validates required fields and confirmation values", () => {
  assert.throws(() => new Confirmation(), OperationsError);
  assert.throws(() => new Confirmation({ confirmedBy: "person-1" }), { code: "INVALID_CONFIRMATION" });
  assert.throws(() => new Confirmation({ responsibility: "official" }), { code: "INVALID_CONFIRMATION" });
  assert.throws(() => new ConfirmedMatchOutcome(), { code: "INVALID_CONFIRMED_MATCH_OUTCOME" });
  assert.throws(() => new ConfirmedMatchOutcome({ matchResult: {} }), { code: "INVALID_CONFIRMED_MATCH_OUTCOME" });
});

test("requires an official confirmation", () => {
  assert.throws(() => new ConfirmedMatchOutcome({ matchResult: result() }), {
    code: "OFFICIAL_CONFIRMATION_REQUIRED"
  });
});

test("is immutable and returns defensive copies", () => {
  const outcome = new ConfirmedMatchOutcome({
    matchResult: result(),
    officialConfirmation: confirmation(),
    participantConfirmations: [confirmation("participant")],
    evidenceReferences: [{ id: "evidence-1" }]
  });

  assert.equal(Object.isFrozen(outcome), true);
  assert.equal(Object.isFrozen(outcome.officialConfirmation), true);
  const participants = outcome.participantConfirmations;
  const evidence = outcome.evidenceReferences;
  participants.length = 0;
  evidence[0].id = "changed";
  assert.equal(outcome.participantConfirmations.length, 1);
  assert.equal(outcome.evidenceReferences[0].id, "evidence-1");
});

test("exports confirmed outcome concepts from operations entry points", () => {
  const domain = require("../../engine/operations/domain");
  const operations = require("../../engine/operations");
  assert.equal(domain.Confirmation, Confirmation);
  assert.equal(domain.ConfirmedMatchOutcome, ConfirmedMatchOutcome);
  assert.equal(operations.Confirmation, Confirmation);
  assert.equal(operations.ConfirmedMatchOutcome, ConfirmedMatchOutcome);
});
