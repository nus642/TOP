# TASK-COMP-004-A1 ID-1 Domain Rule Confirmation

**Decision question:** ID-1 — What business meaning makes a contest the same contest?

**Status:** Preparation artifact — no domain rule confirmed

**Date:** 2026-08-02

**Sources:**
- `TOP-Handoffs/TASK-COMP-004-A1/01-TASK.md`
- `TOP-Handoffs/TASK-COMP-004-A1/03-DECISION-CLASSIFICATION.md`
- `TOP-Handoffs/TASK-COMP-004-A1/05-DECISION-SESSION-AGENDA.md`
- `TOP-Handoffs/TASK-COMP-004-A1/06-DECISION-BATCH-1-DISCUSSION-PAPER.md`
- `TOP-Handoffs/TASK-COMP-004-A1/07-ID-1-DECISION-ANALYSIS.md`
- `TOP-Handoffs/TASK-COMP-004-A1/07-ID-1-DECISION-FACILITATION.md`

---

# Purpose

This document prepares a domain rule confirmation artifact for contest identity meaning.

## ID terminology traceability

Earlier package framing placed “same contest versus replacement” criteria in ID-1 and described structural position, configured sides, temporal context, and other possible sources of identity meaning as ID-2. The current domain-rule-confirmation framing absorbs those identity-source questions into ID-1 because they define what contest identity means.

Under this refinement, ID-2 does not redefine identity. ID-2 applies the contest identity meaning confirmed through ID-1 to permitted change scenarios and asks how continuity is interpreted. This traceability statement changes the organization of the open questions; it does not answer ID-1 or ID-2.

It frames the boundary between external competition operations and TOP responsibility, states the existing invariants, presents the ID-1 confirmation questions, and provides scenario prompts for responsible business owners to confirm the domain rule.

This document does **not**:

- define contest identifiers;
- define UUIDs;
- define schemas;
- define database structures;
- define versioning mechanisms;
- define APIs;
- define workflows;
- define approval processes;
- answer ID-1;
- select a policy direction;
- invent business answers or stakeholder positions.

All domain rules remain open and require confirmation by responsible business owners.

---

# Scope

## What this confirmation covers

This confirmation covers the domain rule for ID-1:

**What business meaning makes a contest the same contest?**

The confirmation establishes the business meaning of contest continuity and replacement. It determines how TOP interprets and preserves the historical meaning of facts after external competition operations occur.

## What this confirmation does not cover

This confirmation does not cover:

- the technical representation of contest identity;
- the storage or persistence of contest facts;
- the mechanism by which changes are recorded;
- the design of any identifier, key, or reference;
- the structure of any database table or entity;
- the design of any API, command, or event;
- the design of any workflow, state machine, or approval process;
- the implementation of any versioning or snapshot mechanism.

## Included competition modes

The confirmation should state which competition modes are included in the first domain rule:

- Round-robin
- Explicit pairing
- Team encounter

Modes not included should be recorded as bounded deferrals with the condition that reopens the question.

---

# Existing Invariants

The following invariants are already established by prior boundary work and constrain all domain rule options. They are recorded here for confirmation reference, not for re-confirmation.

## Fact ownership invariants

| Boundary | Authoritative facts | Invariant |
|---|---|---|
| Competition Configuration | Configuration facts: rules, structure, templates, constraints, and configured context | Preserves authoritative meaning and provenance of its owned facts |
| Contest Generation | Contest facts: the fact that a particular prospective contest was established | Preserves that a contest was established and its relationship to governing configuration |
| Registration | Entrant and eligibility facts: entrant, roster, eligibility, and prospective-lineup facts | Remains authoritative for referenced entrant, roster, eligibility, and prospective-lineup facts |
| Scheduling | Placement facts: placement and assignment facts | History remains interpretable against the assigned contest |
| Match Operations | Execution facts: actual participation and execution facts | History remains interpretable against its contest context |
| Competition Result Recording | Official records: the official record and its relationship to contest and confirmed outcome | Retains historically meaningful relationship to contest and outcome |

## Cross-boundary invariants

