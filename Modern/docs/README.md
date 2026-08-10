# Modern Development Documentation

This folder contains implementation and development notes for the Modern codebase.

Architecture, product decisions and platform documentation are maintained in the root `/docs` folder.

## Authenticated actor session foundation

Human workflows now resolve `{ actorId, actorType }` from an opaque, cryptographically
random session identifier held in an HttpOnly, SameSite=Lax cookie. The server stores
the identity; neither the cookie nor `/api/session/me` contains workflow decisions.
Competition selection remains mutable operational UI context.

`POST /api/session/foundation-establish` is an explicitly named development bootstrap.
It accepts a declared actor solely because TOP has no credential verifier yet. Entering
an actor ID **does not prove identity**, and this endpoint is not production
authentication. A future identity provider can replace this one boundary without
changing downstream workflows.

Sessions are held in one process-local `Map`. They disappear on restart and do not
work across multiple application instances. This is intentionally unsuitable for
production deployment.

The architectural separation is:

* **Session identity = WHO** is making the request.
* **Domain authority = MAY / CAN / VALID** remains in Match Operations, participant
  readiness, and the other existing backend capabilities.

Authentication adds no roles beyond referee, master, and participant and introduces
no permission model. In particular, a session does not imply match assignment,
participant readiness, or master assignment authority.
