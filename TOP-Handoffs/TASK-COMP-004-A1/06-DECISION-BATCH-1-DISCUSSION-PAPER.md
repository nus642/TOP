# TASK-COMP-004-A1 Decision Batch 1 — Business Discussion Paper

**Decision area:** Contest identity meaning

**Questions in this batch:** ID-1, ID-2, and ID-3 only

**Status:** Prepared for business discussion — all answers remain open

**Date:** 2026-08-02

---

## Purpose

This paper prepares business stakeholders to discuss what makes a contest remain the **same contest** when an authorized change occurs and what makes it a **distinct replacement**. It does not answer that question, express a preference, or approve a policy.

The discussion is deliberately about business meaning rather than technical representation. A contest may be referred to by systems in many ways, but none of those technical references should decide sporting or operational continuity by accident.

## Business Context

TOP already separates responsibility for related facts:

- **Competition Configuration** owns competition rules, structure, templates, and constraints.
- **Contest Generation** owns the fact that a contest was established.
- **Scheduling** owns placement and assignment facts.
- **Match Operations** owns execution and actual-participation facts.
- **Competition Result Recording** owns official records.
- **Registration** remains authoritative for referenced entrant, roster, eligibility, and prospective-lineup facts.

Decision Batch 1 does not change those responsibilities. It establishes the business meaning needed to interpret relationships among those facts when a contest or its context changes.

## Guardrails for the Discussion

Stakeholders should describe desired sporting, operational, and historical outcomes. The discussion should not select:

- identifiers or identifier formats;
- data models, schemas, fields, or keys;
- versioning or snapshot approaches;
- storage or persistence approaches;
- APIs, commands, events, or integration contracts.

The options below are discussion patterns, not proposals. They may be refined, combined, or rejected by the authorized decision-makers.

---

## ID-1 — Business Criteria for Continuity or Replacement

### The question

**What business criteria make an authorized change concern the same contest rather than a distinct replacement?**

### 1. Why this question exists

A contest can be corrected or changed after it is established. The change might concern its participants, its place in the competition, its timing, or another part of its governing context. Existing ownership boundaries say who owns each affected fact, but they do not say whether the business should continue to regard the contest as the original sporting obligation or as a new obligation replacing it.

Without an explicit business rule, continuity could be determined unintentionally by whichever record happens to be edited or whichever technical reference remains unchanged. Legacy capability to overwrite or delete information is evidence of past implementation behavior, not evidence of an approved future policy.

### 2. What business meaning it affects

The answer defines the boundary between:

- preserving the continuity of an existing contest while correcting or changing it; and
- ending, replacing, or superseding that contest with a distinct contest.

That boundary affects how stakeholders interpret the sporting obligation, its operational history, and its official significance. It also affects whether a schedule, an execution record, and an official result are understood as facts about the continuing contest or facts about an earlier contest that has since been replaced.

### 3. Which downstream domains depend on it

| Downstream domain | Dependency on the answer |
|---|---|
| **Contest Generation** | Must know whether an authorized change continues an established contest fact or establishes a distinct contest. |
| **Scheduling** | Must know which contest an existing assignment concerns and whether a replacement is a different scheduling subject. |
| **Match Operations** | Must know whether execution and actual-participation facts concern the continuing contest or an earlier contest. |
| **Competition Result Recording** | Must retain the official record's meaningful relationship to the contest and confirmed outcome to which it applied. |
| **Registration** | Remains authoritative for entrant and lineup facts; continuity policy must not turn a change in referenced Registration facts into an accidental transfer of ownership. |

Competition Configuration is the upstream owner of relevant structural and rule context rather than a downstream consumer, but its authorized changes are a principal trigger for this question.

### 4. What decisions become impossible until it is answered

Until ID-1 is answered, stakeholders cannot consistently decide:

- whether a correction preserves a contest or creates a replacement;
- when a configuration change may affect an already generated contest;
- what cancellation, replacement, and supersession mean for the original contest;
- whether regeneration continues prior contests or establishes distinct contests;
- how assignments, execution facts, and official records should relate to changed or replacement contests;
- what historical explanation must distinguish the original facts from later authorized changes; or
- what behavior downstream consumers must expect when they refer to a contest.

