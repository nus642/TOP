# M2 Tournament Coordination Engineering Design Record

| Field | Value |
|---|---|
| Design Record ID | ED-M2-TC-001 |
| Version | 1.0 |
| Status | Approved |
| Design owner | TOP Engineering Team |
| Decision authority | TOP Engineering Governance |
| Design date | 2026-08-14 |
| Authorized by | ERA-M2-TC-001 Version 1.2 (`Ready`) |
| Product baseline | PS-M2-TC-001 Version 1.1; PD-M2-COURT-001 |
| Governing issue | #129 |

## 1. Design purpose

This record translates the approved M2 Tournament Coordination business baseline into
one coherent Modern engineering response.

It designs only the minimum loop:

> known Courts begin available → Referee start makes the assigned Court occupied →
> Master reports a Court exception → affected Match explicitly waits or the Referee
> interrupts it → Master records deferment → Master reports recovery → Referee resumes
> and the Court becomes occupied → Referee ends Match execution and the Court becomes
> available → chronology and operating view survive refresh and restart.

Alternative-Court reassignment is not part of this design.

## 2. Current implementation evidence

The following is implementation evidence at the pre-design main baseline; it is not
upstream business authority.

| Current evidence | Design relevance |
|---|---|
| `Modern/engine/operations/domain/match-operation.js` | Match states are idle/upcoming/assigned/accepted/playing/scored/confirmed/finished. There is no interruption or resume state transition. |
| `Modern/services/match-operations.service.js` | Match mutations already use a transaction, lock the Tournament and Match, validate competition lifecycle, and preserve M1 responsibility. |
| `Modern/repositories/match-operation.repository.js` | Referee start persists `playing`; result submission persists `scored`; no Court consequence is persisted. |
| `Modern/repositories/live-match-status.repository.js` | Master projection reads Match plus immutable `match_schedules.court_id`; it has no authoritative Court condition or exception chronology. |
| `Modern/api/referee-workflow.js` | Assigned Referee can accept, start, and submit score; no interrupt or resume operation exists. |
| `Modern/api/master-workflow.js` | Master can assign Referee and confirm result; no Court report or deferment operation exists. |
| `Modern/server.js` | Authenticated Master, Referee, Match Operations, public, and archive boundaries already exist and should be extended rather than bypassed. |

## 3. Design boundaries

### In this design

- authoritative current Court condition for every Court reference known to the
  Tournament schedule;
- attributable condition changes and significant chronology;
- automatic Court consequences of Referee start/resume/end;
- explicit Master reporting of constrained, uncertain, and available recovery facts;
- Referee interruption and resumption;
- one Court-disruption coordination record with deferment disposition;
- multi-Match/Multi-Court Master projection;
- restart, concurrency, migration, and verification behavior.

### Not in this design

- Court creation, booking, inventory, facility policy, sensors, or venue integration;
- Match–Court reassignment or schedule mutation;
- automatic Match interruption or automatic Match resumption;
- a generic event bus, workflow engine, case platform, or permission engine;
- changing M1 score, confirmation, Official Record, public, or archive authority;
- notifications, referee replacement, cancellation, no-show, dispute, appeal, or
  safety/legal adjudication.

## 4. Authoritative engineering model

### 4.1 Court condition

The governed condition vocabulary remains:

- `available` — the Court can support Match work and is not currently executing a
  Match;
- `occupied` — the Court is executing one assigned Match;
- `constrained` — a reported physical or operational condition prevents or threatens
  expected Match work;
- `uncertain` — the usable condition cannot currently be established.

The current Court condition is stored independently from Match status. Its record must
contain:

- Tournament and Court reference;
- current condition;
- source type: initial baseline, Match execution, or Master report;
- source reference, including Match or report identity where applicable;
- attributable actor when a human action supplies the fact;
- effective time;
- monotonic version for stale-write detection;
- last significant chronology reference.

### 4.2 Known Court baseline

M2 does not introduce a Court inventory. A known Court is a distinct, non-empty Court
reference in the authoritative Tournament schedule.

If no persisted condition exists for a known Court, the authoritative baseline is
`available`, version 0, source `initial_baseline`. The first mutation materializes
the record. This deterministic rule reconstructs the same baseline after restart.

A later Court-inventory capability may replace this derivation only through new
Product Scope and migration governance.

### 4.3 Match execution

