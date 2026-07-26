# TOP Modern Tournament Operations Architecture

## Purpose

This document provides a high-level architecture overview of TOP as a tournament operation platform. It consolidates approved architecture decisions from TASK-TOP-007C series, TASK-REG-001-A through TASK-REG-001-D, TASK-OPS-001, and TASK-OPS-002.

---

## 1. Platform Positioning

### Core Focus

TOP focuses on tournament execution and live operations. The platform manages the entire tournament lifecycle from competition organization through match execution and result collection.

### Core Value

- **Competition Organization**: Define tournament structure, rules, and participation boundaries
- **Schedule Operation**: Generate and manage match schedules
- **Match Execution**: Coordinate match preparation, calling, and execution
- **Referee Workflow**: Manage referee assignments, readiness, and match oversight
- **Result Collection**: Record and validate match outcomes

### Important Positioning

**TOP is not currently a registration platform.**

TOP begins from competition participation data entering tournament operations. External registration platforms may provide data sources. Future TOP registration capability may be considered separately.

### Current Scope

TOP is a tournament operation platform that:

- Manages competition structure and organization
- Handles entry ingestion and validation
- Coordinates match operations and scheduling
- Records and validates results
- Supports referee workflows

### Excluded Scope

TOP does not currently provide:

- Registration SaaS functionality
- Payment processing system
- User management platform
- Authentication and authorization
- External registration workflows

---

## 2. Modern Domain Overview

### Domain Flow

```
External Sources
        ↓
Entry Ingestion Layer
        ↓
Competition
        ↓
Group
        ↓
Event
        ↓
Entry
        ↓
Participant
        ↓
Schedule
        ↓
Match Operations
        ↓
Result
```

### Domain Responsibilities

**External Sources**: Tennis platform exports, Excel files, manual entry, future API integrations, future AI/OCR processing

**Entry Ingestion Layer**: Transforms external data into Entry candidates, validates data, enables human review

**Competition**: Owns tournament lifecycle, defines overall rules and constraints

**Group**: Classifies participants by age, skill, or other criteria (e.g., Open, Senior, U10, U12, 50+)

**Event**: Defines competition format and rules (e.g., Men's Singles, Women's Doubles, Mixed Doubles, Parent-child)

**Entry**: Represents the competitive unit participating in an Event

**Participant**: Individual person or team member within an Entry

**Schedule**: Generates match schedules based on confirmed Entries

**Match Operations**: Coordinates match preparation, calling, and execution

**Result**: Records and validates match outcomes

---

## 3. Competition Structure

### Competition

**Definition**: One tournament or competition event.

**Responsibilities**:
- Owns tournament lifecycle
- Defines overall rules and constraints
- Manages registration lifecycle
- Owns Entry lifecycle

**Examples**: Annual Tennis Championship, Regional Badminton Tournament

### Group

**Definition**: Participant classification and competition scope.

**Responsibilities**:
- Classifies participants by age, skill, or other criteria
- Defines eligibility rules for participation
- Does not define match format or entry composition

**Examples**:
- Open Group
- Senior Group
- U10 (Under 10)
- U12 (Under 12)
- 50+ (Age 50 and above)

### Event

**Definition**: Competition format within a Group.

**Responsibilities**:
- Defines competition format
- Defines entry composition rules
- Owns sport-specific competition behavior
- Does not own participant identity or match scheduling

**Examples**:
- Men's Singles
- Women's Singles
- Men's Doubles
- Women's Doubles
- Mixed Doubles
- Parent-child events

### Entry

**Definition**: The competitive unit participating in an Event.

**Responsibilities**:
- Represents what actually competes in matches
- Provides stable interface for tournament operations
- Is validated before entering operations

**Examples**:
- Individual player
- Pair of players
- Team of players

### Participant

**Definition**: Individual person or team member within an Entry.

**Responsibilities**:
- Represents actual individuals competing
- Exists within competition context
- Can be individual or team-based

**Relationship**:
- Entry contains one or more Participants
- Participant can be individual or team
- Participant represents actual competition entity

---

## 4. Entry Ingestion Architecture

### External Sources

TOP supports multiple external data sources:

- **Tennis Platform Exports**: Data from external tennis management systems
- **Excel Files**: Manual data entry via spreadsheet files
- **Manual Entry**: Direct data entry through user interfaces
- **Future API**: Automated data retrieval through API integrations
- **Future AI/OCR**: Document processing and data extraction using AI/OCR technology

