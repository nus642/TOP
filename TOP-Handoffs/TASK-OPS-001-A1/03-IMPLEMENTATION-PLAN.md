Task:
TASK-OPS-001-A1

Title:
Match Context Foundation


# Implementation Phases

## Phase 1: OperationsError

**Objective**: Establish the operations domain error type.

**Activities**:

1. Create `operations-error.js`
   - Extends Error
   - Constructor: `OperationsError(code, message)`
   - Sets `this.name = "OperationsError"`
   - Sets `this.code = code`
   - Follows DomainError pattern from Competition Core Domain

**Deliverables**:

- `Modern/engine/operations/domain/operations-error.js`

**Acceptance Criteria**:

- OperationsError instantiates with code and message
- OperationsError is instanceof Error
- OperationsError.name equals "OperationsError"


## Phase 2: MatchContext

**Objective**: Establish the operational aggregate root with construction validation.

**Activities**:

1. Create `match-context.js`
   - Constructor validates options object
   - Requires valid Entry instance (from Competition Core Domain)
   - Requires draw position (round, court, sequence)
   - Stores Entry as read-only reference (`this.entry`)
   - Stores draw position fields
   - Initializes empty actor context slots
   - Provides `masterContext` getter
   - Provides `refereeContext` getter
   - Provides `attachMasterContext(masterCtx)` method
   - Provides `attachRefereeContext(refereeCtx)` method
   - Validates actor context belongs to this MatchContext

2. Construction validation rules
   - Missing options → OperationsError
   - Missing Entry → OperationsError
   - Invalid Entry (not instanceof Entry) → OperationsError
   - Missing draw position → OperationsError
   - Invalid draw position fields → OperationsError

3. Association validation rules
   - attachMasterContext with invalid type → OperationsError
   - attachMasterContext with wrong MatchContext → OperationsError
   - Duplicate attachMasterContext → OperationsError
   - attachRefereeContext with invalid type → OperationsError
   - attachRefereeContext with wrong MatchContext → OperationsError
   - Duplicate attachRefereeContext → OperationsError

**Deliverables**:

- `Modern/engine/operations/domain/match-context.js`

**Acceptance Criteria**:

- Valid MatchContext created with Entry + draw position
- Invalid Entry rejected
- Missing draw position rejected
- Actor context association validated
- No workflow methods implemented


## Phase 3: MasterOperationalContext

**Objective**: Establish Master authority boundary validation.

**Activities**:

1. Create `master-operational-context.js`
   - Constructor validates options object
   - Requires valid MatchContext reference
   - Stores MatchContext reference (`this.matchContext`)
   - Defines Master authority scope (allowed operations list)
   - Provides `validateOperation(operation)` method
   - Returns true for allowed operations
   - Throws OperationsError for disallowed operations

2. Master authority scope
   - Allowed: "calling_control", "result_confirmation", "exception_handling", "operational_override", "match_cancellation"
   - Disallowed: "modify_competition_structure", "modify_scheduling", "modify_scoring_rules", "modify_entry"

**Deliverables**:

- `Modern/engine/operations/domain/master-operational-context.js`

**Acceptance Criteria**:

- Valid MasterOperationalContext created with MatchContext
- Missing MatchContext rejected
- Allowed operations pass validation
- Disallowed operations throw OperationsError
- No workflow methods implemented


## Phase 4: RefereeOperationalContext

**Objective**: Establish Referee execution boundary validation.

**Activities**:

1. Create `referee-operational-context.js`
   - Constructor validates options object
   - Requires valid MatchContext reference
   - Stores MatchContext reference (`this.matchContext`)
   - Defines Referee execution scope (allowed operations list)
   - Provides `validateOperation(operation)` method
   - Returns true for allowed operations
   - Throws OperationsError for disallowed operations

2. Referee execution scope
   - Allowed: "participant_verification", "result_recording", "readiness_confirmation", "match_execution", "issue_reporting"
   - Disallowed: "calling_initiation", "result_confirmation", "operational_override", "modify_competition_structure", "modify_scheduling"

**Deliverables**:

- `Modern/engine/operations/domain/referee-operational-context.js`

**Acceptance Criteria**:

- Valid RefereeOperationalContext created with MatchContext
- Missing MatchContext rejected
- Allowed operations pass validation
- Disallowed operations throw OperationsError
- No workflow methods implemented


## Phase 5: CommonJS Exports

**Objective**: Provide unified module exports.

**Activities**:

1. Create `index.js`
   - Requires all domain modules
   - Exports: MatchContext, OperationsError, MasterOperationalContext, RefereeOperationalContext

