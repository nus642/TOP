# TOP Operational Capability Model

## 1. Purpose and Position

TOP operational capabilities describe what capabilities the platform provides to support **Professional Tournament Operation**. They express the operational value available to the people and organizations that govern, coordinate, execute, prepare for, and consume trusted facts from tournament activity.

This model occupies the following position in the TOP business architecture:

```text
TOP Business Domain Boundary
        ↓
TOP Business Capability → Engine Mapping
        ↓
TOP Core Business Object Model
        ↓
Operational Capability Model
        ↓
Future Engineering Design
```

Each view has a distinct purpose:

- **Business domains define responsibility**: they establish the business outcomes and information for which TOP is accountable.
- **Capabilities define operational value delivered to users**: they describe what TOP enables without prescribing how that value is implemented.
- **Business objects represent the concepts operated on**: they provide the business meaning needed to describe operational work and trusted facts.
- **Future engineering decides implementation**: it may select appropriate technical structures while preserving the business responsibilities and boundaries in this model.

This document remains at the business capability level. It is not application architecture, software module design, API design, database design, service design, or UI design.

## 2. Role-based Capability View

### 2.1 Super Admin Capability

**Purpose:** Platform governance and authorization.

Super Admin capability provides the platform-level authority needed to govern access to TOP. It supports:

- organization and customer management context;
- Master authorization; and
- platform access governance.

The authorization relationship remains:

```text
Super Admin
    ↓ authorizes
Organization / Customer
    ↓ manages
Master
    ↓ operates
Tournament
```

**Boundary:** Super Admin is not a tournament field operation role. Super Admin governs platform and business authorization but does not replace the Master or direct match execution.

### 2.2 Master Capability

**Purpose:** Primary tournament operation capability.

Master is TOP's primary business user for tournament operation. Master capability enables the responsible operator to understand and coordinate live tournament activity through:

- tournament overview;
- court status visibility;
- match status visibility;
- referee status visibility;
- exception handling; and
- operational coordination.

This capability brings together the operational facts needed to recognize current conditions, identify what requires attention, and coordinate the next appropriate tournament action. It does not transfer the responsibilities of referees, external competition authorities, or platform governance to the Master.

### 2.3 Referee Capability

**Purpose:** Match execution responsibility.

Referee capability enables an assigned official to carry out accountable match work through:

- match operation;
- score recording;
- result confirmation; and
- clear official responsibility.

The capability connects execution and confirmation to the assigned official, contributing trusted operational facts to the Match Official Record and the wider Trusted Competition Record. It does not assign the Referee responsibility for overall tournament coordination.

### 2.4 Participant Readiness Capability

**Purpose:** Support participant preparation and communication.

Participant Readiness capability supports the confirmations and communication outcomes needed for participants to enter TOP-managed tournament activity in a known operational state. It includes:

- check-in;
- risk acknowledgement;
- availability confirmation;
- team lineup confirmation; and
- match notification readiness.

Participant Notification is a future-ready capability for communicating readiness requests, expected actions, and match-related operational notices. It expresses an operational outcome and does not prescribe a channel, interface, or delivery mechanism.

**Boundary:** Participant Readiness does not become registration management. Registration authority, participant entry, qualification, payment, and the broader registration lifecycle remain outside TOP. Risk acknowledgement records an operational readiness fact; it does not make TOP the authority for legal, insurance, or regulatory policy.

### 2.5 External Data Consumer Capability

**Purpose:** Provide trusted competition information outputs.

External Data Consumer capability makes dependable facts from TOP-managed competition activity available for authorized consumption. It supports:

- match information output;
- live operational data feed; and
- display and broadcast integration readiness.

These outputs make TOP's trusted competition facts usable beyond the immediate operational workflow without transferring ownership of downstream uses to TOP.

**Boundary:** TOP provides competition facts. TOP does not own media production, a streaming platform, or audience distribution.

## 3. Capability by Business Domain Mapping

The following mapping identifies the business domain responsible for each operational capability. Capability names describe business value and must not be interpreted as technical components.