### Ingestion Flow

```
Source
        ↓
Adapter
        ↓
Entry Candidate
        ↓
Human Review
        ↓
Entry
```

### Source Adapter

Each external source has a dedicated Source Adapter:

- **Manual Entry Adapter**: Handles manual data entry with user input validation
- **File Parser Adapter**: Processes Excel/CSV files with format validation
- **External Platform Adapter**: Integrates with external platform exports
- **Future API Adapter**: Supports API integrations for automated data retrieval
- **Future AI/OCR Adapter**: Handles AI/OCR extraction for document processing

**Adapter Responsibilities**:
- Knows source format and parsing logic
- Transforms source data to Entry domain objects
- Is isolated from core domain operations
- Validates source data format, completeness, and constraints

### Entry Candidate

Imported data first becomes an Entry Candidate:

- Requires validation and human confirmation before becoming operational
- Provides complete audit trail of transformation and review
- Allows separate validation from transformation logic
- Enables human oversight before Entry creation
- Can be accepted or rejected

### Validation Levels

Validation occurs at four levels:

1. **Source Level**: Validates source data format, completeness, and constraints
2. **Transformation Level**: Validates transformed data structure and Entry domain compliance
3. **Entry Level**: Validates Entry candidates against Entry requirements
4. **Human Review Level**: Human reviewers accept or reject candidates

### Human Operation

TOP supports human confirmation and adjustment because tournament operations require flexibility:

- Reviewers examine transformed data
- Reviewers verify data accuracy
- Reviewers accept or reject candidates
- Reviewers document review decisions
- Reviewers provide feedback to sources

This boundary ensures quality assurance and builds trust in the data entering the system.

---

## 5. Match Operations Architecture

### Actors

#### Master

**Definition**: Tournament authority with operational control.

**Responsibilities**:
- Managing tournament operations
- Handling exceptions
- Approving operational changes
- Distributing match information
- Receiving and confirming match results
- Coordinating with referees
- Controlling the calling process
- Initiating match calling
- Handling calling exceptions
- Can override operational status
- Monitoring notification status
- Manages calling exceptions

**Does Not Define**:
- Match scheduling algorithm
- Scoring rules
- Hardware integration
- Mobile application design
- Specific notification technology
- SMS/email provider integration

#### Referee

**Definition**: Match execution authority.

**Responsibilities**:
- Receiving assigned matches
- Verifying participants
- Recording match results
- Managing match execution
- Reporting match issues
- Confirming readiness
- Starting and completing match
- Monitoring notification status
- Reporting notification issues

**Does Not Define**:
- Tournament scheduling
- Competition structure changes
- Ranking calculations
- Hardware operations

#### Player

**Definition**: Participation authority for matches.

**Responsibilities**:
- Receiving match information
- Arriving and participating
- Checking in for matches
- Reporting readiness
- Receiving match readiness information
- Arriving at assigned court
- Confirming participation
- Reporting notification issues

**Does Not Define**:
- Tournament operations
- Match scheduling
- Competition rules

#### TOP System

**Definition**: Coordination and state management.

**Responsibilities**:
- Providing operational information
- Recording operational state
- Maintaining match status
- Supporting referee workflows
- Supporting player workflows
- Maintaining operational state
- Providing notification channels
- Recording readiness status
- Tracking notification delivery
- Supporting calling workflow

**Does Not Define**:
- Match scheduling algorithm
- Scoring rules
- Hardware operations
- Mobile application design
- Specific notification technology
- SMS/email provider integration

### Operational Workflow

```
Match Ready
        ↓
Calling Issued
        ↓
Player Ready
        ↓
Referee Ready
        ↓
Court Ready
        ↓
Match Start
        ↓
Result
```

### Match Calling

Match Calling is the formal process of starting a match:

1. Master initiates match calling
2. Referee receives match calling
3. TOP system updates match status
4. Match execution begins

### Check-in

Check-in confirms player presence and readiness:

1. Player arrives at venue
2. Referee verifies check-in
3. TOP system records check-in
4. Match readiness confirmed

### Result Submission

Result Submission records and confirms match outcomes:

1. Referee records match results
2. Referee validates results
3. Referee submits results
4. TOP system processes results
5. Master receives and confirms results

### State Management

**Match States**:
- Scheduled
- Match Calling
- In Progress
- Completed
- Cancelled

**Player Readiness States**:
- Notified
- Acknowledged
- Arrived
- Ready

