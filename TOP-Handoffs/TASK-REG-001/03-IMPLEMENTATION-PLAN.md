# Implementation Plan

**Task:** TASK-REG-001  
**Status:** Ready for Implementation Planning Review  
**Date:** 2026-07-25  
**Context:** Built upon TASK-TOP-007C-3 (competition context isolation and modern schedule lifecycle)

---

## 1. Implementation Overview

### Objective

Establish the modern competition registration domain foundation with explicit competition ownership, Entry abstraction, and clear boundaries for future schedule generation dependencies.

### Key Goals

1. **Establish Registration Domain Foundation**
   - Define registration as a first-class domain entity
   - Establish competition ownership of registration lifecycle
   - Create explicit competition context for registrations
   - Define minimal, extensible registration lifecycle
   - Implement Entry abstraction (IndividualEntry and TeamEntry)

2. **Connect Competition Ownership with Participant Registration**
   - Define clear ownership model (Competition owns Registration)
   - Establish participant registration relationships
   - Implement context isolation and validation
   - Define authorization and access control
   - Ensure no direct Registration -> Player dependency

3. **Prepare Future Schedule Generation Dependencies**
   - Ensure stable registration ownership for match generation
   - Provide registration data for schedule execution
   - Enable accurate ranking calculations
   - Support pairing algorithms with registration context
   - Ensure future schedule generation consumes confirmed Entries

### Implementation Approach

- **Incremental:** Introduce modern registration capabilities alongside legacy behavior
- **Domain-Driven:** Design from domain concepts before technical implementation
- **Backward Compatible:** Preserve existing registration behavior throughout
- **Test-Driven:** Comprehensive testing for new functionality and regression

---

## 2. Domain Model Impact

### Competition Entity

**Current State:** Competition context is already isolated (TASK-TOP-007C-3)

**Expected Changes:**
- Competition gains ownership of registrations
- Competition defines registration rules and constraints
- Competition manages registration lifecycle transitions
- Competition validates registration context

**Relationships:**
- Competition → owns → Registration (one-to-many)
- Competition → has → Participant (many-to-many via Registration)
- Competition → defines → Registration rules

**Domain Boundaries:**
- Competition domain remains self-contained
- No cross-domain dependencies for core operations
- Clear separation from match generation and ranking domains

### Registration Entity

**Current State:** Implicit or derived registration behavior

**Expected Changes:**
- Registration becomes a first-class domain entity
- Registration has explicit competition context
- Registration has defined lifecycle states
- Registration has clear ownership semantics

**Lifecycle States:**
- **PENDING** - Registration created, awaiting confirmation
- **CONFIRMED** - Registration accepted and active
- **WITHDRAWN** - Registration cancelled

**State Transitions:**
```
PENDING → CONFIRMED (by participant or competition)
PENDING → WITHDRAWN (by participant or competition)
CONFIRMED → WITHDRAWN (by participant or competition)
```

**Ownership Model:**
- Competition owns all registrations within its context
- Registration cannot exist without a valid competition context
- Competition context is immutable for a registration
- Participant can have multiple registrations across different competitions

**Domain Boundaries:**
- Registration domain is self-contained within competition context
- No cross-domain dependencies for core operations
- Clear separation from match generation and ranking domains

### Participant Entity

**Current State:** Participant exists in the system

**Expected Changes:**
- Participant participates in competitions via Registration
- Participant can have multiple registrations
- Participant registration status is tracked via Registration
- Participant can be individual or team

**Relationships:**
- Participant → has → Registration (one-to-many)
- Participant → participates in → Competition (many-to-many via Registration)
- Registration → represents → Participant-Competition relationship

**Domain Boundaries:**
- Participant domain remains unchanged
- No changes to participant core functionality
- Participant relationships are managed through Registration

### Expected Relationships Summary

```
Competition (1) ──< (N) Registration
Registration (1) ──< (1) Competition
Registration (1) ──< (N) Participant
Participant (1) ──< (N) Registration
```

**Ownership Hierarchy:**
- Competition owns Registration
- Registration represents Participant-Competition relationship
- Participant participates in Competition via Registration

