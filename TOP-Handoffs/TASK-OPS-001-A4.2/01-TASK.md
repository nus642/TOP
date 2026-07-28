# TASK-OPS-001-A4.2: DrawInput Validation Boundary

**Type:** CODE
**Priority:** High
**Dependency:** TASK-OPS-001-A4.1

**Objective:** Implement DrawInputValidator as the pre-construction validation layer for DrawInput, providing descriptive validation before MatchContext consumption.

**Background:** A4.1 delivered DrawInput as the external draw data representation. A4.2 adds the validation boundary that checks DrawInput data quality before it is consumed by MatchContext construction. This is a separate, earlier validation layer — MatchContext's own constructor validation remains the final guard.

**Design Authority:** `TOP-Handoffs/TASK-OPS-001-A4/` (Phase 2)

**Domain Location:** `Modern/engine/operations/domain/`

**Scope:**
- DrawInputValidator class
- validate() method (pure validation, true/throw)
- toMatchContextOptions() method (shape conversion, no construction)
- Domain test

**Explicit Exclusions:**
- MatchContext changes
- MatchExecutionContext
- Readiness preparation
- Actor workflow
- Draw generation algorithm
- Scheduling algorithm
- API / Service / Repository / Database
- Notification / Scoring / Ranking
- Workflow engine / State machine

**Implementation Rules:**

1. MatchContext remains unchanged (A1 contract).
2. DrawInputValidator validates DrawInput — does NOT create MatchContext.
3. toMatchContextOptions() returns a plain object shaped for MatchContext constructor — caller creates MatchContext.
4. Validation fails fast with descriptive OperationsError code.
5. Does NOT modify DrawInput (read-only access).
6. Does NOT transform data — only validates and shapes.
7. Entry instance check is read-only (operations domain does not modify Entry).
8. CommonJS consistent with A1/A3/A4.1.

**Domain Objects:**

| Object | File | Responsibility |
|--------|------|----------------|
| DrawInputValidator | `draw-input-validator.js` | Pre-construction validation and shape conversion for DrawInput |

**Validation Rules:**

| Check | Error Code | Condition |
|-------|-----------|-----------|
| drawInput is DrawInput instance | INVALID_DRAW_INPUT | Not instance of DrawInput |
| entry is valid Entry instance | INVALID_ENTRY | Not valid Entry from Competition Core Domain |
| round is valid | INVALID_ROUND | Not positive integer or valid identifier |
| court is valid | INVALID_COURT | Not valid identifier |
| sequence is valid | INVALID_SEQUENCE | Not positive integer |

**Relationship with MatchContext Creation:**

```
DrawInput → DrawInputValidator.validate() → pass
         → DrawInputValidator.toMatchContextOptions() → { entry, drawPosition: { round, court, sequence } }
         → Caller constructs MatchContext with options
```

DrawInputValidator does NOT call `new MatchContext()`. MatchContext's own constructor validation remains the final guard.

**Acceptance Criteria:**
- Valid DrawInput passes validate() → returns true
- Invalid DrawInput instance rejected (INVALID_DRAW_INPUT)
- Invalid Entry rejected (INVALID_ENTRY)
- Invalid round rejected (INVALID_ROUND)
- Invalid court rejected (INVALID_COURT)
- Invalid sequence rejected (INVALID_SEQUENCE)
- toMatchContextOptions() returns correct shape
- Does NOT create MatchContext
- Does NOT modify DrawInput
- All A1/A3/A4.1 tests still passing
- New domain test added

**Testing Requirements:**

Use Node built-in test runner (`node:test`) with `node:assert/strict`.

Test file:
- `Modern/test/domains/draw-input-validator.test.js`

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

Follow existing A1/A3/A4.1 patterns:
- CommonJS (`require` / `module.exports`)
- Class + method validation
- Error pattern: `OperationsError(code, message)`
- Lazy require for circular references if needed

**Important Notes:**

DrawInputValidator is the second layer of a two-layer validation strategy: Layer 1 = DrawInputValidator (descriptive, early), Layer 2 = MatchContext constructor (final guard). No new architecture decisions. Follow TES Handoff Protocol.
