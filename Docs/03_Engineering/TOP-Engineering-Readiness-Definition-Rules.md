# TOP Engineering Readiness Definition Rules

Version: 1.0

Status: Active

Last Updated: 2026-08-08

Author:
TOP Engineering Governance

---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-08 | Initial governance rules for future Engineering Readiness assessments |

---

# Purpose

This document governs how future TOP Engineering Readiness assessments are proposed, evidenced, reviewed, decided, maintained, and handed downstream. **Engineering Readiness is a governed assessment layer downstream of Approved Product Scope and upstream of Engineering Design.** It determines whether approved, business-defined intent is sufficiently clear, complete, consistent, bounded, and traceable to enter Engineering Design without requiring engineers to invent product or business meaning.

Engineering Readiness preserves TOP's business-first, capability-driven, and boundary-aware principles. It assesses the quality of governed intent; it does not translate that intent into a solution.

These rules define the required evidence, assessment dimensions, controlled statuses, lifecycle, ownership, decision authority, and traceability for future assessments. They do not create any Engineering Readiness record, assess any current scope, define technical solutions, or authorize implementation or delivery.

# Position in the TOP Canon

```text
Business Architecture
  ├─ Operational Capabilities
  └─ Core Business Objects
            ↓
Product Stories + Operational Workflows
            ↓
     Approved Product Scope
            ↓
 Engineering Readiness Assessment
            ↓
      Engineering Design
```

Approved Product Scope is the immediate upstream decision authority for what is assessed. Engineering Readiness may assess only the outcomes and boundaries explicitly included in that approved scope baseline. It may not add, remove, split, combine, prioritize, defer, reinterpret, or otherwise decide engineering scope.

Product Stories and Operational Workflows supply the governed product and operational evidence behind the scope. Operational Capabilities and Core Business Objects supply the governed business meaning, responsibilities, information concepts, ownership, and boundaries that all assessment conclusions must preserve.

Engineering Readiness is not:

- a substitute for Product Scope approval;
- a product discovery, story-writing, or workflow-definition activity;
- an engineering specification or design review;
- an architecture, implementation, or technology selection gate;
- a backlog, roadmap, release, milestone, or delivery-planning mechanism;
- an estimation or staffing exercise;
- a decision about what Engineering will or will not build; or
- evidence that a solution has been designed, implemented, tested, delivered, or released.

# Authoritative Inputs

Every assessment must identify the exact approved version or baseline of each applicable input. The following inputs are upstream authority, not optional background material:

| Authoritative input | Assessment use |
|---------------------|----------------|
| **Approved Product Scope** | Establishes the exact outcome boundary, inclusions, exclusions, actors, constraints, decision context, and baseline that may be assessed. |
| **Product Stories** | Supply approved actor needs, Business Outcome Goals, Operational Outcomes, business information context, and story-level capability, object, and boundary traces. |
| **Operational Workflows** | Supply approved business activities, business-state progression, actor participation, handoffs, bounded variations, exceptions, invariants, and observable outcomes. |
| **Operational Capabilities** | Supply established business abilities, accountable roles, operational outcomes, capability relationships, and capability boundaries. |
| **Core Business Objects** | Supply established business meanings, relationships, ownership, provenance, record responsibilities, and external-source distinctions. |

The governing definition rules and structures for those records are also authoritative when determining whether evidence is approved, active, and interpretable. Assessment authors must cite the relevant source record, version, and location rather than copying source content into a new competing definition.

Each input remains authoritative only within its governed concern. Engineering Readiness must not correct or override it. When sources are missing, contradictory, ambiguous, stale, or outside their authority, the assessor records a finding and returns it to the owning upstream authority. Assumptions, engineering preference, legacy behavior, or proposed solutions must not fill the gap.

# Governing Principles

## 1. Business-first

1. Assessment begins with the approved business outcomes and observable operational evidence, never with a proposed feature or technical mechanism.
2. A readiness conclusion states whether business intent is understandable and bounded enough for design to begin; it does not state how the intent should be realized.
3. Evidence must remain understandable to business, product, and engineering reviewers without knowledge of a preferred solution.
4. Legacy behavior, current-system structure, and engineering convention are discovery observations only and cannot establish readiness or upstream meaning.

