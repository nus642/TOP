# TASK-REG-001-D: Competition Group and Event Architecture

**Task ID:** TASK-REG-001-D  
**Title:** Competition Group and Event Architecture  
**Type:** ARCHITECTURE  
**Priority:** High  
**Dependency:** TASK-REG-001-B, TASK-REG-001-C  
**Date:** 2026-07-26  
**Status:** Architecture Definition

---

## Objective

Define the relationship between Competition, Group, Event, Entry and Participant in TOP's competition model. The goal is to establish the correct competition structure before implementation.

---

## Background

TOP is evolving from a legacy tournament tool into a multi-sport tournament operation platform. Real tournaments contain multiple competition structures that need to be properly modeled to support flexible tournament operations across different sports.

The current business language uses terms like:
- **Group examples:** Open Group, Senior Group, U10, U12, 50+
- **Event examples:** Men's Singles, Women's Singles, Men's Doubles, Women's Doubles, Mixed Doubles, Parent-child events

These terms represent different levels of competition organization that need to be properly modeled in the domain architecture.

---

## Architecture Relationship

```
Competition
    ↓
Group
    ↓
Event
    ↓
Entry
    ↓
Participant(s)
```

### Relationship Semantics

#### Competition → Group
- **One-to-many relationship**
- Competition contains multiple Groups
- Each Group represents a distinct classification or division
- Groups define participant classification and competition scope
- Competition context is immutable for groups

#### Group → Event
- **One-to-many relationship**
- Group contains multiple Events
- Each Event represents a specific competition format
- Events define the actual competition format within a Group
- Group context is immutable for events

#### Event → Entry
- **One-to-many relationship**
- Event contains multiple Entries
- Each Entry represents a competitive unit participating in the Event
- Entry belongs to Event, not directly to Competition
- Schedule generation consumes Entries under Events

#### Entry → Participant(s)
- **One-to-many relationship**
- Entry represents the competitive unit
- Participant(s) are the individuals or entities within that unit
- Entry type determines participant structure
- Participant can be individual or team

### Ownership Flow
- Competition owns Groups
- Group owns Events
- Event owns Entries
- Entry represents Participant(s)
- Participant(s) contain Player identities
- Clear ownership boundaries and responsibilities

---

   ## Domain Responsibility Boundary

   ### Competition

   **Responsible:**
   - Overall tournament definition
   - Tournament lifecycle
   - Competition ownership

   **Not Responsible:**
   - Specific event rules
   - Entry composition
   - Participant details

   ### Group

   **Responsible:**
   - Participant classification
   - Competition scope
   - Categories such as Open, Senior, U10, U12

   **Not Responsible:**
   - Match format
   - Entry members

   ### Event

   **Responsible:**
   - Competition format
   - Entry composition rules
   - Sport-specific competition definition

   **Examples:**
   - Men's Singles
   - Men's Doubles
   - Mixed Doubles

   **Not Responsible:**
   - Individual participant identity
   - Match scheduling

   ### Entry

   **Responsible:**
   - Competitive unit participating in an Event
   - Link between Event and Participant(s)

   **Examples:**
   - Individual player
   - Pair
   - Team

   **Not Responsible:**
   - Event rules
   - Schedule generation
   - Match result

   ### Participant

   **Responsible:**
   - Individual person participating in an Entry

   **Not Responsible:**
   - Competition structure
   - Event rules

   ### Rule Ownership Principle

   - Competition defines the tournament
   - Group defines participant classification
   - Event defines competition rules
   - Entry represents participation
   - Participant represents people

   ### Entry Hierarchy Principle

   Entry belongs to Event, not directly to Competition.

   This is a core principle of TOP's architecture because the future Schedule structure will be:

   ```
   Competition
     ↓
   Event
     ↓
   Confirmed Entries
     ↓
   Schedule
     ↓
   Match
   ```

   Rather than mixing all Entries under Competition.

   ---

   ## Architecture Decisions

### Decision 1: Competition contains multiple Groups

**Rationale:**
- Real tournaments have multiple divisions or categories
- Groups allow for classification of participants (age, skill level, etc.)
- Groups provide natural boundaries for competition organization
- Enables multi-tiered competition structures

**Benefits:**
- Clear separation of competition levels
- Flexible classification system
- Supports different participant demographics
- Enables tiered competition structures

**Implementation Guidance:**
- Competition entity must support multiple Groups
- Group creation must be scoped to Competition
- Group lifecycle is managed by Competition
- Group context is immutable once created

