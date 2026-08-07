# TOP Operational Workflow Structure

Version: 1.0

Status: Active

Last Updated: 2026-08-07

Author:
TOP Product Team

---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-07 | Initial governance structure for organizing future TOP Operational Workflows |

---

# Purpose

This document defines the governance structure for organizing future TOP Operational Workflows. It establishes a stable hierarchy, grouping and placement rules, collection-wide traceability, coverage validation, and change control so that workflow records can be found, reviewed, and maintained consistently.

This is an **organizational structure**, not a populated workflow collection. It defines no actual workflow, activity, step, handoff, course, UI flow, technical process, Product Scope, or Engineering Design.

# Position and Authority

The structure occupies the Operational Workflow position in the TOP Product Canon:

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

The `TOP-Operational-Workflow-Definition-Rules.md` authority determines whether an individual workflow is eligible, well formed, and approved. This document governs how those workflow records are organized as a collection. It may mirror authoritative metadata for placement and reporting, but it may not redefine that metadata or approve a workflow.

The authoritative inputs to this structure are:

| Input | Governed contribution |
|-------|-----------------------|
| `TOP-Operational-Workflow-Definition-Rules.md` | Workflow identity, required record, eligibility, quality gates, lifecycle, and boundary rules |
| `TOP-Initial-Product-Story-Map.md` | Current governed Product Story inventory and each story's canonical Actor → Goal → Theme placement |
| `TOP-Product-Layer-Definition.md` | Product Layer responsibilities, translation principles, and exclusions |
| `TOP-Operational-Capability-Model.md` | Established capabilities, business-domain responsibility, role boundaries, and external-authority guardrails |

Actor, goal, business-object, domain, ownership, provenance, and source-authority facts reached through these inputs remain owned by their upstream authorities. If this structure conflicts with an authoritative input, the input prevails and the conflict is returned to its owner. Collection governance must not silently repair an upstream record.

# Governing Principles

## Business-first

- Organization begins with the established actor and Business Outcome Goal, never with a screen, feature, system, delivery phase, or current implementation.
- Group names describe goal-directed business context and do not imply activity sequence.
- Collection order and visual proximity communicate organization only; they do not communicate priority, dependency, workflow order, or Product Scope.

## Capability-driven

- Every placed workflow resolves to one established primary Operational Capability and any necessary supporting capabilities in its authoritative workflow record.
- Capability views are indexes across the canonical hierarchy, not alternative ownership trees or technical component maps.
- Zero-workflow capabilities remain visible in coverage reports. Their absence does not authorize invention of a workflow or imply a product gap.

## Boundary-aware

- Canonical placement follows the workflow's one primary actor and one goal; participating actors do not gain duplicate placements.
- Grouping never transfers domain, capability, business-object, record, or operational responsibility.
- Cross-boundary relationships preserve TOP-managed facts, externally governed Competition Context, and external authorities as distinguishable sources.
- No grouping or coverage disposition may extend TOP into registration, ranking, media production, streaming, audience distribution, or complete tournament lifecycle ownership.

# Workflow Hierarchy

## Canonical hierarchy

Every current workflow has exactly one canonical placement:

```text
Operational Workflow Collection
└── Primary Actor
    └── Primary Business Outcome Goal
        └── Primary Operational Capability
            └── Workflow reference
```

| Level | Structural purpose | Governing rule |
|-------|--------------------|----------------|
| Operational Workflow Collection | Boundary for governed workflow references | It is not a product, initiative, release, roadmap, or Product Scope container. |
| Primary Actor | First partition by the actor who owns the workflow's goal | Use the exact active actor recorded by the workflow and its authoritative goal source. |
| Primary Business Outcome Goal | Second partition by the one goal pursued by the workflow | The goal must be active and owned by the parent actor. Outcome evidence remains upstream-governed. |
| Primary Operational Capability | Third partition by the capability that principally enables the workflow | Use the exact established capability recorded as primary. The group does not become a module, team, or ownership boundary. |
| Workflow reference | Reference to one governed workflow record | Identity, definition, activities, courses, status, and approval remain in that record. |

