# TOP Product Scope Definition Rules

Version: 1.0

Status: Active

Last Updated: 2026-08-07

Author:
TOP Product Team

---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-07 | Initial Product Scope definition rules |

---

# Purpose

This document defines the rules by which TOP Product Scope is proposed, evidenced, validated, approved, and changed. Product Scope establishes a governed boundary around the product outcomes that a stated decision context must enable and the outcomes that it explicitly does not include.

These rules make a scope decision traceable to established business intent and Product Layer evidence. They do not populate Product Scope, select features or modules, prescribe a user interface or engineering design, or create roadmap or release commitments.

# Position in the TOP Product Canon

```text
Business Domain Boundary + Operational Capability Model
                            ↓
                    Product Layer Definition
                            ↓
                     Actor and Goal Model
                            ↓
             Product Story Definition Rules
                            ↓
               Product Story Map Structure
                            ↓
                Initial Product Story Map
                            ↓
          Operational Workflow Definition Rules
                            ↓
             Operational Workflow Structure
                            ↓
              Initial Operational Workflows
                            ↓
                      Product Scope
                            ↓
                    Engineering Design
```

Product Scope is the final Product Layer boundary before Engineering Design. It decides which already-defined, outcome-oriented product intent applies to a stated scope context. It does not amend the meaning, status, or authority of an upstream source, and it does not decide how included intent will be implemented.

An Approved story or workflow is eligible evidence, not automatic inclusion. Story-map or workflow-collection placement, ordering, proximity, and coverage do not imply inclusion, exclusion, priority, sequence, or commitment. Conversely, exclusion from a particular scope record does not invalidate or delete an upstream goal, story, workflow, capability, or business boundary.

# Authoritative Inputs

Every scope definition must identify the exact version or approved baseline of each applicable authoritative input:

| Authoritative input | Scope use |
|---------------------|-----------|
| **Product Layer Definition** | Establishes Product Scope purpose, layer responsibilities, implementation neutrality, and the rule that scope does not change ownership. |
| **Actor and Goal Model** | Supplies established actors, Business Outcome Goals, outcome evidence, and responsibility boundaries. |
| **Product Story Definition Rules** | Supplies story eligibility, record quality, traceability, and interpretation rules. |
| **Product Story Map Structure** | Supplies governed story organization, canonical placement, and coverage interpretation. |
| **Initial Product Story Map** | Supplies the governed inventory of current story references and their traceability; its contents are not automatically in scope. |
| **Operational Workflow Definition Rules** | Supplies workflow eligibility, quality, course, handoff, evidence, and boundary requirements. |
| **Operational Workflow Structure** | Supplies governed workflow organization, placement, and coverage interpretation. |
| **Initial Operational Workflows** | Supplies the governed inventory of current workflow references and their operational evidence; its contents are not automatically in scope. |
| **Business Domain Boundary** | Constrains domain responsibility, explicit TOP boundaries, and external-authority limits. |
| **Operational Capability Model** | Supplies established roles, operational outcomes, capability relationships, and capability boundary guardrails. |

Inputs are authoritative within their own concerns. A scope record may reference them and select among eligible product outcomes, but it must not correct, reinterpret, combine, or override them. A contradiction, ambiguity, missing baseline, or required upstream change is an escalation, not a scope assumption.

# Scope Definition Principles

## 1. Outcome-based

Scope is expressed as bounded business outcomes for established actors. Inclusion answers **which governed outcomes the product must enable in this scope context**; it does not answer which features, screens, modules, services, or technical components will provide them.

## 2. Evidence-led

Every inclusion and exclusion decision requires identifiable upstream evidence and a recorded rationale. Preference, map position, workflow order, perceived technical convenience, or undocumented expectation is not sufficient evidence.

## 3. Boundary-preserving

Scope remains within established Business Domains, Operational Capabilities, role responsibilities, object and record ownership, provenance rules, and external-authority boundaries. Inclusion never transfers ownership or expands TOP responsibility.

## 4. Decision-context-specific

A scope record applies only to its explicitly named business decision context. It is not a permanent declaration about all TOP product intent and must not be presented as a roadmap, release, implementation plan, or delivery promise.

