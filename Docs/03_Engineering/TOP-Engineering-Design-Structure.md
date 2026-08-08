# TOP Engineering Design Structure

Version: 1.0

Status: Active

Last Updated: 2026-08-08

Author: TOP Engineering Governance

---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-08 | Initial collection and structural governance for future Engineering Design Records |

---

# Purpose

This document defines how future TOP Engineering Design Records and their Engineering Decisions are collected, canonically placed, identified, traced, validated, related, changed, preserved, and presented. It is the structural companion to the **TOP Engineering Design Definition Rules**, which remain authoritative for eligibility, record content, decision quality, ownership, authority, review, lifecycle statuses, gates, findings, and change control.

Engineering Design grouping is governance organization only. It makes records discoverable, consistent, and auditable. It does not describe technical architecture, implementation or delivery ownership, priority, a roadmap, or Product Scope. This document creates no Engineering Design Record or Engineering Decision and defines no technical solution.

# Canonical Position and Authority

The canonical containment hierarchy is:

```text
Engineering Design Collection
        ↓
Engineering Design Record
        ↓
Engineering Decision
```

This hierarchy has exactly the following meaning:

1. the Engineering Design Collection is the governed inventory of all current and historical Engineering Design Records;
2. an Engineering Design Record is the single canonical container for one governed design concern against one exact approved input baseline; and
3. an Engineering Decision is canonically contained by the one Engineering Design Record within which that material technical question is governed.

Containment does not express architecture, decomposition, execution sequence, dependency, ownership, delivery order, priority, or scope hierarchy. A record's placement is not approval, and collection membership does not authorize Implementation.

Each Engineering Design Record must preserve this complete authority trace:

```text
Engineering Design Record
        ↓
Approved Engineering Readiness Assessment
        ↓
Approved Product Scope Item
        ↓
Operational Workflow
        ↓
Product Story
        ↓
Business Outcome Goal
        ↓
Actor
        ↓
Operational Capability
        ↓
Core Business Object
```

The arrows mean required, version-specific navigability, not one-to-one cardinality or technical dependency. Each affected Product Scope Item retains its own complete chain. Where an authoritative source defines more than one applicable relationship, all applicable relationships remain explicit rather than being collapsed into a convenient grouping.

# Authoritative Structural Inputs

| Input | Structural authority |
|-------|----------------------|
| **TOP Engineering Design Definition Rules** | Design eligibility, record and decision schemas, roles, statuses, review lifecycle, decision gates, findings, approval, and change-control requirements. |
| **Approved Engineering Readiness Assessment** | Immediate design authority, Ready conclusion, assessed baseline, evidence, findings, decision context, and exact Product Scope Items eligible for design. |
| **Approved Product Scope** | Approved item identity, inclusions, exclusions, constraints, decision context, and authoritative scope boundary. |
| **Operational Workflow collection** | Workflow identity, activities, actors, outcomes, story traces, capability traces, object traces, and operational boundaries. |
| **Product Story collection and map** | Story identity, Actor, Business Outcome Goal, outcome evidence, capability participation, object context, and approved status. |
| **Actor and Business Outcome Goal model** | Established actor and goal identity, responsibility, ownership, and outcome meaning. |
| **Operational Capability model** | Established business abilities, responsibilities, outcomes, relationships, ownership, and boundaries. |
| **Core Business Object model** | Established business meaning, relationships, ownership, provenance, and record responsibilities. |

The collection stores stable, exact references to authoritative sources. A copied label, cached description, search index, or secondary view is non-authoritative and must never replace its source.

# Canonical Collection Structure

## 1. Engineering Design Collection

TOP has one logical canonical Engineering Design Collection. It contains the complete inventory of current and historical Engineering Design Record identities. Physical storage may be distributed for repository or records-management reasons, but those locations must implement one collection index and must not become additional semantic groupings.

The collection index contains:

