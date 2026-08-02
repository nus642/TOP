# TASK-COMP-004-A1 ID-1 Decision Facilitation

**Decision question:** ID-1 — What business criteria make an authorized change concern the same contest rather than a distinct replacement?

**Status:** Facilitation artifact — no policy decision made

**Date:** 2026-08-02

**Sources:**
- `TOP-Handoffs/TASK-COMP-004-A1/01-TASK.md`
- `TOP-Handoffs/TASK-COMP-004-A1/03-DECISION-CLASSIFICATION.md`
- `TOP-Handoffs/TASK-COMP-004-A1/05-DECISION-SESSION-AGENDA.md`
- `TOP-Handoffs/TASK-COMP-004-A1/06-DECISION-BATCH-1-DISCUSSION-PAPER.md`
- `TOP-Handoffs/TASK-COMP-004-A1/07-ID-1-DECISION-ANALYSIS.md`

---

# Purpose

This document is a facilitation artifact for business decision discussion.

It converts the neutral ID-1 decision analysis into a meeting-ready structure that authorized stakeholders can use to discuss and decide the continuity question.

This document does **not**:

- make the ID-1 decision;
- recommend an option;
- select a policy direction;
- define implementation mechanisms;
- rank or prefer any policy direction;
- invent business answers or stakeholder positions.

All policy decisions remain open and require authorized business approval.

---

# Decision Question

**ID-1:**

What business criteria make an authorized change concern the same contest rather than a distinct replacement?

This question asks what the business means when it says that a contest continues despite an authorized change. It separates two outcomes:

- **Continuity:** the changed facts still concern the original sporting obligation.
- **Replacement:** the change establishes a different sporting obligation, even if it is related to the original.

The decision concerns the meaning of the contest, not merely whether an organizer is permitted to make a change. Authorization answers whether and by whom an action may be taken. ID-1 answers what that authorized action means for contest continuity.

---

# Decision Context

## Why this decision matters

An established contest may later be affected by a correction, participant change, structural change, postponement, change of format, cancellation, or renewed generation activity. Stakeholders can agree that an action is authorized and still disagree about its meaning:

- One view may treat it as an amendment to the original obligation.
- Another may treat it as the end of the original obligation and the creation of a replacement.
- Both views may describe the same visible change but attach different importance to the reason for the change, its material effect, or how much history already exists.

Without an explicit business rule, continuity could be determined unintentionally by whichever record happens to be edited or whichever technical reference remains unchanged. Legacy capability to overwrite or delete information is evidence of past implementation behavior, not evidence of an approved future policy.

## What the decision affects

The answer defines the boundary between:

- preserving the continuity of an existing contest while correcting or changing it; and
- ending, replacing, or superseding that contest with a distinct contest.

That boundary affects how stakeholders interpret the sporting obligation, its operational history, and its official significance. It also affects whether a schedule, an execution record, and an official result are understood as facts about the continuing contest or facts about an earlier contest that has since been replaced.

## Downstream dependencies

| Downstream domain | Dependency on the answer |
|---|---|
| Contest Generation | Must know whether an authorized change continues an established contest fact or establishes a distinct contest. |
| Scheduling | Must know which contest an existing assignment concerns and whether a replacement is a different scheduling subject. |
| Match Operations | Must know whether execution and actual-participation facts concern the continuing contest or an earlier contest. |
| Competition Result Recording | Must retain the official record's meaningful relationship to the contest and confirmed outcome to which it applied. |
| Registration | Remains authoritative for entrant and lineup facts; continuity policy must not turn a change in referenced Registration facts into an accidental transfer of ownership. |

## Decisions that remain impossible until ID-1 is answered

Until ID-1 is answered, stakeholders cannot consistently decide:

- whether a correction preserves a contest or creates a replacement;
- when a configuration change may affect an already generated contest;
- what cancellation, replacement, and supersession mean for the original contest;
- whether regeneration continues prior contests or establishes distinct contests;
- how assignments, execution facts, and official records should relate to changed or replacement contests;
- what historical explanation must distinguish the original facts from later authorized changes;
- what behavior downstream consumers must expect when they refer to a contest.

---

# Terminology Alignment

Before deciding, stakeholders should confirm shared understanding of the following terms. These terms are used differently in different contexts, and ambiguity can affect the decision.

