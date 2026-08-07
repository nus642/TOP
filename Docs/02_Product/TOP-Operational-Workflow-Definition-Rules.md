# TOP Operational Workflow Definition Rules

Version: 1.0

Status: Active

Last Updated: 2026-08-07

Author:
TOP Product Team

---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-07 | Initial governance rules for future TOP Operational Workflows |

---

# Purpose

This document governs how future TOP Operational Workflows are defined, reviewed, maintained, and handed downstream. It establishes the conditions under which a proposed workflow is a valid Product Layer description of how established actors achieve an established Business Outcome Goal through business activity.

These rules keep workflows business-first, capability-driven, and boundary-aware. They do not define any actual workflow, approve Product Scope, or authorize design or implementation.

# Position in the TOP Product Canon

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

An Operational Workflow is downstream of established actors, goals, and governed Product Stories. It organizes validated business needs into an understandable operational course without changing their meaning. It is upstream of Product Scope and Engineering Design and does not decide either one.

The authoritative inputs are:

- `TOP-Product-Layer-Definition.md` for Product Layer responsibilities, translation principles, and exclusions;
- `TOP-Product-Actor-and-Goal-Model.md` for established actors, Business Outcome Goals, outcome evidence, responsibilities, and boundaries;
- `TOP-Product-Story-Definition-Rules.md` for story identity, business need, Operational Outcome, capability, object, and boundary traces; and
- `TOP-Initial-Product-Story-Map.md` for the initial governed story records and their canonical Actor → Goal → Theme placement.

Operational Capability and Core Business Object references inherited through those inputs remain governed by their Business Architecture sources. A workflow may compose established product intent, but it may not redefine an actor, goal, story, capability, business object, ownership rule, or source authority.

If a proposed workflow conflicts with an authoritative input, the input prevails. The conflict must be returned to the authority that owns the affected source; workflow authors must not resolve it by silently altering upstream meaning.

# Workflow Purpose

A **TOP Operational Workflow** is a governed, implementation-neutral Product Layer description of the business activities, actor participation, business-state progression, handoffs, and bounded variations through which one primary actor pursues one established Business Outcome Goal using approved Product Stories and established Operational Capabilities.

A workflow exists to:

- make the operational course for achieving a goal understandable from the business and actor perspective;
- show how approved story needs contribute at meaningful points in that course;
- make actor responsibility and cross-boundary handoffs explicit;
- describe relevant business conditions and observable business-state changes;
- identify bounded alternate and exception courses that materially affect goal achievement; and
- provide traceable, solution-neutral intent for later Product Scope and Engineering Design work.

A workflow is not:

- an inventory, substitute, or approval mechanism for Product Stories;
- a feature, Product Scope, roadmap, release, or delivery commitment;
- a screen flow, navigation flow, wireframe, or interaction specification;
- a technical process, service orchestration, state machine, integration sequence, or data pipeline;
- an operating procedure detailed to the level of interface actions or system commands;
- a permission or authorization design;
- an acceptance test, readiness plan, or engineering specification; or
- authority to change business responsibility, ownership, provenance, or external governance.

# Governing Principles

## 1. Business-first

1. A workflow begins with an established actor's Business Outcome Goal, not with a feature, page, system, or current implementation.
2. Activities state business intent and observable business progress in the language of the Product Canon.
3. The workflow must remain understandable to product and business reviewers without requiring knowledge of a proposed solution.
4. Every included activity must contribute to the primary goal or be necessary to preserve a stated business boundary, handoff, or exception response.
5. Legacy behavior and stakeholder preference are discovery evidence only; neither becomes canonical merely by being represented in a workflow.

## 2. Capability-driven

1. Every workflow must trace to at least one established Operational Capability, with one identified as primary.
2. Every activity must be enabled by a cited workflow capability and supported by at least one governed Product Story.
3. Supporting capabilities may participate only when necessary to the same end-to-end business outcome; implementation convenience is not sufficient.
4. Capabilities remain business abilities. Their placement or order in a workflow does not turn them into modules, services, components, or delivery units.
5. If the required business activity is not supported by an established capability, workflow definition stops at that point and the gap is escalated to Business Architecture.

## 3. Boundary-aware

1. Actor, domain, capability, business-object, and record responsibilities remain those established upstream.
2. A handoff coordinates responsibility; it does not transfer ownership unless an authoritative source explicitly says so.
3. Cross-domain participation must identify which actor and capability remain responsible on each side of the boundary.
4. Externally governed Competition Context and participant source information must remain distinguishable from TOP-managed operational facts.
5. A workflow must not make TOP the authority for registration, qualification, eligibility, payment, ranking, legal, insurance, regulatory, media production, publishing, streaming, broadcast operation, audience distribution, or the complete tournament lifecycle.
6. An unclear ownership, provenance, or external-authority boundary prevents workflow approval.

