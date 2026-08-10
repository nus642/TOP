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
      assignReferee: async (...args) => calls.push(["assign", ...args])
    },
    view: { loading() {}, busy() {}, error: assert.fail, matches() {} },
    identityContext: { getCurrentIdentityContext: () => createIdentityContext({
      actorId: "master-1", actorType: "master", competitionId: "competition-3"
    }) }
  });

  await workflow.start();
  await workflow.assign({ matchId: 9, refereeId: "referee-7" });
  assert.deepEqual(calls, [
    ["overview", "competition-3"],
    ["assign", "competition-3", 9, "referee-7"],
    ["overview", "competition-3"]
  ]);
});

test("master workflow rejects a non-master identity at its boundary", () => {
  const workflow = createMasterWorkflow({ api: {}, view: {}, identityContext: {
    getCurrentIdentityContext: () => createIdentityContext({ actorId: "p1", actorType: "participant", competitionId: 3 })
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
  await api.assignReferee("competition/3", "match/9", "referee-7");

  assert.deepEqual(calls, [
    ["/api/master-operations/competition%2F3/matches", "GET", undefined],
    ["/api/master-workflow/competition%2F3/matches/match%2F9/assign", "POST", '{"refereeId":"referee-7"}']
  ]);
});

test("master workflow delegates assignment and reloads backend state", async () => {
  const calls = [];
  const api = {
    matchOverview: async (...args) => {
      calls.push(["overview", ...args]);
      return { matches: [{ matchId: 9, operationStatus: "assigned" }] };
    },
    assignReferee: async (...args) => calls.push(["assign", ...args])
  };
  const rendered = [];
  const view = {
    loading() {}, busy() {}, error: assert.fail,
    matches: (matches) => rendered.push(matches)
  };
  const workflow = createMasterWorkflow({ api, view });

  await workflow.start(3);
  await workflow.assign({ matchId: 9, refereeId: "referee-7" });

  assert.deepEqual(calls, [
    ["overview", 3],
    ["assign", 3, 9, "referee-7"],
    ["overview", 3]
  ]);
  assert.equal(rendered.length, 2);
});

test("master workflow reports errors and does not invent assignment state", async () => {
  const rendered = [];
  const errors = [];
  const workflow = createMasterWorkflow({
    api: {
      matchOverview: async () => ({ matches: [] }),
      assignReferee: async () => { throw new Error("Match is already playing"); }
    },
    view: {
      loading() {}, busy() {},
      matches: (matches) => rendered.push(matches),
      error: (message) => errors.push(message)
    }
  });

  await workflow.start(3);
  await workflow.assign({ matchId: 9, refereeId: "referee-7" });

  assert.deepEqual(errors, ["Match is already playing"]);
  assert.deepEqual(rendered, [[]]);
});
