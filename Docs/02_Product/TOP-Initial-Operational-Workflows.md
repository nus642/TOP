# TOP Initial Operational Workflows

Version: 1.0
Status: Approved
Last Updated: 2026-08-07
Author: TOP Product Team

---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-08-07 | Established the first populated, business-oriented Operational Workflow collection for the 18 Approved initial Product Stories |

# Purpose and Authority

This document defines the first TOP Operational Workflows for the core operational loop in which participant readiness, tournament coordination, match execution, and preservation of trusted facts contribute to professional tournament operation. It translates the Approved stories in `TOP-Initial-Product-Story-Map.md` into observable business courses without changing their actors, goals, capabilities, business objects, ownership, provenance, or boundaries.

The workflows are governed by `TOP-Operational-Workflow-Definition-Rules.md` and organized under `TOP-Operational-Workflow-Structure.md`. Business Domain identity comes from `TOP-Business-Domain-Boundary.md`; capability-to-domain mapping comes from `TOP-Operational-Capability-Model.md`. Where a source conflicts with this collection, the source prevails and the affected workflow returns for review.

This collection is not Product Scope, a roadmap, delivery authorization, or evidence of implementation readiness. Activity order expresses only necessary business precedence.

# Source Baseline

| Source | Baseline used | Governed contribution |
|--------|---------------|-----------------------|
| `TOP-Business-Domain-Boundary.md` | Business Architecture Reference Document, 2026-08-05 | Business Domain identities and responsibility boundaries |
| `TOP-Operational-Capability-Model.md` | Business Architecture Reference Document, 2026-08-05 | Operational Capabilities, domain mapping, role boundaries, and external-authority guardrails |
| `TOP-Core-Business-Object-Model.md` | Business Architecture Reference Document, 2026-08-05 | Core Business Objects, relationships, ownership, and provenance |
| `TOP-Product-Actor-and-Goal-Model.md` | Version 1.1, 2026-08-06 | Actors, Business Outcome Goals, and outcome evidence |
| `TOP-Initial-Product-Story-Map.md` | Version 1.0, 2026-08-07 | 18 Approved Product Stories and their governed traces |
| `TOP-Operational-Workflow-Definition-Rules.md` | Version 1.1, 2026-08-07 | Workflow eligibility, record requirements, quality gates, and lifecycle |
| `TOP-Operational-Workflow-Structure.md` | Version 1.2, 2026-08-07 | Domain → Workflow Area → Workflow → Activity organization |

# Workflow Areas and Canonical Collection

Workflow Areas organize records only. They do not redefine domain responsibility, capability ownership, sequence, scope, or delivery.

| Area ID | Workflow Area | Parent Business Domain | Definition and placement criteria | Exclusions and overlap disposition | Workflow IDs |
|---------|---------------|------------------------|-----------------------------------|------------------------------------|--------------|
| WA-CC-INTERPRETATION | Operational Context Interpretation | Competition Context | Work whose primary purpose is to interpret TOP-managed operation against referenced competition and Match meaning while retaining source provenance. | Excludes defining competition, rules, schedules, or ranking and excludes live coordination itself. Distinct from Tournament Coordination by source-authority purpose. | OW-M-005, OW-R-003 |
| WA-TO-COORDINATION | Tournament Coordination | Tournament Operations | Master's coherent understanding and coordination of live Tournament, Court, Match, and exception conditions. | Excludes participant-owned readiness, Referee-owned execution, and record continuity. The four workflows remain separate because each pursues a different governed goal. | OW-M-001–OW-M-004 |
| WA-TO-OFFICIATING | Accountable Match Officiating | Tournament Operations | Referee work that establishes assigned responsibility and produces the attributable outcome of a Match. | Excludes overall tournament coordination and competition-context authority. Distinct from Tournament Coordination by primary actor and operational purpose. | OW-R-001, OW-R-002 |
| WA-PR-PREPARATION | Participation Preparation | Participant Readiness | Participant work that establishes readiness facts, the expected competing arrangement, and awareness needed for TOP-managed activity. | Excludes registration, qualification, eligibility, payment, and legal-policy authority. The three workflows remain goal-distinct, not stages of one lifecycle. | OW-P-001–OW-P-003 |
| WA-TCR-CONTINUITY | Operational Record Continuity | Trusted Competition Record | Work whose primary purpose is to keep significant TOP-managed competition facts durable, attributable, chronological, and interpretable. | Excludes ownership of external definitions and downstream publishing or distribution. | OW-M-006 |

All five areas are `Current`, were created in Version 1.0, and were reviewed against their siblings on 2026-08-07 by the TOP Product Team. Each derives from the named domain's responsibility text and accepts at least one Approved workflow. Platform Governance has no area or workflow in this initial focus; this is `Pending discovery`, not a scope decision. No duplicate placement or unresolved sibling overlap was found.

```text
Competition Context
└── WA-CC-INTERPRETATION: OW-M-005, OW-R-003
Tournament Operations
├── WA-TO-COORDINATION: OW-M-001, OW-M-002, OW-M-003, OW-M-004
└── WA-TO-OFFICIATING: OW-R-001, OW-R-002
Participant Readiness
└── WA-PR-PREPARATION: OW-P-001, OW-P-002, OW-P-003
Trusted Competition Record
└── WA-TCR-CONTINUITY: OW-M-006
Platform Governance
└── No initial workflow — pending discovery
```

# Governed Workflow Records

Every record below is Version 1.0, `Approved`, owned and reviewed by the TOP Product Team on 2026-08-07, has no prior version or superseding relationship, and has no open question. “None” under handoffs means the course does not transfer attention or next responsibility between actors; it does not imply isolation from shared business context.

## OW-M-001 — Understand Current Tournament Conditions

