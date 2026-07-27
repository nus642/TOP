Task:
TASK-OPS-001-A1

Title:
Match Context Foundation


Purpose:

Record the rationale and design decisions for implementing the minimal operations domain foundation as the first code deliverable of TASK-OPS-001-A.


# Why Match Context Foundation is Needed

TASK-OPS-001-A defined the Tournament Operation Core Loop:

External draw input → Match context creation → Master operational control → Referee execution → Result submission → Competition update

The first implementation step is establishing the domain objects that make this loop possible. Without MatchContext, there is no operational aggregate root to hold match state, actor boundaries, or Entry references.

This sub-task delivers the structural foundation only — no workflow methods, no state transitions.


# MatchContext as Aggregate Root

MatchContext is the single aggregate root for the operations domain.

Design decisions:

1. **Single Aggregate Root**: All operational state flows through MatchContext
2. **Actor Contexts Belong to MatchContext**: MasterOperationalContext and RefereeOperationalContext are not independent entities
3. **Entry Reference is Read-Only**: MatchContext holds a reference to Entry but does not modify it
4. **Draw Position is Operational Data**: Round, court, sequence come from external draw input

MatchContext represents one match in the operational layer. It is created from confirmed competition data (Entry) and external draw input (position information).


# Entry Reference Boundary

MatchContext consumes Entry from Competition Core Domain.

Key decisions:

- Entry is passed at construction time
- Entry must be a valid Entry instance from Competition Core Domain
- MatchContext reads Entry context (event, competition) but does not modify it
- Entry ownership remains with Competition Core Domain

This ensures clean domain separation: Competition Core owns structure, Operations owns execution context.


# MasterOperationalContext Boundary

MasterOperationalContext represents Master's authority within a specific match.

Key decisions:

- Belongs to MatchContext (not independent)
- Validates that operations are within Master authority scope
- Master authority includes: calling control, result confirmation, exception handling, override
- Master authority excludes: competition structure modification, scheduling, scoring rules

In this task, only boundary validation is implemented. No workflow methods.


# RefereeOperationalContext Boundary

RefereeOperationalContext represents Referee's execution context within a specific match.

Key decisions:

- Belongs to MatchContext (not independent)
- Validates that operations are within Referee execution scope
- Referee scope includes: participant verification, result recording, readiness confirmation
- Referee scope excludes: calling initiation (Master), result confirmation (Master), scheduling

In this task, only boundary validation is implemented. No workflow methods.


# OperationsError

OperationsError is the operations domain error type.

Design decisions:

- Follows same pattern as Competition Core Domain's DomainError
- Constructor: `OperationsError(code, message)`
- Extends Error
- Used for all operations domain validation failures


# What MatchContext Does NOT Own

Explicitly confirmed — MatchContext does NOT own:

- Competition (owned by Competition Core Domain)
- Group (owned by Competition Core Domain)
- Event (owned by Competition Core Domain)
- Entry (owned by Competition Core Domain — reference only)
- Participant identity (owned by Competition Core Domain)
- Scoring rules (future sport-specific domain)
- Ranking rules (future results domain)
- Scheduling algorithm (future planning domain)


# Scope Boundary

Included:

- MatchContext construction and validation
- OperationsError error type
- MasterOperationalContext boundary validation
- RefereeOperationalContext boundary validation
- CommonJS exports
- Domain tests
- Legacy regression tests

Excluded:

- Workflow methods (startMatch, completeMatch, etc.)
- State machine framework
- Authentication
- Authorization system
- Notification
- Scoring engine
- Ranking system
- Scheduling algorithm
- API endpoints
- Database schema
- Service layer
- Repository layer
- Frontend


# Implementation Guidance

Implementation must preserve:

- MatchContext as single aggregate root
- Actor contexts as MatchContext-owned boundaries
- Entry reference as read-only
- Construction validation only (no behavior methods)
- CommonJS style consistent with Competition Core Domain
- Legacy compatibility

No production code outside `Modern/engine/operations/domain/` and `Modern/test/domains/` modified.
Follow TES Handoff Protocol.