## 2. Capability-driven

1. Every assessed scope inclusion must retain a complete trace to at least one established Operational Capability.
2. Capability participation and responsibility must be sufficiently explicit to prevent Engineering Design from inventing a business ability, owner, or cross-capability relationship.
3. Capabilities remain business abilities. Assessment grouping does not turn them into components, services, modules, teams, work packages, or delivery units.
4. A missing or conflicting capability basis is an upstream finding, not permission to define a capability during assessment.

## 3. Boundary-aware

1. Actor, Business Domain, capability, Core Business Object, record, ownership, provenance, and external-authority boundaries must remain explicit and consistent.
2. Engineering Readiness cannot expand TOP's responsibility or transfer responsibility across an actor, domain, capability, or external boundary.
3. Externally governed Competition Context and participant source information must remain distinguishable from TOP-managed operational facts and trusted records.
4. Unclear ownership, provenance, handoff, or external authority is a material readiness finding; it must not be hidden by solution-shaped language.

## 4. Evidence-led and baseline-specific

1. Every result must cite approved evidence in the assessed baseline.
2. Proximity, ordering, grouping, or apparent completeness in an upstream collection is not evidence unless its governing rules give it that meaning.
3. An assessment applies only to its named Product Scope version and input baselines. It is not a permanent judgment about the underlying outcomes.
4. Reviewer confidence, preference, or feasibility intuition cannot replace cited evidence.

## 5. Assessment-only

1. Readiness identifies whether governed intent is fit to hand to Engineering Design; it creates no product, architecture, implementation, or delivery decision.
2. A `Ready` result authorizes only entry into governed Engineering Design for the assessed baseline.
3. Findings must describe missing or conflicting business or product evidence without recommending a technical solution.
4. Assessment depth must be sufficient to expose ambiguity, not so detailed that it becomes design.

# Assessment Unit and Eligibility

One Engineering Readiness assessment evaluates one exact Approved Product Scope record version in one stated decision context. A different scope version requires a new assessment version or reassessment under the change rules below.

A candidate may enter assessment only when all of the following are present:

| Eligibility condition | Required basis |
|-----------------------|----------------|
| Approved scope baseline | One Product Scope record in its controlled `Approved` status, with exact version and approval decision |
| Stable boundary | Individually identified inclusions, explicit exclusions, actors, domains, constraints, and decision context |
| Story evidence | Approved Product Story references required by each included outcome |
| Workflow evidence | Approved Operational Workflow references required by each included outcome |
| Capability evidence | Established Operational Capability references for every included outcome and relevant activity |
| Object evidence | Established Core Business Object references, meanings, ownership, and provenance wherever business information is material |
| Source availability | Reviewers can inspect the exact cited baselines and their governance status |
| Accountable owner | A named Readiness Assessment Owner and named Readiness Decision Authority |

Failure to meet an eligibility condition does not create a readiness record with an inferred baseline. The candidate remains outside assessment until the missing eligibility evidence is supplied by its upstream owner.

Assessment boundaries may be presented in trace matrices for review convenience, but such grouping does not change Product Scope, imply technical decomposition, or create delivery sequence or dependency.

# Required Readiness Evidence

Readiness evidence is approved, source-addressable upstream information that supports a result in one assessment dimension. Valid evidence must be:

- **authoritative** — owned and approved under the applicable upstream governance;
- **baseline-bound** — tied to the exact version assessed;
- **addressable** — cited by record ID and specific section, entry, activity, or relationship;
- **relevant** — directly supports the result for the dimension and scope inclusion;
- **consistent** — does not conflict with another applicable authoritative source;
- **solution-neutral** — states business or product meaning rather than a design choice; and
- **reviewable** — available to the owner, reviewers, and decision authority.

Evidence may demonstrate:

- the business outcome and observable evidence intended by an included scope item;
- the actors, goals, responsibilities, and handoffs involved;
- the normal, alternate, exception, and bounded-exit business conditions material to the outcome;
- the Operational Capabilities that enable the outcome and their retained boundaries;
- the Core Business Objects and business facts involved, including ownership and provenance;
- explicit TOP, external-authority, and out-of-scope boundaries; and
- reconciliation between scope inclusions and their supporting stories, workflows, capabilities, and objects.

