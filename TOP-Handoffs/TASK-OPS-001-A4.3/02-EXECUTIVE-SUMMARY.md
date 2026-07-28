Task:
TASK-OPS-001-A4.3

Title:
Operational Readiness Query


Purpose:

Record the rationale and semantics for the operational readiness query function as a pure, side-effect-free information check.


# Why a Readiness Query

A1 established MatchContext with actor context attachment. A3 delivered MatchExecutionContext with execution preconditions. Between these two exists a semantic gap:

- "MatchContext is constructed" ≠ "execution can begin"
- Actor contexts must be attached before the match is operationally ready

A4.3 makes this gap queryable without introducing state, commands, or transitions.


# What Readiness Means

Readiness is a factual condition, not a state:

- MatchContext exists (constructed from valid draw input)
- MasterOperationalContext is attached
- RefereeOperationalContext is attached

When all conditions hold, the match is "operationally ready". This is a fact that can be queried at any time. It does not need to be "activated" or "transitioned into".


# Query-Only Design

The readiness check is strictly a query:

- Returns structured result: `{ ready: true }` or `{ ready: false, missing: [...] }`
- Does NOT maintain or modify any activation state
- Does NOT trigger lifecycle transition
- Does NOT define activate() or similar command method
- Does NOT start execution or trigger notifications
- Does NOT orchestrate actors

This follows the principle: asking "is it ready?" must never change anything.


# Separation from Execution

MatchExecutionContext.start() has its own preconditions (status checks from A3). The readiness query is informational only:

- Readiness query: "Are the actors in place?" (informational)
- MatchExecutionContext.start(): "Can execution begin?" (operational precondition)

These are independent concerns. The readiness query does not gate execution. It provides visibility.


# What This Is NOT

- NOT an activation state (no "activated" flag stored anywhere)
- NOT a lifecycle phase (no transition from "preparing" to "ready")
- NOT a workflow step (no orchestration logic)
- NOT a command (does not change anything)
- NOT a guard on MatchExecutionContext (execution has its own checks)
- NOT a notification trigger (does not signal anyone)


# Dependency Boundary

checkReadinessPreparation depends on:

- MatchContext (A1) — reads masterContext/refereeContext attachment
- OperationsError (A1) — input validation

Does NOT depend on:

- DrawInput / DrawInputValidator (A4.1/A4.2)
- MatchExecutionContext (A3)
- MatchResult / MasterConfirmation / CompetitionUpdateIntent (A3)


# Implementation Guidance

Implementation must preserve:

- MatchContext unchanged from A1 (no new methods)
- CommonJS style consistent with A1/A3
- Legacy compatibility
- Pure query semantics (no side effects)
- No activation state, no lifecycle transition, no activate() method

No production code outside `Modern/engine/operations/domain/` and `Modern/test/domains/` modified.
Follow TES Handoff Protocol.