| Invariant | Meaning |
|---|---|
| Referencing a fact does not transfer ownership | A domain may reference facts owned by another domain without becoming the owner of those facts |
| A change in one boundary does not silently rewrite another boundary's facts | Changes to configuration, scheduling, execution, or official facts do not automatically change facts owned by other boundaries |
| Application layer coordinates without becoming a fact owner or workflow engine | The application layer facilitates operations but does not own domain facts or enforce workflow states |

## Historical interpretability invariants

| Invariant | Meaning |
|---|---|
| Scheduling history remains interpretable | Assignments must remain understandable against the contest to which they applied |
| Match Operations history remains interpretable | Execution and actual participation must remain understandable against the contest context |
| Official record retains meaningful relationship | The official record must remain connected to the contest and confirmed outcome to which it applied |

---

# External Operation Boundary

## Distinction between external operations and TOP responsibility

External competition operations are actions that occur in the competition world. TOP does not control these operations. TOP interprets and preserves the historical meaning of facts after such operations occur.

| External operation | What happens externally | TOP responsibility |
|---|---|---|
| Participant change | A side is added, removed, substituted, or corrected in the competition | TOP preserves the meaning of the contest fact and its relationship to configuration, scheduling, execution, and official records |
| Schedule change | A contest is assigned, reassigned, postponed, or moved | TOP preserves the meaning of the contest fact and distinguishes placement facts from contest identity |
| Cancellation | A contest is cancelled or voided | TOP preserves the historical meaning of the cancelled contest and its downstream facts |
| Regeneration | Generation activity is repeated after configuration changes | TOP distinguishes continued obligations from additions, duplicates, and replacements |
| Result correction | An official record is corrected or amended | TOP preserves the meaningful relationship between the official record and the contest to which it applied |

## What TOP does not do

TOP does not:

- decide whether an external operation is permitted;
- decide who has authority to perform an external operation;
- enforce approval workflows for external operations;
- control how organizers run their competitions;
- determine the business purpose of an external operation.

## What TOP does

TOP does:

- interpret the meaning of contest facts after external operations occur;
- preserve the historical meaning of facts across boundaries;
- maintain the relationship between contest facts and their governing configuration;
- distinguish continuation from replacement according to the confirmed domain rule;
- ensure downstream facts remain interpretable against the contest to which they applied.

---

# ID-1 Confirmation Questions

The following questions must be confirmed by responsible business owners. They are organized by theme.

## Scope and authority

1. Who has responsibility to confirm the continuity domain rule and its exceptions?
2. Which competition modes and contest forms must the first confirmation cover?
3. Which change scenarios must be supported now, and which are explicitly prohibited or deferred?
4. Are provisional contests recognized by the business, or are they solely a legacy operating practice?

## Meaning of the sporting obligation

5. In business terms, what obligation is preserved when the business says "this is still the same contest"?
6. Which characteristics are essential evidence of that obligation: structural purpose, configured sides, competition-time context, discipline, format, parent encounter, or something else?
7. Can one essential characteristic change while continuity remains? If so, which characteristic, in which circumstances, and why?
8. What minimum change always establishes a distinct replacement?
9. Does the answer differ by competition mode, by parent versus constituent contest, or by provisional versus fully specified contest?

## Purpose, materiality, and timing

10. Should correction of an acknowledged error be treated differently from an organizer's later change of plan when the visible effect is the same?
11. Is authorized intent decisive, supporting evidence, or irrelevant when judging continuity?
12. What does "material change" mean in sporting and operational terms, and which examples sit clearly on each side of the boundary?
13. Does assignment, start of play, completion, or official recording change the identity judgment, merely restrict what action is permitted, or only change the consequences?
14. Can any change after actual play or official recording preserve continuity? If so, what is the bounded business rationale?

## Interaction with historical facts

15. When a contest continues, what earlier meaning must remain explainable after the change?
16. When a replacement is established, what must remain true and understandable about the original contest and its assignments, execution, and official significance?
17. If configured intent conflicts with actual participation or the official record, which question is an identity question and which requires separate correction or dispute governance?
18. Should continuity be assessed separately for each contest affected by a group or team-encounter change, or can a collective change determine the outcome?

## Consistency and exceptions

