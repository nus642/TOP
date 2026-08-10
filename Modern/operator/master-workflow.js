(function expose(factory) {
  const workflow = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = workflow;
  if (typeof window !== "undefined") window.MasterWorkflow = workflow;
})(function createModule() {
  function createMasterWorkflow({ api, view, identityContext, accountabilityFlow }) {
    let competitionId;
    let accountability;

    function masterCompetition(nextContext) {
      const identity = nextContext || (identityContext && identityContext.getCurrentIdentityContext());
      if (identity && typeof identity === "object") {
        const actor = identity.actor || identity.trustedActor;
        if (actor?.actorType === "master" && identity.competitionId !== undefined) {
          return identity.competitionId;
        }
        throw new TypeError("A master identity context is required");
      }
      // Retain the pre-identity competition-id convention for non-UI consumers.
      if (identity !== undefined && identity !== null && identity !== "") return identity;
      throw new TypeError("A master identity context is required");
    }

    async function refresh() {
      view.loading();
      try {
        const result = await api.matchOverview(competitionId);
        view.matches(result.matches);
      } catch (error) {
        view.error(error.message);
      }
    }

    async function assign({ matchId, refereeId }) {
      view.busy(matchId);
      try {
        if (accountabilityFlow) accountabilityFlow.verify(accountability);
        await api.assignReferee(competitionId, matchId, refereeId);
        await refresh();
      } catch (error) {
        view.error(error.message);
      }
    }

    return {
      start(nextCompetitionId) {
        competitionId = masterCompetition(nextCompetitionId);
        if (accountabilityFlow) accountability = accountabilityFlow.begin({ actorType: "master", competitionId });
        return refresh();
      },
      assign,
      refresh
    };
  }

  return { createMasterWorkflow };
});
