const { test } = require("node:test");
const assert = require("node:assert");
const { MatchOperation, MATCH_OPERATION_STATES } = require("../engine/operations/domain");

test("state machine: idle → assigned → accepted → playing", async (t) => {
  // Test the complete dispatch workflow state transitions
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "idle"
  });
  
  // idle → assigned (via dispatch)
  match.dispatch("referee-1", "dispatch-1", 0);
  assert.equal(match.status, MATCH_OPERATION_STATES.ASSIGNED);
  assert.equal(match.refereeId, "referee-1");
  assert.equal(match.dispatchId, "dispatch-1");
  assert.equal(match.dispatchVersion, 0);
  
  // assigned → accepted
  match.acceptDispatch("referee-1", 0);
  assert.equal(match.status, MATCH_OPERATION_STATES.ACCEPTED);
  assert.equal(match.dispatchVersion, 0);
  
  // accepted → playing (with readiness check)
  const readiness = [
    { participantId: 1, state: "ready" },
    { participantId: 2, state: "ready" }
  ];
  match.start("referee-1", readiness);
  assert.equal(match.status, MATCH_OPERATION_STATES.PLAYING);
});

test("state machine: reject dispatch", async (t) => {
  // Test that a waiting dispatch can be rejected
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "idle"
  });
  
  match.dispatch("referee-1", "dispatch-1", 0);
  assert.equal(match.status, MATCH_OPERATION_STATES.ASSIGNED);
  
  // Simulate rejection by withdrawing dispatch
  match.withdrawDispatch();
  assert.equal(match.status, MATCH_OPERATION_STATES.UPCOMING);
  assert.equal(match.refereeId, null);
  assert.equal(match.dispatchId, null);
  assert.equal(match.dispatchVersion, null);
});

test("state machine: withdraw only from assigned with dispatch", async (t) => {
  // Test that withdraw only works on assigned status with active dispatch
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "accepted"
  });
  
  assert.throws(
    () => match.withdrawDispatch(),
    /awaiting acceptance/
  );
});

test("state machine: reassign only from assigned with dispatch", async (t) => {
  // Test that reassign only works on assigned status with active dispatch
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "accepted"
  });
  
  assert.throws(
    () => match.reassignDispatch("referee-2", "dispatch-2", 1),
    /awaiting acceptance/
  );
});

test("state machine: withdraw from assigned dispatch", async (t) => {
  // Test withdraw from assigned dispatch
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "idle"
  });
  
  match.dispatch("referee-1", "dispatch-1", 0);
  assert.equal(match.status, MATCH_OPERATION_STATES.ASSIGNED);
  
  match.withdrawDispatch();
  assert.equal(match.status, MATCH_OPERATION_STATES.UPCOMING);
  assert.equal(match.refereeId, null);
});

test("state machine: reassign from assigned dispatch", async (t) => {
  // Test reassign from assigned dispatch
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "idle"
  });
  
  match.dispatch("referee-1", "dispatch-1", 0);
  assert.equal(match.status, MATCH_OPERATION_STATES.ASSIGNED);
  
  match.reassignDispatch("referee-2", "dispatch-2", 0);
  assert.equal(match.refereeId, "referee-2");
  assert.equal(match.dispatchId, "dispatch-2");
  assert.equal(match.dispatchVersion, 1);
});

test("state machine: accepted matches reject withdraw", async (t) => {
  // Test that accepted matches cannot be withdrawn
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "idle"
  });
  
  match.dispatch("referee-1", "dispatch-1", 0);
  match.acceptDispatch("referee-1", 0);
  
  assert.throws(
    () => match.withdrawDispatch(),
    /awaiting acceptance|not assigned/
  );
});

test("state machine: accepted matches reject reassign", async (t) => {
  // Test that accepted matches cannot be reassigned
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "idle"
  });
  
  match.dispatch("referee-1", "dispatch-1", 0);
  match.acceptDispatch("referee-1", 0);
  
  assert.throws(
    () => match.reassignDispatch("referee-2", "dispatch-2", 1),
    /awaiting acceptance|not assigned/
  );
});