| Required field | Governed value |
|----------------|----------------|
| Workflow ID | OW-M-001 |
| Business Domain | Tournament Operations |
| Workflow Area | WA-TO-COORDINATION — Tournament Coordination |
| Primary Actor | Master |
| Business Outcome Goal | M-G1 — Maintain an accurate overall understanding of current tournament conditions. |
| Product Story references | PS-M-001, PS-M-002 |
| Operational Capability | **Primary:** Master Control. **Supporting:** Court Management, Match Operations, Exception Handling, because their established facts supply the cross-operational condition being understood. |
| Core Business Object context | **Tournament** is the overall operating context. **Match**, **Court**, **Official Assignment**, and **Readiness Record** supply attributable operational facts; viewing or interpreting them does not transfer their ownership or originating responsibility. |
| Workflow purpose | Form and maintain a coherent understanding of current Tournament conditions and distinguish material conditions requiring coordination attention. |
| Entry condition and preconditions | Tournament operation is active; relevant Match, Court, official-responsibility, and readiness facts have identifiable provenance. |
| Completion outcome and evidence | Relevant conditions and those requiring attention are understandable in Tournament context, contributing directly to the outcome evidence of M-G1. |
| Bounded exits | `Incomplete` when material facts are absent or contradictory; the uncertainty remains explicit. `Transferred` when a condition belongs to a Referee, Participant, or external authority. |
| Operational invariants | Understanding does not transfer execution, readiness, governance, or external competition authority to Master; uncertain facts are not represented as settled. |

### Activities, responsibility, handoffs, and state progression

| Activity ID | Activity and purpose | Responsible / contextual actors | Story and capability trace | Object context | Business-state progression | Handoff |
|-------------|----------------------|---------------------------------|----------------------------|----------------|----------------------------|---------|
| OW-M-001-A1 | Relate current operational facts to their Tournament context so the overall condition is coherent. | **Responsible:** Master. **Contextual:** Referee and Participant retain responsibility for facts arising from their work. | PS-M-001; Master Control, Court Management, Match Operations | Tournament, Match, Court, Official Assignment, Readiness Record | Dispersed attributable facts → coherent current Tournament condition | Referee/Participant facts become available for Master's coordination attention; originating responsibilities and provenance are retained. |
| OW-M-001-A2 | Distinguish conditions that may materially affect operation. | **Responsible:** Master. | PS-M-002; Master Control, Exception Handling | Tournament and affected contextual objects | Coherent condition → attention-relevant and ordinary conditions are distinguishable | None. |
| OW-M-001-A3 | Maintain the current understanding as material conditions change. | **Responsible:** Master. | PS-M-001, PS-M-002; Master Control | Tournament and changed contextual objects | Prior understanding → current attributable understanding or explicit uncertainty | When another actor's response is needed, Master provides relevant context while retaining overall coordination responsibility; the receiver retains only their established responsibility. |

**Alternate course:** A condition can be understood although no attention is required; A3 preserves the ordinary condition. **Exception boundaries:** Missing, stale, conflicting, or externally disputed context produces explicit uncertainty and a bounded exit; Master does not invent facts or decide Referee, Participant, competition, registration, or legal authority. **Operational outcome:** an attributable, current operational picture supports focused coordination without changing responsibility.

**Traceability:** M-G1 outcome evidence → PS-M-001 (A1, A3) and PS-M-002 (A2, A3) → Master Control and supporting capabilities → the listed objects and Tournament Operations boundary. Source evidence: Actor and Goal Model M-G1; Initial Story Map records PS-M-001/002; Capability Model §§2.2–3; Core Business Object Model §§2.1, 2.3–2.4, 2.6–2.7 and §4; Business Domain Boundary §3.2.

## OW-M-002 — Coordinate Court Operating Conditions

| Required field | Governed value |
|----------------|----------------|
| Workflow ID | OW-M-002 |
| Business Domain | Tournament Operations |
| Workflow Area | WA-TO-COORDINATION — Tournament Coordination |
| Primary Actor | Master |
| Business Outcome Goal | M-G2 — Keep courts available, occupied, and assigned in a condition that supports tournament operation. |
| Product Story references | PS-M-003, PS-M-004 |
| Operational Capability | **Primary:** Court Management. **Supporting:** Match Operations, necessary to relate Court condition to assigned Match work. |
| Core Business Object context | **Court** is the physical resource and its operational condition; **Match** is assigned operational work; **Tournament** supplies shared context. Court condition does not redefine Match meaning. |
| Workflow purpose | Keep Court availability, occupation, and Match assignment relationships operationally coherent. |
| Entry condition and preconditions | A Court is relevant to active Tournament operation; its condition and any Match relationship can be attributed. |
| Completion outcome and evidence | Court state and its relationship to scheduled operational work are understood and coordinated, satisfying M-G2 evidence. |
| Bounded exits | `Deferred` when the Court cannot support work; `Incomplete` when condition or assignment is uncertain; affected Match coordination remains explicit. |
| Operational invariants | A Court is not treated as available and occupied for incompatible work at the same time; coordination does not alter externally governed scheduling authority. |

### Activities, responsibility, handoffs, and state progression

| Activity ID | Activity and purpose | Responsible / contextual actors | Story and capability trace | Object context | Business-state progression | Handoff |
|-------------|----------------------|---------------------------------|----------------------------|----------------|----------------------------|---------|
| OW-M-002-A1 | Establish the Court's current operating condition. | **Responsible:** Master. | PS-M-003; Court Management | Court, Tournament | Court condition not yet understood → available, occupied, constrained, or uncertain in context | None. |
| OW-M-002-A2 | Relate the Court to the Match work expected to use it. | **Responsible:** Master. **Contextual:** Referee retains assigned Match responsibility. | PS-M-004; Court Management, Match Operations | Court, Match, Tournament | Court and Match considered separately → assignment and occupation relationship understood | Master makes relevant Court/Match context available to the responsible Referee; Master retains Court coordination and Referee retains execution. |
| OW-M-002-A3 | Coordinate the next valid Court condition when use completes or a constraint arises. | **Responsible:** Master. | PS-M-003, PS-M-004; Court Management, Match Operations | Court, Match, Tournament | Current use or constraint → next condition is coherent, or explicitly deferred | Referee supplies attributable completion/interruption context; no Match outcome responsibility transfers to Master. |

**Alternate course:** A Court remains available with no assigned Match, or remains occupied while valid work continues. **Exception boundaries:** Court conflict, interruption, physical constraint, or unclear assignment leads to deferred/uncertain state and may relate to OW-M-004; it never permits Master to fabricate schedule or Match definitions. **Operational outcome:** Court status and assigned work remain mutually understandable.

**Traceability:** M-G2 → PS-M-003 (A1, A3), PS-M-004 (A2, A3) → Court Management/Match Operations → Court, Match, Tournament. Sources: Actor and Goal Model M-G2; story records PS-M-003/004; Capability Model §3; Object Model §§2.1, 2.3–2.4 and §4; Domain Boundary §3.2.

## OW-M-003 — Maintain Known Match Operating State