The following are not readiness evidence:

- proposed architecture, prototypes, spikes, proof-of-concepts, code, or current implementation behavior;
- API descriptions, database models, service maps, UI designs, infrastructure diagrams, or vendor material;
- estimates, staffing plans, schedules, backlogs, delivery phases, or release targets;
- undocumented stakeholder expectations or reviewer recollection; and
- an assessor's proposed resolution to an upstream ambiguity.

Those materials may exist elsewhere for other purposes, but they neither cure an upstream evidence gap nor belong in a readiness conclusion.

# Assessment Dimensions

Every eligible assessment must evaluate every dimension below. A dimension cannot be marked not applicable merely because the evidence is inconvenient to obtain. Where a dimension truly has no material application, the record must cite upstream evidence and explain why.

## 1. Scope Baseline Integrity

Determine whether the Approved Product Scope version, decision context, inclusions, exclusions, constraints, approval, and authoritative-input baselines are exact, internally consistent, and available. Confirm that the assessment neither omits an inclusion nor introduces an unapproved outcome.

## 2. Outcome and Evidence Clarity

Determine whether each included outcome is stated in observable business terms and has sufficient approved story and workflow evidence to distinguish completion, bounded non-completion, and material exceptions. The assessment does not create acceptance criteria or test cases.

## 3. Actor, Goal, and Responsibility Clarity

Determine whether established actors, Business Outcome Goals, activity responsibilities, handoffs, and retained responsibilities are explicit and mutually consistent. Contextual external parties must not be promoted to TOP actors or owners.

## 4. Operational Course Completeness

Determine whether the approved workflows expose the business entry conditions, activities, state progression, handoffs, normal course, material alternate and exception courses, completion outcomes, and bounded exits necessary to understand the scoped outcomes. Completeness is operational completeness, not technical process completeness.

## 5. Capability Alignment

Determine whether every included outcome and material workflow activity traces to established Operational Capabilities, whether primary and supporting capability contributions are understandable, and whether capability responsibilities or relationships conflict. Do not infer components or engineering work boundaries from capability relationships.

## 6. Business Object and Information Clarity

Determine whether all materially involved Core Business Objects are identified using their governed meanings and whether required business facts, relationships, business-state relevance, ownership, record responsibility, and provenance are understandable. Do not request or define fields, schemas, storage, transport, or technical representations.

## 7. Boundary and Authority Integrity

Determine whether Business Domain, TOP scope, role, ownership, provenance, record, handoff, and external-authority constraints are explicit and preserved across scope, stories, and workflows. Any source conflict or implied expansion of TOP authority is material.

## 8. Cross-Source Consistency and Trace Completeness

Determine whether every inclusion can be followed bidirectionally through Product Scope, applicable Product Stories, Operational Workflows, Operational Capabilities, and Core Business Objects without missing links, orphan evidence, unauthorized reinterpretation, or contradiction. Explicit exclusions and constraints must also trace to their governing rationale and sources.

# Dimension Results and Findings

Each dimension receives exactly one result:

| Dimension result | Meaning |
|------------------|---------|
| **Satisfied** | Sufficient authoritative evidence supports the dimension for the entire assessed scope baseline, with no unresolved material finding. |
| **Finding Open** | One or more identified evidence gaps, ambiguities, inconsistencies, or boundary concerns prevent the dimension from being satisfied. |
| **Not Applicable** | Cited upstream evidence demonstrates that the dimension has no material application to this scope; rationale is mandatory. |

An assessment finding must include:

- a stable finding ID;
- the affected dimension and scope inclusion or constraint;
- exact upstream evidence examined;
- a solution-neutral statement of the gap, ambiguity, inconsistency, or boundary concern;
- materiality and the reason it would force downstream invention or uncertainty;
- the upstream owner responsible for disposition;
- current disposition and supporting authority;
- the source change or clarification required for closure, expressed without prescribing its content; and
- closure evidence, reviewer, and date when resolved.

Findings are assessment observations, not defects assigned to an engineering team and not engineering work items. The readiness owner coordinates them but may not resolve them by changing upstream meaning.