2. Update `Modern/engine/operations/index.js`
   - Requires domain module
   - Exports domain objects

**Deliverables**:

- `Modern/engine/operations/domain/index.js`
- Updated `Modern/engine/operations/index.js`

**Acceptance Criteria**:

- All domain objects accessible via require
- No circular dependency issues


## Phase 6: Domain Tests

**Objective**: Comprehensive test coverage for all domain objects.

**Activities**:

1. MatchContext tests
   - Valid construction with Entry + draw position
   - Rejection: missing options
   - Rejection: missing Entry
   - Rejection: invalid Entry type
   - Rejection: missing draw position
   - Rejection: invalid draw position fields
   - Actor context attachment validation
   - Entry reference is read-only (no modification methods)

2. MasterOperationalContext tests
   - Valid construction with MatchContext
   - Rejection: missing MatchContext
   - Rejection: invalid MatchContext type
   - Allowed operations pass
   - Disallowed operations rejected
   - Cross-boundary: Referee-only operations rejected

3. RefereeOperationalContext tests
   - Valid construction with MatchContext
   - Rejection: missing MatchContext
   - Rejection: invalid MatchContext type
   - Allowed operations pass
   - Disallowed operations rejected
   - Cross-boundary: Master-only operations rejected

4. OperationsError tests
   - Construction with code and message
   - instanceof Error
   - name property correct

5. Legacy regression tests
   - Existing test suite passes
   - No regression in Competition Core Domain

**Deliverables**:

- `Modern/test/domains/match-context.test.js`
- `Modern/test/domains/master-operational-context.test.js`
- `Modern/test/domains/referee-operational-context.test.js`
- `Modern/test/domains/operations-error.test.js`
- `Modern/test/domains/operations-legacy-regression.test.js`

**Acceptance Criteria**:

- All domain tests passing
- Legacy regression tests passing
- No regression in existing functionality


# Expected File Changes

## New Files

- `Modern/engine/operations/domain/operations-error.js`
- `Modern/engine/operations/domain/match-context.js`
- `Modern/engine/operations/domain/master-operational-context.js`
- `Modern/engine/operations/domain/referee-operational-context.js`
- `Modern/engine/operations/domain/index.js`
- `Modern/test/domains/match-context.test.js`
- `Modern/test/domains/master-operational-context.test.js`
- `Modern/test/domains/referee-operational-context.test.js`
- `Modern/test/domains/operations-error.test.js`
- `Modern/test/domains/operations-legacy-regression.test.js`

## Modified Files

- `Modern/engine/operations/index.js` (add domain exports)


# Integration Boundary

## No External Layer Modifications

This task does NOT modify:

- `Modern/api/`
- `Modern/services/`
- `Modern/repositories/`
- `Modern/db.sql`
- `Modern/engine/competition/`
- Legacy code

## Competition Core Domain Consumption

MatchContext requires Entry from Competition Core Domain:

```
const { Entry } = require("../competition/domain");
```

This is a read-only dependency. MatchContext validates Entry at construction but does not modify it.


# Testing Strategy

## Test Tools

**Framework**: Node built-in test runner (`node:test`)
**Assertion Library**: `node:assert/strict`

## Test Execution

```bash
# Run all tests
node --test Modern/test/

# Run operations domain tests only
node --test Modern/test/domains/match-context.test.js
node --test Modern/test/domains/master-operational-context.test.js
node --test Modern/test/domains/referee-operational-context.test.js
node --test Modern/test/domains/operations-error.test.js

# Run legacy regression tests
node --test Modern/test/domains/operations-legacy-regression.test.js
```


# Rollback Considerations

## Rollback Steps

**Files to Remove**:

- `Modern/engine/operations/domain/operations-error.js`
- `Modern/engine/operations/domain/match-context.js`
- `Modern/engine/operations/domain/master-operational-context.js`
- `Modern/engine/operations/domain/referee-operational-context.js`
- `Modern/engine/operations/domain/index.js`
- `Modern/test/domains/match-context.test.js`
- `Modern/test/domains/master-operational-context.test.js`
- `Modern/test/domains/referee-operational-context.test.js`
- `Modern/test/domains/operations-error.test.js`
- `Modern/test/domains/operations-legacy-regression.test.js`

**Files to Restore**:

- `Modern/engine/operations/index.js` (restore original empty exports)

## Rollback Safety

- Rollback is safe (no data changes)
- Rollback is reversible (no permanent changes)
- Rollback is fast (isolated domain)
- Legacy workflows unaffected

No production code modified outside operations domain.
Follow TES Handoff Protocol.
