(function expose(factory) {
  const moduleApi = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = moduleApi;
  if (typeof window !== "undefined") window.CompetitionArchiveApi = moduleApi;
})(function createModule() {
  function presentationError(status) {
    if (status === 400) return "比赛编号无效，请检查后重试。";
    if (status === 404) return "未找到该赛事档案。";
    return "无法加载赛事档案，请稍后重试。";
  }

  function createCompetitionArchiveApi({ fetchImpl = fetch, baseUrl = "/api/public" } = {}) {
    return {
      async archive(competitionId) {
        const response = await fetchImpl(
          `${baseUrl}/competitions/${encodeURIComponent(competitionId)}/archive`
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(presentationError(response.status));
        return body;
      }
    };
  }

  return { createCompetitionArchiveApi };
});
