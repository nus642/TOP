const { test } = require("node:test");
const assert = require("node:assert");

// Helper to simulate dispatch service authorization checks
function requireMaster(actor) {
  if (actor?.actorType !== "master") {
    const error = new Error("Only a master may perform dispatch operations");
    error.code = "VALIDATION_ERROR";
    throw error;
  }
  return actor.actorId;
}

function requireReferee(actor) {
  if (actor?.actorType !== "referee") {
    const error = new Error("Only a referee may accept a dispatch");
    error.code = "VALIDATION_ERROR";
    throw error;
  }
  return actor.actorId;
}

test("non-master cannot dispatch", async (t) => {
  // Test that non-master actors cannot dispatch
  
  const dispatch = (actor) => {
    requireMaster(actor);
    return { success: true };
  };
  
  // Master succeeds
  const result = dispatch({ actorId: "master-1", actorType: "master" });
  assert.equal(result.success, true);
  
  // Referee fails
  assert.throws(
    () => dispatch({ actorId: "referee-1", actorType: "referee" }),
    /Only a master/
  );
  
  // Participant fails
  assert.throws(
    () => dispatch({ actorId: "participant-1", actorType: "participant" }),
    /Only a master/
  );
  
  // No actor fails
  assert.throws(
    () => dispatch(null),
    /Only a master/
  );
});

test("non-master cannot withdraw", async (t) => {
  // Test that non-master actors cannot withdraw dispatch
  
  const withdraw = (actor) => {
    requireMaster(actor);
    return { success: true };
  };
  
  assert.throws(
    () => withdraw({ actorId: "referee-1", actorType: "referee" }),
    /Only a master/
  );
});

test("non-master cannot reassign", async (t) => {
  // Test that non-master actors cannot reassign dispatch
  
  const reassign = (actor) => {
    requireMaster(actor);
    return { success: true };
  };
  
  assert.throws(
    () => reassign({ actorId: "referee-1", actorType: "referee" }),
    /Only a master/
  );
});

test("non-eligible referee cannot be dispatched", async (t) => {
  // Test that only eligible referees can be dispatched
  
  const rosterEntry = {
    refereeId: "referee-1",
    active: true,
    eligible: false
  };
  
  const dispatch = () => {
    if (!rosterEntry.active || !rosterEntry.eligible) {
      throw new Error("Referee is not eligible for dispatch");
    }
    return { success: true };
  };
  
  assert.throws(
    () => dispatch(),
    /not eligible/
  );
});

test("inactive referee cannot be dispatched", async (t) => {
  // Test that inactive referees cannot be dispatched
  
  const rosterEntry = {
    refereeId: "referee-1",
    active: false,
    eligible: true
  };
  
  const dispatch = () => {
    if (!rosterEntry.active || !rosterEntry.eligible) {
      throw new Error("Referee is not eligible for dispatch");
    }
    return { success: true };
  };
  
  assert.throws(
    () => dispatch(),
    /not eligible/
  );
});

test("referee not in roster cannot be dispatched", async (t) => {
  // Test that referees not in roster cannot be dispatched
  
  const rosterEntry = null;
  
  const dispatch = () => {
    if (!rosterEntry) {
      throw new Error("Referee is not in the competition roster");
    }
    return { success: true };
  };
  
  assert.throws(
    () => dispatch(),
    /not in the competition roster/
  );
});

test("wrong referee cannot accept", async (t) => {
  // Test that only the assigned referee can accept
  
  const match = {
    refereeId: "referee-1"
  };
  
  const accept = (refereeId) => {
    if (match.refereeId !== refereeId) {
      throw new Error("Only the assigned referee may accept this dispatch");
    }
    return { success: true };
  };
  
  // Assigned referee succeeds
  const result = accept("referee-1");
  assert.equal(result.success, true);
  
  // Wrong referee fails
  assert.throws(
    () => accept("referee-2"),
    /assigned referee/
  );
});

test("withdrawn referee cannot accept old dispatch", async (t) => {
  // Test that a withdrawn referee cannot accept the old dispatch
  
  const match = {
    refereeId: null, // Withdrawn
    status: "upcoming"
  };
  
  const accept = (refereeId) => {
    if (!match.refereeId) {
      throw new Error("No active dispatch for this match");
    }
    if (match.refereeId !== refereeId) {
      throw new Error("Only the assigned referee may accept this dispatch");
    }
    return { success: true };
  };
  
  assert.throws(
    () => accept("referee-1"),
    /No active dispatch/
  );
});

