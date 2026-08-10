function verifiedIdentity(providerId, subject) {
  if (typeof providerId !== "string" || providerId.trim() === "") {
    throw new TypeError("Verified identity providerId is required");
  }
  if (typeof subject !== "string" || subject.trim() === "") {
    throw new TypeError("Verified identity subject is required");
  }
  return Object.freeze({ providerId: providerId.trim(), subject: subject.trim() });
}

function createProductionIdentityBoundary({ identityAdapter, actorLink, actorSessions }) {
  if (typeof identityAdapter?.verify !== "function") throw new TypeError("identityAdapter.verify is required");
  if (typeof actorLink?.resolve !== "function") throw new TypeError("actorLink.resolve is required");
  if (typeof actorSessions?.establish !== "function") throw new TypeError("actorSessions.establish is required");

  return Object.freeze({
    async establish(request) {
      const suppliedIdentity = await identityAdapter.verify(request);
      const identity = verifiedIdentity(suppliedIdentity?.providerId, suppliedIdentity?.subject);
      const linkedActor = await actorLink.resolve(identity);

      // The actor session deliberately receives only identity. Provider claims and
      // link metadata can never become domain authority through this boundary.
      return actorSessions.establish({
        actorId: linkedActor?.actorId,
        actorType: linkedActor?.actorType
      });
    }
  });
}

module.exports = { createProductionIdentityBoundary, verifiedIdentity };
