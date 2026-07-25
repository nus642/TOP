# Executive Summary: Competition Participation Domain Model Architecture

**Task:** TASK-REG-001-A  
**Date:** 2026-07-25  
**Status:** Architecture Decision Recorded

---

## Architecture Decision

### Context
TOP is a multi-sport tournament platform that requires a flexible, extensible domain model for managing competitive participation across different sports and competition formats.

### Core Decision
**Competition Participation is the core domain for TOP Phase 1.** This means competition participation (via Entries) is the primary focus for the initial phase, with Registration serving as an upstream source of Entries. External registration platforms are supported, and future TOP Registration capability may be added later.

### Ownership Model
**Competition owns Registration lifecycle.** The competition entity is responsible for:
- Defining registration rules and constraints
- Validating registration context
- Managing registration lifecycle transitions
- Enforcing competition-specific validation rules

This ownership model ensures that registration behavior is tightly coupled to the competition's rules and structure, providing clear boundaries and reducing cross-domain dependencies.

---

## Entry Abstraction Decision

### Core Concept
**Entry represents the competitive unit.** An Entry is the abstraction that represents what is actually competing in a match or event. This abstraction decouples the registration process from the actual competition format.

### Key Design Principles

1. **Registration does not directly own Player**
   - Registration operates through Entry and Participant
   - This separation allows for more flexible competition models
   - Prevents tight coupling between registration and individual identity

2. **Entry allows different competition formats**
   - Single-player competitions
   - Team competitions
   - Mixed competitions
   - Future extensibility for specialized formats

### Entry Types

#### IndividualEntry
- Represents a single player's participation
- Used in individual sports (tennis, badminton, etc.)
- Direct mapping from Registration to Entry
- One Entry per Registration for individual competitions

#### TeamEntry
- Represents a team's participation
- Used in team sports (volleyball, basketball, etc.)
- Contains multiple Participants (team members)
- One Entry per Registration for team competitions

#### Future Extensibility
The Entry abstraction is designed to support additional formats:
- **PairEntry:** Doubles competitions (tennis, badminton)
- **MixedEntry:** Mixed-gender or mixed-skill competitions
- **SpecializedEntry:** Sport-specific formats (e.g., relay teams in swimming)

This extensibility ensures the domain model can accommodate future competition formats without requiring architectural changes.

---

## Domain Relationship Decision

### Hierarchy
```
Competition
  |
Registration
  |
Entry
  |
Participant(s)
```

### Relationship Semantics

1. **Competition → Registration**
   - One-to-many relationship
   - Competition owns all registrations within its context
   - Registration cannot exist without a valid competition context
   - Competition context is immutable for a registration

2. **Registration → Entry**
   - One-to-one relationship
   - Registration represents the intent to participate
   - Entry represents the actual competitive unit
   - Entry is created from Registration upon validation

3. **Entry → Participant(s)**
   - One-to-many relationship
   - Entry represents the competitive unit
   - Participant(s) are the individuals or entities within that unit
   - Participant can be individual or team

### Ownership Flow
- Competition owns Registration
- Registration represents Entry
- Entry represents Participant(s)
- Participant can be individual or team

This clear hierarchy ensures that each entity has a well-defined responsibility and ownership boundary.

---

## Player vs Participant Decision

### Player
**Player represents long-lived identity.**
- Represents an individual person
- Exists independently of any competition
- Can participate in multiple competitions over time
- Is part of the Participant entity

### Participant
**Participant represents competition-specific participation context.**
- Represents an individual or team within a specific competition
- Exists only within the context of a competition
- Can have multiple registrations across different competitions
- Is part of the Entry entity

### Registration Operation Flow
1. **Registration** represents the intent to participate
2. **Entry** represents the competitive unit (IndividualEntry or TeamEntry)
3. **Participant(s)** represent the actual individuals within that unit
4. **Player** is the long-lived identity that may be part of multiple Participants

### Key Distinction
- **Player:** Identity (persists across competitions)
- **Participant:** Participation context (exists within a competition)
- **Registration:** Intent to participate (transient, tied to competition)
- **Entry:** Competitive unit (abstract representation)

This separation ensures that player identity is preserved across competitions while allowing for flexible participation models within each competition.

