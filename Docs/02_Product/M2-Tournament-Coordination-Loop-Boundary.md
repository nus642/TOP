# M2 Tournament Coordination Loop Boundary

| Field | Value |
|---|---|
| Status | Product Decision Confirmed — Canon Review Pending |
| Discovery issue | #122 |
| Proposed milestone | M2 — Tournament Coordination Loop |
| Implementation status | Not authorized |

## 1. Purpose

M2 extends TOP from one verified professional match operation loop to the minimum
live-tournament coordination loop needed by a Master operating multiple matches and
courts.

The intended outcome is:

> Multi-match operating picture → attention condition identified → affected court
> and match understood → bounded response coordinated → operation restored or
> explicitly deferred → significant facts remain attributable

M2 does not reopen M1. Participant readiness, referee assignment and responsibility,
explicit match start, score recording, result confirmation, Trusted Competition
Record creation, and public/archive projection remain authoritative capabilities
proved by M1.

This document defines human-visible product behavior and responsibility boundaries.
It does not authorize implementation structure, new persistence, services, workflow
engines, identity, authorization, or platform work.

## 2. Product problem

M1 proves that TOP can operate one match safely. It does not yet prove that a Master
can maintain a coherent competition-day picture when several matches and courts are
active and one physical resource becomes unavailable.

Without an M2 boundary, a Master may see individual match facts but still lack:

1. one authoritative view of which matches and courts are operating normally;
2. a clear distinction between ordinary waiting and a condition requiring attention;
3. the affected Match–Court relationship when a court becomes unavailable;
4. a bounded action that does not silently become scheduling authority;
5. a recoverable record of the exception, coordination decision, and restored state.

## 3. Primary actor and business outcome

### Primary actor

**Master** — the accountable coordinator of live tournament operation.

### Contextual actors

* **Referee** retains responsibility for assigned match execution and supplies
  attributable interruption or resumption facts.
* **Participant** retains responsibility for participant-owned readiness facts.
* **External competition authority** retains ownership of competition definitions,
  rules, draw, and externally governed schedule-plan meaning.
* **Scheduling** owns TOP-managed Match placement, Match–Court assignment,
  reassignment, unassignment, and assignment-history facts. It does not own Court
  condition or Match execution.
* **Public spectator / data consumer** receives trusted projections only; it does not
  participate in coordination.

### Business outcome

The Master can understand the current condition of multiple matches and courts,
recognize one court-unavailability exception, coordinate a bounded response, and
restore or explicitly defer affected operation without assuming another actor's
authority or inventing local workflow truth.

## 4. Canon trace

M2 primarily advances these Approved workflows:

* `OW-M-001` — Understand Current Tournament Conditions;
* `OW-M-002` — Coordinate Court Operating Conditions;
* `OW-M-004` — Coordinate an Operational Exception.

It consumes the completed M1 match-operation facts associated with `OW-M-003` and
the established Participant, Referee, Match Operations, Result Record, Archive, and
public-projection boundaries.

The capability trace is:

> Master Control + Court Management + Exception Handling, supported by Match
> Operations and Event Timeline where attributable operational facts are required.

## 5. Selected exception

### Court temporarily unavailable

During an active competition, a Court that is expected to support Match work becomes
temporarily unavailable because of a physical or operational condition.

M2 must make the following explicit:

* which Court is affected;
* which Match, if any, is using or expected to use it;
* whether the Match is waiting, interrupted, or otherwise unable to proceed;
* who reported or established the court condition;
* which bounded response the Master coordinates;
* whether operation is restored or remains explicitly deferred;
* when the significant condition and recovery occurred.

M2 does not determine the cause's legal, safety, facility-management, or competition-
rule meaning. It preserves the operational fact and its provenance.

### Confirmed minimum recovery loop

The approved minimum M2 course is:

> Court constrained → affected Match explicitly interrupted or waiting → Master
> coordinates deferment → Court becomes available → Referee explicitly resumes Match
> execution → significant chronology remains attributable

Alternative-Court reassignment is conditional rather than required. It may enter M2
delivery only after Engineering Readiness confirms an authoritative Scheduling
reassignment contract. The Master experience must never rewrite `courtId` directly.

## 6. Authoritative facts and responsibility boundaries

