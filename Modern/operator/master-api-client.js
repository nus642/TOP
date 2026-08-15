(function expose(factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.MasterApi = api;
})(function createModule() {
  function createMasterApi({ fetchImpl = fetch, baseUrl = "/api", accountabilityContext } = {}) {
    async function request(path, options) {
      const metadata = accountabilityContext ? accountabilityContext.headers() : {};
      const requestOptions = accountabilityContext
        ? { ...options, headers: { ...options?.headers, ...metadata } }
        : options;
      const response = await fetchImpl(`${baseUrl}${path}`, requestOptions);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(body.error || "主控操作无法完成该请求");
        error.errorCode = body.errorCode || null;
        error.statusCode = response.status;
        throw error;
      }
      return body;
    }

    return {
      matchOverview(competitionId) {
        return request(`/master-operations/${encodeURIComponent(competitionId)}/matches`);
      },
      liveCoordination(competitionId) {
        return request(`/master-workflow/${encodeURIComponent(competitionId)}/live-status`);
      },
      reportCourt(competitionId, courtId, report) {
        return request(`/master-workflow/${encodeURIComponent(competitionId)}/courts/${encodeURIComponent(courtId)}/condition`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(report)
        });
      },
      deferCourt(competitionId, courtId, expectedVersion) {
        return request(`/master-workflow/${encodeURIComponent(competitionId)}/courts/${encodeURIComponent(courtId)}/defer`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expectedVersion })
        });
      },
      assignReferee(competitionId, matchId, refereeId) {
        return request(
          `/master-workflow/${encodeURIComponent(competitionId)}/matches/${encodeURIComponent(matchId)}/assign`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refereeId })
          }
        );
      },
      confirmResult(competitionId, matchId) {
        return request(`/master-workflow/${encodeURIComponent(competitionId)}/matches/${encodeURIComponent(matchId)}/confirm-result`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: "{}"
        });
      },
      availableCandidates(competitionId, matchId) {
        return request(`/referee-coordination/${encodeURIComponent(competitionId)}/matches/${encodeURIComponent(matchId)}/available-candidates`);
      },
      dispatch(competitionId, matchId, data) {
        return request(`/master-workflow/${encodeURIComponent(competitionId)}/matches/${encodeURIComponent(matchId)}/dispatch`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
      },
      withdraw(competitionId, matchId, data) {
        return request(`/master-workflow/${encodeURIComponent(competitionId)}/matches/${encodeURIComponent(matchId)}/withdraw`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
      },
      reassign(competitionId, matchId, data) {
        return request(`/master-workflow/${encodeURIComponent(competitionId)}/matches/${encodeURIComponent(matchId)}/reassign`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
      }
    };
  }

  return { createMasterApi };
});
