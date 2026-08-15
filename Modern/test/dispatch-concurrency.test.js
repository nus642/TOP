const { test } = require("node:test");
const assert = require("node:assert");

// ---------------------------------------------------------------------------
// Shared in-memory mock DB — monkey-patched before loading production modules.
// All repositories and services that require("../database/db") share the same
// pool object, so mutating its properties is visible to every caller.
// ---------------------------------------------------------------------------

const db = require("../database/db");

function createMockConnection(data) {
  return {
    query: async (sql, params = []) => {
      // --- SELECTs ---
      if (sql.includes("SELECT") && sql.includes("FROM tournaments")) {
        return [[{ id: params[0], name: "Test Competition", status: data.tournamentStatus || "running" }]];
      }
      if (sql.includes("SELECT") && sql.includes("FROM match_schedules")) {
        return [[{ court_id: data.scheduledCourt || "court-1" }]];
      }
      if (sql.includes("SELECT") && sql.includes("FROM matches")) {
        const match = data.get(`match:${params[1]}`);
        return [[match || null]];
      }
      if (sql.includes("SELECT") && sql.includes("FROM competition_referees")) {
        const refId = params[1];
        return [[{ id: 1, competition_id: params[0], referee_id: refId, active: 1, eligible: 1 }]];
      }
      if (sql.includes("SELECT") && sql.includes("FROM referee_dispatch_reservations")) {
        // Active reservation by court
        if (sql.includes("r.court_id =") && sql.includes("r.competition_id")) {
          for (const [, v] of data) {
            if (v && v.court_id === params[0] && v.competition_id === params[1] &&
                !v.accepted_at && !v.rejected_at) {
              const match = data.get(`match:${v.match_id}`);
              if (match && match.status === "assigned") return [[v]];
            }
          }
          return [[null]];
        }
        // Active reservation by referee
        if (sql.includes("r.referee_id =") && sql.includes("r.competition_id")) {
          for (const [, v] of data) {
            if (v && v.referee_id === params[0] && v.competition_id === params[1] &&
                !v.accepted_at && !v.rejected_at) {
              const match = data.get(`match:${v.match_id}`);
              if (match && match.status === "assigned") return [[v]];
            }
          }
          return [[null]];
        }
        if (sql.includes("dispatch_id =")) {
          const r = data.get(`reservation:${params[0]}`);
          return [[r || null]];
        }
        if (sql.includes("match_id =")) {
          for (const [, v] of data) {
            if (v && v.match_id === params[0] && v.dispatch_id) return [[v]];
          }
          return [[null]];
        }
        if (sql.includes("correlation_id =")) {
          // findByCorrelationId(competitionId, correlationId)
          const compId = params[0];
          const corrId = params[1];
          for (const [, v] of data) {
            if (v && v.competition_id === compId && v.correlation_id === corrId) return [[v]];
          }
          return [[null]];
        }
      }

      // --- INSERTs ---
      if (sql.includes("INSERT") && sql.includes("INTO referee_dispatch_reservations")) {
        const [dispatchId, matchId, courtId, refereeId, expectedVersion, correlationId, competitionId] = params;
        data.set(`reservation:${dispatchId}`, {
          dispatch_id: dispatchId, match_id: matchId, court_id: courtId,
          referee_id: refereeId, expected_version: expectedVersion,
          correlation_id: correlationId, competition_id: competitionId,
          accepted_at: null, rejected_at: null,
          rejected_reason: null, created_at: new Date().toISOString()
        });
        return [{ insertId: 1 }];
      }
      if (sql.includes("INSERT") && sql.includes("INTO tournament_coordination_chronology")) {
        return [{ insertId: 1 }];
      }

      // --- UPDATEs ---
      if (sql.includes("UPDATE") && sql.includes("matches") && sql.includes("SET")) {
        const key = `match:${params[params.length - 1]}`;
        const match = data.get(key);
        if (match) {
          if (sql.includes("status = 'assigned'")) {
            match.status = "assigned";
            match.referee_id = params[0];
          }
          if (sql.includes("status = 'accepted'")) {
            match.status = "accepted";
          }
          if (sql.includes("status = 'upcoming'")) {
            match.status = "upcoming";
            match.referee_id = null;
            match.dispatch_id = null;
            match.dispatch_version = null;
          }
          if (sql.includes("dispatch_id =")) {
            match.dispatch_id = params[1];
            match.dispatch_version = params[2];
          }
          if (sql.includes("dispatch_version = dispatch_version + 1")) {
            match.dispatch_version = (match.dispatch_version || 0) + 1;
          }
          if (sql.includes("referee_id =") && sql.includes("dispatch_version = dispatch_version + 1")) {
            match.referee_id = params[0];
          }
        }
        return [{ affectedRows: 1 }];
      }
      if (sql.includes("UPDATE") && sql.includes("referee_dispatch_reservations")) {
        return [{ affectedRows: 1 }];
      }
      if (sql.includes("UPDATE") && sql.includes("court_operating_conditions")) {
        return [{ affectedRows: 1 }];
      }

      return [[]];
    }
  };
}

