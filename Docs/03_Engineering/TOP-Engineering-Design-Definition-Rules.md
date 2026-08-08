# TOP Engineering Design Definition Rules

Version: 1.1

Status: Active

Last Updated: 2026-08-08

Author:
TOP Engineering Governance

---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-08-08 | Clarified the downstream relationship between approved design governance and Implementation |
| 1.0 | 2026-08-08 | Initial governance rules for future Engineering Design Records and Engineering Decisions |

---

# Purpose

This document governs how future TOP Engineering Design Records are identified, owned, based on approved inputs, traced, reviewed, decided, changed, and preserved. **Engineering Design is a governed translation layer downstream of a Ready Engineering Readiness Assessment.** It may determine how Engineering will realize approved Product Scope, but it may not redefine why the outcome exists, who owns it, what operational course it follows, or which product outcomes are in scope.

These rules preserve TOP's business-first, capability-driven, and boundary-aware principles while allowing accountable technical judgment. They define governance only. They do not create an Engineering Design Record, make an Engineering Decision, approve implementation, or prescribe any architecture or implementation.

# Position in the TOP Canon

```text
Business Architecture
        ↓
Product Layer
        ↓
Operational Workflow
        ↓
Product Scope
        ↓
Engineering Readiness
        ↓
Engineering Design Record
        ↓
Engineering Decisions
        ↓
Implementation
```

An approved Engineering Readiness Assessment with status `Ready` is the immediate authority to begin Engineering Design. An **Engineering Design Record** is the controlled container for design context, rationale, decisions, impacts, reviews, and history. **Engineering Decisions** are the individually identifiable technical determinations governed within that record.

**Implementation** is the downstream consumer of an Approved Engineering Design Record and its Approved Engineering Decisions. This relationship requires Implementation to conform to that approved design baseline; it does not make Implementation part of Engineering Design governance or give Implementation authority over the design record or its upstream sources.

Neither a record nor a decision changes an upstream artifact. Approval means only that the recorded design is an acceptable technical response to the exact approved baseline.

# Required End-to-End Trace

Every Engineering Design Record must preserve this complete authoritative chain:

```text
Engineering Design
        ↓
Approved Engineering Readiness Assessment
        ↓
Product Scope Item
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

The trace is mandatory, explicit, version-specific, and bidirectionally reviewable. It shows that technical judgment serves governed business intent; it does not make Engineering Design authoritative over any traced source.

Where one design responds to multiple Product Scope Items, each item must have its own complete chain. Shared references, record grouping, or a common technical concern must not collapse distinct actors, goals, workflows, capabilities, objects, responsibilities, or scope decisions.

# Engineering Design Boundary

## Engineering Design may decide

Within the approved input baseline, Engineering Design may decide:

- the technical approach used to realize the approved outcome;
- the implementation structure used to organize the engineering response; and
- engineering tradeoffs among valid approaches.

Those decisions are valid only when their rationale, alternatives, impacts, trace, authority, and review are recorded under these rules.

## Engineering Design may not redefine

Engineering Design may not redefine:

- business domain ownership;
- actor responsibility;
- Business Outcome Goals;
- Product Stories;
- Operational Workflows;
- Product Scope; or
- Core Business Object ownership.

It also may not invent missing upstream meaning, transfer external authority to TOP, turn a capability into a technical boundary, or treat implementation convenience as authority to alter a business boundary.

When a proposed design can proceed only by changing a protected upstream concern, design work on the affected decision stops. The issue must be returned to the owning upstream authority. Only a newly approved upstream baseline and a corresponding Ready assessment may authorize design against the changed intent.

# Governing Principles

## 1. Business-first

1. Design begins with a Ready assessment and its approved business and product trace, not with a preferred technology or legacy structure.
2. Every technical decision must state which approved outcome or constraint it serves.
3. Technical elegance, reuse, cost, or convenience cannot override business meaning, responsibility, observable outcome, or an explicit exclusion.
4. Current-system behavior and legacy structure are evidence about the existing implementation only; they are not authority for business or product intent.

## 2. Capability-driven

1. Every design record must retain the Operational Capability trace established upstream.
2. Capability participation explains the business ability being enabled; it does not prescribe engineering decomposition.
3. A design must not create, merge, split, rename, transfer, or enlarge an Operational Capability.
4. If the proposed response exposes a capability gap or conflict, the matter returns to Business Architecture rather than being resolved as a technical assumption.

## 3. Boundary-aware

1. Actor, Business Domain, capability, Core Business Object, record, ownership, provenance, handoff, and external-authority boundaries must be preserved.
2. Technical movement, representation, processing, or access does not transfer business-object ownership or business responsibility.
3. TOP-managed operational facts must remain distinguishable from externally governed Competition Context and participant source information.
4. Cross-boundary consequences must be visible in the impact assessment and reviewed by the authority responsible for each affected boundary.

## 4. Baseline-controlled

1. Design authority is limited to the exact Product Scope and source baselines named by the Ready assessment.
2. No draft, stale, superseded, or merely referenced source may silently replace the approved baseline.
3. Assumptions may clarify a technical uncertainty within the approved boundary; they may not supply missing business or product intent.
4. A baseline change is evaluated under change control before affected design work continues or an existing approval is relied upon.

## 5. Decision-explicit

1. Material technical judgment must appear as an individually identified Engineering Decision.
2. A decision records why an approach was selected, not merely what was selected.
3. Rejected alternatives and consequential tradeoffs remain visible so later reviewers can understand the decision context.
4. Silence, code, convention, precedent, prototype behavior, or meeting agreement is not a governed Engineering Decision.

# Design Eligibility and Input Baseline

An Engineering Design Record may enter governed design only when all of the following are available:

| Eligibility condition | Required basis |
|-----------------------|----------------|
| Ready authority | One approved Engineering Readiness Assessment in `Ready` status |
| Scope identity | Every affected Approved Product Scope Item is individually identified |
| Complete trace | Each scope item has the complete required chain through Core Business Object |
| Exact baseline | Versions and approval states of all authoritative inputs are recorded |
| Design boundary | Included design concern and explicit non-concerns are stated without changing scope |
| Accountable ownership | A Design Owner and Design Decision Authority are named |
| Review participation | Required reviewers and affected boundary authorities are identifiable |
| Source availability | Reviewers can inspect every cited authoritative baseline |

Failure of any condition prevents design initiation. The candidate is returned to the authority that owns the missing or conflicting input. It must not be made eligible through an engineering assumption.

The authoritative input package consists of the Ready assessment, its exact Approved Product Scope baseline, and all approved sources in its evidence trace. The assessment conclusion does not replace those sources; it confirms their sufficiency for design.

# Design Identity and Record Rules

Each Engineering Design Record governs one coherent design concern against one exact input baseline. The concern may span more than one scope item only when the relationship is explicit and each complete trace remains independently reviewable.

Every record must contain:

| Field | Governance rule |
|-------|-----------------|
| Design Record ID | Stable and unique. It is never reused for a different design concern. |
| Title | Concise, neutral identification of the governed design concern. |
| Version | Controlled record version linked to its predecessor when applicable. |
| Status | Exactly one lifecycle status defined by this document. |
| Design Owner | One named person accountable for record integrity and lifecycle coordination. |
| Decision Authority | One named role or body authorized to approve or reject the design. |
| Decision context | The technical question and conditions under which a decision is required. |
| Design boundary | What the record will decide and what remains outside it, without changing Product Scope. |
| Input baseline | Exact Ready assessment, scope, workflow, story, goal, actor, capability, and object references and versions. |
| Trace matrix | Complete scope-item-specific end-to-end traces and links to affected decisions. |
| Constraints | Applicable approved constraints, distinguished from design preferences. |
| Assumptions | Technical assumptions, their evidence, owner, validation condition, and expiry or review trigger. |
| Decision index | Every Engineering Decision ID, status, authority, and relationship to other decisions. |
| Rationale | Outcome-based explanation of why the combined design response is suitable. |
| Alternatives | Credible approaches considered and their disposition. |
| Impact assessment | Recorded effects and boundary checks required by these rules. |
| Review record | Reviewers, findings, dispositions, decision, rationale, and dates. |
| Change history | Baseline, decision, impact, review, status, and supersession changes. |

Renaming a record does not change its identity. A materially different design concern or unrelated baseline requires a new record rather than reuse of the existing ID.

# Ownership and Decision Authority

## Design Owner

The Design Owner:

- maintains record completeness, traceability, status, and history;
- confirms eligibility and coordinates required reviews;
- ensures decisions, rationale, alternatives, impacts, and findings are recorded;
- routes upstream questions to their proper owners; and
- initiates change review when a trigger occurs.

The owner does not gain authority to approve the design or alter an upstream source merely by maintaining the record.

## Engineering Decision Authors

Decision authors prepare the technical analysis and recommendations within the authorized baseline. They must distinguish evidence, constraints, assumptions, alternatives, preferences, and decisions. Authorship does not confer approval authority.

## Design Decision Authority

The Design Decision Authority:

- confirms that the record satisfies every decision gate;
- approves, rejects, or returns decisions for change;
- ensures material dissent and unresolved findings are visible;
- confirms that affected boundary authorities have reviewed within their concerns; and
- records the final decision and rationale.

The authority may decide technical matters only. It cannot waive missing upstream approval, accept a protected-boundary redefinition, or approve on behalf of Business Architecture or Product governance.

## Required reviewers

Engineering Governance reviews record discipline and technical decision quality. Product governance verifies fidelity to Product Scope, stories, and workflows. Business Architecture verifies capability, domain, actor, object, ownership, provenance, and external-authority boundaries. Other accountable authorities review when the impact assessment identifies their governed concern.

A reviewer validates only within their authority. Cross-functional review does not merge decision rights.

# Engineering Decision Rules

Every material Engineering Decision within a record must contain:

- a stable Decision ID and controlled status;
- the Design Record ID and version that govern it;
- the precise technical question being decided;
- affected Product Scope Item IDs and complete trace references;
- approved constraints and relevant technical assumptions;
- the selected approach stated at the level necessary for the decision;
- rationale tied to approved outcomes, constraints, and evaluation criteria;
- credible alternatives considered, including retaining the current approach when credible;
- comparative tradeoffs and the reason each alternative was not selected;
- impact assessment references;
- dependencies on other governed decisions, without converting them into implied approval;
- decision author, reviewers, decision authority, decision date, and effective baseline;
- unresolved non-material concerns and their monitoring owner; and
- supersession or reversal reference when the decision is no longer current.

A decision must be separated when parts have different authorities, different input baselines, independent alternatives, or can change independently with materially different impacts. Decisions must not be split or combined merely to avoid review.

No decision is approved by implication. Approval of one decision does not approve a dependent decision, the whole record, implementation, deployment, or delivery.

# Design Rationale and Alternatives

Rationale must:

1. identify the approved outcome, design question, constraints, and evaluation criteria;
2. explain the causal basis for selecting the approach;
3. make material tradeoffs and uncertainty visible;
4. distinguish factual evidence from engineering judgment;
5. state why the choice preserves upstream responsibilities and boundaries; and
6. remain understandable without inspecting an implementation.

Rationale is insufficient when it relies only on preference, popularity, familiarity, precedent, current implementation, schedule pressure, or an assertion of best practice.

Alternatives considered must be credible for the same approved baseline and evaluated consistently. Each disposition records benefits, disadvantages, risks, constraint fit, boundary effects, and the reason it was not selected. A fabricated alternative is not evidence of analysis. If only one approach is viable, the record must state the disqualifying evidence for other credible approaches.

# Impact Assessment

Every record and every material decision must assess, at a proportionate and reviewable level:

| Impact concern | Required governance question |
|----------------|------------------------------|
| Approved outcomes | Does the decision realize only the outcomes authorized by the cited scope items? |
| Actors and responsibility | Does it preserve established responsibilities and handoffs? |
| Operational workflow | Does it support the approved course without adding, removing, or reordering business activity? |
| Capabilities and domains | Does it preserve capability meaning, ownership, relationships, and domain boundaries? |
| Core Business Objects | Does it preserve business meaning, ownership, record responsibility, and provenance? |
| External authority | Does TOP remain within its established authority and exclusions? |
| Other design decisions | Does it conflict with, depend on, supersede, or constrain another governed decision? |
| Existing behavior | Is any compatibility consequence identified without treating legacy behavior as upstream authority? |
| Quality and operability | Are material engineering qualities, operational consequences, failure concerns, and support implications visible? |
| Security, privacy, and compliance | Are applicable governed obligations and authority boundaries identified for specialist review? |
| Validation | Is there a reviewable way to determine whether the decision satisfies its approved intent and constraints? |
| Reversibility | What makes later change easier or harder, and what conditions require reconsideration? |

`No impact` requires rationale and evidence; it is not a default. An impact assessment identifies consequences and required authority. It does not authorize an upstream change or add Product Scope.

# Traceability Governance

1. Each Product Scope Item must link to at least one Engineering Decision that addresses it, or have an explicit governed disposition explaining why no technical decision is required.
2. Each Engineering Decision must link back to every affected scope item and each item's complete authoritative chain.
3. The trace matrix must distinguish direct support, constraint, dependency, and impact relationships.
4. A many-to-many trace must remain explicit; adjacency, document order, or shared naming is not a trace.
5. Source content is referenced rather than copied into a competing definition.
6. Changes to a source or decision must identify and review every affected downstream and upstream-facing trace.
7. Orphan scope items, orphan decisions, missing versions, ambiguous relationships, or contradictory sources are material findings.
8. Technical organization must not be projected upward as a new workflow, capability, domain, object, or scope grouping.

# Controlled Lifecycle

Every Engineering Design Record has exactly one status:

| Status | Meaning |
|--------|---------|
| **Draft** | The eligible record, analysis, or decisions are being prepared. Nothing is approved. |
| **In Review** | The complete record has entered the required cross-functional and authority review. |
| **Changes Required** | Material findings prevent approval; the record returns to its owner for disposition. |
| **Approved** | The authority accepts the complete design response for the exact input baseline. |
| **Superseded** | A later approved record or version replaces it; history and traces remain preserved. |
| **Withdrawn** | Consideration ended before approval, with authority and rationale recorded. |

Individual Engineering Decisions use `Proposed`, `In Review`, `Approved`, `Rejected`, or `Superseded`. A record cannot become `Approved` unless every required decision is `Approved`, every material finding is closed, and all gates pass. A rejected decision remains historical evidence but cannot form part of an approved design.

`Approved` authorizes the approved design baseline only. It does not authorize or certify implementation completion, testing completion, release, deployment, operational readiness, or delivery.

# Review Lifecycle

## 1. Initiate

The Design Owner confirms eligibility, assigns identity and authority, fixes the input baseline, defines the design concern, and identifies reviewers. A missing or non-Ready input is returned upstream.

## 2. Establish trace and constraints

The owner creates the complete scope-item trace matrix. Authors separate approved constraints from technical assumptions and preferences. Any upstream ambiguity becomes a finding rather than inferred meaning.

## 3. Develop decisions

Authors frame material questions, evaluate credible alternatives, record rationale and tradeoffs, and assess impacts. Proposed decisions remain non-authoritative.

## 4. Conduct specialist and boundary review

Qualified reviewers examine the decision analysis within their concerns. Product and Business Architecture authorities verify that protected upstream meaning and boundaries remain unchanged. Findings receive stable IDs, owners, materiality, and dispositions.

## 5. Conduct integrated design review

Reviewers evaluate the complete record for consistency among decisions, full scope coverage, assumption validity, cumulative impacts, and trace completeness. Review comments outside the record are not sufficient decision evidence.

## 6. Decide

The Design Decision Authority applies every gate and records `Approved`, `Changes Required`, or an authorized withdrawal. Approval identifies the exact record version, decision set, baseline, reviewer dispositions, rationale, and date.

## 7. Hand off and preserve

The Approved Engineering Design Record, its Approved Engineering Decisions, and their immutable review evidence become the governed design baseline consumed by Implementation. Implementation must cite and conform to that baseline. It cannot silently redefine an Engineering Decision, alter the design baseline, or reinterpret upstream business or product meaning. The record remains available for audit.

## 8. Monitor and reconsider

The owner monitors assumptions, upstream changes, impacts, and change triggers. A triggered review determines whether the record remains applicable, requires a new version, or must be superseded.

# Decision Gates

The Design Decision Authority must confirm all gates before approval:

1. **Eligibility gate** — a Ready assessment and every required approved source are present.
2. **Identity gate** — record, version, owner, authority, concern, and boundary are unambiguous.
3. **Baseline gate** — exact input versions and approval states are fixed and consistent.
4. **Trace gate** — every scope item and decision has a complete, bidirectional trace.
5. **Scope fidelity gate** — the design neither adds nor removes a product outcome or constraint.
6. **Boundary gate** — domains, actors, capabilities, objects, ownership, provenance, and external authority are preserved.
7. **Decision-quality gate** — each material question, selected approach, rationale, evidence, assumptions, and tradeoffs are explicit.
8. **Alternatives gate** — credible alternatives were assessed consistently and have accountable dispositions.
9. **Impact gate** — direct, indirect, cumulative, cross-boundary, validation, and reversibility impacts are addressed.
10. **Consistency gate** — decisions do not conflict, and every dependency is visible and governed.
11. **Finding gate** — all material findings are closed by the authority that owns the affected concern.
12. **Authority gate** — required reviewers participated and the named Design Decision Authority recorded the decision.

No gate may be waived through urgency, implementation progress, sunk cost, informal agreement, or conditional approval. Failure of a protected-boundary or upstream-authority gate requires escalation, not an engineering exception.

# Change Control

## Change triggers

A governed review is required when:

- the Ready assessment or any source in its baseline changes status or version;
- Product Scope, a workflow, a story, a goal, an actor, a capability, or a Core Business Object trace changes;
- a decision, constraint, material assumption, alternative evaluation, or dependency changes;
- an assumption expires, fails validation, or is contradicted by evidence;
- an impact, boundary concern, conflict, or omission is discovered;
- implementation evidence shows that the approved design cannot satisfy its stated intent or constraints; or
- a decision is proposed for reversal, replacement, or reuse in a different context.

## Change rules

1. Approved records and decisions are never silently edited.
2. Editorial corrections that do not alter meaning are logged. A material change creates a new record version and requires affected gates to be repeated.
3. Every change identifies its trigger, affected IDs and traces, old and proposed states, rationale, impacts, reviewers, authority, and disposition.
4. An upstream change does not automatically authorize a design change. The new Product Scope baseline must pass Engineering Readiness before it becomes design authority.
5. An engineering change must not be used to revise upstream meaning. Required upstream changes are referred to the owning authority and remain outside the design until approved and assessed Ready.
6. Review covers direct and transitive effects across decisions. Unaffected decisions may be carried forward only with recorded evidence that their inputs, rationale, and impacts remain valid.
7. Supersession preserves the previous record, decisions, rationale, alternatives, findings, approvals, and effective period.
8. Emergency or temporary technical action does not retrospectively approve a design. It must follow the applicable separate authority and trigger prompt reconciliation under these rules.
9. Implementation evidence or constraints may trigger governed reconsideration of an affected Engineering Design Record or Engineering Decision.
10. Implementation evidence does not independently amend, approve, supersede, or replace an Engineering Design Record or Engineering Decision. Any resulting design change must follow this document's ownership, review, decision, and version-control rules before it becomes authoritative.

# Findings and Escalation

A review finding must include a stable ID, affected record or decision, source evidence, materiality, owning authority, required disposition, status, and closure evidence.

Findings are classified as:

- **design finding** — resolvable through technical analysis within the approved baseline;
- **upstream finding** — requires Product or Business Architecture clarification or change;
- **boundary finding** — may affect responsibility, ownership, provenance, or external authority; or
- **governance finding** — concerns missing identity, trace, evidence, review, or decision authority.

The Design Owner coordinates but does not decide matters outside Engineering authority. An upstream or boundary finding prevents approval of affected decisions until the proper authority resolves it and, where meaning changed, a new Ready baseline exists.

# Explicit Exclusions

This document does not define, select, recommend, or approve:

- an architecture solution or architecture pattern;
- APIs, interfaces, endpoints, or contracts;
- databases, schemas, data structures, or storage choices;
- services, modules, components, classes, packages, or technical boundaries;
- infrastructure, environments, platforms, networks, or hosting;
- deployment, release, migration, or rollout arrangements;
- vendors, frameworks, languages, tools, protocols, or implementation techniques;
- any actual technical approach, implementation structure, or engineering tradeoff;
- any Product Scope Item, feature, user interface, roadmap item, estimate, or delivery commitment; or
- any change to Business Architecture or Product Layer authority.

Those subjects may be determined in future authorized Engineering Design Records when appropriate, but none is determined by these governance rules.

# Governance Outcome

Applying these rules produces Engineering Design Records whose identity, ownership, authority, baseline, trace, rationale, alternatives, impacts, decisions, reviews, and changes are explicit and auditable. The records permit accountable technical approach, implementation-structure, and tradeoff decisions while preserving business-first intent, capability meaning, product authority, operational workflows, actor responsibility, Core Business Object ownership, and all established boundaries.
