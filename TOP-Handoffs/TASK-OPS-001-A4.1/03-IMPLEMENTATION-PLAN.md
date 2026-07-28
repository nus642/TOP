Task:
TASK-OPS-001-A4.1

Title:
DrawInput Value Object


# Implementation Phases

## Phase 1: DrawInput Value Object

**File**: `Modern/engine/operations/domain/draw-input.js`

**Implementation**:

```
const OperationsError = require('./operations-error');

class DrawInput {
  constructor(options)
  - Validate options exists and is object
  - Validate options.entry exists
  - Validate options.round exists
  - Validate options.court exists
  - Validate options.sequence exists
  - Store _entry = options.entry
  - Store _round = options.round
  - Store _court = options.court
  - Store _sequence = options.sequence
  - Store _receivedAt = new Date()

  get entry() → return this._entry
  get round() → return this._round
  get court() → return this._court
  get sequence() → return this._sequence
  get receivedAt() → return new Date(this._receivedAt.getTime())
}

module.exports = DrawInput;
```

**Validation**:
- Missing options / not object → OperationsError("INVALID_OPTIONS", "DrawInput requires an options object")
- Missing entry → OperationsError("MISSING_ENTRY", "DrawInput requires an entry reference")
- Missing round → OperationsError("MISSING_ROUND", "DrawInput requires a round")
- Missing court → OperationsError("MISSING_COURT", "DrawInput requires a court")
- Missing sequence → OperationsError("MISSING_SEQUENCE", "DrawInput requires a sequence")

**Constraints**:
- No setters
- No behavior methods beyond getters
- No require of MatchContext, DrawInputValidator, or MatchExecutionContext
- receivedAt getter returns copy (immutability)


## Phase 2: Exports Update

**Files**:
- `Modern/engine/operations/domain/index.js` (modify)
- `Modern/engine/operations/index.js` (modify)

**Add exports**:
- DrawInput

**Constraint**: Existing A1/A3 exports unchanged.


## Phase 3: Tests

**Test file**: `Modern/test/domains/draw-input.test.js`

**Test cases**:

1. Valid construction
   - Create DrawInput with entry + round + court + sequence
   - Assert all getters return correct values
   - Assert receivedAt is a Date

2. Rejection: missing options
   - new DrawInput() → throws OperationsError("INVALID_OPTIONS")
   - new DrawInput(null) → throws OperationsError("INVALID_OPTIONS")
   - new DrawInput("string") → throws OperationsError("INVALID_OPTIONS")

3. Rejection: missing entry
   - new DrawInput({ round: 1, court: "A", sequence: 1 }) → throws OperationsError("MISSING_ENTRY")

4. Rejection: missing round
   - new DrawInput({ entry: mockEntry, court: "A", sequence: 1 }) → throws OperationsError("MISSING_ROUND")

5. Rejection: missing court
   - new DrawInput({ entry: mockEntry, round: 1, sequence: 1 }) → throws OperationsError("MISSING_COURT")

6. Rejection: missing sequence
   - new DrawInput({ entry: mockEntry, round: 1, court: "A" }) → throws OperationsError("MISSING_SEQUENCE")

7. Immutability
   - Assign to getter properties → no effect (strict mode) or silently ignored
   - receivedAt returns different Date instance on each call

8. No behavior methods
   - Object.getOwnPropertyNames(DrawInput.prototype) contains only constructor + getters

**Test execution**:

```bash
node --test Modern/test/domains/draw-input.test.js
```


# Expected File Changes

## New Files

- `Modern/engine/operations/domain/draw-input.js`
- `Modern/test/domains/draw-input.test.js`

## Modified Files

- `Modern/engine/operations/domain/index.js` (add DrawInput export)
- `Modern/engine/operations/index.js` (add DrawInput export)

## Unchanged Files

- `Modern/engine/operations/domain/match-context.js`
- `Modern/engine/operations/domain/operations-error.js`
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

**Remove**: `draw-input.js`, `draw-input.test.js`.
**Restore**: `index.js` files to pre-A4.1 state.
**Safety**: No data changes. MatchContext never touched. Legacy unaffected.

Follow TES Handoff Protocol.