19. Which scenario examples are authoritative tests of the chosen rule?
20. When multiple criteria point to different outcomes, which criterion prevails and who resolves an exception?
21. What terminology will the business use consistently for correction, change, cancellation, voiding, replacement, and supersession?
22. What bounded cases remain unresolved, who owns each follow-up decision, and what event requires the question to be reopened?

---

# Scenario Prompts

The following scenarios are prompts for domain rule confirmation. They are not implied classifications. For each scenario, responsible business owners should state the outcome and the decisive reason.

## Scenario 1: Spelling or label correction before assignment

**External operation:** A spelling, label, or clearly descriptive error is corrected before assignment.

**Competing interpretations:**
- The obligation never changed; or
- Any alteration to an established contest must be treated formally as replacement.

**Confirmation prompt:** Which corrections are genuinely non-substantive, and why?

## Scenario 2: Wrong eligible side corrected before assignment

**External operation:** The wrong eligible side was selected and is corrected before assignment.

**Competing interpretations:**
- The original obligation was a structural place awaiting the correct side; or
- The intended meeting has changed and is therefore distinct.

**Confirmation prompt:** Are configured sides essential to continuity, and does an acknowledged error differ from a later substitution?

## Scenario 3: Side withdrawal and substitution

**External operation:** A side withdraws and another side takes its place.

**Competing interpretations:**
- The competition obligation continues with a permitted substitute; or
- The meeting of opponents was essential and has been replaced.

**Confirmation prompt:** Does withdrawal, qualification, or substitution change the underlying obligation?

## Scenario 4: Contest moves to another group, stage, round, or parent encounter

**External operation:** A contest moves to another group, stage, round, or parent encounter.

**Competing interpretations:**
- The same meeting has merely been relocated; or
- Structural position defines a different competitive purpose.

**Confirmation prompt:** Which structural changes, if any, alter the substance of the contest?

## Scenario 5: Discipline, format, or scoring basis corrected or changed before play

**External operation:** The discipline, format, or scoring basis is corrected or changed before play.

**Competing interpretations:**
- The intended obligation continues under corrected terms; or
- The sporting test is materially different.

**Confirmation prompt:** Which rule or format changes are material to continuity?

## Scenario 6: Intended round or competition period changes

**External operation:** The intended round or competition period changes, without merely changing the operational date or court.

**Competing interpretations:**
- The same obligation is postponed or reclassified; or
- Its temporal purpose was essential.

**Confirmation prompt:** What business time context matters, separately from assignment?

## Scenario 7: Change proposed after assignment

**External operation:** A change is proposed after a court, time, or official has been assigned.

**Competing interpretations:**
- Assignment is incidental and continuity can remain; or
- Existing operational commitments raise the threshold for preserving continuity.

**Confirmation prompt:** Does assignment affect identity, restrict change, or only affect consequences?

## Scenario 8: Discrepancy discovered after play has begun or completed

**External operation:** A discrepancy is discovered after play has begun or completed.

**Competing interpretations:**
- The original contest can be corrected while preserving what occurred; or
- The played contest must remain distinct from any newly intended contest.

**Confirmation prompt:** Can prospective meaning be changed after execution, and under what business rationale?

## Scenario 9: Change proposed after official record exists

**External operation:** A change is proposed after an official record exists.

**Competing interpretations:**
- A bounded correction can still concern the same obligation; or
- Official significance fixes the original meaning and any new obligation is distinct.

**Confirmation prompt:** What, if anything, can preserve continuity after official recording?

## Scenario 10: Generation activity repeated after configuration changes

**External operation:** Generation activity is repeated after configuration changes.

**Competing interpretations:**
- Unaffected obligations continue and only materially changed ones are replacements; or
- The renewed activity establishes a new set of obligations.

**Confirmation prompt:** How should business intent and material effect distinguish continuation, addition, duplication, and replacement?

## Scenario 11: Only some contests from a group or team encounter are affected

**External operation:** Only some contests from a group or team encounter are affected.

**Competing interpretations:**
- Continuity can be assessed contest by contest; or
- The collective change affects the meaning of the whole set or parent encounter.

**Confirmation prompt:** What is the correct unit of business judgment?

