# TASK-OPS-002: Court Calling and Notification Architecture

**Task ID:** TASK-OPS-002  
**Title:** Court Calling and Notification Architecture  
**Type:** ARCHITECTURE  
**Priority:** Medium  
**Dependency:** TASK-OPS-001  
**Date:** 2026-07-26  
**Status:** Architecture Definition

---

## Objective

Define the architecture for match calling, player readiness, referee readiness and court notification during live tournament operations.

---

## Background

During live tournaments, voice-only calling has limitations. Players and referees may not always hear announcements. TOP should evolve from manual voice calling into a structured operational workflow. The goal is not only notification delivery, but ensuring that all required participants know when a match is ready.

The current Legacy Context:

Legacy workflow relies mainly on human communication:

- Master announces matches
- Referees and players listen for calls
- Referees confirm participants on site

The modern architecture needs to formalize these notification flows while maintaining the separation of concerns established in TASK-OPS-001.

---

## Architecture Goal

Define a reliable match readiness flow.

**Core Workflow:**

```
Match Ready
  ↓
Calling Issued
  ↓
Player Notification
  ↓
Referee Notification
  ↓
Court Ready
  ↓
Match Started
```

---

## Actors

### Master

**Responsibilities:**
- Controls calling process
- Handles exceptions
- Can override operational status
- Initiates match calling
- Monitors notification status
- Manages calling exceptions

**Authority:**
- Operational authority over calling process
- Authority to override operational status
- Authority to handle calling exceptions
- Authority to initiate match calling

**Not Responsible:**
- Specific notification technology
- Mobile application implementation
- Hardware design
- SMS/email provider integration

### Referee

**Responsibilities:**
- Receives assigned match information
- Confirms readiness
- Starts and completes match
- Monitors notification status
- Reports notification issues

**Authority:**
- Match execution authority
- Readiness confirmation authority
- Match start authority

**Not Responsible:**
- Tournament scheduling
- Competition structure changes
- Ranking calculations
- Hardware operations

### Player

**Responsibilities:**
- Receives match readiness information
- Arrives at assigned court
- Confirms participation
- Reports notification issues

**Authority:**
- Match participation authority
- Court arrival authority
- Participation confirmation authority

**Not Responsible:**
- Tournament operations
- Match scheduling
- Competition rules

### TOP System

**Responsibilities:**
- Maintains operational state
- Provides notification channels
- Records readiness status
- Tracks notification delivery
- Supports calling workflow

**Authority:**
- System state management
- Operational data persistence
- Workflow coordination
- Notification tracking

**Not Responsible:**
- Specific notification technology
- Mobile application implementation
- Hardware design
- SMS/email provider integration

---

## Calling Workflow

### Phase 1: Match Ready

**Definition:**

Match Ready is the state where a match is scheduled, prepared, and waiting to be called.

**Workflow:**

1. **Match is scheduled**
   - Match is scheduled in the system
   - Match information is prepared
   - Match is assigned to a court
   - Match is assigned to participants

2. **Match is prepared**
   - Court is available
   - Match information is distributed
   - Referee is assigned
   - Players are notified of match time

3. **Match is ready to call**
   - Match is waiting to be called
   - All participants are aware of match time
   - Match is ready to start
   - Calling process can begin

**Key Decisions:**

- Match Ready is a system state
- Match Ready is determined by scheduling and preparation
- Match Ready is the prerequisite for calling
- Match Ready is independent of notification delivery

---

### Phase 2: Calling Issued

**Definition:**

Calling Issued is the state where the calling process has been initiated but notification delivery is in progress.

**Workflow:**

1. **Master initiates calling**
   - Master reviews match readiness
   - Master confirms match can be called
   - Master triggers calling process

2. **Calling is issued**
   - Calling request is sent to notification system
   - Notification channels are engaged
   - Calling process is initiated

3. **Calling is in progress**
   - Notifications are being delivered
   - Delivery status is tracked
   - Exceptions are being monitored

**Key Decisions:**

- Calling Issued is initiated by Master
- Calling Issued is a formal process
- Calling Issued is tracked for delivery status
- Calling Issued is independent of notification technology

---

### Phase 3: Player Notification

**Definition:**

Player Notification is the process of notifying players that their match is ready.

**Workflow:**

1. **Player notification is sent**
   - Player receives match readiness information
   - Player is notified of match time
   - Player is notified of court location

2. **Player acknowledges notification**
   - Player confirms receipt of notification
   - Player confirms participation
   - Player confirms arrival

3. **Player arrives at court**
   - Player arrives at assigned court
   - Player presents identification
   - Player confirms participation

**Key Decisions:**

- Player Notification is player-initiated
- Player Notification is confirmed by player
- Player Notification is tracked for delivery status
- Player Notification is independent of notification technology

---

### Phase 4: Referee Notification

**Definition:**

Referee Notification is the process of notifying referees that their match is ready.

**Workflow:**

1. **Referee notification is sent**
   - Referee receives assigned match information
   - Referee is notified of match time
   - Referee is notified of court location

