# TOP Business Capability and Engine Mapping

## 1. Purpose and Scope

This document defines the relationship between TOP Modern business domains, their business capabilities, and the responsibilities supported by the Operations Engine and Competition Engine.

This is a **business architecture mapping only**. It clarifies responsibility and capability organization; it does not prescribe implementation architecture.

The following are outside the scope of this document:

- Code organization
- Database design
- API design
- Modules, services, or other technical components
- Infrastructure, deployment, or integration topology

## 2. Business Domain, Capability, and Engine Responsibility Mapping

In this mapping, a business domain describes **what TOP is responsible for**, while an engine describes **how related business capabilities are organized conceptually**. An engine assignment does not define a technical component or transfer ownership of an external business function to TOP.

| Business Domain | Capability | Engine Responsibility |
| --- | --- | --- |
| Tournament Operations | Master operation | **Operations Engine** — supports on-site operational control and competition-day decision-making. |
| Tournament Operations | Court management | **Operations Engine** — supports court assignment, availability, usage, and operational status. |
| Tournament Operations | Referee workflow | **Operations Engine** — supports referee assignment, readiness, task progression, and handoff. |
| Tournament Operations | Match execution status | **Operations Engine** — supports the live operational state of matches, including readiness, progress, completion, delay, and interruption. |
| Tournament Operations | Exception handling | **Operations Engine** — supports competition-day response to incidents, conflicts, delays, missing participants, and court issues. |
| Participant Readiness | Check-in | **Operations Engine** — supports confirmation that participants have arrived or reported readiness for on-site activity. |
| Participant Readiness | Risk acknowledgement | **Operations Engine** — supports operational capture and confirmation of required participant acknowledgements. |
| Participant Readiness | Availability | **Operations Engine** — supports confirmation that a participant is available for assigned or upcoming activity. |
| Participant Readiness | Lineup confirmation | **Operations Engine** — supports confirmation of the participant, team, or roster arrangement expected to compete. |
| Trusted Competition Record | Participant Protection Record | **Operations Engine** — supports creation of trustworthy evidence from participant protection and readiness activity. |
| Trusted Competition Record | Match Official Record | **Operations Engine** — supports creation of trustworthy evidence from officiating assignments, actions, and confirmations. |
| Trusted Competition Record | Competition Data Archive | **Operations Engine and Competition Engine** — contribute the operational history and competition context that the business domain preserves as an authoritative record. |
| Trusted Competition Record | Event Timeline | **Operations Engine and Competition Engine** — contribute time-ordered operational events and competition-context milestones for preservation by the business domain. |
| Competition Context | Competition | **Competition Engine** — supports the identity and business frame of the competition consumed by tournament operations. |
| Competition Context | Event | **Competition Engine** — supports competition-specific categories, divisions, brackets, or playable groupings. |
| Competition Context | Match definition | **Competition Engine** — supports the business description of matches expected within an event. |
| Competition Context | Rules | **Competition Engine** — supports the competition and event rules used to interpret play. |
| Competition Context | Schedule reference | **Competition Engine** — supports planned match timing, sequence, and placement as context for live operation. |
| Platform Governance | Super Admin authority | **Business-domain responsibility; engine-neutral** — governs platform-level authority rather than organizing competition or on-site operational capabilities. |
| Platform Governance | Organization ownership | **Business-domain responsibility; engine-neutral** — establishes the organization or customer accountable for competitions and authorized users. |
| Platform Governance | Master authorization | **Platform Governance authorizes; Operations Engine applies the authorized role** during on-site tournament operation. |

## 3. Engine Boundary

### 3.1 Operations Engine

The Operations Engine supports **on-site tournament operation**. It organizes the capabilities needed to prepare participants, coordinate courts and officials, track live match execution, handle competition-day exceptions, and produce operational evidence for trusted records.

The Operations Engine consumes the competition context needed to run the tournament; it does not become the owner of that context merely by using it.

### 3.2 Competition Engine

The Competition Engine supports **competition context and rules**. It organizes the capabilities that describe the competition, its events, expected matches, applicable rules, and schedule references used by on-site operations.

Competition Engine responsibility in this mapping does not imply ownership of external registration, ranking, or media functions.

### 3.3 Domains and Engines Describe Different Views

- **Business domains describe responsibility**: they state the business outcomes and information for which TOP is accountable.
- **Engines describe capability organization**: they group related business capabilities into the competition-context view or the on-site-operations view.
- A domain may receive support from more than one engine when a business outcome, such as a trusted record, combines competition context with operational history.
- Engine boundaries in this document are conceptual business boundaries only. They do not create modules, services, APIs, databases, or deployment units.

## 4. Explicit External Ownership Boundaries

TOP and its engines do not claim ownership of the following external responsibilities:

- **Registration platform ownership**: TOP may receive or reference participant entry information needed for readiness and operation, but it does not own the external registration platform or its registration lifecycle.
- **Ranking authority ownership**: TOP may consume, reference, display, or contribute competition results used by a ranking authority, but it does not own official ranking policy, calculation authority, or publication.
- **Media platform ownership**: TOP may provide operational facts or record references, but it does not own media publishing, streaming, production, or distribution.

These exclusions apply to both engines. Exchange or use of external information does not transfer business ownership to TOP.

## 5. Interpretation Guardrails

This mapping must not be used to infer:

- An implementation architecture
- A module or service boundary
- A code ownership boundary
- A database or data-storage boundary
- An API or integration contract
- Ownership of registration platforms, ranking authority, or media platforms

---

**Status**: Business Architecture Reference Document
**Last Updated**: 2026-08-05
