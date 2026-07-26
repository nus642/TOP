Task:
TASK-OPS-001

Title:
Match Operations Implementation Handoff


# Implementation Phases

## Phase 1: Match Operations Domain Foundation

**Objective**: Establish Match Operations domain models and actor boundaries.

**Activities**:

1. Define Match Operations domain boundary
   - Match Operations receives confirmed Entries from Competition structure
   - Match Operations owns operational state management
   - Match Operations does not own competition structure or scheduling

2. Define Actor models
   - Master: operational authority, exception handling, result confirmation
   - Referee: execution authority, participant verification, result recording
   - Player: participation authority, check-in, readiness confirmation
   - TOP System: coordination, state persistence, workflow support

3. Define authority boundaries
   - Master controls calling and confirms results
   - Referee executes matches and records results
   - Player participates and confirms readiness
   - TOP System coordinates and persists state

**Deliverables**:

- Actor boundary definitions
- Authority boundary validation
- Domain separation from Competition structure

**Acceptance Criteria**:

- All actor boundaries clearly defined
- Authority separation validated
- No overlap with Competition structure domain
- No overlap with Schedule generation domain


## Phase 2: Operational State Model

**Objective**: Define operational state models and state ownership.

**Activities**:

1. Define Match state model
   - Scheduled → Match Calling → In Progress → Completed
   - Scheduled → Cancelled
   - State ownership: TOP System maintains match state

2. Define Player readiness state model
   - Notified → Acknowledged → Arrived → Ready
   - State ownership: TOP System records player readiness

3. Define Referee readiness state model
   - Notified → Acknowledged → Present → Ready
   - State ownership: TOP System records referee readiness

4. Define Court readiness state model
   - Available → Occupied → Ready
   - State ownership: TOP System records court readiness

**Deliverables**:

- Operational state definitions
- State ownership description

**Acceptance Criteria**:

- All operational states defined
- State ownership clearly assigned
- States consistent with approved architecture


## Phase 3: Match Calling Workflow

**Objective**: Implement the match calling workflow.

**Activities**:

1. Master initiates calling
   - Master reviews match readiness
   - Master confirms match can start
   - Master triggers match calling
   - Match status transitions to "Match Calling"

2. Referee receives calling
   - Referee confirms match calling request
   - Referee verifies match is ready
   - Referee confirms match start

3. System updates status
   - Match status changes to "In Progress"
   - Match start time recorded
   - Match participants confirmed

4. Exception handling
   - Master handles calling exceptions
   - Master can override operational status
   - Master can delay or cancel calling

**Deliverables**:

- Match calling workflow implementation
- Calling exception handling
- Master override capability

**Acceptance Criteria**:

- Match calling initiated by Master only
- Referee confirmation required
- Status transitions validated
- Exceptions handled by Master


## Phase 4: Check-in Workflow

**Objective**: Implement the player check-in workflow.

**Activities**:

1. Player check-in
   - Player arrives at venue
   - Player presents identification
   - Player confirms participation

2. Referee verification
   - Referee verifies player identity
   - Referee confirms player eligibility
   - Referee records check-in

3. System recording
   - Player status updated to "Checked In"
   - Check-in time recorded
   - Match participants confirmed

4. Readiness gate
   - Both players must check-in
   - Check-in completion enables match calling
   - Missing check-in blocks match start

**Deliverables**:

- Check-in workflow implementation
- Check-in verification logic
- Readiness gate enforcement

**Acceptance Criteria**:

- Check-in is player-initiated
- Referee verification required
- Check-in time recorded
- Both players required for match start


## Phase 5: Result Submission Workflow

**Objective**: Implement the result submission and confirmation workflow.

**Activities**:

1. Referee records results
   - Referee records match outcome
   - Referee records match statistics
   - Referee validates result format

2. Referee submits results
   - Referee submits results to TOP system
   - Referee confirms submission
   - Results validated by system

3. System processes results
   - Results stored
   - Match status updated to "Completed"
   - Tournament status updated

4. Master confirmation
   - Master reviews results
   - Master verifies results
   - Master confirms results
   - Match lifecycle completed

