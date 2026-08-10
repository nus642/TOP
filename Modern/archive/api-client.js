(function expose(factory) {
  const moduleApi = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = moduleApi;
  if (typeof window !== "undefined") window.CompetitionArchiveApi = moduleApi;
})(function createModule() {
  function createCompetitionArchiveApi({ fetchImpl = fetch, baseUrl = "/api/public" } = {}) {
    return {
      async archive(competitionId) {
        const response = await fetchImpl(
          `${baseUrl}/competitions/${encodeURIComponent(competitionId)}/archive`
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || "The competition archive could not be loaded");
        return body;
      }
    };
  }

  return { createCompetitionArchiveApi };
});
