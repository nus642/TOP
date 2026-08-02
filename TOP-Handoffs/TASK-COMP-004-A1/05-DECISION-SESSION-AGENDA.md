# TASK-COMP-004-A1 Decision Session Agenda

**Task:** Contest Identity / Configuration Reference Policy

**Status:** Preparation artifact — no decisions made

**Created:** 2026-08-02

**Sources:**
- `TOP-Handoffs/TASK-COMP-004-A1/01-TASK.md`
- `TOP-Handoffs/TASK-COMP-004-A1/02-EXECUTIVE-SUMMARY.md`
- `TOP-Handoffs/TASK-COMP-004-A1/03-DECISION-CLASSIFICATION.md`
- `TOP-Handoffs/TASK-COMP-004-A1-ARCHITECTURE-RECOMMENDATION.md`

---

## Purpose

This document prepares a structured policy discussion for TASK-COMP-004-A1. It organizes the open business questions into a session sequence so that authorized stakeholders can make informed decisions.

This document does **not**:

- make policy decisions;
- select solutions or preferred options;
- define implementation mechanisms;
- invent business answers or stakeholder positions;
- produce final policy statements.

All decisions remain open and require domain-rule confirmation by authorized business owners.

---

## Decision Session Structure

Sessions follow the recommended decision order from `03-DECISION-CLASSIFICATION.md`. Each session builds on the previous one to minimize circular decisions and prevent implementation mechanisms from becoming accidental policy.

---

### Session 1: Decision Framing and Scope

**Decision area:** Establish who decides, what is in scope, and what is explicitly deferred.

**Core questions:**

- Who are the authorized business decision-makers for this policy?
- Which competition modes are included in the first implementation scope (round-robin, explicit pairing, team encounter)?
- Which of the seven policy scenarios from `01-TASK.md` must be resolved for the first scope?
- Are placeholder contests a future business concept or only a legacy implementation artifact?
- Is there a legal, audit, or retention authority that constrains decisions?

**Why the decision matters:**

Without a bounded scope and identified decision authority, later policy answers may be challenged as unauthorized or may accidentally cover modes and scenarios not yet understood. An unbounded "later" is not a deferral.

**Affected domain boundaries:**

All boundaries are affected by scope framing because it determines which questions must be answered before the first implementation slice.

**Questions that must remain policy-level:**

- The identity of decision-makers and their authority.
- The competition modes and scenarios included or excluded.
- The conditions that reopen deferred questions.

---

### Session 2: Contest Identity Meaning

**Decision area:** Define what makes a contest "the same contest" versus a distinct replacement.

**Core questions:**

- What business criteria make an authorized change concern the same contest rather than a distinct replacement? (ID-1)
- Is contest identity determined by structural position, configured sides, temporal context, or a business-defined combination? (ID-2)
- Does contest identity meaning differ among round-robin, explicit-pairing, and team-encounter modes? (ID-3 — requires Session 1 clarification)

**Why the decision matters:**

This is the central continuity policy. Every downstream decision about correction, replacement, regeneration, and historical reference depends on a shared meaning of "same contest." A technical key or identifier must not answer this question.

**Affected domain boundaries:**

| Boundary | Relevance |
|----------|-----------|
| Competition Configuration | Defines the structural context and rules that may determine identity criteria |
| Contest Generation | Creates the contest fact whose identity is being defined |
| Scheduling | References contests; identity changes affect assignment meaning |
| Match Operations | References contest context; identity changes affect execution interpretation |
| Competition Result Recording | References contest in official records; identity changes affect record meaning |

**Questions that must remain policy-level:**

- The business meaning of continuity versus replacement.
- Which criteria (position, sides, time, combination) define identity.
- Whether identity rules are uniform or mode-specific.

---

### Session 3: Contest Continuity Across Configuration Changes

**Decision area:** Determine what happens to generated contests when configuration changes at various lifecycle points.

**Core questions:**

- Which configuration changes affect already generated contests, future contests, or both before scheduling? (CT-1)
- Which configuration changes affect already generated contests, future contests, or both after scheduling? (CT-2)
- Which configuration changes affect already generated contests, future contests, or both after execution or official recording? (CT-3)
- At what business point must a proposed change create a distinct contest instead of modifying the existing one? (CT-4)
- Which kinds of configuration change count as a correction, a prospective change, or a replacement? (CT-5)
- When does a configuration revision become effective, and what changes are permitted after each milestone? (CT-6)

**Why the decision matters:**

Without this policy, a configuration edit could silently change the meaning of already-scheduled, already-executed, or already-recorded contests. The business must decide the effective scope of change at each milestone rather than discovering it from implementation behavior.

**Affected domain boundaries:**

| Boundary | Relevance |
|----------|-----------|
| Competition Configuration | Owns the configuration facts that change |
| Contest Generation | Owns the generated contest facts that may be affected |
| Scheduling | Owns assignment facts that reference the contest |
| Match Operations | Owns execution facts that reference the contest context |
| Competition Result Recording | Owns official records that reference the contest |

