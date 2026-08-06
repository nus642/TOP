# TOP Product Actor and Goal Model

Version: 1.1

Status: Active

Last Updated: 2026-08-06

Author:
TOP Product Team

---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.1 | 2026-08-06 | Clarified the capability-to-actor-to-goal derivation and the boundary with future Product Stories |
| 1.0 | 2026-08-06 | Initial Product Actor and Goal Model derived from the established TOP operational capabilities and core business objects |

---

# Purpose

This document defines the product actors and business outcomes they need to achieve through TOP. It establishes the Product Layer relationship from an established Operational Capability, to the actor who pursues its outcome, to that actor's Business Outcome Goal.

The model preserves the roles, responsibilities, ownership, and external-authority boundaries established by Business Architecture. It does not redefine actors or capabilities.

This document does not define:

- Product Stories;
- Workflows;
- Product Scope;
- UI;
- Permissions; or
- Implementation.

# Position and Sources

```text
Operational Capability
        ↓
Actor
        ↓
Business Outcome Goal
```

This is the complete derivation established by this document. It does not establish an Actor → Goal → Future Story model and does not define a story as a subsequent element of this model.

The authoritative inputs are:

- `TOP-Operational-Capability-Model.md` for existing roles, operational outcomes, and capability boundaries;
- `TOP-Core-Business-Object-Model.md` for the business concepts, relationships, and ownership principles involved in those outcomes; and
- `TOP-Product-Layer-Definition.md` for the Product Layer's translation and scope rules.

A goal in this document states a business outcome an actor needs. Mentioning a business object identifies the business information involved in the outcome; it does not change ownership of that object or prescribe its representation.

# Actor Model

## Actor Classification

| Actor | Product relationship | Established responsibility | Boundary preserved |
|-------|----------------------|----------------------------|--------------------|
| **Super Admin** | Platform governance actor | Governs the platform and organization/customer authorization context. | Is not a tournament field operator and does not replace the Master or direct match execution. |
| **Organization / Customer** | Organizational governance actor | Provides the governed organizational context in which Master responsibility and tournament operation exist. | Does not become the field operator merely because it governs the operating context. |
| **Master** | Primary tournament operation actor | Understands and coordinates live tournament activity and operational exceptions. | Does not assume referee execution responsibility, external competition authority, or platform governance responsibility. |
| **Referee** | Match execution actor | Carries out assigned match work, records the score, and confirms the result with attributable official responsibility. | Does not coordinate the tournament as a whole. |
| **Participant** | Tournament readiness actor | Establishes the operational readiness facts needed to take part as a player or team. | Is not made subject to a TOP-owned registration, qualification, payment, ranking, legal, insurance, or regulatory lifecycle. |
| **External Data Consumer** | Trusted-information consumer | Uses dependable competition facts produced by TOP-managed activity. | Consumption does not transfer media production, streaming, publishing, broadcast, or audience-distribution responsibility to TOP. |

These actors retain the relationship established by the Operational Capability Model:

```text
Super Admin
    governs the authorization context for
Organization / Customer
    governs the operating context for
Master
    coordinates
Tournament

Referee             Participant
    executes Match      establishes readiness for participation

TOP-managed activity
    produces trusted competition facts for
External Data Consumer
```

The diagram expresses business relationships only. It does not define access rules, interaction sequences, or system behavior.

## Contextual Parties That Are Not New TOP Product Actors

TOP may use competition definitions, event structures, rules, schedules, and participant references supplied under external authority. Registration authorities, ranking authorities, competition authorities, and media authorities remain outside TOP's responsibility boundary. This model does not introduce them as TOP product actors or assign their goals to TOP.

# Actor Goals

## Super Admin Goals

| Goal ID | Business-outcome goal | Outcome evidence | Capability trace | Business object trace |
|---------|-----------------------|------------------|------------------|-----------------------|
| **SA-G1** | Maintain a governed organization/customer context for TOP operation. | The organization/customer context under which tournament operation is conducted is identifiable and governed. | Organization Governance | Tournament |
| **SA-G2** | Ensure platform and business authority is attributable to the appropriate organization/customer context. | Platform governance and organizational operating authority can be understood without transferring field-operation responsibility to Super Admin. | Super Admin Authorization; Organization Governance | Tournament |

