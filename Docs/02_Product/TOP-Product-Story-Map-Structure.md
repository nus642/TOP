# TOP Product Story Map Structure

Version: 1.0

Status: Active

Last Updated: 2026-08-07

Author:
TOP Product Team

---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-07 | Initial structure and governance model for organizing future TOP Product Stories |

---

# Purpose

This document defines the structure and governance model for organizing future TOP Product Stories. It makes the relationship between established actors, their Business Outcome Goals, and governed Product Story records consistent, reviewable, and maintainable.

This is a story-map **structure**, not a populated story map. It creates no Product Stories and makes no product commitment.

# Position and Authority

The structure occupies the Product Story position in the TOP Product Canon:

```text
Operational Capability
        ↓
Actor
        ↓
Business Outcome Goal
        ↓
Product Story
        ↓
Operational Workflow
        ↓
Product Scope
```

This document governs how valid Product Stories are organized after, and only after, they have been defined under the Product Story Definition Rules. It neither changes those definition rules nor extends the Actor and Goal Model.

The authoritative inputs are:

- `TOP-Product-Layer-Definition.md` for Product Layer responsibilities, translation principles, and boundaries;
- `TOP-Product-Actor-and-Goal-Model.md` for the controlled actor set, goal ownership, outcome evidence, and upstream traces; and
- `TOP-Product-Story-Definition-Rules.md` for story eligibility, required records, validation, lifecycle, and change control.

Where this structure conflicts with an authoritative input, the authoritative input prevails. The conflict must be returned to the appropriate Product or Business Architecture authority rather than resolved inside the map.

# Structural Model

## Canonical hierarchy

Every story-map entry has exactly one canonical location:

```text
Product Story Map
├── Actor
│   ├── Business Outcome Goal
│   │   ├── Story reference
│   │   └── Story reference
│   └── Business Outcome Goal
│       └── Story reference
└── Actor
    └── Business Outcome Goal
        └── Story reference
```

The hierarchy has the following meaning:

| Level | Structural purpose | Governing rule |
|-------|--------------------|----------------|
| Product Story Map | Collection boundary for governed future stories | Does not represent an initiative, release, workflow, or approved Product Scope. |
| Actor | First-level partition by the established primary actor | Uses the exact controlled actor identity from the Actor and Goal Model. No persona or substitute actor may be introduced. |
| Business Outcome Goal | Second-level partition by a goal owned by that actor | Uses the exact goal ID and meaning from the Actor and Goal Model. Every established goal remains visible even when it has no stories. |
| Story reference | Membership reference to one governed story record | Resolves to one stable Story ID and does not duplicate or replace the required story record. |

## Canonical placement rule

A Product Story is placed under the one actor named in its `Actor` field and the one goal named in its `Business Outcome Goal` field. The goal must belong to that actor in the Actor and Goal Model.

```text
Story.Actor = map Actor
Story.Business Outcome Goal = map Goal
map Goal belongs to map Actor
```

A story must not appear canonically under multiple actors or goals. If a candidate contains distinct needs belonging to different actors or goals, it is returned for atomicity review under the Product Story Definition Rules. If other actors, goals, capabilities, or objects are relevant to the same indivisible need, those relationships remain traceability metadata; they do not create additional canonical placements.

## Complete hierarchy rule

The map must instantiate every active actor and every active goal in the Actor and Goal Model, including empty goal groups. An empty group is recorded with a coverage disposition rather than removed, populated speculatively, or interpreted as approved exclusion.

The hierarchy is regenerated or reviewed whenever the controlled actor or goal model changes. A structural update must not silently rename, combine, split, add, or remove actors or goals.

# Story Grouping Principles

## Primary grouping

Actor → Goal is the only canonical grouping scheme. It answers two governing questions without implying a solution:

1. **Whose established need is represented?** — the primary actor.
2. **Which established outcome does the need contribute to?** — the Business Outcome Goal.