| Required field | Governed value |
|----------------|----------------|
| Workflow ID | OW-M-003 |
| Business Domain | Tournament Operations |
| Workflow Area | WA-TO-COORDINATION — Tournament Coordination |
| Primary Actor | Master |
| Business Outcome Goal | M-G3 — Keep matches in a known operational state from readiness through confirmed completion. |
| Product Story references | PS-M-005, PS-M-006 |
| Operational Capability | **Primary:** Match Operations. **Supporting:** Result Record, necessary for confirmed outcome context. |
| Core Business Object context | **Match** carries operational condition; **Participant**, **Court**, **Official Assignment**, and **Readiness Record** supply readiness context; **Competition Record** preserves confirmed outcome evidence. Each fact retains its provenance. |
| Workflow purpose | Maintain an attributable understanding of a Match from readiness through execution and confirmed completion. |
| Entry condition and preconditions | A Match is expected in Tournament operation and its applicable Participant, Court, and official context is identifiable. |
| Completion outcome and evidence | The Match has sufficient readiness, execution, and confirmation context to be operationally understood through confirmed completion. |
| Bounded exits | `Not ready`, `Interrupted`, or `Awaiting confirmation` remain valid known states; unknown or conflicting context is `Incomplete`. |
| Operational invariants | Master coordinates state understanding but does not assume Participant readiness or Referee execution/confirmation responsibility. Completion is not treated as confirmed without attributable evidence. |

### Activities, responsibility, handoffs, and state progression

| Activity ID | Activity and purpose | Responsible / contextual actors | Story and capability trace | Object context | Business-state progression | Handoff |
|-------------|----------------------|---------------------------------|----------------------------|----------------|----------------------------|---------|
| OW-M-003-A1 | Assess whether Participant, Court, and official context supports Match readiness. | **Responsible:** Master. **Contextual:** Participant and Referee retain their facts and responsibilities. | PS-M-005; Match Operations | Match, Participant, Court, Official Assignment, Readiness Record | Expected Match → ready, not ready, or uncertain Match | Readiness and assignment facts become available to Master; their originators retain responsibility and provenance. |
| OW-M-003-A2 | Follow the attributable Match condition during execution. | **Responsible:** Master. **Contextual:** Referee executes. | PS-M-006; Match Operations | Match, Official Assignment | Ready → in progress, interrupted, or awaiting execution, with official responsibility visible | Master makes coordination context available to Referee; Referee accepts only assigned execution responsibility. |
| OW-M-003-A3 | Recognize confirmed completion in Tournament context. | **Responsible:** Master. **Contextual:** Referee confirms outcome. | PS-M-006; Match Operations, Result Record | Match, Official Assignment, Competition Record, Tournament | Execution ended → confirmed complete or awaiting attributable confirmation | Referee makes confirmed outcome facts available; Master accepts coordination awareness, not confirmation ownership. |

**Alternate course:** A Match remains in a known non-complete state until its business condition changes. **Exception boundaries:** Missing participant, Court, official, interruption, or disputed confirmation remains explicit and may relate to OW-M-004; no unknown state is silently advanced. **Operational outcome:** the Match remains operationally interpretable from readiness through confirmed completion.

**Traceability:** M-G3 → PS-M-005 (A1), PS-M-006 (A2–A3) → Match Operations/Result Record → listed objects. Sources: Actor and Goal Model M-G3; story records PS-M-005/006; Capability Model §§2.2–3; Object Model §§2.1, 2.3–2.8 and §4; Domain Boundary §3.2.

## OW-M-004 — Coordinate an Operational Exception

| Required field | Governed value |
|----------------|----------------|
| Workflow ID | OW-M-004 |
| Business Domain | Tournament Operations |
| Workflow Area | WA-TO-COORDINATION — Tournament Coordination |
| Primary Actor | Master |
| Business Outcome Goal | M-G4 — Restore coordinated tournament operation when exceptions occur. |
| Product Story references | PS-M-007 |
| Operational Capability | **Primary:** Exception Handling. **Supporting:** Master Control, Court Management, Match Operations, and Event Timeline as necessary to understand effects, coordinate within responsibility, and retain significant chronology. |
| Core Business Object context | **Tournament** frames the exception; affected **Match**, **Court**, **Participant**, and **Official Assignment** identify impact; **Competition Record** preserves attributable significant facts without absorbing source ownership. |
| Workflow purpose | Recognize an operational exception, understand its effect, and coordinate a bounded response that restores or explicitly stabilizes operation. |
| Entry condition and preconditions | A delay, conflict, absence, Court issue, interruption, or other material disruption affects Tournament operation; known facts retain provenance. |
| Completion outcome and evidence | The exception and its effects are accounted for and coordinated operation is restored, or a responsible bounded disposition is explicit. |
| Bounded exits | `Deferred` pending responsible action; `Transferred` to an external authority; `Unresolved but stabilized` when safe coherent operation cannot yet resume. |
| Operational invariants | Master acts only within Tournament coordination responsibility. Referee, Participant, competition, registration, legal, and safety authorities retain their own decisions. Significant facts remain attributable. |

### Activities, responsibility, handoffs, and state progression

| Activity ID | Activity and purpose | Responsible / contextual actors | Story and capability trace | Object context | Business-state progression | Handoff |
|-------------|----------------------|---------------------------------|----------------------------|----------------|----------------------------|---------|
| OW-M-004-A1 | Characterize the exception and affected operational context. | **Responsible:** Master. | PS-M-007; Exception Handling, Master Control | Tournament and affected Match, Court, Participant, Official Assignment | Disruption observed → attributable exception and impact understood or explicitly uncertain | Affected actor supplies relevant facts while retaining responsibility for their source activity. |
| OW-M-004-A2 | Determine the responsible operational boundary and coordinate the next business response. | **Responsible:** Master. **Contextual:** Referee or Participant where their responsibility is affected; external authority when its decision is required. | PS-M-007; Exception Handling, Court Management, Match Operations | Affected objects | Understood exception → response owner and bounded condition are clear | Master retains overall coordination; receiving actor accepts only established Match/readiness responsibility, or external authority retains its decision authority. |
| OW-M-004-A3 | Account for the disposition and reassess operational coherence. | **Responsible:** Master. | PS-M-007; Exception Handling, Event Timeline | Tournament, Competition Record, affected objects | Response pending → restored, deferred, transferred, or stabilized condition with attributable account | Result of responsible action returns as context; no record ownership or external authority transfers. |

