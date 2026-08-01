# TASK-COMP-004-A1 Architecture Recommendation

**Candidate task:** Contest Identity / Configuration Reference Policy

**Recommendation date:** 2026-08-01

**Scope:** Architecture sequencing and policy boundaries only

**Decision:** Create the task as a documentation-only, business-decision task before implementation planning

---

## Recommendation

TOP should create **TASK-COMP-004-A1: Contest Identity / Configuration Reference Policy** as the next architecture step.

The task addresses a real missing policy decision. The completed boundaries establish who owns configuration, generated contests, assignments, execution facts, and official records, but they intentionally do not decide how those separately owned facts retain a stable, historically meaningful relationship when configuration or a contest is later changed, corrected, cancelled, replaced, or superseded.

TASK-COMP-004-A1 should close only that policy gap. It should obtain explicit business decisions and document the resulting invariants. It should not turn those decisions into schemas, identifier formats, versioning mechanisms, APIs, lifecycle machinery, or implementation work.

Implementation planning should wait until this policy reaches its exit condition. Otherwise implementation would have to choose historical identity and reference semantics implicitly through technical design.

---

## 1. Is This a Real Missing Policy Decision?

**Yes.** It is not a restatement of an already completed ownership boundary.

The completed work establishes these facts:

- Competition Configuration owns rules and structure.
- Contest Generation, within Competition, establishes that a particular prospective contest exists.
- Registration owns accepted entrant, roster, eligibility, and prospective lineup facts.
- Scheduling owns placement and assignment facts that reference a contest.
- Match Operations owns execution, actual participation, and outcome facts that reference the contest context.
- Competition Result Recording owns the official record and its correction history.

Those decisions answer **who owns each fact**. They do not answer **what must remain historically true about a reference between those facts**.

The unresolved policy questions are material:

1. What business meaning makes a contest remain the same contest rather than become a distinct replacement?
2. Which governing configuration context must remain interpretable after authorized change?
3. When a contest is corrected, cancelled, replaced, regenerated, or superseded, which historical references remain associated with the original contest and which may concern a distinct contest?
4. What must an authorized reader be able to reconstruct about the relationship among configuration, generated contest, schedule history, execution, and official record?
5. Which boundary is responsible for preserving each owned fact and which cross-boundary guarantees must consumers respect?

Legacy behavior cannot answer these questions. Legacy keys provide technical addressability, destructive writes show only what the implementation permitted, and current-value references do not establish desired historical semantics. Treating any of those mechanics as policy would invent a business rule from an implementation accident.

This is therefore a genuine business-governance gap exposed by the completed boundary work.

---

## 2. Is It the Correct Next Step Before Implementation?

**Yes.** It is the minimum decision step needed before implementation planning for Competition Configuration and Contest Generation can safely proceed.

Implementation structure will inevitably embody answers to the open policy questions. Starting implementation first would allow choices about technical keys, mutable references, copied context, or destructive replacement to become accidental policy. Those choices would also constrain Scheduling, Match Operations, and Competition Result Recording even though those boundaries own their own facts.

Another general legacy analysis should not precede this task. The existing analyses already establish the relevant legacy evidence and, importantly, its limits. A further evidence investigation is justified only if TASK-COMP-004-A1 discovers a narrow, answerable legacy question. Desired future governance still requires business approval and cannot be recovered solely from code.

Another domain-boundary task should not precede it either. No presently identified fact lacks an owner. The missing decision concerns the relationship among facts whose ownership is already established.

The sequencing should therefore be:

1. complete TASK-COMP-004-A1 as a documentation-only policy task;
2. obtain explicit approval or record unresolved cases as blockers or deliberate deferrals; and
3. only then authorize implementation planning to translate the approved policy.

The task is complete only when later implementation planning can proceed without deciding contest continuity or historical-reference policy by accident.

---

## 3. Proposed In-Scope Boundaries

TASK-COMP-004-A1 should include only policy-level decisions and invariants in the following areas.

### 3.1 Contest continuity semantics