**Deliverables**:

- Result submission workflow implementation
- Result validation logic
- Master confirmation workflow

**Acceptance Criteria**:

- Referee has recording authority
- Results validated before storage
- Master confirmation required
- Match lifecycle completed on confirmation


## Phase 6: Legacy Integration

**Objective**: Support incremental migration from Legacy operational workflow.

**Activities**:

1. Preserve Legacy behavior
   - Existing Master workflow patterns remain functional
   - Existing Referee data retrieval remains functional
   - Existing operational endpoints continue to work

2. Introduce Modern capabilities alongside Legacy
   - Modern workflows added without breaking Legacy
   - Dual operation supported during transition
   - No unnecessary rewrites

3. Convert implicit workflows to explicit domains
   - Legacy implicit Master/Referee responsibilities become explicit
   - Legacy implicit state management becomes explicit state models
   - Legacy implicit workflows become documented domain operations

**Deliverables**:

- Legacy compatibility verification
- Migration path documentation
- Dual operation support

**Acceptance Criteria**:

- All Legacy operational workflows remain functional
- No breaking changes to existing endpoints
- Modern workflows operate alongside Legacy
- Incremental migration path clear


# Integration Boundary

## Input: Competition Structure

Match Operations receives data from Competition structure:

- Confirmed Entries with validated Participants
- Event context (format, rules)
- Group context (classification)
- Competition context (tournament lifecycle)

Match Operations does NOT modify Competition structure.

## Output: Match Operations

Match Operations produces:

- Operational state management
- Match execution coordination
- Result collection and validation
- Actor workflow support

## No External Layer Modifications (This Task)

**Important**: This documentation task does NOT modify any code layers.

- No changes to `Modern/api/`
- No changes to `Modern/services/`
- No changes to `Modern/repositories/`
- No changes to `Modern/engine/`
- No changes to `Modern/db.sql`
- No changes to Legacy code


# Architecture Constraints

## Preserve Master as Operational Authority

- Master maintains operational authority throughout tournament
- Master approves all operational changes
- Master handles all exceptions and disputes
- Master confirms all match results
- Master controls calling process

## Keep Match Operations Separate from Competition Domain

- Match Operations is independent of Competition structure
- Match Operations focuses on tournament execution
- Competition domain focuses on structure and organization
- Clear separation of concerns

## Avoid Mixing Schedule Generation with Live Operations

- Schedule generation is a planning activity
- Live operations are an execution activity
- Different workflows for different phases
- Schedule generation algorithm is excluded

## Maintain Technology Independence

- Notification architecture is technology-independent
- No specific notification technology prescribed
- No SMS/email provider integration defined
- Architecture supports multiple notification channels

## Maintain Clear Actor Boundaries

- Master has operational authority
- Referee has execution authority
- Player has participation authority
- TOP System has coordination authority


# Testing Strategy (Future Implementation)

## Test Categories

### 1. State Model Tests

- Operational states correctly defined
- State ownership verified
- States consistent with approved architecture

### 2. Workflow Tests

- Match calling workflow end-to-end
- Check-in workflow end-to-end
- Result submission workflow end-to-end
- Exception handling workflows

### 3. Actor Boundary Tests

- Master authority enforcement
- Referee authority enforcement
- Player authority enforcement
- Cross-actor operation rejection

### 4. Legacy Regression Tests

- Existing operational tests remain passing
- Legacy workflow compatibility verified
- No breaking changes introduced

## Test Tools (Future)

**Framework**: Node built-in test runner (`node:test`)
**Assertion Library**: `node:assert/strict`


# Rollback Considerations (Future Implementation)

## Rollback Strategy

If implementation fails or introduces critical issues:

1. Remove new Match Operations domain files
2. Restore original files (if modified)
3. Re-run existing test suite
4. Verify all tests pass
5. Verify Legacy workflows remain functional

## Rollback Safety

- Rollback is safe (incremental addition)
- Rollback is reversible (no permanent data changes)
- Rollback is fast (isolated domain)
- Legacy workflows unaffected by rollback

No production code modified.
Follow TES Handoff Protocol.