**Alternate course:** The exception is contained without interrupting other operation; only affected context is coordinated. **Exception boundaries:** An unverified cause, unresolved dispute, or matter requiring legal, registration, competition, or safety authority cannot be decided inside this workflow. **Operational outcome:** operation is restored where possible and every non-restored condition has a clear accountable boundary.

**Traceability:** M-G4 → PS-M-007 (A1–A3) → Exception Handling and necessary supporting capabilities → affected objects and responsibility boundaries. Sources: Actor and Goal Model M-G4; story PS-M-007; Capability Model §§2.2, 3–4; Object Model §2 and §4; Domain Boundary §§3.2 and 4.

## OW-M-005 — Interpret Tournament Operation in Competition Context

| Required field | Governed value |
|----------------|----------------|
| Workflow ID | OW-M-005 |
| Business Domain | Competition Context |
| Workflow Area | WA-CC-INTERPRETATION — Operational Context Interpretation |
| Primary Actor | Master |
| Business Outcome Goal | M-G5 — Operate matches using the applicable competition and match structure without assuming ownership of external authority. |
| Product Story references | PS-M-008 |
| Operational Capability | **Primary:** Competition Context Consumption. **Supporting:** Match Structure Reference, necessary to relate the expected Match to the competition structure. |
| Core Business Object context | **Competition Context** supplies referenced identity, event, rules, and schedule meaning; **Tournament** and **Match** are TOP operational contexts interpreted against it. External provenance and authority remain visible. |
| Workflow purpose | Establish the applicable referenced meaning needed to coordinate a Match without defining or assuming authority over that meaning. |
| Entry condition and preconditions | Tournament or Match coordination requires competition meaning; an identifiable authoritative source exists or its absence is explicit. |
| Completion outcome and evidence | Operational work can be interpreted against relevant competition, event, Match, rules, and schedule context with provenance preserved. |
| Bounded exits | `Incomplete context` when meaning or provenance is absent; `Transferred` when clarification requires the external competition authority. |
| Operational invariants | TOP and Master consume context only; they do not create or decide externally governed competition definitions, rules, schedules, eligibility, or ranking. |

### Activities, responsibility, handoffs, and state progression

| Activity ID | Activity and purpose | Responsible / contextual actors | Story and capability trace | Object context | Business-state progression | Handoff |
|-------------|----------------------|---------------------------------|----------------------------|----------------|----------------------------|---------|
| OW-M-005-A1 | Identify the Competition Context applicable to the Tournament and Match. | **Responsible:** Master. **Contextual:** external competition authority remains source authority. | PS-M-008; Competition Context Consumption | Competition Context, Tournament, Match | Operational context without settled interpretation → applicable source context identified or absent | External source meaning becomes available; source authority and provenance are retained externally. |
| OW-M-005-A2 | Relate operational work to the referenced Match structure and meaning. | **Responsible:** Master. | PS-M-008; Competition Context Consumption, Match Structure Reference | Competition Context, Tournament, Match | Applicable context identified → operational work is interpretable against it | Relevant interpretation becomes coordination context without transferring source ownership. |
| OW-M-005-A3 | Preserve ambiguity and seek authoritative clarification when meanings conflict. | **Responsible:** Master. **Contextual:** external competition authority. | PS-M-008; Competition Context Consumption | Competition Context, Match | Conflicting meaning → explicit unresolved provenance or authoritative clarification | Question transfers to external authority; Master retains operational coordination and does not decide external meaning. |

**Alternate course:** Existing context is sufficiently clear and A3 is unnecessary. **Exception boundaries:** Missing, conflicting, or changed rules/schedule references stop authoritative interpretation; no local assumption substitutes for external authority. **Operational outcome:** Match coordination has applicable, provenance-preserving meaning.

**Traceability:** M-G5 → PS-M-008 (A1–A3) → Competition Context Consumption/Match Structure Reference → Competition Context, Tournament, Match. Sources: Actor and Goal Model M-G5; story PS-M-008; Capability Model §3–4; Object Model §§2.1–2.3 and §4; Domain Boundary §§3.1 and 5.

## OW-M-006 — Sustain the Trusted Operational Account

| Required field | Governed value |
|----------------|----------------|
| Workflow ID | OW-M-006 |
| Business Domain | Trusted Competition Record |
| Workflow Area | WA-TCR-CONTINUITY — Operational Record Continuity |
| Primary Actor | Master |
| Business Outcome Goal | M-G6 — Sustain tournament continuity through durable, reviewable, and chronological competition facts. |
| Product Story references | PS-M-009, PS-M-010 |
| Operational Capability | **Primary:** Archive. **Supporting:** Result Record and Event Timeline, necessary to preserve authoritative outcomes and chronological meaning. |
| Core Business Object context | **Competition Record** preserves the account; **Match**, **Official Assignment**, and **Readiness Record** provide attributable TOP facts; **Competition Context** provides referenced interpretive context while retaining source authority. |
| Workflow purpose | Keep significant operational facts durable, attributable, reviewable, and chronologically interpretable beyond immediate activity. |
| Entry condition and preconditions | A significant readiness, Match, result, official-responsibility, event, or exception fact arises with identifiable provenance and context. |
| Completion outcome and evidence | Significant facts remain attributable and interpretable as a durable chronological account after immediate operation. |
| Bounded exits | `Pending attribution` or `Pending context` when a fact cannot yet be preserved as authoritative; uncertainty remains visible rather than being promoted to trusted fact. |
| Operational invariants | Preservation does not change originating responsibility or external source authority; chronological position does not imply causation; conflicting facts are not silently reconciled. |

### Activities, responsibility, handoffs, and state progression

| Activity ID | Activity and purpose | Responsible / contextual actors | Story and capability trace | Object context | Business-state progression | Handoff |
|-------------|----------------------|---------------------------------|----------------------------|----------------|----------------------------|---------|
| OW-M-006-A1 | Recognize significant operational facts and their attribution. | **Responsible:** Master. **Contextual:** Referee and Participant retain responsibility for facts they originate. | PS-M-009; Archive, Result Record | Competition Record, Match, Official Assignment, Readiness Record | Immediate fact → significant fact with source and operational context identified | Originating facts become available for continuity; originators retain responsibility and provenance. |
| OW-M-006-A2 | Preserve significant facts as a durable, reviewable account. | **Responsible:** Master. | PS-M-009; Archive, Result Record | Competition Record and contextual objects | Attributable significant facts → durable reviewable account or pending attribution/context | None. |
| OW-M-006-A3 | Maintain chronological meaning across significant facts. | **Responsible:** Master. | PS-M-010; Event Timeline, Archive | Competition Record, Tournament, Match, Competition Context | Separate preserved facts → chronologically interpretable operational continuity | None; referenced external context retains its original authority. |