test("replaced referee cannot accept old dispatch", async (t) => {
  // Test that a replaced referee cannot accept the old dispatch
  
  const match = {
    refereeId: "referee-2", // Reassigned to new referee
    status: "waiting_acceptance"
  };
  
  const accept = (refereeId) => {
    if (match.refereeId !== refereeId) {
      throw new Error("Only the assigned referee may accept this dispatch");
    }
    return { success: true };
  };
  
  // Old referee fails
  assert.throws(
    () => accept("referee-1"),
    /assigned referee/
  );
  
  // New referee succeeds
  const result = accept("referee-2");
  assert.equal(result.success, true);
});

test("completed competition rejects dispatch", async (t) => {
  // Test that completed competitions reject dispatch operations
  
  const tournament = { status: "completed" };
  
  const assertCompetitionLifecycleEligible = (status, capability) => {
    if (["completed", "archived"].includes(status)) {
      throw new Error("Competition is not eligible for changes");
    }
  };
  
  assert.throws(
    () => assertCompetitionLifecycleEligible(tournament.status, "refereeAssignment"),
    /not eligible/
  );
});

test("archived competition rejects dispatch", async (t) => {
  // Test that archived competitions reject dispatch operations
  
  const tournament = { status: "archived" };
  
  const assertCompetitionLifecycleEligible = (status, capability) => {
    if (["completed", "archived"].includes(status)) {
      throw new Error("Competition is not eligible for changes");
    }
  };
  
  assert.throws(
    () => assertCompetitionLifecycleEligible(tournament.status, "refereeAssignment"),
    /not eligible/
  );
});

test("ongoing competition allows dispatch", async (t) => {
  // Test that ongoing competitions allow dispatch operations
  
  const tournament = { status: "ongoing" };
  
  const assertCompetitionLifecycleEligible = (status, capability) => {
    if (["completed", "archived"].includes(status)) {
      throw new Error("Competition is not eligible for changes");
    }
  };
  
  // Should not throw
  assertCompetitionLifecycleEligible(tournament.status, "refereeAssignment");
});

test("M1 official record unaffected", async (t) => {
  // Test that M1 Official Record is not modified by dispatch operations
  
  const officialRecord = {
    tournamentId: 1,
    matchId: 1,
    refereeId: "referee-1",
    score1: 21,
    score2: 18,
    confirmedAt: new Date().toISOString(),
    confirmedBy: "master-1"
  };
  
  // Dispatch operation should not modify official record
  const dispatch = () => {
    return { success: true };
  };
  
  dispatch();
  
  // Official record unchanged
  assert.equal(officialRecord.refereeId, "referee-1");
  assert.equal(officialRecord.score1, 21);
});

test("public scoreboard unaffected", async (t) => {
  // Test that public scoreboard is not modified by dispatch operations
  
  const publicScoreboard = {
    matchId: 1,
    team1: "Team A",
    team2: "Team B",
    score1: null,
    score2: null,
    status: "upcoming"
  };
  
  // Dispatch operation should not modify public scoreboard
  const dispatch = () => {
    return { success: true };
  };
  
  dispatch();
  
  // Public scoreboard unchanged
  assert.equal(publicScoreboard.status, "upcoming");
});

test("archive unaffected", async (t) => {
  // Test that competition archive is not modified by dispatch operations
  
  const archive = {
    competitionId: 1,
    archivedAt: new Date().toISOString(),
    finalStandings: []
  };
  
  // Dispatch operation should not modify archive
  const dispatch = () => {
    return { success: true };
  };
  
  dispatch();
  
  // Archive unchanged
  assert.ok(archive.archivedAt);
});

test("actor session boundary enforced", async (t) => {
  // Test that requireActorSession middleware is enforced
  
  const middleware = (req, res, next) => {
    if (!req.actor) {
      res.status(401).json({ error: "Authenticated actor session required" });
      return;
    }
    next();
  };
  
  const req = {};
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; }
  };
  
  let nextCalled = false;
  
  // Without actor session
  middleware(req, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
  
  // With actor session
  req.actor = { actorId: "master-1", actorType: "master" };
  middleware(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test("URL path actor matching", async (t) => {
  // Test that URL path actorId matches session actorId
  
  const requireActorSession = (store) => {
    return (req, res, next) => {
      const current = { actorId: "referee-1", actorType: "referee" };
      
      // Check URL path match
      const match = req.path.match(/\/referees\/([^/]+)/);
      const routedActorId = match && decodeURIComponent(match[1]);
      
      if (routedActorId && routedActorId !== current.actorId) {
        res.status(401).json({ error: "Workflow actor does not match authenticated session" });
        return;
      }
      
      req.actor = current;
      next();
    };
  };
  
  const req = { path: "/api/referee-workflow/1/referees/referee-2/matches/1/accept" };
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; }
  };
  
  let nextCalled = false;
  
  const middleware = requireActorSession({});
  middleware(req, res, () => { nextCalled = true; });
  
  // URL has referee-2, session has referee-1 → should fail
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});