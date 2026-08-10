const assert = require("node:assert/strict");
const test = require("node:test");
const {
  ACTOR_TYPES,
  createIdentityContext,
  getCurrentIdentityContext,
  setCurrentIdentityContext
} = require("../operator/identity-context");
const { createRefereeWorkflow } = require("../operator/referee-workflow");

test("identity context validates and freezes the minimal human actor context", () => {
  const context = createIdentityContext({ trustedActor: { actorId: " referee-7 ", actorType: "referee" }, competitionId: 3  });
  assert.deepEqual(context, { trustedActor: { actorId: "referee-7", actorType: "referee" }, competitionId: 3 });
  assert.equal(Object.isFrozen(context), true);
  assert.deepEqual(ACTOR_TYPES, ["referee", "master", "participant"]);
  assert.throws(() => createIdentityContext({ trustedActor: { actorType: "referee" } }), /actorId is required/);
  assert.throws(() => createIdentityContext({ trustedActor: { actorId: "r7" } }), /actorType is required/);
  assert.throws(() => createIdentityContext({ trustedActor: { actorId: "r7", actorType: "admin"  } }), /Unsupported actorType/);
});

test("in-memory context access returns a validated value without persistence or authority", async () => {
  const context = await require("../operator/identity-context").hydrateCurrentActor({
    competitionId: "3",
    fetchImpl: async () => ({ ok: true, json: async () => ({ actorId: "r7", actorType: "referee" }) })
  });
  assert.strictEqual(getCurrentIdentityContext(), context);
  assert.equal("permissions" in context, false);
  assert.equal("token" in context, false);
});

test("referee workflow consumes actor identity and still delegates every decision to existing APIs", async () => {
  const calls = [];
  const identityContext = {
    getCurrentIdentityContext: () => createIdentityContext({ trustedActor: { actorId: "referee-7", actorType: "referee" }, competitionId: 3 })
  };
  const api = {
    assignedMatches: async (...args) => { calls.push(["list", ...args]); return { matches: [] }; },
    accept: async (...args) => calls.push(["accept", ...args]),
    recordScore: async (...args) => calls.push(["score", ...args]),
    confirm: async (...args) => calls.push(["confirm", ...args])
  };
  const view = { loading() {}, busy() {}, error: assert.fail, matches() {} };
  const workflow = createRefereeWorkflow({ api, view, identityContext });
  await workflow.start();
  await workflow.run({ type: "accept", matchId: 9 });
  await workflow.run({ type: "score", matchId: 9, score: { score1: 11, score2: 8 } });
  await workflow.run({ type: "confirm", matchId: 9 });
  assert.deepEqual(calls, [
    ["list", 3, "referee-7"], ["accept", 3, "referee-7", 9], ["list", 3, "referee-7"],
    ["score", 3, "referee-7", 9, { score1: 11, score2: 8 }], ["list", 3, "referee-7"],
    ["confirm", 3, "referee-7", 9], ["list", 3, "referee-7"]
  ]);
});

test("referee workflow rejects another actor type rather than treating context as authority", async () => {
  const workflow = createRefereeWorkflow({
    api: {}, view: {},
    identityContext: { getCurrentIdentityContext: () => createIdentityContext({ trustedActor: { actorId: "m1", actorType: "master"  } }) }
  });
  assert.throws(() => workflow.start(), /referee identity context is required/);
});

test("identity context hydrates trusted actor while competition remains UI context", async () => {
  // Reload to isolate the module's intentionally in-memory browser state.
  delete require.cache[require.resolve("../operator/identity-context")];
  const identity = require("../operator/identity-context");
  const context = await identity.hydrateCurrentActor({
    competitionId: "competition-4",
    fetchImpl: async () => ({ ok: true, json: async () => ({ actorId: "participant-2", actorType: "participant" }) })
  });
  assert.deepEqual(context, { trustedActor: { actorId: "participant-2", actorType: "participant" }, competitionId: "competition-4" });
  assert.throws(() => identity.setCurrentIdentityContext({
    trustedActor: { actorId: "participant-9", actorType: "participant" }, competitionId: "competition-5"
  }), /cannot be replaced/);
  assert.deepEqual(identity.setCurrentIdentityContext({
    trustedActor: { actorId: "participant-2", actorType: "participant" }, competitionId: "competition-5"
  }), { trustedActor: { actorId: "participant-2", actorType: "participant" }, competitionId: "competition-5" });
});

test("missing authenticated session is surfaced without creating identity", async () => {
  delete require.cache[require.resolve("../operator/identity-context")];
  const identity = require("../operator/identity-context");
  await assert.rejects(identity.hydrateCurrentActor({
    competitionId: 3,
    fetchImpl: async () => ({ ok: false, json: async () => ({ error: "Authenticated actor session required" }) })
  }), /Authenticated actor session required/);
  assert.equal(identity.getCurrentIdentityContext(), undefined);
});
