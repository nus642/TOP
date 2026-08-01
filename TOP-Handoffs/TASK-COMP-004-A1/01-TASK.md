# TASK-COMP-004-A1: Contest Identity / Configuration Reference Policy

**Status:** Awaiting Policy Decision

**Created:** 2026-08-02

**Depends On:** `TOP-Handoffs/TASK-COMP-004-A1-ARCHITECTURE-RECOMMENDATION.md`

**Scope:** Documentation only — business policy decisions

---

## Purpose

Define the policy decisions required to govern contest identity, contest continuity, and configuration reference semantics across TOP domain boundaries.

This task does **not** design implementation. It records the questions that require business decisions and the invariants that must hold once those decisions are approved.

## Core Principle

**Policy before mechanism.**

The completed boundary work establishes who owns each fact. This task establishes what must remain historically true about references between those facts. It does not choose identifiers, schemas, versioning strategies, APIs, or workflow machinery.

## Background

The following boundaries are already established:

| Boundary | Authoritative responsibility |
|----------|------------------------------|
| Competition Configuration | Rules, structure, templates, and constraints |
| Contest Generation | Generated contest facts |
| Scheduling | Placement and assignment facts |
| Match Operations | Execution facts |
| Competition Result Recording | Official records |

These decisions answer **who owns each fact**. They do not answer **what must remain historically true about a reference between those facts** when configuration or a contest is later changed, corrected, cancelled, replaced, or superseded.

---

## Policy Decision Areas

### 1. Contest Identity Meaning

**Question:** What business meaning makes a contest remain the same contest rather than become a distinct replacement?

Decisions required:

- [ ] What criteria define that a contest is "the same contest" after an authorized change?
- [ ] What criteria define that a contest has been replaced by a distinct contest?
- [ ] Is identity tied to structural position, configured sides, temporal context, or a combination?
- [ ] Does the answer differ by competition mode (round-robin, explicit pairing, team encounter)?

### 2. Contest Continuity Across Configuration Changes

**Question:** When configuration changes after contests are generated, what happens to the relationship between the contest and its governing configuration?

Decisions required:

- [ ] Does a configuration change before scheduling affect existing contests, future contests, or both?
- [ ] Does a configuration change after scheduling affect existing contests, future contests, or both?
- [ ] Does a configuration change after execution affect existing contests, future contests, or both?
- [ ] Is there a point after which a configuration change must create a new contest rather than modify an existing one?
- [ ] What distinguishes a correction from a change from a replacement?

### 3. Configuration Reference Responsibility

**Question:** Who is responsible for preserving the governing configuration context that allows a historical contest to be interpreted?

Decisions required:

- [ ] Must Competition Configuration preserve the authoritative meaning of configuration facts that governed a contest?
- [ ] Must Contest Generation preserve the relationship between a contest and the configuration context under which it was created?
- [ ] What configuration categories must remain interpretable (sides, structural position, group/stage context, discipline, format, scoring, encounter template position, provenance)?
- [ ] Is it acceptable for a later configuration edit to change how an earlier contest is interpreted?

### 4. Historical Interpretation Guarantees

**Question:** What must an authorized reader be able to reconstruct about the relationship among configuration, generated contest, schedule history, execution, and official record?

Decisions required:

- [ ] Must it always be possible to explain why a contest had its configured sides?
- [ ] Must it always be possible to explain what format/discipline governed a contest at execution time?
- [ ] Must it always be possible to explain what structural context (group, stage, parent encounter) a contest belonged to?
- [ ] Must schedule history remain interpretable against the contest that was actually assigned?
- [ ] Must execution history remain interpretable against the contest context in which it occurred?
- [ ] Must the official record retain the historical meaning of the contest and outcome it records?

### 5. Correction and Supersession Governance

**Question:** When a contest is corrected, cancelled, replaced, regenerated, or superseded, which historical references remain associated with the original contest and which concern a distinct contest?

Decisions required:

- [ ] What is the business distinction between correction and replacement?
- [ ] Does correction preserve the original contest with amended facts, or create a new contest?
- [ ] Does cancellation invalidate downstream references, or preserve them as historical?
- [ ] Does replacement/supersession create a distinct contest that coexists with the original?
- [ ] What happens to scheduling, execution, and official record references when a contest is superseded?
- [ ] Is destructive overwrite (deleting original facts) ever acceptable? Under what conditions?
- [ ] What provenance must a correction or supersession preserve (who, when, why)?