The Match lifecycle gains one execution state:

- `interrupted` — a Match that was playing has been explicitly interrupted by its
  assigned Referee and is eligible for explicit resume.

A Match expected on a constrained/uncertain Court but not yet playing remains in its
existing lifecycle state. The backend operating projection marks it `waiting` from
the authoritative schedule relationship, Court condition, and open disruption. This
is a server-owned projection, not client state and not a new Match execution fact.

Referee result submission is the M2 business event “end Match execution.” Therefore
the existing `playing → scored` transition releases the assigned Court to
`available`. Master result confirmation remains a later M1 trust transition and
does not control Court release.

### 4.4 Court disruption

A Court-specific disruption record relates:

- Tournament;
- Court;
- affected Match when known;
- opening condition and report;
- current coordination disposition: `attention_required`, `deferred`, or
  `resolved`;
- opening, deferment, recovery, and resolution attribution/time;
- version.

This is a specific M2 coordination record, not a generic case or workflow object.

### 4.5 Significant chronology

An append-only Tournament coordination chronology records only significant M2 facts:

- Court condition reported or changed by Match consequence;
- affected Match related;
- Referee interruption;
- Master deferment;
- Master recovery report;
- Referee resumption;
- Match execution end and Court release;
- rejected stale/conflicting attempts when operationally material.

Every event contains Tournament, Court, optional Match, event type, source,
attributable actor when applicable, effective time, correlation identity, and the
versions produced by the transaction.

Official Match Result records remain separate and unchanged.

## 5. Engineering decisions

### ED-M2-TC-D01 — Separate persisted Court authority

**Decision:** Persist current Court condition separately from Match rows and expose it
only through Court Management-owned operations and projections.

**Alternatives rejected:**

- derive every condition from Match status — cannot represent constrained or uncertain;
- store a UI-only status — not restart-safe or authoritative;
- add condition directly to `match_schedules` — merges mutable operation with
  Scheduling-owned assignment truth.

**Consequence:** a small Court-condition repository/service boundary is required.

### ED-M2-TC-D02 — Transactional automatic Match consequences

**Decision:** Referee start/resume/end changes Match and assigned Court in the same
database transaction.

- start: `accepted → playing` and `available → occupied`;
- resume: `interrupted → playing` and `available → occupied`;
- submit result/end: `playing → scored` and `occupied → available`.

The source actor is the authenticated assigned Referee. Court history and chronology
are written in the same commit.

**Failure rule:** if any Match, Court, schedule, actor, lifecycle, or chronology check
fails, neither side advances.

### ED-M2-TC-D03 — Explicit Master report contract

**Decision:** Add a Master-authenticated Court Management operation that accepts only
`available`, `constrained`, or `uncertain`, plus current expected version and
optional affected Match context.

A Master report:

- may create constrained/uncertain even while Match work is active, making the conflict
  visible and requiring Referee interruption;
- may create available only when no playing Match currently requires occupied;
- never changes Match status, score, assignment, or referee responsibility;
- always records attribution and chronology.

`occupied` cannot be supplied by Master; it is only a Match consequence.

### ED-M2-TC-D04 — Explicit Referee interruption and resume

**Decision:** Add assigned-Referee Match Operations:

- interrupt: `playing → interrupted`; requires the assigned Court to be constrained or uncertain;
- resume: `interrupted → playing`; requires the assigned Court to be available.

Interrupt does not release the Court as generally available. The Court remains
constrained/uncertain until Master recovery. Resume automatically occupies it.

No time passage, refresh, Master report, or client logic may resume the Match.

### ED-M2-TC-D05 — Specific deferment coordination

**Decision:** Master deferment updates the open Court disruption to `deferred`.
It does not mutate Match execution or Scheduling.

A disruption becomes resolved only after:

- the Court is recovered and the affected Match resumes; or
- the affected Match has already ended and the Court is available.

If operation remains deferred, the open blocker and next responsible actor remain
visible after restart.

### ED-M2-TC-D06 — Authoritative combined operating projection

**Decision:** Extend the existing Master live-status projection on the server. For each
known Court it combines:

- current authoritative Court condition and provenance;
- scheduled/assigned Match relationship;
- Match execution state;
- assigned Referee responsibility;
- open disruption and deferment;
- current blocker, attention reason, and next responsible actor.