| Fact or decision | Authority / responsible actor | M2 experience responsibility |
|---|---|---|
| Competition identity, draw, externally governed schedule plan, and rules | External or appropriately governed competition authority | Reference without redefining |
| TOP-managed Match placement and Match–Court assignment history | Scheduling | Present and request only Scheduling-authorized changes; never rewrite locally |
| Court operating condition | Attributable Court-resource condition authority; Master coordinates the tournament effect through Court Management | Present and refresh the authoritative condition; Master observation or UI action does not create the fact |
| Match operating state | Match Operations | Present; never infer or advance locally |
| Match–Court operating relationship | Established competition/scheduling reference plus Court and Match authorities | Relate the facts without becoming scheduling authority |
| Referee responsibility and execution facts | Match Operations and assigned Referee | Show attribution and hand-off state |
| Participant readiness | Participant Readiness authority | Show only when relevant; never recreate readiness |
| Exception recognition and bounded coordination | Master through Exception Handling within established authority | Submit and display the authoritative result |
| Significant chronology | Trusted Competition Record / Event Timeline boundary | Read and present attributable events |

Identity and accountability metadata identify and attribute the human action. They do
not grant domain authority.

## 7. Completed M2 human workflow

1. The Master opens one active competition and sees an authoritative operating
   picture containing multiple matches and their relevant Court relationships.
2. Ordinary, waiting, in-progress, completed, and attention-requiring conditions are
   distinguishable from backend-owned facts; unknown or conflicting facts remain
   explicit.
3. A Court becomes temporarily unavailable. The attributable Court-condition
   authority records or returns that condition with actor and time attribution;
   Master observation alone does not establish it.
4. The Master sees the affected Court and any related Match. The product explains why
   attention is required and who currently owns the next action.
5. If the affected Match is in play, the assigned Referee supplies the attributable
   execution/interruption fact required by Match Operations. The Master does not
   fabricate that fact.
6. The Master selects one allowed bounded response:
   * keep the affected Match explicitly waiting/deferred; or
   * relate it to an already-authorized alternative Court when such authority and
     reference already exist.
7. The owning domains validate the response. A stale, conflicting, or unauthorized
   action is rejected with an actionable reason and the experience reloads current
   facts.
8. When a valid Court can support the Match again, the responsible actors explicitly
   resume the applicable work. Recovery is not inferred merely because time passed or
   a page refreshed.
9. The Master sees a coherent restored state, or a clear deferred state with the
   remaining blocker and next responsible actor.
10. Significant exception, coordination, and recovery facts are chronologically
    attributable and remain reconstructable after refresh or reopening.

## 8. In scope

* One active competition with at least two scheduled matches.
* At least two Courts represented in the operating picture, sufficient to prove
  multi-resource understanding. The affected Match may recover on its original Court;
  alternative-Court reassignment is not required for M2 completion.
* A Master operating picture derived from authoritative Match, Court, referee,
  readiness, and trusted-record facts.
* Clear Match–Court relationships and attention conditions.
* One temporarily unavailable Court exception.
* One affected Match, whether waiting or interrupted.
* Explicit defer/wait and bounded recovery outcomes.
* Alternative-Court coordination only when the referenced assignment is already
  authorized by the owning competition/scheduling boundary.
* Referee and Master hand-offs that preserve their existing responsibilities.
* Backend validation of stale, conflicting, or premature actions.
* Attributable exception and recovery chronology.
* Automated positive and negative coverage plus one real-DB rehearsal.

## 9. Out of scope

* Tournament creation, draw generation, or full schedule management.
* Inventing, optimizing, or automatically changing the competition schedule.
* Registration, payment, qualification, ranking, or eligibility authority.
* A general court-booking or facility-management product.
* A generic exception, case-management, workflow, or orchestration platform.
* New identity providers, roles, permissions, or policy engines.
* Referee workforce scheduling, certification, availability, payroll, or replacement.
* Result disputes, appeals, corrections, versioning, cancellations, no-shows, or
  multi-official crews.
* Medical, safety, legal, insurance, or facility-policy decisions.
* Sport-specific scoring variants.
* Notification-channel implementation beyond showing the necessary operational
  notice and responsible next action.
* New database, service, event bus, platform, or infrastructure layers unless a later
  Engineering Readiness assessment proves an independently approved need.

## 10. Acceptance criteria

### Multi-match operating picture

* **M2-AC-01:** Given one active competition with multiple matches and Courts, the
  Master can distinguish each relevant Match and Court condition from authoritative
  facts in one operating context.
* **M2-AC-02:** Waiting, in-progress, completed, attention-requiring, unknown, and
  conflicting conditions are not silently collapsed into one generic status.
* **M2-AC-03:** Refreshing or reopening reconstructs the same current operating picture
  without client-owned workflow state.

### Exception recognition

* **M2-AC-04:** When a Court becomes temporarily unavailable, the Master sees the
  Court, provenance, time, and affected Match relationship needed for coordination.