---

### Decision 2: Group defines participant classification and competition scope

**Rationale:**
- Groups provide the context for participant eligibility
- Groups define the scope of competition (age, skill, etc.)
- Groups determine which Events are available
- Groups serve as the bridge between Competition and Events

**Benefits:**
- Clear participant eligibility rules
- Organized competition structure
- Flexible classification system
- Natural grouping for participants

**Group Types:**
- **Age-based Groups:** U10, U12, U14, U16, U18, 50+, etc.
- **Skill-based Groups:** Beginner, Intermediate, Advanced, Elite
- **Category-based Groups:** Open, Senior, Junior, Master
- **Sport-specific Groups:** Men's, Women's, Mixed, Parent-child

**Implementation Guidance:**
- Group must define classification criteria
- Group must define available Events
- Group must validate participant eligibility
- Group must enforce competition scope rules

---

### Decision 3: Event defines the actual competition format

**Rationale:**
- Events represent specific competition formats
- Events are the unit of scheduling and match generation
- Events define the rules and structure of competition
- Events are independent of participant classification

**Benefits:**
- Clear competition format definition
- Flexible event types for different sports
- Natural unit for scheduling and operations
- Enables sport-specific event variations

**Event Types:**
- **Individual Events:** Singles, Doubles
- **Team Events:** Team competitions, Relay events
- **Mixed Events:** Mixed-gender, Mixed-skill
- **Special Events:** Parent-child, Partner events

**Implementation Guidance:**
- Event must define competition format
- Event must define match structure
- Event must define scoring rules
- Event must define scheduling requirements

---

### Decision 4: Entry belongs to Event, not directly to Competition

**Rationale:**
- Entry represents participation in a specific competition format
- Entry is consumed by schedule generation under Events
- Entry ownership is scoped to Event level
- This prevents Entry from being tied to participant classification

**Benefits:**
- Clear ownership boundaries
- Simplified scheduling logic
- Better separation of concerns
- More flexible competition model

**Implementation Guidance:**
- Entry creation must be scoped to Event
- Entry validation must consider Event rules
- Schedule generation operates on Event Entries
- Entry cannot exist without a valid Event

---

### Decision 5: Schedule generation consumes Entries under Events

**Rationale:**
- Schedule generation operates at Event level
- Events define the competition format and structure
- Entries represent the competitive units within Events
- This provides a clean separation between classification and format

**Benefits:**
- Clear scheduling boundaries
- Format-specific scheduling logic
- Simplified schedule generation
- Better separation of concerns

**Implementation Guidance:**
- Schedule generation must consume Event Entries
- Schedule generation must respect Event rules
- Schedule generation must consider Entry types
- Schedule generation must support Event-specific formats

---

### Decision 6: Entry should not contain rules that belong to Event

**Rationale:**
- Entry represents participation, not competition format
- Event defines the competition format and rules
- Entry should be lightweight and focused on participation
- This prevents Entry from becoming too complex

**Benefits:**
- Clear separation of concerns
- Lightweight Entry abstraction
- Event-focused rule management
- Better maintainability

**Implementation Guidance:**
- Entry should not contain competition format rules
- Entry should not contain match structure rules
- Entry should not contain scoring rules
- Entry should focus on participation context

---

## Domain Terminology

### Competition
**Definition:** A complete tournament or competition event.

**Characteristics:**
- Represents the highest level of competition organization
- Contains multiple Groups
- Owns all Groups within its context
- Defines overall competition rules and constraints
- Immutable competition context

**Examples:**
- National Tennis Championship
- City Badminton Tournament
- Regional Swimming Competition

### Group
**Definition:** A classification or division within a Competition.

**Characteristics:**
- Defines participant classification (age, skill, category)
- Defines competition scope and eligibility
- Contains multiple Events
- Owns all Events within its context
- Immutable group context

**Examples:**
- Open Group
- Senior Group
- U10
- U12
- 50+
- Beginner
- Intermediate
- Advanced
- Elite

### Event
**Definition:** A specific competition format within a Group.

**Characteristics:**
- Defines the actual competition format
- Defines match structure and rules
- Contains multiple Entries
- Owns all Entries within its context
- Defines scheduling requirements
- Immutable event context

**Examples:**
- Men's Singles
- Women's Singles
- Men's Doubles
- Women's Doubles
- Mixed Doubles
- Parent-child events
- Team competitions
- Relay events

### Entry
**Definition:** A competitive unit participating in an Event.

