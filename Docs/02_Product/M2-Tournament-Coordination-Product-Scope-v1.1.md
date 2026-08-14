# M2 Tournament Coordination Product Scope — Controlled Version 1.1

| Field | Value |
|---|---|
| Scope ID | PS-M2-TC-001 |
| Version | 1.1 |
| Status | Approved |
| Predecessor | Version 1.0 |
| Owner and decision authority | TOP Product Team |
| Decision date | 2026-08-14 |
| Authority decision | PD-M2-COURT-001 |

## 1. Purpose

Version 1.1 closes the Court-condition authority gap discovered after Version 1.0.
Except for the controlled clarifications below, every Version 1.0 inclusion,
exclusion, trace, and boundary remains unchanged.

## 2. Controlled scope clarification

### M2-PSI-002 — Attributable Court-condition coordination

The Court operating fact follows the approved automatic-by-match,
explicit-by-Master authority model:

- every Court begins `available` before Match execution;
- an assigned Referee's explicit Match start or resume automatically makes the
  assigned Court `occupied`;
- an assigned Referee's explicit Match completion automatically makes the assigned
  Court `available`;
- `constrained`, `uncertain`, and other non-Match exception conditions require
  an explicit attributable Master report;
- the Master may explicitly restore `available` only when no active Match execution
  fact requires `occupied`.

The observable outcome includes the Court condition, originating Match event or Master
report, responsible actor, effective time, relevant Match relationship, and any
conflict or rejection.

### M2-PSI-003 — Match interruption, waiting, resumption, and Court consequence

Referee start, resume, interruption, and completion remain Match Operations facts.
Only start/resume and completion have the governed automatic Court consequences stated
above. A Master Court report never fabricates or advances Match execution.

### M2-PSI-004 — Bounded coordination and recovery

When the Master reports a constrained or uncertain Court, the affected Match must
still reach waiting or interruption through its own authority. When the Master reports
the Court available, the Match does not resume automatically; the assigned Referee
must explicitly resume it, after which the Court becomes occupied automatically.

## 3. Controlled exclusion correction

Version 1.0 `M2-PSE-002` is replaced for this baseline by:

> Neither Master observation nor the experience itself may create Court truth.
> An explicit attributable Master report is authorized for non-Match Court conditions.
> Match start/resume/completion facts remain supplied by the assigned Referee and
> automatically determine occupied/available consequences. Neither actor gains
> Scheduling, external competition, facility-policy, or the other's execution
> authority.

No new actor, external Court authority, sensor, integration, or facility-management
scope is introduced.

## 4. Required business invariants

1. Initial Court condition is available.
2. One Court cannot be available while an active Match execution fact requires it to
   be occupied.
3. Match end releases its assigned Court automatically.
4. Court recovery never resumes a Match automatically.
5. A Master Court report never interrupts, resumes, completes, moves, or reassigns a
   Match.
6. Significant changes are attributable and chronologically reconstructable.
7. Stale or conflicting actions fail without partial advancement.
8. M1 Official Result and public/archive trust remain unchanged.

## 5. Revised minimum recovery course

> Court initially available → Referee starts Match and Court becomes occupied →
> Master reports Court constrained → affected Match explicitly interrupts or waits →
> Master coordinates deferment → Master reports Court available → Referee explicitly
> resumes Match and Court becomes occupied → Referee ends Match and Court becomes
> available → significant chronology remains attributable.

## 6. Validation and approval

| Gate | Result |
|---|---|
| Actor and goal | Pass — existing Master M-G2 and Referee execution responsibility are specialized without adding an actor. |
| Workflow | Pass — OW-M-002 gains explicit report authority; Match execution remains separately attributable. |
| Capability and object | Pass — Court Management relates Court condition to Match Operations without merging their truth. |
| Boundary | Pass — report authority is distinguishable from observation, inference, and UI-owned state. |
| Provenance | Pass — every non-initial change has an originating authority and effective time. |
| Neutrality | Pass — no UI, API, schema, service, database, role mechanism, or implementation is selected. |
| Approval | Pass — Product Owner decision in #130 approves PD-M2-COURT-001 and this controlled scope version. |

## 7. Change history

| Version | Date | Change | Authority |
|---|---|---|---|
| 1.0 | 2026-08-14 | Initial M2 scope approved by PR #127. | TOP Product Team |
| 1.1 | 2026-08-14 | Governed automatic Match consequences and explicit Master reporting for Court condition. | TOP Product Owner / TOP Product Team |
