Task:
TASK-OPS-001-A

Title:
Tournament Operation Core Loop Foundation


# P0 Core Loop

```
External draw input
→ Match context creation
→ Master operational control
→ Referee execution
→ Result submission
→ Competition update
```


# Priority Deferral

P1 (Deferred):
- Team lineup management / captain lineup

P2 (Deferred):
- Single tournament management authorization
- User permission model
- Access control system


# Implementation Phases

## Phase 1: Operations Domain Model Foundation

**Objective**: Establish Match Operations domain models, external draw input boundary, and match context creation from Entry.

**Activities**:

1. Define Operations domain boundary
   - Match Operations receives external draw input
   - Match Operations creates match context from confirmed Entries
   - Match Operations owns operational authority boundaries
   - Match Operations does not own competition structure or scheduling

2. Define external draw input boundary
   - External draw/schedule data as operational input
   - Draw input validation
   - Draw input does NOT implement scheduling algorithm

3. Define match context creation
   - Match context created from Entry (Competition Core Domain)
   - Entry reference validation (must be valid Entry from Competition Core)
   - Entry as participation boundary for operations

4. Define operational ownership concepts
   - Match Operations owns operational state concepts
   - Match Operations owns actor authority boundaries
   - Match Operations does not own Competition, Group, Event, Entry, Participant

**Deliverables**:

- Operations domain boundary definition
- External draw input boundary
- Match context creation from Entry
- Operational ownership model

**Acceptance Criteria**:

- Entry input boundary validated against Competition Core Domain
- External draw input boundary defined
- Match context creation validated
- Operational ownership clearly separated from Competition ownership
- No recreation of Competition Core entities
- Domain tests passing


## Phase 2: Actor Authority Boundaries

**Objective**: Define and validate Master operational control and Referee execution context boundaries.

**Activities**:

1. Define Master operational authority boundary
   - Master holds operational authority over tournament execution
   - Master controls calling process
   - Master confirms results
   - Master handles exceptions
   - Master does NOT own competition structure
   - Master does NOT define scheduling or scoring

2. Define Referee operational context boundary
   - Referee holds match execution authority
   - Referee operates within Master's operational context
   - Referee verifies participants
   - Referee records results
   - Referee does NOT modify competition structure
   - Referee does NOT calculate rankings

3. Define actor boundary validation
   - Operations outside actor authority are rejected
   - Cross-boundary operations produce clear errors
   - Actor context is validated before operations

**Deliverables**:

- Master authority boundary definition
- Referee context boundary definition
- Actor boundary validation logic

**Acceptance Criteria**:

- Master authority boundary enforced
- Referee context boundary enforced
- Invalid cross-boundary operations rejected
- Clear error messages for boundary violations


## Phase 3: Operational Validation

**Objective**: Implement basic operational validation rules.

**Activities**:

1. Entry input validation
   - Entry must exist in Competition Core Domain
   - Entry must be associated with valid Event
   - Entry must have valid Participant associations

2. External draw input validation
   - Draw input must reference valid Entries
   - Draw input must not modify Competition Core Domain

3. Actor authority validation
   - Master authority scope validation
   - Referee context scope validation
   - Operation authorization validation

4. Domain construction validation
   - Required fields validation
   - Invalid state rejection
   - Boundary condition handling

**Deliverables**:

- Entry input validation logic
- External draw input validation logic
- Actor authority validation logic
- Construction validation logic

**Acceptance Criteria**:

- Invalid Entry references rejected
- Invalid draw input rejected
- Unauthorized operations rejected
- Construction validation enforced
- Clear error messages for all validation failures


## Phase 4: Domain Tests

**Objective**: Create comprehensive test coverage for operations domain.

**Activities**:

1. Unit tests for domain models
   - Operations domain construction
   - Entry input boundary validation
   - Actor boundary validation

2. Integration tests for domain relationships
   - Valid Entry consumption from Competition Core
   - Invalid Entry rejection
   - Master authority boundary enforcement
   - Referee context boundary enforcement

3. Edge case tests
   - Null/empty values
   - Invalid actor operations
   - Boundary conditions

4. Legacy regression tests
   - Existing tests remain passing
   - Legacy workflow compatibility verified

**Deliverables**:

- Comprehensive test suite
- Legacy regression test suite

**Acceptance Criteria**:

- All domain tests passing
- Legacy regression tests passing
- No regression in existing functionality


# Expected Domain Layer Changes

## Domain Models

**New Files**:

- `Modern/engine/operations/domain/operations-context.js`
- `Modern/engine/operations/domain/master-authority.js`
- `Modern/engine/operations/domain/referee-context.js`
- `Modern/engine/operations/domain/operations-error.js`
- `Modern/engine/operations/domain/index.js`

**Changes**:

- Add operations domain model classes
- Implement Entry input boundary
- Implement actor authority boundaries
- Add operational validation logic

## Domain Tests

**New Files**:

- `Modern/test/domains/operations-context.test.js`
- `Modern/test/domains/master-authority.test.js`
- `Modern/test/domains/referee-context.test.js`
- `Modern/test/domains/operations-boundary.test.js`
- `Modern/test/domains/operations-legacy-regression.test.js`

**Changes**:

- Add comprehensive operations domain test coverage
- Add legacy regression tests
- Ensure existing tests remain passing


