# TASK-OPS-001: Match Operations Architecture

**Task ID:** TASK-OPS-001  
**Title:** Match Operations Architecture  
**Type:** ARCHITECTURE  
**Priority:** High  
**Dependency:** TASK-REG-001-D  
**Date:** 2026-07-26  
**Status:** Architecture Definition

---

## Objective

Define the operational workflow of TOP during live tournament execution. The architecture should describe how Master, Referee, Player and TOP system interact during tournament operations.

---

## Background

TOP is a tournament operation platform. After competition structure and participation models are defined, the next domain is live match operations.

Legacy TOP already supports parts of this workflow:

- Master prepares and distributes match information
- Referees retrieve match information through tournament/player identifiers
- Referees verify player identity on site
- Match results are returned to Master

The modern architecture needs to formalize these operational flows while maintaining the separation of concerns established in previous architecture tasks.

---

## Architecture Goal

Define the operational flow from scheduled matches to completed results.

**Core Workflow:**

```
Schedule
  ↓
Match Preparation
  ↓
Match Calling
  ↓
Player Readiness
  ↓
Referee Verification
  ↓
Match Execution
  ↓
Result Submission
  ↓
Master Confirmation
```

---

## Actors

### Master

**Responsibilities:**
- Manage tournament operations
- Handle exceptions
- Approve operational changes
- Distribute match information
- Receive and confirm match results
- Coordinate with referees

**Authority:**
- Operational authority over tournament execution
- Final approval for match results
- Exception handling and dispute resolution
- Operational change management

**Not Responsible:**
- Match scheduling algorithm
- Scoring rules
- Hardware integration
- Mobile application design

### Referee

**Responsibilities:**
- Receive assigned matches
- Verify participants
- Record match results
- Manage match execution
- Report match issues

**Authority:**
- Match execution authority
- Participant verification authority
- Result recording authority
- Match status management

**Not Responsible:**
- Tournament scheduling
- Competition structure changes
- Ranking calculations
- Hardware operations

### Player

**Responsibilities:**
- Receive match information
- Arrive and participate
- Check-in for matches
- Report readiness

**Authority:**
- Match participation
- Check-in confirmation
- Result acknowledgment

**Not Responsible:**
- Tournament operations
- Match scheduling
- Competition rules

### TOP System

**Responsibilities:**
- Provide operational information
- Record operational state
- Maintain match status
- Support referee workflows
- Support player workflows

**Authority:**
- System state management
- Operational data persistence
- Workflow coordination

**Not Responsible:**
- Match scheduling algorithm
- Scoring rules
- Hardware operations
- Mobile application design

---

## Operational Workflows

### 1. Master Workflow

**Phase 1: Match Preparation**

- Master reviews scheduled matches
- Master prepares match information (court, time, participants)
- Master distributes match information to referees
- Master confirms match information is accurate

**Phase 2: Match Execution Support**

- Master monitors match status
- Master handles referee requests
- Master approves operational changes
- Master manages exceptions

**Phase 3: Result Management**

- Master receives match results from referees
- Master verifies result accuracy
- Master confirms match completion
- Master updates tournament status

**Key Decisions:**
- Master maintains operational authority throughout tournament
- Master approves all operational changes
- Master handles all exceptions and disputes
- Master confirms all match results

---

### 2. Referee Workflow

**Phase 1: Match Retrieval**

- Referee retrieves assigned matches
- Referee verifies match information
- Referee confirms match details

**Phase 2: Participant Verification**

- Referee verifies player identity on site
- Referee checks player eligibility
- Referee confirms participant readiness
- Referee reports any issues

**Phase 3: Match Execution**

- Referee manages match execution
- Referee records match events
- Referee updates match status
- Referee reports match issues

**Phase 4: Result Submission**

- Referee records match results
- Referee submits results to TOP system
- Referee confirms result submission
- Referee reports any issues

**Key Decisions:**
- Referee has authority to verify participants
- Referee has authority to record match results
- Referee must follow established result format
- Referee reports match issues to Master

---

### 3. Player Readiness Workflow

**Phase 1: Match Information Reception**

- Player receives match information
- Player reviews match details
- Player confirms participation

**Phase 2: Check-in**

- Player arrives at match venue
- Player checks in for match
- Player confirms readiness
- Player reports any issues

**Phase 3: Match Participation**

- Player participates in match
- Player follows match rules
- Player follows referee instructions

