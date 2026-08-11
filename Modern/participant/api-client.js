(function expose(factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.ParticipantReadinessApi = api;
})(function createModule() {
  function createParticipantReadinessApi({ fetchImpl = fetch, baseUrl = "/api", accountabilityContext } = {}) {
    async function request(path, options) {
      const metadata = accountabilityContext ? accountabilityContext.headers() : {};
      const requestOptions = accountabilityContext
        ? { ...options, headers: { ...options?.headers, ...metadata } }
        : options;
      const response = await fetchImpl(`${baseUrl}${path}`, requestOptions);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || "选手准备状态操作无法完成该请求");
      }
      return body;
    }

    function participantPath(competitionId, participantId) {
      return `/participant-readiness/${encodeURIComponent(competitionId)}/participants/${encodeURIComponent(participantId)}`;
    }

    return {
      readiness(competitionId, participantId) {
        return request(participantPath(competitionId, participantId));
      },
      checkIn(competitionId, participantId) {
        return request(`${participantPath(competitionId, participantId)}/check-in`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}"
        });
      }
    };
  }

  return { createParticipantReadinessApi };
});
