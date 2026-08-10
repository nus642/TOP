(function expose(factory) {
  const responsibility = typeof module !== "undefined" && module.exports
    ? require("./responsibility-context")
    : window.ResponsibilityContext;
  const experience = typeof module !== "undefined" && module.exports
    ? require("./operator-experience")
    : window.OperatorExperience;
  const shell = factory(responsibility, experience);
  if (typeof module !== "undefined" && module.exports) module.exports = shell;
  if (typeof window !== "undefined") window.OperatorShell = shell;
})(function createModule(ResponsibilityContext, OperatorExperience) {
  const COMPETITION_KEY = ResponsibilityContext.COMPETITION_KEY;
  const LANDINGS = Object.freeze({
    referee: "/operator/",
    master: "/operator/master.html",
    participant: "/participant/"
  });
  const WORKSPACE_LABELS = Object.freeze({
    referee: "Referee · Match Operations",
    master: "Master · Master Workflow",
    participant: "Participant · Readiness"
  });

  function landingFor(actorType, competitionId) {
    const pathname = LANDINGS[actorType];
    if (!pathname) throw new Error(`Unsupported authenticated actor type: ${actorType || "unknown"}`);
    if (competitionId === undefined || competitionId === null || String(competitionId).trim() === "") return pathname;
    return `${pathname}?competitionId=${encodeURIComponent(String(competitionId).trim())}`;
  }

  function workspaceLinks(competitionId) {
    return Object.entries(LANDINGS).map(([workspace, pathname]) => Object.freeze({
      workspace,
      label: WORKSPACE_LABELS[workspace],
      href: competitionId === undefined || competitionId === null || String(competitionId).trim() === ""
        ? pathname
        : `${pathname}?competitionId=${encodeURIComponent(String(competitionId).trim())}`
    }));
  }

  function createOperatorShell({ fetchImpl = fetch, storage, view, responsibilityContext } = {}) {
    if (!storage) throw new TypeError("competition storage is required");
    if (!view) throw new TypeError("shell view is required");
    let context;
    const responsibility = responsibilityContext || ResponsibilityContext.browser
      || ResponsibilityContext.createResponsibilityContext({ fetchImpl, storage });

    function render() {
      const { actor, competitionId } = context;
      view.ready({ actor, competitionId, responsibility: context, experience: OperatorExperience.forActor(actor), landing: landingFor(actor.actorType, competitionId), workspaces: workspaceLinks(competitionId) });
    }

    return Object.freeze({
      async hydrate() {
        view.loading();
        try { context = await responsibility.hydrate(); }
        catch (error) { view.error(error.message); throw error; }
        try { render(); } catch (error) { view.error(error.message); throw error; }
        return context.actor;
      },
      selectCompetition(value) {
        context = responsibility.selectCompetition(value);
        if (context) render();
      }
    });
  }

  return { COMPETITION_KEY, LANDINGS, WORKSPACE_LABELS, createOperatorShell, landingFor, workspaceLinks };
});
