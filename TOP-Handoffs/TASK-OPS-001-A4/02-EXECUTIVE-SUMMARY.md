Task:
TASK-OPS-001-A4

Title:
Draw Input Boundary and Readiness Preparation


Purpose:

Record the rationale and design decisions for formalizing the external draw input boundary and readiness preparation semantics as the operations domain's ingress point.


# Why Draw Input Boundary is Needed

The approved architecture Domain Flow defines:

Schedule → Match Operations → Result

A1 established MatchContext construction requiring Entry reference + draw position (round, court, sequence). However, the data that feeds this construction has no formal domain representation. It arrives implicitly as constructor parameters.

A4 makes this boundary explicit:

- DrawInput represents what arrives from outside the operations domain
- DrawInputValidator ensures data quality before MatchContext consumption
- Readiness preparation defines when a match is ready for execution

This follows the same pattern as Entry Ingestion Layer: external data → value object → validation → domain consumption.


# DrawInput as External Boundary

DrawInput is the operations domain's ingress value object.

Design decisions:

1. **Immutable Value Object**: DrawInput carries data only — no behavior, no side effects
2. **Exact MatchContext Requirements**: Contains Entry reference + round + court + sequence (nothing more)
3. **Not a Schedule Output**: DrawInput does not know how it was generated — it represents arrived data
4. **Separate from MatchContext**: DrawInput exists before MatchContext construction; MatchContext does not reference DrawInput after construction
5. **Entry Reference is Read-Only**: Same principle as A1 — operations domain does not modify Entry

DrawInput represents the handoff point between Schedule domain (future) and Match Operations domain.


# Validation Boundary

DrawInputValidator provides pre-construction validation.

Key decisions:

- Validation is separate from MatchContext construction (MatchContext unchanged)
- Validates completeness: all required fields present
- Validates consistency: Entry reference is valid instance, draw position fields are valid
- Returns validated DrawInput or throws OperationsError
- Does NOT transform data — only validates
- Does NOT create MatchContext — caller does that after validation

This separation means MatchContext's existing construction validation remains the final guard, while DrawInputValidator provides an earlier, more descriptive validation layer.


# Readiness Preparation Semantics

Actor context attachment (from A1) is formalized as readiness preparation.

Key decisions:

- Readiness check is a query only — no activation state, no lifecycle transition, no activate() method
- Defined as: MatchContext exists + MasterOperationalContext attached + RefereeOperationalContext attached
- When all conditions met → match is "operationally ready"
- MatchExecutionContext.start() already requires In Progress status; readiness check is the precondition query before
- No new methods on MatchContext — readiness check is a standalone query function
- Does NOT trigger notification, calling, or execution
- Does NOT introduce an activation state or lifecycle transition

This clarifies the semantic gap between "MatchContext constructed" and "execution can begin".


# What This Task Does NOT Implement

- Draw generation algorithm
- Scheduling algorithm
- Court assignment logic
- Court calling system
- Notification triggers
- Scoring or ranking
- Team lineup management
- Authentication or authorization
- API / Service / Repository / Database changes
- Workflow engine or state machine
- Any modification to MatchContext


# Scope Boundary

Included:

- DrawInput immutable value object
- DrawInputValidator validation boundary
- Readiness preparation query function
- CommonJS exports (updated)
- Domain tests
- Legacy regression tests

Excluded:

- Draw generation
- Scheduling
- Court calling
- Notification
- Scoring / Ranking
- Team lineup
- Authentication / Authorization
- API / Service / Repository / Database
- Workflow engine / State machine


# Implementation Guidance

Implementation must preserve:

- MatchContext unchanged from A1 (identity boundary only)
- Entry reference as read-only (from A1)
- CommonJS style consistent with A1/A3
- Legacy compatibility
- DrawInput as pure data (no behavior)
- Validation separate from construction
- Readiness check as query only (no activation state, no lifecycle transition, no activate() method)

No production code outside `Modern/engine/operations/domain/` and `Modern/test/domains/` modified.
Follow TES Handoff Protocol.