The capability level is required because it makes the collection capability-driven while retaining Actor → Goal as the workflow's identity anchor. Supporting capabilities do not create sibling or duplicate placements. If two workflows share actor, goal, and primary capability, they remain separate references only when the Definition Rules establish distinct stable identities and coherent operational spans.

## Empty structural branches

All active actors and goals must appear in the collection structure, including those with no workflow. An established primary capability branch is created only when at least one current workflow is canonically placed under it. A goal with no capability branch is reported explicitly as unrepresented; an empty capability group must not be invented to suggest planned work.

## Stable presentation order

Actors and goals follow their upstream canonical order. Capability groups follow the order of the active Operational Capability Model, and workflows use stable Workflow ID order unless a separately documented business-readable convention is approved.

Order never means chronology, operational precedence, importance, priority, maturity, dependency, release sequence, or scope. Every rendered collection must include that legend.

# Workflow Grouping Principles

## Valid grouping basis

A canonical group is valid only when it:

1. resolves to one established primary actor;
2. resolves to one active goal owned by that actor;
3. resolves to one established capability recorded as the workflow's primary capability;
4. preserves the source meanings without broadening or combining them; and
5. can be explained without reference to a solution, workflow stage, or delivery plan.

Groups organize references; they do not define workflows. Group membership does not prove that member workflows interact, run in sequence, share implementation, or together satisfy the goal.

## Permitted secondary views

The following derived views may support review and analysis:

- primary or supporting Operational Capability;
- participating actor;
- Approved Product Story;
- Core Business Object and provenance concern;
- business domain or external-authority boundary;
- controlled workflow lifecycle status; and
- authoritative source reference.

Each secondary view must retain the Workflow ID, resolve back to the one canonical placement, identify whether a relationship is primary or supporting, and state that it is an index rather than an alternative hierarchy.

## Prohibited grouping semantics

Canonical groups, tags, views, ordering, and visual layout must not define or imply:

- actual workflows, workflow steps, stages, activities, paths, handoffs, decisions, alternate courses, or exception courses;
- features, epics, packages, applications, pages, screens, navigation, or UI flows;
- services, modules, APIs, data flows, events, queues, integrations, jobs, or technical processes;
- Product Scope, priority, estimates, milestones, releases, increments, readiness, or delivery dependencies; or
- new actors, goals, capabilities, domains, business objects, ownership rules, or external authorities.

# Workflow Placement Rules

## Admission

A workflow reference may enter the current collection only when:

- a unique authoritative workflow record exists;
- the record has a controlled status under the Definition Rules;
- its source baseline is declared;
- exactly one primary actor, one active goal owned by that actor, and one established primary capability resolve at that baseline; and
- its record provides resolvable story, capability, object, and boundary traces required for its status.

`Candidate`, `In Review`, `Approved`, and `Returned` workflows may be visible, but their status must be explicit. Only `Approved` workflows establish represented coverage. `Retired` workflows remain in a historical view and do not occupy the current hierarchy.

## Canonical placement algorithm

For each admitted workflow:

1. read the primary actor from the authoritative workflow record;
2. verify that the primary goal is active and owned by that actor;
3. read the one primary capability and verify it against the Operational Capability Model;
4. place the Workflow ID under that exact Actor → Goal → Primary Capability branch; and
5. reconcile mirrored status and source-baseline data with the authoritative record.

Placement is deterministic. Collection maintainers may not choose a more convenient actor, goal, or capability and may not duplicate a reference to express participation or cross-capability support.

## Relationship handling