## Organization / Customer Goals

| Goal ID | Business-outcome goal | Outcome evidence | Capability trace | Business object trace |
|---------|-----------------------|------------------|------------------|-----------------------|
| **ORG-G1** | Establish a governed operating context in which accountable Master responsibility can conduct tournament operation. | A Tournament has identifiable organization context and accountable Master responsibility. | Organization Governance | Tournament |

## Master Goals

| Goal ID | Business-outcome goal | Outcome evidence | Capability trace | Business object trace |
|---------|-----------------------|------------------|------------------|-----------------------|
| **M-G1** | Maintain an accurate overall understanding of current tournament conditions. | The state of relevant matches, courts, officials, participant readiness, and exceptions can be understood in the Tournament context. | Master Control | Tournament; Match; Court; Official Assignment; Readiness Record |
| **M-G2** | Keep courts available, occupied, and assigned in a condition that supports tournament operation. | Court state and its relationship to scheduled operational work are understood and coordinated. | Court Management | Court; Match; Tournament |
| **M-G3** | Keep matches in a known operational state from readiness through confirmed completion. | Each Match has sufficient participant, court, official, execution, and confirmation context to be operationally understood. | Match Operations | Match; Participant; Court; Official Assignment; Readiness Record |
| **M-G4** | Restore coordinated tournament operation when delays, conflicts, absences, court issues, interruptions, or other exceptions occur. | An operational exception and its effect on Tournament, Match, Court, Participant, or official responsibility are recognized and accounted for. | Exception Handling | Tournament; Match; Court; Participant; Official Assignment; Competition Record |
| **M-G5** | Operate matches using the applicable competition and match structure without assuming ownership of that external authority. | Operational work can be interpreted against the relevant competition, event, match, rules, and schedule context with its provenance preserved. | Competition Context Consumption; Match Structure Reference | Competition Context; Tournament; Match |
| **M-G6** | Sustain tournament continuity through durable, reviewable, and chronological competition facts. | Results, official responsibility, readiness and protection facts, significant events, and exceptions remain attributable and interpretable after immediate operation. | Result Record; Archive; Event Timeline | Competition Record; Match; Official Assignment; Readiness Record; Competition Context |

## Referee Goals

| Goal ID | Business-outcome goal | Outcome evidence | Capability trace | Business object trace |
|---------|-----------------------|------------------|------------------|-----------------------|
| **R-G1** | Fulfil attributable official responsibility for an assigned match. | The assigned official and that official's responsibility for Match execution and confirmation are clear. | Match Operations | Official Assignment; Match |
| **R-G2** | Produce an accurate, confirmed, and attributable match outcome. | Score, result, confirmation, and official-responsibility facts form authoritative evidence of the completed Match. | Match Operations; Result Record | Match; Official Assignment; Competition Record |
| **R-G3** | Conduct the match in the applicable competition and match context. | Match execution can be interpreted against the referenced match definition and applicable rules without transferring source authority to the Referee or TOP. | Competition Context Consumption; Match Structure Reference | Competition Context; Match; Participant; Court |

## Participant Goals

| Goal ID | Business-outcome goal | Outcome evidence | Capability trace | Business object trace |
|---------|-----------------------|------------------|------------------|-----------------------|
| **P-G1** | Enter TOP-managed tournament activity in a known operational readiness state. | Arrival or readiness, risk acknowledgement, and availability are established as operational facts for the relevant Participant. | Check-in | Participant; Readiness Record; Tournament |
| **P-G2** | Ensure the participant, team, or roster arrangement expected to compete is confirmed for the relevant match context. | The expected competing arrangement is represented as an operational readiness fact without determining registration qualification or eligibility. | Lineup Confirmation | Participant; Readiness Record; Match |
| **P-G3** | Remain aware of readiness expectations and match-related operational notices needed for participation. | Readiness requests, expected actions, and match-related notices can contribute to a known readiness state without assuming any particular communication mechanism. | Participant Notification Readiness | Participant; Readiness Record; Match; Tournament |

## External Data Consumer Goals