The projection may label a not-yet-playing affected Match as `waiting`, but it must
return the underlying facts and never persist or advance state itself.

Public result projection remains unchanged.

### ED-M2-TC-D07 — Concurrency and stale-write control

**Decision:** Use database transactions, row locks, and versions.

Lock order for every M2 mutation is:

1. Tournament;
2. applicable Court-condition record;
3. Match;
4. Court-disruption record.

If a condition row does not yet exist, materialize its version-0 baseline within the
transaction before locking/mutating it.

Master reports and deferment carry an expected version. Referee operations validate
the current locked Court version and Match state. Duplicate retries are either
idempotently recognized by correlation identity or rejected without partial changes.

### ED-M2-TC-D08 — Additive persistence and restart reconstruction

**Decision:** Add three bounded persistence concerns:

1. current Court operating conditions;
2. Court disruptions;
3. append-only Tournament coordination chronology.

Existing Match storage receives only the minimum interruption/resumption data needed
to reconstruct Match execution. Existing schedule assignment and Official Record
structures are not repurposed.

At startup and after restart, no in-memory workflow state is required.

### ED-M2-TC-D09 — Compatibility and migration

**Decision:** Migration is additive and M1-compatible.

For existing data:

- known Courts without an active playing Match use the deterministic available
  baseline;
- a known Court related to an existing playing Match is materialized as occupied with
  source `migration_match_execution`;
- confirmed/scored historical Matches do not create current occupied conditions;
- no historical Official Record is rewritten;
- no Match–Court assignment history is changed.

Rollback may stop exposing M2 operations while preserving new records; it must not
attempt to erase trustworthy chronology.

## 6. Operation contracts

The implementation may choose exact code organization, but these authenticated
semantic operations are fixed by this design:

| Operation | Actor | Required checks | Atomic result |
|---|---|---|---|
| Report Court condition | Master | Competition lifecycle; known Court; expected version; active-Match conflict | Current condition + disruption/chronology |
| Defer Court disruption | Master | Open disruption; expected version; affected context still current | Deferred disposition + chronology |
| Interrupt Match | Assigned Referee | Match playing; assigned Court condition blocks operation | Match interrupted + chronology |
| Resume Match | Assigned Referee | Match interrupted; participants/responsibility still valid; Court available | Match playing + Court occupied + chronology |
| Start Match | Assigned Referee | Existing M1 checks plus known assigned Court available | Match playing + Court occupied + chronology |
| Submit result/end | Assigned Referee | Existing M1 checks plus Match playing | Match scored + Court available + chronology |
| Read live coordination | Master | Authenticated Master context | Combined authoritative projection only |

Recommended REST placement consistent with the current boundary:

- Master Court report and deferment under `/api/master-workflow`;
- Referee interrupt/resume under `/api/referee-workflow`;
- authoritative state changes delegated to Match Operations and Court Management
  services rather than implemented in route handlers;
- combined read projection under the existing Master live-status context.

Exact route strings and JSON field names are implementation-level choices if they
preserve these semantic contracts.

## 7. Positive course

1. Schedule exposes known Courts as available baseline.
2. Referee accepts responsibility and starts Match A on Court 1.
3. One transaction starts Match A, occupies Court 1, and writes chronology.
4. Master reports Court 1 constrained with expected version.
5. The projection shows Court 1 constrained, Match A still playing, attention required,
   and Referee as next actor.
6. Assigned Referee interrupts Match A.
7. Master records deferment.
8. Master reports Court 1 available after the condition clears.
9. Projection shows Match A interrupted and Referee as next actor.
10. Assigned Referee resumes; one transaction changes Match A to playing and Court 1
    to occupied.
11. Referee submits the result/ends execution; one transaction changes Match A to
    scored and Court 1 to available.
12. Master confirmation and M1 Official Record creation continue unchanged.
13. Refresh/restart reconstructs the same Court, Match, disruption, and chronology.

## 8. Negative and conflict behavior

Implementation verification must prove:

- Master cannot report occupied;
- Master cannot report available while a Match is playing on the Court;
- Referee cannot start/resume on constrained or uncertain Court;
- wrong Referee cannot interrupt/resume;
- Master Court report does not change Match state;
- Court recovery does not resume Match;
- stale condition/disruption version is rejected;
- two Matches cannot occupy one Court concurrently;
- one Match cannot occupy two Courts;
- duplicate retry does not duplicate chronology or partially advance state;
- Court without governed schedule reference is rejected;
- archived/completed Competition rejects M2 mutation;
- public/archive official results remain sourced only from trusted M1 records.

