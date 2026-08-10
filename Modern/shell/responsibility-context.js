(function expose(factory) {
  const responsibility = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = responsibility;
  if (typeof window !== "undefined") {
    responsibility.browser = responsibility.createResponsibilityContext({ fetchImpl: window.fetch.bind(window), storage: window.localStorage });
    window.ResponsibilityContext = Object.freeze(responsibility);
  }
})(function createModule() {
  const COMPETITION_KEY = "top.operator.competitionId";

  function authenticatedActor(value) {
    if (!value || typeof value.actorId !== "string" || value.actorId.trim() === "") {
      throw new TypeError("Authenticated actor session required");
    }
    if (typeof value.actorType !== "string" || value.actorType.trim() === "") {
      throw new TypeError("Authenticated actor session required");
    }
    return Object.freeze({ actorId: value.actorId.trim(), actorType: value.actorType.trim() });
  }

  function responsibilityContext(actor, competitionId) {
    return Object.freeze({
      actor,
      competitionId: String(competitionId ?? "").trim()
    });
  }

  function createResponsibilityContext({ fetchImpl, storage } = {}) {
    if (typeof fetchImpl !== "function") throw new TypeError("session fetch is required");
    if (!storage) throw new TypeError("competition storage is required");
    let actor;
    let context;
    let competitionId = storage.getItem(COMPETITION_KEY) || "";

    function publish() {
      if (!actor) throw new TypeError("Authenticated actor session required");
      context = responsibilityContext(actor, competitionId);
      return context;
    }

    return Object.freeze({
      async hydrate() {
        const response = await fetchImpl("/api/session/me", { credentials: "same-origin" });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "Authenticated actor session required");
        actor = authenticatedActor(body);
        return publish();
      },
      selectCompetition(value) {
        competitionId = String(value ?? "").trim();
        if (competitionId) storage.setItem(COMPETITION_KEY, competitionId);
        else storage.removeItem(COMPETITION_KEY);
        return actor ? publish() : undefined;
      },
      current() { return context; }
    });
  }

  return { COMPETITION_KEY, authenticatedActor, createResponsibilityContext };
});