Document the business criteria stakeholders use to distinguish:

- an authorized change that still concerns the same contest;
- a correction to information about a contest;
- cancellation of a contest;
- replacement or supersession by a distinct contest; and
- another generation of contests that must not be mistaken for silent mutation of prior facts.

The task should decide the meaning of continuity, not the identifier that represents it and not a state machine for enforcing it.

### 3.2 Governing configuration context

Decide what policy guarantee allows a historical contest to be interpreted in the configuration context that governed its creation or authorized use.

The decision should cover the business significance of relevant configuration categories, such as:

- configured sides and structural position;
- group, stage, or parent-encounter context where applicable;
- discipline, format, and scoring configuration where authoritative;
- encounter/rubber template position where applicable; and
- the authority or provenance necessary to explain why that configuration governed the contest.

This scope should determine required meaning and reconstructability, not whether values are copied, referenced, snapshotted, or stored in any particular way.

### 3.3 Downstream historical-reference expectations

State the guarantees required when independently owned facts refer to a contest:

- Scheduling history must remain interpretable against the contest that was actually assigned.
- Match Operations history must remain interpretable against the contest context in which execution occurred, without converting configured sides into proof of actual participation.
- Competition Result Recording must retain the historical meaning of the contest and outcome underlying the official record.
- A later configuration or contest change must not silently rewrite facts owned by another boundary.

The task should decide these guarantees without defining propagation, events, commands, endpoints, or orchestration.

### 3.4 Ownership and reference responsibilities

Produce a responsibility matrix that preserves existing ownership:

| Concern | Policy responsibility |
|---|---|
| Competition Configuration | Preserve the authoritative meaning and provenance of configuration facts under its ownership. |
| Contest Generation / Competition | Preserve the fact that a particular contest was established and its relationship to the governing configuration context. |
| Registration | Remain authoritative for referenced entrant, roster, eligibility, and prospective lineup facts; references do not transfer those facts to Competition. |
| Scheduling | Preserve assignment history against the contest to which each assignment applied. |
| Match Operations | Preserve execution and actual-participation facts against the contest context in which they were recorded. |
| Competition Result Recording | Preserve the official record and its historically meaningful relationship to the contest and confirmed outcome. |
| Application layer | Coordinate authorized intents and resolve references according to approved policy without becoming a fact owner or workflow engine. |

### 3.5 Policy scenarios and invariants

Test the policy against a small set of business scenarios, without designing their implementation:

- a configuration correction before any contest is generated;
- a configuration change after generation but before scheduling;
- a proposed contest change after assignment;
- a discrepancy discovered after execution;
- a change proposed after an official result exists;
- cancellation or replacement with downstream history already present; and
- repeated generation from related configuration inputs.

For each scenario, record only:

- whether the same-contest versus distinct-contest question is resolved;
- what historical facts must remain interpretable;
- which owner remains authoritative; and
- whether the case is approved, prohibited, deferred, or a blocker.

### 3.6 Decisions, non-decisions, and exit criteria

The deliverable should clearly distinguish:

- approved business policy;
- architectural invariants derived from existing ownership decisions;
- unresolved questions requiring a named business authority;
- deliberate deferrals and the conditions that would reopen them; and
- areas explicitly reserved for later implementation planning.

Recommended exit criteria are:

1. business owners have approved enough continuity policy to distinguish an existing contest from a distinct replacement in every scenario required for the first implementation scope;
2. required historical interpretation of governing configuration is stated without prescribing a mechanism;
3. downstream reference guarantees preserve all established fact owners;
4. unresolved cases are explicit blockers or bounded deferrals rather than guessed rules; and
5. implementation planners can proceed without inventing identity, mutation, or historical-reference policy.

---

## 4. Explicitly Out of Scope

TASK-COMP-004-A1 must not include:

