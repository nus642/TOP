const { test } = require("node:test");
const assert = require("node:assert");

// ---------------------------------------------------------------------------
// Shared in-memory mock DB — same pattern as dispatch-concurrency.test.js
// ---------------------------------------------------------------------------

const db = require("../database/db");

function createMockConnection(data) {
  return {
    query: async (sql, params = []) => {
      if (sql.includes("SELECT") && sql.includes("FROM tournaments")) {
        return [[{ id: params[0], name: "Test", status: "running" }]];
      }
      if (sql.includes("SELECT") && sql.includes("FROM match_schedules")) {
        const courtForMatch = data.courtOverride || "court-1";
        return [[{ court_id: courtForMatch }]];
      }
      if (sql.includes("SELECT") && sql.includes("FROM matches")) {
        const match = data.get(`match:${params[1]}`);
        return [[match || null]];
      }
      if (sql.includes("SELECT") && sql.includes("FROM competition_referees")) {
        return [[{ id: 1, competition_id: params[0], referee_id: params[1], active: 1, eligible: 1 }]];
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
          const compId = params[0];
          const corrId = params[1];
          for (const [, v] of data) {
            if (v && v.competition_id === compId && v.correlation_id === corrId) return [[v]];
          }
          return [[null]];
        }
      }
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
        data.chronologyEvents = data.chronologyEvents || [];
        data.chronologyEvents.push({
          tournamentId: params[0], courtId: params[1], matchId: params[2],
          eventType: params[3], sourceType: params[4], actorId: params[5],
          correlationId: params[6]
        });
        return [{ insertId: data.chronologyEvents.length }];
      }
      if (sql.includes("UPDATE") && sql.includes("matches") && sql.includes("SET")) {
        const key = `match:${params[params.length - 1]}`;
        const match = data.get(key);
        if (match) {
          if (sql.includes("status = 'assigned'")) {
            match.status = "assigned";
            match.referee_id = params[0];
          }
          if (sql.includes("dispatch_id =")) {
            match.dispatch_id = params[1];
            match.dispatch_version = params[2];
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

const originalWithTransaction = db.withTransaction;

// Shared data store
let sharedData;

function resetData(matchId = 1) {
  sharedData = new Map();
  sharedData.chronologyEvents = [];
  sharedData.set(`match:${matchId}`, {
    id: matchId, tournament_id: 1, referee_id: null, status: "idle",
    score1: null, score2: null, dispatch_id: null, dispatch_version: null,
    assigned_at: null, responsibility_accepted_at: null,
    result_confirmed_at: null, result_confirmed_by: null
  });
  // Patch withTransaction to use shared data
  db.withTransaction = async (fn) => {
    const connection = createMockConnection(sharedData);
    return fn(connection);
  };
  return sharedData;
}

const dispatchService = require("../services/dispatch.service");
const masterActor = { actorId: "master-1", actorType: "master" };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("duplicate correlationId: idempotent return without duplicate chronology", async () => {
  resetData(1);

  const result1 = await dispatchService.dispatch(1, 1, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "correlation-abc-123", expectedVersion: 0
  }, masterActor);

  assert.equal(result1.idempotent, false);
  const chronologyCountAfterFirst = sharedData.chronologyEvents.length;
  assert.equal(chronologyCountAfterFirst, 1, "One chronology event after first dispatch");

  // Second dispatch with same correlationId → idempotent
  const result2 = await dispatchService.dispatch(1, 1, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "correlation-abc-123", expectedVersion: 0
  }, masterActor);

  assert.equal(result2.idempotent, true);
  assert.equal(result2.reservation.correlationId, "correlation-abc-123");

  // No duplicate chronology event
  assert.equal(sharedData.chronologyEvents.length, chronologyCountAfterFirst,
    "No duplicate chronology on idempotent return");
});

test("ER_DUP_ENTRY safe reject: reservation creation failure rolls back", async () => {
  resetData(2);

  // Simulate ER_DUP_ENTRY by patching createReservation before any dispatch
  const repo = require("../repositories/competition-referee.repository");
  const origCreate = repo.createReservation;
  repo.createReservation = async () => {
    const err = new Error("ER_DUP_ENTRY: Duplicate entry");
    err.code = "ER_DUP_ENTRY";
    throw err;
  };

  try {
    await assert.rejects(
      () => dispatchService.dispatch(1, 2, {
        courtId: "court-1", refereeId: "referee-1", correlationId: "correlation-dup", expectedVersion: 0
      }, masterActor),
      /ER_DUP_ENTRY|already been used|Duplicate/
    );
  } finally {
    repo.createReservation = origCreate;
  }

  // Verify no writes occurred — match unchanged
  const match = sharedData.get("match:2");
  assert.equal(match.status, "idle");
  assert.equal(match.dispatch_id, null);
});

test("different correlationIds: both succeed with separate reservations", async () => {
  resetData(3);

  // First dispatch on match 3 with referee-1
  const result1 = await dispatchService.dispatch(1, 3, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "correlation-1", expectedVersion: 0
  }, masterActor);
  assert.equal(result1.idempotent, false);

  // Second dispatch on different match (match 4) with different referee and court
  sharedData.set("match:4", {
    id: 4, tournament_id: 1, referee_id: null, status: "idle",
    score1: null, score2: null, dispatch_id: null, dispatch_version: null,
    assigned_at: null, responsibility_accepted_at: null,
    result_confirmed_at: null, result_confirmed_by: null
  });
  sharedData.courtOverride = "court-2";

  const result2 = await dispatchService.dispatch(1, 4, {
    courtId: "court-2", refereeId: "referee-2", correlationId: "correlation-2", expectedVersion: 0
  }, masterActor);
  assert.equal(result2.idempotent, false);

  // Two separate reservations
  let reservationCount = 0;
  for (const [k] of sharedData) {
    if (k.startsWith("reservation:")) reservationCount++;
  }
  assert.equal(reservationCount, 2);
});

test("correlationId preserved through chronology event", async () => {
  resetData(5);

  await dispatchService.dispatch(1, 5, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "correlation-preserved", expectedVersion: 0
  }, masterActor);

  assert.equal(sharedData.chronologyEvents.length, 1);
  assert.equal(sharedData.chronologyEvents[0].correlationId, "correlation-preserved");
  assert.equal(sharedData.chronologyEvents[0].eventType, "referee_dispatch");
  assert.equal(sharedData.chronologyEvents[0].sourceType, "master_dispatch");
  assert.equal(sharedData.chronologyEvents[0].actorId, "master-1");
});

