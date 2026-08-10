# Production identity integration boundary

## Decision

TOP defines a narrow seam for a future production identity integration, but does
not select or implement an identity provider. `production-identity-boundary.js`
is not mounted as an HTTP endpoint and does not change the current development
bootstrap. It states the ports that a later deployment must supply.

The boundary has three collaborators:

1. `identityAdapter.verify(request)` performs provider-specific authentication and
   returns only a stable `{ providerId, subject }` identity.
2. `actorLink.resolve(verifiedIdentity)` links that external identity to one
   existing TOP `{ actorId, actorType }`.
3. `actorSessions.establish(actor)` creates the same opaque TOP session already
   consumed by `/api/session/me` and protected workflows.

The first two collaborators are unimplemented ports. How credentials are verified,
how external subjects are linked to TOP actors, and where those links are stored are
deployment decisions outside this milestone.

## Replacement path

Today, `POST /api/session/foundation-establish` sends a caller-declared actor directly
to the session store. It remains a development-only bootstrap and must not be exposed
as production authentication.

A future integration replaces only session establishment:

```text
provider-specific request
  -> identityAdapter.verify
  -> { providerId, subject }
  -> actorLink.resolve
  -> { actorId, actorType }
  -> actorSessions.establish
  -> existing opaque session cookie
  -> /api/session/me and existing workflows
```

The production composition should mount a new establishment endpoint backed by this
boundary and disable the bootstrap endpoint. Session resolution and all downstream
workflow APIs remain unchanged. Production session storage and lifecycle are a
separate operational concern because the current process-local store is intentionally
non-production.

## Identity is not authority

External authentication answers which external subject was verified. Actor linking
answers which existing TOP actor that subject represents. The TOP session then carries
only `actorId` and `actorType`.

Provider claims and actor-link metadata are deliberately discarded. They cannot
grant an operation, validate a match assignment, determine readiness, or bypass a
domain rule. `actorType` selects an existing responsibility-led experience; it is
not a role or permission grant. Existing backend domains remain the sole authority
for whether an operation is valid.

Consequently, a future provider adapter must not translate provider groups, scopes,
or similar claims into domain decisions. If TOP later needs a new business rule,
that rule belongs in the owning domain rather than in this integration boundary.

## Explicitly out of scope

This boundary introduces no provider protocol, credential format, identity UI,
identity persistence, account model, access-control model, or backend domain change.
It also does not make the development bootstrap safe for production.
