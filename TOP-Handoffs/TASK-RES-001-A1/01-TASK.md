# TASK-RES-001-A1: Resource Management Boundary Definition

**Status:** Documentation Complete

**Created:** 2026-07-30

**Scope:** Documentation only

---

## Purpose

Define the Resource Management boundary for TOP Modern architecture. This boundary identifies the resource facts TOP owns and separates those facts from scheduling and operational workflows.

## Core Principle

**TOP is a domain fact system, not a workflow engine.**

Resource Management records authoritative facts about resources. It does not decide when, where, or by whom a match is performed.

## Resource Types

### Court

A court is a **competition resource**. Resource Management owns:

- Court identity
- Court definition
- Court availability facts

Court definition describes the resource itself. Availability describes whether the court can be considered by a consumer at a relevant time; it does not reserve the court or place a match on it.

### Referee

A referee is an **operational resource**. Resource Management owns:

- Referee identity
- Referee qualification information
- Referee availability facts

Qualification and availability are facts a scheduling consumer may use. They do not assign a referee to a match and do not authorize Resource Management to manage match execution.

## Boundary Definition

### Resource Management Owns

| Resource | Owned facts |
|----------|-------------|
| Court | Identity, definition, availability |
| Referee | Identity, qualification information, availability |

Availability is a business fact. It may be recorded, changed, and queried independently of any assignment decision.

### Resource Management Does NOT Own

| Excluded concern | Boundary owner or treatment |
|------------------|-----------------------------|
| Scheduling | Separate scheduling domain consumes resource facts |
| Assignment | Created by scheduling, not by Resource Management |
| Task queue | Workflow concern |
| Match execution | Match Operations |
| Match result | Match Operations produces outcome facts |
| Competition records | Competition Result Recording |
| Ranking | Separate downstream concern |
| Analytics | Separate reporting/analysis concern |

## Availability and Assignment

**Resource availability is not a scheduling assignment.**

The interaction is one-way at this boundary:

1. Resource Management provides court and referee facts.
2. Scheduling consumes the relevant resource facts.
3. Scheduling creates assignments within its own boundary.

An availability fact makes no promise that a resource has been selected, reserved, or assigned. Conversely, an assignment must not be represented by changing the meaning of a Resource Management availability fact.

## Legacy Alignment

The modern boundary preserves these useful legacy observations:

1. Courts are competition resources.
2. Referees are operational resources.
3. Availability is a business fact.

The legacy coupling between referee status and court state is explicitly rejected. Referee facts and court facts remain independently meaningful; a change to one must not implicitly mutate the other. Any relationship created for a match belongs to scheduling or match operations, according to its purpose.

## Explicit Non-Goals

This task does **not** design:

- Automatic scheduling
- An optimization engine
- Notifications
- A workflow engine
- Assignment or reservation behavior
- Production models, APIs, persistence, or user interfaces

## Deliverables

| Document | Purpose |
|----------|---------|
| `01-TASK.md` | Boundary definition and scope |
| `02-EXECUTIVE-SUMMARY.md` | Business-readable summary |
| `STATUS.md` | Completion record |

## Acceptance Criteria

- [x] Court fact ownership is defined.
- [x] Referee fact ownership is defined.
- [x] Availability is distinguished from assignment.
- [x] Scheduling is established as a consumer, not part of Resource Management.
- [x] Legacy resource observations are preserved without copying legacy coupling.
- [x] Non-goals prevent workflow and automation scope creep.
- [x] No production code is changed.

---

*End of Task Definition*
