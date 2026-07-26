Task:
TASK-OPS-002

Title:
Court Calling and Notification Architecture


Purpose:

Record the architecture for match calling, player readiness, referee readiness and court notification during live tournament operations.


# Architecture Decision

TOP defines a reliable match readiness flow:

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


This flow ensures that all required participants know when a match is ready.


# Master Decision

Master controls the calling process.

Master is responsible for:

- Controlling calling process
- Handling exceptions
- Can override operational status
- Initiates match calling
- Monitors notification status
- Manages calling exceptions


Master does not define:

- Specific notification technology
- Mobile application implementation
- Hardware design
- SMS/email provider integration


# Referee Decision

Referee confirms readiness and starts match.

Referee is responsible for:

- Receiving assigned match information
- Confirming readiness
- Starting and completing match
- Monitoring notification status
- Reporting notification issues


Referee does not define:

- Tournament scheduling
- Competition structure changes
- Ranking calculations
- Hardware operations


# Player Decision

Player receives match readiness information and arrives at court.

Player is responsible for:

- Receiving match readiness information
- Arriving at assigned court
- Confirming participation
- Reporting notification issues


Player does not define:

- Tournament operations
- Match scheduling
- Competition rules


# TOP System Decision

TOP System maintains operational state and provides notification channels.

TOP System is responsible for:

- Maintaining operational state
- Providing notification channels
- Recording readiness status
- Tracking notification delivery
- Supporting calling workflow


TOP System does not define:

- Specific notification technology
- Mobile application implementation
- Hardware design
- SMS/email provider integration


# Calling Workflow Decision

The calling workflow has six phases:

1. Match Ready
2. Calling Issued
3. Player Notification
4. Referee Notification
5. Court Ready
6. Match Started


# Notification Boundary Decision

Notification responsibilities are clearly defined:

Master:
- Controls calling process
- Initiates calling
- Handles calling exceptions
- Can override operational status

Referee:
- Confirms readiness
- Starts match
- Reports notification issues

Player:
- Receives match readiness information
- Arrives at court
- Confirms participation

TOP System:
- Maintains operational state
- Provides notification channels
- Records readiness status


# Readiness States Decision

Clear readiness states are maintained:

Player Readiness:
- Notified
- Acknowledged
- Arrived
- Ready

Referee Readiness:
- Notified
- Acknowledged
- Present
- Ready

Court Readiness:
- Available
- Occupied
- Ready


# Master Control Boundary Decision

Master maintains operational authority:

Operational Authority:
- Master controls calling process
- Master initiates calling
- Master handles calling exceptions
- Master can override operational status

Exception Handling:
- Master handles notification delivery failures
- Master handles participant absence
- Master handles referee absence
- Master handles court availability issues

Override Authority:
- Master can override operational status
- Master can initiate manual calling
- Master can skip notification
- Master can delay match start


# Technology Independence Decision

The architecture is technology-independent.

Future implementation should:

- Define notification requirements
- Define notification responsibilities
- Define notification tracking
- Define notification exceptions
- Technology implementation is separate from architecture


# Scope Boundary

Included:

- Match calling concept
- Notification boundary
- Player readiness state
- Referee readiness state
- Court readiness concept
- Master control boundary
- Calling workflow
- Notification responsibility
- Human authority boundary
- Court operation flow


Excluded:

- Specific notification technology
- Mobile application implementation
- Hardware design
- SMS/email provider integration
- Production code changes


# Implementation Guidance

Future implementation must preserve:

- Master as operational authority
- Treat notification as assistance, not replacement of human control
- Preserve Match Operations boundary
- Avoid coupling notification technology with match domain
- Maintain clear notification boundaries
- Support multiple notification channels


No production code modified.
Follow TES Handoff Protocol.