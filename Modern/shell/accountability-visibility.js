(function expose(factory) {
  const visibility = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = visibility;
  if (typeof window !== "undefined") {
    visibility.browser = visibility.createAccountabilityVisibility(
      window.ResponsibilityContext.browser,
      window.AccountabilityContext.browser,
      window.OperatorExperience
    );
    window.AccountabilityVisibility = Object.freeze(visibility);
  }
})(function createModule() {
  function createAccountabilityVisibility(responsibilityContext, accountabilityContext, operatorExperience) {
    if (!responsibilityContext || typeof responsibilityContext.current !== "function") throw new TypeError("responsibility context is required");
    if (!accountabilityContext || typeof accountabilityContext.current !== "function") throw new TypeError("accountability context is required");
    if (!operatorExperience || typeof operatorExperience.forActor !== "function") throw new TypeError("operator experience is required");

    function current() {
      const responsibility = responsibilityContext.current();
      const accountability = accountabilityContext.current();
      if (!responsibility?.actor ||
          accountability.actorId !== responsibility.actor.actorId ||
          accountability.actorType !== responsibility.actor.actorType ||
          accountability.competitionId !== responsibility.competitionId) {
        throw new TypeError("Accountability context does not match authenticated responsibility context");
      }
      const experience = operatorExperience.forActor(responsibility.actor);
      return Object.freeze({
        actorId: accountability.actorId,
        actorType: accountability.actorType,
        competitionId: accountability.competitionId,
        responsibility: experience.responsibility
      });
    }

    return Object.freeze({ current });
  }

  return { createAccountabilityVisibility };
});
