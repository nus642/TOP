(function expose(factory) {
  const identity = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = identity;
  if (typeof window !== "undefined") window.IdentityContext = identity;
})(function createModule() {
  const ACTOR_TYPES = Object.freeze(["referee", "master", "participant"]);
  let currentContext;
  let trustedActor;

  function requiredText(value, field) {
    if (typeof value !== "string" || value.trim() === "") {
      throw new TypeError(`${field} is required`);
    }
    return value.trim();
  }

  function createTrustedActor({ actorId, actorType } = {}) {
    const normalizedType = requiredText(actorType, "actorType");
    if (!ACTOR_TYPES.includes(normalizedType)) {
      throw new TypeError(`Unsupported actorType: ${normalizedType}`);
    }

    return Object.freeze({
      actorId: requiredText(actorId, "actorId"),
      actorType: normalizedType
    });
  }

  function createIdentityContext({ trustedActor: actor, competitionId } = {}) {
    const context = { trustedActor: createTrustedActor(actor) };
    if (competitionId !== undefined && competitionId !== null && competitionId !== "") {
      context.competitionId = competitionId;
    }
    return Object.freeze(context);
  }

  function setCurrentIdentityContext(context) {
    if (!trustedActor) throw new TypeError("Authenticated actor session required");
    if (context.trustedActor && (context.trustedActor.actorId !== trustedActor.actorId
      || context.trustedActor.actorType !== trustedActor.actorType)) {
      throw new TypeError("Trusted actor identity cannot be replaced by UI context");
    }
    currentContext = createIdentityContext({ trustedActor, competitionId: context.competitionId });
    return currentContext;
  }

  async function hydrateCurrentActor({ fetchImpl = fetch, competitionId } = {}) {
    const response = await fetchImpl("/api/session/me", { credentials: "same-origin" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Authenticated actor session required");
    trustedActor = createTrustedActor(body);
    return setCurrentIdentityContext({ competitionId });
  }

  function getCurrentIdentityContext() {
    return currentContext;
  }

  return { ACTOR_TYPES, createIdentityContext, getCurrentIdentityContext, hydrateCurrentActor, setCurrentIdentityContext };
});