| Term | Clarification needed |
|---|---|
| Contest | The prospective sporting obligation established by Contest Generation. Distinct from its operational placement and from what actually occurred. |
| Same contest | The business meaning of continuity: the changed facts still concern the original sporting obligation. |
| Distinct replacement | A different sporting obligation that is related to but not continuous with the original. |
| Correction | An authorized change that fixes an error or deficiency. Whether correction preserves continuity is part of the decision. |
| Change | An authorized modification to contest context. Whether change preserves continuity depends on the approved criteria. |
| Cancellation | An authorized action that ends a contest. Whether downstream references remain historical is a separate decision. |
| Replacement | An authorized action that establishes a distinct contest in place of the original. |
| Supersession | An authorized action that establishes a distinct contest that coexists historically with the original. |
| Regeneration | Repeated generation activity. Whether it continues prior contests or establishes distinct contests depends on the approved criteria. |
| Material change | A change that alters the sporting obligation in a significant way. The definition of "material" is part of the decision. |
| Essential characteristics | The business characteristics that define what makes a contest the contest it is. Which characteristics are essential is part of the decision. |
| Milestone | A point in the contest lifecycle: generation, assignment, start, completion, official recording. Whether milestones affect identity is part of the decision. |
| Authorized intent | The declared business purpose of an action. Whether intent affects identity is part of the decision. |
| Sporting obligation | The underlying competitive commitment that a contest represents. Stakeholders should describe this in plain business language. |

---

# Discussion Flow

The following sequence is designed for a meeting-friendly discussion.

## 1. Confirm scope

Before discussing outcomes, confirm:

- Who has authority to approve the continuity rule and its exceptions?
- Which competition modes must the first decision cover (round-robin, explicit pairing, team encounter)?
- Which change scenarios must be supported now, and which are explicitly prohibited or deferred?
- Are provisional contests recognized by the business, or are they solely a legacy operating practice?

## 2. Confirm terminology

Review the terminology table above. Confirm that stakeholders share a common understanding of:

- what "contest" means in this discussion;
- what "same contest" and "distinct replacement" mean;
- the difference between authorization and meaning;
- the distinction among correction, change, cancellation, replacement, supersession, and regeneration.

## 3. Review scenarios

Walk through the scenario table in the Scenario Discussion section below. For each scenario:

- Read the scenario and the competing interpretations.
- Ask stakeholders which interpretation reflects their business understanding.
- Record the proposed classification and the business reason that controls it.
- Do not resolve contradictions immediately; collect them for later comparison.

## 4. Compare possible policy directions

Review the policy directions in the Policy Direction Discussion section below. For each direction:

- Describe the direction in plain language.
- Test it against one or more scenarios from the table.
- Note where the direction produces clear answers and where it produces uncertainty.
- Do not rank or select a direction during this step.

## 5. Identify consequences

For each policy direction that stakeholders wish to explore further:

- Identify which downstream decisions would be affected.
- Identify which scenarios would produce different outcomes under different directions.
- Identify which historical facts must remain interpretable under each direction.
- Identify which fact owners remain authoritative under each direction.

## 6. Capture decision

If stakeholders reach a decision, record:

- the approved business statement;
- the included modes and scenarios;
- the decisive criteria and their rationale;
- named exceptions and unresolved edge cases;
- the approving authority and date;
- any bounded deferrals with owners and reopening conditions.

If stakeholders cannot reach a decision, record:

- the precise unresolved criterion or scenario;
- the responsible stakeholder for follow-up;
- the event that requires the question to be reopened.

---

# Scenario Discussion

The following scenarios are designed to expose differences among possible meanings. They are prompts for judgment, not implied classifications.

For each scenario included in scope, stakeholders should state the outcome and the decisive reason. A useful criterion must explain both clear cases and boundary cases; naming an outcome without its rationale will not make later decisions consistent.

