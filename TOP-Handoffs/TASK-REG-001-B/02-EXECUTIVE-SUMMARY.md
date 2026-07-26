# Architecture Decision Summary: Competition Entry Foundation

**Task ID:** TASK-REG-001-B  
**Date:** 2026-07-26  
**Status:** Approved

---

## Architecture Decision

**TOP uses Entry as the stable representation of competitive participation.**

Entry serves as the core abstraction that bridges the gap between external registration sources and internal tournament operations. This decision establishes Entry as the stable integration point that provides a consistent interface for schedule generation, match execution, and result processing, regardless of the underlying registration mechanism.

### Rationale

- **Decouples registration from operations**: Entry abstracts the competitive unit from registration details, allowing independent evolution of registration processes and tournament operations
- **Format flexibility**: Supports multiple competition types through Entry types without architectural changes
- **Validation early**: Entries are validated before being consumed by operations, ensuring only valid, complete entries participate
- **Ownership clarity**: Competition owns Entry lifecycle, providing clear boundaries and responsibilities

---

## Entry Boundary Decision

### Core Concept

**Entry represents the unit that participates in Competition.**

An Entry is the competitive unit that enters a competition. It abstracts the actual participants (individuals or teams) and provides a stable interface for tournament operations.

### Boundary Definition

**Entry separates external registration sources from tournament operations.**

- **External Registration Source**: Provides participant data through various integration points (APIs, web forms, file uploads, etc.)
- **Competition**: Owns the Entry lifecycle and defines competition-specific rules
- **Entry**: The stable representation of competitive participation
- **Schedule and Match Domains**: Consume Entries, not raw Players, ensuring consistent operations

### Benefits

- **Stable Interface**: Schedule and Match domains operate on Entry abstraction, not registration details
- **Format Agnostic**: Different competition formats (individual, team, mixed) use the same Entry interface
- **Validation Centralized**: All validation occurs at Entry level before operations consume it
- **Independent Evolution**: Registration systems can evolve without affecting tournament operations

---

## Relationship Decision

### Domain Flow

```
External Registration Source
        ↓
Competition
        ↓
Entry
        ↓
Participant(s)
```

### Relationship Semantics

#### External Registration Source → Competition
- **One-to-many relationship**
- External systems provide registration data
- Competition defines registration rules and constraints
- Competition context is immutable for registrations

#### Competition → Entry
- **One-to-many relationship**
- Competition owns all entries within its context
- Entry represents the competitive unit
- Entry is created from registration data upon validation

#### Entry → Participant(s)
- **One-to-many relationship**
- Entry represents the competitive unit
- Participant(s) are the individuals or entities within that unit
- Participant can be individual or team
- Entry type determines participant structure

### Ownership Flow

- Competition owns Entry lifecycle
- Entry represents Participant(s)
- Participant(s) contain Player identities
- Clear ownership boundaries and responsibilities

---

## Entry Types

### Current Entry Types

#### IndividualEntry
- Represents a single player's participation in a competition
- Used in individual sports (tennis, badminton, table tennis)
- Contains exactly one Participant
- Participant is an individual type
- Direct mapping from registration to entry

#### TeamEntry
- Represents a team's participation in a competition
- Used in team sports (volleyball, basketball, soccer)
- Contains multiple Participants
- Participant composition is defined by competition rules
- Team has collective identity

### Future Extensions

#### PairEntry
- Represents a pair of participants competing together
- Used in doubles competitions
- Two participants with shared competitive identity
- Potential for mixed doubles (individual + individual)

#### Other Formats
- **GroupEntry**: Multiple entries competing as a unit
- **LeagueEntry**: Season-long participation unit
- **WildcardEntry**: Special entry type with relaxed rules
- **ByeEntry**: Automatic advancement without competition

---

## Player / Participant / Entry Boundary

### Player

**Long-lived identity**

- Represents a person's persistent identity across competitions
- Contains personal information (name, contact, preferences)
- Exists independently of any competition
- Can participate in multiple competitions over time
- Used as the fundamental identity in the system

### Participant

**Competition-specific role**

- Represents a person's role within a specific competition
- Can be individual or team-based
- Exists only within the context of a competition
- Can be created or removed based on competition rules
- Represents the actual entity competing in matches

### Entry

**Competitive unit entering Competition**

- Represents the unit that participates in Competition
- Abstracts the competitive unit from registration details
- Provides stable interface for tournament operations
- Exists only within the context of a competition
- Can contain multiple Participants (for team entries)

### Boundary Summary

```
Player (Long-lived identity)
    ↓
Participant (Competition-specific role)
    ↓
Entry (Competitive unit)
    ↓
Match/Competition (Operational context)
```

---

## Validation Boundary

### TOP Validates

**Operational consistency**

- Entry type validation (IndividualEntry, TeamEntry)
- Participant count and composition
- Participant eligibility
- Competition context validation
- Data integrity and format
- Entry lifecycle state transitions

### TOP Does Not Own

**External system responsibilities**

- **Payment processing**: Payment gateways, transaction validation, refunds
- **External registration approval**: Third-party approval workflows, verification processes
- **User management**: Authentication, authorization, user profiles, account management
- **Registration data sources**: External API integrations, data synchronization
- **Competition rules enforcement**: Sport federation rules, league regulations