# Controlled Assessment Statuses

Every future assessment record must have exactly one status:

| Status | Meaning |
|--------|---------|
| **Draft** | The assessment identity, baselines, evidence index, or dimension analysis is being assembled. No readiness conclusion exists. |
| **In Review** | Eligibility is confirmed and the complete assessment has been submitted for governed cross-functional review. |
| **Changes Required** | Review found one or more unresolved material findings. The assessed baseline is not authorized to enter Engineering Design. |
| **Ready** | The decision authority confirms every dimension is `Satisfied` or validly `Not Applicable`, all material findings are closed, and the exact baseline may enter Engineering Design. |
| **Superseded** | A later governed assessment replaces this assessment. The historical decision and trace remain preserved. |
| **Withdrawn** | The owner or scope authority ended consideration before a `Ready` decision, with rationale recorded. The record remains historical evidence. |

`Ready` is not conditional. A material open finding requires `Changes Required`; it cannot be converted into an engineering assumption, design constraint, follow-up task, or condition attached to `Ready`.

Status does not indicate implementation progress, delivery priority, feasibility, effort, schedule confidence, release readiness, or production readiness.

# Assessment Lifecycle

## 1. Initiate

The Readiness Assessment Owner identifies the exact Approved Product Scope version, decision context, upstream baselines, decision authority, and required reviewers. Eligibility is checked before assessment work begins.

## 2. Assemble evidence

The owner creates a reference index from each scope inclusion and constraint to the applicable approved stories, workflows, capabilities, objects, and boundaries. Sources are referenced, not re-authored.

## 3. Assess dimensions

Qualified reviewers examine all dimensions, record dimension results, and raise stable findings. Reviewers describe evidence quality and business ambiguity only; they must stop and escalate when analysis would require a design choice or upstream decision.

## 4. Cross-functional review

Product, Business Architecture, and Engineering Governance reviewers verify that the assessment correctly applies their sources and remains assessment-only. Affected source owners validate findings within their authority.

## 5. Decide

The Readiness Decision Authority records `Ready` only when all gates pass. Otherwise the authority records `Changes Required`, or the owner withdraws the assessment with an authorized rationale. The decision cites the exact baseline and all dimension results.

## 6. Return findings upstream

Each open finding is routed to the authority that owns the affected Product Scope, Product Story, Operational Workflow, Operational Capability, or Core Business Object source. Upstream governance decides whether and how its source changes. Engineering Readiness does not draft the substantive resolution as a technical answer.

## 7. Reassess

After upstream disposition, the owner verifies the new approved source baseline, reevaluates every affected dimension and trace, and resubmits the whole assessment decision. Closure of one finding does not automatically establish overall readiness.

## 8. Hand off and preserve

A `Ready` assessment may be handed to Engineering Design together with its exact Product Scope and source baselines. The immutable decision, evidence index, findings, reviews, and history remain available for audit. Engineering Design receives authority to design against the baseline, not authority to change it.

# Decision Gates

The Readiness Decision Authority must confirm all gates before setting `Ready`:

1. **Eligibility gate** — the scope and every required upstream source have the required approved status and exact baseline.
2. **Coverage gate** — every scope inclusion and applicable constraint appears in the assessment evidence index.
3. **Evidence gate** — every result is supported by authoritative, addressable, solution-neutral evidence.
4. **Consistency gate** — no unresolved contradiction exists within or between authoritative sources.
5. **Capability gate** — all included outcomes and material workflow activities preserve established capability meaning and responsibility.
6. **Object gate** — material business information preserves established object meaning, ownership, provenance, and record responsibility.
7. **Boundary gate** — actor, domain, TOP, external-authority, handoff, ownership, and exclusion boundaries remain intact.
8. **No-invention gate** — Engineering Design can begin without inventing business outcomes, product behavior, responsibility, authority, or scope.
9. **Prohibition gate** — the assessment contains no prohibited design, architecture, implementation, delivery, estimation, or engineering-scope decision.
10. **Finding gate** — all material findings are closed by the appropriate upstream authority and verified against an approved baseline.

Failure at any gate requires `Changes Required`; it must not be waived through a solution proposal.

