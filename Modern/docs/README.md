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

### First-event accepted risk: passwordless referee identity entry

For the first competition (trusted-network scenario, six known referees) the referee
workstation entry lets an operator type a competition id and pick their own name from
the roster, then calls `foundation-establish` directly. Supporting this boundary:

* `GET /api/public/competitions/:competitionId/referee-roster` exposes roster referee
  names without a session (names only, no other data).
* Selecting a name **does not prove identity**; anyone on the network can impersonate
  a listed referee. This is an explicitly accepted risk for the first event and is
  recorded as technical debt to be closed by the production identity integration.

The [production identity integration boundary](production-identity-integration.md)
defines how a future verified external identity is linked to this existing actor
session contract. It supplies ports only: no provider, protocol, account model, or
production endpoint is implemented.

The architectural separation is:

* **Session identity = WHO** is making the request.
* **Domain authority = MAY / CAN / VALID** remains in Match Operations, participant
  readiness, and the other existing backend capabilities.

Authentication adds no roles beyond referee, master, and participant and introduces
no permission model. In particular, a session does not imply match assignment,
participant readiness, or master assignment authority.

## Workflow accountability

An authenticated workflow captures the current actor, actor type, and competition
when the operator opens it. Before a referee, master, or participant mutation is
sent, the UI verifies that this accountability snapshot still matches the current
session responsibility context. If navigation or context selection changed in the
meantime, the operator must reopen the workflow instead of acting from stale UI.

This is client-side workflow continuity, not authorization. It creates no audit
record, account, role grant, or permission decision. The existing backend services
and domains remain the sole authority for whether an operation is valid.