2. **Referee acknowledges notification**
   - Referee confirms receipt of notification
   - Referee confirms readiness
   - Referee confirms match start

3. **Referee arrives at court**
   - Referee arrives at assigned court
   - Referee verifies participants
   - Referee confirms match start

**Key Decisions:**

- Referee Notification is referee-initiated
- Referee Notification is confirmed by referee
- Referee Notification is tracked for delivery status
- Referee Notification is independent of notification technology

---

### Phase 5: Court Ready

**Definition:**

Court Ready is the state where both players and referee are present and ready for the match.

**Workflow:**

1. **Both players are present**
   - Both players have arrived at court
   - Both players have checked in
   - Both players are ready to play

2. **Referee is present**
   - Referee has arrived at court
   - Referee has verified participants
   - Referee is ready to start match

3. **Court is ready**
   - Court is available
   - All participants are present
   - Match is ready to start
   - Match calling can proceed

**Key Decisions:**

- Court Ready requires both players and referee
- Court Ready is confirmed by referee
- Court Ready is the prerequisite for match start
- Court Ready is independent of notification technology

---

### Phase 6: Match Started

**Definition:**

Match Started is the state where the match has officially begun.

**Workflow:**

1. **Match calling is confirmed**
   - Referee confirms match start
   - Match status changes to "In Progress"
   - Match start time is recorded

2. **Match execution begins**
   - Referee manages match execution
   - Players participate in match
   - Match events are recorded

3. **Match execution continues**
   - Match is being executed
   - Match events are being recorded
   - Match status is maintained

**Key Decisions:**

- Match Started is initiated by referee
- Match Started is confirmed by referee
- Match Started is tracked by system
- Match Started is independent of notification technology

---

## Notification Boundary

### Notification Responsibility

**Master:**
- Controls calling process
- Initiates calling
- Handles calling exceptions
- Can override operational status

**Referee:**
- Confirms readiness
- Starts match
- Reports notification issues

**Player:**
- Receives match readiness information
- Arrives at court
- Confirms participation

**TOP System:**
- Maintains operational state
- Provides notification channels
- Records readiness status

### Notification Scope

**Included:**
- Match calling concept
- Notification boundary
- Player readiness state
- Referee readiness state
- Court readiness concept
- Master control boundary

**Excluded:**
- Specific notification technology
- Mobile application implementation
- Hardware design
- SMS/email provider integration

---

## Readiness States

### Player Readiness States

**Notified:**
- Player has received match readiness information
- Player is aware of match time
- Player is aware of court location

**Acknowledged:**
- Player has confirmed receipt of notification
- Player has confirmed participation
- Player has confirmed arrival

**Arrived:**
- Player has arrived at court
- Player has presented identification
- Player is ready to play

**Ready:**
- Player is ready for match
- Player has completed check-in
- Player is waiting for match start

### Referee Readiness States

**Notified:**
- Referee has received assigned match information
- Referee is aware of match time
- Referee is aware of court location

**Acknowledged:**
- Referee has confirmed receipt of notification
- Referee has confirmed readiness
- Referee has confirmed match start

**Present:**
- Referee has arrived at court
- Referee has verified participants
- Referee is ready to start match

**Ready:**
- Referee is ready for match
- Referee has verified participants
- Referee is ready to start match

### Court Readiness States

**Available:**
- Court is available
- Court is assigned to match
- Court is ready for use

**Occupied:**
- Court is occupied by previous match
- Court is being prepared
- Court is not ready for use

**Ready:**
- Court is available
- All participants are present
- Match is ready to start
- Court is ready for match

---

## Master Control Boundary

### Master Authority

**Operational Authority:**
- Master controls calling process
- Master initiates calling
- Master handles calling exceptions
- Master can override operational status

**Exception Handling:**
- Master handles notification delivery failures
- Master handles participant absence
- Master handles referee absence
- Master handles court availability issues

**Override Authority:**
- Master can override operational status
- Master can initiate manual calling
- Master can skip notification
- Master can delay match start

### Master Responsibilities

**Calling Process:**
- Review match readiness
- Confirm match can be called
- Trigger calling process
- Monitor calling status
- Handle calling exceptions

**Exception Management:**
- Handle notification delivery failures
- Handle participant absence
- Handle referee absence
- Handle court availability issues
- Coordinate alternative solutions

**Operational Control:**
- Control calling process
- Override operational status
- Initiate manual calling
- Skip notification
- Delay match start

---

## Notification Technology Considerations

### Technology Independence

**Architecture Principle:**

The calling and notification architecture should be technology-independent. The architecture defines the workflow and responsibilities, but does not specify the technology used for notification delivery.

**Benefits:**

- Technology independence allows flexibility
- Architecture can evolve with technology changes
- Architecture is not tied to specific vendors
- Architecture supports multiple notification channels

**Implementation Guidance:**

- Architecture should define notification requirements
- Architecture should define notification responsibilities
- Architecture should define notification tracking
- Architecture should define notification exceptions
- Technology implementation is separate from architecture