- schemas, entities, tables, fields, aggregates, persistence layouts, or migrations;
- business identifier definitions, identifier formats, key-generation strategies, or technical key selection;
- a choice of version numbers, revisions, snapshots, event sourcing, temporal storage, copy-on-write, or any other versioning mechanism;
- APIs, commands, events, payloads, service contracts, endpoints, or integration protocols;
- implementation plans, code changes, framework choices, repository changes, or delivery estimates;
- workflow engines, state machines, approval pipelines, automatic cascades, or cross-domain orchestration design;
- a complete contest correction, cancellation, regeneration, retention, or deletion feature design;
- authorization-system or role-model design, beyond identifying that policy decisions require an authorized business actor;
- UI flows, operator screens, import behavior, spreadsheet formats, or parser rules;
- draw, seeding, advancement, ranking, standings, qualification, or tie-break policy;
- scheduling algorithms, resource allocation, dispatch, or queue behavior;
- match-execution, scoring, confirmation, or actual-participation rules;
- official-result creation or correction design beyond its required historical-reference guarantee;
- Registration redesign or transfer of entrant, roster, eligibility, or lineup ownership;
- analytics, reporting, notifications, external-system synchronization, or data-retention implementation; and
- creation of an Identity, Lifecycle, Coordination, or Workflow domain.

The task may name a correction, cancellation, or supersession scenario only to decide reference continuity and historical meaning. It must defer the broader policy and mechanics of those capabilities unless separately authorized.

---

## 5. Policy Classification and Ownership

TASK-COMP-004-A1 is best classified as a **Competition-anchored, cross-domain governance policy**.

It is **Competition-anchored** because the subject whose continuity is being governed is the generated contest, and the governing source is Competition Configuration. Contest Generation is already a fact-creation boundary within Competition. The `COMP` task prefix is therefore appropriate.

It is **cross-domain governance** because the policy must constrain how Scheduling, Match Operations, and Competition Result Recording retain historical references to that contest while continuing to own their respective facts. Registration may also be referenced without transferring ownership.

It is **not**:

- a new domain;
- a shared owner of all referenced facts;
- an application-workflow boundary;
- a centralized identity service design;
- a generic enterprise identifier standard; or
- an implementation concern disguised as architecture policy.

The application layer may later coordinate authorized actions under this policy, but coordination does not confer domain ownership. Each boundary remains responsible for its own facts and for honoring the approved reference invariants.

---

## Risks If the Task Is Skipped

### Accidental business policy in technical design

Technical keys, mutable objects, copied values, or current-value lookups may silently decide what “same contest” means. Once downstream data depends on that choice, reversal becomes expensive and risky.

### Loss of historical meaning

A later configuration edit could change how an earlier schedule, execution record, or official result is interpreted. Historical facts might still exist but no longer be reliably explainable.

### Destructive correction or regeneration

Replacement may be implemented as overwrite or deletion, erasing the distinction between original and corrected facts and potentially orphaning downstream references.

### Cross-domain inconsistency

Scheduling could refer to one meaning of a contest while Match Operations or Competition Result Recording resolves the same reference against another. Each record may appear locally valid while the overall history contradicts itself.

### Ownership erosion

A convenience layer may duplicate or mutate facts from multiple domains in an attempt to keep references synchronized, creating an implicit lifecycle domain or workflow engine and weakening established ownership boundaries.

### Audit and dispute risk

TOP may be unable to answer which sides, format, structural context, assignment, execution, and official record applied at the relevant time, especially after a correction or replacement.

### Premature lock-in

Schemas and APIs designed before policy approval may constrain the business to legacy behavior or require costly migration once continuity and reference requirements are finally decided.

### False confidence from legacy IDs

Path-dependent legacy identifiers may be treated as stable business identity even though the analyses establish only technical addressability, not durable sporting meaning.

---

## Final Decision

Create **TASK-COMP-004-A1** next, before implementation planning.

Keep it documentation-only and decision-oriented. Its purpose is to secure the minimum business-approved continuity and historical-reference policy needed to implement already established boundaries safely. Classify it under Competition for stewardship, while explicitly treating its reference guarantees as cross-domain governance. Do not use it to invent a new domain or to select any technical mechanism.

---

*End of Architecture Recommendation*
