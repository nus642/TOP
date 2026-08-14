(function expose(factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.RefereeApi = api;
})(function createModule() {
  function createRefereeApi({ fetchImpl = fetch, baseUrl = "/api", accountabilityContext } = {}) {
    async function request(path, options) {
      const metadata = accountabilityContext ? accountabilityContext.headers() : {};
      const requestOptions = accountabilityContext
        ? { ...options, headers: { ...options?.headers, ...metadata } }
        : options;
      const response = await fetchImpl(`${baseUrl}${path}`, requestOptions);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "比赛操作无法完成该请求");
      return body;
    }

    function scope(tournamentId, refereeId) {
      return `${encodeURIComponent(tournamentId)}/referees/${encodeURIComponent(refereeId)}`;
    }

    return {
      assignedMatches(tournamentId, refereeId) {
        return request(`/match-operations/${scope(tournamentId, refereeId)}/matches`);
      },
      accept(tournamentId, refereeId, matchId) {
        return request(`/referee-workflow/${scope(tournamentId, refereeId)}/matches/${encodeURIComponent(matchId)}/accept`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: "{}"
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
      }
    };
  }
  return { createRefereeApi };
});
