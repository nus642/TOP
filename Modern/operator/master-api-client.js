(function expose(factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.MasterApi = api;
})(function createModule() {
  function createMasterApi({ fetchImpl = fetch, baseUrl = "/api" } = {}) {
    async function request(path, options) {
      const response = await fetchImpl(`${baseUrl}${path}`, options);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || "Master Operations could not complete the request");
      }
      return body;
    }

    return {
      matchOverview(competitionId) {
        return request(`/master-operations/${encodeURIComponent(competitionId)}/matches`);
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
      }
    };
  }

  return { createMasterApi };
});