## 5. Explicit and independently testable

Each inclusion and exclusion must be stated separately, have a stable reference, and be capable of validation against its rationale and upstream trace. Bundled or ambiguous statements must be decomposed before approval.

# Scope Record Structure

Each Product Scope record must contain the following fields. The structure defines how future scope decisions are recorded; it defines no actual Product Scope items.

## Identity and governance fields

| Required field | Rule |
|----------------|------|
| Scope ID | Stable, unique identifier that is not reused after retirement. |
| Title | Concise name for the business decision context; it must not be a feature, module, UI, roadmap, or release label. |
| Purpose and decision context | States why a bounded scope decision is needed and the business context to which it applies. |
| Version | Controlled scope-record version. |
| Status | One controlled lifecycle status defined in this document. |
| Owner | Product authority accountable for record integrity and review coordination. |
| Decision authority | Named role or governance body authorized to approve the scope boundary. |
| Created and last-reviewed dates | Dates of record creation and latest completed review. |
| Input baselines | Exact versions or approved baselines of all applicable authoritative inputs. |

## Boundary and decision fields

| Required field | Rule |
|----------------|------|
| Outcome boundary | A solution-neutral statement of the overall business outcome boundary for this context. |
| Included outcome references | Individually identified included outcomes, each using an approved goal, story, and workflow trace as required by the inclusion rules. |
| Explicit exclusion references | Individually identified exclusions with classification, rationale, evidence, and reconsideration condition where applicable. |
| Applicable actors and domains | References established actors and Business Domains involved; no new actor or domain may be created here. |
| Boundary constraints | Applicable responsibility, ownership, provenance, record, TOP-scope, and external-authority constraints. |
| Assumptions and unresolved findings | Explicit, time-bounded assumptions and open questions; neither may silently establish inclusion. |

## Evidence and review fields

| Required field | Rule |
|----------------|------|
| Inclusion evidence | Per-item trace and rationale showing why the outcome is necessary and eligible. |
| Exclusion evidence | Per-item trace and rationale showing why the outcome is outside this scope context or prohibited by an authoritative boundary. |
| Coverage reconciliation | Reconciles relevant goals, Approved stories, and Approved workflows as included, explicitly excluded, not applicable, or unresolved without claiming universal completeness. |
| Boundary-validation result | Records each validation gate, evidence examined, finding, reviewer, date, and disposition. |
| Decision log | Records proposal, review, approval, rejection, and supersession decisions with authority and rationale. |
| Change history | Records changed references, rationale, impact analysis, approvals, and resulting version. |

Each included or excluded entry must have its own stable entry ID. References may be presented in indexes or matrices, but physical grouping and order convey neither priority nor delivery sequence.

# Scope Inclusion Rules

An outcome may be included only when all of the following are true:

1. **Established actor and goal** — it serves an actor and Business Outcome Goal already governed by the Actor and Goal Model.
2. **Approved Product Story evidence** — at least one applicable Product Story is Approved under the Product Story Definition Rules and appears as a governed reference in the Product Story Map.
3. **Approved workflow evidence** — at least one applicable Operational Workflow is Approved under the Operational Workflow Definition Rules and reconciled in the Operational Workflow Structure.
4. **Complete trace** — the entry can trace through actor, goal, story, workflow, Operational Capability, relevant business information, and Business Domain without contradiction.
5. **Outcome necessity** — recorded evidence explains why the outcome is necessary within the stated decision context and what observable business evidence would show that it is enabled.
6. **Boundary conformity** — the entry preserves established role, domain, capability, object, record, provenance, and external-authority boundaries.
7. **Solution neutrality** — the entry remains meaningful without a feature, module, UI, technical component, vendor, or implementation approach.
8. **Independent decision** — inclusion is explicit and approved for this record; it is not inferred from upstream existence, collection placement, adjacency, order, coverage, or another entry's inclusion.
9. **Validation completed** — all boundary-validation gates pass and all material findings have an accountable disposition.

Where several stories or workflows jointly evidence one indivisible business outcome, the record may reference them together only if the rationale explains the necessary relationship. This does not create technical dependency, delivery order, or permission to merge their upstream meanings.