# Integration Boundary

## Input: Competition Core Domain

Match Operations receives data from Competition Core Domain:

- Confirmed Entries with validated Participants
- Entry reference for participation boundary

Match Operations does NOT modify Competition Core Domain.

## No External Layer Modifications

**Important**: This task does NOT modify external layers.

**Rationale**:

- API layer must remain unchanged
- Service layer is out of scope
- Repository layer is out of scope
- Database schema is out of scope
- Legacy code must remain unchanged

**Impact**:

- No changes to `Modern/api/`
- No changes to `Modern/services/`
- No changes to `Modern/repositories/`
- No changes to `Modern/db.sql`
- No changes to Legacy code

**Future Considerations**:

- API boundaries will be defined in future tasks
- Service layer will be implemented in future tasks
- Repository layer will be implemented in future tasks
- Database schema will be designed in future tasks


# Lifecycle Constraints

## No Full State Machines

**Important**: Do not implement full operational state machines.

**Rationale**:

- This task focuses on domain foundation
- Full state machines are out of scope
- Future tasks will define workflow state management
- Keep changes minimal and focused

**Impact**:

- No full workflow state machines
- No state transition orchestration
- No workflow event handlers

**Only Implement**:

- Construction validation
- Actor boundary invariants
- Entry input boundary validation

## No New Architecture Decisions

**Important**: Do not add new architecture decisions.

**Rationale**:

- This task implements approved architecture from TASK-OPS-001
- Do not introduce new patterns or principles
- Keep changes incremental and focused

**Impact**:

- No new architectural patterns
- No new design principles
- No new abstractions beyond approved design


# Testing Strategy

## Test Categories

### 1. Domain Model Tests

**Purpose**: Test operations domain model creation and validation.

**Coverage**:

- Model instantiation
- Entry input boundary validation
- Construction validation

**Test Cases**:

- Create valid OperationsContext with Entry reference
- Create invalid OperationsContext (missing Entry)
- Create invalid OperationsContext (invalid Entry reference)
- Validate Entry belongs to Competition Core Domain

### 2. Actor Boundary Tests

**Purpose**: Test actor authority boundaries.

**Coverage**:

- Master authority boundary
- Referee context boundary
- Cross-boundary rejection

**Test Cases**:

- Master authority boundary accepts valid operations
- Master authority rejects competition structure modifications
- Referee context accepts valid execution operations
- Referee context rejects scheduling operations
- Invalid actor operation rejected with clear error

### 3. Edge Case Tests

**Purpose**: Test edge cases and boundary conditions.

**Coverage**:

- Null/empty values
- Invalid references
- Boundary conditions

**Test Cases**:

- Create model with null values
- Create model with empty strings
- Invalid Entry reference
- Missing required fields

### 4. Legacy Regression Tests

**Purpose**: Ensure existing functionality remains unchanged.

**Coverage**:

- Existing tests remain passing
- No breaking changes

**Test Cases**:

- Run existing test suite
- Verify all tests pass
- Verify no regression in existing functionality

## Test Tools

**Framework**: Node built-in test runner (`node:test`)

**Assertion Library**: `node:assert/strict`

## Test Execution

**Commands**:

```bash
# Run all tests
node --test Modern/test/

# Run operations domain tests only
node --test Modern/test/domains/operations-context.test.js
node --test Modern/test/domains/master-authority.test.js
node --test Modern/test/domains/referee-context.test.js

# Run legacy regression tests
node --test Modern/test/domains/operations-legacy-regression.test.js
```


# Legacy Regression Strategy

## Strategy Overview

Ensure existing functionality remains unchanged while adding new Match Operations domain foundation.

## Approach

### 1. Test Isolation

- New tests are isolated from existing tests
- No modifications to existing test files
- New test files are created separately

### 2. Test Execution

- Run existing test suite before changes
- Run existing test suite after changes
- Compare results to ensure no regression

### 3. Data Compatibility

- Legacy data is preserved
- Legacy data is not modified
- Legacy workflows remain functional

## Success Criteria

- All existing tests pass
- No new test failures
- No existing tests modified
- No breaking changes to existing functionality


# Rollback Considerations

## Rollback Strategy

If implementation fails or introduces critical issues, rollback to previous state.

## Rollback Steps

### 1. Code Rollback

**Files to Remove**:

- `Modern/engine/operations/domain/operations-context.js`
- `Modern/engine/operations/domain/master-authority.js`
- `Modern/engine/operations/domain/referee-context.js`
- `Modern/engine/operations/domain/operations-error.js`
- `Modern/engine/operations/domain/index.js`
- `Modern/test/domains/operations-*.test.js`
- `Modern/test/domains/master-authority.test.js`
- `Modern/test/domains/referee-context.test.js`

### 2. Verification

**Actions**:

- Re-run existing test suite
- Verify all tests pass
- Verify no regression
- Verify system functionality unchanged

## Rollback Safety

- Rollback is safe (no data changes)
- Rollback is reversible (no permanent changes)
- Rollback is fast (minimal files to remove)
- Rollback is reliable (existing tests verify restoration)

No production code modified.
Follow TES Handoff Protocol.

Result submission and competition update are part of the operational flow handled by the operations context.
They do not introduce separate ownership domains in this task.