| Field | Rule |
|-------|------|
| Collection identity | Stable identity for the one canonical collection. |
| Governance version | Exact version of the collection schema and rules used. |
| Collection snapshot | Immutable identifier and date for a validation or review snapshot. |
| Design Record ID | One entry for every current and historical record identity. |
| Canonical record reference | One unambiguous location for each record's authoritative content. |
| Current version and status | Mirrored navigation metadata reconciled to the authoritative record. |
| Input baseline reference | Exact Approved Engineering Readiness Assessment ID and version. |
| Decision IDs | Complete membership index, including an explicit empty set. |
| Relationship references | Typed, non-containment links to other Design Record IDs and Decision IDs. |
| History references | Prior versions, replacements, supersession, withdrawal, and governance events. |
| Collection review state | `Current`, `Review Required`, or `Historical`; it is not a design lifecycle status. |

The collection itself does not own a technical question, approve a decision, combine record baselines, or establish a portfolio, work queue, roadmap, or product boundary.

## 2. Engineering Design Record

Each Engineering Design Record appears exactly once as a direct child of the Engineering Design Collection. The record is the decision-bearing governance container defined by the Definition Rules. No intermediate canonical folder, category, domain, capability, workflow, scope, assessment, technical concern, or ownership group may be inserted into the containment hierarchy.

Its collection entry contains at minimum:

| Field | Rule |
|-------|------|
| Design Record ID | Stable, globally unique, and never reused. |
| Canonical record reference | Unambiguous reference to the authoritative record. |
| Version | Controlled version with an explicit predecessor where applicable. |
| Status | Exactly one Design Record status permitted by the Definition Rules. |
| Title | Neutral discovery label; it does not establish identity or grouping. |
| Design concern and boundary | Must agree with the record and must not add, remove, or group Product Scope. |
| Design Owner and Decision Authority | Governance roles from the record; neither field defines technical or delivery ownership. |
| Approved Readiness Assessment | Exact ID, version, status, approval, and decision evidence for the immediate authority. |
| Approved Product Scope Item IDs | Complete set addressed by the record, each with an independent full trace. |
| Source baseline index | Version-specific index of every authoritative source used. |
| Decision IDs | Every canonically contained current and historical Engineering Decision. |
| Relationship index | Typed relationships to other records or decisions without additional containment. |
| Review and history references | Addressable reviews, findings, approvals, changes, and supersession evidence. |
| Collection review state | Structural state independent from design lifecycle status. |

A record may address multiple Approved Product Scope Items only as allowed by the Definition Rules. That fact does not create a new Product Scope grouping, merge item identity, or make the record a scope authority.

## 3. Engineering Decision

Every Engineering Decision has exactly one canonical parent Engineering Design Record. It is not an independently placed collection item. It remains individually identifiable and may be referenced from other records and decisions.

Decision collection metadata contains:

| Field | Rule |
|-------|------|
| Decision ID | Stable and globally unambiguous within the collection; never reused. |
| Canonical parent | Exact Design Record ID and record version governing the decision. |
| Canonical decision reference | Addressed location of the authoritative decision content. |
| Status | Exactly one decision status permitted by the Definition Rules. |
| Technical question | Neutral identification of the governed question, without using it as a grouping boundary. |
| Affected scope items | Exact IDs and links to each complete upstream trace. |
| Relationship references | Typed dependencies, conflicts, constraints, complements, and supersession links. |
| Authority evidence | Author, reviewers, decision authority, decision date, and effective baseline. |
| History references | Prior decision versions and replacement, rejection, reversal, or supersession evidence. |

A reference from another record does not move, copy, jointly contain, or implicitly approve the decision. If a determination has different authority, a different baseline, or can change independently with materially different impact, the Definition Rules determine whether it must be a separate Decision ID.

# Placement and Containment Rules