| Situation | Required placement treatment |
|-----------|------------------------------|
| A workflow has participating actors | Keep one placement under the primary actor; expose participation only in a secondary view sourced from the workflow record. |
| A workflow has supporting capabilities | Keep one placement under the primary capability; index each supporting relationship with its necessity rationale. |
| A workflow traces to several stories or themes | Keep one workflow placement; story themes remain story-map organization and do not become workflow groups. |
| A workflow uses several business objects | Keep one placement and expose object relationships through traceability views. |
| Work appears to pursue two independent goals | Return it to workflow definition for separation or clarification; do not duplicate or create a combined group. |
| Actor, goal, or primary capability is missing or conflicting | Do not place it as current; mark the collection entry `Review Required` and escalate to the owning authority. |
| A relationship to another workflow is recorded | Retain only the Definition Rules' business-context relationship; do not infer invocation, order, dependency, or shared delivery. |
| A desired branch is solution- or delivery-shaped | Reject the branch and refer the question to the appropriate later governance. |

## Collection entry record

Each collection entry is a reference, not a second workflow definition:

| Field | Requirement |
|-------|-------------|
| Workflow ID | Exact stable ID from the authoritative record |
| Workflow record reference | Unambiguous location of the authoritative record and version |
| Primary actor | Exact mirrored value used for placement |
| Primary goal ID | Exact mirrored value used for placement |
| Primary capability | Exact mirrored value used for placement |
| Workflow status | Exact mirrored controlled status |
| Collection review state | `Current`, `Review Required`, or `Historical`; does not replace workflow status |
| Source baseline reference | Exact baseline or review evidence used to reconcile the entry |
| Last reconciled | Date and responsible collection reviewer |

Names and purpose summaries may be copied for readability only without semantic alteration. All operational-definition fields remain solely in the authoritative workflow record.

# Traceability Model

## Forward traceability

Every collection entry must support traversal without making the collection a new source of truth:

```text
Established Operational Capability
        → Primary Actor
        → Primary Business Outcome Goal and outcome evidence
        → Approved Product Story
        → Workflow record
        → Activity / course / invariant trace in that record
        → Business Object, provenance, and boundary evidence
        → Canonical collection placement
```

The collection stores Workflow IDs and placement metadata; the workflow record owns workflow-level traces, and upstream sources own their respective business meanings.

## Reverse indexes

The governed collection must produce:

```text
Actor → Goal IDs and Workflow IDs, including none
Goal ID → Primary Capability groups and Workflow IDs, including none
Operational Capability → primary and supporting Workflow IDs, including none
Approved Product Story → Workflow IDs and Activity IDs, including none
Core Business Object → Workflow IDs and relevant Activity IDs, including none
Boundary or source reference → dependent Workflow IDs, including none
Workflow ID → exactly one canonical Actor → Goal → Primary Capability placement
```

Activity IDs are reached from authoritative workflow records; they are not redefined in the structure. Supporting relationships must be labeled so that reverse indexes do not misstate canonical placement.

## Integrity rules

1. Every current entry resolves to exactly one authoritative workflow record and one canonical placement.
2. Every non-Retired governed workflow resolves to exactly one current entry; every Retired workflow remains historically traceable.
3. Entry actor, goal, capability, status, and version agree with the authoritative record.
4. The goal is owned by the primary actor and all capability references resolve to the active capability model.
5. Every story claimed by an Approved workflow resolves to an Approved record in the story-map baseline and to a justified activity or invariant trace.
6. Primary and supporting capability labels agree between the workflow record and reverse indexes.
7. Object, domain, ownership, provenance, and external-authority meanings agree with their authoritative sources.
8. Missing and zero-result reverse traces are reported, not omitted or filled by inference.
9. Copied metadata is reconciled at each review and never becomes an independent authority.
10. Traceability proves derivation and consistency only; it does not prove completeness, Product Scope, readiness, implementability, or delivery priority.

# Coverage Validation

## Coverage dimensions