Implementation decisions about contest identity and mutation must therefore remain deferred; otherwise those decisions would supply a business answer implicitly.

### 5. Typical decision options

The following are common policy shapes for discussion. They do not prescribe technical treatment.

#### Option A — Broad continuity

Most authorized changes continue to concern the same contest. A distinct replacement is recognized only for a narrow set of business events that stakeholders explicitly classify as replacement.

#### Option B — Material-change threshold

Minor or corrective changes preserve continuity, while a change judged materially to alter the sporting obligation creates a distinct replacement. Stakeholders would need to define the materiality categories separately.

#### Option C — Milestone-sensitive continuity

Whether a change preserves continuity depends partly on how far the contest has progressed—for example, whether it has only been generated, has been assigned, has started, has completed, or has an official record.

#### Option D — Intent- and authority-sensitive continuity

Continuity depends on the declared business purpose and authorization of the action, such as correcting an error versus cancelling and commissioning a replacement. The same observable change could have different meaning when its authorized intent differs.

#### Option E — Narrow continuity

Only tightly bounded corrections preserve the same contest; most substantive authorized changes create a distinct replacement.

#### Option F — Combined criteria

Continuity is assessed through a stated combination of materiality, milestone, authorized intent, and the effect on the sporting obligation.

### 6. Trade-offs of the options

| Option | Benefits | Costs and risks |
|---|---|---|
| **A — Broad continuity** | Supports operational continuity and treats many adjustments as changes to one continuing obligation. | Can make one contest encompass significantly different meanings over time; requires care to keep earlier schedules, execution, and official facts understandable. |
| **B — Material-change threshold** | Distinguishes routine corrections from changes that alter the substance of competition. | “Material” can be disputed or applied inconsistently unless stakeholders provide clear business categories and edge-case treatment. |
| **C — Milestone-sensitive continuity** | Reflects that change has greater historical and operational consequences after assignment, execution, or official recording. | Similar changes may receive different identity treatment solely because of timing; milestone boundaries and exceptional cases may be contentious. |
| **D — Intent- and authority-sensitive continuity** | Aligns identity treatment with the business reason for acting and supports a distinction between correction and replacement. | Intent can be ambiguous, incorrectly declared, or disputed; governance expectations become important to consistent treatment. |
| **E — Narrow continuity** | Draws a strong distinction between original and substantively changed sporting obligations and can make historical narratives clearer. | More changes become replacements, increasing operational handling and the number of relationships stakeholders must follow. |
| **F — Combined criteria** | Can reflect the full business context and accommodate varied real-world cases. | Is harder to explain and apply consistently; interacting criteria can produce uncertainty unless priorities and exception boundaries are explicit. |

---

## ID-2 — Candidate Sources of Contest Identity Meaning

### The question

**Is contest identity determined by structural position, configured sides, temporal context, or some business-defined combination?**

### 1. Why this question exists

“The same contest” can mean different things to different stakeholders. One person may mean the contest occupying a particular place in a competition structure; another may mean a meeting between particular sides; another may mean the obligation intended for a particular round or period. Those meanings can diverge when sides change, a contest moves, or competition structure is corrected.

ID-1 asks for the boundary between continuity and replacement. ID-2 asks which business characteristics inform that boundary. These characteristics are meanings to approve, not fields or components of an identifier.

### 2. What business meaning it affects

The answer determines what stakeholders believe is being preserved when they say a contest continues:

- the **structural obligation**, such as a place in a group, stage, round, bracket, template, or parent encounter;
- the **meeting of configured sides**;
- the **temporal obligation**, such as the intended competition round or period; or
- a combination of characteristics and business context.

It therefore affects how the business explains participant substitutions, structural corrections, postponements, movement between rounds or stages, and other authorized changes without yet deciding the detailed policies for those situations.

### 3. Which downstream domains depend on it

| Downstream domain | Dependency on the answer |
|---|---|
| **Contest Generation** | Needs the approved business characteristics that distinguish continuation from creation of a distinct contest. |
| **Scheduling** | Needs to distinguish the contest's business temporal context from Scheduling-owned placement and assignment facts. |
| **Match Operations** | Needs stable business interpretation of the contest context against which execution is recorded, while preserving actual participation as its own fact. |
| **Competition Result Recording** | Needs to understand which contest the official record concerns when structural, side, or temporal context changes. |
| **Registration** | Remains authoritative for referenced entrants, eligibility, rosters, and prospective lineups when configured-side meaning contributes to contest identity. |

