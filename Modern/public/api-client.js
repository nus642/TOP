(function expose(factory) {
  const moduleApi = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = moduleApi;
  if (typeof window !== "undefined") window.PublicScoreboardApi = moduleApi;
})(function createModule() {
  function presentationError(status) {
    if (status === 400) return "比赛编号无效，请检查后重试。";
    if (status === 404) return "未找到该比赛。";
    return "无法加载记分牌，请稍后重试。";
  }

  function createPublicScoreboardApi({ fetchImpl = fetch, baseUrl = "/api/public" } = {}) {
    return {
      async matches(competitionId) {
        const response = await fetchImpl(
          `${baseUrl}/competitions/${encodeURIComponent(competitionId)}/matches`
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(presentationError(response.status));
        return body;
      }
    };
  }

  return { createPublicScoreboardApi };
});
