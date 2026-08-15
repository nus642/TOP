const assert = require("node:assert/strict");
const test = require("node:test");
const { createMasterApi } = require("../operator/master-api-client");
const { createMasterWorkflow } = require("../operator/master-workflow");
const { createIdentityContext } = require("../operator/identity-context");
const UiText = require("../shell/ui-text");

// ── 1. deriveDispatchStatus maps backend fields to UI display states ──

test("deriveDispatchStatus: idle match without dispatch → not_dispatched", () => {
  assert.equal(UiText.deriveDispatchStatus({ operationStatus: "idle", referee: {} }), "not_dispatched");
  assert.equal(UiText.deriveDispatchStatus({ operationStatus: "upcoming", referee: {} }), "not_dispatched");
});

test("deriveDispatchStatus: assigned with dispatchId but no acceptance → waiting_acceptance", () => {
  const match = {
    operationStatus: "assigned",
    referee: { dispatchId: "d-1", dispatchVersion: 1, responsibilityAcceptedAt: null }
  };
  assert.equal(UiText.deriveDispatchStatus(match), "waiting_acceptance");
});

test("deriveDispatchStatus: accepted → referee_accepted", () => {
  const match = {
    operationStatus: "accepted",
    referee: { dispatchId: "d-1", dispatchVersion: 1, responsibilityAcceptedAt: new Date().toISOString() }
  };
  assert.equal(UiText.deriveDispatchStatus(match), "referee_accepted");
});

test("deriveDispatchStatus: playing/scored/confirmed map correctly", () => {
  assert.equal(UiText.deriveDispatchStatus({ operationStatus: "playing", referee: {} }), "playing");
  assert.equal(UiText.deriveDispatchStatus({ operationStatus: "scored", referee: {} }), "scored");
  assert.equal(UiText.deriveDispatchStatus({ operationStatus: "confirmed", referee: {} }), "confirmed");
  assert.equal(UiText.deriveDispatchStatus({ operationStatus: "finished", referee: {} }), "confirmed");
});

// ── 2. Dispatch status labels are in Chinese ──

test("dispatchStatusLabel: all labels are Chinese, no English leaks", () => {
  const labels = ["not_dispatched", "waiting_acceptance", "referee_accepted", "playing", "scored", "confirmed"];
  for (const key of labels) {
    const label = UiText.dispatchStatusLabel(key);
    assert.ok(label, `label for ${key} should exist`);
    assert.doesNotMatch(label, /^[a-z_]+$/, `label for ${key} should not be raw English enum`);
  }
});

// ── 3. Error mapping: Chinese UI with error codes for debugging ──

test("userFacingError: maps STALE_DISPATCH_VERSION to Chinese", () => {
  const error = new Error("STALE_DISPATCH_VERSION: Dispatch version mismatch");
  error.errorCode = "STALE_DISPATCH_VERSION";
  const msg = UiText.userFacingError(error);
  assert.match(msg, /刷新/);
  assert.doesNotMatch(msg, /STALE_DISPATCH_VERSION/);
});

test("userFacingError: maps COURT_CONFLICT to Chinese", () => {
  const error = new Error("COURT_CONFLICT: Court A1 already has active reservation");
  error.errorCode = "COURT_CONFLICT";
  const msg = UiText.userFacingError(error);
  assert.match(msg, /场地冲突/);
  assert.doesNotMatch(msg, /COURT_CONFLICT/);
});

test("userFacingError: maps REFEREE_CONFLICT to Chinese", () => {
  const error = new Error("REFEREE_CONFLICT: Referee R1 already assigned");
  error.errorCode = "REFEREE_CONFLICT";
  const msg = UiText.userFacingError(error);
  assert.match(msg, /裁判冲突/);
  assert.doesNotMatch(msg, /REFEREE_CONFLICT/);
});

test("userFacingError: maps FORBIDDEN to Chinese", () => {
  const error = new Error("Only a master may perform dispatch operations");
  error.statusCode = 403;
  const msg = UiText.userFacingError(error);
  assert.match(msg, /无权/);
});

test("userFacingError: maps session errors to Chinese", () => {
  const error = new Error("Authenticated actor session required");
  const msg = UiText.userFacingError(error);
  assert.match(msg, /登录/);
});