### Notification Channels

**Potential Channels:**

- Voice announcements
- SMS notifications
- Email notifications
- Mobile app notifications
- Display board notifications
- Hardware device notifications

**Channel Selection:**

- Channel selection is implementation-specific
- Channel selection should consider tournament requirements
- Channel selection should consider participant preferences
- Channel selection should consider venue constraints
- Channel selection should consider budget constraints

---

## Scope Included

### Workflows
- Match calling workflow
- Player notification workflow
- Referee notification workflow
- Court readiness workflow
- Master control workflow

### Concepts
- Match calling concept
- Notification boundary
- Player readiness state
- Referee readiness state
- Court readiness concept
- Master control boundary

### Responsibilities
- Calling workflow documented
- Notification responsibility defined
- Human authority boundary preserved
- Player/referee readiness concept defined
- Court operation flow documented

### Operational Boundaries
- Notification tracking
- Readiness state management
- Calling process control
- Exception handling
- Technology independence

---

## Scope Excluded

### Notification Technology
- Specific notification technology
- Notification channel selection
- Notification delivery implementation
- Notification provider integration
- Notification system design

### Mobile Application
- Mobile application implementation
- Mobile application UI/UX
- Mobile application features
- Mobile application notifications

### Hardware Design
- Hardware device design
- Hardware notification implementation
- Hardware control interfaces
- Hardware status monitoring

### Production Code
- No production code modified
- No code implementation
- No code testing
- No code deployment
- No code integration

---

## Acceptance Criteria

### Calling Workflow
- [ ] Match calling workflow documented
- [ ] Calling process phases defined
- [ ] Calling initiation documented
- [ ] Calling tracking documented
- [ ] Calling exceptions documented

### Notification Responsibility
- [ ] Master notification responsibility defined
- [ ] Referee notification responsibility defined
- [ ] Player notification responsibility defined
- [ ] TOP System notification responsibility defined
- [ ] Notification boundary defined

### Human Authority Boundary
- [ ] Master control boundary defined
- [ ] Master operational authority defined
- [ ] Master exception handling defined
- [ ] Master override authority defined
- [ ] Human authority preserved

### Player/Referee Readiness
- [ ] Player readiness states defined
- [ ] Referee readiness states defined
- [ ] Player notification workflow defined
- [ ] Referee notification workflow defined
- [ ] Readiness confirmation documented

### Court Operation Flow
- [ ] Court readiness concept defined
- [ ] Court readiness states defined
- [ ] Court operation flow documented
- [ ] Court availability documented
- [ ] Court readiness confirmation documented

---

## Implementation Guidance

### For Future Codex Implementation

#### Keep Master as Operational Authority
- Master maintains control over calling process
- Master initiates calling
- Master handles calling exceptions
- Master can override operational status

#### Treat Notification as Assistance, Not Replacement
- Notification is assistance to human control
- Notification does not replace human authority
- Notification does not replace human confirmation
- Notification supports, but does not replace, human control

#### Preserve Match Operations Boundary
- Notification is part of Match Operations
- Notification is separate from Entry domain
- Notification is separate from Schedule domain
- Clear separation of concerns

#### Avoid Coupling Notification Technology with Match Domain
- Notification technology is implementation-specific
- Notification technology is separate from match domain
- Notification technology is separate from match operations
- Architecture should be technology-independent

#### Maintain Clear Notification Boundaries
- Notification responsibilities are clearly defined
- Notification tracking is clearly defined
- Notification exceptions are clearly defined
- Notification status is clearly tracked

#### Support Multiple Notification Channels
- Architecture should support multiple notification channels
- Architecture should be technology-independent
- Architecture should support future technology changes
- Architecture should support vendor flexibility

---

## Success Criteria

### Architecture Completeness
- All calling workflows are documented
- All notification responsibilities are defined
- All authority boundaries are clear
- All readiness states are defined
- All court operation flows are documented

### Design Quality
- Clear separation of concerns
- Well-defined workflows
- Clear authority boundaries
- Technology-independent design
- Extensible design

### Documentation Quality
- All concepts are documented
- All workflows are defined
- All actors are described
- All decisions are documented
- All boundaries are clear

### Future-Readiness
- Architecture supports multiple notification channels
- Architecture is technology-independent
- Architecture supports future technology changes
- Architecture is maintainable and extensible

---

## Status

**Architecture Definition Complete**

This architecture document defines the Court Calling and Notification architecture for TASK-OPS-002. The calling workflows, notification boundaries, and readiness states are fully specified to guide future implementation.

### Next Steps
1. Review and approve this architecture definition
2. Implement calling workflows based on approved design
3. Create database schema for readiness state management
4. Implement notification tracking system
5. Integrate with existing Match Operations (TASK-OPS-001)
6. Support multiple notification channels

### Success Indicators
- All calling workflows are clearly defined
- All notification responsibilities are well-documented
- All authority boundaries are clear
- No production code is modified
- Architecture is technology-independent
- Architecture is extensible for future notification channels