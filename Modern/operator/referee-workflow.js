(function expose(factory) {
  const workflow = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = workflow;
  if (typeof window !== "undefined") window.RefereeWorkflow = workflow;
})(function createModule() {
  function createRefereeWorkflow({ api, view }) {
    let context;

    async function refresh() {
      view.loading();
      try {
        const result = await api.assignedMatches(context.tournamentId, context.refereeId);
        view.matches(result.matches);
      } catch (error) { view.error(error.message); }
    }

    async function run(action) {
      view.busy(action.matchId);
      try {
        if (action.type === "accept") await api.accept(context.tournamentId, context.refereeId, action.matchId);
        if (action.type === "score") await api.recordScore(context.tournamentId, context.refereeId, action.matchId, action.score);
        if (action.type === "confirm") await api.confirm(context.tournamentId, context.refereeId, action.matchId);
        await refresh();
      } catch (error) { view.error(error.message); }
    }

    return {
      start(nextContext) { context = nextContext; return refresh(); },
      run
    };
  }
  return { createRefereeWorkflow };
});
