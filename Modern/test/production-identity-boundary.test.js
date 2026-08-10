const assert = require("node:assert/strict");
const test = require("node:test");

const { createActorSessionStore } = require("../session/actor-session");
const { createProductionIdentityBoundary } = require("../session/production-identity-boundary");

test("verified external identity is linked to a minimal TOP actor session", async () => {
  const calls = [];
  const actorSessions = createActorSessionStore({ tokenFactory: () => "s".repeat(43) });
  const boundary = createProductionIdentityBoundary({
    identityAdapter: {
      async verify(request) {
        calls.push(["verify", request]);
        return { providerId: "workforce", subject: "external-42", claims: { elevated: true } };
      }
    },
    actorLink: {
      async resolve(identity) {
        calls.push(["resolve", identity]);
        return { actorId: "referee-7", actorType: "referee", grants: ["anything"] };
      }
    },
    actorSessions
  });

  const request = { externalCredential: "provider-specific" };
  const sessionId = await boundary.establish(request);

  assert.deepEqual(calls, [
    ["verify", request],
    ["resolve", { providerId: "workforce", subject: "external-42" }]
  ]);
  assert.deepEqual(actorSessions.resolve(sessionId), { actorId: "referee-7", actorType: "referee" });
  assert.equal("claims" in actorSessions.resolve(sessionId), false);
  assert.equal("grants" in actorSessions.resolve(sessionId), false);
});

test("unverified or unlinked input cannot establish a session", async () => {
  const actorSessions = createActorSessionStore();
  const boundary = createProductionIdentityBoundary({
    identityAdapter: { verify: async () => undefined },
    actorLink: { resolve: async () => ({ actorId: "referee-7", actorType: "referee" }) },
    actorSessions
  });

  await assert.rejects(boundary.establish({ actorId: "referee-7" }), /providerId is required/);

  const unlinked = createProductionIdentityBoundary({
    identityAdapter: { verify: async () => ({ providerId: "workforce", subject: "unknown" }) },
    actorLink: { resolve: async () => undefined },
    actorSessions
  });
  await assert.rejects(unlinked.establish({}), /actorId is required/);
});

test("boundary requires explicit verification, actor linking, and session ports", () => {
  assert.throws(() => createProductionIdentityBoundary({}), /identityAdapter\.verify is required/);
  assert.throws(() => createProductionIdentityBoundary({ identityAdapter: { verify() {} } }), /actorLink\.resolve is required/);
  assert.throws(() => createProductionIdentityBoundary({
    identityAdapter: { verify() {} },
    actorLink: { resolve() {} }
  }), /actorSessions\.establish is required/);
});