Canonical order follows the order of actors and goals in the current Actor and Goal Model unless a separate presentation convention is approved. Reordering does not change meaning, priority, or scope.

## Permitted secondary views

Reviewers may derive non-canonical views from story record metadata for analysis. Permitted views include:

- primary or supporting Operational Capability;
- Core Business Object context;
- controlled story lifecycle status;
- boundary or provenance concern; and
- source reference.

These are filters, indexes, or reports only. They must use the same Story IDs, must resolve to the canonical Actor → Goal placement, and must not become alternative ownership hierarchies.

## Prohibited grouping semantics

Neither canonical groups nor secondary views may be used to define or imply:

- features, packages, epics, modules, components, or applications;
- screens, navigation, controls, or other UI structures;
- workflow stages, activity order, handoffs, paths, or journeys;
- releases, phases, milestones, increments, priorities, estimates, or delivery sequence;
- approved Product Scope or out-of-scope product outcomes; or
- services, APIs, data structures, integrations, infrastructure, or other engineering decisions.

Physical proximity, ordering, indentation, labels, or visualization must not be treated as dependency, sequence, priority, or scope. Any presentation that could reasonably create one of those interpretations must carry an explicit legend or be revised.

## Relationship handling

| Situation | Map treatment |
|-----------|---------------|
| One story has contextual actors | Keep one canonical placement under the primary actor; retain contextual responsibilities in the story's boundary notes. |
| One story cites supporting capabilities | Keep placement under Actor → Goal; expose capabilities only through traceability or a secondary view. |
| One story uses several business objects | Keep placement under Actor → Goal; retain every object relationship in the governed story record. |
| Two stories appear related | Keep independent canonical placements. A relationship may be recorded only as non-sequencing governance metadata with an explicit rationale. |
| One candidate serves different actors or goals | Return it for clarification or splitting; do not use duplicate placement to conceal non-atomicity. |
| A desired group is solution-, workflow-, or delivery-shaped | Do not add it to the Product Story Map. Refer the need to the later appropriate governed artifact. |

# Map Entry and Collection Records

## Story map entry

A map entry is a reference, not a second story definition. Each entry contains only the minimum information needed to establish identity and canonical placement:

| Entry field | Requirement |
|-------------|-------------|
| Story ID | Required; exact stable identifier of the governed story record. |
| Story record reference | Required; unambiguous reference to the authoritative record. |
| Actor | Required; must equal the story record's established primary actor. |
| Goal ID | Required; must equal the story record's one primary Business Outcome Goal. |
| Story status | Required; must mirror the record's controlled lifecycle status. |
| Map review state | Required; `Current`, `Review Required`, or `Historical`. It describes map consistency only and does not replace story status. |

The map may display a short need statement for readability only when copied without semantic alteration from the governed story record. Other required story fields remain in that record and are reached through the record reference.

## Goal-group coverage record

Every goal group carries a coverage record:

| Field | Requirement |
|-------|-------------|
| Actor | Exact established actor. |
| Goal ID | Exact established goal owned by that actor. |
| Goal source | Exact reference to the governing goal row. |
| Candidate count | Number of canonically placed Candidate stories. |
| In Review count | Number of canonically placed In Review stories. |
| Approved count | Number of canonically placed Approved stories. |
| Returned count | Number of canonically placed Returned stories. |
| Coverage disposition | One of `Represented`, `Pending discovery`, `Deliberately unrepresented`, or `Gap requiring review`. |
| Disposition rationale | Required when the disposition is not `Represented`; states evidence and review authority without creating a story or deciding Product Scope. |
| Last validated | Date of the most recent structure and traceability review. |

`Represented` means the group contains at least one Approved story. It does not mean that the goal is completely addressed, included in Product Scope, or ready for delivery. Non-approved stories are visible in counts but do not establish representation.

# Traceability Expectations

## Traceability chain

For every map entry, a reviewer must be able to traverse the following relationships:

