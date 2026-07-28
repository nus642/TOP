# TASK-OPS-001-A4.3: Operational Readiness Query

**Type:** CODE
**Priority:** High
**Dependency:** TASK-OPS-001-A1

**Objective:** Implement the operational readiness query function that checks whether a MatchContext has all required actor contexts attached for execution to begin.

**Background:** A1 established MatchContext with actor context attachment (MasterOperationalContext, RefereeOperationalContext). A4 designed readiness preparation as a standalone query. A4.3 delivers this query function — a pure, side-effect-free check that answers: "Is this match operationally ready?"

**Design Authority:** `TOP-Handoffs/TASK-OPS-001-A4/` (Phase 3)

**Domain Location:** `Modern/engine/operations/domain/`

**Scope:**
- checkReadinessPreparation() standalone query function
- Input validation (OperationsError)
- Domain test

**Explicit Exclusions:**
- Activation state
- Lifecycle transition
- Workflow methods (startMatch, completeMatch, cancelMatch)
- activate() or similar command methods
- Notifications
- Actor orchestration
- MatchContext changes
- MatchExecutionContext changes
- DrawInputValidator
- API / Service / Repository / Database
- Scheduling / Scoring / Ranking
- Workflow engine / State machine

**Implementation Rules:**

1. MatchContext remains unchanged (A1 contract). No new methods on MatchContext.
2. Readiness check is a query only — returns structured result, produces no side effects.
3. No activation state is introduced or maintained.
4. No lifecycle transition is triggered.
5. No activate() method or similar command.
6. Does NOT modify MatchContext or actor contexts.
7. Does NOT trigger notification, calling, or execution.
8. Standalone exported function — not a class method.
9. CommonJS consistent with A1/A3/A4.1/A4.2.

**What Readiness Means:**

A match is "operationally ready" when:

| # | Condition | Check |
|---|-----------|-------|
| 1 | MatchContext exists | matchContext is valid MatchContext instance |
| 2 | MasterOperationalContext attached | matchContext.masterContext is not null/undefined |
| 3 | RefereeOperationalContext attached | matchContext.refereeContext is not null/undefined |

When all three conditions are met → `{ ready: true }`.
When any condition is missing → `{ ready: false, missing: [...] }`.

**Query Responsibility:**

- Input: MatchContext instance
- Output: `{ ready: boolean, missing?: string[] }`
- Side effects: NONE
- State mutation: NONE
- Relationship to execution: informational only (MatchExecutionContext.start() has its own preconditions)

**Output Shape:**

```
// All conditions met:
{ ready: true }

// Missing conditions:
{ ready: false, missing: ["masterContext", "refereeContext"] }
```

**Acceptance Criteria:**
- Both actor contexts attached → returns { ready: true }
- Missing masterContext → returns { ready: false, missing: ["masterContext"] }
- Missing refereeContext → returns { ready: false, missing: ["refereeContext"] }
- Missing both → returns { ready: false, missing: ["masterContext", "refereeContext"] }
- Invalid matchContext → throws OperationsError("INVALID_MATCH_CONTEXT")
- Does not modify MatchContext
- Does not trigger execution
- Does not introduce activation state
- Does not define lifecycle transition
- All A1/A3 tests still passing
- New domain test added

**Testing Requirements:**

Use Node built-in test runner (`node:test`) with `node:assert/strict`.

Test file:
- `Modern/test/domains/readiness-check.test.js`

**Integration Boundary:**

This task does NOT modify:
- `Modern/api/`
- `Modern/services/`
- `Modern/repositories/`
- `Modern/db.sql`
- `Modern/engine/competition/`
- `Modern/engine/operations/domain/match-context.js`
- `Modern/engine/operations/domain/operations-error.js`
- `Modern/engine/operations/domain/match-execution-context.js`
- `Modern/engine/operations/domain/draw-input.js`
- Legacy code

**Code Style:**

Follow existing A1/A3 patterns:
- CommonJS (`require` / `module.exports`)
- Exported standalone function
- Error pattern: `OperationsError(code, message)`

**Important Notes:**

This function clarifies the semantic gap between "MatchContext constructed" and "execution can begin". It is purely informational. No new architecture decisions. Follow TES Handoff Protocol.
