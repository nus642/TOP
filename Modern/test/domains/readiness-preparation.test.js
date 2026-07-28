const assert = require("node:assert/strict");
const test = require("node:test");

const { Competition, Entry, Event, Group } = require("../../engine/competition/domain");
const {
  checkReadinessPreparation,
  MasterOperationalContext,
  MatchContext,
  OperationsError,
  RefereeOperationalContext
} = require("../../engine/operations/domain");
const operations = require("../../engine/operations");

function buildMatchContext() {
  const competition = new Competition({ id: 1, name: "Summer Open" });
  const group = new Group({ id: 2, name: "Adult", competition });
  const event = new Event({ id: 3, name: "Doubles", format: "round-robin", group });
  const entry = new Entry({ id: 4, name: "Team One", event });

  return new MatchContext({
    entry,
    drawPosition: { round: "QF", court: 1, sequence: 1 }
  });
}

function attachMaster(matchContext) {
  matchContext.attachMasterContext(new MasterOperationalContext({ matchContext }));
}

function attachReferee(matchContext) {
  matchContext.attachRefereeContext(new RefereeOperationalContext({ matchContext }));
}

test("reports ready when both actor contexts are attached", () => {
  const matchContext = buildMatchContext();
  attachMaster(matchContext);
  attachReferee(matchContext);

  assert.deepEqual(checkReadinessPreparation(matchContext), { ready: true });
});

test("reports only masterContext missing", () => {
  const matchContext = buildMatchContext();
  attachReferee(matchContext);

  assert.deepEqual(checkReadinessPreparation(matchContext), {
    ready: false,
    missing: ["masterContext"]
  });
});

test("reports only refereeContext missing", () => {
  const matchContext = buildMatchContext();
  attachMaster(matchContext);

  assert.deepEqual(checkReadinessPreparation(matchContext), {
    ready: false,
    missing: ["refereeContext"]
  });
});

test("reports both actor contexts missing in a stable order", () => {
  assert.deepEqual(checkReadinessPreparation(buildMatchContext()), {
    ready: false,
    missing: ["masterContext", "refereeContext"]
  });
});

test("rejects a missing or invalid MatchContext", () => {
  for (const value of [null, undefined, {}]) {
    assert.throws(
      () => checkReadinessPreparation(value),
      (error) => error instanceof OperationsError && error.code === "INVALID_MATCH_CONTEXT"
    );
  }
});

test("is a pure query and returns a fresh result", () => {
  const matchContext = buildMatchContext();
  const propertiesBefore = Object.getOwnPropertyDescriptors(matchContext);

  const firstResult = checkReadinessPreparation(matchContext);
  const secondResult = checkReadinessPreparation(matchContext);

  assert.deepEqual(firstResult, secondResult);
  assert.notEqual(firstResult, secondResult);
  assert.notEqual(firstResult.missing, secondResult.missing);
  assert.deepEqual(Object.getOwnPropertyDescriptors(matchContext), propertiesBefore);
});

test("exports the readiness query through both operations entry points", () => {
  assert.equal(operations.checkReadinessPreparation, checkReadinessPreparation);
});