**Alternate course:** A significant fact remains pending until attribution is established, without losing its uncertain status. **Exception boundaries:** Unattributed, contradictory, or externally disputed facts remain qualified; this workflow does not decide competition authority or downstream publication. **Operational outcome:** a trusted operational account supports continuity and later review.

**Traceability:** M-G6 → PS-M-009 (A1–A2), PS-M-010 (A3) → Archive/Result Record/Event Timeline → listed objects and provenance. Sources: Actor and Goal Model M-G6; story records PS-M-009/010; Capability Model §3–4; Object Model §§2.2–2.3, 2.6–2.8 and §4; Domain Boundary §3.4.

## OW-R-001 — Establish Assigned Official Responsibility

| Required field | Governed value |
|----------------|----------------|
| Workflow ID | OW-R-001 |
| Business Domain | Tournament Operations |
| Workflow Area | WA-TO-OFFICIATING — Accountable Match Officiating |
| Primary Actor | Referee |
| Business Outcome Goal | R-G1 — Fulfil attributable official responsibility for an assigned match. |
| Product Story references | PS-R-001 |
| Operational Capability | **Primary:** Match Operations. **Supporting:** None. |
| Core Business Object context | **Official Assignment** identifies Referee responsibility; **Match** is the execution unit to which it applies. Assignment clarity does not grant overall coordination authority. |
| Workflow purpose | Make the Referee's assigned Match responsibility sufficiently clear and attributable for execution and confirmation. |
| Entry condition and preconditions | A prospective Official Assignment relates the Referee to a Match; Match identity is known. |
| Completion outcome and evidence | Assigned official and responsibility for Match execution and confirmation are clear and attributable. |
| Bounded exits | `Unclear assignment` or `Unable to accept responsibility`, returned to Master coordination without implying reassignment. |
| Operational invariants | Referee accepts only the established Match responsibility; Master retains tournament coordination; unclear assignment is never treated as accepted. |

### Activities, responsibility, handoffs, and state progression

| Activity ID | Activity and purpose | Responsible / contextual actors | Story and capability trace | Object context | Business-state progression | Handoff |
|-------------|----------------------|---------------------------------|----------------------------|----------------|----------------------------|---------|
| OW-R-001-A1 | Relate the proposed official responsibility to the identified Match. | **Responsible:** Referee. **Contextual:** Master coordinates assignment context. | PS-R-001; Match Operations | Official Assignment, Match | Proposed or unclear responsibility → understood responsibility or explicit ambiguity | Master provides assignment and Match context while retaining overall coordination. |
| OW-R-001-A2 | Establish acceptance or a bounded inability to accept the responsibility. | **Responsible:** Referee. | PS-R-001; Match Operations | Official Assignment, Match | Understood proposed responsibility → attributable acceptance or inability to accept | Referee makes disposition available to Master; Referee retains accepted execution duty, Master retains coordination. |

**Alternate course:** Referee cannot accept; the workflow ends bounded and returns coordination attention to Master. **Exception boundaries:** Conflicting Match identity, duplicate responsibility, or inability to officiate prevents acceptance; this workflow does not authorize another official. **Operational outcome:** official Match responsibility is clear and attributable.

**Traceability:** R-G1 → PS-R-001 (A1–A2) → Match Operations → Official Assignment/Match. Sources: Actor and Goal Model R-G1; story PS-R-001; Capability Model §§2.3 and 3; Object Model §§2.3, 2.6 and §4; Domain Boundary §3.2.

## OW-R-002 — Produce a Confirmed Match Outcome

| Required field | Governed value |
|----------------|----------------|
| Workflow ID | OW-R-002 |
| Business Domain | Tournament Operations |
| Workflow Area | WA-TO-OFFICIATING — Accountable Match Officiating |
| Primary Actor | Referee |
| Business Outcome Goal | R-G2 — Produce an accurate, confirmed, and attributable match outcome. |
| Product Story references | PS-R-002, PS-R-003 |
| Operational Capability | **Primary:** Match Operations. **Supporting:** Result Record, necessary to preserve confirmed score, result, and official responsibility as authoritative evidence. |
| Core Business Object context | **Match** is the completed execution unit; **Official Assignment** attributes responsibility; **Competition Record** preserves score, result, and confirmation evidence. |
| Workflow purpose | Establish an accurate Match score and result and provide attributable official confirmation so the outcome becomes dependable competition evidence. |
| Entry condition and preconditions | Referee has accepted the Official Assignment; Match execution has produced outcome facts under applicable context. |
| Completion outcome and evidence | Score, result, confirmation, and official-responsibility facts form authoritative evidence of the completed Match. |
| Bounded exits | `Outcome incomplete`, `Correction required`, or `Disputed`, with Match not represented as authoritatively confirmed. |
| Operational invariants | Only attributable Referee confirmation completes this course; uncertainty or dispute remains visible; confirmation does not transfer record or tournament coordination ownership. |

### Activities, responsibility, handoffs, and state progression

| Activity ID | Activity and purpose | Responsible / contextual actors | Story and capability trace | Object context | Business-state progression | Handoff |
|-------------|----------------------|---------------------------------|----------------------------|----------------|----------------------------|---------|
| OW-R-002-A1 | Establish the score and result arising from assigned Match execution. | **Responsible:** Referee. | PS-R-002; Match Operations, Result Record | Match, Official Assignment, Competition Record | Execution outcome facts present → coherent score and result or explicit incompleteness | None. |
| OW-R-002-A2 | Assess the outcome for accuracy in the applicable Match context. | **Responsible:** Referee. | PS-R-002; Match Operations | Match, Competition Record | Coherent outcome → accurate outcome or correction/dispute condition | None. |
| OW-R-002-A3 | Confirm the completed outcome under attributable official responsibility. | **Responsible:** Referee. **Contextual:** Master receives coordination context. | PS-R-003; Match Operations, Result Record | Match, Official Assignment, Competition Record | Accurate unconfirmed outcome → authoritatively confirmed outcome | Confirmed outcome becomes available to Master; Referee retains confirmation attribution and Master accepts only coordination awareness. |