**Referee Readiness States**:
- Notified
- Acknowledged
- Present
- Ready

**Court Readiness States**:
- Available
- Occupied
- Ready

---

## 6. Architecture Principles

### Competition Context Must Be Explicit

Competition ownership is explicit at API boundaries. Competition owns all registrations, entries, and lifecycle operations within its context. Competition context is immutable for registrations and entries.

### Entry Is Stable Participation Boundary

Entry represents the competitive unit and provides a stable interface for tournament operations. Entry decouples registration from operations and supports multiple competition formats.

### Event Owns Competition Rules

Event defines competition format, entry composition rules, and sport-specific competition behavior. Event does not own participant identity or match scheduling.

### Master Remains Operational Authority

Master maintains operational authority throughout tournament execution. Master controls calling processes, handles exceptions, and can override operational status. Master does not define scheduling algorithms or scoring rules.

### External Sources Must Not Leak Into Core Domains

All external data sources must be transformed through the Entry Ingestion Layer before entering core domains. Source-specific logic must not affect Entry, Participant, or Match domains.

### Legacy Migration Is Incremental

Legacy behavior remains functional while modern capabilities are introduced. No unnecessary rewrites; maintain backward compatibility during migration. Convert implicit workflows into explicit domains.

---

## 7. Legacy to Modern Migration

### Legacy Strengths

The legacy system provides valuable operational workflows:

- **Master Workflow**: Clear operational authority and exception handling
- **Referee Data Retrieval**: Efficient access to match and participant information
- **Manual Operational Knowledge**: Deep understanding of tournament operations

### Modernization Approach

Modern architecture converts implicit workflows into explicit domains:

**Before (Implicit)**:
- Master and Referee responsibilities mixed in legacy code
- Entry candidates not clearly separated from Entries
- External sources directly affecting core domains
- Group and Event responsibilities unclear

**After (Explicit)**:
- Clear actor boundaries (Master, Referee, Player, TOP System)
- Entry Ingestion Layer isolates external sources
- Competition structure clearly defined (Competition → Group → Event → Entry → Participant)
- Each domain has clear ownership and responsibilities

### Migration Strategy

- **Preserve Legacy Behavior**: Existing APIs and behaviors continue to work
- **Introduce Modern Capabilities**: New features added alongside legacy support
- **No Unnecessary Rewrites**: Incremental improvements over complete rewrites
- **Explicit Competition Context**: Modern routes express competition ownership explicitly
- **Preserve Transaction Boundaries**: Existing lifecycle transaction behavior remains unchanged

---

## 8. Future Domains

### Notification

- Player and referee notification management
- Notification delivery tracking
- Notification failure handling
- Multi-channel notification support

### Court Management

- Court availability tracking
- Court assignment and scheduling
- Court readiness management
- Court operation coordination

### Analytics

- Tournament performance metrics
- Participant statistics
- Match outcome analysis
- Tournament trend reporting

### AI Assistance

- AI-powered data extraction from documents
- AI-assisted result validation
- AI-powered schedule optimization suggestions
- AI-driven participant matching recommendations

### Registration Capability

- Future TOP registration platform
- User management and authentication
- Payment processing integration
- External registration workflow management

---

## 9. Scope Boundary

### Current Scope

**Tournament Operation Platform**:

- Competition organization and lifecycle management
- Entry ingestion and validation
- Schedule generation and management
- Match operations and coordination
- Referee workflow support
- Result collection and validation
- Match calling and notification
- Operational state management

### Not Currently Included

**Registration SaaS**:

- User registration workflows
- External registration platform integration
- Registration approval processes
- Registration data management

**Payment System**:

- Payment processing
- Transaction validation
- Refund handling
- Payment gateway integration

**User Management Platform**:

- Authentication and authorization
- User profile management
- Account management
- Role-based access control

### Important Notes

- Use simple business language where possible
- Avoid overly technical explanations
- Do not introduce new architecture decisions
- Only consolidate approved decisions
- Do not modify production code
- Architecture documents guide future implementation
- Production code changes should follow approved architecture

---

## Status

**Architecture Reference Document**

Consolidates approved decisions from:
- TASK-TOP-007C series
- TASK-REG-001-A
- TASK-REG-001-B
- TASK-REG-001-C
- TASK-REG-001-D
- TASK-OPS-001
- TASK-OPS-002

**Last Updated**: 2026-07-26
**Approved By**: Architecture Review Board