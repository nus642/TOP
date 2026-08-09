(function expose(factory) {
  const workflow = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = workflow;
  if (typeof window !== "undefined") window.MasterWorkflow = workflow;
})(function createModule() {
  function createMasterWorkflow({ api, view }) {
    let competitionId;

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
        await api.assignReferee(competitionId, matchId, refereeId);
        await refresh();
      } catch (error) {
        view.error(error.message);
      }
    }

    return {
      start(nextCompetitionId) {
        competitionId = nextCompetitionId;
        return refresh();
      },
      assign,
      refresh
    };
  }

  return { createMasterWorkflow };
});
