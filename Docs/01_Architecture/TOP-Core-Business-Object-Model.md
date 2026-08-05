# TOP Core Business Object Model

## 1. Purpose and Position

This document defines the core business objects derived from TOP responsibilities. It provides a business object view between established business capabilities and future engineering design; it does not define technical implementation.

```text
TOP Business Domain Boundary
        ↓
Business Capability Engine Mapping
        ↓
Core Business Objects
        ↓
Future Application Architecture
```

The objects express business meaning, responsibility, and relationships only. They do not prescribe database schemas, tables, classes, services, APIs, frameworks, or implementation architecture.

## 2. Core Business Objects

### 2.1 Tournament

**Responsibility:** Represents the operational context in which a tournament is conducted.

It includes the organization context, the authorized Master responsibility, and the overall operational status needed to coordinate tournament activity.

**Boundary:** Tournament does not represent ownership of the registration system or its lifecycle.

### 2.2 Competition Context

**Responsibility:** Provides the competition structure and rules context required to interpret tournament operations.

It includes the competition definition, event structure, match definition, and applicable rules reference.

**Boundary:** TOP consumes the context required for operation. TOP does not take ownership of an external competition authority by referencing its context.

### 2.3 Match

**Responsibility:** Represents one competition execution unit within tournament operation.

It brings together the participants, court, referee assignment, execution status, and result confirmation needed to understand the match as operational work.

### 2.4 Court

**Responsibility:** Represents a physical competition resource used during tournament operation.

It expresses availability, occupation state, and the assignment context in which the court supports match execution.

### 2.5 Participant

**Responsibility:** Represents a player or team participating in tournament operation.

It provides the participant identity and context needed for readiness, assignment, and match execution.

**Boundary:** Participant does not represent the full registration lifecycle or registration authority.

### 2.6 Official Assignment

**Responsibility:** Represents a referee's or other official's responsibility for match execution.

It identifies the assigned official and expresses that official's execution responsibility and confirmation responsibility for the match.

### 2.7 Readiness Record

**Responsibility:** Represents participant preparation and confirmation for tournament activity.

It includes check-in, risk acknowledgement, availability, and lineup confirmation as operational readiness facts.

**Boundary:** Readiness Record does not determine registration qualification or eligibility.

### 2.8 Competition Record

**Responsibility:** Represents trusted competition facts preserved after operational execution.

It brings together the following authoritative business evidence:

- Participant Protection Record
- Match Official Record
- Competition Data Archive
- Event Timeline

The Competition Record preserves a coherent account without absorbing the responsibilities that created its contextual, operational, readiness, or authority facts.

## 3. Object Relationship View

These relationships describe business meaning only:

```text
Tournament
  contains operational context

Competition Context
  provides competition, event, match, and rules structure

Match
  occurs within Tournament operational context
  uses:
  - Participant
  - Court
  - Official Assignment

Readiness Record
  supports Participant participation in Match

Match completion
  produces trusted operational facts for Competition Record

Competition Record
  preserves the authoritative account of execution
```

References between objects do not transfer business ownership. In particular, using Competition Context or participant source information during Match execution does not make TOP the authority for those external sources.

## 4. Ownership Principles

Consistent with the TOP Legacy Capability Mapping, ownership follows business authority rather than visibility within a workflow.

### 4.1 TOP Owns

- Operational facts created through TOP-managed tournament activity
- Execution records for matches, courts, officials, readiness, confirmations, and operational exceptions
- Trusted competition records assembled from TOP-owned facts and the context needed to interpret them

### 4.2 TOP References

- External competition context required to operate or interpret a tournament
- Participant information supplied by an appropriate external source

TOP may retain the provenance of referenced information, but reference and retention do not transfer external authority to TOP.

### 4.3 Outside TOP

- Registration authority and the broader registration lifecycle
- Ranking authority, ranking policy, and official ranking calculation
- Media authority, including production, publishing, streaming, and distribution

## 5. Architecture Guardrails

- Business objects are not implementation objects.
- Object names and relationships express business meaning, not technical boundaries.
- Future engineering may choose different technical representations.
- No object in this model implies a database schema, table, class, service, API, framework, module, or deployment unit.
- Future design must preserve the stated business ownership and external authority boundaries without introducing new product scope.

---

**Status:** Business Architecture Reference Document
**Last Updated:** 2026-08-05
