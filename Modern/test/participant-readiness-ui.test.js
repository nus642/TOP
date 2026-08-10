const assert = require("node:assert/strict");
const test = require("node:test");
const { createParticipantReadinessApi } = require("../participant/api-client");
const { createParticipantReadinessWorkflow } = require("../participant/readiness-workflow");
const { createIdentityContext } = require("../operator/identity-context");

test("participant workflow maps identity actorId to participantId for existing readiness APIs", async () => {
  const calls = [];
  const workflow = createParticipantReadinessWorkflow({
    api: {
      readiness: async (...args) => { calls.push(["readiness", ...args]); return { state: "not_checked_in" }; },
      checkIn: async (...args) => calls.push(["check-in", ...args])
    },
    view: { loading() {}, busy() {}, error: assert.fail, readiness() {} },
    identityContext: { getCurrentIdentityContext: () => createIdentityContext({
      actorId: "participant-8", actorType: "participant", competitionId: "competition-3"
    }) }
  });

  await workflow.start();
  await workflow.checkIn();
  assert.deepEqual(calls, [
    ["readiness", "competition-3", "participant-8"],
    ["check-in", "competition-3", "participant-8"],
    ["readiness", "competition-3", "participant-8"]
  ]);
});

test("participant workflow rejects a non-participant identity at its boundary", () => {
  const workflow = createParticipantReadinessWorkflow({ api: {}, view: {}, identityContext: {
    getCurrentIdentityContext: () => createIdentityContext({ actorId: "m1", actorType: "master", competitionId: 3 })
  } });
  assert.throws(() => workflow.start(), /participant identity context is required/);
});

test("participant API client uses only existing readiness endpoints", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push([url, options.method || "GET", options.body]);
    return { ok: true, json: async () => ({ competitionId: 3, participantId: 8, state: "ready" }) };
  };
  const api = createParticipantReadinessApi({ fetchImpl, baseUrl: "/api" });

  await api.readiness("competition/3", "participant/8");
  await api.checkIn("competition/3", "participant/8");

  assert.deepEqual(calls, [
    ["/api/participant-readiness/competition%2F3/participants/participant%2F8", "GET", undefined],
    ["/api/participant-readiness/competition%2F3/participants/participant%2F8/check-in", "POST", "{}"]
  ]);
});

test("check-in delegates to the API and refreshes authoritative readiness", async () => {
  const calls = [];
  const snapshots = [
    { competitionId: 3, participantId: 8, state: "not_checked_in", checkedInAt: null },
    { competitionId: 3, participantId: 8, state: "ready", checkedInAt: "2026-08-09T10:00:00Z" }
  ];
  const api = {
    readiness: async (...args) => { calls.push(["readiness", ...args]); return snapshots.shift(); },
    checkIn: async (...args) => { calls.push(["check-in", ...args]); }
  };
  const rendered = [];
  const view = {
    loading() {}, busy() {}, error: assert.fail,
    readiness: (readiness) => rendered.push(readiness)
  };
  const workflow = createParticipantReadinessWorkflow({ api, view });

  await workflow.start({ competitionId: 3, participantId: 8 });
  await workflow.checkIn();

  assert.deepEqual(calls, [
    ["readiness", 3, 8], ["check-in", 3, 8], ["readiness", 3, 8]
  ]);
  assert.deepEqual(rendered.map(({ state }) => state), ["not_checked_in", "ready"]);
});

test("API failures are rendered without inventing local readiness", async () => {
  const errors = [];
  const view = { loading() {}, busy() {}, readiness: assert.fail, error: (message) => errors.push(message) };
  const workflow = createParticipantReadinessWorkflow({
    api: { readiness: async () => { throw new Error("Player not found"); }, checkIn: assert.fail },
    view
  });

  await workflow.start({ competitionId: 3, participantId: 404 });
  assert.deepEqual(errors, ["Player not found"]);
});
