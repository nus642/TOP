Task:
TASK-OPS-001-A2

Title:
Match Execution Core Loop


# Implementation Phases

## Phase 1: MatchResult Value Object

**Objective**: Establish the result value object (created by Referee authority, stored by MatchExecutionContext).

**Activities**:

1. Create `match-result.js`
   - Constructor validates options object
   - Requires winner reference (Entry reference or identifier)
   - Requires score summary (opaque data — no scoring logic)
   - Requires recorded timestamp
   - All properties are read-only (getters only, no setters)
   - Throws OperationsError for invalid construction
   - Does NOT require actor context reference (creation authority enforced by caller)

2. Construction validation rules
   - Missing options → OperationsError
   - Missing winner reference → OperationsError
   - Missing score summary → OperationsError

**Deliverables**:

- `Modern/engine/operations/domain/match-result.js`

**Acceptance Criteria**:

- Valid MatchResult created with winner + score
- Missing winner rejected
- Missing score rejected
- All properties read-only after construction
- No actor context coupling in value object itself


## Phase 2: MasterConfirmation

**Objective**: Establish Master confirmation value object (created by Master authority, stored by MatchExecutionContext).

**Activities**:

1. Create `master-confirmation.js`
   - Constructor validates options object
   - Requires valid MatchResult reference
   - Stores confirmed timestamp
   - All properties are read-only
   - Validates MatchResult is valid instance
   - Throws OperationsError for invalid construction
   - Does NOT require actor context reference (creation authority enforced by caller)

2. Construction validation rules
   - Missing options → OperationsError
   - Missing MatchResult → OperationsError
   - Invalid MatchResult type → OperationsError

**Deliverables**:

- `Modern/engine/operations/domain/master-confirmation.js`

**Acceptance Criteria**:

- Valid MasterConfirmation created with MatchResult reference
- Missing MatchResult rejected
- Invalid MatchResult type rejected
- All properties read-only after construction
- No actor context coupling in value object itself


## Phase 3: CompetitionUpdateIntent

**Objective**: Establish competition update intent as a pure signal object.

**Activities**:

1. Create `competition-update-intent.js`
   - Constructor validates options object
   - Requires valid MatchContext reference
   - Requires valid MatchResult reference
   - Requires valid MasterConfirmation reference
   - Stores intent timestamp
   - All properties are read-only
   - Does NOT perform any competition update
   - Does NOT enforce execution preconditions (caller responsibility)
   - Is a pure signal/intent object

2. Construction validation rules
   - Missing options → OperationsError
   - Missing MatchContext → OperationsError
   - Missing MatchResult → OperationsError
   - Missing MasterConfirmation → OperationsError
   - Invalid types → OperationsError

**Deliverables**:

- `Modern/engine/operations/domain/competition-update-intent.js`

**Acceptance Criteria**:

- Valid CompetitionUpdateIntent created with all references
- Missing any reference rejected
- Invalid types rejected
- Does not perform any external operation
- Does not enforce execution preconditions
- All properties read-only after construction


## Phase 4: RefereeOperationalContext Extension

**Objective**: Add result creation authority to RefereeOperationalContext.

**Activities**:

1. Add `recordResult(resultData)` method to RefereeOperationalContext
   - Validates resultData contains winner reference
   - Validates resultData contains score summary
   - Creates and returns a MatchResult instance
   - Sets recorded timestamp
   - Throws OperationsError for invalid resultData
   - Does NOT store the result (caller submits to MatchExecutionContext)

2. Validation rules
   - Missing resultData → OperationsError
   - Missing winner → OperationsError
   - Missing score → OperationsError

**Deliverables**:

- Updated `Modern/engine/operations/domain/referee-operational-context.js`

**Acceptance Criteria**:

- recordResult() creates valid MatchResult
- recordResult() rejects missing winner
- recordResult() rejects missing score
- Returned MatchResult is immutable
- RefereeOperationalContext does not store the result
- Existing A1 behavior unchanged


## Phase 5: MasterOperationalContext Extension

**Objective**: Add confirmation creation authority to MasterOperationalContext.

**Activities**:

1. Add `confirmResult(matchResult)` method to MasterOperationalContext
   - Validates matchResult is a valid MatchResult instance
   - Creates and returns a MasterConfirmation instance
   - Sets confirmed timestamp
   - Throws OperationsError for invalid matchResult
   - Does NOT store the confirmation (caller submits to MatchExecutionContext)

2. Validation rules
   - Missing matchResult → OperationsError
   - Invalid matchResult type → OperationsError

**Deliverables**:

- Updated `Modern/engine/operations/domain/master-operational-context.js`

**Acceptance Criteria**:

- confirmResult() creates valid MasterConfirmation
- confirmResult() rejects missing result
- confirmResult() rejects invalid result type
- Returned MasterConfirmation is immutable
- MasterOperationalContext does not store the confirmation
- Existing A1 behavior unchanged


## Phase 6: MatchExecutionContext

**Objective**: Establish the execution behavior owner as a separate domain object.

**Activities**:

1. Create `match-execution-context.js`
   - Constructor validates options object
   - Requires valid MatchContext reference
   - Stores MatchContext reference (`this.matchContext`)
   - Initializes `_status` to "Scheduled"
   - Initializes `_result` to null
   - Initializes `_confirmation` to null
   - Provides `status` getter
   - Provides `result` getter
   - Provides `confirmation` getter

2. Add `start()` method
   - Precondition: status is "Scheduled" or "Match Calling"
   - Sets status to "In Progress"
   - Throws OperationsError if already In Progress, Completed, or Cancelled

3. Add `submitResult(matchResult)` method
   - Precondition: status is "In Progress"
   - Precondition: no result already stored
   - Validates matchResult is valid MatchResult instance
   - Stores result (`_result`)
   - Throws OperationsError if not In Progress
   - Throws OperationsError if result already exists
   - Throws OperationsError if invalid type

4. Add `submitConfirmation(masterConfirmation)` method
   - Precondition: result exists
   - Precondition: no confirmation already stored
   - Validates masterConfirmation is valid MasterConfirmation instance
   - Stores confirmation (`_confirmation`)
   - Throws OperationsError if no result
   - Throws OperationsError if confirmation already exists
   - Throws OperationsError if invalid type

5. Add `complete()` method
   - Precondition: status is "In Progress"
   - Precondition: result exists and confirmation exists
   - Sets status to "Completed"
   - Throws OperationsError if not In Progress
   - Throws OperationsError if result not confirmed

6. Add `cancel()` method
   - Precondition: status is not "Completed" or "Cancelled"
   - Sets status to "Cancelled"
   - Throws OperationsError if Completed or Cancelled

7. Add `getCompetitionUpdateIntent()` method
   - Precondition: status is "Completed"
   - Precondition: confirmation exists
   - Creates and returns CompetitionUpdateIntent instance
   - Throws OperationsError if not Completed
   - Throws OperationsError if no confirmation

**Deliverables**:

- `Modern/engine/operations/domain/match-execution-context.js`

**Acceptance Criteria**:

- Valid MatchExecutionContext constructed with MatchContext reference
- Invalid MatchContext rejected
- start() sets status to In Progress
- start() rejects if wrong status
- submitResult() stores MatchResult
- submitResult() rejects if not In Progress
- submitResult() rejects duplicate
- submitConfirmation() stores MasterConfirmation
- submitConfirmation() rejects without result
- submitConfirmation() rejects duplicate
- complete() requires confirmed result
- cancel() sets Cancelled
- cancel() rejects if terminal
- getCompetitionUpdateIntent() returns intent after completion
- getCompetitionUpdateIntent() rejects before completion
- MatchContext not modified by any operation
- No state machine framework used
- No state history tracked


## Phase 7: CommonJS Exports Update

**Objective**: Export new domain objects.

**Activities**:

1. Update `Modern/engine/operations/domain/index.js`
   - Add MatchResult export
   - Add MasterConfirmation export
   - Add CompetitionUpdateIntent export
   - Add MatchExecutionContext export

2. Update `Modern/engine/operations/index.js`
   - Ensure new domain objects accessible via top-level require

**Deliverables**:

- Updated `Modern/engine/operations/domain/index.js`
- Updated `Modern/engine/operations/index.js`

**Acceptance Criteria**:

- All new domain objects accessible via require
- No circular dependency issues
- Existing A1 exports unchanged


## Phase 8: Domain Tests

**Objective**: Comprehensive test coverage for execution behavior.

**Activities**:

1. MatchResult tests
   - Valid construction with winner + score
   - Rejection: missing winner
   - Rejection: missing score
   - Immutability verification

2. MasterConfirmation tests
   - Valid construction with result reference
   - Rejection: missing result
   - Rejection: invalid result type
   - Immutability verification

3. CompetitionUpdateIntent tests
   - Valid construction with all references
   - Rejection: missing references
   - Rejection: invalid types
   - Does not perform external operations

4. RefereeOperationalContext extension tests
   - recordResult() creates valid MatchResult
   - recordResult() rejects missing winner
   - recordResult() rejects missing score
   - Existing A1 boundary validation unchanged

5. MasterOperationalContext extension tests
   - confirmResult() creates valid MasterConfirmation
   - confirmResult() rejects missing result
   - confirmResult() rejects invalid result type
   - Existing A1 boundary validation unchanged