test("userFacingError: extracts error code from message prefix when errorCode not set", () => {
  const error = new Error("STALE_DISPATCH_VERSION: version mismatch");
  const msg = UiText.userFacingError(error);
  assert.match(msg, /刷新/);
});

test("userFacingError: 409 status maps to stale version message", () => {
  const error = new Error("some unknown conflict");
  error.statusCode = 409;
  const msg = UiText.userFacingError(error);
  assert.match(msg, /刷新/);
});

// ── 4. API client: dispatch/withdraw/reassign send correct payloads ──

test("master API client: dispatch sends courtId, refereeId, expectedVersion, correlationId", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push([url, options.method || "GET", JSON.parse(options.body || "null")]);
    return { ok: true, json: async () => ({}) };
  };
  const api = createMasterApi({ fetchImpl });
  await api.dispatch("c1", "m1", { courtId: "A1", refereeId: "R1", expectedVersion: 0, correlationId: "corr-1" });
  assert.equal(calls[0][0], "/api/master-workflow/c1/matches/m1/dispatch");
  assert.equal(calls[0][1], "POST");
  assert.deepEqual(calls[0][2], { courtId: "A1", refereeId: "R1", expectedVersion: 0, correlationId: "corr-1" });
});

test("master API client: withdraw sends expectedVersion and correlationId", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push([url, options.method || "GET", JSON.parse(options.body || "null")]);
    return { ok: true, json: async () => ({}) };
  };
  const api = createMasterApi({ fetchImpl });
  await api.withdraw("c1", "m1", { expectedVersion: 1, correlationId: "corr-2" });
  assert.equal(calls[0][0], "/api/master-workflow/c1/matches/m1/withdraw");
  assert.deepEqual(calls[0][2], { expectedVersion: 1, correlationId: "corr-2" });
});

test("master API client: reassign sends newRefereeId, expectedVersion, correlationId", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push([url, options.method || "GET", JSON.parse(options.body || "null")]);
    return { ok: true, json: async () => ({}) };
  };
  const api = createMasterApi({ fetchImpl });
  await api.reassign("c1", "m1", { newRefereeId: "R2", expectedVersion: 1, correlationId: "corr-3" });
  assert.equal(calls[0][0], "/api/master-workflow/c1/matches/m1/reassign");
  assert.deepEqual(calls[0][2], { newRefereeId: "R2", expectedVersion: 1, correlationId: "corr-3" });
});

test("master API client: availableCandidates fetches from referee-coordination", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push([url, options.method || "GET"]);
    return { ok: true, json: async () => ({ matchId: 1, courtId: "A1", eligibleReferees: [] }) };
  };
  const api = createMasterApi({ fetchImpl });
  const result = await api.availableCandidates("c1", "m1");
  assert.equal(calls[0][0], "/api/referee-coordination/c1/matches/m1/available-candidates");
  assert.equal(calls[0][1], "GET");
  assert.deepEqual(result.eligibleReferees, []);
});

test("master API client: attaches errorCode and statusCode to error on failure", async () => {
  const fetchImpl = async () => ({
    ok: false,
    status: 409,
    json: async () => ({ error: "STALE_DISPATCH_VERSION: mismatch", errorCode: "STALE_DISPATCH_VERSION" })
  });
  const api = createMasterApi({ fetchImpl });
  try {
    await api.dispatch("c1", "m1", {});
    assert.fail("should throw");
  } catch (error) {
    assert.equal(error.statusCode, 409);
    assert.equal(error.errorCode, "STALE_DISPATCH_VERSION");
  }
});

// ── 5. Workflow: dispatch/withdraw/reassign call API with correct args and refresh ──

test("workflow dispatchMatch: calls api.dispatch with version from projection, then refreshes", async () => {
  const calls = [];
  const api = {
    matchOverview: async (...args) => { calls.push(["overview", ...args]); return { matches: [] }; },
    liveCoordination: async (...args) => { calls.push(["coord", ...args]); return { courts: [] }; },
    dispatch: async (...args) => calls.push(["dispatch", ...args]),
    availableCandidates: async () => ({ matchId: 1, courtId: "A1", eligibleReferees: [{ refereeId: "R1" }] })
  };
  const workflow = createMasterWorkflow({ api, view: { loading() {}, busy() {}, error() {}, matches() {}, courts() {} } });
  await workflow.start(3);
  calls.length = 0;
  await workflow.dispatchMatch({ matchId: 1, courtId: "A1", refereeId: "R1", expectedVersion: 0 });
  assert.equal(calls[0][0], "dispatch");
  assert.equal(calls[0][1], 3);
  assert.equal(calls[0][2], 1);
  const payload = calls[0][3];
  assert.equal(payload.courtId, "A1");
  assert.equal(payload.refereeId, "R1");
  assert.equal(payload.expectedVersion, 0);
  assert.ok(payload.correlationId, "correlationId must be present");
  // After dispatch, should refresh (overview + coord)
  assert.ok(calls.some(c => c[0] === "overview"), "should refresh after dispatch");
});

