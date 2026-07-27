Task:
TASK-OPS-001-A

Title:
Tournament Operation Core Loop Foundation


Purpose:

Record the rationale and architectural decisions for implementing the Tournament Operation Core Loop Foundation in TOP.


# Why Tournament Operation Core Loop Foundation is Needed

TASK-OPS-001 documented the approved Match Operations architecture. TASK-CORE-001 established the Competition Core Domain. The next step is implementing the minimum viable operational foundation — the P0 core loop — that enables a tournament to operate end-to-end:

- Accepts external draw input
- Creates match context from confirmed Entries
- Establishes Master operational control
- Establishes Referee execution context
- Supports result submission
- Enables competition update

Without this core loop foundation, tournament operations cannot proceed from draw to results.


# P0 Core Loop

The primary objective of TASK-OPS-001-A is the Tournament Operation Core Loop:

External draw input
→ Match context creation
→ Master operational control
→ Referee execution
→ Result submission
→ Competition update

This loop represents the minimum viable operational path for running a tournament.


# Priority Deferral

P1 (Deferred):
- Team lineup management / captain lineup

P2 (Deferred):
- Single tournament management authorization
- User permission model
- Access control system

These are explicitly out of scope for TASK-OPS-001-A and will be addressed in future tasks.


# Architecture Decision

Match Operations is a separate domain from Competition Core:

Competition Core Domain (TASK-CORE-001):
    Competition → Group → Event → Entry → Participant

Match Operations Domain (TASK-OPS-001-A):
    Consumes Entry as input boundary
    Establishes operational authority boundaries
    Does NOT own competition structure


This separation ensures Match Operations focuses on tournament execution while Competition Core focuses on structure and organization.


# Entry as Input Boundary

Entry is the participation boundary between Competition Core and Match Operations.

Match Operations receives Entry because:

1. **Confirmed Data**: Entry represents validated participation in an Event
2. **Composition Context**: Entry carries participant associations needed for match operations
3. **Event Context**: Entry belongs to Event, providing format and rules context
4. **Clean Boundary**: Entry is the handoff point between structure and execution

Match Operations does NOT reach into Competition, Group, Event, or Participant directly for ownership purposes. These remain owned by the Competition Core Domain.


# Master Operational Authority Boundary

Master holds operational authority over tournament execution.

Key decisions:

- Master controls the calling process
- Master initiates match calling
- Master handles all exceptions and disputes
- Master confirms all match results
- Master can override operational status
- Master approves all operational changes

Master authority is bounded:

- Master does NOT own competition structure
- Master does NOT define scheduling algorithms
- Master does NOT define scoring rules
- Master does NOT control notification technology

In this foundation task, Master authority boundary is defined and validated but full workflow is not implemented.


# Referee Operational Context Boundary

Referee holds match execution authority within Master's operational context.

Key decisions:

- Referee receives assigned matches from Master
- Referee verifies participant identity on site
- Referee manages match execution
- Referee records and submits match results
- Referee reports issues to Master
- Referee confirms readiness before match start

Referee authority is bounded:

- Referee does NOT define tournament scheduling
- Referee does NOT modify competition structure
- Referee does NOT calculate rankings
- Referee operates within Master's operational context

In this foundation task, Referee context boundary is defined and validated but full workflow is not implemented.


# Operational Ownership Concepts

Match Operations owns:

- Operational state management concepts
- Actor authority boundaries
- Operational validation rules
- Match execution coordination concepts

Match Operations does NOT own:

- Competition structure (owned by Competition Core Domain)
- Scheduling algorithms (separate planning domain)
- Scoring rules (sport-specific domain)
- Ranking calculations (results domain)
- Notification technology (infrastructure concern)


# Legacy Compatibility Decision

Existing Legacy operational workflows must remain unchanged.

Key principles:

1. **No Breaking Changes**: All Legacy endpoints continue to function
2. **Dual Operation**: Legacy and Modern systems coexist during transition
3. **Incremental Addition**: Modern domain is added alongside Legacy
4. **No Legacy Modification**: Legacy code is not modified

This ensures business continuity and allows gradual migration.


# Scope Boundary

Included (P0 Core Loop):

- External draw input boundary
- Match context creation from Entry
- Master operational control boundary
- Referee execution context boundary
- Result submission domain concept
- Competition update boundary concept
- Operational ownership concepts
- Basic operational validation
- Domain tests
- Legacy regression tests

Deferred (P1):

- Team lineup management / captain lineup

Deferred (P2):

- Single tournament management authorization
- User permission model
- Access control system

Excluded (Not Implemented):

- Registration
- Payment
- User management
- Authentication
- Authorization
- Notification system
- Scheduling algorithm
- Scoring engine
- Ranking system
- Frontend
- Database schema design
- API endpoint creation
- Service layer implementation
- Repository layer implementation


# Implementation Guidance

Future implementation must preserve:

- Entry as input boundary from Competition Core Domain
- Master as operational authority
- Referee as execution authority within Master's context
- Clear separation from Competition structure domain
- Clear separation from Schedule generation domain
- Actor boundary validation
- Legacy compatibility

No production code modified.
Follow TES Handoff Protocol.