### Validation Principles

- **Early validation**: Entries are validated before being consumed by operations
- **Competition ownership**: Competition defines validation rules
- **Clear boundaries**: TOP validates operational consistency, not business rules
- **Error handling**: Clear error messages with remediation guidance
- **State management**: Validation states (Pending, Valid, Invalid) tracked throughout lifecycle

---

## Schedule Dependency

### Confirmed Entries as Input

**Entries become input for scheduling.**

- Schedule generation consumes validated Entries
- Schedule operates at Entry level, not Player level
- Entry abstraction supports flexible scheduling algorithms
- Schedule generation respects Entry constraints (team size, participant types)
- Schedule results are based on Entry identities, not registration details

### Schedule-Entry Relationship

- **Entry → Schedule**: Entries are the primary input for schedule generation
- **Schedule → Entry**: Schedule operations reference Entries by stable identity
- **Validation prerequisite**: Only validated Entries can be scheduled
- **Immutable context**: Entry context is immutable once scheduled
- **Flexible formats**: Different Entry types support different scheduling patterns

---

## Scope Boundary

### Included

**Core Entry Foundation**

- **Entry abstraction**: Stable integration point for tournament operations
- **Entry types**: IndividualEntry and TeamEntry (with extensibility defined)
- **Ownership model**: Competition owns Entry lifecycle
- **Relationship definitions**: Clear domain relationships (Entry → Participant)
- **Validation principles**: Multi-stage validation framework
- **Participant boundary**: Clear separation between Player, Participant, and Entry
- **Integration boundary**: Entry as the interface between registration and operations

### Excluded

**External system responsibilities**

- **Registration system**: API design, workflow implementation, data sources
- **Payment processing**: Payment gateways, transaction validation, refunds
- **Scheduling algorithm**: Schedule generation logic, algorithms, workflows
- **Match generation**: Match creation, match scheduling, match workflows
- **Ranking system**: Ranking calculation, ranking tables, ranking updates
- **Frontend implementation**: UI/UX design, frontend components, APIs
- **Database schema**: Database design, migrations, optimization
- **External system integration**: Registration API protocols, data formats

---

## Implementation Guidance

### Preserve

**Core architectural principles**

- **Entry as integration boundary**: Entry is the stable interface between registration and operations
- **Competition ownership**: Competition owns Entry lifecycle and validation rules
- **Incremental implementation**: Implement Entry foundation first, then extend with Entry types
- **Format flexibility**: Design for extensibility to support future Entry types
- **Validation early**: Implement validation framework before operations consume Entries

### Do Not Modify

**Production code**

- **Do not modify existing production code**: This document defines architecture only
- **Do not implement registration system**: Focus on Entry abstraction, not registration details
- **Do not implement payment processing**: Payment is outside TOP's scope
- **Do not implement scheduling algorithm**: Schedule generation is outside this task's scope
- **Do not modify existing domain models**: Build on existing architecture, don't replace it

### Implementation Approach

1. **Define Entry abstraction**: Create Entry concept with stable interface
2. **Implement Entry types**: Create IndividualEntry and TeamEntry implementations
3. **Implement validation framework**: Build multi-stage validation process
4. **Define relationships**: Document Entry-Participant relationship clearly
5. **Establish ownership model**: Define Competition ownership of Entry lifecycle
6. **Create integration boundary**: Entry as the interface between registration and operations
7. **Document extensibility**: Define how to add future Entry types (PairEntry, etc.)

---

## Success Criteria

### Architecture Completeness
- [x] Entry concept is clearly defined
- [x] Entry abstraction is documented
- [x] Entry serves as stable integration point
- [x] Entry decouples registration from operations
- [x] Entry abstraction is format-agnostic

### Boundary Clarity
- [x] Entry-Participant relationship is defined
- [x] One-to-many relationship is documented
- [x] Participant types are defined
- [x] Participant structure is documented
- [x] Player/Participant/Entry boundaries are clear

### Validation Framework
- [x] Entry validation framework is defined
- [x] Validation stages are documented
- [x] Validation rules are defined for each entry type
- [x] Validation error handling is documented
- [x] Validation lifecycle is defined

### Scope Boundaries
- [x] Entry abstraction is included in scope
- [x] Ownership model is included in scope
- [x] Relationships are included in scope
- [x] Validation principles are included in scope
- [x] Registration system is excluded from scope
- [x] Payment is excluded from scope
- [x] Scheduling algorithm is excluded from scope
- [x] Match generation is excluded from scope
- [x] Ranking is excluded from scope

### Implementation Guidance
- [x] Entry as integration boundary is preserved
- [x] Competition ownership is preserved
- [x] Incremental implementation approach is defined
- [x] Production code modification is prohibited

---

## Approval

**Approved by:** Architecture Review Board  
**Date:** 2026-07-26  
**Next Review:** Upon implementation completion

---

## References

- TASK-REG-001-A: Competition Foundation Architecture
- TASK-REG-001-B: Competition Entry Foundation Architecture
- TOP-Modern-Domain-Architecture.md: Overall domain architecture