**Characteristics:**
- Represents participation in a specific Event
- Belongs to Event, not directly to Competition
- Contains Participant(s)
- Consumed by schedule generation
- Lightweight and focused on participation

**Examples:**
- Individual player participation
- Team participation
- Doubles pair participation
- Mixed pair participation

### Participant
**Definition:** An individual or entity within an Entry.

**Characteristics:**
- Represents the actual competitor
- Can be individual or team
- Contains Player identity
- Part of Entry
- Subject to Entry validation

**Examples:**
- Individual player
- Team member
- Team captain
- Doubles partner

---

## Multi-Sport Extensibility Considerations

### Generalization Strategy

**Competition Structure:**
- Competition is sport-agnostic
- Groups are sport-agnostic
- Events are sport-agnostic
- Entry is sport-agnostic
- Participant is sport-agnostic

**Sport-Specific Extensions:**
- Sport-specific Group types (e.g., U10 for tennis, U10 for swimming)
- Sport-specific Event types (e.g., Singles for tennis, Singles for swimming)
- Sport-specific Event rules (e.g., tennis scoring vs. swimming timing)
- Sport-specific scheduling requirements

### Extensibility Points

**1. Group Classification:**
- Sport-specific classification criteria
- Sport-specific eligibility rules
- Sport-specific group types

**2. Event Formats:**
- Sport-specific event types
- Sport-specific match structures
- Sport-specific scoring rules

**3. Entry Types:**
- Sport-specific entry types
- Sport-specific participant compositions
- Sport-specific validation rules

**4. Scheduling:**
- Sport-specific scheduling algorithms
- Sport-specific court/field requirements
- Sport-specific time constraints

### Design Principles for Multi-Sport Support

1. **Sport-Agnostic Core:**
   - Core domain model is sport-agnostic
   - Sport-specific logic is externalized
   - Core relationships are generalizable

2. **Configuration-Driven:**
   - Sport-specific rules are configuration-based
   - Sport-specific types are extensible
   - Sport-specific behaviors are pluggable

3. **Separation of Concerns:**
   - Core domain model is separate from sport logic
   - Sport logic is isolated in sport-specific modules
   - Core operations are independent of sport

4. **Extensibility-First:**
   - Design for future sport additions
   - Support sport-specific variations
   - Enable sport-specific extensions

---

## Scope Included

### Domain Model
- **Competition:** Definition and ownership model
- **Group:** Definition, types, and relationship to Competition
- **Event:** Definition, types, and relationship to Group
- **Entry:** Definition, types, and relationship to Event
- **Participant:** Definition and relationship to Entry

### Relationships
- Competition → Group relationship
- Group → Event relationship
- Event → Entry relationship
- Entry → Participant relationship
- Clear ownership boundaries and responsibilities

### Domain Terminology
- Competition definition and characteristics
- Group definition, types, and examples
- Event definition, types, and examples
- Entry definition and characteristics
- Participant definition and characteristics

### Multi-Sport Support
- Generalization strategy for multi-sport support
- Extensibility points for sport-specific variations
- Design principles for sport-agnostic core
- Configuration-driven approach for sport-specific logic

### Architecture Decisions
- Competition contains multiple Groups
- Group defines participant classification and competition scope
- Event defines the actual competition format
- Entry belongs to Event, not directly to Competition
- Schedule generation consumes Entries under Events
- Entry should not contain rules that belong to Event

---

## Scope Excluded

### Database Schema Design
- No database schema design
- No database migrations
- No data migration scripts
- No database optimization or indexing strategies
- No database table definitions

### Schedule Algorithm
- No schedule generation algorithms
- No schedule generation logic
- No schedule generation workflows
- No schedule generation APIs
- No scheduling algorithms

### Match Generation
- No match generation algorithms
- No match generation logic
- No match generation workflows
- No match generation APIs
- No match execution workflows

### Ranking
- No ranking calculation algorithms
- No ranking tables and leaderboards
- No ranking updates and refresh logic
- No ranking display and presentation

### Scoring Rules
- No scoring rule definitions
- No scoring rule implementations
- No scoring rule validation
- No scoring rule enforcement

### Frontend Design
- No UI/UX improvements
- No frontend component redesign
- No user interface changes
- No frontend framework updates
- No frontend implementation

### Rule Engine Implementation
- No rule engine implementation
- No rule engine architecture
- No rule engine APIs
- No rule engine integration

### Production Code
- No production code modified
- No code implementation
- No code testing
- No code deployment
- No code integration

