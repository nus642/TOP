# M2 Court Condition Authority Decision

| Field | Value |
|---|---|
| Decision ID | PD-M2-COURT-001 |
| Status | Approved |
| Decision authority | TOP Product Owner |
| Decision date | 2026-08-14 |
| Resolves | #130 |
| Applies to | M2 Tournament Coordination Loop |

## 1. Business decision

M2 uses an **automatic-by-match, explicit-by-Master** authority model for Court
operating condition.

A Court condition is not one undifferentiated status supplied by one actor. It is a
governed operational fact whose source depends on the business event:

| Business situation | Authoritative Court condition | Authority and provenance |
|---|---|---|
| Court exists before any Match starts | `available` (business display: 空闲) | Initial Tournament/Court operating baseline |
| Assigned Referee explicitly starts or resumes a Match on the Court | `occupied` (business display: 在赛) | Attributable Match execution fact supplied by the assigned Referee |
| Assigned Referee explicitly ends the Match on the Court | `available` (business display: 空闲) | Attributable Match completion fact supplied by the assigned Referee |
| Physical or operational exception affects the Court | `constrained` or `uncertain` | Explicit, attributable Master report through Court Management |
| Exception is resolved outside a Match start/end event | `available` only when the Court is not supporting an active Match | Explicit, attributable Master report through Court Management |

Start, resume, and completion are Match Operations facts. Their Court consequence is
automatic because the Court is assigned to that Match; the Referee does not separately
report a Court status.

All other M2 Court exceptions are reported explicitly by the Master. A page view,
refresh, elapsed time, client inference, or unattributed observation does not establish
or restore the fact.

## 2. Actor and responsibility clarification

### Master

Within M-G2, OW-M-002, and Court Management, the Master is authorized to report an
attributable Court operating condition when it is not already determined by an
authoritative Match start, resume, or completion fact.

The Master remains the Tournament coordinator. This responsibility does not make the
Master the source of Match execution, Scheduling assignment, facility policy, safety,
legal, or external competition truth.

### Referee

Within assigned Match execution responsibility, the Referee explicitly starts,
resumes, and ends Match work. Those attributable Match facts automatically establish
the assigned Court as occupied or available as described above.

The Referee does not acquire Tournament-wide Court coordination responsibility.

## 3. Conflict and priority rules

1. An active Match execution fact prevents the Court from being reported as available.
2. A Master may report a Court constrained or uncertain while Match work is expected
   or active; this creates the exception requiring the affected Match to become
   explicitly waiting or interrupted through its own authority.
3. A Master Court report does not itself interrupt, resume, complete, move, or
   reassign a Match.
4. A Court cannot return to occupied through observation or refresh. It returns to
   occupied only through an attributable Referee start or resume fact.
5. A Court cannot return to available through a Master report while an active Match
   still owns its occupied consequence.
6. Stale, conflicting, premature, or unattributed changes are rejected without partial
   state advancement.
7. Every non-initial Court-condition change preserves source, responsible actor or
   originating authority, effective time, and relevant Match context.

## 4. Minimum M2 course

> All Courts initially available → Referee starts Match → assigned Court automatically
> occupied → Master reports Court constrained → Referee explicitly interrupts or
> Match remains waiting → Master coordinates deferment → Master reports Court
> available → Referee explicitly resumes Match → Court automatically occupied →
> Referee ends Match → Court automatically available → significant chronology remains
> attributable.

## 5. Boundary effect

This decision closes the unnamed-authority gap identified by
`ERA-M2-TC-F-001` without introducing a new Court Manager actor or an external
facility/sensor authority for M2.

It specializes the existing Master and Referee responsibilities for the approved M2
boundary. It does not select a screen, control, API, schema, service, event, database,
authorization mechanism, or implementation structure.
