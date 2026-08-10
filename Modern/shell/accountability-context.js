(function expose(factory) {
  const accountability = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = accountability;
  if (typeof window !== "undefined") {
    accountability.browser = accountability.createAccountabilityContext(window.ResponsibilityContext.browser);
    window.AccountabilityContext = Object.freeze(accountability);
  }
})(function createModule() {
  const HEADER_NAMES = Object.freeze({
    actorId: "X-TOP-Actor-Id",
    actorType: "X-TOP-Actor-Type",
    competitionId: "X-TOP-Competition-Id"
  });

  function createAccountabilityContext(responsibilityContext) {
    if (!responsibilityContext || typeof responsibilityContext.current !== "function") {
      throw new TypeError("responsibility context is required");
    }

    function current() {
      const responsibility = responsibilityContext.current();
      if (!responsibility?.actor) throw new TypeError("Authenticated actor session required");
      return Object.freeze({
        actorId: responsibility.actor.actorId,
        actorType: responsibility.actor.actorType,
        competitionId: responsibility.competitionId
      });
    }

    function headers() {
      const context = current();
      return Object.freeze({
        [HEADER_NAMES.actorId]: context.actorId,
        [HEADER_NAMES.actorType]: context.actorType,
        [HEADER_NAMES.competitionId]: context.competitionId
      });
    }

    return Object.freeze({ current, headers });
  }

  return { HEADER_NAMES, createAccountabilityContext };
});