// Monkey-patch db object (all modules share this reference)
db.withTransaction = async (fn) => {
  const connection = createMockConnection(sharedData);
  return fn(connection);
};

// ---------------------------------------------------------------------------
// Load production service AFTER patching
// ---------------------------------------------------------------------------

const dispatchService = require("../services/dispatch.service");

// Shared data store — reset per test
let sharedData;

function resetData(overrides = {}) {
  sharedData = new Map();
  sharedData.tournamentStatus = overrides.tournamentStatus || "running";
  sharedData.scheduledCourt = overrides.scheduledCourt || "court-1";
  sharedData.set(`match:${overrides.matchId || 1}`, {
    id: overrides.matchId || 1,
    tournament_id: overrides.competitionId || 1,
    referee_id: null,
    status: overrides.matchStatus || "idle",
    score1: null, score2: null,
    dispatch_id: overrides.dispatchId || null,
    dispatch_version: overrides.dispatchVersion ?? null,
    assigned_at: null,
    responsibility_accepted_at: null,
    result_confirmed_at: null,
    result_confirmed_by: null
  });
  return sharedData;
}

const masterActor = { actorId: "master-1", actorType: "master" };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("concurrent dispatch same referee: second call fails active reservation check", async () => {
  resetData();

  const result1 = await dispatchService.dispatch(1, 1, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "corr-1", expectedVersion: 0
  }, masterActor);

  assert.equal(result1.idempotent, false);
  assert.equal(result1.match.status, "assigned");

  // Reset match 2 to idle for second attempt
  sharedData.set("match:2", {
    id: 2, tournament_id: 1, referee_id: null, status: "idle",
    score1: null, score2: null, dispatch_id: null, dispatch_version: null,
    assigned_at: null, responsibility_accepted_at: null,
    result_confirmed_at: null, result_confirmed_by: null
  });

  // Second dispatch with same referee → fails because active reservation exists
  await assert.rejects(
    () => dispatchService.dispatch(1, 2, {
      courtId: "court-1", refereeId: "referee-1", correlationId: "corr-2", expectedVersion: 0
    }, masterActor),
    /REFEREE_CONFLICT|active dispatch reservation/
  );
});

test("concurrent dispatch same court: second call fails active reservation check", async () => {
  resetData();

  const result1 = await dispatchService.dispatch(1, 1, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "corr-court-1", expectedVersion: 0
  }, masterActor);
  assert.equal(result1.idempotent, false);

  // Reset match 2 for second attempt (different referee, same court)
  sharedData.set("match:2", {
    id: 2, tournament_id: 1, referee_id: null, status: "idle",
    score1: null, score2: null, dispatch_id: null, dispatch_version: null,
    assigned_at: null, responsibility_accepted_at: null,
    result_confirmed_at: null, result_confirmed_by: null
  });

  await assert.rejects(
    () => dispatchService.dispatch(1, 2, {
      courtId: "court-1", refereeId: "referee-2", correlationId: "corr-court-2", expectedVersion: 0
    }, masterActor),
    /COURT_CONFLICT|active dispatch reservation/
  );
});

test("stale expectedVersion: full rollback, no writes", async () => {
  resetData({ matchId: 10, dispatchVersion: 2 });

  await assert.rejects(
    () => dispatchService.dispatch(1, 10, {
      courtId: "court-1", refereeId: "referee-1",
      correlationId: "corr-stale", expectedVersion: 1
    }, masterActor),
    /STALE_DISPATCH_VERSION/
  );

  // Verify no writes occurred — match unchanged
  const match = sharedData.get("match:10");
  assert.equal(match.status, "idle");
  assert.equal(match.dispatch_id, null);

  // Verify no reservation was created
  let reservationCount = 0;
  for (const [k] of sharedData) {
    if (k.startsWith("reservation:")) reservationCount++;
  }
  assert.equal(reservationCount, 0);
});

test("missing expectedVersion: rejected with VALIDATION_ERROR", async () => {
  resetData({ matchId: 11 });

  await assert.rejects(
    () => dispatchService.dispatch(1, 11, {
      courtId: "court-1", refereeId: "referee-1", correlationId: "corr-no-ver"
    }, masterActor),
    /Valid expectedVersion is required/
  );
});