# Scope Exclusion Rules

Exclusion is an explicit decision about the stated scope context, not the absence of a reference and not a deletion of valid product intent.

Every exclusion must use one of these classifications:

| Classification | Meaning |
|----------------|---------|
| Context exclusion | Governed product intent is valid but is not necessary within the stated decision context. |
| Boundary exclusion | The proposed outcome would cross a TOP, Business Domain, role, ownership, record, provenance, or external-authority boundary. |
| Evidence exclusion | The candidate lacks sufficient approved or consistent upstream evidence and cannot be included unless the evidence gap is resolved. |
| Superseded-context exclusion | The entry applied to an earlier version of this scope context but no longer applies; history and rationale remain visible. |

An exclusion entry must:

1. identify the candidate outcome or governed references precisely;
2. state its classification and context-specific rationale;
3. cite the evidence or authoritative boundary supporting the decision;
4. state whether reconsideration is allowed and, if so, the evidence or context change required;
5. describe effects on related inclusions and unresolved findings; and
6. preserve the status and meaning of every upstream source.

Missing, Draft, or unapproved upstream material cannot be labelled permanently out of TOP scope merely because it is not eligible for inclusion. It is recorded as an evidence exclusion or unresolved finding. Likewise, silence, omission, map position, workflow placement, lack of coverage, estimated effort, or presumed implementation complexity is not an exclusion decision.

# Evidence Requirements

## Inclusion evidence chain

Every included entry must provide a navigable chain:

```text
Scope Entry
    → Actor and Business Outcome Goal
    → Approved Product Story
    → Approved Operational Workflow and relevant outcome evidence
    → Operational Capability
    → relevant business information and Business Domain
    → applicable boundary constraints
```

The entry must identify source IDs and versions, quote or paraphrase the relevant outcome without changing it, state the inclusion rationale, and identify observable business evidence of the outcome. Traceability demonstrates derivation and consistency; approval of the scope entry establishes inclusion.

## Exclusion evidence chain

Every excluded entry must trace to the governed candidate product intent or proposed outcome and then to the authoritative context or boundary that supports exclusion. Boundary exclusions require a direct Business Domain Boundary or Operational Capability Model reference. Evidence exclusions must identify the missing, conflicting, or unapproved evidence and its responsible resolution authority.

## Evidence integrity

- Evidence must be attributable, current for the recorded input baseline, and reviewable.
- A source may support only the meaning it governs; downstream text cannot manufacture upstream authority.
- Conflicting evidence remains visible and blocks approval of the affected entry until resolved by the source owner.
- Assumptions are labelled, owned, dated, and given an expiry or validation condition. An assumption cannot override an authoritative source.
- Quantitative evidence may strengthen rationale but cannot substitute for actor, goal, story, workflow, capability, domain, and boundary traceability.
- Approval evidence records who reviewed what, under which authority, on what date, and with what disposition.

# Boundary Validation

Validation is performed for the record as a whole and for every included and excluded entry.

## Validation gates

1. **Context gate** — confirm the purpose and decision context are explicit, bounded, and free of roadmap or release semantics.
2. **Input gate** — confirm all authoritative inputs are identified, current, and internally consistent for the decision.
3. **Actor and goal gate** — confirm each included outcome serves an established actor and goal without redefining either.
4. **Story gate** — confirm referenced stories are Approved, governed, and used without changing their intended value.
5. **Workflow gate** — confirm referenced workflows are Approved, reconciled, and used without changing actor responsibility, course meaning, or outcome evidence.
6. **Capability gate** — confirm capability traces support the outcome and do not create, merge, relocate, or expand capability responsibility.
7. **Domain gate** — confirm Business Domain placement and cross-domain relationships preserve the Business Domain Boundary.
8. **Ownership and provenance gate** — confirm business-object meaning, record ownership, source authority, attribution, and provenance remain intact.
9. **External-authority gate** — confirm TOP does not assume registration, qualification, ranking, payment, legal, insurance, regulatory, competition-definition, scheduling-authority, media-production, publishing, or distribution responsibility.
10. **Inclusion/exclusion gate** — confirm every decision is explicit, independently evidenced, correctly classified, and reconciled with related entries.
11. **Neutrality gate** — confirm the scope contains no feature, module, UI, engineering design, roadmap, release, estimate, or delivery decision.
12. **Approval gate** — confirm open material findings are resolved or the affected entry is not approved, and confirm the decision authority has approved the final boundary.

