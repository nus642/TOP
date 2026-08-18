(function expose(factory) {
  const workflow = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = workflow;
  if (typeof window !== "undefined") window.RefereeWorkflow = workflow;
})(function createModule() {
  function createRefereeWorkflow({ api, view, identityContext, accountabilityFlow }) {
    let context;
    let accountability;

    function refereeContext(nextContext) {
      const identity = nextContext || (identityContext && identityContext.getCurrentIdentityContext());
      const actor = identity?.actor || identity?.trustedActor;
      if (identity && actor?.actorType === "referee") {
        return { tournamentId: identity.competitionId, refereeId: actor.actorId };
      }
      // Retain the pre-identity calling convention for non-UI consumers.
      if (identity && identity.tournamentId && identity.refereeId) return identity;
      throw new TypeError("A referee identity context is required");
    }

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
        if (accountabilityFlow) accountabilityFlow.verify(accountability);
        if (action.type === "accept") await api.accept(context.tournamentId, context.refereeId, action.matchId, action.dispatchVersion);
        if (action.type === "start") await api.start(context.tournamentId, context.refereeId, action.matchId);
        if (action.type === "interrupt") await api.interrupt(context.tournamentId, context.refereeId, action.matchId);
        if (action.type === "resume") await api.resume(context.tournamentId, context.refereeId, action.matchId);
        if (action.type === "score") await api.recordScore(context.tournamentId, context.refereeId, action.matchId, action.score);
        await refresh();
      } catch (error) { view.error(error.message); }
    }

    return {
      start(nextContext) {
        context = refereeContext(nextContext);
        if (accountabilityFlow) accountability = accountabilityFlow.begin({ actorType: "referee", competitionId: context.tournamentId });
        return refresh();
      },
      run,
      // Read-only context accessor so the UI can scope auxiliary calls (e.g. live
      // score snapshots) to the same tournament/referee as the workflow.
      getContext() {
        return context ? { ...context } : null;
      }
    };
  }
  return { createRefereeWorkflow };
});