**Phase 4: Result Acknowledgment**

- Player receives match results
- Player acknowledges results
- Player reports any issues

**Key Decisions:**
- Player receives match information before match
- Player must check-in before match
- Player confirms readiness before match
- Player acknowledges results after match

---

### 4. Match Calling Workflow

**Concept Definition:**

Match Calling is the process of formally starting a match and transitioning it from scheduled to in-progress state.

**Workflow:**

1. **Master initiates match calling**
   - Master reviews match readiness
   - Master confirms match can start
   - Master triggers match calling

2. **Referee receives match calling**
   - Referee confirms match calling request
   - Referee verifies match is ready
   - Referee confirms match start

3. **TOP system updates match status**
   - Match status changes to "In Progress"
   - Match start time recorded
   - Match participants confirmed

4. **Match execution begins**
   - Referee manages match execution
   - Players participate in match
   - Match events recorded

**Key Decisions:**
- Match calling is initiated by Master
- Referee confirms match readiness
- Match status updates automatically
- Match calling is a formal process

---

### 5. Check-in Workflow

**Concept Definition:**

Check-in is the process of confirming player presence and readiness before a match.

**Workflow:**

1. **Player arrives at venue**
   - Player arrives at match venue
   - Player presents identification
   - Player confirms participation

2. **Referee verifies check-in**
   - Referee verifies player identity
   - Referee confirms player eligibility
   - Referee records check-in

3. **TOP system records check-in**
   - Player status updated to "Checked In"
   - Check-in time recorded
   - Match participants confirmed

4. **Match readiness confirmed**
   - Both players checked in
   - Match is ready to start
   - Match calling can proceed

**Key Decisions:**
- Check-in is player-initiated
- Referee verifies check-in
- Check-in time is recorded
- Both players must check-in for match to start

---

### 6. Result Submission Workflow

**Concept Definition:**

Result Submission is the process of recording and submitting match results to the TOP system.

**Workflow:**

1. **Referee records match results**
   - Referee records match outcome
   - Referee records match statistics
   - Referee records match details

2. **Referee validates results**
   - Referee validates result format
   - Referee validates result accuracy
   - Referee confirms result completeness

3. **Referee submits results**
   - Referee submits results to TOP system
   - Referee confirms submission
   - Referee reports any issues

4. **TOP system processes results**
   - Results are validated
   - Results are stored
   - Match status updated to "Completed"
   - Tournament status updated

5. **Master receives results**
   - Master reviews results
   - Master verifies results
   - Master confirms results

**Key Decisions:**
- Referee has authority to record results
- Results must follow established format
- Results must be validated before submission
- Master confirms all results

---

## Operational State Boundaries

### Match States

**Scheduled:**
- Match is scheduled
- Match information is prepared
- Match is waiting to start

**Match Calling:**
- Match calling initiated
- Match is ready to start
- Waiting for referee confirmation

**In Progress:**
- Match has started
- Match is being executed
- Match events are being recorded

**Completed:**
- Match has finished
- Results have been submitted
- Match is closed

**Cancelled:**
- Match has been cancelled
- Reason has been recorded
- Tournament status updated

### Player States

**Registered:**
- Player is registered for tournament
- Player is eligible for matches

**Checked In:**
- Player has checked in for match
- Player is present at venue
- Player is ready to play

**Ready:**
- Player is ready for match
- Player has completed check-in
- Player is waiting for match start

**Participating:**
- Player is currently in match
- Player is executing match

**Completed:**
- Player has finished match
- Player has acknowledged results

### Referee States

**Available:**
- Referee is available for matches
- Referee is ready to receive assignments

**Assigned:**
- Referee has been assigned a match
- Referee is reviewing match details

**Verifying:**
- Referee is verifying participants
- Referee is checking player eligibility

**Executing:**
- Referee is managing match execution
- Referee is recording match events

**Submitting:**
- Referee is submitting match results
- Referee is validating results

---

## Scope Included

### Workflows
- Master workflow
- Referee workflow
- Player readiness workflow
- Match calling workflow
- Check-in workflow
- Result submission workflow

### Concepts
- Match calling concept
- Check-in concept
- Operational state boundaries
- Match states
- Player states
- Referee states

### Responsibilities
- Roles and responsibilities documented
- Master authority boundary defined
- Referee workflow defined
- Player readiness process defined
- Result return process defined

