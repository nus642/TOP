(function expose(factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.RefereeApi = api;
})(function createModule() {
  function createRefereeApi({ fetchImpl = fetch, baseUrl = "/api", accountabilityContext } = {}) {
    // Per-match snapshot controllers: a newer snapshot cancels any in-flight
    // older one so stale writes cannot overtake newer score state (M2 ED-04).
    const snapshotControllers = new Map();

    async function request(path, options) {
      const metadata = accountabilityContext ? accountabilityContext.headers() : {};
      const requestOptions = accountabilityContext
        ? { ...options, headers: { ...options?.headers, ...metadata } }
        : options;
      const response = await fetchImpl(`${baseUrl}${path}`, requestOptions);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(body.error || "比赛操作无法完成该请求");
        error.statusCode = response.status;
        throw error;
      }
      return body;
    }

    function scope(tournamentId, refereeId) {
      return `${encodeURIComponent(tournamentId)}/referees/${encodeURIComponent(refereeId)}`;
    }

    return {
      assignedMatches(tournamentId, refereeId) {
        return request(`/match-operations/${scope(tournamentId, refereeId)}/matches`);
      },
      accept(tournamentId, refereeId, matchId, dispatchVersion) {
        return request(`/referee-workflow/${scope(tournamentId, refereeId)}/matches/${encodeURIComponent(matchId)}/accept`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expectedVersion: dispatchVersion ?? 0, correlationId: `accept-${matchId}-${Date.now()}` })
        });
      },
      start(tournamentId, refereeId, matchId) {
        return request(`/referee-workflow/${scope(tournamentId, refereeId)}/matches/${encodeURIComponent(matchId)}/start`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: "{}"
        });
      },
      interrupt(tournamentId, refereeId, matchId) {
        return request(`/referee-workflow/${scope(tournamentId, refereeId)}/matches/${encodeURIComponent(matchId)}/interrupt`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: "{}"
        });
      },
      resume(tournamentId, refereeId, matchId) {
        return request(`/referee-workflow/${scope(tournamentId, refereeId)}/matches/${encodeURIComponent(matchId)}/resume`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: "{}"
        });
      },
      recordScore(tournamentId, refereeId, matchId, score) {
        return request(`/referee-workflow/${scope(tournamentId, refereeId)}/matches/${encodeURIComponent(matchId)}/score`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(score)
        });
      },
      scoreSnapshot(tournamentId, refereeId, matchId, score) {
        snapshotControllers.get(matchId)?.abort();
        const options = {
          method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(score)
        };
        if (typeof AbortController !== "undefined") {
          const controller = new AbortController();
          snapshotControllers.set(matchId, controller);
          options.signal = controller.signal;
        }
        return request(`/referee-workflow/${scope(tournamentId, refereeId)}/matches/${encodeURIComponent(matchId)}/score-snapshot`, options)
          .catch((error) => {
            // A superseded snapshot is not an error: the newer write carries truth.
            if (error?.name === "AbortError") return null;
            throw error;
          });
      }
    };
  }
  return { createRefereeApi };
});