1. **Eligibility precedes admission.** A candidate is admitted only after it satisfies Design Eligibility under the Definition Rules, including one approved Ready Engineering Readiness Assessment. A placeholder is not a canonical record.
2. **One canonical record location.** Each Design Record ID occurs once directly beneath the Engineering Design Collection. All other appearances are references or generated views.
3. **One immediate authority.** Each record version names exactly one approved Ready Engineering Readiness Assessment as its immediate input authority.
4. **Exact baseline.** Placement records the exact assessment version and approval evidence. A mutable link, title, or latest-version reference is insufficient.
5. **One decision parent.** Each Decision ID is canonically contained by exactly one Design Record ID. Cross-record use is by typed reference only.
6. **No intermediate hierarchy.** Neither sources nor technical or delivery labels may become canonical folders between collection, record, and decision.
7. **No containment by similarity.** Shared technology, technical question, reviewer, owner, source, capability, object, workflow, or scope item does not justify common canonical containment.
8. **No inferred authority.** Placement, adjacency, order, a relationship, or an empty decision set does not establish approval or completeness.
9. **No reassignment.** A record is not moved to a different assessment or a decision to a different record to accommodate change. Governed versioning, replacement, or supersession preserves the original placement.
10. **History remains placed.** Superseded and Withdrawn records and Rejected or Superseded decisions retain their original canonical containment, baseline, authority evidence, and effective history.

# Identity, Uniqueness, and Duplicate Detection

## Identity rules

1. A **Design Record ID** identifies one coherent governed design concern across controlled versions, so long as its concern, authority context, and identity remain continuous.
2. A materially different concern, an unrelated baseline, or a changed authority context requires a new Design Record ID. A baseline change that preserves continuity is handled only through the version and review rules in the Definition Rules.
3. A **Decision ID** identifies one material technical question and its governed determination across its controlled history. It is not repurposed for another question.
4. IDs are opaque. Their format must not encode team, frontend/backend, service, module, component, API, database, infrastructure or architecture layer, deployment unit, sprint, release, priority, roadmap, ownership, or Product Scope grouping.
5. Titles, file paths, headings, sequence numbers, and source labels aid discovery but do not establish identity.
6. Rename-only and administrative corrections retain identity when governed meaning is unchanged and the change is logged.
7. Deleted, withdrawn, rejected, and superseded IDs are never recycled.

## Duplicate detection

Before admission of a record, version, or decision, collection governance compares both current and historical entries.

For a proposed Design Record it compares:

- the Approved Engineering Readiness Assessment ID and exact version;
- the complete set of affected Approved Product Scope Item IDs;
- the design concern, decision context, and stated boundary;
- the material questions and intended decision authority;
- existing aliases, predecessor, replacement, and supersession links; and
- current and historical record identities that overlap substantially.

For a proposed Engineering Decision it compares:

- the precise technical question;
- the governing Design Record and input baseline;
- affected Product Scope Item traces;
- constraints, alternatives, selected determination, and material impacts; and
- current, rejected, superseded, and cross-referenced decisions.

Equivalent analysis or review iterations are reconciled into the controlled history of one identity. Similar concerns with genuinely different baselines, authorities, or independently changeable impacts retain distinct IDs and an explicit relationship. Reviewers must not merge records merely to simplify navigation or split them to evade authority, impact, or gate review.

When duplicates are discovered, collection governance selects the continuing canonical identity based on original valid admission and complete authority evidence; records aliases and duplicate-of links; preserves both audit trails; redirects references through governed changes; and never deletes approval, rejection, or effective-history evidence. If identity cannot be resolved without changing meaning, the affected entries remain `Review Required` until the proper authority decides.

## Cardinality constraints

| Relationship | Constraint |
|--------------|------------|
| Engineering Design Collection → Design Record | Zero or more records; one entry per Design Record ID. |
| Design Record version → Approved Readiness Assessment version | Exactly one. |
| Design Record → canonical collection location | Exactly one. |
| Design Record version → Approved Product Scope Item | One or more as authorized by its baseline. |
| Design Record → Engineering Decision | Zero or more historical decisions; approval requires the decision completeness specified by the Definition Rules. |
| Engineering Decision → canonical Design Record | Exactly one. |
| Record or Decision → cross-design relationship | Zero or more typed references; never containment. |

