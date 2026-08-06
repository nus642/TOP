# TOP Product Story Definition Rules

Version: 1.1

Status: Active

Last Updated: 2026-08-06

Author:
TOP Product Team

---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-08-06 | Clarified the Product Canon position and added Operational Outcome and mandatory Business Object context rules |
| 1.0 | 2026-08-06 | Initial governance rules for future TOP Product Stories |

---

# Purpose

This document governs how future TOP Product Stories are defined, reviewed, maintained, and handed downstream. It establishes the conditions under which a proposed story is a valid Product Layer expression of business intent.

The rules keep stories business-first, capability-driven, and boundary-aware. They do not create Product Stories or authorize product scope.

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

PR #55 defines the Actor and Business Outcome Goal positions in this canon. This document defines the rules for deriving Product Stories from those established positions and their Operational Capability source. It does not define any Product Stories.

Operational Workflows and Product Scope are later, separate Product Layer artifacts. A Product Story neither defines those artifacts nor implies their content, approval, or sequence. These rules do not make stories part of the Actor and Goal Model, and they do not change the authority of any upstream source.

The authoritative inputs are:

- `TOP-Product-Layer-Definition.md` for Product Layer responsibilities, translation principles, and exclusions;
- `TOP-Product-Actor-and-Goal-Model.md` for the established actors, Business Outcome Goals, evidence, and future-story traceability requirement;
- `TOP-Operational-Capability-Model.md` for operational value, roles, responsibilities, capability boundaries, and external-authority guardrails; and
- `TOP-Core-Business-Object-Model.md` for business meaning, relationships, ownership, reference, and provenance principles.

If a proposed story conflicts with an authoritative input, the input prevails. The conflict must be returned to the appropriate Product or Business Architecture authority; it must not be resolved by silently changing the story's actor, goal, capability, object meaning, ownership, or boundary.

# Product Story Definition

A **TOP Product Story** is a concise, implementation-neutral statement of a validated need through which an established product actor contributes to an established Business Outcome Goal, using an established operational capability within TOP's business boundaries.

A Product Story defines **needed business value**, not a solution. It is a governed Product Layer artifact and is not:

- a Business Outcome Goal;
- an Operational Capability;
- a feature or product commitment;
- a workflow or process definition;
- a user-interface requirement;
- an acceptance test or test case;
- an engineering requirement or design; or
- evidence that an initiative or increment has approved scope.

# Governing Principles

## 1. Business-first

1. A story must begin with an established actor's business need and intended business value.
2. The value must contribute to one identified Business Outcome Goal and its outcome evidence.
3. The story must use the business language and meanings established by the source models.
4. A story must describe a need, not convert current system behavior, a legacy page, a proposed feature, or a preferred solution into assumed business intent.
5. A story is not valid merely because a stakeholder requests it; its business derivation and boundary compliance must also be demonstrated.

## 2. Capability-driven

1. Every story must trace to at least one established Operational Capability that enables the need.
2. One capability must be identified as the **primary capability**. Additional capabilities may be cited only when the same indivisible need genuinely depends on them.
3. Capability names express operational value, not components. They must not be treated as implied applications, modules, services, interfaces, or delivery units.
4. A story must not invent a capability, enlarge a capability's stated outcome, or transfer it to another actor or business domain.
5. If no established capability supports the need, story definition stops and the gap returns to Business Architecture for disposition.

## 3. Boundary-aware

1. A story must preserve established actor responsibilities, domain responsibilities, object meaning, object and record ownership, and external authority.
2. Mentioning, viewing, using, supplying, retaining, or producing business information does not by itself change who owns or governs it.
3. Cross-domain needs may coordinate established outcomes and handoffs, but they must not merge domains or obscure which capability and actor hold each responsibility.
4. TOP-owned operational facts must remain distinguishable from externally governed Competition Context and participant source information.
5. A story must not expand TOP into registration authority, ranking authority, media production or distribution, or complete tournament lifecycle management.

# Story Eligibility Rules

A candidate may enter Product Story definition only when all of the following are known:

| Eligibility condition | Required basis |
|-----------------------|----------------|
| Actor | Exactly one primary actor established in the Product Actor and Goal Model |
| Goal | Exactly one primary Business Outcome Goal assigned to that actor |
| Need | A distinct need necessary to contribute to the goal |
| Value | An observable business contribution consistent with the goal's outcome evidence |
| Operational outcome | The observable business state or result after the need is satisfied |
| Capability | At least one established Operational Capability, with one marked primary |
| Business context | At least one established Core Business Object used with its established meaning |
| Boundary | Applicable ownership, responsibility, provenance, and external-authority constraints |

A candidate is ineligible when it:

- lacks any required basis above;
- combines unrelated needs or outcomes;
- depends on changing an upstream model;
- exists only to prescribe a feature, UI, workflow, data structure, interface, technical behavior, or delivery approach; or
- cannot state business value without referring to a proposed solution.

Ineligibility means **return for clarification**, not permission to infer missing business intent.

# Required Story Record

Every future Product Story must have a stable record containing all fields below. The record provides governance and traceability; it is not a feature specification.

| Field | Rule |
|-------|------|
| Story ID | Stable, unique identifier. Renaming or editing a story must not reuse the identifier for a different need. |
| Status | One controlled lifecycle status defined by this document. |
| Actor | One established primary actor. Contextual parties are not substituted as new TOP actors. |
| Business Outcome Goal | One goal ID belonging to the primary actor. |
| Need statement | One concise, solution-neutral statement of what the actor needs in business terms. |
| Intended business value | Why satisfying the need contributes to the cited goal and its outcome evidence. |
| Operational Outcome | The observable business state or result after the story need is satisfied. It is not acceptance criteria, workflow steps, or implementation behavior. |
| Primary capability | One established Operational Capability that principally enables the need. |
| Supporting capabilities | Optional established capabilities essential to the same need; each requires a short rationale. |
| Business object context | At least one established Core Business Object and how it participates in the need. An approved story may not omit this trace through a `None` value or free-form rationale. |
| Boundary notes | Applicable responsibility, ownership, record, provenance, external-authority, and out-of-scope constraints. |
| Source references | Exact governing document sections or table rows used to validate the traces. |
| Open questions | Unresolved business ambiguity. An unresolved boundary or traceability question prevents approval. |

# Controlled Statement Form

The need statement must use this semantic form:

```text
As <established actor>,
I need <business need>,
so that <business value contributing to the cited goal>.
```

The form is a discipline, not sufficient proof of validity. The associated record supplies the required capability, object, boundary, and source traces.

The statement must:

- use one established actor;
- express one business need;
- state value from that actor's established responsibility;
- be understandable without knowledge of a proposed implementation; and
- remain true across reasonable future solution choices.

The statement must not contain:

- screen, page, dashboard, button, form, field, widget, or visual-layout language;
- step order, navigation, interaction sequence, approval path, or other workflow prescription;
- application, module, service, API, endpoint, database, table, event, message, file format, infrastructure, device, or integration design;
- solution-selected verbs such as click, upload, download, render, call, store, sync, or deploy when they prescribe how the need is met;
- estimates, priority, release, sprint, or implementation dependency; or
- acceptance criteria embedded as a sequence of system responses.

Business verbs such as understand, coordinate, confirm, establish, preserve, interpret, and use are appropriate only when they retain the meanings and responsibility boundaries of the source models.

# Atomicity and Relationship Rules

## Atomicity

A story expresses one coherent need and one primary goal contribution. A candidate must be separated or returned for clarification when:

- independent parts could provide distinct business value;
- different primary actors own different needs;
- different primary goals are being pursued;
- multiple capabilities are joined only because a proposed solution would implement them together; or
- one clause can be removed without changing the value of the other clauses.

Splitting is a product-definition decision only. It does not imply implementation units, delivery order, or technical decomposition.

## Multiple actors

A story has one primary actor. Other established actors may appear only as contextual collaborators or recipients in the boundary notes. If another actor has a distinct need or value, that need requires separate consideration against that actor's own goal and capability trace.

## Cross-capability and cross-domain needs

A cross-capability or cross-domain story is permitted only when the need is indivisible at the business-outcome level. Its record must:

1. name one primary capability;
2. explain why every supporting capability is essential;
3. identify the responsibility retained by each actor and domain;
4. identify relevant business-object and record ownership; and
5. state any handoff or external-authority boundary without describing a workflow.

Convenient implementation grouping is never sufficient justification.

# Business Object and Information Rules

1. Every approved Product Story must reference at least one established Core Business Object.
2. Stories use only the established business meaning of Tournament, Competition Context, Match, Court, Participant, Official Assignment, Readiness Record, and Competition Record.
3. A story may identify the business facts an actor needs to understand, establish, use, or preserve, but must not prescribe their fields, format, storage, transport, or technical representation.
4. Relationships between objects are business relationships and do not imply schemas, object models, APIs, modules, or service boundaries.
5. Competition Context and participant source information remain referenced information governed by the appropriate external source.
6. Operational facts created through TOP-managed activity and the trusted record assembled from them retain the ownership rules of the Core Business Object Model.
7. Where externally governed and TOP-owned facts meet, boundary notes must state the distinction and required provenance.
8. If an exceptional candidate appears not to involve an established Core Business Object, it requires explicit governance review. The candidate cannot be Approved unless that review identifies and validates an established object trace; free-form omission is not permitted.

# Prohibited Scope and Content

No Product Story or story record may define or imply:

- a new actor, persona, business domain, capability, goal, or Core Business Object;
- changes to business authority, capability ownership, object ownership, or record ownership;
- registration entry, qualification, eligibility, payment, ranking, legal, insurance, or regulatory authority for TOP;
- media production, publishing, streaming, broadcast operation, or audience distribution ownership for TOP;
- features, product packaging, commitments, roadmap placement, or release scope;
- screens, pages, controls, layouts, interaction patterns, or other UI;
- activity order, alternate paths, handoff sequence, exception path, or other workflow;
- permissions, roles beyond the established actor model, or an authorization mechanism;
- modules, services, APIs, databases, schemas, classes, events, infrastructure, deployment, devices, or integrations; or
- technical non-functional targets, validation plans, readiness gates, test cases, or acceptance criteria.

Such topics may belong to later governed artifacts, but they are not decisions made by a Product Story. Their absence from a story must not be treated as implicit approval or left as solution-shaped shorthand.

# Validation and Approval

## Review sequence

Reviewers must apply the following gates in order:

1. **Source gate** — confirm the actor and goal exist and correspond.
2. **Value gate** — confirm the need makes a clear contribution to the goal's outcome evidence.
3. **Outcome gate** — confirm the Operational Outcome states an observable business state or result without becoming acceptance criteria, workflow steps, or implementation behavior.
4. **Capability gate** — confirm the primary and any supporting capabilities exist and genuinely enable the need.
5. **Object gate** — confirm at least one established Core Business Object is traced and that object terms, relationships, ownership, and provenance are accurate.
6. **Boundary gate** — confirm role, domain, record, external-authority, and TOP scope guardrails are preserved.
7. **Neutrality gate** — confirm no feature, UI, workflow, acceptance, or engineering decision is embedded.
8. **Atomicity gate** — confirm the story states one coherent need for one primary actor and goal.
9. **Completeness gate** — confirm every required record field and source reference is present and consistent.

Failure at any gate returns the candidate for clarification or escalation. Reviewers must not compensate for missing evidence by assuming a solution.

## Definition-ready checklist

A story may be marked **Approved** only when every answer is yes:

- Is the primary actor established?
- Does the goal belong to that actor?
- Is the need distinct and business-oriented?
- Does the value directly contribute to the goal's outcome evidence?
- Does the Operational Outcome describe an observable business state or result without defining acceptance criteria, workflow steps, or implementation behavior?
- Is one established primary capability identified?
- Are supporting capabilities essential and justified?
- Is at least one established Core Business Object referenced and used consistently with its established meaning?
- Are ownership and provenance preserved?
- Are actor, domain, TOP-scope, and external-authority boundaries explicit and intact?
- Is the statement free of feature, UI, workflow, acceptance, and engineering design decisions?
- Is the story atomic?
- Are exact source references and all required fields complete?
- Are there no unresolved traceability or boundary questions?

# Lifecycle and Change Control

## Controlled statuses

| Status | Meaning |
|--------|---------|
| Candidate | Captured for governance review; not yet validated. |
| In Review | Being checked against all validation gates. |
| Approved | Meets these definition rules. Approval validates definition quality only; it does not approve scope or implementation. |
| Returned | Requires clarification, correction, splitting, or upstream disposition. |
| Retired | No longer current; retained for history and traceability. |

## Change rules

1. Changes to wording, traceability, or boundary notes require renewed validation of all gates.
2. A change of primary actor, goal, or fundamental need creates a new story identity; the prior record is retired rather than repurposed.
3. Changes to a cited upstream source trigger an impact review of every dependent story before those stories remain Approved.
4. Historical status, rationale, and superseding relationships must be retained.
5. Story approval must remain separate from prioritization, Product Scope, workflow definition, readiness assessment, and engineering authorization.

# Traceability and Coverage

Future story collections must support both directions of traceability:

```text
Story → Actor → Business Outcome Goal
Story → Operational Capability
Story → Core Business Object context
Story → Boundary and source evidence
```

They must also permit reviewers to determine which approved stories, if any, reference a given actor, goal, capability, or business object.

Traceability demonstrates derivation; it does not demonstrate completeness of Product Scope. A goal or capability with no story may indicate a deliberate boundary, pending discovery, or a gap. A story collection must report such absence without automatically inventing a story. Likewise, the existence of a story does not make its outcome part of a product initiative or increment.

# Governance Outcomes

Applying these rules ensures that future TOP Product Stories:

- translate established business intent rather than originate or redefine it;
- remain anchored to an actor, Business Outcome Goal, and Operational Capability;
- use Core Business Objects without changing their meaning or ownership;
- make responsibility, provenance, and external-authority boundaries reviewable;
- remain free of features, UI, workflows, and engineering design; and
- provide a controlled, traceable input to later Product Layer work without pre-empting it.