Competition Configuration supplies the owned structural, rule, and configured-side context whose business significance must be decided; referencing that context does not transfer ownership.

### 4. What decisions become impossible until it is answered

Until ID-2 is answered, stakeholders cannot consistently decide:

- whether changing one or both configured sides preserves the same contest;
- whether moving a contest within the competition structure preserves the same contest;
- whether a postponement or a change of intended round or period affects identity rather than only Scheduling facts;
- which changes are corrections and which are replacements;
- how repeated generation recognizes continuity at the business level;
- which governing context must remain interpretable after change; or

- whether one identity meaning can serve every included competition mode.

No technical key, matching rule, or data layout should be chosen to resolve these uncertainties.

### 5. Typical decision options

#### Option A — Structural position is primary

Continuity primarily follows the contest's business place in the competition structure, even if configured sides or timing change within approved limits.

#### Option B — Configured sides are primary

Continuity primarily follows the intended meeting of the configured sides, even if its structural placement or temporal context changes within approved limits.

#### Option C — Temporal context is primary

Continuity primarily follows the intended round, period, or other business time context, while distinguishing that context from the operational assignment owned by Scheduling.

#### Option D — Conjunctive combination

A contest continues only when all business characteristics designated as essential remain sufficiently consistent. A significant change to any essential characteristic indicates a distinct replacement.

#### Option E — Weighted or conditional combination

Several characteristics inform continuity, with their significance depending on business conditions such as competition mode, milestone, or authorized intent.

#### Option F — Business obligation stated independently

Stakeholders define the underlying sporting obligation in business terms and use structure, sides, and temporal context as evidence of that obligation rather than treating any one of them as automatically decisive.

### 6. Trade-offs of the options

| Option | Benefits | Costs and risks |
|---|---|---|
| **A — Structural position is primary** | Fits competitions where a slot in the structure exists before participants are known and can preserve continuity through side resolution or substitution. | Structural reorganization can force replacement even when stakeholders view the same sides as fulfilling the same obligation; may feel unnatural in pair-focused formats. |
| **B — Configured sides are primary** | Matches the intuitive view that a contest is the intended meeting of particular opponents. | Participant correction, qualification, substitution, or lineup resolution can create identity pressure even when the structural obligation is unchanged; must not confuse configured sides with actual participation. |
| **C — Temporal context is primary** | Reflects competitions organized around rounds or defined periods and can preserve the meaning of time-bound obligations. | Can blur business time context with a mutable operational assignment; postponements and rescheduling may become difficult to classify consistently. |
| **D — Conjunctive combination** | Creates a strong, explainable threshold and treats substantial divergence as replacement. | Can classify many ordinary changes as replacements and may be too rigid when one characteristic is provisional or not relevant in a mode. |
| **E — Weighted or conditional combination** | Accommodates context and recognizes that characteristics do not have equal significance in every situation. | Produces a more complex policy, with greater risk of inconsistent judgments and disputes about which condition governs. |
| **F — Business obligation stated independently** | Keeps focus on sporting purpose and avoids allowing one observable characteristic to dominate every case. | Requires stakeholders to articulate the obligation precisely enough for consistent decisions; may leave difficult edge cases without further criteria. |

---

## ID-3 — Uniform or Mode-Specific Identity Meaning

### The question

**Does contest identity meaning differ among round-robin, explicit-pairing, and team-encounter modes?**

### Clarification required before decision

ID-3 can be decided only for a bounded scope. Stakeholders must first confirm which of round-robin, explicit-pairing, and team-encounter modes are supported in the first implementation scope and whether they need one shared rule or mode-specific rules. Excluding a mode should be recorded as a bounded deferral with the condition that reopens the question, not treated as a decision for that mode.

### 1. Why this question exists

Different competition modes may express the sporting obligation differently. A round-robin contest may be understood through a round or group relationship; an explicit pairing may emphasize named or selected sides; a team encounter may include a parent encounter, template positions, prospective lineups, and constituent contests. A single identity meaning may create useful consistency, but it may also ignore differences that matter to the business.

