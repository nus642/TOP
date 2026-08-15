const assert = require("node:assert/strict");
const test = require("node:test");
const { createMasterApi } = require("../operator/master-api-client");
const { createMasterWorkflow } = require("../operator/master-workflow");
const { createIdentityContext } = require("../operator/identity-context");

test("master workflow maps master identity competition to existing APIs", async () => {
  const calls = [];
  const workflow = createMasterWorkflow({
    api: {
      matchOverview: async (...args) => { calls.push(["overview", ...args]); return { matches: [] }; },
      liveCoordination: async (...args) => { calls.push(["coordination", ...args]); return { courts: [] }; },
      assignReferee: async (...args) => calls.push(["assign", ...args])
    },
    view: { loading() {}, busy() {}, error: assert.fail, matches() {}, courts() {} },
    identityContext: { getCurrentIdentityContext: () => createIdentityContext({ trustedActor: { actorId: "master-1", actorType: "master" }, competitionId: "competition-3" }) }
  });

  await workflow.start();
  await workflow.assign({ matchId: 9, refereeId: "referee-7" });
  assert.deepEqual(calls, [
    ["overview", "competition-3"],
    ["coordination", "competition-3"],
    ["assign", "competition-3", 9, "referee-7"],
    ["overview", "competition-3"],
    ["coordination", "competition-3"]
  ]);
});

test("master workflow rejects a non-master identity at its boundary", () => {
  const workflow = createMasterWorkflow({ api: {}, view: {}, identityContext: {
    getCurrentIdentityContext: () => createIdentityContext({ trustedActor: { actorId: "p1", actorType: "participant" }, competitionId: 3  })
  } });
  assert.throws(() => workflow.start(), /master identity context is required/);
});

test("master API client uses only existing operational workflow APIs", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push([url, options.method || "GET", options.body]);
    return { ok: true, json: async () => ({ matches: [] }) };
  };
  const api = createMasterApi({ fetchImpl });

  await api.matchOverview("competition/3");
  await api.liveCoordination("competition/3");
  await api.assignReferee("competition/3", "match/9", "referee-7");
  await api.reportCourt("competition/3", "court/1", { condition: "constrained", expectedVersion: 2 });
  await api.deferCourt("competition/3", "court/1", 4);

  assert.deepEqual(calls, [
    ["/api/master-operations/competition%2F3/matches", "GET", undefined],
    ["/api/master-workflow/competition%2F3/live-status", "GET", undefined],
    ["/api/master-workflow/competition%2F3/matches/match%2F9/assign", "POST", '{"refereeId":"referee-7"}'],
    ["/api/master-workflow/competition%2F3/courts/court%2F1/condition", "POST", '{"condition":"constrained","expectedVersion":2}'],
    ["/api/master-workflow/competition%2F3/courts/court%2F1/defer", "POST", '{"expectedVersion":4}']
  ]);
});

test("master workflow delegates assignment and reloads backend state", async () => {
  const calls = [];
  const api = {
    matchOverview: async (...args) => {
      calls.push(["overview", ...args]);
      return { matches: [{ matchId: 9, operationStatus: "assigned" }] };
    },
    liveCoordination: async (...args) => { calls.push(["coordination", ...args]); return { courts: [] }; },
    assignReferee: async (...args) => calls.push(["assign", ...args])
  };
  const rendered = [];
  const view = {
    loading() {}, busy() {}, error: assert.fail,
    matches: (matches) => rendered.push(matches), courts() {}
  };
  const workflow = createMasterWorkflow({ api, view });

  await workflow.start(3);
  await workflow.assign({ matchId: 9, refereeId: "referee-7" });

  assert.deepEqual(calls, [
    ["overview", 3],
    ["coordination", 3],
    ["assign", 3, 9, "referee-7"],
    ["overview", 3],
    ["coordination", 3]
  ]);
  assert.equal(rendered.length, 2);
});

test("master workflow reports errors and does not invent assignment state", async () => {
  const rendered = [];
  const errors = [];
  const workflow = createMasterWorkflow({
    api: {
      matchOverview: async () => ({ matches: [] }),
      liveCoordination: async () => ({ courts: [] }),
      assignReferee: async () => { throw new Error("Match is already playing"); }
    },
    view: {
      loading() {}, busy() {},
      matches: (matches) => rendered.push(matches), courts() {},
      error: (err) => errors.push(err)
    }
  });

  await workflow.start(3);
  await workflow.assign({ matchId: 9, refereeId: "referee-7" });

  assert.equal(errors.length, 1);
  assert.ok(errors[0] instanceof Error);
  assert.equal(errors[0].message, "Match is already playing");
  assert.deepEqual(rendered, [[]]);
});

test("master workflow reports and defers Court facts then reloads authoritative coordination", async () => {
  const calls = [];
  const api = {
    matchOverview: async () => ({ matches: [] }),
    liveCoordination: async () => ({ courts: [] }),
    reportCourt: async (...args) => calls.push(["report", ...args]),
    deferCourt: async (...args) => calls.push(["defer", ...args])
  };
  const workflow = createMasterWorkflow({ api, view: {
    loading() {}, busy() {}, error: assert.fail, matches() {}, courts() {}
  } });
  await workflow.start(3);
  await workflow.reportCourt({ courtId: "court-1", condition: "constrained", expectedVersion: 1, affectedMatchId: 9 });
  await workflow.deferCourt({ courtId: "court-1", expectedVersion: 0 });
  assert.deepEqual(calls, [
    ["report", 3, "court-1", { condition: "constrained", expectedVersion: 1, affectedMatchId: 9 }],
    ["defer", 3, "court-1", 0]
  ]);
});
