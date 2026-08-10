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

  function escapeText(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  function render(accountability) {
    if (!accountability) throw new TypeError("accountability visibility is required");
    return `<dl class="accountability-visibility" aria-label="Current accountability">
      <div><dt>Operating as</dt><dd>${escapeText(accountability.actorId)}</dd></div>
      <div><dt>Actor type</dt><dd>${escapeText(accountability.actorType)}</dd></div>
      <div><dt>Competition</dt><dd>${escapeText(accountability.competitionId || "Not selected")}</dd></div>
      <div><dt>Responsibility</dt><dd>${escapeText(accountability.responsibility)}</dd></div>
    </dl>`;
  }

  return { createAccountabilityVisibility, render };
});