**Note:** Domain foundation before API. No premature database schema design. No direct Registration -> Player dependency. Future schedule generation consumes confirmed Entries.

---

## 3. API Planning

### Design Principles

1. **Follow Domain Ownership**
   - API operations reflect competition ownership of registrations
   - Operations are grouped by domain entity
   - Validation is enforced at domain level

2. **Wait for Domain Confirmation**
   - Endpoint paths and HTTP methods are not defined yet
   - Focus on API capabilities and contracts
   - Design based on domain operations, not technical implementation

3. **Legacy Compatibility**
   - Existing API endpoints continue to work
   - New capabilities are introduced alongside legacy
   - Feature flags control new functionality

### API Capabilities (Not Finalized)

**Registration Operations:**
- Create registration (with explicit competition context)
- Update registration status
- Query registrations by competition
- Query registrations by participant
- Validate registration context

**Ownership Operations:**
- Verify competition ownership
- Check registration authorization
- Validate registration rules

**Lifecycle Operations:**
- Transition registration to PENDING
- Transition registration to CONFIRMED
- Transition registration to WITHDRAWN

### Request/Response Structure (Not Finalized)

**Registration Creation:**
```
Request:
{
  "competitionId": "uuid",
  "participantId": "uuid",
  "participantType": "individual|team",
  "metadata": {}
}

Response:
{
  "registrationId": "uuid",
  "status": "PENDING",
  "competitionId": "uuid",
  "participantId": "uuid",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**Registration Status Update:**
```
Request:
{
  "status": "CONFIRMED|WITHDRAWN",
  "reason": "string"
}

Response:
{
  "registrationId": "uuid",
  "status": "CONFIRMED|WITHDRAWN",
  "updatedAt": "timestamp"
}
```

### API Versioning Strategy (Not Finalized)

- **v1:** Legacy API (existing endpoints)
- **v2:** Modern API (new registration capabilities)
- **Feature Flags:** Enable/disable v2 features
- **Gradual Migration:** Migrate from v1 to v2 incrementally

### Next Steps for API Design

1. Finalize domain model and ownership model
2. Define API capabilities based on domain operations
3. Design request/response structures
4. Define endpoint paths and HTTP methods
5. Document API contracts
6. Implement API with feature flags

---

## 4. Service Layer Planning

### Registration Service

**Responsibilities:**
- Registration lifecycle management
- Registration state transitions
- Registration validation
- Competition ownership verification

**Key Methods:**
```typescript
class RegistrationService {
  // Create registration
  createRegistration(data: CreateRegistrationDTO): Promise<Registration>
  
  // Update registration status
  updateStatus(registrationId: string, status: RegistrationStatus): Promise<Registration>
  
  // Validate registration context
  validateContext(registrationId: string): Promise<boolean>
  
  // Check competition ownership
  checkOwnership(registrationId: string, competitionId: string): Promise<boolean>
  
  // Get registrations by competition
  getRegistrationsByCompetition(competitionId: string): Promise<Registration[]>
  
  // Get registrations by participant
  getRegistrationsByParticipant(participantId: string): Promise<Registration[]>
}
```

**Validation Rules:**
- Registration must have valid competition context
- Registration must have valid participant
- Registration status transitions must be valid
- Competition must own the registration
- Participant must be allowed to register for competition

### Competition Service

**Responsibilities:**
- Competition context management (already implemented in TASK-TOP-007C-3)
- Competition registration rules definition
- Competition ownership verification
- Competition-specific validation

**Key Methods:**
```typescript
class CompetitionService {
  // Get competition context
  getContext(competitionId: string): Promise<CompetitionContext>
  
  // Define registration rules
  defineRegistrationRules(competitionId: string, rules: RegistrationRules): Promise<void>
  
  // Validate registration against competition rules
  validateRegistration(competitionId: string, registration: Registration): Promise<boolean>
  