### 6. Cross-Domain Reference Responsibilities

**Question:** What guarantees must each boundary provide and respect when referencing a contest?

Decisions required:

- [ ] Must Scheduling preserve assignment history against the contest to which each assignment applied?
- [ ] Must Match Operations preserve execution facts against the contest context in which they were recorded?
- [ ] Must Competition Result Recording preserve the official record's relationship to the contest and confirmed outcome?
- [ ] Must a later configuration or contest change be prohibited from silently rewriting facts owned by another boundary?
- [ ] What cross-boundary guarantees must consumers respect when resolving a contest reference?
- [ ] Does Registration retain authority over referenced entrant, roster, eligibility, and lineup facts even when referenced by Competition?

---

## Responsibility Matrix (Proposed)

The following matrix preserves existing ownership and proposes reference responsibilities. Business approval is required.

| Concern | Policy responsibility |
|---------|----------------------|
| Competition Configuration | Preserve the authoritative meaning and provenance of configuration facts under its ownership. |
| Contest Generation / Competition | Preserve the fact that a particular contest was established and its relationship to the governing configuration context. |
| Registration | Remain authoritative for referenced entrant, roster, eligibility, and prospective lineup facts; references do not transfer those facts to Competition. |
| Scheduling | Preserve assignment history against the contest to which each assignment applied. |
| Match Operations | Preserve execution and actual-participation facts against the contest context in which they were recorded. |
| Competition Result Recording | Preserve the official record and its historically meaningful relationship to the contest and confirmed outcome. |
| Application layer | Coordinate authorized intents and resolve references according to approved policy without becoming a fact owner or workflow engine. |

---

## Policy Scenarios

The following scenarios must be tested against the approved policy. For each, record whether the same-contest versus distinct-contest question is resolved, what historical facts must remain interpretable, which owner remains authoritative, and whether the case is approved, prohibited, deferred, or a blocker.

| # | Scenario | Decision status |
|---|----------|-----------------|
| 1 | Configuration correction before any contest is generated | Awaiting decision |
| 2 | Configuration change after generation but before scheduling | Awaiting decision |
| 3 | Proposed contest change after assignment | Awaiting decision |
| 4 | Discrepancy discovered after execution | Awaiting decision |
| 5 | Change proposed after an official result exists | Awaiting decision |
| 6 | Cancellation or replacement with downstream history already present | Awaiting decision |
| 7 | Repeated generation from related configuration inputs | Awaiting decision |

---

## Explicit Non-Goals

This task does **not** define or design:

- identifier formats, UUID strategy, or technical key selection;
- database schema, tables, entities, fields, or persistence layouts;
- version tables, snapshot implementation, or temporal storage;
- event sourcing, copy-on-write, or any versioning mechanism;
- APIs, commands, events, payloads, service contracts, or endpoints;
- workflow engines, state machines, approval pipelines, or orchestration;
- implementation architecture, code changes, or framework choices;
- UI flows, operator screens, import behavior, or parser rules;
- draw, seeding, advancement, ranking, standings, or tie-break policy;
- scheduling algorithms, resource allocation, or dispatch behavior;
- match-execution, scoring, confirmation, or actual-participation rules;
- official-result creation or correction design beyond its reference guarantee;
- Registration redesign or transfer of ownership;
- analytics, reporting, notifications, or external-system synchronization;
- creation of an Identity, Lifecycle, Coordination, or Workflow domain.

---

## Exit Criteria

The task is complete when:

1. Business owners have approved enough continuity policy to distinguish an existing contest from a distinct replacement in every scenario required for the first implementation scope.
2. Required historical interpretation of governing configuration is stated without prescribing a mechanism.
3. Downstream reference guarantees preserve all established fact owners.
4. Unresolved cases are explicit blockers or bounded deferrals rather than guessed rules.
5. Implementation planners can proceed without inventing identity, mutation, or historical-reference policy.

---

## Deliverables

| Document | Purpose |
|----------|---------|
| `01-TASK.md` | Policy decision areas, questions, responsibility matrix, scenarios, non-goals, exit criteria |
| `02-EXECUTIVE-SUMMARY.md` | Business-readable summary of the policy gap and decisions required |
| `STATUS.md` | Task status and scope record |

---

*End of Task Definition*