6. MatchExecutionContext tests
   - Valid construction with MatchContext
   - Rejection: invalid MatchContext
   - start(): valid
   - start(): rejected wrong status
   - submitResult(): valid
   - submitResult(): rejected not In Progress
   - submitResult(): rejected duplicate
   - submitResult(): rejected invalid type
   - submitConfirmation(): valid
   - submitConfirmation(): rejected without result
   - submitConfirmation(): rejected duplicate
   - submitConfirmation(): rejected invalid type
   - complete(): valid
   - complete(): rejected without confirmation
   - cancel(): valid
   - cancel(): rejected when terminal
   - getCompetitionUpdateIntent(): valid after completion
   - getCompetitionUpdateIntent(): rejected before completion
   - MatchContext unchanged after all operations

7. Regression tests
   - Existing A1 test suite passes (MatchContext, actor contexts, OperationsError)
   - Existing Competition Core Domain tests pass
   - No regression in existing functionality

**Deliverables**:

- `Modern/test/domains/match-result.test.js`
- `Modern/test/domains/master-confirmation.test.js`
- `Modern/test/domains/competition-update-intent.test.js`
- `Modern/test/domains/match-execution-context.test.js`
- Updated `Modern/test/domains/operations-legacy-regression.test.js`

**Acceptance Criteria**:

- All new domain tests passing
- All A1 tests still passing
- Legacy regression tests passing
- No regression in existing functionality


# Expected File Changes

## New Files

- `Modern/engine/operations/domain/match-result.js`
- `Modern/engine/operations/domain/master-confirmation.js`
- `Modern/engine/operations/domain/competition-update-intent.js`
- `Modern/engine/operations/domain/match-execution-context.js`
- `Modern/test/domains/match-result.test.js`
- `Modern/test/domains/master-confirmation.test.js`
- `Modern/test/domains/competition-update-intent.test.js`
- `Modern/test/domains/match-execution-context.test.js`

## Modified Files

- `Modern/engine/operations/domain/referee-operational-context.js` (add recordResult)
- `Modern/engine/operations/domain/master-operational-context.js` (add confirmResult)
- `Modern/engine/operations/domain/index.js` (add new exports)
- `Modern/engine/operations/index.js` (add new exports)
- `Modern/test/domains/operations-legacy-regression.test.js` (add A2 regression)

## Unchanged Files

- `Modern/engine/operations/domain/match-context.js` (A1 contract preserved)
- `Modern/engine/operations/domain/operations-error.js` (A1 unchanged)


# Integration Boundary

## No External Layer Modifications

This task does NOT modify:

- `Modern/api/`
- `Modern/services/`
- `Modern/repositories/`
- `Modern/db.sql`
- `Modern/engine/competition/`
- Legacy code

## A1 Foundation Consumption

This task builds on A1 domain objects without modifying MatchContext:

```
const { MatchContext, MasterOperationalContext, RefereeOperationalContext, OperationsError } = require("./index");
```

MatchContext is referenced but not modified.
Actor contexts are extended with creation methods (backward compatible).


# Testing Strategy

## Test Tools

**Framework**: Node built-in test runner (`node:test`)
**Assertion Library**: `node:assert/strict`

## Test Execution

```bash
# Run all tests
node --test Modern/test/

# Run A2 domain tests only
node --test Modern/test/domains/match-result.test.js
node --test Modern/test/domains/master-confirmation.test.js
node --test Modern/test/domains/competition-update-intent.test.js
node --test Modern/test/domains/match-execution-context.test.js

# Run legacy regression tests
node --test Modern/test/domains/operations-legacy-regression.test.js
```


# Rollback Considerations

## Rollback Steps

**Files to Remove**:

- `Modern/engine/operations/domain/match-result.js`
- `Modern/engine/operations/domain/master-confirmation.js`
- `Modern/engine/operations/domain/competition-update-intent.js`
- `Modern/engine/operations/domain/match-execution-context.js`
- `Modern/test/domains/match-result.test.js`
- `Modern/test/domains/master-confirmation.test.js`
- `Modern/test/domains/competition-update-intent.test.js`
- `Modern/test/domains/match-execution-context.test.js`

**Files to Restore**:

- `Modern/engine/operations/domain/referee-operational-context.js` (restore A1 version)
- `Modern/engine/operations/domain/master-operational-context.js` (restore A1 version)
- `Modern/engine/operations/domain/index.js` (restore A1 exports)
- `Modern/engine/operations/index.js` (restore A1 exports)
- `Modern/test/domains/operations-legacy-regression.test.js` (restore A1 version)

## Rollback Safety

- Rollback is safe (no data changes)
- Rollback is reversible (no permanent changes)
- Rollback is fast (isolated domain)
- Legacy workflows unaffected
- MatchContext never modified — A1 always intact

No production code modified outside operations domain.
Follow TES Handoff Protocol.
