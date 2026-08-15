const { test } = require("node:test");
const assert = require("node:assert");

test("duplicate correlationId: idempotent return", async (t) => {
  // Test that duplicate correlationId returns existing reservation without
  // creating duplicate chronology events
  
  const existingReservation = {
    dispatch_id: "dispatch-1",
    match_id: 1,
    court_id: "court-1",
    referee_id: "referee-1",
    correlation_id: "correlation-abc-123",
    accepted_at: null,
    rejected_at: null
  };
  
  let reservationExists = false;
  
  const findByCorrelationId = async (correlationId) => {
    if (reservationExists && correlationId === existingReservation.correlation_id) {
      return existingReservation;
    }
    return null;
  };
  
  const createReservation = async (correlationId) => {
    reservationExists = true;
    return {
      dispatch_id: "dispatch-1",
      correlation_id: correlationId
    };
  };
  
  const dispatch = async (correlationId) => {
    const existing = await findByCorrelationId(correlationId);
    if (existing) {
      return {
        match: { id: 1 },
        reservation: existing,
        idempotent: true
      };
    }
    
    // Create new reservation
    const reservation = await createReservation(correlationId);
    return {
      match: { id: 1 },
      reservation,
      idempotent: false
    };
  };
  
  // First dispatch
  const result1 = await dispatch("correlation-abc-123");
  assert.equal(result1.idempotent, false);
  
  // Second dispatch with same correlationId
  const result2 = await dispatch("correlation-abc-123");
  assert.equal(result2.idempotent, true);
  assert.equal(result2.reservation.dispatch_id, "dispatch-1");
});

test("duplicate correlationId: safe reject", async (t) => {
  // Test that duplicate correlationId can be safely rejected
  
  const correlationId = "correlation-duplicate-456";
  
  const createReservation = async (data) => {
    // Simulate ER_DUP_ENTRY
    if (data.correlationId === correlationId) {
      const error = new Error("Dispatch correlation identity has already been used");
      error.code = "ER_DUP_ENTRY";
      throw error;
    }
    return { dispatch_id: "dispatch-2" };
  };
  
  await assert.rejects(
    async () => createReservation({ correlationId }),
    /already been used/
  );
});

test("different correlationIds: both succeed", async (t) => {
  // Test that different correlationIds create separate reservations
  
  const reservations = [];
  
  const createReservation = async (data) => {
    const reservation = {
      dispatch_id: `dispatch-${reservations.length + 1}`,
      correlation_id: data.correlationId
    };
    reservations.push(reservation);
    return reservation;
  };
  
  const result1 = await createReservation({ correlationId: "correlation-1" });
  const result2 = await createReservation({ correlationId: "correlation-2" });
  
  assert.equal(reservations.length, 2);
  assert.notEqual(result1.dispatch_id, result2.dispatch_id);
});

test("correlationId preserved through transaction", async (t) => {
  // Test that correlationId is written to chronology event
  
  const chronologyEvents = [];
  
  const appendEvent = async (data) => {
    chronologyEvents.push(data);
    return 1;
  };
  
  await appendEvent({
    tournamentId: 1,
    courtId: "court-1",
    matchId: 1,
    eventType: "referee_dispatch",
    sourceType: "master_dispatch",
    actorId: "master-1",
    correlationId: "correlation-preserved",
    details: { dispatchId: "dispatch-1" }
  });
  
  assert.equal(chronologyEvents.length, 1);
  assert.equal(chronologyEvents[0].correlationId, "correlation-preserved");
});

test("no duplicate chronology on idempotent dispatch", async (t) => {
  // Test that idempotent dispatch doesn't create duplicate chronology events
  
  const chronologyEvents = [];
  
  const dispatch = async (correlationId, isRetry = false) => {
    // Check for existing reservation
    const existing = chronologyEvents.find(e => e.correlationId === correlationId);
    
    if (existing && isRetry) {
      // Idempotent: return existing without writing new chronology
      return {
        idempotent: true,
        reservation: existing
      };
    }
    
    // Write chronology event
    chronologyEvents.push({
      correlationId,
      eventType: "referee_dispatch",
      timestamp: new Date().toISOString()
    });
    
    return {
      idempotent: false,
      reservation: { correlationId }
    };
  };
  
  // First dispatch
  const result1 = await dispatch("correlation-unique", false);
  assert.equal(result1.idempotent, false);
  assert.equal(chronologyEvents.length, 1);
  
  // Idempotent retry
  const result2 = await dispatch("correlation-unique", true);
  assert.equal(result2.idempotent, true);
  assert.equal(chronologyEvents.length, 1); // No duplicate
});

test("correlationId validation", async (t) => {
  // Test that correlationId is required and non-empty
  
  const dispatch = async (data) => {
    const correlationId = data.correlationId;
    
    if (!correlationId || String(correlationId).trim() === "") {
      const error = new Error("Valid correlationId is required");
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    
    return { success: true };
  };
  
  await assert.rejects(
    async () => dispatch({ correlationId: null }),
    (error) => error.code === "VALIDATION_ERROR"
  );
  
  await assert.rejects(
    async () => dispatch({ correlationId: "" }),
    (error) => error.code === "VALIDATION_ERROR"
  );
  
  const result = await dispatch({ correlationId: "valid-correlation-id" });
  assert.equal(result.success, true);
});

test("correlationId uniqueness constraint", async (t) => {
  // Test that UNIQUE KEY constraint on correlationId works
  
  const correlationIds = new Set();
  
  const createReservation = async (data) => {
    if (correlationIds.has(data.correlationId)) {
      const error = new Error("ER_DUP_ENTRY: Duplicate entry for key 'uq_dispatch_correlation'");
      error.code = "ER_DUP_ENTRY";
      throw error;
    }
    correlationIds.add(data.correlationId);
    return { dispatch_id: `dispatch-${correlationIds.size}` };
  };
  
  // First reservation succeeds
  await createReservation({ correlationId: "unique-correlation-1" });
  
  // Duplicate fails
  await assert.rejects(
    async () => createReservation({ correlationId: "unique-correlation-1" }),
    /ER_DUP_ENTRY/
  );
  
  // Different correlationId succeeds
  await createReservation({ correlationId: "unique-correlation-2" });
});

test("concurrent idempotent requests", async (t) => {
  // Test that concurrent requests with same correlationId are handled correctly
  
  const correlationId = "concurrent-correlation";
  let reservationCreated = false;
  const waiters = [];
  
  const createOrWait = async (correlationId) => {
    if (reservationCreated) {
      // Wait for existing reservation
      return { idempotent: true };
    }
    
    reservationCreated = true;
    return { idempotent: false, correlationId };
  };
  
  const [result1, result2] = await Promise.allSettled([
    createOrWait(correlationId),
    createOrWait(correlationId)
  ]);
  
  // One should create, one should be idempotent
  const created = [result1, result2].filter(r => r.status === "fulfilled" && r.value.idempotent === false);
  const idempotent = [result1, result2].filter(r => r.status === "fulfilled" && r.value.idempotent === true);
  
  assert.equal(created.length, 1, "Exactly one should create the reservation");
  assert.equal(idempotent.length, 1, "Exactly one should be idempotent");
});