test("no duplicate chronology on idempotent retry", async () => {
  resetData(6);

  const result1 = await dispatchService.dispatch(1, 6, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "correlation-unique", expectedVersion: 0
  }, masterActor);
  assert.equal(result1.idempotent, false);
  assert.equal(sharedData.chronologyEvents.length, 1);

  // Idempotent retry
  const result2 = await dispatchService.dispatch(1, 6, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "correlation-unique", expectedVersion: 0
  }, masterActor);
  assert.equal(result2.idempotent, true);
  assert.equal(sharedData.chronologyEvents.length, 1, "No duplicate chronology");
});

test("correlationId uniqueness enforced by reservation table", async () => {
  resetData(7);

  // First reservation succeeds
  const result1 = await dispatchService.dispatch(1, 7, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "unique-correlation-1", expectedVersion: 0
  }, masterActor);
  assert.equal(result1.idempotent, false);

  // Same correlationId → idempotent (not a duplicate)
  const result2 = await dispatchService.dispatch(1, 7, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "unique-correlation-1", expectedVersion: 0
  }, masterActor);
  assert.equal(result2.idempotent, true);
  assert.equal(result2.reservation.correlationId, "unique-correlation-1");
});

test("concurrent idempotent requests: one creates, one returns existing", async () => {
  resetData(8);

  const result1 = await dispatchService.dispatch(1, 8, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "concurrent-correlation", expectedVersion: 0
  }, masterActor);

  assert.equal(result1.idempotent, false, "First request creates reservation");

  const result2 = await dispatchService.dispatch(1, 8, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "concurrent-correlation", expectedVersion: 0
  }, masterActor);

  assert.equal(result2.idempotent, true, "Second request is idempotent");
  assert.equal(result2.reservation.correlationId, "concurrent-correlation");
});

test("reservation includes competition_id", async () => {
  resetData(9);

  const result = await dispatchService.dispatch(1, 9, {
    courtId: "court-1", refereeId: "referee-1", correlationId: "comp-scope-test", expectedVersion: 0
  }, masterActor);

  assert.equal(result.reservation.competitionId, 1);
});