# Ownership and Decision Authority

| Role | Accountability |
|------|----------------|
| **Product Scope Owner** | Maintains and interprets the Approved Product Scope within Product governance; decides scope changes through the upstream process. |
| **Product Story and Workflow Owners** | Maintain and clarify their approved records through Product governance; they do not approve readiness alone. |
| **Business Architecture Owners** | Maintain Operational Capabilities, Core Business Objects, Business Domains, ownership, provenance, and external-authority boundaries. |
| **Readiness Assessment Owner** | Maintains assessment integrity, baselines, evidence index, review coordination, findings, status history, and handoff package; cannot change upstream authority. |
| **Engineering Governance Reviewer** | Tests whether evidence is sufficient for design entry and whether the assessment avoids technical or delivery decisions; does not select a solution. |
| **Product Governance Reviewer** | Confirms correct use of scope, story, workflow, actor, goal, and outcome evidence. |
| **Business Architecture Reviewer** | Confirms correct use of capabilities, objects, responsibilities, ownership, provenance, and boundaries. |
| **Readiness Decision Authority** | Makes the governed readiness-status decision after reviewing gate results; cannot approve Product Scope or technical design through this role. |

The Readiness Assessment Owner and Readiness Decision Authority must be named for every assessment. Where one person holds multiple roles, the record must still distinguish each authority and decision. A source owner cannot make a conflicting source ready merely by approving the assessment; source correction remains subject to its own governance.

# Required Record Structure

Any future Engineering Readiness assessment record must contain the fields below. This schema governs future records only; this document does not instantiate one.

## Identity and governance

| Field | Rule |
|-------|------|
| Assessment ID | Stable, unique, and never reused. |
| Title and decision context | Business-oriented identification of the assessed scope context; not a feature, release, or technical initiative. |
| Version and status | Controlled assessment version and exactly one lifecycle status. |
| Approved Product Scope baseline | Exact scope ID, version, approval status, decision, and authority. |
| Assessment owner and decision authority | Named accountable roles. |
| Reviewers | Named reviewers and the authority represented by each. |
| Dates | Creation, review, decision, reassessment, and supersession dates as applicable. |

## Evidence and analysis

| Field | Rule |
|-------|------|
| Source baseline index | Exact Product Scope, Product Story, Operational Workflow, Operational Capability, and Core Business Object sources and versions. |
| Scope coverage index | Every inclusion, exclusion, and constraint reconciled to its evidence. |
| Trace matrix | Bidirectional, source-addressable trace across all required upstream authority. |
| Dimension results | One result, rationale, evidence citations, reviewer, and date for every dimension. |
| Findings register | Stable findings and their materiality, owner, disposition, and closure evidence. |
| Assumption register | Upstream assumptions already authorized by their source, with expiry or review condition; assessment-created assumptions cannot support `Ready`. |
| Review record | Comments, responses, reviewer authority, and approval or dissent. |

## Decision and history

| Field | Rule |
|-------|------|
| Gate results | Explicit pass or fail with evidence for every decision gate. |
| Readiness decision | Status, exact baseline, rationale, authority, and date. |
| Upstream referrals | Findings returned to source owners and their governed dispositions. |
| Handoff reference | For `Ready` only, identifies the immutable evidence package supplied to Engineering Design without adding design instructions. |
| Change history | Prior versions, baseline changes, reassessment impact, status transitions, and superseding relationships. |

# Traceability Rules

1. Every assessed scope inclusion must trace to its Approved Product Scope entry, all applicable approved Product Stories and Operational Workflows, at least one established Operational Capability, and every materially relevant Core Business Object.
2. Every trace must identify exact record versions and addressable locations; document titles alone are insufficient.
3. Traces must be bidirectional: reviewers must be able to navigate from a scope inclusion to its evidence and from cited evidence back to the inclusion and dimension result that uses it.
4. Every scope exclusion and boundary constraint must trace to its approved rationale and governing authority where applicable.
5. Every dimension result and finding must cite the evidence examined. Silence is not evidence.
6. A trace records a governed semantic relationship only. It does not imply technical dependency, invocation, data flow, component ownership, work sequencing, or delivery coupling.
7. Copied prose does not replace a source reference and must not become a forked definition.
8. When an upstream record is superseded, its historical trace remains immutable; reassessment points to the new baseline rather than rewriting the prior decision.