**Alternate course:** An identified correction returns the course to A1 without treating the prior representation as confirmed. **Exception boundaries:** Missing facts, conflicting interpretation, or dispute prevents confirmation and returns a bounded condition for responsible coordination; Referee does not decide external rules. **Operational outcome:** dependable, attributable evidence of the Match outcome exists.

**Traceability:** R-G2 → PS-R-002 (A1–A2), PS-R-003 (A3) → Match Operations/Result Record → Match, Official Assignment, Competition Record. Sources: Actor and Goal Model R-G2; stories PS-R-002/003; Capability Model §§2.3 and 3; Object Model §§2.3, 2.6, 2.8 and §4; Domain Boundary §§3.2 and 3.4.

## OW-R-003 — Interpret an Assigned Match in Context

| Required field | Governed value |
|----------------|----------------|
| Workflow ID | OW-R-003 |
| Business Domain | Competition Context |
| Workflow Area | WA-CC-INTERPRETATION — Operational Context Interpretation |
| Primary Actor | Referee |
| Business Outcome Goal | R-G3 — Conduct the match in the applicable competition and match context. |
| Product Story references | PS-R-004 |
| Operational Capability | **Primary:** Match Structure Reference. **Supporting:** Competition Context Consumption, necessary to interpret applicable externally governed meaning. |
| Core Business Object context | **Match** is the execution unit; **Competition Context** supplies referenced meaning; **Participant** and **Court** supply execution context. Source authority remains external where applicable. |
| Workflow purpose | Make the assigned Match understandable within its applicable competition, Participant, and Court context before and during execution. |
| Entry condition and preconditions | Referee has identifiable Match responsibility and referenced context is available or its absence is explicit. |
| Completion outcome and evidence | Match execution is interpretable against referenced Match definition and applicable rules without transferring source authority. |
| Bounded exits | `Clarification required` when context is missing or conflicting; execution cannot be represented as contextually settled. |
| Operational invariants | Referee and TOP consume, but do not define, external competition meaning; Participant and Court context does not transfer their responsibilities. |

### Activities, responsibility, handoffs, and state progression

| Activity ID | Activity and purpose | Responsible / contextual actors | Story and capability trace | Object context | Business-state progression | Handoff |
|-------------|----------------------|---------------------------------|----------------------------|----------------|----------------------------|---------|
| OW-R-003-A1 | Relate the assigned Match to its Participant, Court, and Competition Context. | **Responsible:** Referee. | PS-R-004; Match Structure Reference, Competition Context Consumption | Match, Participant, Court, Competition Context | Assigned Match without full interpretation → contextualized Match or explicit gap | Master provides available operational context; external source authority retains competition meaning. |
| OW-R-003-A2 | Maintain applicable contextual meaning while conducting the Match. | **Responsible:** Referee. | PS-R-004; Match Structure Reference, Competition Context Consumption | Match, Competition Context, Participant, Court | Contextualized Match → execution remains interpretable or clarification is required | Ambiguity returns to Master for coordination or external authority for meaning; Referee retains execution responsibility. |

**Alternate course:** Context remains stable and no clarification is required. **Exception boundaries:** Conflicting rules, Match identity, Participant arrangement, or Court context pauses settled interpretation; neither Referee nor Master invents external meaning. **Operational outcome:** Match conduct remains grounded in applicable, provenance-preserving context.

**Traceability:** R-G3 → PS-R-004 (A1–A2) → Match Structure Reference/Competition Context Consumption → listed objects. Sources: Actor and Goal Model R-G3; story PS-R-004; Capability Model §3–4; Object Model §§2.2–2.5 and §4; Domain Boundary §§3.1–3.2 and 5.

## OW-P-001 — Establish Participation Readiness

| Required field | Governed value |
|----------------|----------------|
| Workflow ID | OW-P-001 |
| Business Domain | Participant Readiness |
| Workflow Area | WA-PR-PREPARATION — Participation Preparation |
| Primary Actor | Participant |
| Business Outcome Goal | P-G1 — Enter TOP-managed tournament activity in a known operational readiness state. |
| Product Story references | PS-P-001, PS-P-002 |
| Operational Capability | **Primary:** Check-in. **Supporting:** None. |
| Core Business Object context | **Participant** identifies the player or team; **Readiness Record** represents arrival/readiness, acknowledgement, and availability facts; **Tournament** supplies operating context. External participant references retain provenance. |
| Workflow purpose | Establish the Participant's arrival or readiness, applicable risk acknowledgement, and availability as attributable operational facts. |
| Entry condition and preconditions | A referenced Participant expects to enter TOP-managed Tournament activity; applicable readiness expectations are known without TOP deciding their external policy. |
| Completion outcome and evidence | Arrival/readiness, applicable acknowledgement, and availability are known operational facts for the Participant. |
| Bounded exits | `Not ready`, `Unavailable`, `Acknowledgement unresolved`, or `External clarification required`; none is treated as registration or legal adjudication. |
| Operational invariants | TOP records operational facts only; it does not decide registration, qualification, eligibility, payment, legal, insurance, regulatory, or policy authority. |

### Activities, responsibility, handoffs, and state progression

| Activity ID | Activity and purpose | Responsible / contextual actors | Story and capability trace | Object context | Business-state progression | Handoff |
|-------------|----------------------|---------------------------------|----------------------------|----------------|----------------------------|---------|
| OW-P-001-A1 | Establish arrival or reported readiness for Tournament activity. | **Responsible:** Participant. | PS-P-001; Check-in | Participant, Readiness Record, Tournament | Readiness not established → arrived/ready, not ready, or unknown | Readiness fact becomes available to Master for coordination; Participant retains responsibility for the represented fact. |
| OW-P-001-A2 | Establish applicable acknowledgement as an operational fact. | **Responsible:** Participant. **Contextual:** external legal/regulatory authority retains policy meaning. | PS-P-002; Check-in | Participant, Readiness Record, Tournament | Acknowledgement not established → acknowledged or unresolved operational fact | External expectation is referenced without transferring authority; disposition becomes coordination context. |
| OW-P-001-A3 | Establish current availability for relevant activity. | **Responsible:** Participant. | PS-P-002; Check-in | Participant, Readiness Record, Tournament | Availability unknown → available, unavailable, or uncertain | Availability becomes available to Master; Master accepts awareness, not readiness ownership. |