| Dimension | Validation question | Required output |
|-----------|---------------------|-----------------|
| Actor structure | Is every active actor represented at the first level? | Present and missing actor list |
| Goal structure | Is every active goal present under its owning actor? | Present, missing, and misplaced goal list |
| Workflow inventory | Does every governed workflow have one correct current or historical entry? | Orphan, duplicate, unknown, and omitted Workflow IDs |
| Canonical placement | Does entry metadata match Actor → Goal → Primary Capability sources? | Valid and mismatched entry lists |
| Definition validity | Do workflows presented as Approved still pass the Definition Rules? | Valid and invalid Approved Workflow IDs with failed gates |
| Story trace | Are all claimed stories Approved and substantively mapped? | Story-to-workflow/activity matrix, including zero rows |
| Capability trace | Which capabilities are primary or supporting for workflows? | Labeled capability-to-workflow matrix, including zero rows |
| Object and boundary trace | Are object, ownership, provenance, domain, and external-authority traces intact? | Exceptions and affected Workflow IDs |
| Goal representation | Which goals have at least one canonically placed Approved workflow? | Status counts and controlled disposition per goal |
| Capability-group representation | Which canonical capability groups have an Approved workflow? | Status counts and controlled disposition per existing group |
| Source currency | Have authoritative baselines changed? | Impact-review list and affected Workflow IDs |
| Neutrality | Does organization avoid scope, UI, workflow-step, and technical semantics? | Prohibited-semantic findings and correction state |

## Coverage record and dispositions

Every active goal and every existing canonical capability group has a coverage record containing its Actor, Goal ID, optional primary capability, counts by workflow status, disposition, rationale, last validation date, reviewing authority, and source baseline.

The controlled dispositions are:

| Disposition | Meaning |
|-------------|---------|
| Represented | At least one canonically placed workflow is `Approved`. |
| Pending discovery | Governance has recorded that workflow discovery is incomplete; no workflow or scope is implied. |
| Deliberately unrepresented | The reviewing authority has evidence that no current workflow representation is warranted; this is not an out-of-scope decision. |
| Gap requiring review | Evidence indicates a possible missing, invalid, or conflicting definition requiring governed review. |

Only `Approved` workflows count as `Represented`. Candidate or returned records remain visible but do not establish coverage. Representation means that a valid workflow reference exists; it does not mean the goal, capability, story set, or product is complete or in Product Scope.

## Validation procedure

1. **Baseline sources** — record exact versions or dates of all authoritative inputs and the governed workflow inventory snapshot.
2. **Reconcile actors and goals** — compare the complete active Actor → Goal set with the hierarchy, retaining explicit empty goal branches.
3. **Reconcile workflow inventory** — identify missing, duplicate, unknown, current, and historical Workflow IDs.
4. **Validate canonical placement** — compare each entry with its authoritative primary actor, goal ownership, and primary capability.
5. **Validate workflow status** — reapply the Definition Rules to any workflow represented as Approved.
6. **Reconcile story traces** — compare claimed stories with the Initial Product Story Map baseline and the workflow's activity or invariant traces.
7. **Build reverse indexes** — derive all actor, goal, capability, story, object, boundary, and source views, including zero-result rows.
8. **Validate boundaries and neutrality** — detect changed meanings, ownership or provenance conflicts, external-authority expansion, and prohibited organizational semantics.
9. **Assess coverage** — calculate status counts and assign or reconfirm the disposition for each goal and existing capability group.
10. **Record evidence** — retain reviewer, date, baseline, findings, rationale, decisions, escalation, and required follow-up.

## Coverage outcomes

| Finding | Governance response |
|---------|---------------------|
| Missing or misplaced actor/goal branch | Correct the structure from authoritative data; do not define a workflow. |
| Orphan or duplicate workflow entry | Reconcile identity and placement against the authoritative record. |
| Goal without an Approved workflow | Record the controlled disposition; do not invent a workflow or infer Product Scope. |
| Capability with no workflow | Report the zero-result reverse trace; absence alone is not a defect. |
| Invalid Approved workflow | Remove represented credit, mark the entry `Review Required`, and return it through workflow governance. |
| Story missing or no longer Approved | Mark affected entries `Review Required` and return the issue to Product Story governance. |
| Missing or conflicting capability or boundary | Pause current placement or approval credit and escalate to Business Architecture. |
| Upstream source changed | Impact-review all dependent entries before restoring `Current`. |
| UI, technical, scope, or delivery-shaped grouping | Remove or rename the grouping without converting it into product or design authority. |