# Change, Reassessment, and Supersession

Any change to the assessed Product Scope baseline invalidates the applicability of the existing `Ready` decision to the changed baseline. The existing assessment remains historical and must not be edited to imply that it assessed content it did not examine.

Reassessment is required when:

- the Approved Product Scope version changes;
- a cited Product Story or Operational Workflow changes materially;
- a cited Operational Capability, Core Business Object, ownership rule, provenance rule, or boundary changes;
- an authoritative source is withdrawn or superseded;
- a material contradiction or missing trace is discovered; or
- Engineering Design identifies that it must invent business or product meaning to proceed.

The owner performs impact analysis across all dimensions and traces. A new assessment version may reuse still-valid citations, but every affected result and gate must be reviewed again. A replacement decision sets the previous assessment to `Superseded`; it does not erase history.

Engineering feedback may identify an evidence problem and trigger reassessment. It cannot change Product Scope, close an upstream finding, or amend business meaning from inside Engineering Design.

# Explicitly Prohibited Content and Decisions

Engineering Readiness assessments, findings, decisions, and handoffs must not define, select, recommend, imply, approve, reject, prioritize, or constrain any of the following:

- implementation design or technical solutions;
- APIs, endpoints, protocols, messages, integrations, or interface contracts;
- databases, schemas, tables, fields, persistence, queries, or data migrations;
- services, modules, components, classes, jobs, events, or technical boundaries;
- UI, screens, pages, controls, navigation, interaction patterns, devices, or presentation;
- system or solution architecture, infrastructure, topology, hosting, vendors, platforms, frameworks, security mechanisms, deployment, or operations design;
- algorithms, automation choices, state machines, transaction boundaries, concurrency, retries, performance mechanisms, or other runtime behavior;
- delivery planning, roadmaps, releases, milestones, work breakdown, sequencing, staffing, assignments, or schedules;
- estimates, effort, cost, capacity, duration, feasibility scoring, or delivery confidence; or
- engineering scope decisions, including what Engineering will build, defer, split, combine, substitute, or omit.

The assessment must also not create or alter a Product Story, Operational Workflow, Operational Capability, Core Business Object, actor, Business Outcome Goal, Business Domain, ownership rule, provenance rule, or Product Scope decision.

Phrases such as “could be implemented by,” “requires a service,” “simple change,” “technical dependency,” “phase one,” or “engineering should include” are prohibited because they make or bias downstream decisions. Findings must instead identify the precise upstream meaning or evidence that is absent, conflicting, or insufficient.

If reviewers believe a technical investigation is needed, that observation belongs to a later governed engineering process after readiness. It cannot serve as readiness evidence or be made a condition that silently transfers an upstream ambiguity into design.

# Downstream Handoff Contract

A `Ready` handoff supplies Engineering Design with:

- the exact Approved Product Scope baseline;
- the exact authoritative source baseline index;
- the completed trace matrix and dimension results;
- the decision-gate record and closed-findings history; and
- the applicable business and product boundaries Engineering Design must preserve.

The handoff means only that governed intent is sufficiently ready to be considered by Engineering Design. Engineering Design remains responsible for its own governed decisions and must not treat readiness grouping as architecture, scope entries as components, workflow order as orchestration, business objects as data models, or capability boundaries as service boundaries.

If design work exposes a missing business outcome, ambiguous product behavior, conflicting authority, or absent boundary, work on the affected question returns to Engineering Readiness and the appropriate upstream owner. Engineering must not resolve the issue by assumption or by choosing a technical solution that creates new business meaning.

# Governance Outcome

Applied correctly, these rules provide a repeatable, auditable answer to one narrow question:

> Is this exact Approved Product Scope baseline supported by sufficiently clear, complete, consistent, bounded, and traceable business and product authority to enter Engineering Design without invention?

They intentionally provide no answer about solution design, technical feasibility, delivery, estimates, or engineering scope. Those concerns cannot be used to redefine Engineering Readiness or bypass the upstream authorities it protects.
