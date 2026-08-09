(function expose(factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.ParticipantReadinessApi = api;
})(function createModule() {
  function createParticipantReadinessApi({ fetchImpl = fetch, baseUrl = "/api" } = {}) {
    async function request(path, options) {
      const response = await fetchImpl(`${baseUrl}${path}`, options);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || "Participant readiness could not complete the request");
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