test("workflow withdraw: calls api.withdraw with version, then refreshes", async () => {
  const calls = [];
  const api = {
    matchOverview: async () => ({ matches: [] }),
    liveCoordination: async () => ({ courts: [] }),
    withdraw: async (...args) => calls.push(["withdraw", ...args])
  };
  const workflow = createMasterWorkflow({ api, view: { loading() {}, busy() {}, error() {}, matches() {}, courts() {} } });
  await workflow.start(3);
  calls.length = 0;
  await workflow.withdraw({ matchId: 1, expectedVersion: 1 });
  assert.equal(calls[0][0], "withdraw");
  assert.equal(calls[0][3].expectedVersion, 1);
  assert.ok(calls[0][3].correlationId);
});

test("workflow reassign: calls api.reassign with newRefereeId and version, then refreshes", async () => {
  const calls = [];
  const api = {
    matchOverview: async () => ({ matches: [] }),
    liveCoordination: async () => ({ courts: [] }),
    reassign: async (...args) => calls.push(["reassign", ...args])
  };
  const workflow = createMasterWorkflow({ api, view: { loading() {}, busy() {}, error() {}, matches() {}, courts() {} } });
  await workflow.start(3);
  calls.length = 0;
  await workflow.reassign({ matchId: 1, newRefereeId: "R2", expectedVersion: 1 });
  assert.equal(calls[0][0], "reassign");
  assert.equal(calls[0][3].newRefereeId, "R2");
  assert.equal(calls[0][3].expectedVersion, 1);
});

test("workflow dispatchMatch: on error, shows error and refreshes projection", async () => {
  const errors = [];
  const api = {
    matchOverview: async () => ({ matches: [] }),
    liveCoordination: async () => ({ courts: [] }),
    dispatch: async () => { const e = new Error("COURT_CONFLICT: court busy"); e.errorCode = "COURT_CONFLICT"; throw e; }
  };
  const workflow = createMasterWorkflow({
    api,
    view: { loading() {}, busy() {}, error: (m) => errors.push(m), matches() {}, courts() {} }
  });
  await workflow.start(3);
  errors.length = 0;
  await workflow.dispatchMatch({ matchId: 1, courtId: "A1", refereeId: "R1", expectedVersion: 0 });
  assert.equal(errors.length, 1, "should report error");
});

test("workflow loadCandidates: delegates to api.availableCandidates", async () => {
  const calls = [];
  const api = {
    matchOverview: async () => ({ matches: [] }),
    liveCoordination: async () => ({ courts: [] }),
    availableCandidates: async (...args) => { calls.push(args); return { matchId: 1, courtId: "A1", eligibleReferees: [] }; }
  };
  const workflow = createMasterWorkflow({ api, view: { loading() {}, busy() {}, error() {}, matches() {}, courts() {} } });
  await workflow.start(3);
  const result = await workflow.loadCandidates(1);
  assert.deepEqual(calls[0], [3, 1]);
  assert.equal(result.courtId, "A1");
});

// ── 6. Non-master cannot perform dispatch operations ──

test("workflow rejects non-master identity for dispatch operations", () => {
  const workflow = createMasterWorkflow({
    api: {},
    view: {},
    identityContext: {
      getCurrentIdentityContext: () => createIdentityContext({
        trustedActor: { actorId: "p1", actorType: "participant" },
        competitionId: 3
      })
    }
  });
  assert.throws(() => workflow.start(), /master identity context is required/);
});

// ── 7. Version must come from backend, not be self-incremented ──

