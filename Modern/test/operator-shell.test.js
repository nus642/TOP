const assert = require("node:assert/strict");
const test = require("node:test");
const { COMPETITION_KEY, createOperatorShell, landingFor, workspaceLinks } = require("../shell/operator-shell");

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

function harness(response, storage = memoryStorage()) {
  const states = [];
  const fetchImpl = async (...args) => { states.push(["fetch", ...args]); return response; };
  const view = { loading: () => states.push(["loading"]), ready: value => states.push(["ready", value]), error: value => states.push(["error", value]) };
  return { shell: createOperatorShell({ fetchImpl, storage, view }), states, storage };
}

test("shell hydrates the authenticated actor from the session boundary", async () => {
  const { shell, states } = harness({ ok: true, json: async () => ({ actorId: "referee-7", actorType: "referee" }) });
  assert.deepEqual(await shell.hydrate(), { actorId: "referee-7", actorType: "referee" });
  assert.deepEqual(states[1], ["fetch", "/api/session/me", { credentials: "same-origin" }]);
  assert.equal(states.at(-1)[1].landing, "/operator/");
});

test("actor types select only their existing experience landing page", () => {
  assert.equal(landingFor("referee", 3), "/operator/?competitionId=3");
  assert.equal(landingFor("master", 3), "/operator/master.html?competitionId=3");
  assert.equal(landingFor("participant", 3), "/participant/?competitionId=3");
});

test("navigation generates every existing workspace link without making permission decisions", () => {
  assert.deepEqual(workspaceLinks("competition/3").map(({ workspace, href }) => [workspace, href]), [
    ["referee", "/operator/?competitionId=competition%2F3"],
    ["master", "/operator/master.html?competitionId=competition%2F3"],
    ["participant", "/participant/?competitionId=competition%2F3"]
  ]);
});

test("missing session is shown and does not render an operator context", async () => {
  const { shell, states } = harness({ ok: false, json: async () => ({ error: "Authenticated actor session required" }) });
  await assert.rejects(shell.hydrate(), /Authenticated actor session required/);
  assert.deepEqual(states.at(-1), ["error", "Authenticated actor session required"]);
  assert.equal(states.some(([state]) => state === "ready"), false);
});

test("unknown authenticated actor type has no landing page", async () => {
  const { shell, states } = harness({ ok: true, json: async () => ({ actorId: "actor-1", actorType: "spectator" }) });
  await assert.rejects(shell.hydrate(), /Unsupported authenticated actor type: spectator/);
  assert.equal(states.at(-1)[0], "error");
});

test("user-selected competition context is preserved without changing identity", async () => {
  const storage = memoryStorage({ [COMPETITION_KEY]: "competition/3" });
  const { shell, states } = harness({ ok: true, json: async () => ({ actorId: "master-1", actorType: "master" }) }, storage);
  await shell.hydrate();
  assert.equal(states.at(-1)[1].landing, "/operator/master.html?competitionId=competition%2F3");
  shell.selectCompetition("competition-4");
  assert.equal(storage.getItem(COMPETITION_KEY), "competition-4");
  assert.deepEqual(states.at(-1)[1].actor, { actorId: "master-1", actorType: "master" });
  assert.equal(states.at(-1)[1].workspaces.every(link => link.href.endsWith("competitionId=competition-4")), true);
});

test("shell exposes no UI operation that can switch the authenticated actor", async () => {
  const { shell } = harness({ ok: true, json: async () => ({ actorId: "participant-9", actorType: "participant" }) });
  await shell.hydrate();
  assert.deepEqual(Object.keys(shell).sort(), ["hydrate", "selectCompetition"]);
  assert.equal("selectActor" in shell, false);
});