## Validation outcomes

| Outcome | Meaning |
|---------|---------|
| Pass | Evidence satisfies the gate with no material finding. |
| Pass with recorded clarification | Meaning is sufficient and a non-material clarification is recorded without changing an authoritative source. |
| Return for correction | The scope record can be corrected without an upstream governance decision. |
| Escalate upstream | A source ambiguity, contradiction, authority question, or boundary change must be decided by the owning authority. |
| Reject | The proposed decision conflicts with authoritative intent or a protected boundary. |

A record cannot become Approved while any included entry has a `Return for correction`, `Escalate upstream`, or `Reject` result. Excluded and unresolved entries must still have complete, accountable dispositions.

# Change Governance

## Controlled statuses

| Status | Meaning |
|--------|---------|
| Draft | Being assembled; no inclusion or exclusion is authoritative. |
| In Review | Submitted to the required reviewers; still not authoritative. |
| Approved | The recorded inclusion and exclusion boundary is authoritative for its stated context and baselines only. |
| Superseded | Replaced by a later Approved version; retained for history and audit. |
| Retired | No longer applicable to an active decision context; retained for history and audit. |

Only the named decision authority may set `Approved`, `Superseded`, or `Retired`. Approval of Product Scope does not approve UI, engineering design, estimates, roadmap placement, release assignment, implementation, or delivery.

## Change triggers

A scope review is required when:

- an authoritative input changes in a way that may affect a trace, outcome, boundary, or rationale;
- a referenced story or workflow changes status, meaning, traceability, or placement;
- the stated decision context or its evidence changes materially;
- an assumption expires or an unresolved finding is resolved;
- a boundary, ownership, provenance, role, capability, or external-authority concern is identified; or
- an inclusion, exclusion, classification, or rationale is proposed to change.

## Change rules

1. Approved records are not edited silently. A material change creates a new version and preserves the prior Approved version.
2. Every change identifies affected entry IDs, source baselines, rationale, evidence, boundary impact, and reviewing authority.
3. Adding an inclusion or removing an exclusion requires the full inclusion and validation process; it is never treated as an editorial change.
4. Removing an inclusion requires an explicit exclusion or other accountable disposition and impact analysis of related entries.
5. An upstream change does not automatically change scope. The affected record remains governed by its recorded baseline until reviewed, but any material inconsistency must be made visible immediately.
6. Scope governance cannot approve a change owned by Business Architecture, Product Story governance, workflow governance, or Engineering Design. Such a change is referred to the owning authority.
7. Supersession and retirement preserve decision history, evidence, approvals, and the exact boundary that was authoritative.

## Required review evidence

Each completed review records:

- record version, status, and input baselines;
- reviewer identities, roles, and decision authority;
- reviewed inclusion, exclusion, and unresolved-entry IDs;
- validation-gate results and supporting evidence;
- changes, affected traces, and impact analysis;
- corrections, escalations, rejections, and their dispositions;
- approval or non-approval decision, rationale, and date; and
- confirmation that the review did not define or approve features, modules, UI, engineering design, roadmap, or releases.

# Explicit Exclusions

This document does not define or approve:

- any actual Product Scope item, included outcome, or excluded outcome;
- features or feature sets;
- modules, services, components, or product packaging;
- screens, navigation, interaction design, or any other UI;
- architecture, APIs, data structures, technical orchestration, or any other engineering design;
- roadmap position, priority, estimate, milestone, or delivery sequence; or
- releases, release contents, deployment plans, or delivery commitments.

# Governance Outcome

Applying these rules produces Product Scope records that are explicit, outcome-based, evidence-led, context-specific, and reviewable; select only governed Product Layer intent; preserve Business Architecture and external-authority boundaries; distinguish inclusion from mere upstream existence and exclusion from mere absence; and provide an authoritative product boundary to Engineering Design without prescribing a solution or creating a roadmap or release commitment.