* **M2-AC-05:** The experience explains why attention is required, the current blocker,
  and the actor or authority responsible for the next fact or action.
* **M2-AC-06:** A Court condition does not by itself fabricate an interrupted Match,
  rewrite its schedule, or transfer Referee execution responsibility to Master.

### Bounded response and recovery

* **M2-AC-07:** The Master can explicitly defer the affected work while retaining a
  known Match and Court condition.
* **M2-AC-08:** If alternative-Court reassignment is exposed, it succeeds only through
  Scheduling authority with preserved assignment history; otherwise the capability
  remains absent or the backend returns an actionable rejection. M2 completion does
  not require this optional path.
* **M2-AC-09:** Stale or conflicting coordination attempts fail without partial or
  UI-authored state advancement and reload current authority.
* **M2-AC-10:** Resumption requires the necessary current Court, Match, and Referee
  facts; recovery is explicit and attributable.
* **M2-AC-11:** After recovery, all relevant views agree on the restored or deferred
  state and identify any remaining blocker.

### Trusted chronology and boundary compliance

* **M2-AC-12:** Significant Court unavailability, affected Match context, bounded
  coordination decision, and recovery/defer outcome are chronologically attributable.
* **M2-AC-13:** Reopening the competition reconstructs the exception and recovery
  context from authoritative facts.
* **M2-AC-14:** Public or downstream projections never present a waiting, interrupted,
  or moved Match as an official result and continue to source official scores from the
  Trusted Competition Record.
* **M2-AC-15:** Automated coverage proves the normal multi-match view, the selected
  exception, unauthorized or stale responses, explicit defer, valid recovery, and
  preservation of M1 result trust.
* **M2-AC-16:** Delivery adds no experience-owned workflow authority and does not make
  TOP the source of external competition schedule, rules, or draw truth.

## 11. Real-DB rehearsal evidence

M2 is not complete through mocked services or direct endpoint calls alone. A real-DB
rehearsal must demonstrate:

1. one active competition containing multiple matches and Court relationships;
2. one M1-compatible match completing normally while another is affected;
3. one Court becoming temporarily unavailable with provenance;
4. the affected Match remaining explicitly waiting or interrupted rather than being
   silently advanced;
5. one invalid or stale coordination attempt being rejected without partial change;
6. one valid explicit deferment; an alternative-Court response is additional evidence
   only if Engineering Readiness admits the conditional Scheduling capability;
7. explicit recovery or an explicit remaining deferred condition;
8. chronological, attributable exception and recovery facts after restart/refresh;
9. unchanged M1 trusted Official Record and public/archive behavior;
10. the full Modern suite passing with zero failures.

## 12. Confirmed product decisions and implementation evidence

The Product Owner confirmed these decisions after Canon and repository evidence
review:

1. **Alternative-Court authority:** Scheduling owns Match–Court assignment,
   reassignment, unassignment, and their history. Modern currently supports only the
   initial immutable schedule fact and rejects duplicates. Therefore alternative-
   Court reassignment is conditional on Engineering Readiness and is not required for
   the minimum M2 recovery loop.
2. **Interruption fact:** Match Operations owns Match execution condition. The
   assigned Referee supplies the attributable interruption/resumption fact; Master
   coordinates the tournament effect but cannot create the Match fact. Modern has no
   interruption, pause, or resume contract today.
3. **Court condition vocabulary:** M2 uses the minimum business conditions
   `available`, `occupied`, `constrained`, and `uncertain`. These express Court
   Management meaning, not a universal technical state model. Modern currently has a
   Court reference only and no authoritative Court-condition implementation.
4. **Event Timeline threshold:** Court unavailability becomes durably significant
   when it affects expected or active Match work. The attributable condition, affected
   Match context, Master response, and recovery/deferred disposition enter chronology.
   A transient observation with no operational effect need not become a durable event.

These decisions approve the Product Boundary for Canon review. They do not authorize
implementation. Engineering Readiness must assess the missing Court-condition,
Match-interruption/resumption, Scheduling-reassignment, and Event Timeline contracts
without presuming a database, API, service, or workflow design.

## 13. Completion statement

M2 is complete when a real Master can maintain a coherent view of multiple live
matches and Courts, recognize one attributable Court-unavailability exception,
coordinate a response allowed by existing authority, and recover or explicitly defer
affected operation while preserving responsibility, chronology, and M1 result trust.

It is not complete if the UI calculates a parallel tournament state, if Court
unavailability silently rewrites Match state or schedule, if Master assumes Referee or
external competition authority, or if the path works only through direct API calls.