test("state machine: playing matches reject withdraw", async (t) => {
  // Test that playing matches cannot be withdrawn
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "idle"
  });
  
  match.dispatch("referee-1", "dispatch-1", 0);
  match.acceptDispatch("referee-1", 0);
  
  const readiness = [{ participantId: 1, state: "ready" }];
  match.start("referee-1", readiness);
  
  assert.throws(
    () => match.withdrawDispatch(),
    /awaiting acceptance|not assigned/
  );
});

test("state machine: scored matches reject withdraw", async (t) => {
  // Test that scored matches cannot be withdrawn
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "scored"
  });
  
  assert.throws(
    () => match.withdrawDispatch(),
    /awaiting acceptance|not assigned/
  );
});

test("state machine: confirmed matches reject withdraw", async (t) => {
  // Test that confirmed matches cannot be withdrawn
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "confirmed"
  });
  
  assert.throws(
    () => match.withdrawDispatch(),
    /awaiting acceptance|not assigned/
  );
});

test("state machine: dispatch from assigned status", async (t) => {
  // Test that assigned matches can be dispatched
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "assigned",
    refereeId: "referee-old"
  });
  
  match.dispatch("referee-new", "dispatch-1", 0);
  assert.equal(match.status, MATCH_OPERATION_STATES.ASSIGNED);
  assert.equal(match.refereeId, "referee-new");
});

test("state machine: dispatch from upcoming status", async (t) => {
  // Test that upcoming matches can be dispatched
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "upcoming"
  });
  
  match.dispatch("referee-1", "dispatch-1", 0);
  assert.equal(match.status, MATCH_OPERATION_STATES.ASSIGNED);
});

test("state machine: dispatch rejects playing status", async (t) => {
  // Test that playing matches cannot be dispatched
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "playing"
  });
  
  assert.throws(
    () => match.dispatch("referee-1", "dispatch-1", 0),
    /idle.*upcoming.*assigned/i
  );
});

test("state machine: version check on accept", async (t) => {
  // Test that version check prevents stale acceptance
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "idle"
  });
  
  match.dispatch("referee-1", "dispatch-1", 5);
  
  // Try to accept with stale version - should throw STALE_DISPATCH_VERSION
  try {
    match.acceptDispatch("referee-1", 3);
    assert.fail("Should have thrown STALE_DISPATCH_VERSION");
  } catch (error) {
    assert.match(error.message, /version mismatch/i);
  }
  
  // Accept with correct version
  match.acceptDispatch("referee-1", 5);
  assert.equal(match.status, MATCH_OPERATION_STATES.ACCEPTED);
});

test("state machine: only assigned referee can accept", async (t) => {
  // Test that only the assigned referee can accept the dispatch
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "idle"
  });
  
  match.dispatch("referee-1", "dispatch-1", 0);
  
  // Try to accept with wrong referee
  assert.throws(
    () => match.acceptDispatch("referee-2", 0),
    /assigned Referee/
  );
  
  // Accept with correct referee
  match.acceptDispatch("referee-1", 0);
  assert.equal(match.status, MATCH_OPERATION_STATES.ACCEPTED);
});

test("state machine: dispatch conflict detection", async (t) => {
  // Test that dispatch conflict is detected
  
  const match = new MatchOperation({
    id: 1,
    tournamentId: 1,
    status: "idle"
  });
  
  match.dispatch("referee-1", "dispatch-1", 0);
  assert.equal(match.status, MATCH_OPERATION_STATES.ASSIGNED);
  
  // Try to dispatch again with different dispatchId - should fail
  // because match already has an active dispatch
  try {
    match.dispatch("referee-2", "dispatch-2", 0);
    assert.fail("Should have thrown DISPATCH_CONFLICT");
  } catch (error) {
    assert.match(error.message, /active dispatch|conflict/i);
  }
});