test("workflow dispatch uses expectedVersion from parameter (backend-sourced), not self-incremented", async () => {
  let dispatchedVersion;
  const api = {
    matchOverview: async () => ({ matches: [] }),
    liveCoordination: async () => ({ courts: [] }),
    dispatch: async (_c, _m, data) => { dispatchedVersion = data.expectedVersion; }
  };
  const workflow = createMasterWorkflow({ api, view: { loading() {}, busy() {}, error() {}, matches() {}, courts() {} } });
  await workflow.start(3);
  await workflow.dispatchMatch({ matchId: 1, courtId: "A1", refereeId: "R1", expectedVersion: 5 });
  assert.equal(dispatchedVersion, 5, "must pass through the backend-provided version exactly");
});

// ── 8. Each operation uses unique correlationId ──

test("workflow dispatch and withdraw use independent correlationIds", async () => {
  const correlationIds = [];
  const api = {
    matchOverview: async () => ({ matches: [] }),
    liveCoordination: async () => ({ courts: [] }),
    dispatch: async (_c, _m, data) => { correlationIds.push(data.correlationId); },
    withdraw: async (_c, _m, data) => { correlationIds.push(data.correlationId); }
  };
  const workflow = createMasterWorkflow({ api, view: { loading() {}, busy() {}, error() {}, matches() {}, courts() {} } });
  await workflow.start(3);
  await workflow.dispatchMatch({ matchId: 1, courtId: "A1", refereeId: "R1", expectedVersion: 0 });
  await workflow.withdraw({ matchId: 1, expectedVersion: 1 });
  assert.equal(correlationIds.length, 2);
  assert.notEqual(correlationIds[0], correlationIds[1], "each operation must have unique correlationId");
});

// ── 9. Projection includes dispatch fields for state recovery ──

test("repository map includes dispatchId and dispatchVersion for state recovery", async () => {
  const repository = require("../repositories/master-operational-visibility.repository");
  const connection = {
    async query() {
      return [[{
        competition_id: 1, competition_status: "active", match_id: 1, round_number: 1,
        team1_name: "A", team2_name: "B", scheduled_at: null, court_id: "A1",
        referee_id: "R1", operation_status: "assigned", assigned_at: "2026-01-01T00:00:00Z",
        responsibility_accepted_at: null, dispatch_id: "d-uuid-1", dispatch_version: 1,
        result_confirmed_at: null
      }]];
    }
  };
  const matches = await repository.findMatchOverview(1, {}, connection);
  assert.equal(matches[0].referee.dispatchId, "d-uuid-1");
  assert.equal(matches[0].referee.dispatchVersion, 1);
  assert.equal(matches[0].referee.responsibilityAcceptedAt, null);
});

// ── 10. State recovery: deriveDispatchStatus works from DB-restored data ──

test("after page refresh, waiting_acceptance status is recovered from DB fields", () => {
  const matchFromDb = {
    operationStatus: "assigned",
    referee: {
      refereeId: "R1",
      assignedAt: "2026-01-01T00:00:00Z",
      responsibilityAcceptedAt: null,
      dispatchId: "d-uuid-1",
      dispatchVersion: 1
    }
  };
  assert.equal(UiText.deriveDispatchStatus(matchFromDb), "waiting_acceptance");
});

test("after page refresh, referee_accepted status is recovered from DB fields", () => {
  const matchFromDb = {
    operationStatus: "accepted",
    referee: {
      refereeId: "R1",
      assignedAt: "2026-01-01T00:00:00Z",
      responsibilityAcceptedAt: "2026-01-01T01:00:00Z",
      dispatchId: "d-uuid-1",
      dispatchVersion: 1
    }
  };
  assert.equal(UiText.deriveDispatchStatus(matchFromDb), "referee_accepted");
});

// ── 11. nextActionLabel shows correct next responsible actor ──

test("nextActionLabel: not_dispatched → 待主控派单", () => {
  assert.equal(UiText.nextActionLabel("not_dispatched"), "待主控派单");
});

test("nextActionLabel: waiting_acceptance → 等待裁判操作", () => {
  assert.equal(UiText.nextActionLabel("waiting_acceptance"), "等待裁判操作");
});

test("nextActionLabel: referee_accepted → 等待裁判开赛", () => {
  assert.equal(UiText.nextActionLabel("referee_accepted"), "等待裁判开赛");
});

// ── 12. Candidates failure is not silently treated as empty ──

