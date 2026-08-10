const { randomBytes } = require("node:crypto");

const ACTOR_TYPES = Object.freeze(["referee", "master", "participant"]);
const SESSION_COOKIE = "top_actor_session";

function actor(actorId, actorType) {
  if (typeof actorId !== "string" || actorId.trim() === "") throw new TypeError("actorId is required");
  if (!ACTOR_TYPES.includes(actorType)) throw new TypeError(`Unsupported actorType: ${actorType}`);
  return Object.freeze({ actorId: actorId.trim(), actorType });
}

function createActorSessionStore({ tokenFactory = () => randomBytes(32).toString("base64url") } = {}) {
  const sessions = new Map();
  return {
    establish(identity) {
      const resolved = actor(identity?.actorId, identity?.actorType);
      const sessionId = tokenFactory();
      if (typeof sessionId !== "string" || !/^[A-Za-z0-9_-]{32,}$/.test(sessionId)) {
        throw new TypeError("Session generator must return an opaque token");
      }
      sessions.set(sessionId, resolved);
      return sessionId;
    },
    resolve(sessionId) {
      if (typeof sessionId !== "string" || !/^[A-Za-z0-9_-]{32,}$/.test(sessionId)) return undefined;
      return sessions.get(sessionId);
    }
  };
}

function readCookie(header, name = SESSION_COOKIE) {
  if (typeof header !== "string") return undefined;
  for (const part of header.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(value.join("="));
      } catch {
        return undefined;
      }
    }
  }
}

module.exports = { ACTOR_TYPES, SESSION_COOKIE, createActorSessionStore, readCookie };