| Scenario | Competing business interpretations | Judgment the session must surface |
|---|---|---|
| A spelling, label, or clearly descriptive error is corrected before assignment. | The obligation never changed; or any alteration to an established contest must be treated formally as replacement. | Which corrections are genuinely non-substantive, and why? |
| The wrong eligible side was selected and is corrected before assignment. | The original obligation was a structural place awaiting the correct side; or the intended meeting has changed and is therefore distinct. | Are configured sides essential to continuity, and does an acknowledged error differ from a later substitution? |
| A side withdraws and another side takes its place. | The competition obligation continues with a permitted substitute; or the meeting of opponents was essential and has been replaced. | Does withdrawal, qualification, or substitution change the underlying obligation? |
| A contest moves to another group, stage, round, or parent encounter. | The same meeting has merely been relocated; or structural position defines a different competitive purpose. | Which structural changes, if any, alter the substance of the contest? |
| The discipline, format, or scoring basis is corrected or changed before play. | The intended obligation continues under corrected terms; or the sporting test is materially different. | Which rule or format changes are material to continuity? |
| The intended round or competition period changes, without merely changing the operational date or court. | The same obligation is postponed or reclassified; or its temporal purpose was essential. | What business time context matters, separately from assignment? |
| A change is proposed after a court, time, or official has been assigned. | Assignment is incidental and continuity can remain; or existing operational commitments raise the threshold for preserving continuity. | Does assignment affect identity, restrict change, or only affect consequences? |
| A discrepancy is discovered after play has begun or completed. | The original contest can be corrected while preserving what occurred; or the played contest must remain distinct from any newly intended contest. | Can prospective meaning be changed after execution, and under what business rationale? |
| A change is proposed after an official record exists. | A bounded correction can still concern the same obligation; or official significance fixes the original meaning and any new obligation is distinct. | What, if anything, can preserve continuity after official recording? |
| Generation activity is repeated after configuration changes. | Unaffected obligations continue and only materially changed ones are replacements; or the renewed activity establishes a new set of obligations. | How should business intent and material effect distinguish continuation, addition, duplication, and replacement? |
| Only some contests from a group or team encounter are affected. | Continuity can be assessed contest by contest; or the collective change affects the meaning of the whole set or parent encounter. | What is the correct unit of business judgment? |
| A provisional team-encounter contest is later supplied with the intended lineup or richer detail. | The initial obligation has become more specific; or the later constituent contest replaces a provisional one. | Are provisional contests recognized business concepts, and what promise did the initial contest represent? |
| The same visible change is made once to correct organizer error and once because the organizer has changed the competition plan. | Different intent can justify different continuity outcomes; or observable business effect should control regardless of intent. | How much weight should declared purpose and authority carry? |

---

# Decision Questions

The following questions must be answered by authorized business owners. They are organized by theme.

## Scope and authority

1. Who has authority to approve the continuity rule and its exceptions?
2. Which competition modes and contest forms must the first decision cover?
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

# Policy Direction Discussion

The following are alternative policy shapes for discussion. They are not proposals, rankings, or recommendations. Some overlap because the business may choose a primary direction with additional safeguards.

Stakeholders may refine, combine, or reject these directions.

## Direction A — Broad continuity with explicit replacement events

Most authorized changes continue the existing contest. Only a bounded list of business events ends that continuity and creates a replacement.

**Potential benefits:** Supports operational flexibility; avoids treating routine adjustments as new obligations; can reflect a view that the competition owes one contest despite changing details.

**Potential risks:** One contest may acquire substantially different meanings; historical explanation becomes harder; the exception list may omit an important replacement event.

## Direction B — Material change to the sporting obligation

Continuity remains when a change does not materially alter the sporting obligation. A materially different obligation is a replacement. Business owners define what "material" means through named categories and examples.

**Potential benefits:** Focuses on competitive substance; distinguishes routine correction from genuine replacement; can be explained through business examples.

**Potential risks:** Materiality may be disputed; categories may overlap; different stakeholders may apply the threshold inconsistently.

## Direction C — Essential-characteristics test

Business owners designate characteristics that are essential to the contest, such as its structural purpose, intended sides, competition-time context, discipline, or format. Continuity depends on whether the essential characteristics remain sufficiently consistent.

**Potential benefits:** Makes the continuity rationale explicit; supports consistent comparison of common changes; exposes which aspects of a contest the business values.

**Potential risks:** Characteristics can conflict; some may be provisional or mode-dependent; a rigid test may misclassify exceptional but legitimate changes.

## Direction D — Milestone-sensitive test

The same proposed change may have a different continuity outcome depending on whether it occurs before assignment, after assignment, after play begins, after completion, or after official recording.

**Potential benefits:** Recognizes that changes have greater operational and historical consequences after assignment, play, or official recording; can protect settled expectations.

**Potential risks:** Similar changes can receive different identity treatment solely because of timing; a milestone may become a proxy for identity rather than a relevant business reason; exceptions may be contentious.

## Direction E — Authorized intent and purpose

The declared and approved business purpose is central. Correcting an error may preserve continuity, while cancelling an obligation and commissioning another may create a replacement even when the visible facts are similar.

