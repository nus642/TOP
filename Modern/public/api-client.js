(function expose(factory) {
  const moduleApi = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = moduleApi;
  if (typeof window !== "undefined") window.PublicScoreboardApi = moduleApi;
})(function createModule() {
  function createPublicScoreboardApi({ fetchImpl = fetch, baseUrl = "/api/public" } = {}) {
    return {
      async matches(competitionId) {
        const response = await fetchImpl(
          `${baseUrl}/competitions/${encodeURIComponent(competitionId)}/matches`
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "The scoreboard could not be loaded");
        return body;
      }
    };
  }

  return { createPublicScoreboardApi };
});