  // Check competition ownership
  checkOwnership(competitionId: string, userId: string): Promise<boolean>
}
```

**Registration Rules:**
- Maximum number of registrations per competition
- Registration deadlines
- Participant types allowed
- Additional validation constraints

### Participant Service

**Responsibilities:**
- Participant management (existing functionality)
- Participant validation
- Participant registration verification

**Key Methods:**
```typescript
class ParticipantService {
  // Get participant by ID
  getParticipant(participantId: string): Promise<Participant>
  
  // Validate participant
  validateParticipant(participantId: string): Promise<boolean>
  
  // Check participant eligibility
  checkEligibility(participantId: string, competitionId: string): Promise<boolean>
}
```

**Note:** Participant service responsibilities remain largely unchanged. Focus is on registration relationships, not participant core functionality.

### Service Layer Boundaries

**Do Not Redesign:**
- Match generation service
- Ranking service
- Pairing service
- Frontend services
- Payment services

**Preserve Existing:**
- Existing competition service methods
- Existing participant service methods
- Existing validation logic (where applicable)
- Existing API endpoints

**New Responsibilities:**
- Registration lifecycle management
- Registration validation
- Competition ownership verification
- Registration context validation

---

## 5. Migration Strategy

### Overall Approach

**Incremental Migration with Legacy Preservation**

- **Phase 1:** Introduce modern registration domain alongside legacy
- **Phase 2:** Validate modern approach with limited scope
- **Phase 3:** Gradually migrate to modern registration
- **Phase 4:** Deprecate legacy registration (if needed)

### Phase 1: Introduce Modern Registration Domain

**Goal:** Create modern registration domain without breaking existing functionality

**Actions:**
1. Define registration domain entity and ownership model
2. Implement registration lifecycle and state machine
3. Add registration validation rules
4. Create registration service layer
5. Add comprehensive tests for new functionality
6. Validate legacy behavior preservation

**Success Criteria:**
- Modern registration domain exists
- Legacy registration continues to work
- Tests pass for both modern and legacy
- No breaking changes to existing functionality

### Phase 2: Validate Modern Approach

**Goal:** Validate modern registration approach with limited scope

**Actions:**
1. Test registration creation with explicit competition context
2. Test registration lifecycle transitions
3. Test competition ownership validation
4. Test invalid context rejection
5. Test registration queries
6. Validate error handling

**Success Criteria:**
- Modern registration works correctly
- Invalid contexts are properly rejected
- Ownership validation is accurate
- Error messages are clear and helpful
- Tests cover critical registration flows

### Phase 3: Gradual Migration

**Goal:** Migrate to modern registration incrementally

**Actions:**
1. Enable modern registration for specific competitions
2. Migrate existing registrations to modern domain
3. Update API endpoints to support both modes
4. Monitor and validate migration
5. Address issues as they arise

**Success Criteria:**
- Modern registration is functional for migrated competitions
- Legacy registration still works for unmigrated competitions
- Migration is reversible if issues arise
- User feedback is positive

### Phase 4: Deprecate Legacy (If Needed)

**Goal:** Remove legacy registration if modern approach is validated

**Actions:**
1. Complete migration for all competitions
2. Remove legacy registration code
3. Update documentation
4. Remove legacy API endpoints
5. Finalize database schema

**Success Criteria:**
- Legacy registration is completely removed
- All functionality works through modern registration
- Documentation is up to date
- No breaking changes for users

### Legacy Behavior Preservation

**Preserved Behavior:**
- Existing registration creation and modification flows
- Current validation rules and constraints
- Legacy data structures and formats
- Existing API endpoints and interfaces
- Current user workflows and expectations

**New Capabilities:**
- Explicit competition context for registrations
- Defined registration lifecycle with states
- Clear ownership model (competition owns registrations)
- Modern validation and error handling
- Enhanced audit trails and notifications

### Rollback Strategy

**Quick Rollback:**
- Feature flags enable quick rollback if issues arise
- Legacy behavior remains functional throughout migration
- Data migration is reversible if needed
- Comprehensive testing ensures safe migration

**Rollback Triggers:**
- Critical bugs in modern registration
- Performance degradation
- User feedback indicates issues
- Security concerns

**Rollback Process:**
1. Disable feature flags for modern registration
2. Legacy registration automatically becomes active
3. Monitor system stability
4. Address issues in modern registration
5. Gradually re-enable modern registration

### No Breaking Changes

**Guarantees:**
- Existing API endpoints continue to work
- Existing data structures remain valid
- Existing user workflows are not disrupted
- Existing validation rules are preserved
- Existing behavior is maintained

**Exceptions:**
- Invalid competition context is now explicitly validated (not implicit)
- Registration lifecycle is now defined (not implicit)
- Ownership model is now explicit (not implicit)

---

## 6. Testing Plan

### Test Strategy

**Comprehensive Testing Approach:**
- Unit tests for registration domain logic
- Integration tests for registration API
- Regression tests for existing functionality
- Migration tests for new capabilities
- End-to-end tests for critical registration flows

### Test Categories

#### 1. Registration Lifecycle Tests

**Purpose:** Verify registration state transitions work correctly

**Test Cases:**
- [ ] Create registration in PENDING state
- [ ] Transition PENDING → CONFIRMED
- [ ] Transition PENDING → WITHDRAWN
- [ ] Transition CONFIRMED → WITHDRAWN
- [ ] Invalid state transitions are rejected
- [ ] Terminal state (WITHDRAWN) cannot be transitioned again
- [ ] State transitions are idempotent
- [ ] State transitions update timestamps correctly

**Expected Results:**
- All valid transitions succeed
- Invalid transitions are rejected with appropriate error messages
- Timestamps are updated correctly
- State machine enforces valid transitions

#### 2. Competition Ownership Tests

**Purpose:** Verify competition ownership model is correctly implemented

**Test Cases:**
- [ ] Registration cannot exist without competition context
- [ ] Competition owns all registrations within its context
- [ ] Competition context is immutable for a registration
- [ ] Participant can have multiple registrations across different competitions
- [ ] Ownership validation succeeds for valid combinations
- [ ] Ownership validation fails for invalid combinations
- [ ] Competition-specific validation rules are enforced

**Expected Results:**
- Invalid competition context is rejected
- Ownership model is correctly enforced
- Participant can register for multiple competitions
- Competition-specific rules are validated

#### 3. Invalid Context Tests

**Purpose:** Verify invalid competition context is properly rejected

**Test Cases:**
- [ ] Attempt to create registration with non-existent competition
- [ ] Attempt to create registration with invalid participant
- [ ] Attempt to create registration with null competition context
- [ ] Attempt to create registration with null participant
- [ ] Attempt to create registration with expired competition
- [ ] Attempt to create registration with closed registration period
- [ ] Attempt to create registration with invalid participant type

**Expected Results:**
- All invalid contexts are rejected
- Error messages are clear and helpful
- Validation errors are specific to the issue
- No partial registrations are created

#### 4. Regression Tests

**Purpose:** Ensure existing registration behavior remains functional

**Test Cases:**
- [ ] Existing registration creation flow works
- [ ] Existing registration modification flow works
- [ ] Existing validation rules are preserved
- [ ] Existing API endpoints continue to work
- [ ] Existing user workflows are not disrupted
- [ ] Existing data structures remain valid
- [ ] Existing error handling works correctly

**Expected Results:**
- All existing functionality works as before
- No breaking changes to existing behavior
- Existing tests pass
- Legacy registration continues to work

#### 5. Integration Tests

**Purpose:** Verify integration between registration and other domains

**Test Cases:**
- [ ] Registration creation integrates with competition context
- [ ] Registration lifecycle integrates with competition rules
- [ ] Registration queries integrate with competition isolation
- [ ] Registration validation integrates with participant validation
- [ ] Registration ownership integrates with authorization
- [ ] Registration updates integrate with audit trails

**Expected Results:**
- Integration points work correctly
- Data flows between domains correctly
- Validation is consistent across domains
- Authorization is properly enforced

#### 6. End-to-End Tests

**Purpose:** Verify critical registration flows end-to-end

**Test Cases:**
- [ ] Complete registration flow: create → confirm → withdraw
- [ ] Multiple registrations for same participant across competitions
- [ ] Competition-specific registration rules enforcement
- [ ] Invalid context rejection flow
- [ ] Ownership validation flow
- [ ] Registration query flow

**Expected Results:**
- Critical flows work correctly end-to-end
- User experience is smooth
- Error handling is appropriate
- Data is consistent across flows

### Test Coverage Goals

**Unit Tests:**
- Registration domain logic: 100% coverage
- Registration validation: 100% coverage
- Registration state machine: 100% coverage
- Competition ownership validation: 100% coverage

**Integration Tests:**
- Registration API: 90% coverage
- Registration service layer: 90% coverage
- Domain integration points: 90% coverage

**Regression Tests:**
- Existing functionality: 100% coverage
- Critical user flows: 100% coverage

### Test Environment

**Test Setup:**
- Separate test database
- Mock external dependencies
- Test data fixtures
- Test utilities and helpers

**Test Data:**
- Valid competition contexts
- Valid participants
- Valid registration scenarios
- Invalid scenarios for validation testing

### Test Execution

**Execution Strategy:**
- Run unit tests in CI/CD pipeline
- Run integration tests before each deployment
- Run regression tests before each migration phase
- Run end-to-end tests before final release

**Test Reporting:**
- Test coverage reports
- Test execution logs
- Failure analysis and reporting
- Performance metrics

---

## 7. Scope Boundary

### Included Scope

**Domain Foundation:**
- Registration domain entity definition
- Competition ownership model
- Participant registration relationships
- Domain boundaries and isolation

**Lifecycle:**
- Registration state definitions
- State transition rules
- Lifecycle management
- Extensibility mechanisms

**Ownership:**
- Competition ownership of registrations
- Context isolation and validation
- Authorization and access control
- Ownership verification

**Planning:**
- Domain model impact analysis
- API planning (capabilities and contracts)
- Service layer planning
- Migration strategy

**Testing:**
- Registration lifecycle tests
- Competition ownership tests
- Invalid context tests
- Regression tests
- Integration tests
- End-to-end tests

### Excluded Scope

**Match Generation:**
- Match generation algorithms
- Schedule generation logic
- Match scheduling rules
- Match execution workflows
- Match data structures

**Ranking:**
- Ranking calculation algorithms
- Ranking tables and leaderboards
- Ranking updates and refresh
- Ranking display and presentation
- Ranking data structures

**Pairing Algorithm:**
- Pairing algorithms for matches
- Random pairing logic
- Skill-based pairing
- Pairing optimization
- Pairing data structures

**Frontend Redesign:**
- UI/UX improvements
- Frontend component redesign
- User interface changes
- Frontend framework updates
- Frontend routing changes

**Payment:**
- Payment processing
- Payment integration
- Payment validation
- Refund handling
- Payment data structures

**Database Redesign:**
- Schema changes (unless required by domain model)
- Database migrations
- Data migration scripts
- Database optimization
- Index design

**API Endpoint Design:**
- Final endpoint paths and HTTP methods
- Detailed API documentation
- API versioning strategy
- API rate limiting
- API authentication

**Service Layer Redesign:**
- Match generation service
- Ranking service
- Pairing service
- Frontend services
- Payment services

---

## 8. Codex Guidance

### Before Implementation

**Read All Handoff Documents:**
- [x] 01-TASK.md - Understand task objectives and scope
- [x] 02-EXECUTIVE-SUMMARY.md - Understand architecture decisions
- [x] 03-IMPLEMENTATION-PLAN.md - Understand implementation approach

**Understand Context:**
- TASK-TOP-007C-3 completed competition context isolation
- Modern schedule lifecycle is already implemented
- Registration foundation is needed before match generation

### During Implementation

**Do Not Invent Unsupported Requirements:**
- Do not assume final database schema
- Do not assume final API endpoints
- Do not assume final service layer structure
- Do not assume final data structures
- Follow the domain model defined in the plan

**Preserve Architecture Boundaries:**
- Do not redesign unrelated competition modules
- Do not touch match generation, ranking, or pairing modules
- Do not touch frontend unless registration-specific changes are needed
- Do not alter database schema unless required by registration domain
- Do not modify existing behavior unless necessary

**Implement Incrementally:**
- Introduce modern registration capabilities alongside legacy
- Use feature flags to control new functionality
- Validate each increment before proceeding
- Test thoroughly at each step
- Do not implement everything at once

**Wait for Domain Decisions:**
- Do not implement API endpoints until domain model is finalized
- Do not design database schema until ownership model is confirmed
- Do not create frontend components until API contracts are defined
- Do not implement service layer until domain model is confirmed
- Wait for architecture approval before coding

### Implementation Order

1. **Define Registration Domain Entity**
   - Define registration entity structure
   - Define ownership model
   - Define lifecycle states
   - Define domain boundaries

2. **Implement Registration Lifecycle**
   - Implement state machine
   - Implement state transitions
   - Implement lifecycle hooks
   - Implement extensibility

3. **Add Registration Validation**
   - Add competition context validation
   - Add participant validation
   - Add ownership validation
   - Add competition-specific validation

4. **Create Registration Service Layer**
   - Implement registration service
   - Implement competition service (existing)
   - Implement participant service (existing)
   - Add service integration

5. **Add Modern Registration API**
   - Create registration API endpoints
   - Add feature flags
   - Add legacy compatibility
   - Add API documentation

6. **Add Comprehensive Tests**
   - Add unit tests
   - Add integration tests
   - Add regression tests
   - Add end-to-end tests

7. **Validate Legacy Behavior**
   - Test existing functionality
   - Verify no breaking changes
   - Validate migration strategy
   - Document results

### Testing Requirements

**Unit Tests:**
- Registration domain logic
- Registration validation
- Registration state machine
- Competition ownership validation

**Integration Tests:**
- Registration API
- Registration service layer
- Domain integration points

**Regression Tests:**
- Existing functionality
- Critical user flows
- Legacy behavior

**Migration Tests:**
- Modern registration
- Legacy registration
- Migration process

### Documentation Requirements

**Domain Model Documentation:**
- Registration entity definition
- Ownership model
- Lifecycle states
- Domain boundaries

**API Documentation:**
- API capabilities
- Request/response structures
- Error handling
- API contracts

**Migration Documentation:**
- Migration strategy
- Rollback procedures
- Testing strategy
- Validation procedures

### Common Pitfalls to Avoid

**Do Not:**
- Redesign unrelated competition modules
- Invent unsupported requirements
- Assume final database schema
- Assume final API endpoints
- Break existing behavior
- Implement everything at once
- Skip testing
- Skip documentation

**Do:**
- Read all handoff documents
- Follow domain model
- Preserve architecture boundaries
- Implement incrementally
- Test thoroughly
- Document clearly
- Validate before proceeding

### Success Criteria

**Implementation Success:**
- Modern registration domain exists
- Legacy registration continues to work
- All tests pass
- No breaking changes
- Documentation is complete

**Quality Success:**
- Code is clean and maintainable
- Tests are comprehensive
- Documentation is clear
- Migration is safe

**Domain Success:**
- Ownership model is correct
- Lifecycle is well-defined
- Domain boundaries are clear
- Future dependencies are supported

---

## Status

**Ready for Implementation Planning Review**

This implementation plan provides a comprehensive roadmap for TASK-REG-001. The plan establishes clear objectives, defines domain model impact, outlines API planning, describes service layer responsibilities, defines migration strategy, and provides comprehensive testing guidance.

**Next Steps:**
1. Review and approve this implementation plan
2. Create detailed task breakdown
3. Assign implementation tasks
4. Begin incremental implementation following the guidance provided
5. Validate each increment before proceeding
6. Complete comprehensive testing
7. Validate legacy behavior preservation
8. Document results and prepare for next phase

**Important Reminders:**
- This is a domain foundation task
- Do not assume final database schema or API endpoints
- Do not invent unsupported requirements
- Preserve architecture boundaries
- Implement incrementally
- Test thoroughly at each step