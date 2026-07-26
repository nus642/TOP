Task:
TASK-CORE-001

Title:
Modern Core Domain Foundation


# Implementation Phases

## Phase 1: Domain Model Foundation

**Objective**: Establish core domain models and ownership relationships.

**Activities**:

1. Define Competition domain model
   - Competition entity
   - Competition properties (name, description, status, etc.)
   - Competition construction validation
   - Competition ownership invariants

2. Define Group domain model
   - Group entity
   - Group properties (name, type, rules, etc.)
   - Group construction validation
   - Group ownership invariants

3. Define Event domain model
   - Event entity
   - Event properties (name, format, rules, etc.)
   - Event owns competition format, entry composition rules, and sport-specific constraints
   - Event construction validation
   - Event ownership invariants

4. Define Entry domain model
   - Entry entity
   - Entry owns participation state and participant associations
   - Entry must NOT own scoring rules, scheduling rules, or event format rules
   - Entry properties (composition, rules, status, etc.)
   - Entry construction validation
   - Entry ownership invariants

5. Define Participant domain model
   - Participant entity
   - Participant is an Entry-scoped association to a Player/identity
   - Participant is NOT the owner of long-lived player identity
   - Participant properties (identity, personal info, etc.)
   - Participant construction validation
   - Participant ownership invariants
  +++++++ REPLACE

**Deliverables**:

- Domain model definitions
- Ownership relationship validation logic
- Basic lifecycle validation logic

**Acceptance Criteria**:

- All domain models defined
- Ownership relationships validated
- Basic lifecycle methods implemented
- Domain tests passing


## Phase 2: Domain Validation

**Objective**: Implement comprehensive domain validation rules.

**Activities**:

1. Competition validation
   - Competition name uniqueness
   - Competition status transitions
   - Competition group ownership validation

2. Group validation
   - Group name uniqueness within Competition
   - Group type validation
   - Group rules validation

3. Event validation
   - Event name uniqueness within Group
   - Event format validation
   - Event rules validation
   - Event Entry ownership validation

4. Entry validation
   - Entry composition validation
   - Entry rules validation
   - Entry Participant association validation

5. Participant validation
   - Participant identity validation
   - Participant uniqueness validation

**Deliverables**:

- Comprehensive validation logic
- Validation test suite
- Error handling for invalid operations

**Acceptance Criteria**:

- All validation rules implemented
- Invalid operations rejected
- Validation tests passing
- Clear error messages for invalid operations


## Phase 3: Domain Tests

**Objective**: Create comprehensive test coverage for domain models.

**Activities**:

1. Unit tests for each domain model
   - Model creation
   - Model validation
   - Model construction validation
   - Ownership invariants validation

2. Integration tests for ownership relationships
   - Valid Competition → Group → Event → Entry relationships
   - Invalid cross-competition ownership
   - Entry without valid Event rejection
   - Participant association validation

3. Edge case tests
   - Null/empty values
   - Invalid status transitions
   - Boundary conditions

4. Legacy regression tests
   - Existing tests remain passing
   - Legacy data compatibility verified
  +++++++ REPLACE

**Deliverables**:

- Comprehensive test suite
- Test coverage report
- Legacy regression test suite

**Acceptance Criteria**:

- All domain tests passing
- Test coverage meets requirements
- Legacy regression tests passing
- No regression in existing functionality


# Expected Domain Layer Changes

## Domain Models

**New Files**:

- `Modern/engine/competition/domain/competition.js`
- `Modern/engine/competition/domain/group.js`
- `Modern/engine/competition/domain/event.js`
- `Modern/engine/competition/domain/entry.js`
- `Modern/engine/competition/domain/participant.js`
- `Modern/engine/competition/domain/domain-error.js`
- `Modern/engine/competition/domain/index.js`
  +++++++ REPLACE

**Changes**:

- Add domain model classes
- Implement ownership relationships
- Add validation logic
- Add lifecycle methods

## Domain Validation

**New Files**:

- `Modern/engine/domains/validators/CompetitionValidator.js`
- `Modern/engine/domains/validators/GroupValidator.js`
- `Modern/engine/domains/validators/EventValidator.js`
- `Modern/engine/domains/validators/EntryValidator.js`
- `Modern/engine/domains/validators/ParticipantValidator.js`

**Changes**:

- Add validation rules for each domain
- Implement validation logic
- Add error handling