# Workflow Eligibility and Identity

## Eligibility rules

A candidate may enter workflow definition only when all of the following are known:

| Eligibility condition | Required basis |
|-----------------------|----------------|
| Primary actor | Exactly one active actor from the Product Actor and Goal Model |
| Primary goal | Exactly one active Business Outcome Goal owned by the primary actor |
| Goal evidence | The established observable evidence to which the workflow contributes |
| Story basis | At least one Approved Product Story assigned to that actor and goal |
| Capability basis | At least one established Operational Capability, with one marked primary |
| Operational span | A coherent business course with a meaningful entry condition and outcome or bounded exit |
| Business context | Relevant established Core Business Objects used with their governed meanings |
| Boundary basis | Applicable responsibility, ownership, provenance, and external-authority constraints |

A candidate is returned for clarification when it lacks any required basis, merely restates one story without a meaningful operational course, combines independent goals, or exists mainly to prescribe UI or technical behavior.

## Workflow identity

Each workflow has one stable identity and one primary Actor → Goal anchor. Supporting actors and capabilities do not create additional canonical anchors.

A candidate must be separated when it:

- pursues independently valuable goals;
- gives two or more actors distinct primary outcomes;
- combines operational courses only because a proposed solution would deliver them together; or
- cannot state one coherent entry-to-outcome purpose without using unrelated branches.

Separation is a Product Layer governance decision. It does not imply separate products, features, services, releases, or implementations.

# Workflow Record Requirements

Every future Operational Workflow must have a stable governance record containing all fields below. A diagram may present the record, but it may not replace or omit the governed information.

## Identity and governance fields

| Field | Rule |
|-------|------|
| Workflow ID | Required, stable, and unique. It must never be reused for a materially different operational purpose. |
| Workflow name | Required concise business name; it must not be a feature, screen, module, or system name. |
| Version | Required controlled record version. |
| Status | One controlled lifecycle status defined by this document. |
| Purpose | Required implementation-neutral statement of the goal-directed business outcome explained by the workflow. |
| Primary actor | Exactly one established actor. |
| Primary Business Outcome Goal | Exactly one active goal ID owned by the primary actor. |
| Outcome evidence | Required reference to the goal's established outcome evidence and an explanation of the workflow's contribution. |
| Source baseline | Exact source documents, versions or dates, sections or rows, and story collection snapshot used for review. |
| Owner and review authority | Product governance roles accountable for maintaining and approving the record; this field does not assign operational or technical ownership. |
| Change history | Prior versions, statuses, rationale, impacted traces, and superseding relationships. |

## Operational definition fields

| Field | Rule |
|-------|------|
| Entry condition | Observable business condition under which the workflow becomes relevant; not a UI trigger or technical event. |
| Completion outcome | Observable business state demonstrating contribution to the goal; not acceptance criteria or a system response. |
| Bounded exits | Incomplete, deferred, transferred, or otherwise non-completion outcomes that must remain understandable, with business rationale. |
| Participating actors | Established actors involved, each with the responsibility retained during participation. Contextual external parties must be identified as such rather than promoted to TOP actors. |
| Primary capability | One established Operational Capability that principally enables the workflow. |
| Supporting capabilities | Optional established capabilities, each with a necessity and responsibility rationale. |
| Business object context | Every established Core Business Object materially used or affected, its role in the workflow, and the applicable ownership or provenance rule. |
| Preconditions | Business facts or states that must already hold. They must not prescribe screens, permissions, storage, or technical validation. |
| Business activities | Ordered, uniquely identified, outcome-oriented activities at a level necessary to understand operational progress. |
| Activity responsibility | One responsible established actor for each activity, plus contextual participants where needed. |
| Business-state progression | Relevant observable state before and after each activity, expressed in business terms. |
| Handoffs | Transfer of attention, information, or next responsibility between established actors or authorities, with the retained responsibility on each side explicit. |
| Decision conditions | Business conditions that select a bounded course. They must not be interface rules, algorithms, or implementation logic. |
| Alternate courses | Material, valid variations that still pursue the same primary goal. |
| Exception courses | Material conditions that interrupt or prevent the normal course and the business response needed within established responsibility. |
| Operational invariants | Business truths and boundaries that must hold throughout every course. |
| Open questions | Unresolved product ambiguity. Any unresolved purpose, traceability, or boundary question prevents approval. |

## Traceability fields

