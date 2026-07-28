# TASK-OPS-001-A4: Draw Input Boundary and Readiness Preparation

**Type:** CODE
**Priority:** High
**Dependency:** TASK-OPS-001-A1, TASK-OPS-001-A3

**Objective:** Define the external draw input representation, establish the validation boundary for creating MatchContext from draw input, and formalize actor context attachment as operational readiness preparation.

**Background:** A1 established MatchContext with Entry reference + draw position (round, court, sequence). A3 delivered the execution flow. However, the external input that feeds MatchContext creation has no formal domain representation. A4 introduces DrawInput as the operations domain's ingress boundary and clarifies readiness preparation semantics.

**Design Authority:** `Docs/11_Engineering/TOP-Modern-Tournament-Operations-Architecture.md` (Domain Flow: Schedule → Match Operations)

**Domain Location:** `Modern/engine/operations/domain/`

**Scope P0:**
- DrawInput value object (external draw data representation)
- DrawInput validation boundary (completeness + consistency checks)
- Readiness preparation definition (actor context attachment semantics)
- Domain tests

**Explicit Exclusions:**
- Draw generation algorithm
- Scheduling algorithm
- Court calling system
- Notification
- Scoring
- Ranking
- Team lineup
- Authentication / Authorization
- API / Service / Repository / Database changes
- Workflow engine
- State machine

**Implementation Rules:**

1. MatchContext remains unchanged (A1 contract).
2. DrawInput is an immutable value object — carries data only, no behavior.
3. DrawInput validation is separate from MatchContext construction.
4. DrawInput contains exactly what MatchContext needs: Entry reference + round + court + sequence.
5. Actor context attachment (A1 existing) is formalized as readiness preparation.
6. Readiness check is a query only — no activation state, no lifecycle transition, no activate() method.
7. No new methods added to MatchContext.
8. No scheduling logic, no draw generation.

**Domain Objects:**

| Object | File | Responsibility |
|--------|------|----------------|
| DrawInput | `draw-input.js` | Immutable value object representing external draw data |
| DrawInputValidator | `draw-input-validator.js` | Validation boundary for DrawInput completeness and consistency |
| index (updated) | `index.js` | Add new exports |

**Readiness Preparation (Semantic Definition):**

Readiness preparation = a query that checks whether MatchExecutionContext can begin execution.

Defined as:
- MatchContext constructed from valid DrawInput ✓
- MasterOperationalContext attached ✓
- RefereeOperationalContext attached ✓

When all three conditions are met, the match is "operationally ready" for MatchExecutionContext.start().

This is a query only. No activation state. No lifecycle transition. No activate() method. No new methods on MatchContext.

**Acceptance Criteria:**
- DrawInput is immutable value object
- DrawInput requires Entry reference, round, court, sequence
- DrawInput rejects missing/incomplete data
- DrawInputValidator validates DrawInput before MatchContext consumption
- DrawInputValidator rejects invalid Entry reference
- DrawInputValidator rejects invalid draw position fields
- Readiness check verifies MatchContext + both actor contexts present (query only)
- MatchContext unchanged from A1
- All A1/A3 tests still passing
- New domain tests added

**Testing Requirements:**

Use Node built-in test runner (`node:test`) with `node:assert/strict`.

Test files:
- `Modern/test/domains/draw-input.test.js`
- `Modern/test/domains/draw-input-validator.test.js`
- `Modern/test/domains/readiness-check.test.js`
- Updated `Modern/test/domains/operations-legacy-regression.test.js`

**Integration Boundary:**

This task does NOT modify:
- `Modern/api/`
- `Modern/services/`
- `Modern/repositories/`
- `Modern/db.sql`
- `Modern/engine/competition/`
- `Modern/engine/operations/domain/match-context.js`
- `Modern/engine/operations/domain/operations-error.js`
- Legacy code

**Code Style:**

Follow existing A1/A3 patterns:
- CommonJS (`require` / `module.exports`)
- Class + constructor validation
- Private fields with `_` prefix + getter returning copies
- Error pattern: `OperationsError(code, message)`
- Lazy require for circular references

**Important Notes:**

DrawInput formalizes what already implicitly exists (A1 draw position parameters). This task makes the external boundary explicit. No new architecture decisions. Follow TES Handoff Protocol.