**Potential benefits:** Distinguishes error correction from a new competitive decision; aligns continuity with the authorized business act; handles visually identical changes with different meanings.

**Potential risks:** Intent may be ambiguous, poorly expressed, or disputed; relying on labels may obscure the actual competitive effect; consistent authorization governance becomes critical.

## Direction F — Narrow continuity

Only tightly defined, non-substantive corrections preserve continuity. Most changes to the competitive substance establish a replacement.

**Potential benefits:** Creates a clear separation between original and substantively altered obligations; supports straightforward historical narratives; reduces the risk that prior facts appear to concern a later meaning.

**Potential risks:** More operational changes become replacements; legitimate corrections may be burdensome; stakeholders must manage more related contests and may seek informal workarounds.

## Direction G — Combined decision rule

Continuity is determined through an ordered combination of material effect, essential characteristics, milestone, and authorized purpose. The policy states which consideration prevails when they point to different outcomes.

**Potential benefits:** Can reflect real-world nuance; balances substance, timing, and purpose; can accommodate exceptions without making any single characteristic absolute.

**Potential risks:** More difficult to teach and apply; criteria may point in different directions; without an order of precedence it can reproduce rather than resolve ambiguity.

## Direction H — Bounded rules by competition mode or contest form

A shared core meaning is supplemented or replaced by bounded rules for different competition modes or contest forms where the sporting obligation is genuinely different.

**Potential benefits:** Respects genuine differences among round-robin obligations, explicit pairings, and parent or constituent team contests; avoids forcing artificial uniformity.

**Potential risks:** Increases governance complexity; similar changes may be treated differently across modes; boundaries between modes and shared principles must be clear.

---

# Decision Capture Placeholder

## Decision

TBD

## Rationale

TBD

## Affected boundaries

The following ownership boundaries are preserved regardless of the decision outcome:

| Boundary | Authoritative facts |
|---|---|
| Competition Configuration | Configuration facts: rules, structure, templates, constraints, and configured context |
| Contest Generation | Contest facts: the fact that a particular prospective contest was established |
| Registration | Entrant and eligibility facts: entrant, roster, eligibility, and prospective-lineup facts |
| Scheduling | Placement facts: placement and assignment facts |
| Match Operations | Execution facts: actual participation and execution facts |
| Competition Result Recording | Official records: the official record and its relationship to contest and confirmed outcome |

## Included modes and scenarios

TBD

## Decisive criteria

TBD

## Named exceptions

TBD

## Approving authority

TBD

## Approval date

TBD

## Bounded deferrals

TBD

---

# Established Invariants (Not Subject to Decision)

The following are already established by prior boundary work and constrain all policy options. They are recorded here for session reference, not for re-decision.

| Invariant | Source |
|---|---|
| Competition Configuration preserves authoritative meaning and provenance of its owned facts | Fact ownership boundary |
| Contest Generation preserves that a contest was established and its relationship to governing configuration | Fact ownership boundary |
| Scheduling history remains interpretable against the assigned contest | Scheduling boundary |
| Match Operations history remains interpretable against its contest context | Match Operations boundary |
| Official record retains historically meaningful relationship to contest and outcome | Competition Result Recording boundary |
| Referencing a fact does not transfer ownership | Cross-boundary principle |
| A change in one boundary does not silently rewrite another boundary's facts | Cross-boundary principle |
| Application layer coordinates without becoming a fact owner or workflow engine | Architecture principle |

---

# Explicit Exclusions

This facilitation document does not discuss or decide:

- identifiers, identifier formats, UUID strategy, or technical key selection;
- database schema, tables, entities, fields, or persistence layouts;
- version tables, snapshot implementation, or temporal storage;
- event sourcing, copy-on-write, or any versioning mechanism;
- APIs, commands, events, payloads, service contracts, or endpoints;
- workflow engines, state machines, approval pipelines, or orchestration;
- workflow states or state transitions;
- implementation architecture, code changes, or framework choices;
- UI flows, operator screens, import behavior, or parser rules;
- draw, seeding, advancement, ranking, standings, or tie-break policy;
- scheduling algorithms, resource allocation, or dispatch behavior;
- match-execution, scoring, confirmation, or actual-participation rules;
- official-result creation or correction design beyond its reference guarantee;
- creation of an Identity, Lifecycle, Coordination, or Workflow domain.

---

*End of ID-1 Decision Facilitation*