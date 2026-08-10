const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { COMPETITION_KEY, createResponsibilityContext } = require("../shell/responsibility-context");

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
  };
}

test("responsibility follows the actor returned by the authenticated session", async () => {
  const calls = [];
  const responsibility = createResponsibilityContext({
    fetchImpl: async (...args) => {
      calls.push(args);
      return { ok: true, json: async () => ({ actorId: "referee-7", actorType: "referee" }) };
    },
    storage: memoryStorage()
  });

  const context = await responsibility.hydrate();
  assert.deepEqual(context.actor, { actorId: "referee-7", actorType: "referee" });
  assert.deepEqual(calls, [["/api/session/me", { credentials: "same-origin" }]]);
  assert.equal(Object.isFrozen(context.actor), true);
  assert.equal(Object.isFrozen(context), true);
});

test("competition context survives workspace transitions without replacing the actor", async () => {
  const storage = memoryStorage({ [COMPETITION_KEY]: "competition-3" });
  const sessionResponse = async () => ({ ok: true, json: async () => ({ actorId: "master-2", actorType: "master" }) });
  const first = createResponsibilityContext({ fetchImpl: sessionResponse, storage });
  assert.equal((await first.hydrate()).competitionId, "competition-3");

  const selected = first.selectCompetition(" competition-4 ");
  assert.deepEqual(selected, { actor: { actorId: "master-2", actorType: "master" }, competitionId: "competition-4" });
  assert.equal(storage.getItem(COMPETITION_KEY), "competition-4");
  assert.deepEqual(Object.keys(first).sort(), ["current", "hydrate", "selectCompetition"]);

  const nextWorkspace = createResponsibilityContext({ fetchImpl: sessionResponse, storage });
  assert.equal((await nextWorkspace.hydrate()).competitionId, "competition-4");
});

test("responsibility foundation contains no domain authority or persistence", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "shell", "responsibility-context.js"), "utf8");
  assert.doesNotMatch(source, /services|repositories|engine|database|authori[sz]e|permission|role|assignment/i);
  assert.match(source, /\/api\/session\/me/);
});