## Domain Tests

**New Files**:

- `Modern/test/domains/Competition.test.js`
- `Modern/test/domains/Group.test.js`
- `Modern/test/domains/Event.test.js`
- `Modern/test/domains/Entry.test.js`
- `Modern/test/domains/Participant.test.js`
- `Modern/test/domains/ownership.test.js`
- `Modern/test/domains/legacy-regression.test.js`

**Changes**:

- Add comprehensive test coverage
- Add legacy regression tests
- Ensure existing tests remain passing


# Integration Boundary

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

- API boundaries will be defined in TASK-CORE-002
- Service layer will be implemented in TASK-CORE-003
- Repository layer will be implemented in TASK-CORE-003
- Database schema will be designed in TASK-CORE-002
- Legacy code integration will be handled in future tasks


# Lifecycle Constraints

## No New Lifecycle State Machines

**Important**: Do not introduce new lifecycle state machines for Group/Event/Entry/Participant.

**Rationale**:

- This task focuses on domain model foundation
- Lifecycle state machines are out of scope
- Future tasks will define lifecycle management
- Keep changes minimal and focused

**Impact**:

- No state machine implementations
- No state transition logic
- No lifecycle event handlers

**Only Implement**:

- Construction validation
- Ownership invariants

## No New Architecture Decisions

**Important**: Do not add new architecture decisions.

**Rationale**:

- This task establishes the foundation
- Do not introduce new patterns or principles
- Keep changes incremental and focused

**Impact**:

- No new architectural patterns
- No new design principles
- No new abstractions

**Only Update**:

- Existing architecture decisions
- Documentation clarifications
- Implementation details


# API Boundary Considerations
  +++++++ REPLACE

## No API Changes

**Important**: This task does NOT modify API boundaries.

**Rationale**:

- Legacy APIs must remain unchanged
- API changes are out of scope for this task
- Future tasks will define API boundaries for Modern domain

**Impact**:

- No new API endpoints
- No changes to existing API endpoints
- No API documentation updates

**Future Considerations**:

- API boundaries will be defined in TASK-CORE-002
- API endpoints will be created in TASK-CORE-003
- API documentation will be updated in TASK-CORE-004


# Service Layer Considerations

## No Service Layer Changes

**Important**: This task does NOT modify service layer.

**Rationale**:

- Service layer is out of scope for this task
- Service layer will be implemented in future tasks
- Domain layer should remain independent

**Impact**:

- No service layer changes
- No service layer tests
- No service layer documentation

**Future Considerations**:

- Service layer will be implemented in TASK-CORE-003
- Service layer will consume domain models
- Service layer will provide business logic


# Repository/Data Considerations

## No Repository/Data Changes

**Important**: This task does NOT modify repository layer or database schema.

**Rationale**:

- Database schema design is out of scope for this task
- Repository layer will be implemented in future tasks
- Domain models should remain independent of data persistence

**Impact**:

- No database schema changes
- No repository layer changes
- No data migration scripts

**Future Considerations**:

- Database schema will be designed in TASK-CORE-002
- Repository layer will be implemented in TASK-CORE-003
- Data migration will be handled in TASK-CORE-004


# Testing Strategy

## Test Categories

### 1. Domain Model Tests

**Purpose**: Test domain model creation, validation, and lifecycle.

**Coverage**:

- Model instantiation
- Model validation
- Model lifecycle transitions
- Model property access and modification

**Test Cases**:

- Create valid Competition
- Create invalid Competition (missing required fields)
- Create valid Group under Competition
- Create invalid Group (cross-competition ownership)
- Create valid Event under Group
- Create invalid Event (missing required fields)
- Create valid Entry under Event
- Create invalid Entry (invalid composition)
- Create valid Participant
- Create invalid Participant (missing identity)

### 2. Ownership Relationship Tests

**Purpose**: Test ownership relationships and validation.

**Coverage**:

- Valid ownership chains
- Invalid cross-competition ownership
- Entry without valid Event rejection
- Participant association validation

**Test Cases**:

- Create Competition → Group → Event → Entry chain
- Attempt to create Entry under wrong Competition
- Attempt to create Event under wrong Group
- Attempt to create Group under wrong Competition
- Attempt to create Entry without Event
- Attempt to create Participant without Entry

### 3. Edge Case Tests

**Purpose**: Test edge cases and boundary conditions.