| Field | Rule |
|-------|------|
| Story trace | Every activity cites at least one Approved Product Story; every story claimed by the workflow maps to at least one activity or a documented workflow-wide invariant. |
| Goal trace | The workflow cites its primary goal, goal evidence, and the contribution made by completion and bounded exits. |
| Capability trace | Workflow and activity relationships to the primary and supporting Operational Capabilities are explicit. |
| Business object trace | Object use, business-state relevance, ownership, and provenance are explicit at the activities where they matter. |
| Boundary trace | Actor, domain, record, handoff, and external-authority constraints cite their governing evidence. |
| Relationship trace | Optional relationships to other workflows identify only a business-context relationship and explicitly state that they do not imply scope, sequence, dependency, or technical invocation. |

# Activity, Sequence, and Course Rules

## Business activity rules

Each activity must:

- have a stable identifier within the workflow version;
- name a business action or assessment and its intended operational contribution;
- identify one responsible established actor;
- cite at least one Approved Product Story and one established capability;
- identify relevant business-object context where business information is used or affected;
- make any handoff or boundary crossing visible; and
- remain valid across reasonable future solution choices.

An activity must not name a click, page, form, field, message protocol, API call, service operation, database action, scheduled job, device behavior, or other selected implementation mechanism.

## Sequence semantics

Ordering expresses only the business precedence needed to understand the operational course. It does not prescribe:

- screen order or navigation;
- synchronous or asynchronous execution;
- manual or automated implementation;
- technical event order, transaction boundaries, or service calls;
- timing, performance, retry, or concurrency behavior; or
- delivery dependency or release sequence.

Concurrency, repetition, waiting, and optionality may be expressed only when they are meaningful business conditions. The record must use plain business semantics and must not select an orchestration design.

## Normal, alternate, and exception courses

1. One normal course describes a representative valid path from entry condition to completion outcome.
2. Alternate courses are recorded only for materially different business conditions; cosmetic or implementation variations are excluded.
3. Exception courses describe the business effect, responsible response, and bounded exit or re-entry condition. They do not prescribe error handling, retries, alerts, or recovery architecture.
4. All courses preserve the same primary actor, goal, and workflow identity. A branch that pursues another primary goal requires separate workflow consideration.
5. A course may reference another governed workflow only by stable ID and stated business relationship. It may not duplicate that workflow or imply technical invocation.

# Actor, Handoff, and Information Rules

## Actor participation

1. The primary actor owns the goal pursued by the workflow; this does not make that actor responsible for every activity.
2. Every participating actor must already exist in the active Actor and Goal Model.
3. Each activity and handoff must preserve the responsibility attributed to its actor by the governing sources.
4. A contextual party or external authority may be acknowledged at a boundary but must not be assigned a TOP actor identity, TOP-owned goal, or TOP-owned operational responsibility.

## Handoffs

A handoff record must state:

- the business condition requiring the handoff;
- the established actor or external authority on each side;
- the business information or responsibility made available for the next activity;
- the responsibility retained by the originating party;
- the responsibility accepted by the receiving party, when established upstream; and
- the relevant story, capability, object, ownership, provenance, and boundary sources.

The existence of a handoff does not imply a notification, queue, integration, API, approval control, message, or transfer of record ownership.

## Business objects and information

1. Workflow records use only established Core Business Objects and meanings.
2. Business-state progression describes operational meaning, not a data model or technical state machine.
3. Object relationships do not imply schemas, aggregates, services, modules, interfaces, or transaction boundaries.
4. Externally sourced information retains its source authority and required provenance throughout the workflow.
5. TOP-managed operational facts remain distinguishable from external definitions and source information.
6. Reading, using, confirming, recording, or handing off information does not by itself change object or record ownership.

# Traceability Requirements

## Forward traceability

Every workflow must support traversal of:

```text
Operational Capability
        → Actor
        → Business Outcome Goal and outcome evidence
        → Approved Product Story
        → Workflow
        → Activity / course / invariant
        → Business Object and boundary evidence
```

The workflow record must additionally show how entry conditions, completion outcomes, bounded exits, handoffs, alternate courses, and exception courses relate to their activities and source evidence.

## Reverse traceability

The governed workflow collection must permit reviewers to determine:

```text
Actor or Goal → referencing Workflow IDs, including none
Approved Product Story → Workflow and Activity IDs, including none
Operational Capability → Workflow and Activity IDs, including none
Core Business Object → Workflow and Activity IDs, including none
Source reference → dependent Workflow IDs
Workflow ID → exactly one primary Actor and Goal
Activity ID → responsible Actor, Story ID, Capability, and relevant object context
```