Zero records, zero decisions, or zero reverse-trace results are reported explicitly. None of those conditions proves design completeness or approval.

# Traceability Model

## Required forward trace

For every affected Approved Product Scope Item, the collection must support traversal of:

```text
Design Record ID + version
  → Approved Engineering Readiness Assessment ID + version + approval
    → Approved Product Scope Item ID + approved scope version
      → Operational Workflow ID + version + addressed location
        → Product Story ID + version + addressed location
          → Business Outcome Goal ID
            → Actor ID
              → Operational Capability ID(s)
                → materially relevant Core Business Object ID(s)
```

Every Engineering Decision joins the trace at each scope item it affects. A record-level trace does not excuse decision-level trace, and a shared upstream reference does not collapse separate item chains.

## Required reverse trace

The collection also supports:

```text
Core Business Object → citing capabilities, stories, workflows, scope items,
                       readiness assessments, Design Records, and Decisions, including none
Operational Capability → citing stories, workflows, scope items, assessments,
                         Design Records, and Decisions, including none
Actor or Business Outcome Goal → applicable stories, workflows, scope items,
                                 assessments, Design Records, and Decisions, including none
Product Story or Operational Workflow → scope items, assessments, Design Records,
                                        and Decisions using it
Approved Product Scope Item → every current and historical Design Record and Decision use
Approved Readiness Assessment → every Design Record authorized by that exact baseline
Design Record → canonical Decisions and inbound/outbound cross-design references
Engineering Decision → canonical parent, affected traces, relationships, and full history
```

## Trace-edge requirements

| Field | Requirement |
|-------|-------------|
| Source identity | Stable ID, exact version where versioned, and addressed location. |
| Target identity | Stable ID, exact version where versioned, and addressed location. |
| Relationship type | Controlled semantic type established by the governing source or this structure. |
| Authority | Record or rule that establishes the relationship. |
| Design use | Design Record, Decision, and affected scope item relying on the edge. |
| Validation state | `Current`, `Review Required`, or `Historical`. |
| Last validated | Date, collection snapshot, and accountable reviewer. |

Traceability demonstrates authority, derivation, coverage, and impact reach. It does not imply data flow, runtime coupling, invocation, execution sequence, technical dependency, implementation ownership, delivery ownership, priority, roadmap, or scope creation.

# Design Decision References and Cross-Design Relationships

Cross-design relationships are explicit, typed, directional references. They never create a second parent, nested record, combined approval, or architecture boundary.

Permitted relationship types are:

| Type | Meaning |
|------|---------|
| `depends-on` | The citing analysis relies on another governed determination; both retain independent approval. |
| `constrains` | An approved determination limits the valid choices of another decision without approving it. |
| `conflicts-with` | The determinations cannot both apply under the stated baseline or condition and require disposition. |
| `complements` | Independently governed determinations jointly address an impact or outcome. |
| `related-to` | A material review relationship exists but none of the stronger controlled meanings applies. |
| `supersedes` / `superseded-by` | A governed replacement relationship preserving direction, authority, and history. |
| `duplicate-of` | Identity reconciliation has established an equivalent record or decision. |

Every relationship records source ID and version, target ID and version, type, rationale, applicable baseline or condition, establishing authority, validation state, and reciprocal link where the type requires one. `related-to` must not substitute for a known dependency, conflict, or supersession relationship.

References obey these rules:

1. a referenced decision remains canonically contained by its original Design Record;
2. the citing record states why and under which exact baseline the reference applies;
3. approval is never inherited through a reference;
4. a change to either endpoint triggers impact review of the relationship and all transitive affected references;
5. cycles in `supersedes` and `duplicate-of` are invalid; dependency cycles must be reported for authority review rather than silently ordered; and
6. relationships organize governance knowledge only and must not be rendered as a service map, module graph, implementation dependency network, work breakdown, or delivery plan.

# Coverage and Integrity Validation

Coverage validation reconciles the collection against authoritative records. It reports structural integrity and decision reach; it does not invent missing design content, select a solution, or certify implementation or delivery.

## Validation dimensions

| Dimension | Validation question | Required output |
|-----------|---------------------|-----------------|
| Collection inventory | Does every authoritative current and historical Design Record occur once in the collection? | Missing, unknown, duplicate, and misplaced record lists. |
| Canonical placement | Is every record a direct collection child and every decision contained once by one record? | Orphan, multiply placed, nested, and invalid-parent lists. |
| Eligibility and baseline | Does every admitted record version cite one approved Ready assessment and exact source baseline? | Ineligible, stale, ambiguous, and unresolved baseline lists. |
| Record identity | Are IDs stable, unique, unused by other concerns, and consistent across versions? | Collisions, reuse, broken predecessor, and ambiguous continuity lists. |
| Decision identity | Does each material decision have one stable ID, parent, question, status, and history? | Missing, duplicate, split, combined, and reused decision lists. |
| Scope-item coverage | Is every scope item in the record baseline addressed by at least one decision or an explicit governed no-decision disposition? | Per-record covered, uncovered, and multiply interpreted item matrix. |
| Decision trace | Does every decision trace to every affected scope item and each complete authority chain? | Orphan-decision and broken-edge lists. |
| Forward trace | Can every affected scope item reach workflow, story, goal, actor, capability, and object sources? | Per-item matrix and missing or ambiguous edge list. |
| Reverse trace | Can each cited source return every record and decision use, including zero uses? | Source-to-design indexes and reconciliation differences. |
| Baseline consistency | Do record, decision, trace, review, and approval evidence name the same exact effective baseline? | Mixed-baseline, stale-reference, and approval-mismatch lists. |
| Relationship integrity | Are cross-design links typed, justified, reciprocal where required, current, and non-cyclic where prohibited? | Broken, unknown, stale, cyclic, and semantically ambiguous links. |
| Decision containment | Are references distinguished from canonical membership and is approval never inherited? | Copied, jointly contained, or implicitly approved Decision IDs. |
| Status and gate consistency | Do record and decision statuses agree with reviews, findings, authorities, gates, and supersession? | Invalid combinations and required governance actions. |
| History integrity | Are versions, effective baselines, approvals, rejections, withdrawals, and supersession chains immutable and complete? | Broken, missing, cyclic, overwritten, and ambiguous history links. |
| Prohibition compliance | Is organization free of prohibited technical, ownership, scope, priority, and delivery semantics? | Prohibited fields, folders, tags, views, and implications. |

## Orphan detection

The following are orphans and fail structural validation:

- a Design Record absent from the collection index or without one canonical location;
- an admitted record without one resolvable approved Ready assessment baseline;
- a Product Scope Item named by a record but lacking its complete authoritative chain;
- an Engineering Decision without exactly one canonical Design Record parent;
- a decision not linked to every affected Product Scope Item;
- a relationship whose source or target ID/version cannot be resolved;
- a review, finding, approval, or history event that cannot resolve its governed record or decision; or
- an authoritative source use that cannot reverse-resolve to the design use that cites it.

Orphans are recorded as governance findings and the affected entry becomes `Review Required`. They are not repaired by inventing a parent, copying source content, assuming a latest version, assigning a technical owner, or deleting the unresolved reference.

## Validation procedure