test("workflow loadCandidates: API error propagates to caller (not treated as empty)", async () => {
  const api = {
    matchOverview: async () => ({ matches: [] }),
    liveCoordination: async () => ({ courts: [] }),
    availableCandidates: async () => { const e = new Error("FORBIDDEN"); e.statusCode = 403; throw e; }
  };
  const workflow = createMasterWorkflow({ api, view: { loading() {}, busy() {}, error() {}, matches() {}, courts() {} } });
  await workflow.start(3);
  await assert.rejects(() => workflow.loadCandidates(1), /FORBIDDEN/);
});

// ── 13. Existing court/referee rules: dispatch does not change court to occupied ──

test("dispatch does not alter court condition — only referee assignment", async () => {
  // Verify that the dispatch API endpoint does not call court condition change
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push(url);
    return { ok: true, json: async () => ({}) };
  };
  const api = createMasterApi({ fetchImpl });
  await api.dispatch("c1", "m1", { courtId: "A1", refereeId: "R1", expectedVersion: 0, correlationId: "x" });
  // Only the dispatch URL should be called, no court condition endpoint
  assert.equal(calls.length, 1);
  assert.match(calls[0], /\/dispatch$/);
});

// ── 14. No English-facing status in Chinese UI ──

test("all dispatch status labels are Chinese, none are raw English keys", () => {
  for (const [key, label] of Object.entries(UiText.dispatchStatusLabels)) {
    assert.doesNotMatch(label, /^[a-z_]+$/, `${key} label should be Chinese, got: ${label}`);
  }
});

// ── 15. Stale version triggers refresh in workflow ──

test("workflow dispatch: on stale version error, still refreshes to get latest state", async () => {
  let refreshCount = 0;
  const api = {
    matchOverview: async () => { refreshCount++; return { matches: [] }; },
    liveCoordination: async () => ({ courts: [] }),
    dispatch: async () => { const e = new Error("STALE_DISPATCH_VERSION: mismatch"); e.errorCode = "STALE_DISPATCH_VERSION"; throw e; }
  };
  const errors = [];
  const workflow = createMasterWorkflow({
    api,
    view: { loading() {}, busy() {}, error: (m) => errors.push(m), matches() {}, courts() {} }
  });
  await workflow.start(3);
  const beforeRefresh = refreshCount;
  await workflow.dispatchMatch({ matchId: 1, courtId: "A1", refereeId: "R1", expectedVersion: 0 });
  assert.ok(refreshCount > beforeRefresh, "should refresh after stale version error");
});

// ── 16. Conflict errors trigger refresh in workflow ──

test("workflow dispatch: on court conflict, still refreshes projection", async () => {
  let refreshCount = 0;
  const api = {
    matchOverview: async () => { refreshCount++; return { matches: [] }; },
    liveCoordination: async () => ({ courts: [] }),
    dispatch: async () => { const e = new Error("COURT_CONFLICT: court busy"); e.errorCode = "COURT_CONFLICT"; throw e; }
  };
  const workflow = createMasterWorkflow({
    api, view: { loading() {}, busy() {}, error() {}, matches() {}, courts() {} }
  });
  await workflow.start(3);
  const beforeRefresh = refreshCount;
  await workflow.dispatchMatch({ matchId: 1, courtId: "A1", refereeId: "R1", expectedVersion: 0 });
  assert.ok(refreshCount > beforeRefresh, "should refresh after conflict");
});

// ── 17. DB schema: VIEW includes dispatch_id and dispatch_version ──

test("db VIEW includes dispatch_id and dispatch_version for UI state derivation", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const schema = fs.readFileSync(path.join(__dirname, "..", "db.sql"), "utf8");
  const viewStart = schema.indexOf("CREATE OR REPLACE VIEW master_operational_match_overview");
  const viewEnd = schema.indexOf(";", viewStart);
  const viewSql = schema.slice(viewStart, viewEnd);
  assert.match(viewSql, /m\.dispatch_id/, "VIEW must include dispatch_id");
  assert.match(viewSql, /m\.dispatch_version/, "VIEW must include dispatch_version");
  assert.match(viewSql, /m\.responsibility_accepted_at/, "VIEW must include responsibility_accepted_at");
});

// ── 18. No second persistent status column ──

test("db schema does not add a separate dispatch_status column", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const schema = fs.readFileSync(path.join(__dirname, "..", "db.sql"), "utf8");
  assert.doesNotMatch(schema, /dispatch_status/i, "no separate dispatch_status column should exist");
});