**Alternate course:** Participant is unavailable or not ready; the workflow produces a known bounded state rather than a ready outcome. **Exception boundaries:** Identity/source conflict, unclear expectation, or refusal remains explicit and is referred to the responsible authority; TOP does not determine eligibility or legal sufficiency. **Operational outcome:** Participant readiness condition is attributable and operationally knowable.

**Traceability:** P-G1 → PS-P-001 (A1), PS-P-002 (A2–A3) → Check-in → Participant, Readiness Record, Tournament. Sources: Actor and Goal Model P-G1; stories PS-P-001/002; Capability Model §§2.4, 3–4; Object Model §§2.1, 2.5, 2.7 and §4; Domain Boundary §§3.3–4.

## OW-P-002 — Confirm Expected Competing Arrangement

| Required field | Governed value |
|----------------|----------------|
| Workflow ID | OW-P-002 |
| Business Domain | Participant Readiness |
| Workflow Area | WA-PR-PREPARATION — Participation Preparation |
| Primary Actor | Participant |
| Business Outcome Goal | P-G2 — Ensure the participant, team, or roster arrangement expected to compete is confirmed for the relevant match context. |
| Product Story references | PS-P-003 |
| Operational Capability | **Primary:** Lineup Confirmation. **Supporting:** Match Structure Reference, necessary only to identify the relevant Match context. |
| Core Business Object context | **Participant** represents the player or team; **Readiness Record** represents the attributable expected arrangement; **Match** supplies execution context. External roster or registration sources retain authority. |
| Workflow purpose | Confirm the expected competing arrangement as an operational readiness fact for a relevant Match. |
| Entry condition and preconditions | A Match expects a Participant, team, or roster arrangement and the referenced candidate arrangement is identifiable. |
| Completion outcome and evidence | The expected competing arrangement is attributable and known for the Match without deciding qualification or eligibility. |
| Bounded exits | `Arrangement unclear`, `Change pending`, or `External determination required`; Match readiness remains correspondingly unresolved. |
| Operational invariants | Confirmation describes expected operation only; it does not decide registration, roster eligibility, qualification, ranking, or external source authority. |

### Activities, responsibility, handoffs, and state progression

| Activity ID | Activity and purpose | Responsible / contextual actors | Story and capability trace | Object context | Business-state progression | Handoff |
|-------------|----------------------|---------------------------------|----------------------------|----------------|----------------------------|---------|
| OW-P-002-A1 | Relate the expected Participant, team, or roster arrangement to the relevant Match. | **Responsible:** Participant. | PS-P-003; Lineup Confirmation, Match Structure Reference | Participant, Match, Readiness Record | Candidate arrangement without Match context → relevant expected arrangement or ambiguity | Match context becomes available from Master while external roster provenance is retained. |
| OW-P-002-A2 | Confirm the expected arrangement or establish a bounded unresolved condition. | **Responsible:** Participant. | PS-P-003; Lineup Confirmation | Participant, Readiness Record, Match | Expected arrangement identified → attributable confirmation, pending change, or unresolved state | Confirmation becomes available to Master and Referee as readiness context; Participant retains attribution and neither receiver gains eligibility authority. |

**Alternate course:** A change is identified before confirmation; the changed arrangement is reassessed rather than overwriting its provenance. **Exception boundaries:** Conflicting identity, roster, or eligibility information goes to its external authority; TOP retains only the operationally expected state. **Operational outcome:** the arrangement expected to compete is known and attributable.

**Traceability:** P-G2 → PS-P-003 (A1–A2) → Lineup Confirmation/Match Structure Reference → Participant, Readiness Record, Match. Sources: Actor and Goal Model P-G2; story PS-P-003; Capability Model §§2.4, 3–4; Object Model §§2.3, 2.5, 2.7 and §4; Domain Boundary §§3.1 and 3.3–4.

## OW-P-003 — Maintain Operational Participation Awareness

| Required field | Governed value |
|----------------|----------------|
| Workflow ID | OW-P-003 |
| Business Domain | Participant Readiness |
| Workflow Area | WA-PR-PREPARATION — Participation Preparation |
| Primary Actor | Participant |
| Business Outcome Goal | P-G3 — Remain aware of readiness expectations and match-related operational notices needed for participation. |
| Product Story references | PS-P-004 |
| Operational Capability | **Primary:** Participant Notification Readiness. **Supporting:** None. |
| Core Business Object context | **Participant** is the intended party; **Readiness Record** supplies readiness context; **Match** and **Tournament** identify the relevant operational context. Awareness does not transfer coordination responsibility. |
| Workflow purpose | Keep relevant readiness expectations, expected actions, and Match-related operational notices knowable to the Participant. |
| Entry condition and preconditions | A readiness expectation or operational notice relevant to an identifiable Participant arises in Tournament or Match context. |
| Completion outcome and evidence | Relevant expectations and notices can contribute to a known Participant readiness state without assuming a communication mechanism. |
| Bounded exits | `Awareness unestablished`, `Context unclear`, or `No longer relevant`; Master coordination retains the unresolved condition. |
| Operational invariants | This workflow is channel-neutral; availability does not prove comprehension or action; Participant does not acquire Match coordination responsibility. |

### Activities, responsibility, handoffs, and state progression

| Activity ID | Activity and purpose | Responsible / contextual actors | Story and capability trace | Object context | Business-state progression | Handoff |
|-------------|----------------------|---------------------------------|----------------------------|----------------|----------------------------|---------|
| OW-P-003-A1 | Relate an expectation or operational notice to the intended Participant and context. | **Responsible:** Participant. **Contextual:** Master retains coordination responsibility. | PS-P-004; Participant Notification Readiness | Participant, Readiness Record, Match, Tournament | General or unassociated information → relevant Participant-specific operational meaning or unclear relevance | Master makes coordination meaning available; Master retains responsibility for that meaning. |
| OW-P-003-A2 | Establish whether the relevant meaning is knowable for participation readiness. | **Responsible:** Participant. | PS-P-004; Participant Notification Readiness | Participant, Readiness Record, Match, Tournament | Relevant meaning identified → awareness established or explicitly unestablished | Awareness condition becomes available to Master; Participant retains responsibility only for their readiness response. |

**Alternate course:** Changed operational context makes the prior notice no longer relevant; relevance is reassessed without implying delivery behavior. **Exception boundaries:** Ambiguous audience, stale context, or unestablished awareness remains explicit; this workflow does not prescribe notification, escalation, registration communication, or Match coordination. **Operational outcome:** the Participant can remain aware of relevant TOP-managed participation meaning.

