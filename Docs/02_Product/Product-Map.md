# TOP Product Map

## Current Delivered Boundary

M1 is complete and frozen at tag
`m1-rehearsal-passed-2026-08-14`.

[M1 Match Operation Loop Boundary](M1-Match-Operation-Loop-Boundary.md) defines one
professional match from participant readiness through referee assignment,
responsibility acceptance, explicit start, score recording, result confirmation,
attributable Trusted Competition Record creation, and trusted public/archive
visibility.

M1 delivery evidence includes the complete Modern test suite, real-DB rehearsal, and
the frozen main commit referenced by the release tag.

## Approved Next Product Boundary

[M2 Tournament Coordination Loop Boundary](M2-Tournament-Coordination-Loop-Boundary.md)
is the Canon-approved M2 Product Boundary.

[M2 Tournament Coordination Product Scope](M2-Tournament-Coordination-Product-Scope.md)
Version 1.0 establishes the initial scope. Its controlled
[Version 1.1](M2-Tournament-Coordination-Product-Scope-v1.1.md) governs the
Court-condition authority clarification.

[M2 Court Condition Authority Decision](M2-Court-Condition-Authority-Decision.md)
records the approved automatic-by-match, explicit-by-Master business rule:

- every Court begins available;
- Referee start/resume automatically makes the assigned Court occupied;
- Referee completion automatically makes it available;
- constrained, uncertain, and other exception conditions require an attributable
  Master report;
- Court recovery does not resume a Match; the Referee must resume explicitly.

M2 extends TOP from one safe match-operation loop to the minimum live-tournament
coordination loop needed by a Master operating multiple Matches and Courts. Its
selected exception is a temporarily constrained Court affecting expected or active
Match work.

The revised minimum recovery course is:

> Court initially available → Referee starts Match and Court becomes occupied →
> Master reports Court constrained → affected Match explicitly interrupts or waits →
> Master coordinates deferment → Master reports Court available → Referee explicitly
> resumes Match and Court becomes occupied → Referee ends Match and Court becomes
> available → significant chronology remains attributable.

Alternative-Court reassignment is explicitly excluded from required M2 completion.
A later Product Scope version may reconsider it only after authoritative Scheduling
meaning and history are governed.

Engineering Readiness Version 1.2 is `Ready` for Product Scope
PS-M2-TC-001 Version 1.1.

[M2 Tournament Coordination Engineering Design](../03_Engineering/M2-Tournament-Coordination-Engineering-Design.md)
ED-M2-TC-001 Version 1.0 is Approved. It selects separate authoritative Court
condition, transactional Match consequences, explicit Master reporting, Referee
interrupt/resume, bounded deferment, combined projection, concurrency control,
restart reconstruction, and additive M1-compatible migration.

The approved design authorizes a bounded implementation issue. It does not itself
authorize a milestone, release, deployment, or completion claim.

Version: 1.6

Status: Product Map — M1 delivered; M2 Scope/Readiness/Engineering Design approved; bounded implementation next

Last Update: 2026-08-14

Author:
Paul Wu + ChatGPT
