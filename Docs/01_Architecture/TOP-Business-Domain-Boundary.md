# TOP Business Domain Boundary

## 1. Purpose

This document defines the business responsibility boundaries for TOP Modern. It describes how major business capabilities are separated and owned across the platform.

This document is intentionally limited to business architecture. It does not define implementation architecture, technical components, database design, API contracts, code organization, or delivery structure.

## 2. Core Principle

TOP Modern should separate the following business responsibility areas:

- **Competition definition**: Describing what competition is being held and the rules that shape it.
- **Tournament operations**: Running the competition day-to-day through courts, officials, match status, and exceptions.
- **Participant readiness**: Confirming participants are prepared, acknowledged, available, and correctly represented before play.
- **Trusted competition records**: Preserving authoritative records of what happened, who was protected, who officiated, and how events unfolded.
- **Platform governance**: Controlling organizational ownership, administrative authority, and master-level permissions.

These boundaries help TOP Modern keep business responsibilities clear while avoiding unnecessary overlap between competition planning, live operations, participant preparation, recordkeeping, and governance.

## 3. Business Domains

### 3.1 Competition Context

The Competition Context domain defines the business identity and structure of a competition. It establishes the frame of reference used by other TOP domains.

Responsibilities include:

- **Competition**: The primary business container for a tournament or competitive program.
- **Event**: A competition-specific category, division, bracket, or playable grouping.
- **Match definition**: The business description of a match that is expected to occur within an event.
- **Rules**: Competition and event rules that determine how play should be interpreted.
- **Schedule reference**: The business reference to planned match timing, sequencing, or placement without owning live execution.

### 3.2 Tournament Operations

The Tournament Operations domain manages the live operational flow of a tournament. It is responsible for coordinating execution once competition structure and schedule references exist. Tournament Operations is the core business domain of TOP and represents the primary value delivered by the platform.

Responsibilities include:

- **Master operation**: Overall tournament control and operational decision-making during execution.
- **Court management**: Assignment, availability, usage, and operational status of courts or play areas.
- **Referee workflow**: Referee assignment, readiness, task progression, and operational handoff.
- **Match execution status**: Live operational state of matches, including readiness, progress, completion, delay, or interruption.
- **Exception handling**: Operational handling of incidents, conflicts, delays, missing participants, court issues, or other competition-day disruptions.

### 3.3 Participant Readiness

The Participant Readiness domain confirms that participants are ready and prepared to participate in the operational flow of the competition.

Responsibilities include:

- **Check-in**: Confirmation that a participant has arrived or otherwise reported readiness for the competition or event.
- **Risk acknowledgement**: Participant acknowledgement of required safety, liability, participation, or conduct expectations.
- **Availability**: Confirmation that a participant is available for assigned or upcoming competition activity.
- **Lineup confirmation**: Confirmation of the participant, team, or roster arrangement expected to compete in a match or event.

### 3.4 Trusted Competition Record

The Trusted Competition Record domain preserves authoritative business records created before, during, and after tournament operation.

Responsibilities include:

- **Participant Protection Record**: Evidence that participant-facing protection responsibilities, such as required acknowledgements or readiness confirmations, were captured.
- **Match Official Record**: Evidence of match officiation, including official assignment, official actions, and relevant match-level confirmations.
- **Competition Data Archive**: Durable business archive of competition data required for reference, audit, review, or future continuity.
- **Event Timeline**: Chronological record of important competition, event, match, participant, and operational milestones.

### 3.5 Platform Governance

The Platform Governance domain controls authority, organizational ownership, and administrative boundaries across TOP Modern. Super Admin is a platform governance and authorization role.

Authorization relationship:

```
Super Admin
    ↓ authorizes
Organization / Customer
    ↓ manages
Master
    ↓ operates
Tournament
```

Responsibilities include:

- **Super Admin**: Platform-level administrative authority for governance and oversight.
- **Organization**: Business owner, tenant, club, association, or operating body responsible for competitions and authorized users.
- **Master authorization**: Authorization of users or roles that can perform master-level tournament operation and governance actions.

## 4. Explicit Boundaries

TOP Modern does not replace every system in the broader competition ecosystem. Its business boundary is focused on competition context, tournament operations, participant readiness, trusted records, and governance.

TOP does not replace:

- **Registration platform**: TOP may receive or reference participant entry information, but registration platform responsibilities remain outside this boundary.
- **Ranking system**: TOP may use or reference ranking information, but ranking calculation and ranking authority remain outside this boundary.
- **Media platform**: TOP may support operational or record references related to competition activity, but media publishing, streaming, and media distribution remain outside this boundary.

## 5. Competition Engine Relationship

TOP does not replace external competition management capabilities. Competition context, rules, scheduling, and ranking authority may come from external competition systems. TOP consumes the required competition context to support on-site tournament operations, and Tournament Operations is TOP's primary business responsibility.

## 6. Document Cross-Reference

- **TOP-Blueprint.md** defines the overall platform position.
- **TOP-Mission-Alignment.md** defines mission and operating boundaries.
- **TOP-Business-Domain-Boundary.md** defines business responsibility separation.

## 7. Out of Scope

This document does not include or define:

- Database design
- API design
- Code structure
- Implementation details
- Infrastructure topology
- Framework choices
- Deployment architecture

---

**Status**: Business Architecture Reference Document  
**Last Updated**: 2026-08-05