**Traceability:** P-G3 → PS-P-004 (A1–A2) → Participant Notification Readiness → Participant, Readiness Record, Match, Tournament. Sources: Actor and Goal Model P-G3; story PS-P-004; Capability Model §§2.4 and 3–4; Object Model §§2.1, 2.3, 2.5, 2.7 and §4; Domain Boundary §3.3.

# Collection Traceability

## Story-to-workflow index

| Approved Product Story | Workflow and Activity IDs |
|------------------------|---------------------------|
| PS-M-001 | OW-M-001: A1, A3 |
| PS-M-002 | OW-M-001: A2, A3 |
| PS-M-003 | OW-M-002: A1, A3 |
| PS-M-004 | OW-M-002: A2, A3 |
| PS-M-005 | OW-M-003: A1 |
| PS-M-006 | OW-M-003: A2, A3 |
| PS-M-007 | OW-M-004: A1–A3 |
| PS-M-008 | OW-M-005: A1–A3 |
| PS-M-009 | OW-M-006: A1–A2 |
| PS-M-010 | OW-M-006: A3 |
| PS-R-001 | OW-R-001: A1–A2 |
| PS-R-002 | OW-R-002: A1–A2 |
| PS-R-003 | OW-R-002: A3 |
| PS-R-004 | OW-R-003: A1–A2 |
| PS-P-001 | OW-P-001: A1 |
| PS-P-002 | OW-P-001: A2–A3 |
| PS-P-003 | OW-P-002: A1–A2 |
| PS-P-004 | OW-P-003: A1–A2 |

## Actor and goal index

| Actor / Goal | Workflow IDs | Coverage disposition |
|--------------|--------------|----------------------|
| Super Admin / SA-G1, SA-G2 | None | Pending discovery; no Approved initial story |
| Organization / Customer / ORG-G1 | None | Pending discovery; no Approved initial story |
| Master / M-G1–M-G6 | OW-M-001–OW-M-006 respectively | Represented |
| Referee / R-G1–R-G3 | OW-R-001–OW-R-003 respectively | Represented |
| Participant / P-G1–P-G3 | OW-P-001–OW-P-003 respectively | Represented |
| External Data Consumer / EDC-G1, EDC-G2 | None | Pending discovery; no Approved initial story |

## Capability index

| Operational Capability | Workflow and Activity IDs |
|------------------------|---------------------------|
| Master Control | OW-M-001 A1–A3; OW-M-004 A1 |
| Court Management | OW-M-001 A1; OW-M-002 A1–A3; OW-M-004 A2 |
| Match Operations | OW-M-001 A1; OW-M-002 A2–A3; OW-M-003 A1–A3; OW-M-004 A2; OW-R-001 A1–A2; OW-R-002 A1–A3 |
| Exception Handling | OW-M-001 A2; OW-M-004 A1–A3 |
| Check-in | OW-P-001 A1–A3 |
| Lineup Confirmation | OW-P-002 A1–A2 |
| Participant Notification Readiness | OW-P-003 A1–A2 |
| Result Record | OW-M-003 A3; OW-M-006 A1–A2; OW-R-002 A1, A3 |
| Archive | OW-M-006 A1–A3 |
| Event Timeline | OW-M-004 A3; OW-M-006 A3 |
| Competition Context Consumption | OW-M-005 A1–A3; OW-R-003 A1–A2 |
| Match Structure Reference | OW-M-005 A2; OW-R-003 A1–A2; OW-P-002 A1 |
| Super Admin Authorization | None — pending discovery |
| Organization Governance | None — pending discovery |
| External Data Consumer capability | None — pending discovery |

## Core Business Object index

| Core Business Object | Referencing Workflow IDs |
|----------------------|--------------------------|
| Tournament | OW-M-001, OW-M-002, OW-M-003, OW-M-004, OW-M-005, OW-M-006, OW-P-001, OW-P-003 |
| Competition Context | OW-M-005, OW-M-006, OW-R-003 |
| Match | OW-M-001–OW-M-006, OW-R-001–OW-R-003, OW-P-002, OW-P-003 |
| Court | OW-M-001–OW-M-004, OW-R-003 |
| Participant | OW-M-003, OW-M-004, OW-R-003, OW-P-001–OW-P-003 |
| Official Assignment | OW-M-001, OW-M-003, OW-M-004, OW-M-006, OW-R-001, OW-R-002 |
| Readiness Record | OW-M-001, OW-M-003, OW-M-006, OW-P-001–OW-P-003 |
| Competition Record | OW-M-003, OW-M-004, OW-M-006, OW-R-002 |

# Validation Record

Review date: 2026-08-07
Reviewing authority: TOP Product Team
Collection: Version 1.0, 12 Approved workflows, 32 activities, 18 Approved stories

| Validation dimension | Result |
|----------------------|--------|
| Source and identity | Pass — every workflow has one stable ID, source baseline, primary actor, and actor-owned goal. |
| Domain and area placement | Pass — every workflow has one authoritative Business Domain and one Current Workflow Area; all active domains have represented or explicit zero-workflow coverage. |
| Story and activity integrity | Pass — every activity cites an Approved story and capability; every claimed story maps to at least one activity. |
| Operational coherence | Pass — every record defines entry, preconditions, ordered business activities, state progression, completion, bounded exits, alternates, exceptions, and invariants. |
| Responsibility and handoffs | Pass — every activity has one responsible actor and every cross-actor or external-authority handoff states retained responsibility. |
| Object, ownership, and provenance | Pass — object use is business-oriented and TOP-managed facts remain distinguishable from external source authority. |
| Boundary neutrality | Pass — the collection defines operational meaning only and makes no Product Scope or engineering decision. |
| Reverse traceability | Pass — actor/goal, story, capability, and object indexes include represented and explicit zero-result rows. |

# Explicit Exclusions

These workflows do not define or imply:

- user-interface interactions, screens, navigation, controls, or interaction patterns;
- technical endpoints, integrations, storage structures, software components, or orchestration;
- access-control mechanisms or authorization design;
- Product Scope, priority, roadmap placement, releases, or delivery commitments;
- registration, qualification, eligibility, payment, ranking, legal, insurance, regulatory, competition-definition, or scheduling authority; or
- media production, publishing, streaming, broadcast operation, audience distribution, or complete tournament lifecycle ownership.
