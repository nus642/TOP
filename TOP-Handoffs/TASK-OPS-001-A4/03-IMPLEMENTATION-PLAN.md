Task:
TASK-OPS-001-A4

Title:
Draw Input Boundary and Readiness Preparation


# Implementation Phases

## Phase 1: DrawInput Value Object

**File**: `Modern/engine/operations/domain/draw-input.js`

**Implementation**:

```
class DrawInput {
  constructor(options)
  - Validate options exists
  - Validate entry reference exists
  - Validate round exists and is valid
  - Validate court exists and is valid
  - Validate sequence exists and is valid
  - Store _entry, _round, _court, _sequence, _receivedAt
  - All read-only via getters
  - No behavior methods
}
```

**Validation**:
- Missing options → OperationsError("INVALID_OPTIONS", ...)
- Missing entry → OperationsError("MISSING_ENTRY", ...)
- Missing round → OperationsError("MISSING_ROUND", ...)
- Missing court → OperationsError("MISSING_COURT", ...)
- Missing sequence → OperationsError("MISSING_SEQUENCE", ...)

**Exports**: `module.exports = DrawInput`

**Acceptance Criteria**:
- Valid DrawInput created with Entry + round + court + sequence
- Missing any field rejected
- All properties read-only
- No behavior methods
- receivedAt timestamp set at construction


## Phase 2: DrawInputValidator

**File**: `Modern/engine/operations/domain/draw-input-validator.js`

**Implementation**:

```
class DrawInputValidator {
  validate(drawInput)
  - Validate drawInput is DrawInput instance
  - Validate entry is valid Entry instance (from Competition Core Domain)
  - Validate round is positive integer or valid identifier
  - Validate court is valid identifier
  - Validate sequence is positive integer
  - Return true if all valid
  - Throw OperationsError with descriptive code on first failure

  toMatchContextOptions(drawInput)
  - Validate drawInput passes all checks
  - Return plain object: { entry, drawPosition: { round, court, sequence } }
  - Does NOT create MatchContext (caller responsibility)
}
```

**Validation**:
- Missing/invalid drawInput → OperationsError("INVALID_DRAW_INPUT", ...)
- Invalid Entry instance → OperationsError("INVALID_ENTRY", ...)
- Invalid round → OperationsError("INVALID_ROUND", ...)
- Invalid court → OperationsError("INVALID_COURT", ...)
- Invalid sequence → OperationsError("INVALID_SEQUENCE", ...)

**Exports**: `module.exports = DrawInputValidator`

**Acceptance Criteria**:
- Valid DrawInput passes validation
- Invalid Entry rejected with descriptive error
- Invalid draw position fields rejected
- toMatchContextOptions returns correct shape for MatchContext constructor
- Does NOT create MatchContext
- Does NOT modify DrawInput


## Phase 3: Readiness Preparation Check

**File**: `Modern/engine/operations/domain/readiness-preparation.js`

**Implementation**:

```
function checkReadinessPreparation(matchContext)
  - Validate matchContext is MatchContext instance
  - Check matchContext.masterContext is attached (not null)
  - Check matchContext.refereeContext is attached (not null)
  - Return { ready: true, matchContext } if both attached
  - Return { ready: false, missing: [...] } if not

  Does NOT:
  - Modify matchContext
  - Trigger any action
  - Create any object
  - Start execution
  - Introduce activation state or lifecycle transition
```

**Validation**:
- Missing matchContext → OperationsError("INVALID_MATCH_CONTEXT", ...)
- Invalid matchContext type → OperationsError("INVALID_MATCH_CONTEXT", ...)

**Exports**: `module.exports = { checkReadinessPreparation }`

**Acceptance Criteria**:
- Returns ready: true when both actor contexts attached
- Returns ready: false with missing list when incomplete
- Does not modify MatchContext
- Does not trigger execution
- Pure query function — no activation state, no lifecycle transition, no activate() method


## Phase 4: Exports Update

**Files**:
- `Modern/engine/operations/domain/index.js` (modify)
- `Modern/engine/operations/index.js` (modify)

**Add exports**:
- DrawInput
- DrawInputValidator
- checkReadinessPreparation

**Constraint**: Existing A1/A3 exports unchanged.


## Phase 5: Tests

**Test files**:

1. `Modern/test/domains/draw-input.test.js`
   - Valid construction with Entry + round + court + sequence
   - Rejection: missing entry
   - Rejection: missing round
   - Rejection: missing court
   - Rejection: missing sequence
   - Immutability verification
   - No behavior methods

2. `Modern/test/domains/draw-input-validator.test.js`
   - Valid DrawInput passes
   - Invalid Entry instance rejected
   - Invalid round rejected
   - Invalid court rejected
   - Invalid sequence rejected
   - toMatchContextOptions returns correct shape
   - Does not create MatchContext
   - Does not modify DrawInput

3. `Modern/test/domains/readiness-check.test.js`
   - Both contexts attached → ready: true
   - Missing master → ready: false, missing includes master
   - Missing referee → ready: false, missing includes referee
   - Missing both → ready: false, missing includes both
   - Does not modify MatchContext
   - Invalid matchContext rejected

4. `Modern/test/domains/operations-legacy-regression.test.js` (update)
   - A1 tests still pass
   - A3 tests still pass
   - Competition Core Domain tests still pass

**Test execution**:

```bash
node --test Modern/test/domains/draw-input.test.js
node --test Modern/test/domains/draw-input-validator.test.js
node --test Modern/test/domains/readiness-check.test.js
node --test Modern/test/domains/operations-legacy-regression.test.js
```


# Expected File Changes

## New Files

- `Modern/engine/operations/domain/draw-input.js`
- `Modern/engine/operations/domain/draw-input-validator.js`
- `Modern/engine/operations/domain/readiness-preparation.js`
- `Modern/test/domains/draw-input.test.js`
- `Modern/test/domains/draw-input-validator.test.js`
- `Modern/test/domains/readiness-check.test.js`

## Modified Files

- `Modern/engine/operations/domain/index.js` (add exports)
- `Modern/engine/operations/index.js` (add exports)
- `Modern/test/domains/operations-legacy-regression.test.js` (add A4 regression)

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

**Remove**: All new files listed above.
**Restore**: Modified files to A3 state.
**Safety**: No data changes. MatchContext never touched. Legacy unaffected.

Follow TES Handoff Protocol.