## 9. Verification strategy

### Automated

- domain transition tests for Court condition and Match interruption/resume;
- repository transaction and lock-order tests;
- actor/responsibility tests;
- stale-write and concurrent-start tests;
- Master combined-projection tests;
- migration tests;
- M1 regression suite;
- full Modern suite with zero failures.

### Real database rehearsal

Using MySQL and authenticated UI/workflow contexts:

1. create one running Competition with at least two Matches and two known Courts;
2. show both Courts initially available;
3. start Match A and prove Court 1 occupied;
4. allow another Match to proceed normally;
5. report Court 1 constrained as Master;
6. prove Match A did not change automatically;
7. interrupt as assigned Referee;
8. record deferment as Master;
9. reject one stale report;
10. report Court 1 available;
11. prove Match A did not resume automatically;
12. resume as assigned Referee and prove Court 1 occupied;
13. submit result/end and prove Court 1 available;
14. confirm result and prove trusted Official Record/public/archive behavior;
15. restart service and reconstruct chronology;
16. run the full Modern suite with zero failures.

## 10. Impact assessment

| Dimension | Assessment |
|---|---|
| Product outcomes | Directly implements PS-M2-TC-001 v1.1 without adding reassignment. |
| Actor authority | Master report and Referee execution remain distinct and authenticated. |
| Business objects | Court condition, Match execution, disruption, and official result remain separate. |
| Compatibility | M1 flows are extended transactionally; Official Record and public/archive sources are unchanged. |
| Operability | Current state and chronology reconstruct after restart; blockers and next actor are visible. |
| Security/accountability | Existing actor session boundary is reused; no client-supplied actor identity is trusted. |
| Privacy/compliance | No new sensitive participant data; actor/time provenance follows existing accountability needs. |
| Failure recovery | Transactions prevent partial changes; versions expose stale actions; retries are correlated. |
| Reversibility | Additive structures can be left dormant; historical records are not rewritten. |

## 11. Traceability

| Product inclusion | Engineering decisions |
|---|---|
| M2-PSI-001 | D06, D07, D08 |
| M2-PSI-002 | D01, D02, D03, D07, D08, D09 |
| M2-PSI-003 | D02, D04, D07, D08 |
| M2-PSI-004 | D03, D04, D05, D06, D07 |
| M2-PSI-005 | D02–D09 |

## 12. Review findings and dispositions

| Finding | Disposition |
|---|---|
| Existing `scored` and `confirmed` stages could make Court release ambiguous. | Closed — Referee result submission (`playing → scored`) is the execution-end event; Master confirmation does not hold the Court. |
| Existing schedule contains Court reference but no Court inventory. | Closed — M2 known Courts are authoritative schedule references; no inventory is invented. |
| A Master constraint can temporarily conflict with a still-playing Match. | Closed — keep both facts explicit, require Referee interruption, and make the projection show attention. |
| Persisting occupied only as a derived view could lose provenance and concurrency control. | Closed — persist current Court condition and chronology in the same Match transaction. |
| Generic event/case infrastructure would exceed M2. | Closed — use specific Court disruption and Tournament coordination chronology concerns only. |

## 13. Decision gates

| Gate | Result |
|---|---|
| Authorized baseline | Pass |
| Complete decision set | Pass |
| Actor/domain authority | Pass |
| Transaction and concurrency integrity | Pass |
| Restart and chronology | Pass |
| M1 compatibility | Pass |
| Negative behavior | Pass |
| Product/Business Architecture consistency | Pass |
| No out-of-scope reassignment/platform invention | Pass |
| Findings | Pass — all findings closed |

## 14. Approval and handoff

ED-M2-TC-001 Version 1.0 and decisions D01–D09 are **Approved**.

Implementation may consume only:

- PS-M2-TC-001 Version 1.1;
- PD-M2-COURT-001;
- ERA-M2-TC-001 Version 1.2;
- this ED-M2-TC-001 Version 1.0 design.

Implementation must return to Engineering Design governance if it needs to change a
business invariant, merge Court and Match truth, release Court at a different business
event, add reassignment, introduce a new actor/source, or select a generic platform
capability.
