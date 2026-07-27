Task:
TASK-OPS-001-A2

Title:
Match Execution Core Loop


Purpose:

Record the rationale and design decisions for implementing the minimal match execution behavior as the second code deliverable of TASK-OPS-001-A.


# Why Match Execution Core Loop is Needed

TASK-OPS-001-A1 delivered the structural foundation:

- MatchContext aggregate root with construction validation
- MasterOperationalContext boundary
- RefereeOperationalContext boundary
- OperationsError domain error type

The foundation has no behavior. MatchContext can be constructed but cannot execute. The approved architecture defines an operational workflow:

Match Ready → Calling Issued → Player Ready → Referee Ready → Court Ready → Match Start → Result

This sub-task implements the minimal domain behavior for the execution portion of this loop: starting a match, recording a result, confirming a result, and signaling competition update intent.

This is the smallest next step that makes the operations domain operationally useful.


# MatchExecutionContext as Execution Behavior Owner

Execution behavior lives in a dedicated MatchExecutionContext, separate from MatchContext.

Design decisions:

1. **MatchContext Unchanged**: MatchContext remains the identity aggregate root from A1 — Entry reference, draw position, actor contexts. No new methods or fields.
2. **Separate Execution Concern**: MatchExecutionContext owns execution lifecycle — status, result storage, confirmation storage, intent emission.
3. **References MatchContext**: MatchExecutionContext is constructed with a MatchContext reference (same pattern as actor contexts in A1).
4. **Execution Prerequisites**: Simple if-checks before operations (e.g., "is status In Progress?"). These are operational preconditions, not state transition rules.
5. **No History**: Only current status is tracked — no state change log.

Why separate from MatchContext:

- MatchContext is stable identity — should not grow with each new behavior
- Future readiness workflows (Player, Court) will not bloat MatchContext
- Execution context can be tested and rolled back independently
- Follows A1 pattern: actor contexts belong to MatchContext but are independent objects


# Result Recording Boundary

MatchResult represents the outcome recorded by the Referee.

Key decisions:

- MatchResult is a value object (immutable once created)
- **Creation authority**: RefereeOperationalContext.recordResult() creates MatchResult
- **Ownership**: MatchExecutionContext.submitResult() receives and stores it
- MatchResult contains: winner reference, score summary, recorded timestamp
- MatchResult does NOT contain scoring calculation logic
- MatchResult does NOT validate score correctness (future scoring domain)

This separates creation authority (Referee) from storage ownership (MatchExecutionContext). Referee creates, execution context holds.


# Master Confirmation Boundary

MasterConfirmation represents Master's approval of a recorded result.

Key decisions:

- **Creation authority**: MasterOperationalContext.confirmResult() creates MasterConfirmation
- **Ownership**: MatchExecutionContext.submitConfirmation() receives and stores it
- MasterConfirmation references a specific MatchResult
- MasterConfirmation contains: confirmed timestamp, confirming authority
- MasterConfirmation is required before match can complete
- Master can decline (no confirmation issued)
- MasterConfirmation does NOT modify the result

This separates creation authority (Master) from storage ownership (MatchExecutionContext). Master creates, execution context holds.


# Competition Update Intent Boundary

CompetitionUpdateIntent signals that a confirmed result should update competition state.

Key decisions:

- Emitted by MatchExecutionContext (not MatchContext)
- Is a signal/intent object — does NOT perform the actual update
- Contains: match reference, result reference, confirmation reference, intent timestamp
- Consumer (competition domain) is NOT implemented in this task
- Decouples operations domain from competition domain modification
- Enables future async/event-driven processing without changing operations domain
- Construction validates references exist but does not enforce execution preconditions

This preserves domain separation: Operations signals intent, Competition Core Domain performs structural updates.


# What This Task Does NOT Implement

Explicitly confirmed — this task does NOT implement:

- State machine framework (no transition tables, no guards framework)
- State transition rules (execution prerequisites are simple if-checks only)
- State history tracking
- Notification triggers on status change
- Scoring calculation or validation
- Ranking calculation
- Persistence (no database interaction)
- API endpoints
- Authentication or authorization
- Scheduling behavior
- Player readiness workflow (future sub-task)
- Court readiness workflow (future sub-task)
- Any modification to MatchContext (A1 contract preserved)


# Scope Boundary

Included:

- MatchExecutionContext (execution behavior owner)
- MatchResult value object (created by Referee)
- MasterConfirmation (created by Master)
- CompetitionUpdateIntent signal object (emitted by MatchExecutionContext)
- RefereeOperationalContext.recordResult() extension
- MasterOperationalContext.confirmResult() extension
- CommonJS exports (updated)
- Domain tests
- Legacy regression tests

Excluded:

- State machine framework
- State transition rules
- Notification
- Scoring engine
- Ranking system
- Scheduling algorithm
- API endpoints
- Database schema
- Service layer
- Repository layer
- Frontend
- Authentication / Authorization


# Implementation Guidance

Implementation must preserve:

- MatchContext unchanged from A1 (identity boundary only)
- Actor contexts as MatchContext-owned boundaries (from A1)
- Entry reference as read-only (from A1)
- CommonJS style consistent with A1 and Competition Core Domain
- Legacy compatibility
- Creation authority on actor contexts (Referee creates result, Master creates confirmation)
- Storage ownership on MatchExecutionContext
- Execution prerequisites as simple if-checks (not transition rules)

No production code outside `Modern/engine/operations/domain/` and `Modern/test/domains/` modified.
Follow TES Handoff Protocol.