---

## Schedule Dependency Decision

### Core Principle
**Future schedule generation consumes confirmed eligible Entries, not raw Players.**

### Rationale
1. **Abstraction Layer**
   - Schedule generation operates at the Entry level
   - This provides a clean separation between registration and scheduling
   - Allows for different scheduling strategies based on Entry type

2. **Format Flexibility**
   - IndividualEntry scheduling can use player-based algorithms
   - TeamEntry scheduling can use team-based algorithms
   - Mixed formats can use hybrid approaches

3. **Validation Early**
   - Entries are validated before being consumed by schedule generation
   - Only confirmed, eligible Entries are considered
   - This reduces complexity in the scheduling algorithm

### Implementation Path
1. **Registration** creates a Registration entity
2. **Entry** is created from Registration upon validation
3. **Schedule Generation** consumes confirmed Entries
4. **Matches** are generated based on Entry type and competition rules

This approach ensures that schedule generation has a clean, validated set of Entries to work with, rather than raw Player data.

---

## Scope Boundary

### Included Scope

#### Domain Model
- **Competition:** Ownership model and lifecycle management
- **Registration:** First-class domain entity with lifecycle states
- **Entry:** Abstraction with IndividualEntry and TeamEntry types
- **Participant:** Competition-specific participation context
- **Player:** Long-lived identity entity

#### Ownership Rules
- Competition owns Registration lifecycle
- Registration represents Entry
- Entry represents Participant(s)
- Clear ownership boundaries and responsibilities

#### Relationship Definitions
- Competition → Registration → Entry → Participant(s) hierarchy
- One-to-many and one-to-one relationship semantics
- Immutable competition context for registrations

### Excluded Scope

#### API Implementation
- No API endpoint definitions
- No API contract specifications
- No request/response structures
- No API versioning strategy

#### Database Schema
- No database schema design
- No database migrations
- No data migration scripts
- No database optimization or indexing strategies

#### Match Generation
- No match generation algorithms
- No schedule generation logic
- No match scheduling rules
- No match execution workflows

#### Ranking
- No ranking calculation algorithms
- No ranking tables and leaderboards
- No ranking updates and refresh logic
- No ranking display and presentation

#### Frontend
- No UI/UX improvements
- No frontend component redesign
- No user interface changes
- No frontend framework updates

#### Payment
- No payment processing
- No payment integration
- No payment validation
- No refund handling

---

## Implementation Guidance

### For Future Codex Implementation

#### Preserve Domain Boundaries
- Maintain clear separation between Registration and Player
- Keep Entry abstraction as a first-class concept
- Respect ownership hierarchy (Competition → Registration → Entry → Participant)

#### Do Not Introduce Direct Registration → Player Dependency
- Registration operates through Entry and Participant
- Player is part of Participant entity
- Avoid tight coupling between registration and individual identity

#### Avoid Premature Schema Design
- Focus on domain model and relationships first
- Database schema should emerge from domain model
- Do not design for specific database technologies
- Allow flexibility for future data storage solutions

#### Implement Incrementally After Architecture Approval
1. Define Competition ownership model
2. Define Registration entity structure
3. Define Entry abstraction (IndividualEntry and TeamEntry)
4. Define Participant relationships
5. Implement domain validation rules
6. Document domain model

#### Test Domain Model Independently
- Unit tests for domain entities
- Integration tests for domain relationships
- Validation tests for domain invariants
- State machine tests for lifecycle transitions

---

## Status

**Architecture Decision Recorded**

This executive summary documents the approved Registration Domain Model architecture for TASK-REG-001-A. The decisions establish clear boundaries, ownership models, and relationships that will guide future implementation.

### Next Steps
1. Review and approve this architecture decision
2. Implement domain model based on approved decisions
3. Create database schema based on domain model
4. Implement API endpoints based on domain model
5. Integrate with existing competition context isolation (TASK-TOP-007C-3)

### Success Criteria
- Domain relationships are correctly implemented
- Entry abstraction supports individual and team competitions
- Competition ownership model is enforced
- No direct Registration → Player dependency exists
- Domain boundaries are preserved
- Future schedule generation can consume Entries