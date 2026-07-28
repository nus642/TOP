Task:
TASK-OPS-001-A4.1

Title:
DrawInput Value Object


Purpose:

Record the rationale for implementing DrawInput as the smallest independently deliverable unit from the A4 design.


# Why DrawInput First

A4 designed three components: DrawInput, DrawInputValidator, and readiness preparation check. DrawInput has zero dependencies on the other two. It depends only on OperationsError (from A1).

Delivering DrawInput alone:

- Provides immediate testable value
- Establishes the external data representation before validation logic
- Keeps the implementation step minimal and verifiable
- Does not block any existing A1/A3 functionality


# Design Decisions (from A4)

1. **Immutable Value Object**: DrawInput carries data only — no behavior, no side effects
2. **Exact MatchContext Requirements**: Contains Entry reference + round + court + sequence (nothing more)
3. **Not a Schedule Output**: DrawInput does not know how it was generated — it represents arrived data
4. **Separate from MatchContext**: DrawInput exists independently; MatchContext does not reference DrawInput
5. **Entry Reference is Read-Only**: Same principle as A1 — operations domain does not modify Entry
6. **receivedAt Timestamp**: Records when the draw input was received by the operations domain


# What DrawInput Is NOT

- Not a validator (DrawInputValidator is a separate future task)
- Not a command (does not trigger MatchContext creation)
- Not a state holder (no lifecycle, no transitions)
- Not a schedule representation (does not know generation algorithm)
- Not connected to execution flow (no reference to MatchExecutionContext)


# Scope Boundary

Included:

- DrawInput class with constructor validation
- Getters for entry, round, court, sequence, receivedAt
- OperationsError on missing/invalid fields
- Domain test file
- Exports update (index.js)

Excluded:

- DrawInputValidator
- Readiness preparation
- MatchContext modification
- MatchExecutionContext modification
- Draw generation / Scheduling
- API / Service / Repository / Database
- Notification / Scoring / Ranking
- Workflow engine / State machine


# Implementation Guidance

Implementation must preserve:

- MatchContext unchanged from A1 (identity boundary only)
- Entry reference as read-only (from A1)
- CommonJS style consistent with A1/A3
- Legacy compatibility
- DrawInput as pure data (no behavior)

No production code outside `Modern/engine/operations/domain/` and `Modern/test/domains/` modified.
Follow TES Handoff Protocol.