**Questions that must remain policy-level:**

- The effective scope of a configuration change at each lifecycle milestone.
- The threshold at which change becomes replacement.
- The classification of change types (correction, prospective change, replacement).
- The permitted changes after generation, assignment, execution, and official recording.

---

### Session 4: Historical Interpretation Guarantees

**Decision area:** Define what must remain reconstructable about the relationship among configuration, contest, schedule, execution, and official record.

**Core questions:**

- Which governing categories must remain interpretable: sides, structural position, group/stage, discipline, format, scoring, template position, parent encounter, and provenance? (GC-3)
- May a later configuration edit change how an earlier contest is interpreted? (GC-4)
- Must an authorized reader be able to explain why a contest had its configured sides and structural context? (HI-1)
- Must an authorized reader be able to explain which discipline, format, scoring rules, or template position governed at execution time? (HI-2)
- What minimum provenance must explain why a contest existed and which rules, sides, or template governed it? (HI-6)

**Why the decision matters:**

These questions define the audit and reconstructability guarantees the business requires. Without them, historical facts may exist but no longer be reliably explainable after a correction or replacement. The answer determines what "history" means in the system.

**Affected domain boundaries:**

| Boundary | Relevance |
|----------|-----------|
| Competition Configuration | Must preserve authoritative meaning and provenance of configuration facts (GC-1, GC-2 — established invariants) |
| Contest Generation | Must preserve the relationship between a contest and its governing configuration context |
| Scheduling | Assignment history must remain interpretable against the assigned contest (HI-3 — established invariant) |
| Match Operations | Execution history must remain interpretable against the contest context (HI-4 — established invariant) |
| Competition Result Recording | Official record must retain historically meaningful relationship to contest and outcome (HI-5 — established invariant) |

**Questions that must remain policy-level:**

- Which categories of governing context are required for historical interpretation.
- Whether later edits may change historical interpretation.
- What provenance evidence is required.
- The reconstructability guarantees for authorized readers.

---

### Session 5: Correction and Supersession Governance

**Decision area:** Define the business meaning and consequences of correction, cancellation, replacement, supersession, and regeneration.

**Core questions:**

- What is the business distinction among correction, change, cancellation, voiding, replacement, and supersession? (CS-1)
- Does a correction preserve the same contest, create a distinct contest, or depend on a business-defined class of correction? (CS-2)
- Must cancellation preserve downstream references as historical, or may references be invalidated? (CS-3)
- Does replacement or supersession create a distinct contest that coexists historically with the original? (CS-4)
- What happens to Scheduling, Match Operations, and official-record references when a contest is superseded? (CS-5)
- Is destructive overwrite or deletion of original facts ever acceptable, and under what conditions? (CS-6)
- What provenance must a correction or supersession preserve? (CS-7)
- May a contest be superseded after assignment, start, outcome confirmation, or official result creation? (CS-9)
- Is regeneration a new generation action, a correction of a prior generation, or dependent on intent? (RG-1)
- Must regeneration retain a meaningful relationship to prior generation and a reason? (RG-2)
- Can regeneration occur after Scheduling, Match Operations, or Result Recording facts exist? (RG-3)

**Why the decision matters:**

Legacy behavior permitted destructive overwrite, but technical capability is not confirmation of a domain rule. Without explicit governance, replacement may erase the distinction between original and corrected facts, orphan downstream references, or silently rewrite history. Each domain boundary must know what it may and must preserve when another boundary's facts change.

**Affected domain boundaries:**

| Boundary | Relevance |
|----------|-----------|
| Competition Configuration | May initiate corrections or changes to configuration |
| Contest Generation | Owns the contest facts subject to correction, cancellation, or supersession |
| Scheduling | Holds assignment references that may be affected by contest changes |
| Match Operations | Holds execution references that may be affected by contest changes |
| Competition Result Recording | Holds official records that must retain historical meaning |
| Registration | Holds entrant and lineup facts referenced by contests; ownership not transferred |

**Questions that must remain policy-level:**

- The definitions and distinctions among correction, cancellation, replacement, supersession, and regeneration.
- Whether destructive operations are ever permitted and under what conditions.
- What provenance evidence is required for each operation type.
- The permissions and prohibitions at each lifecycle milestone.
- The relationship between regenerated contests and prior generation.

---

### Session 6: Cross-Domain Reference Responsibilities

**Decision area:** Define the behavioral guarantees each boundary must honor when referencing a contest, and how conflicts are handled.

**Core questions:**

- What behavioral guarantees must a consumer honor when resolving a contest reference? (XR-4)
- What validation or business approval is required when a correction conflicts with assignment, execution, confirmed outcome, or official record facts? (XR-6)
- How should disputes among configured context, generated-contest context, actual execution, and the official record be resolved? (XR-7 — requires clarification)

**Why the decision matters:**

