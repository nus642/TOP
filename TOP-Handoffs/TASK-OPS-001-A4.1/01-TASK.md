# TASK-OPS-001-A4.1: DrawInput Value Object

**Type:** CODE
**Priority:** High
**Dependency:** TASK-OPS-001-A1

**Objective:** Implement the DrawInput immutable value object as the operations domain's external draw data representation.

**Background:** A1 established MatchContext requiring Entry reference + draw position (round, court, sequence). A4 designed DrawInput as the formal ingress boundary. A4.1 delivers the DrawInput value object only — the smallest independently testable unit.

**Design Authority:** `TOP-Handoffs/TASK-OPS-001-A4/` (Phase 1)

**Domain Location:** `Modern/engine/operations/domain/`

**Scope:**
- DrawInput value object (immutable, data-only)
- Constructor validation (OperationsError)
- Domain test

**Explicit Exclusions:**
- DrawInputValidator
- Readiness preparation
- MatchContext changes
- MatchExecutionContext changes
- Draw generation algorithm
- Scheduling algorithm
- API / Service / Repository / Database
- Notification / Scoring / Ranking
- Workflow engine / State machine

**Implementation Rules:**

1. MatchContext remains unchanged (A1 contract).
2. DrawInput is an immutable value object — carries data only, no behavior methods.
3. DrawInput contains exactly: Entry reference + round + court + sequence + receivedAt.
4. All properties read-only via getters.
5. Constructor validates all required fields; rejects with OperationsError.
6. No reference to DrawInputValidator, readiness, or execution flow.
7. CommonJS consistent with A1/A3.

**Domain Objects:**

| Object | File | Responsibility |
|--------|------|----------------|
| DrawInput | `draw-input.js` | Immutable value object representing external draw data |

**Acceptance Criteria:**
- Valid DrawInput created with Entry + round + court + sequence
- Missing options rejected
- Missing entry rejected
- Missing round rejected
- Missing court rejected
- Missing sequence rejected
- All properties read-only (getters only, no setters)
- No behavior methods beyond getters
- receivedAt timestamp set at construction
- All A1/A3 tests still passing
- New domain test added

**Testing Requirements:**

Use Node built-in test runner (`node:test`) with `node:assert/strict`.

Test file:
- `Modern/test/domains/draw-input.test.js`

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
- Legacy code

**Code Style:**

Follow existing A1/A3 patterns:
- CommonJS (`require` / `module.exports`)
- Class + constructor validation
- Private fields with `_` prefix + getter returning copies
- Error pattern: `OperationsError(code, message)`

**Important Notes:**

DrawInput formalizes what already implicitly exists (A1 draw position parameters). This task makes the external boundary explicit. No new architecture decisions. Follow TES Handoff Protocol.
