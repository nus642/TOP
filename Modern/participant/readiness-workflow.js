(function expose(factory) {
  const workflow = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = workflow;
  if (typeof window !== "undefined") window.ParticipantReadinessWorkflow = workflow;
})(function createModule() {
  function createParticipantReadinessWorkflow({ api, view, identityContext }) {
    let context;

    function participantContext(nextContext) {
      const identity = nextContext || (identityContext && identityContext.getCurrentIdentityContext());
      const actor = identity?.actor || identity?.trustedActor;
      if (identity && actor?.actorType === "participant" && identity.competitionId !== undefined) {
        return { competitionId: identity.competitionId, participantId: actor.actorId };
      }
      // Retain the pre-identity calling convention for non-UI consumers.
      if (identity && !identity.actorType && identity.competitionId !== undefined && identity.participantId !== undefined) {
        return identity;
      }
      throw new TypeError("A participant identity context is required");
    }

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
        context = participantContext(nextContext);
        return refresh();
      },
      checkIn,
      refresh
    };
  }

  return { createParticipantReadinessWorkflow };
});