Each boundary owns its own facts and references contests independently. Without a confirmed domain-rule contract, Scheduling could resolve a contest reference against one meaning while Match Operations resolves it against another. The overall history could contradict itself even though each record appears locally valid.

**Affected domain boundaries:**

| Boundary | Relevance |
|----------|-----------|
| Competition Configuration | References do not transfer ownership (XR-1 — established invariant) |
| Contest Generation | References do not transfer ownership (XR-1 — established invariant) |
| Scheduling | Must preserve assignment history against the assigned contest |
| Match Operations | Must preserve execution facts against the contest context |
| Competition Result Recording | Must preserve official record relationship to contest and outcome |
| Registration | Remains authoritative for referenced entrant, roster, eligibility, and lineup facts |
| Application layer | Coordinates without becoming a fact owner or workflow engine (XR-3 — established invariant) |

**Questions that must remain policy-level:**

- The behavioral contract for consumers resolving contest references.
- The governance required when corrections conflict with downstream facts.
- The dispute resolution approach (if disputes are in scope).

---

### Session 7: Deferred Implementation Topics

**Decision area:** Confirm what is explicitly excluded from policy decisions and reserved for later implementation planning.

**Core questions:**

- Confirm that the following topics are not decided in this policy process:
  - Identifier formats, UUID strategy, or technical key selection (ID-4)
  - Database schema, tables, entities, fields, or persistence layouts
  - Version tables, snapshot implementation, or temporal storage (HI-8)
  - Event sourcing, copy-on-write, or any versioning mechanism
  - APIs, commands, events, payloads, service contracts, or endpoints
  - Workflow engines, state machines, approval pipelines, or orchestration
  - Implementation architecture, code changes, or framework choices
  - Matching algorithms for regeneration (RG-5)
- Confirm that implementation planning begins only after prerequisite A-class decisions and B-class invariants are recorded.
- Confirm that no implementation mechanism may become accidental policy.

**Why the decision matters:**

Implementation choices embody answers to policy questions. If technical design proceeds before domain-rule confirmation, choices about keys, mutable references, copied context, or destructive replacement become accidental business rules that are expensive to reverse. Explicitly deferring these topics protects the domain-rule confirmation process.

**Affected domain boundaries:**

All boundaries are affected because implementation planning will translate confirmed domain rules into technical design for each.

**Questions that must remain policy-level:**

- None. These topics are explicitly implementation-level and must not be decided during policy sessions.

---

## Established Invariants (Not Subject to Decision)

The following are already established by prior boundary work and constrain all policy options. They are recorded here for session reference, not for re-decision.

| ID | Invariant | Source |
|----|-----------|--------|
| GC-1 | Competition Configuration preserves authoritative meaning and provenance of its owned facts | Fact ownership boundary |
| GC-2 | Contest Generation preserves that a contest was established and its relationship to governing configuration | Fact ownership boundary |
| HI-3 | Scheduling history remains interpretable against the assigned contest | Scheduling boundary |
| HI-4 | Match Operations history remains interpretable against its contest context | Match Operations boundary |
| HI-5 | Official record retains historically meaningful relationship to contest and outcome | Competition Result Recording boundary |
| XR-1 | Referencing a fact does not transfer ownership | Cross-boundary principle |
| XR-2 | A change in one boundary does not silently rewrite another boundary's facts | Cross-boundary principle |
| XR-3 | Application layer coordinates without becoming a fact owner or workflow engine | Architecture principle |

---

## Ownership Boundaries Preserved

| Boundary | Authoritative facts |
|----------|-------------------|
| Competition Configuration | Rules, structure, templates, constraints, and configuration facts |
| Contest Generation | Generated contest facts |
| Scheduling | Placement and assignment facts |
| Match Operations | Execution facts |
| Competition Result Recording | Official records |
| Registration | Entrant, roster, eligibility, and prospective lineup facts |

---

## Explicit Exclusions

This agenda does not discuss or decide:

- identifier design or UUID strategy;
- database schema or persistence layouts;
- version storage mechanisms, snapshots, or event sourcing;
- APIs, commands, events, or service contracts;
- workflow engines, state machines, or orchestration;
- implementation architecture or code changes;
- UI flows, import behavior, or parser rules;
- draw, seeding, advancement, ranking, or tie-break policy;
- scheduling algorithms or resource allocation;
- match-execution, scoring, or confirmation rules;
- official-result creation or correction design beyond reference guarantees;
- creation of an Identity, Lifecycle, Coordination, or Workflow domain.

---

## Session Output Expectation

For each decision area, the session should produce:

1. The confirmed domain-rule outcome or explicit prohibition.
2. The modes and scenarios to which it applies.
3. The historical facts that must remain interpretable.
4. The established fact owners that remain authoritative.
5. The named decision authority and confirmation date.
6. Any bounded deferral and its reopening condition.

No identifier format, schema, snapshot strategy, event model, API, workflow, or storage mechanism should be recorded as part of a policy answer.

---

*End of Decision Session Agenda*