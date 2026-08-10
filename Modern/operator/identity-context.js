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

  function createIdentityContext({ actorId, actorType, competitionId } = {}) {
    const normalizedType = requiredText(actorType, "actorType");
    if (!ACTOR_TYPES.includes(normalizedType)) {
      throw new TypeError(`Unsupported actorType: ${normalizedType}`);
    }

    const context = {
      actorId: requiredText(actorId, "actorId"),
      actorType: normalizedType
    };
    if (competitionId !== undefined && competitionId !== null && competitionId !== "") {
      context.competitionId = competitionId;
    }
    return Object.freeze(context);
  }

  function setCurrentIdentityContext(context) {
    if (trustedActor && (context.actorId !== trustedActor.actorId || context.actorType !== trustedActor.actorType)) {
      throw new TypeError("Trusted actor identity cannot be replaced by UI context");
    }
    currentContext = createIdentityContext(context);
    return currentContext;
  }

  async function hydrateCurrentActor({ fetchImpl = fetch, competitionId } = {}) {
    const response = await fetchImpl("/api/session/me", { credentials: "same-origin" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Authenticated actor session required");
    trustedActor = createIdentityContext(body);
    return setCurrentIdentityContext({ ...trustedActor, competitionId });
  }

  async function establishFoundationActor({ actorId, actorType, competitionId, fetchImpl = fetch }) {
    const response = await fetchImpl("/api/session/foundation-establish", {
      method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actorId, actorType })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Foundation session could not be established");
    return hydrateCurrentActor({ fetchImpl, competitionId });
  }

  function getCurrentIdentityContext() {
    return currentContext;
  }

  return { ACTOR_TYPES, createIdentityContext, establishFoundationActor, getCurrentIdentityContext, hydrateCurrentActor, setCurrentIdentityContext };
});
