(function expose(factory) {
  const identity = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = identity;
  if (typeof window !== "undefined") window.IdentityContext = identity;
})(function createModule() {
  const ACTOR_TYPES = Object.freeze(["referee", "master", "participant"]);
  let currentContext;

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
    currentContext = createIdentityContext(context);
    return currentContext;
  }

  function getCurrentIdentityContext() {
    return currentContext;
  }

  return { ACTOR_TYPES, createIdentityContext, getCurrentIdentityContext, setCurrentIdentityContext };
});