1. **Freeze the review baseline.** Record the collection snapshot, Definition Rules version, schema version, and exact authoritative baselines.
2. **Reconcile the inventory.** Compare collection entries with authoritative records and decisions, including historical identities.
3. **Validate canonical containment.** Confirm one direct collection location per record and one record parent per decision; distinguish every reference from containment.
4. **Run duplicate and orphan checks.** Apply identity comparisons to current and historical entries and enumerate every unresolved identity or parent.
5. **Validate eligibility and baseline consistency.** Resolve assessment approval, Ready status, scope items, source versions, and decision effective baselines.
6. **Reconcile scope coverage.** Account for each scope item through a decision or a governed no-decision disposition without adding or regrouping scope.
7. **Traverse traces both ways.** Resolve IDs, versions, addressed locations, relationships, and authorities, including explicit zero-result reverse traces.
8. **Validate decision membership and references.** Confirm complete parent indexes, typed cross-design links, reciprocal links, and non-inherited approvals.
9. **Reconcile statuses and history.** Compare decisions, findings, gates, review evidence, approvals, effective periods, and replacement chains.
10. **Inspect neutrality.** Detect prohibited canonical fields, physical folders, tags, ordering, and secondary-view implications.
11. **Record findings without filling gaps.** Route structural correction to Engineering Governance and semantic or authority questions to the governing source owner.
12. **Retain validation evidence.** Preserve reviewer, date, snapshot, inputs, outputs, exceptions, dispositions, and required impact reviews.

## Structural acceptance criteria

A collection snapshot is structurally valid only when:

- every current and historical Design Record has one direct canonical placement;
- every Engineering Decision has one canonical record parent and all other appearances are typed references;
- every admitted record resolves to one exact approved Ready assessment and consistent input baseline;
- all record and decision identities are unique, stable, unreused, and reconciled with history;
- every scope item is covered by a decision or an explicit governed disposition;
- all required forward and reverse traces resolve without collapsed item chains;
- cross-design relationships resolve, carry controlled meaning, and do not imply shared approval;
- lifecycle statuses agree with gates, findings, authorities, evidence, and history;
- source changes are impact-reviewed or visibly marked `Review Required`;
- all previous baselines, decisions, and effective histories remain preserved; and
- neither the collection nor a secondary view creates prohibited technical, ownership, product, priority, roadmap, or delivery structure.

Structural validity does not mean a design is Approved, technically correct, complete for implementation, implemented, tested, deployable, released, prioritized, funded, or in Product Scope.

# Lifecycle and Change Governance

## Collection review states

Collection review state is independent from the Design Record and Engineering Decision lifecycle statuses in the Definition Rules:

| State | Meaning |
|-------|---------|
| `Current` | Canonical placement, mirrored metadata, traces, relationships, and history agree with the reviewed authoritative baselines. |
| `Review Required` | A source or structural change, inconsistency, duplicate, or orphan requires impact validation; it does not itself change design approval. |
| `Historical` | The entry or version is retained as immutable prior, Superseded, Rejected, or Withdrawn governance evidence. |

## Change-impact triggers

Structural impact review is required when:

- an assessment or any source in its baseline changes status, approval, version, identity, or relationship;
- an affected Product Scope Item, workflow, story, goal, actor, capability, object, ownership, provenance, or boundary changes;
- a Design Record changes concern, boundary, version, status, owner, authority, decision membership, or canonical reference;
- an Engineering Decision changes question, version, status, affected scope items, determination, assumption, constraint, impact, or authority;
- a decision is added, rejected, reversed, replaced, copied, split, merged, or superseded;
- a cross-design relationship is added, removed, retyped, contradicted, or becomes stale;
- a duplicate, orphan, mixed baseline, trace break, status inconsistency, or prohibited grouping is found;
- implementation evidence triggers reconsideration under the Definition Rules; or
- governing Definition Rules or this collection schema change.

## Change-impact review

Each review records:

1. the trigger and initiating authority;
2. affected record, decision, source, trace, relationship, review, and history IDs;
3. direct and transitive impact traversal in both directions;
4. comparison of the old and proposed baselines and meanings;
5. identity-continuity and duplicate analysis;
6. scope fidelity, boundary, decision-consistency, and authority consequences;
7. gates and reviewers that must be repeated;
8. whether unaffected decisions may be carried forward, with evidence;
9. required upstream referral or reassessment; and
10. disposition, effective date, collection state, and preserved history references.

Collection metadata must not decide semantic changes. Upstream changes return to the proper upstream authority and, where required, Engineering Readiness. Design changes follow the Definition Rules before they become authoritative.

## Change treatment

| Change | Required structural treatment |
|--------|-------------------------------|
| Display-only or editorial correction with unchanged meaning | Retain IDs; log the correction, validate references, and do not rewrite prior snapshots. |
| Material record or decision content change with valid identity continuity | Create a controlled new version, preserve the predecessor, mark affected traces `Review Required`, and repeat affected reviews and gates. |
| Materially different concern, question, baseline context, or authority | Create a new ID and an explicit typed relationship; do not repurpose the former identity. |
| Upstream baseline change | Preserve the prior design against its original baseline; require the governed upstream and Readiness path before design authority can move to a new baseline. |
| Equivalent duplicate discovered | Choose one continuing canonical identity through authority review, retain aliases and `duplicate-of` history, and reconcile all references. |
| One identity contains independently governed concerns or questions | Preserve the former history, create the required IDs, and record split and replacement relationships without erasing prior approvals. |
| Cross-design relationship changes | Version or log the relationship as governed, impact-review both endpoints and transitive uses, and retain its prior effective state. |
| Record or decision superseded | Retain original placement, content, rationale, alternatives, findings, approvals, effective baseline, and reciprocal supersession link. |
| Canonical physical location changes | Preserve stable identity and relocation history; update the collection reference without creating a new semantic parent. |
| Prohibited grouping discovered | Remove the grouping semantics, preserve canonical IDs and history, and replace it only with a compliant secondary view if needed. |

## Historical preservation

Historical governance evidence is append-only. Prior versions, assessment baselines, traces, decisions, alternatives, rationale, impacts, review findings, dissents, approvals, rejections, withdrawals, relationships, and effective periods remain addressable as they existed at the time.

Historical content must not be overwritten to cite a newer source, display a later decision, repair an old rationale, or imply review of evidence that did not exist. Corrections are recorded as new governance events linked to the preserved original. Retention applies even when a record never became Approved or a decision was Rejected.

## Structural accountabilities

| Role | Structural accountability |
|------|---------------------------|
| Design Owner | Maintains the record entry, decision membership, baseline index, traces, relationships, review evidence, and change history. |
| Design Decision Authority | Decides design matters under the Definition Rules; does not create collection hierarchy or waive structural integrity. |
| Engineering Governance | Maintains the collection structure and controlled relationship meanings; validates identity, placement, neutrality, history, and integrity. |
| Collection reviewer | Performs inventory, duplicate, orphan, cardinality, trace, coverage, relationship, baseline, status, history, and prohibition checks. |
| Product and Business Architecture authorities | Govern meaning and changes in their sources; they do not become design owners through a trace. |

# Permitted Secondary Views

Secondary views are generated projections for navigation, review, coverage, change impact, and audit. They are not canonical structure. Every secondary view must:

1. label itself **Non-Canonical Secondary View**;
2. identify its collection snapshot, generation date, source records, and governing rule versions;
3. preserve stable IDs, exact versions, statuses, and canonical-parent references;
4. link every row or node back to its canonical record, decision, and authoritative source;
5. state grouping, filtering, sorting, relationship, and omission logic in a legend;
6. show missing, unresolved, and zero-result relationships explicitly where relevant;
7. avoid implying meaning through order, adjacency, color, size, lane, or omission;
8. prohibit edits that bypass canonical record governance; and
9. carry an explicit disclaimer that grouping does not imply architecture, ownership, delivery, priority, roadmap, or Product Scope.