## Scenario 12: Provisional team-encounter contest later supplied with intended lineup

**External operation:** A provisional team-encounter contest is later supplied with the intended lineup or richer detail.

**Competing interpretations:**
- The initial obligation has become more specific; or
- The later constituent contest replaces a provisional one.

**Confirmation prompt:** Are provisional contests recognized business concepts, and what promise did the initial contest represent?

## Scenario 13: Same visible change made for different reasons

**External operation:** The same visible change is made once to correct organizer error and once because the organizer has changed the competition plan.

**Competing interpretations:**
- Different intent can justify different continuity outcomes; or
- Observable business effect should control regardless of intent.

**Confirmation prompt:** How much weight should declared purpose and authority carry?

---

# Confirmation Output Placeholder

## Confirmed domain rule

TBD

## Rationale

TBD

## Included competition modes

TBD

## Included scenarios

TBD

## Decisive criteria

TBD

## Named exceptions

TBD

## Bounded deferrals

TBD

## Confirming authority

TBD

## Confirmation date

TBD

## Affected boundaries

The following ownership boundaries are preserved regardless of the confirmation outcome:

| Boundary | Authoritative facts |
|---|---|
| Competition Configuration | Configuration facts: rules, structure, templates, constraints, and configured context |
| Contest Generation | Contest facts: the fact that a particular prospective contest was established |
| Registration | Entrant and eligibility facts: entrant, roster, eligibility, and prospective-lineup facts |
| Scheduling | Placement facts: placement and assignment facts |
| Match Operations | Execution facts: actual participation and execution facts |
| Competition Result Recording | Official records: the official record and its relationship to contest and confirmed outcome |

---

# Unresolved Items

The following items remain unresolved until the domain rule is confirmed:

| Item | Description | Dependency |
|---|---|---|
| ID-1 domain rule | The business meaning of contest identity, including the original identity-source questions | Requires confirmation by responsible business owners |
| ID-2 domain rule | Continuity interpretation when permitted changes occur | Applies the confirmed ID-1 meaning and does not redefine identity |
| ID-3 domain rule | Uniform or mode-specific identity meaning | Depends on the applicable ID-1 confirmation; its relationship to ID-2 remains a scoped confirmation question |
| CT-1 through CT-3 | Effect of configuration changes | Depends on ID-1 confirmation |
| CT-4 and CT-5 | Replacement threshold and change classification | Depends on ID-1 confirmation |
| CT-6 | Effective scope and permitted change | Depends on ID-1 confirmation |
| GC-3 and GC-4 | Historical interpretation guarantees | Depends on ID-1 confirmation |
| HI-1, HI-2, and HI-6 | Historical interpretation details | Depends on ID-1 confirmation |
| CS-1 through CS-7 and CS-9 | Correction, cancellation, and supersession governance | Depends on ID-1 confirmation |
| CS-10 | Partial change | Depends on ID-1 confirmation |
| RG-1 through RG-3 | Repeated generation | Depends on ID-1 confirmation |
| XR-4, XR-6, and XR-7 | Cross-boundary behavior and conflict handling | Depends on ID-1 confirmation |

---

# Explicit Exclusions

This confirmation artifact does not discuss or decide:

- identifiers, identifier formats, UUID strategy, or technical key selection;
- database schema, tables, entities, fields, or persistence layouts;
- version tables, snapshot implementation, or temporal storage;
- event sourcing, copy-on-write, or any versioning mechanism;
- APIs, commands, events, payloads, service contracts, or endpoints;
- workflow engines, state machines, approval pipelines, or orchestration;
- workflow states or state transitions;
- approval processes or organizational authorization workflows;
- implementation architecture, code changes, or framework choices;
- UI flows, operator screens, import behavior, or parser rules;
- draw, seeding, advancement, ranking, standings, or tie-break policy;
- scheduling algorithms, resource allocation, or dispatch behavior;
- match-execution, scoring, confirmation, or actual-participation rules;
- official-result creation or correction design beyond its reference guarantee;
- creation of an Identity, Lifecycle, Coordination, or Workflow domain.

---

*End of ID-1 Domain Rule Confirmation*