test("forced failure: transaction rollback leaves no partial writes", async () => {
  resetData({ matchId: 20 });

  // Monkey-patch to force failure after reservation creation
  const repo = require("../repositories/competition-referee.repository");
  const origCreateReservation = repo.createReservation;
  let reservationAttempted = false;
  repo.createReservation = async () => {
    reservationAttempted = true;
    throw new Error("Forced failure after reservation");
  };

  try {
    await assert.rejects(
      () => dispatchService.dispatch(1, 20, {
        courtId: "court-1", refereeId: "referee-1", correlationId: "corr-force", expectedVersion: 0
      }, masterActor),
      /Forced failure/
    );
  } finally {
    repo.createReservation = origCreateReservation;
  }

  assert.equal(reservationAttempted, true, "Reservation was attempted");

  // Match remains unchanged (transaction rolled back)
  const match = sharedData.get("match:20");
  assert.equal(match.status, "idle");
  assert.equal(match.dispatch_id, null);
});

test("FOR UPDATE lock: dispatch queries match row with FOR UPDATE", async () => {
  resetData({ matchId: 30 });

  const lockedQueries = [];
  const origWithTransaction = db.withTransaction;
  db.withTransaction = async (fn) => {
    const connection = createMockConnection(sharedData);
    const origQuery = connection.query;
    connection.query = async (sql, params) => {
      if (sql.includes("FOR UPDATE")) {
        lockedQueries.push(sql.trim());
      }
      return origQuery(sql, params);
    };
    return fn(connection);
  };

  try {
    await dispatchService.dispatch(1, 30, {
      courtId: "court-1", refereeId: "referee-1", correlationId: "corr-lock", expectedVersion: 0
    }, masterActor);
  } finally {
    db.withTransaction = origWithTransaction;
  }

  // Verify match row was locked with FOR UPDATE
  const matchLock = lockedQueries.find(q => q.includes("FROM matches") && q.includes("FOR UPDATE"));
  assert.ok(matchLock, "Match row must be locked with FOR UPDATE");

  // Verify tournament row was locked with FOR UPDATE
  const tournamentLock = lockedQueries.find(q => q.includes("FROM tournaments") && q.includes("FOR UPDATE"));
  assert.ok(tournamentLock, "Tournament row must be locked with FOR UPDATE");
});

test("same match cannot be dispatched twice: second is idempotent", async () => {
  resetData({ matchId: 40 });

  const result1 = await dispatchService.dispatch(1, 40, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "corr-same", expectedVersion: 0
  }, masterActor);

  assert.equal(result1.idempotent, false);
  assert.equal(result1.match.status, "assigned");

  // Same correlationId → idempotent return
  const result2 = await dispatchService.dispatch(1, 40, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "corr-same", expectedVersion: 0
  }, masterActor);

  assert.equal(result2.idempotent, true);
});

test("withdraw releases dispatch and resets match", async () => {
  resetData({ matchId: 50 });

  await dispatchService.dispatch(1, 50, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "corr-wd", expectedVersion: 0
  }, masterActor);

  const match = sharedData.get("match:50");
  assert.equal(match.status, "assigned");
  assert.equal(match.dispatch_version, 1);

  const result = await dispatchService.withdrawDispatch(1, 50, masterActor, {
    reason: "test", expectedVersion: 1
  });
  assert.equal(result.match.status, "upcoming");
});

test("reassign atomically swaps referee", async () => {
  resetData({ matchId: 60 });

  await dispatchService.dispatch(1, 60, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "corr-re", expectedVersion: 0
  }, masterActor);

  const result = await dispatchService.reassignDispatch(1, 60, "referee-2", masterActor, {
    reason: "test", expectedVersion: 1
  });
  assert.equal(result.match.refereeId, "referee-2");
});

test("completed competition rejects dispatch", async () => {
  resetData({ matchId: 70, tournamentStatus: "completed" });

  await assert.rejects(
    () => dispatchService.dispatch(1, 70, {
      courtId: "court-1", refereeId: "referee-1", correlationId: "corr-completed", expectedVersion: 0
    }, masterActor),
    /not available/i
  );
});

test("restart reconstruction: state persisted in match and reservation", async () => {
  resetData({ matchId: 80 });

  await dispatchService.dispatch(1, 80, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "corr-restart", expectedVersion: 0
  }, masterActor);

  const match = sharedData.get("match:80");
  assert.equal(match.status, "assigned");
  assert.ok(match.dispatch_id);
  assert.equal(match.dispatch_version, 1);

  // Find the reservation
  let reservation = null;
  for (const [k, v] of sharedData) {
    if (k.startsWith("reservation:") && v.match_id === 80) {
      reservation = v;
      break;
    }
  }
  assert.ok(reservation, "Reservation must exist");
  assert.equal(reservation.referee_id, "referee-1");
  assert.equal(reservation.rejected_at, null);
  assert.equal(reservation.competition_id, 1);
});
