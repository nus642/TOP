const assert = require("node:assert/strict");
const test = require("node:test");
const { createActorSessionStore } = require("../session/actor-session");

test("foundation session establishes and server-side resolves only a minimal actor", () => {
  const store = createActorSessionStore();
  const sessionId = store.establish({ actorId: "referee-7", actorType: "referee", permissions: ["anything"] });
  assert.notEqual(sessionId, "referee-7");
  assert.match(sessionId, /^[A-Za-z0-9_-]{43}$/);
  assert.deepEqual(store.resolve(sessionId), { actorId: "referee-7", actorType: "referee" });
  assert.equal("permissions" in store.resolve(sessionId), false);
});

test("unknown and malformed sessions do not resolve", () => {
  const store = createActorSessionStore();
  assert.equal(store.resolve("not-a-session"), undefined);
  assert.equal(store.resolve("a".repeat(43)), undefined);
  assert.equal(store.resolve({ actorId: "referee-7" }), undefined);
});

test("invalid and speculative actor types cannot establish sessions", () => {
  const store = createActorSessionStore();
  assert.throws(() => store.establish({ actorId: "a1", actorType: "admin" }), /Unsupported actorType/);
  assert.throws(() => store.establish({ actorId: "a1", actorType: "" }), /Unsupported actorType/);
});