```text
Map entry
    ↕ Story ID and authoritative record
Product Story
    → primary Actor
    → primary Business Outcome Goal and outcome evidence
    → primary and supporting Operational Capabilities
    → Core Business Object context
    → boundary notes and source evidence
```

Reverse traversal must also be supported:

```text
Actor or Goal → canonical Story IDs, including none
Operational Capability → referencing Story IDs, including none
Core Business Object → referencing Story IDs, including none
Source reference → dependent Story IDs
Story ID → exactly one canonical Actor → Goal location
```

The authoritative story record owns story-level traceability. The map owns canonical placement, collection-wide indexes, and coverage dispositions. Copied trace data must be validated against its source and must not become a divergent authority.

## Integrity rules

1. Every entry resolves to exactly one governed story record.
2. Every non-Retired governed story in the collection resolves to exactly one canonical map entry.
3. Entry Actor, Goal ID, and story status equal the authoritative story record values.
4. The goal is owned by the entry actor in the active Actor and Goal Model.
5. Every story trace resolves to existing capabilities, business objects, and exact source evidence as required by the Product Story Definition Rules.
6. A Retired story remains historically traceable but is excluded from current representation counts. Its entry is retained or moved to a clearly marked historical view without reusing its Story ID.
7. A changed primary actor, goal, or fundamental need creates a new Story ID; moving the old entry is not a substitute for the required retire-and-replace treatment.
8. Missing and zero-result reverse traces are reported explicitly rather than omitted.

## Traceability interpretation

Traceability proves derivation and consistency. It does not prove that:

- enough stories exist to satisfy a goal;
- any story is prioritized or approved for delivery;
- any story belongs to Product Scope;
- a workflow has been defined; or
- implementation or readiness has been authorized.

# Coverage Validation

## Coverage dimensions

Coverage validation reports the state of the story collection without manufacturing completeness. It evaluates:

| Dimension | Validation question | Required output |
|-----------|---------------------|-----------------|
| Actor structure | Is every active actor represented as a first-level group? | Present/missing actor list. |
| Goal structure | Is every active goal present under its owning actor? | Present/missing/misplaced goal list. |
| Story placement | Does every current story have exactly one valid canonical placement? | Orphan, duplicate, and mismatch lists. |
| Story definition | Do Approved entries still pass the definition rules and resolve to complete records? | Valid/invalid Approved Story IDs and failed gates. |
| Capability trace | Which established capabilities are referenced by Approved stories? | Capability-to-story matrix, including zero-story rows. |
| Business object trace | Which established Core Business Objects are referenced by Approved stories? | Object-to-story matrix, including zero-story rows. |
| Goal representation | Which goal groups contain at least one Approved story? | Per-goal counts and controlled coverage disposition. |
| Source currency | Have cited upstream sources changed since validation? | Impact-review list and affected Story IDs. |
| Boundary integrity | Do story traces continue to preserve responsibility, ownership, provenance, and external authority? | Exceptions requiring correction or escalation. |

## Validation procedure

Coverage review is performed in this order:

1. **Baseline sources** — record the current versions of all three authoritative inputs.
2. **Reconcile hierarchy** — compare active actors and goals with the complete map hierarchy.
3. **Reconcile inventory** — compare governed story records with canonical entries and identify missing, duplicate, retired, or unknown IDs.
4. **Validate placement** — compare each entry's actor and goal to its authoritative story record and confirm goal ownership.
5. **Validate records** — apply the Product Story Definition Rules to any story presented as Approved.
6. **Build reverse indexes** — derive actor, goal, capability, business-object, and source-reference views from authoritative records.
7. **Assess goal groups** — calculate status counts and assign or reconfirm each controlled coverage disposition.
8. **Report gaps without filling them** — record zero coverage, inconsistencies, and unresolved questions for governance review.
9. **Record review evidence** — retain the review date, reviewer or reviewing authority, source versions, findings, decisions, and required follow-up.

## Coverage outcomes

Coverage findings have controlled interpretations:

| Finding | Required governance response |
|---------|------------------------------|
| Missing actor or goal group | Correct the map structure; do not create a story. |
| Orphan or duplicate story | Reconcile identity and placement against the authoritative story record. |
| Actor/goal mismatch | Return the story or map entry for correction; do not reassign responsibility informally. |
| Goal with no Approved story | Select and justify a coverage disposition; do not infer scope or invent a story. |
| Capability or object with no Approved story | Report the zero-result reverse trace for review; absence alone is not a defect or scope decision. |
| Invalid Approved story | Remove `Represented` credit, move the map review state to `Review Required`, and return the story through governed validation. |
| Changed upstream source | Mark affected entries `Review Required` until impact review is complete. |
| Apparent upstream gap or conflict | Escalate to the owning Product or Business Architecture authority. |

## Coverage acceptance criteria

A map review is structurally complete only when:

- all active actors and goals are present in the correct hierarchy;
- every current governed story has exactly one canonical placement;
- all entries resolve to authoritative records and all mirrored fields agree;
- every goal group has current status counts and a controlled coverage disposition;
- reverse indexes include explicit zero-result rows;
- all Approved stories remain valid under the Product Story Definition Rules;
- affected entries from upstream changes have completed impact review or are visibly marked `Review Required`; and
- findings, rationale, source versions, and review evidence are retained.

Structural completeness is not Product Story completeness, Product Scope completeness, workflow completeness, or delivery readiness.

# Governance and Change Control

## Responsibilities

| Governance activity | Product Story Map responsibility |
|---------------------|----------------------------------|
| Admit a story reference | Require a governed story record and place it by its authoritative Actor and Goal. |
| Approve a Product Story | Defer to the Product Story Definition Rules; the map does not grant approval. |
| Maintain structure | Preserve the complete controlled Actor → Goal hierarchy and unique placements. |
| Maintain derived views | Generate them from authoritative story records and reconcile discrepancies. |
| Validate coverage | Report representation, absences, inconsistencies, and impacts without defining scope. |
| Resolve upstream changes | Perform impact analysis and defer changes in actor, goal, capability, object, or boundary authority to the governing source. |
| Preserve history | Retain stable IDs, prior status, dispositions, review evidence, and superseding relationships. |

## Change triggers

A map review is required when:

- an actor or goal source changes;
- the Product Story Definition Rules change;
- a story is added, changes controlled status, is retired, or is superseded;
- a story's traceability or boundary notes change;
- a coverage disposition changes; or
- a discrepancy is found between an entry, its story record, and an authoritative source.

Changes to display order, formatting, or a derived view require integrity checks but do not change story meaning. Changes to Actor, Goal, or Story ID are governed semantic changes and must follow the source and story identity rules.

## Review evidence

Each completed map review records:

- review date and reviewing authority;
- authoritative source names and versions;
- story inventory version or snapshot reviewed;
- validation results for every coverage dimension;
- exceptions, dispositions, and rationale;
- impacted Story IDs and required follow-up; and
- confirmation that map review did not approve Product Scope, workflow, or implementation.

# Explicit Exclusions

This document does not define:

- any actual Product Story or example story;
- any feature, epic, product package, or commitment;
- any UI, interaction, screen, or navigation;
- any workflow, activity sequence, journey, handoff, or exception path;
- Product Scope, priority, roadmap, release, or delivery sequence;
- acceptance tests, readiness gates, or validation plans for product behavior; or
- architecture, services, APIs, data models, integrations, infrastructure, or other engineering decisions.

Future artifacts may consume the governed story collection, but they must not treat map grouping, order, coverage, or adjacency as an implicit decision in any excluded area.

# Governance Outcome

Applying this structure ensures that future TOP Product Stories can be organized consistently by established Actor → Business Outcome Goal ownership, traced to their complete governed evidence, and assessed for collection coverage without creating stories or pre-empting later Product Layer and Engineering decisions.