| Goal ID | Business-outcome goal | Outcome evidence | Capability trace | Business object trace |
|---------|-----------------------|------------------|------------------|-----------------------|
| **EDC-G1** | Use dependable match and live operational facts from TOP-managed competition activity. | Consumed facts are attributable to their Match and Tournament context and remain interpretable as TOP-managed operational facts. | External Data Consumer capability: match information output and live operational data feed; Result Record | Tournament; Match; Competition Record |
| **EDC-G2** | Use trusted competition facts for downstream display or broadcast purposes without ambiguity about authority. | Durable competition facts and their context are available for consumption while downstream production, publishing, and distribution remain outside TOP. | External Data Consumer capability: display and broadcast integration readiness; Archive; Event Timeline | Competition Record; Competition Context; Match |

# Traceability Summary

## Operational Capability Coverage

| Operational capability | Goal trace |
|------------------------|------------|
| Master Control | M-G1 |
| Court Management | M-G2 |
| Match Operations | M-G3, R-G1, R-G2 |
| Exception Handling | M-G4 |
| Check-in | P-G1 |
| Lineup Confirmation | P-G2 |
| Participant Notification Readiness | P-G3 |
| Result Record | M-G6, R-G2, EDC-G1 |
| Archive | M-G6, EDC-G2 |
| Event Timeline | M-G6, EDC-G2 |
| Competition Context Consumption | M-G5, R-G3 |
| Match Structure Reference | M-G5, R-G3 |
| Super Admin Authorization | SA-G2 |
| Organization Governance | SA-G1, SA-G2, ORG-G1 |
| External Data Consumer capability | EDC-G1, EDC-G2 |

## Core Business Object Coverage

| Core business object | Goal trace |
|----------------------|------------|
| Tournament | SA-G1, SA-G2, ORG-G1, M-G1, M-G2, M-G4, M-G5, P-G1, P-G3, EDC-G1 |
| Competition Context | M-G5, M-G6, R-G3, EDC-G2 |
| Match | M-G1, M-G2, M-G3, M-G4, M-G5, M-G6, R-G1, R-G2, R-G3, P-G2, P-G3, EDC-G1, EDC-G2 |
| Court | M-G1, M-G2, M-G3, M-G4, R-G3 |
| Participant | M-G3, M-G4, R-G3, P-G1, P-G2, P-G3 |
| Official Assignment | M-G1, M-G3, M-G4, M-G6, R-G1, R-G2 |
| Readiness Record | M-G1, M-G3, M-G6, P-G1, P-G2, P-G3 |
| Competition Record | M-G4, M-G6, R-G2, EDC-G1, EDC-G2 |

# Boundary and Interpretation Guardrails

1. **Goals are business outcomes.** Outcome evidence clarifies the achieved business state; it is not a feature description, acceptance test, screen, action sequence, or implementation requirement.
2. **Actors are preserved.** The model translates the actors and relationships already established by the Operational Capability Model. It does not create replacement personas or transfer responsibilities among actors.
3. **Authority follows the established boundary.** Super Admin governs platform and business context; Organization / Customer governs the organizational operating context; Master coordinates tournament operation; Referee executes assigned match responsibility; Participant establishes readiness; External Data Consumer consumes trusted outputs.
4. **Object references do not transfer ownership.** TOP owns operational facts created through TOP-managed activity, references externally authoritative competition and participant information, and remains outside registration, ranking, and media authority.
5. **Readiness is not registration.** Participant goals concern operational readiness only. They do not establish entry, qualification, eligibility, payment, legal policy, insurance policy, or regulatory policy.
6. **Consumption is not downstream ownership.** Providing trusted facts does not make TOP responsible for media production, publishing, streaming, broadcasting, or audience distribution.
7. **No downstream Product Layer or solution definition is implied.** This model defines no Product Stories, Workflows, Product Scope, features, UI, Permissions, services, APIs, databases, modules, infrastructure, or Implementation.

# Use in Later Product Work

Future Product Stories will be derived in later Product Layer deliverables; they are not defined or mapped in this document. Those later deliverables must preserve traceability to:

- Actor;
- Business Outcome Goal;
- Capability; and
- Business Object context.

This traceability requirement does not add Product Stories to the model defined here. Later deliverables must also preserve the established record-ownership and external-authority boundaries.

If later work reveals an apparent need to change an actor, responsibility, capability, object, or ownership rule, that issue must return to the appropriate Business Architecture authority. It must not be silently resolved in the Product Layer.
