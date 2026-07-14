# Issue: Tournament Context Management

## Background

During the initial Modern architecture implementation, the current development flow uses a fixed tournament ID:

```
tournament_id = 1
```

This is acceptable for early architecture validation and local development.

However, TOP is designed to support multiple tournaments, organizers, and tournament masters.

A permanent fixed tournament context is not suitable for production usage.

---

## Current Situation

Current service calls may contain:

```javascript
getTournamentById(1)

getPlayersByTournament(1)

getMatchesByTournament(1)
```

The tournament context is currently implicit.

---

## Problem

Future scenarios require:

* Multiple active tournaments
* Different tournament Masters
* Super Admin authorization
* Tournament-specific data isolation
* Public viewing of specific events

The system needs a clear mechanism to determine:

"Which tournament is this operation operating on?"

---

## Future Direction

Possible solutions:

* Tournament ID passed through API request
* Master login session associated with tournament
* Event context in authentication token
* Tournament workspace concept

The final approach should be decided together with:

* Authentication design
* Super Admin design
* Multi-tenant architecture

---

## Status

Identified during Modern architecture migration.

Not required for current MVP implementation.
