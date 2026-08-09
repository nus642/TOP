(function expose(factory) {
  const workflow = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = workflow;
  if (typeof window !== "undefined") window.ParticipantReadinessWorkflow = workflow;
})(function createModule() {
  function createParticipantReadinessWorkflow({ api, view }) {
    let context;

    async function refresh() {
      view.loading();
      try {
        view.readiness(await api.readiness(context.competitionId, context.participantId));
      } catch (error) {
        view.error(error.message);
      }
    }

    async function checkIn() {
      view.busy();
      try {
        await api.checkIn(context.competitionId, context.participantId);
        await refresh();
      } catch (error) {
        view.error(error.message);
      }
    }

    return {
      start(nextContext) {
        context = nextContext;
        return refresh();
      },
      checkIn,
      refresh
    };
  }

  return { createParticipantReadinessWorkflow };
});