| Business Domain | Operational Capability |
|---|---|
| Tournament Operations | **Master Control** — maintain an overall operational view and coordinate authorized tournament actions. |
| Tournament Operations | **Court Management** — understand and coordinate court assignment, availability, usage, and operational status. |
| Tournament Operations | **Match Operations** — support live match readiness, execution, scoring, officiating, confirmation, and status visibility. |
| Tournament Operations | **Exception Handling** — recognize and coordinate responses to delays, conflicts, missing participants, court issues, interruptions, and other competition-day exceptions. |
| Participant Readiness | **Check-in** — confirm that a participant has arrived or otherwise reported readiness for tournament activity. |
| Participant Readiness | **Lineup Confirmation** — confirm the participant, team, or roster arrangement expected to compete. |
| Participant Readiness | **Participant Notification Readiness** — support future-ready communication of readiness requests, expected actions, and match-related operational notices. |
| Trusted Competition Record | **Result Record** — preserve authoritative score, result, confirmation, and official-responsibility facts produced through match execution. |
| Trusted Competition Record | **Archive** — preserve durable, attributable, and reviewable competition facts for continuity after immediate operation. |
| Trusted Competition Record | **Event Timeline** — preserve the chronological account of significant readiness, operational, match, confirmation, and exception events. |
| Competition Context | **Competition Context Consumption** — use the externally or appropriately governed competition identity, event structure, rules, and schedule references needed for operation without assuming their authority. |
| Competition Context | **Match Structure Reference** — reference the expected match definition and its place within the competition structure when coordinating live execution. |
| Platform Governance | **Super Admin Authorization** — exercise platform-level administrative authority and authorize access within the governance boundary. |
| Platform Governance | **Organization Governance** — maintain the organization or customer context within which Master authority and tournament operation are governed. |

The Trusted Competition Record capabilities preserve evidence produced by operational and readiness activity together with the context needed to interpret it. They preserve the authoritative account without absorbing the responsibilities of the domains that created or supplied those facts.

## 4. Capability Boundary Guardrails

TOP is focused on professional tournament operation. This operational capability model does not expand TOP into adjacent product categories. TOP does not become:

- a registration platform;
- a ranking authority;
- a media platform; or
- a complete tournament lifecycle management system.

TOP may consume competition context and participant references, provide trusted competition information outputs, and preserve the provenance needed to understand its records. Those interactions do not transfer external business authority or create ownership of upstream or downstream lifecycles.

This model must remain consistent with:

- `TOP-Mission-Alignment.md`, which defines TOP's mission, role model, and platform boundary;
- `TOP-Business-Domain-Boundary.md`, which defines business responsibility separation;
- `TOP-Legacy-Capability-Mapping.md`, which identifies validated operational value and record-ownership principles;
- `TOP-Business-Capability-Engine-Mapping.md`, which relates business capabilities to conceptual engine responsibilities; and
- `TOP-Core-Business-Object-Model.md`, which defines the business concepts operated on by these capabilities.

When interpreting this model:

1. Super Admin remains a platform governance and business authorization role, not a field operation role.
2. Master remains the primary tournament operation role.
3. Participant Notification remains future-ready and limited to TOP-managed operational communication outcomes.
4. Trusted Competition Record remains the authoritative account of TOP-managed activity, not a claim over external source authority.
5. Capability consumption, reference, or output does not introduce new TOP product scope.

## 5. Relationship to Future Engineering

Operational capabilities provide business requirements for future engineering. They describe the value and outcomes that an implementation must support while preserving TOP's role, responsibility, and external-authority boundaries.

Operational capabilities do not define:

- modules;
- services;
- APIs; or
- database structures.

They also do not prescribe applications, user interfaces, code ownership, infrastructure, or deployment units. Similar names in a future technical design do not imply a required one-to-one mapping with the capabilities in this document.

Future engineering may choose implementation boundaries. Those choices must preserve the business meaning, role responsibilities, Trusted Competition Record, authorization model, and scope guardrails established here and in the governing TOP business architecture documents.

---

**Status:** Business Architecture Reference Document
**Last Updated:** 2026-08-05