### 2. What business meaning it affects

The answer determines whether “same contest” has:

- one meaning across every included competition mode;
- a shared core meaning with additional mode-specific criteria; or
- separately defined meanings for each included mode.

It affects how stakeholders compare continuity decisions across competitions, explain exceptions, and decide whether a change with similar surface characteristics has the same business effect in different modes.

### 3. Which downstream domains depend on it

| Downstream domain | Dependency on the answer |
|---|---|
| **Contest Generation** | Needs to know whether continuity policy is common across generation modes or varies with the business form of the contest. |
| **Scheduling** | Needs consistent interpretation of the contests it assigns, including parent and constituent relationships where team encounters are in scope. |
| **Match Operations** | Needs to relate execution and actual participation to the appropriate contest meaning for the mode. |
| **Competition Result Recording** | Needs official records to retain meaningful relationships to contests under the applicable mode policy. |
| **Registration** | Is particularly relevant where team encounters reference prospective lineup facts, while continuing to own those facts. |

Competition Configuration owns the different structures and templates used by these modes. ID-3 decides their significance for contest continuity; it does not redesign those structures.

### 4. What decisions become impossible until it is answered

For every included but unresolved mode, stakeholders cannot consistently decide:

- how ID-1 continuity criteria apply to that mode;
- which ID-2 characteristics carry business significance in that mode;
- whether correction, replacement, or regeneration has a common meaning across modes;
- how parent encounters and constituent contests affect continuity in team encounters;
- which historical context must be explainable for that mode; or

- whether downstream reference expectations may be stated uniformly.

ID-3 blocks only modes included in the first implementation scope. Properly excluded modes can remain deferred without supplying a guessed answer.

### 5. Typical decision options

#### Option A — One uniform meaning

Apply the same contest identity meaning and continuity criteria to all included competition modes.

#### Option B — Shared core with mode-specific criteria

Adopt a common business definition of continuity, then add bounded criteria for characteristics that carry special meaning in a particular mode.

#### Option C — Independent meaning by mode

Define contest identity separately for round-robin, explicit-pairing, and team-encounter modes included in scope.

#### Option D — Decide the first-scope modes and defer the rest

Approve a policy only for explicitly included modes. Record each excluded mode, why it is excluded, who must revisit it, and the event that reopens the decision.

### 6. Trade-offs of the options

| Option | Benefits | Costs and risks |
|---|---|---|
| **A — One uniform meaning** | Is easier for stakeholders to communicate and supports consistent cross-domain expectations. | May flatten meaningful sporting differences, especially parent/constituent or provisional-side concepts, and force exceptions into later policy. |
| **B — Shared core with mode-specific criteria** | Balances common language with recognition of genuine mode differences. | Requires a clear boundary between the shared core and mode additions; overlapping criteria may produce ambiguity. |
| **C — Independent meaning by mode** | Allows each mode to reflect its own sporting and operational reality directly. | Increases governance complexity and can yield inconsistent treatment of similar situations across modes. |
| **D — Decide first-scope modes and defer the rest** | Keeps the decision bounded and avoids inventing rules for modes not yet understood or required. | Leaves future implementation blocked for excluded modes and creates follow-up governance work; deferrals can become gaps if reopening conditions are not explicit. |

---

## Dependencies Among the Three Questions

These questions should be discussed in order:

1. **ID-1** establishes the business boundary between continuity and replacement.
2. **ID-2** identifies which business characteristics inform that boundary.
3. **ID-3** determines whether the resulting meaning applies uniformly or must be bounded by included competition mode.

The discussion may move back and forth where an example exposes ambiguity, but no answer should be inferred from a technical mechanism or from legacy overwrite behavior.

## Suggested Decision Record for the Business Session

For each question, the meeting record should capture only policy-level outcomes:

- decision status: approved, not approved, or bounded deferral;
- the approved business statement, if decided;
- included modes and scenarios;
- named exceptions or unresolved edge cases;
- the authorized decision-maker or approving body;
- the business rationale; and
- for a deferral, the responsible stakeholder and reopening condition.

The meeting record should not translate those outcomes into identifiers, schemas, versioning, storage, or APIs. Those choices remain deferred until the policy is approved.

---

*End of Decision Batch 1 Discussion Paper*
