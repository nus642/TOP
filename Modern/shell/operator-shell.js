(function expose(factory) {
  const shell = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = shell;
  if (typeof window !== "undefined") window.OperatorShell = shell;
})(function createModule() {
  const COMPETITION_KEY = "top.operator.competitionId";
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

  function createOperatorShell({ fetchImpl = fetch, storage, view } = {}) {
    if (!storage) throw new TypeError("competition storage is required");
    if (!view) throw new TypeError("shell view is required");
    let actor;
    let competitionId = storage.getItem(COMPETITION_KEY) || "";

    function render() {
      view.ready({ actor, competitionId, landing: landingFor(actor.actorType, competitionId), workspaces: workspaceLinks(competitionId) });
    }

    return Object.freeze({
      async hydrate() {
        view.loading();
        const response = await fetchImpl("/api/session/me", { credentials: "same-origin" });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          const error = new Error(body.error || "Authenticated actor session required");
          view.error(error.message);
          throw error;
        }
        actor = Object.freeze({ actorId: body.actorId, actorType: body.actorType });
        try { render(); } catch (error) { view.error(error.message); throw error; }
        return actor;
      },
      selectCompetition(value) {
        competitionId = String(value ?? "").trim();
        if (competitionId) storage.setItem(COMPETITION_KEY, competitionId);
        else storage.removeItem(COMPETITION_KEY);
        if (actor) render();
      }
    });
  }

  return { COMPETITION_KEY, LANDINGS, WORKSPACE_LABELS, createOperatorShell, landingFor, workspaceLinks };
});
