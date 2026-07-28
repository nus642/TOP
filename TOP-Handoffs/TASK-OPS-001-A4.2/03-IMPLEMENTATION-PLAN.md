Task:
TASK-OPS-001-A4.2

Title:
DrawInput Validation Boundary


# Implementation Phases

## Phase 1: DrawInputValidator

**File**: `Modern/engine/operations/domain/draw-input-validator.js`

**Implementation**:

```
const OperationsError = require('./operations-error');
const DrawInput = require('./draw-input');

class DrawInputValidator {
  validate(drawInput)
  - Check drawInput is DrawInput instance
    → fail: OperationsError("INVALID_DRAW_INPUT", "Expected a DrawInput instance")
  - Check drawInput.entry is valid Entry instance
    → fail: OperationsError("INVALID_ENTRY", "DrawInput entry must be a valid Entry instance")
  - Check drawInput.round is positive integer or valid identifier
    → fail: OperationsError("INVALID_ROUND", "DrawInput round must be a positive integer or valid identifier")
  - Check drawInput.court is valid identifier (non-empty string or positive integer)
    → fail: OperationsError("INVALID_COURT", "DrawInput court must be a valid identifier")
  - Check drawInput.sequence is positive integer
    → fail: OperationsError("INVALID_SEQUENCE", "DrawInput sequence must be a positive integer")
  - Return true

  toMatchContextOptions(drawInput)
  - Call this.validate(drawInput) — throws on failure
  - Return plain object:
    {
      entry: drawInput.entry,
      drawPosition: {
        round: drawInput.round,
        court: drawInput.court,
        sequence: drawInput.sequence
      }
    }
  - Does NOT create MatchContext
  - Does NOT modify DrawInput
}

module.exports = DrawInputValidator;
```

**Validation Rules Detail**:

| Field | Valid Condition | Check Logic |
|-------|----------------|-------------|
| drawInput | instanceof DrawInput | `drawInput instanceof DrawInput` |
| entry | Entry instance from Competition Core | Instance check (duck-typing or require) |
| round | Positive integer OR non-empty string | `Number.isInteger(round) && round > 0` OR `typeof round === 'string' && round.length > 0` |
| court | Non-empty string OR positive integer | `typeof court === 'string' && court.length > 0` OR `Number.isInteger(court) && court > 0` |
| sequence | Positive integer | `Number.isInteger(sequence) && sequence > 0` |

**Constraints**:
- Does NOT require MatchContext
- Does NOT require MatchExecutionContext
- Does NOT modify DrawInput
- Does NOT create any domain object
- Entry check is read-only (no mutation)
- Fails fast on first invalid field


## Phase 2: Exports Update

**Files**:
- `Modern/engine/operations/domain/index.js` (modify)
- `Modern/engine/operations/index.js` (modify)

**Add exports**:
- DrawInputValidator

**Constraint**: Existing A1/A3/A4.1 exports unchanged.


## Phase 3: Tests

**Test file**: `Modern/test/domains/draw-input-validator.test.js`

**Test cases**:

1. Valid DrawInput passes validate()
   - Create valid DrawInput → validate() returns true

2. Invalid drawInput type
   - validate(null) → throws OperationsError("INVALID_DRAW_INPUT")
   - validate({}) → throws OperationsError("INVALID_DRAW_INPUT")
   - validate("string") → throws OperationsError("INVALID_DRAW_INPUT")

3. Invalid Entry
   - DrawInput with non-Entry entry → validate() throws OperationsError("INVALID_ENTRY")

4. Invalid round
   - DrawInput with round = 0 → throws OperationsError("INVALID_ROUND")
   - DrawInput with round = -1 → throws OperationsError("INVALID_ROUND")
   - DrawInput with round = "" → throws OperationsError("INVALID_ROUND")

5. Invalid court
   - DrawInput with court = "" → throws OperationsError("INVALID_COURT")
   - DrawInput with court = null → throws OperationsError("INVALID_COURT")

6. Invalid sequence
   - DrawInput with sequence = 0 → throws OperationsError("INVALID_SEQUENCE")
   - DrawInput with sequence = -1 → throws OperationsError("INVALID_SEQUENCE")
   - DrawInput with sequence = "abc" → throws OperationsError("INVALID_SEQUENCE")

7. toMatchContextOptions() correct shape
   - Valid DrawInput → returns { entry, drawPosition: { round, court, sequence } }
   - entry matches drawInput.entry
   - drawPosition fields match drawInput fields

8. toMatchContextOptions() does not create MatchContext
   - Result is plain object (not MatchContext instance)

9. Does not modify DrawInput
   - DrawInput getters return same values before and after validate()

**Test execution**:

```bash
node --test Modern/test/domains/draw-input-validator.test.js
```


# Expected File Changes

## New Files

- `Modern/engine/operations/domain/draw-input-validator.js`
- `Modern/test/domains/draw-input-validator.test.js`

## Modified Files

- `Modern/engine/operations/domain/index.js` (add DrawInputValidator export)
- `Modern/engine/operations/index.js` (add DrawInputValidator export)

## Unchanged Files

- `Modern/engine/operations/domain/match-context.js`
- `Modern/engine/operations/domain/operations-error.js`
- `Modern/engine/operations/domain/draw-input.js`
- `Modern/engine/operations/domain/match-execution-context.js`
- `Modern/engine/operations/domain/match-result.js`
- `Modern/engine/operations/domain/master-confirmation.js`
- `Modern/engine/operations/domain/competition-update-intent.js`


# Integration Boundary

This task does NOT modify:

- `Modern/api/`
- `Modern/services/`
- `Modern/repositories/`
- `Modern/db.sql`
- `Modern/engine/competition/`
- Legacy code


# Rollback

**Remove**: `draw-input-validator.js`, `draw-input-validator.test.js`.
**Restore**: `index.js` files to pre-A4.2 state.
**Safety**: No data changes. MatchContext never touched. DrawInput unchanged. Legacy unaffected.

Follow TES Handoff Protocol.
