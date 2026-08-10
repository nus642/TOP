(function expose(factory) {
  const experience = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = experience;
  if (typeof window !== "undefined") window.OperatorExperience = experience;
})(function createModule() {
  const EXPERIENCES = Object.freeze({
    master: Object.freeze({ actorType: "master", title: "Coordinate the tournament", summary: "See the operational picture and keep match work moving.", responsibility: "Tournament-wide coordination", workspace: "master" }),
    referee: Object.freeze({ actorType: "referee", title: "Run your assigned matches", summary: "Review match work and record attributable outcomes.", responsibility: "Assigned match execution and confirmation", workspace: "referee" }),
    participant: Object.freeze({ actorType: "participant", title: "Review your readiness", summary: "See the readiness facts connected to your participation.", responsibility: "Participant-supplied readiness facts", workspace: "participant" })
  });

  function forActor(actor) {
    const profile = actor && EXPERIENCES[actor.actorType];
    if (!profile) throw new Error(`Unsupported authenticated actor type: ${actor?.actorType || "unknown"}`);
    return profile;
  }

  return Object.freeze({ EXPERIENCES, forActor });
});