**Coverage**:

- Null/empty values
- Invalid status transitions
- Boundary conditions
- Special characters in names

**Test Cases**:

- Create model with null values
- Create model with empty strings
- Invalid status transition (e.g., Completed → Scheduled)
- Maximum length for names
- Special characters in names
- Duplicate names within same parent

### 4. Legacy Regression Tests

**Purpose**: Ensure existing functionality remains unchanged.

**Coverage**:

- Existing tests remain passing
- Legacy data compatibility
- No breaking changes

**Test Cases**:

- Run existing test suite
- Verify all tests pass
- Check legacy data handling
- Verify no regression in existing functionality

## Test Tools

**Framework**: Node built-in test runner (`node:test`)

**Assertion Library**: `node:assert/strict`

**Test Runner**: Node.js built-in test runner

## Test Execution

**Commands**:

```bash
# Run all tests
node --test Modern/test/

# Run domain tests only
node --test Modern/test/domains/

# Run legacy regression tests
node --test Modern/test/domains/legacy-regression.test.js

# Run tests with coverage (if coverage tool available)
node --test --experimental-coverage Modern/test/
```

## Test Coverage Goals

- Domain model tests: 90%+ coverage
- Ownership relationship tests: 95%+ coverage
- Edge case tests: 85%+ coverage
- Legacy regression tests: 100% coverage (all existing tests pass)
  +++++++ REPLACE


# Legacy Regression Strategy

## Strategy Overview

Ensure existing functionality remains unchanged while adding new Modern domain foundation.

## Approach

### 1. Test Isolation

- New tests are isolated from existing tests
- No modifications to existing test files
- New test files are created separately

### 2. Test Execution

- Run existing test suite before changes
- Run existing test suite after changes
- Compare results to ensure no regression

### 3. Test Coverage

- All existing tests must pass
- No new test failures introduced
- No existing tests modified

### 4. Data Compatibility

- Legacy data is preserved
- Legacy data is not modified
- Legacy data is not consumed by Modern domain (yet)

## Execution Steps

1. **Pre-Implementation**:
   - Run existing test suite
   - Record test results
   - Identify baseline

2. **Implementation**:
   - Add new domain models
   - Add new validation logic
   - Add new tests
   - Do NOT modify existing tests

3. **Post-Implementation**:
   - Run existing test suite
   - Compare results to baseline
   - Verify all tests pass
   - Verify no regression

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

- `Modern/engine/competition/domain/competition.js`
- `Modern/engine/competition/domain/group.js`
- `Modern/engine/competition/domain/event.js`
- `Modern/engine/competition/domain/entry.js`
- `Modern/engine/competition/domain/participant.js`
- `Modern/engine/competition/domain/domain-error.js`
- `Modern/engine/competition/domain/index.js`
- `Modern/engine/domains/validators/*.js`
- `Modern/test/domains/*.test.js`
  +++++++ REPLACE

**Files to Restore**:

- Restore original test files (if modified)
- Restore original domain files (if modified)

### 2. Test Rollback

**Actions**:

- Remove new test files
- Restore original test files (if modified)
- Re-run existing test suite
- Verify all tests pass

### 3. Data Rollback

**Actions**:

- No data changes made (no database schema changes)
- No data migration performed
- No data modified

### 4. Verification

**Actions**:

- Re-run existing test suite
- Verify all tests pass
- Verify no regression
- Verify system functionality unchanged

## Rollback Triggers

Rollback should be triggered if:

- Critical test failures occur
- Existing functionality breaks
- Performance degradation
- Security vulnerabilities introduced
- Architecture violations

## Rollback Decision Process

1. **Identify Issue**: Detect critical issue or failure
2. **Assess Impact**: Determine severity and scope
3. **Decision**: Determine if rollback is necessary
4. **Execute Rollback**: Follow rollback steps
5. **Verify Rollback**: Confirm system is restored
6. **Post-Mortem**: Analyze root cause and prevent recurrence

## Rollback Safety

- Rollback is safe (no data changes)
- Rollback is reversible (no permanent changes)
- Rollback is fast (minimal files to remove)
- Rollback is reliable (existing tests verify restoration)

## Rollback Documentation

- Document rollback steps
- Document rollback triggers
- Document rollback decision process
- Document rollback verification steps

No production code modified.
Follow TES Handoff Protocol.