Missing and zero-result reverse traces must be reported explicitly. They must not be filled by inventing a workflow or interpreted automatically as a defect.

## Traceability integrity

1. Every cited actor, goal, story, capability, and business object must resolve to an active authoritative record at the source baseline.
2. Only Approved stories may support an Approved workflow.
3. The actor, goal, capability, object, and boundary meaning copied into a workflow must agree with the source.
4. Every activity must have complete actor, story, and capability traces.
5. Every claimed story must have a justified activity or invariant relationship; incidental citation is prohibited.
6. Upstream status or semantic changes make affected workflow traces subject to impact review.
7. Traceability demonstrates derivation and consistency. It does not prove Product Scope, priority, completeness, readiness, or implementability.

# Quality Criteria and Approval

## Review sequence

Reviewers must apply these gates in order:

1. **Source gate** — confirm the declared source baseline and all cited records resolve.
2. **Purpose gate** — confirm one primary actor, one owned goal, a coherent operational span, and clear outcome contribution.
3. **Story gate** — confirm all supporting stories are Approved, relevant, and used without altered meaning.
4. **Capability gate** — confirm the primary and supporting capabilities exist and genuinely enable the workflow and its activities.
5. **Operational coherence gate** — confirm entry, activity progression, decision conditions, outcomes, and bounded exits form an understandable business course.
6. **Actor and handoff gate** — confirm every activity has one responsible actor and every handoff preserves responsibility.
7. **Object and provenance gate** — confirm object meanings, business states, ownership, record responsibility, and provenance are accurate.
8. **Boundary gate** — confirm domain, TOP-scope, and external-authority limits hold on every course.
9. **Neutrality gate** — confirm the record contains no UI flow, screen, technical orchestration, Product Scope, or Engineering Design decision.
10. **Traceability gate** — confirm forward and reverse relationships are complete, resolvable, and non-divergent.
11. **Completeness gate** — confirm every required record field, course, rationale, source, review finding, and open-question disposition is present.

Failure at any gate returns the candidate for correction, clarification, separation, or upstream escalation. Reviewers must not fill a gap by assuming a feature or technical solution.

## Definition-ready checklist

A workflow may be marked **Approved** only when every answer is yes:

- Does it have one stable identity, one established primary actor, and one active goal owned by that actor?
- Does its purpose explain a business outcome contribution rather than a product or technical solution?
- Are entry, completion, and bounded-exit conditions observable in business terms?
- Does every activity contribute to the primary goal or a necessary boundary, handoff, or exception response?
- Is every activity supported by at least one Approved story and an established capability?
- Are primary and supporting capabilities necessary and used within their established boundaries?
- Are actor participation, responsibility, and handoffs explicit and consistent with the Actor and Goal Model?
- Are normal, alternate, and exception courses coherent, bounded, and relevant?
- Are business-state changes expressed without defining a data model or technical state machine?
- Are all material Core Business Objects and provenance relationships traced accurately?
- Are TOP-managed facts and external authority clearly distinguished?
- Is the record free of actual UI flows, screens, interaction mechanics, and technical orchestration?
- Is the record free of Product Scope, priority, roadmap, release, and Engineering Design decisions?
- Are all required forward and reverse traces complete and resolvable?
- Are source versions, review evidence, and change history recorded?
- Are there no unresolved purpose, identity, traceability, responsibility, ownership, provenance, or boundary questions?

Approval validates workflow-definition quality only. It does not approve Product Scope, readiness, architecture, implementation, or delivery.

## Quality characteristics

An Approved workflow must be:

| Characteristic | Required evidence |
|----------------|-------------------|
| Business-valid | Purpose, activities, and outcomes use established business meaning and contribute to the cited goal evidence. |
| Capability-grounded | Workflow and activity capability traces are complete and do not enlarge or relocate capabilities. |
| Actor-accountable | Every activity and handoff has clear, established responsibility. |
| Operationally coherent | Entry, progression, conditions, variations, exceptions, and exits can be understood without solution assumptions. |
| Boundary-safe | Domain, ownership, record, provenance, TOP-scope, and external-authority constraints hold across all courses. |
| Traceable | Forward and reverse relationships resolve to authoritative records and review evidence. |
| Implementation-neutral | Reasonable UI and engineering alternatives remain open. |
| Maintainable | Stable identity, controlled status, version history, and change-impact evidence are retained. |

# Boundary Protection

## Prohibited workflow content

No workflow or workflow record may define or imply:

- a new actor, goal, business domain, Operational Capability, Product Story, or Core Business Object;
- a change in capability, object, record, or operational ownership;
- actual Product Scope, feature packaging, priority, roadmap position, release, milestone, or delivery dependency;
- screens, pages, dashboards, forms, controls, fields, layouts, navigation, gestures, or UI state;
- click paths, interaction scripts, wireflows, prototypes, or other UI flows;
- services, APIs, endpoints, modules, databases, tables, events, messages, queues, jobs, integrations, devices, infrastructure, deployment, or technical orchestration;
- algorithms, technical state machines, transaction boundaries, retries, concurrency controls, performance targets, or engineering error handling;
- roles or permissions beyond the business actor and responsibility model;
- acceptance tests, test cases, engineering readiness gates, or validation plans; or
- TOP authority over responsibilities explicitly retained by an external party.

## Vocabulary protection

Workflow authors must use business verbs such as understand, establish, coordinate, confirm, conduct, preserve, and use only with their governed business meanings. Solution-selected verbs such as click, upload, render, call, query, publish, sync, persist, enqueue, or deploy are prohibited when they prescribe how an activity occurs.

Names such as page, portal, dashboard, engine, service, API, database, and integration must not be used as substitutes for an actor, activity, capability, business object, or handoff.

## Escalation rule

When a workflow exposes an apparent gap or conflict:

| Finding | Required disposition |
|---------|----------------------|
| Missing or conflicting actor or goal | Return to Product Actor and Goal governance. |
| Missing, unapproved, or conflicting story | Return to Product Story governance; do not create or approve a story inside the workflow. |
| Missing or conflicting capability, object meaning, ownership, or domain boundary | Escalate to Business Architecture. |
| Unclear external authority or provenance | Pause approval and obtain an authoritative boundary decision. |
| Desired feature or Product Scope decision | Refer to later Product Scope governance without recording it as workflow fact. |
| UI or technical question | Defer to later design work after product intent is approved. |

# Lifecycle and Change Control

## Controlled statuses

| Status | Meaning |
|--------|---------|
| Candidate | Captured for governance review; not yet validated. |
| In Review | Being evaluated against all workflow gates. |
| Approved | Meets these definition rules; no scope or implementation approval is implied. |
| Returned | Requires correction, clarification, separation, or upstream disposition. |
| Retired | No longer current; retained for history and traceability. |

## Change rules

1. Changes to purpose, primary actor, primary goal, or fundamental operational span create a new Workflow ID; the prior record is retired rather than repurposed.
2. A clarification that preserves identity retains the Workflow ID, increments the version, and requires renewed review of every gate.
3. Adding, removing, reordering, or changing an activity, course, condition, handoff, invariant, or bounded exit requires trace and boundary impact review.
4. An upstream source change requires impact review of every dependent workflow. Affected Approved workflows become `In Review` or `Returned` when continuing validity cannot immediately be demonstrated.
5. A story losing Approved status prevents an affected workflow from remaining Approved until the trace is validly restored or removed through change review.
6. Historical versions, status changes, rationale, findings, superseding relationships, and source baselines must be retained.
7. Workflow approval and change approval remain separate from Product Scope, prioritization, readiness, Engineering Design, and delivery authorization.

## Review evidence

Every completed review records:

- review date and reviewing authority;
- workflow ID, version, and proposed status;
- exact authoritative source baseline and story snapshot;
- the result of every quality gate;
- traceability reconciliation results, including missing and zero-result traces where relevant;
- boundary, provenance, handoff, alternate-course, and exception-course findings;
- changes from the prior version and affected upstream and downstream relationships;
- unresolved matters, disposition, rationale, and required follow-up; and
- confirmation that the review did not approve Product Scope, UI, technical orchestration, or Engineering Design.

# Explicit Exclusions

This document does not define:

- any actual Operational Workflow, workflow activity, handoff, decision, alternate course, or exception course;
- any actual UI flow, screen, control, navigation, interaction, or presentation;
- any technical process, orchestration, service interaction, data flow, event flow, or implementation sequence;
- any Product Scope, feature, priority, roadmap, release, commitment, or delivery order;
- any engineering architecture, module, API, database, integration, infrastructure, or deployment design;
- any new or changed actor, goal, story, capability, domain, business object, ownership rule, or external authority; or
- any acceptance criteria, test plan, readiness gate, or implementation authorization.

Placeholders, record schemas, and semantic rules in this document illustrate governance structure only. They must not be interpreted as a TOP operational course.

# Governance Outcome

Applying these rules ensures that future TOP Operational Workflows describe how established actors pursue established business outcomes through coherent, capability-grounded activity; preserve responsibility, ownership, provenance, and external-authority boundaries; remain traceable to Approved Product Stories and their sources; and provide implementation-neutral input to later Product Scope and Engineering Design without pre-empting either.