Permitted views are:

| View | Permitted purpose |
|------|-------------------|
| Design Record index | Locate records by ID, version, controlled status, or approved assessment baseline. Status is not progress or priority. |
| Decision index | Locate decisions and canonical parents by controlled status, authority, or review state without creating a technical decomposition. |
| Product Scope Item coverage matrix | Reconcile each approved item with addressing decisions or explicit governed dispositions; it does not redefine Product Scope. |
| Readiness-baseline trace view | Show records authorized by an exact assessment version and expose stale or zero-result relationships. |
| Workflow or Product Story trace view | Review which records and decisions cite a governed workflow or story. |
| Actor or Business Outcome Goal trace view | Review preservation of actor and goal relationships. |
| Operational Capability trace view | Review capability evidence and reverse traces; it is not a service, component, team, or ownership map. |
| Core Business Object trace view | Review object meaning, ownership, provenance, and design use; it is not a database, schema, or data-flow view. |
| Decision relationship view | Review typed governance dependencies, constraints, conflicts, complements, and supersession; it is not an architecture or implementation dependency graph. |
| Source currency and change-impact view | Identify records, decisions, traces, and relationships affected by an authoritative change. |
| Record and decision history view | Show versions, reviews, decisions, rejections, withdrawals, effective periods, replacements, and supersession. |
| Governance-review queue | Route validation or authority review by governance responsibility only; it is not technical ownership, staffing, backlog, priority, or delivery assignment. |

Views grouped by upstream source are trace projections only. Views filtered by Design Owner or Decision Authority support governance review only. Neither may be persisted or interpreted as a canonical grouping.

# Prohibited Structures and Inferences

Neither canonical storage nor secondary views may create, group, define, select, recommend, approve, imply, or encode:

- engineering teams, frontend/backend divisions, reporting lines, staffing, or technical ownership boundaries;
- services, modules, components, packages, classes, APIs, endpoints, integrations, or interfaces;
- databases, schemas, storage, persistence, tables, fields, or data flows;
- system, solution, security, infrastructure, platform, network, deployment, or architecture layers;
- repositories, runtime boundaries, technical dependencies, invocation, execution sequence, or orchestration;
- architecture ownership, implementation ownership, delivery ownership, or deployment units;
- implementation packages, work breakdown, epics, tasks, estimates, cost, feasibility, or staffing;
- sprints, iterations, releases, phases, milestones, roadmaps, delivery sequence, or delivery progress;
- priority, rank, scoring, urgency, or scheduling;
- Product Scope, Product Scope grouping, feature grouping, or changes to inclusions, exclusions, and constraints;
- actual Engineering Design Records, Engineering Decisions, decision content, or technical solutions; or
- new or changed workflows, stories, goals, actors, capabilities, Core Business Objects, responsibilities, ownership, provenance, or boundaries.

Physical folders, file names, tags, filters, dashboards, graphs, and indexes are subject to the same prohibition. A disclaimer cannot make an otherwise prohibited grouping permissible.

Engineering Design grouping remains governance organization only. Capability, object, actor, goal, story, workflow, Product Scope Item, assessment, owner, authority, and relationship information may appear only as explicit trace or governance-review facets. Their appearance never establishes technical decomposition, ownership, delivery, priority, roadmap, or Product Scope.

# Governance Outcome

Applying this structure gives TOP one canonical, version-aware Engineering Design Collection in which each future Engineering Design Record has one direct placement, each Engineering Decision has one canonical record parent, and every affected Product Scope Item retains a complete trace through the approved Engineering Readiness baseline to authoritative business meaning.

The structure supports duplicate and orphan detection, coverage reconciliation, baseline consistency, typed cross-design relationships, change-impact review, immutable history, and controlled secondary views while creating no technical architecture, implementation or delivery organization, priority, roadmap, Product Scope, actual design record, decision, or solution.
