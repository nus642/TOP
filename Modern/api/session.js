const express = require("express");
const { SESSION_COOKIE, readCookie } = require("../session/actor-session");

function createSessionRouter(store, { secure = process.env.NODE_ENV === "production" } = {}) {
  const router = express.Router();

  // Development bootstrap only: replace this boundary with credential verification.
  router.post("/foundation-establish", (req, res) => {
    try {
      const sessionId = store.establish(req.body);
      const flags = [`${SESSION_COOKIE}=${encodeURIComponent(sessionId)}`, "HttpOnly", "SameSite=Lax", "Path=/"];
      if (secure) flags.push("Secure");
      res.set("Set-Cookie", flags.join("; ")).status(201).json({ established: true });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.get("/me", (req, res) => {
    const current = store.resolve(readCookie(req.headers.cookie));
    if (!current) return res.status(401).json({ error: "Authenticated actor session required" });
    res.json(current);
  });
  return router;
}

function requireActorSession(store) {
  return (req, res, next) => {
    const current = store.resolve(readCookie(req.headers.cookie));
    if (!current) return res.status(401).json({ error: "Authenticated actor session required" });
    req.actor = current;
    // This middleware runs before the mounted router has populated req.params, so
    // compare identity-bearing legacy URL segments at the session boundary.
    const match = req.path.match(/\/(?:referees|participants)\/([^/]+)(?:\/|$)/);
    let routedActorId;
    try {
      routedActorId = match && decodeURIComponent(match[1]);
    } catch {
      return res.status(401).json({ error: "Workflow actor does not match authenticated session" });
    }
    if (routedActorId && routedActorId !== current.actorId) {
      return res.status(401).json({ error: "Workflow actor does not match authenticated session" });
    }
    next();
  };
}

module.exports = { createSessionRouter, requireActorSession };