### Operational Boundaries
- Operational state management
- Workflow coordination
- Actor interactions
- Authority boundaries

---

## Scope Excluded

### Match Algorithm
- Match scheduling algorithm
- Schedule generation logic
- Schedule generation workflows
- Schedule generation APIs
- Scheduling algorithms

### Scoring Rules
- Scoring rule definitions
- Scoring rule implementations
- Scoring rule validation
- Scoring rule enforcement

### Ranking
- Ranking calculation algorithms
- Ranking tables and leaderboards
- Ranking updates and refresh logic
- Ranking display and presentation

### Hardware Integration
- Hardware notification implementation
- Hardware device integration
- Hardware control interfaces
- Hardware status monitoring

### Mobile Application
- Mobile application design
- Mobile application implementation
- Mobile application UI/UX
- Mobile application features

### Production Code
- No production code modified
- No code implementation
- No code testing
- No code deployment
- No code integration

---

## Acceptance Criteria

### Roles and Responsibilities
- [ ] Master responsibilities documented
- [ ] Referee responsibilities documented
- [ ] Player responsibilities documented
- [ ] TOP System responsibilities documented
- [ ] Authority boundaries defined

### Match Operation Flow
- [ ] Master workflow documented
- [ ] Referee workflow documented
- [ ] Player readiness workflow documented
- [ ] Match calling workflow documented
- [ ] Check-in workflow documented
- [ ] Result submission workflow documented

### Master Authority Boundary
- [ ] Master operational authority defined
- [ ] Master exception handling defined
- [ ] Master result approval defined
- [ ] Master change management defined

### Referee Workflow
- [ ] Referee match retrieval documented
- [ ] Referee participant verification documented
- [ ] Referee match execution documented
- [ ] Referee result submission documented

### Player Readiness Process
- [ ] Player match information reception documented
- [ ] Player check-in process documented
- [ ] Player readiness confirmation documented
- [ ] Player result acknowledgment documented

### Result Return Process
- [ ] Result recording process documented
- [ ] Result validation process documented
- [ ] Result submission process documented
- [ ] Result confirmation process documented

---

## Implementation Guidance

### For Future Codex Implementation

#### Preserve Master as Operational Authority
- Master maintains operational authority throughout tournament
- Master approves all operational changes
- Master handles all exceptions and disputes
- Master confirms all match results

#### Keep Match Operations Separate from Entry Domain
- Match operations are independent of Entry domain
- Match operations focus on tournament execution
- Entry domain focuses on competition structure
- Clear separation of concerns

#### Avoid Mixing Schedule Generation with Live Operations
- Schedule generation is separate from live operations
- Schedule generation is a planning activity
- Live operations are an execution activity
- Different workflows for different phases

#### Support Incremental Migration from Legacy Workflow
- Preserve existing Master workflow patterns
- Preserve existing Referee workflow patterns
- Preserve existing Player workflow patterns
- Gradually modernize operational processes

#### Maintain Clear Actor Boundaries
- Master has operational authority
- Referee has execution authority
- Player has participation authority
- TOP System has coordination authority

#### Define Clear State Transitions
- Match states are clearly defined
- Player states are clearly defined
- Referee states are clearly defined
- State transitions are well-documented

---

## Success Criteria

### Architecture Completeness
- All operational workflows are documented
- All actor responsibilities are defined
- All authority boundaries are clear
- All state transitions are defined

### Design Quality
- Clear separation of concerns
- Well-defined workflows
- Clear authority boundaries
- Extensible design

### Documentation Quality
- All concepts are documented
- All workflows are defined
- All actors are described
- All decisions are documented

### Future-Readiness
- Architecture supports incremental migration
- Architecture supports multi-sport operations
- Architecture supports future operational enhancements
- Architecture is maintainable and extensible

---

## Status

**Architecture Definition Complete**

This architecture document defines the Match Operations architecture for TASK-OPS-001. The operational workflows, actor responsibilities, and state boundaries are fully specified to guide future implementation.

### Next Steps
1. Review and approve this architecture definition
2. Implement operational workflows based on approved design
3. Create database schema for operational state management
4. Implement API endpoints for operational workflows
5. Integrate with existing competition structure (TASK-REG-001-D)
6. Support incremental migration from Legacy workflow

### Success Indicators
- All operational workflows are clearly defined
- All actor responsibilities are well-documented
- All authority boundaries are clear
- No production code is modified
- Architecture is extensible for future operations