Coverage validation is complete only when the hierarchy and inventory reconcile; current entries have exactly one valid placement; reverse indexes include zero results; Approved workflows remain definition-valid; each required coverage record has counts and a disposition; boundary and source impacts are resolved or visibly under review; and review evidence is retained.

# Governance and Change Control

## Responsibilities

| Governance activity | Responsible authority |
|---------------------|-----------------------|
| Define, validate, version, approve, return, or retire a workflow | Operational Workflow Definition governance |
| Admit, place, index, reconcile, or historically retain a workflow reference | Operational Workflow Structure governance |
| Define or change a Product Story or its canonical story-map placement | Product Story and Story Map governance |
| Define actors, goals, evidence, capabilities, domains, objects, ownership, or provenance | Owning Product or Business Architecture authority |
| Decide Product Scope | Later Product Scope governance, outside this structure |
| Select UI or technical implementation | Later design authorities, outside this structure |

One person or forum may perform more than one governance role, but the decisions and evidence must remain separately identified.

## Collection review states

| State | Meaning |
|-------|---------|
| Current | Placement and mirrored metadata reconcile with the authoritative record and baseline. |
| Review Required | A mismatch, upstream change, invalid trace, or unresolved governance finding requires review. |
| Historical | The referenced workflow version is Retired or superseded and retained only for auditability. |

Collection review state never changes workflow lifecycle status. Only workflow-definition authority may do that.

## Change rules

1. A newly governed workflow is admitted only through the placement and integrity checks in this document.
2. A workflow version that preserves identity keeps its Workflow ID; its entry is reconciled and all affected indexes and coverage counts are rebuilt.
3. A changed primary actor, primary goal, or fundamental operational span follows the Definition Rules' retire-and-new-ID treatment. Moving the old reference is prohibited.
4. A changed primary capability requires definition-level impact review before canonical movement; collection governance cannot reclassify it independently.
5. Status changes update coverage credit and review state without erasing historical evidence.
6. Upstream story, capability, object, actor, goal, boundary, or provenance changes trigger review of every dependent Workflow ID.
7. Structural rules, placement algorithms, dispositions, and required indexes are version controlled. Material changes require collection-wide impact review.
8. Historical identities, prior placements, counts, source baselines, findings, rationales, and superseding relationships are retained.

## Review cadence and evidence

The collection is reviewed whenever a workflow is admitted, changed, returned, approved, or retired; whenever an authoritative input changes; and at the Product governance cadence even when no change is reported.

Every completed review records:

- date, responsible reviewer, and review authority;
- structure version and exact input baselines;
- workflow inventory snapshot and status counts;
- placement, integrity, coverage, reverse-index, boundary, and neutrality results;
- zero-result traces and their controlled interpretation;
- changes since the prior review and affected Workflow IDs;
- open findings, escalation owner, disposition, and due review point; and
- confirmation that no workflow, step, UI flow, technical process, Product Scope, or Engineering Design was approved by the collection review.

# Explicit Exclusions

This structure does not define:

- any actual Operational Workflow or operational activity;
- workflow steps, sequence, entry or exit, decision, handoff, alternate course, or exception course;
- any UI flow, screen, control, navigation, interaction, or presentation;
- any technical process, orchestration, data flow, service, API, module, integration, event, job, infrastructure, or deployment;
- any Product Scope, feature set, priority, roadmap, release, estimate, milestone, or delivery commitment;
- any Engineering Design, acceptance test, readiness plan, or implementation authorization; or
- any new or changed actor, goal, story, capability, domain, business object, ownership rule, record responsibility, provenance rule, or external authority.

Examples in this document are schemas and organization semantics only. They must not be populated or interpreted as descriptions of TOP operational work.

# Governance Outcome

Applying this structure gives every future governed workflow one stable, business-first Actor → Goal → Primary Capability placement; preserves capability, responsibility, ownership, provenance, and external-authority boundaries; enables complete forward and reverse traceability; reports coverage without manufacturing completeness; and keeps workflow organization separate from Product Scope, UI design, technical processes, and Engineering Design.