---

## Acceptance Criteria

### Competition and Group Relationship
- [ ] Competition contains multiple Groups
- [ ] Group defines participant classification
- [ ] Group defines competition scope
- [ ] Group lifecycle is managed by Competition
- [ ] Competition context is immutable for Groups

### Group and Event Relationship
- [ ] Group contains multiple Events
- [ ] Event defines competition format
- [ ] Event defines match structure
- [ ] Event defines scoring rules
- [ ] Group context is immutable for Events

### Event and Entry Relationship
- [ ] Event contains multiple Entries
- [ ] Entry belongs to Event
- [ ] Entry does not belong directly to Competition
- [ ] Entry validation considers Event rules
- [ ] Schedule generation consumes Event Entries

### Entry and Participant Relationship
- [ ] Entry represents competitive unit
- [ ] Entry contains Participant(s)
- [ ] Participant can be individual or team
- [ ] Participant contains Player identity
- [ ] Entry type determines participant structure

### Multi-Sport Extensibility
- [ ] Core domain model is sport-agnostic
- [ ] Sport-specific logic is externalized
- [ ] Extensibility points are defined
- [ ] Configuration-driven approach is documented
- [ ] Design principles for multi-sport support are clear

### Domain Terminology
- [ ] Competition definition is clear
- [ ] Group definition and types are documented
- [ ] Event definition and types are documented
- [ ] Entry definition is clear
- [ ] Participant definition is clear

### Architecture Decisions
- [ ] Competition contains multiple Groups decision is documented
- [ ] Group defines participant classification decision is documented
- [ ] Event defines competition format decision is documented
- [ ] Entry belongs to Event decision is documented
- [ ] Schedule generation consumes Entries decision is documented
- [ ] Entry should not contain Event rules decision is documented

---

## Implementation Guidance

### For Future Codex Implementation

#### Preserve Group and Event Separation
- Maintain clear separation between Group and Event
- Group defines classification and scope
- Event defines competition format
- Do not mix Group and Event responsibilities

#### Avoid Hard-Coded Sport-Specific Logic
- Keep core domain model sport-agnostic
- Externalize sport-specific logic
- Use configuration for sport-specific rules
- Support sport-specific extensions through configuration

#### Keep Entry as Competition Participation Boundary
- Entry represents participation in Event
- Entry is scoped to Event level
- Entry does not contain Event rules
- Entry is lightweight and focused on participation

#### Keep Scheduling Dependent on Event Entries
- Schedule generation operates on Event Entries
- Schedule generation respects Event rules
- Schedule generation considers Entry types
- Schedule generation supports Event-specific formats

#### Respect Hierarchy and Ownership
- Competition owns Groups
- Group owns Events
- Event owns Entries
- Entry represents Participant(s)
- Maintain clear ownership boundaries

#### Design for Multi-Sport Support
- Design sport-agnostic core model
- Define extensibility points
- Use configuration-driven approach
- Support sport-specific variations

---

## Success Criteria

### Architecture Completeness
- Competition/Group/Event/Entry hierarchy is documented
- Group and Event responsibilities are separated
- Entry ownership is clarified
- Domain terminology is comprehensive
- Multi-sport support is considered

### Design Quality
- Clear separation of concerns
- Well-defined relationships
- Clear ownership boundaries
- Extensible design
- Maintainable architecture

### Documentation Quality
- All concepts are documented
- All relationships are defined
- All decisions are documented
- All examples are provided
- All use cases are covered

### Future-Readiness
- Architecture supports multi-sport extensibility
- Architecture supports future competition formats
- Architecture supports future event types
- Architecture supports future scheduling requirements
- Architecture is maintainable and extensible

---

## Status

**Architecture Definition Complete**

This architecture document defines the Competition Group and Event architecture for TASK-REG-001-D. The relationships, ownership boundaries, and multi-sport extensibility considerations are fully specified to guide future implementation.

### Next Steps
1. Review and approve this architecture definition
2. Implement domain model based on approved decisions
3. Create database schema based on domain model
4. Implement API endpoints based on domain model
5. Integrate with existing Entry foundation (TASK-REG-001-B)
6. Integrate with existing Participant model (TASK-REG-001-C)

### Success Indicators
- Competition/Group/Event/Entry hierarchy is correctly implemented
- Group and Event responsibilities are properly separated
- Entry ownership is scoped to Event level
- Multi-sport support is designed into the architecture
- No production code is modified
- Architecture is extensible for future sports and formats