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
        const [result, coordination] = await Promise.all([
          api.matchOverview(competitionId), api.liveCoordination(competitionId)
        ]);
        view.matches(result.matches);
        view.courts(coordination.courts || []);
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

    async function dispatchMatch({ matchId, courtId, refereeId, expectedVersion }) {
      view.busy(matchId);
      try {
        if (accountabilityFlow) accountabilityFlow.verify(accountability);
        await api.dispatch(competitionId, matchId, {
          courtId, refereeId, expectedVersion, correlationId: crypto.randomUUID()
        });
        await refresh();
      } catch (error) {
        view.error(error.message);
        await refresh();
      }
    }

    async function withdraw({ matchId, expectedVersion }) {
      view.busy(matchId);
      try {
        if (accountabilityFlow) accountabilityFlow.verify(accountability);
        await api.withdraw(competitionId, matchId, {
          expectedVersion, correlationId: crypto.randomUUID()
        });
        await refresh();
      } catch (error) {
        view.error(error.message);
        await refresh();
      }
    }

    async function reassign({ matchId, newRefereeId, expectedVersion }) {
      view.busy(matchId);
      try {
        if (accountabilityFlow) accountabilityFlow.verify(accountability);
        await api.reassign(competitionId, matchId, {
          newRefereeId, expectedVersion, correlationId: crypto.randomUUID()
        });
        await refresh();
      } catch (error) {
        view.error(error.message);
        await refresh();
      }
    }

    async function loadCandidates(matchId) {
      return api.availableCandidates(competitionId, matchId);
    }

    async function confirm(matchId) {
      view.busy(matchId);
      try {
        if (accountabilityFlow) accountabilityFlow.verify(accountability);
        await api.confirmResult(competitionId, matchId);
        await refresh();
      } catch (error) {
        view.error(error.message);
      }
    }

    async function reportCourt({ courtId, condition, expectedVersion, affectedMatchId }) {
      view.busy(`场地 ${courtId}`);
      try {
        if (accountabilityFlow) accountabilityFlow.verify(accountability);
        await api.reportCourt(competitionId, courtId, { condition, expectedVersion, affectedMatchId });
        await refresh();
      } catch (error) { view.error(error.message); }
    }

    async function deferCourt({ courtId, expectedVersion }) {
      view.busy(`场地 ${courtId}`);
      try {
        if (accountabilityFlow) accountabilityFlow.verify(accountability);
        await api.deferCourt(competitionId, courtId, expectedVersion);
        await refresh();
      } catch (error) { view.error(error.message); }
    }

    return {
      start(nextCompetitionId) {
        competitionId = masterCompetition(nextCompetitionId);
        if (accountabilityFlow) accountability = accountabilityFlow.begin({ actorType: "master", competitionId });
        return refresh();
      },
      assign,
      dispatchMatch,
      withdraw,
      reassign,
      loadCandidates,
      confirm,
      reportCourt,
      deferCourt,
      refresh
    };
  }

  return { createMasterWorkflow };
});
