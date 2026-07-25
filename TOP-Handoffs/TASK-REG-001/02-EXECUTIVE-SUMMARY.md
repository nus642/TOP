# Architecture Decision Summary

**Task:** TASK-REG-001  
**Status:** Architecture Approved - Ready for Implementation Planning  
**Date:** 2026-07-25  
**Context:** Built upon TASK-TOP-007C-3 (competition context isolation and modern schedule lifecycle)

---

## 1. Architecture Decision

### Registration as a First-Class Domain Entity

**Decision:** Registration is established as a first-class domain entity within the competition domain, with explicit ownership and lifecycle management.

**Rationale:**
- Registration is a core concept in competition management, representing the binding relationship between participants and competitions
- Treating registration as a first-class entity enables clear ownership semantics and lifecycle management
- Provides foundation for future match generation and schedule execution
- Aligns with modern domain-driven design principles

### Competition Ownership of Registration Lifecycle

**Decision:** Competition owns the complete registration lifecycle for its participants.

**Rationale:**
- Competition context is already isolated (TASK-TOP-007C-3), making it the natural owner of registrations within that context
- Centralized ownership simplifies validation, authorization, and lifecycle transitions
- Enables competition-specific registration rules and constraints
- Provides clear boundaries for registration operations

### Explicit Competition Context

**Decision:** Registration must have explicit competition context, not implicit or derived.

**Rationale:**
- Explicit context prevents ambiguity in multi-competition scenarios
- Enables clear validation of registration against competition rules
- Facilitates audit trails and debugging
- Supports future extensibility (e.g., cross-competition registration workflows)

### Preserve Incremental Migration Approach

**Decision:** Maintain backward compatibility with existing registration behavior while introducing modern registration capabilities incrementally.

**Rationale:**
- Existing systems and users depend on current registration behavior
- Incremental migration reduces risk and enables gradual adoption
- Allows validation of modern approach before full replacement
- Facilitates rollback if issues arise

---

## 2. Domain Decision

### Registration as Competition-Owned Domain

**Decision:** Registration is competition-owned, with Entry abstraction representing the competitive unit, and Player not directly owned by Registration.

**Key Concepts:**
- **Competition:** The entity that owns registrations and defines registration rules
- **Registration:** The entity that represents a participant's participation in a competition
- **Entry:** The abstraction representing the competitive unit (IndividualEntry or TeamEntry)
- **Participant:** The entity being registered (individual or team)
- **Player:** The individual participant, not directly owned by Registration

**Ownership Model:**
- Competition owns all registrations within its context
- Registration cannot exist without a valid competition context
- Competition context is immutable for a registration (cannot change competitions)
- Participant can have multiple registrations across different competitions
- Entry abstraction supports both IndividualEntry and TeamEntry concepts

**Entry Abstraction:**
- **IndividualEntry:** Represents a single player's participation
- **TeamEntry:** Represents a team's participation with multiple players
- Entry provides a unified interface for competitive units
- Entry abstraction enables future schedule generation to consume confirmed entries

**Relationship Hierarchy:**
```
Competition
  |
Registration
  |
Entry
  |
Participant(s)
```

**Future Dependency:**
- Match generation depends on stable registration ownership
- Schedule execution relies on registration data for participant availability
- Ranking calculations require accurate registration status
- Pairing algorithms need registration context for valid matches
- Future schedule generation consumes confirmed Entries

**Domain Boundaries:**
- Registration domain is self-contained within competition context
- No cross-domain dependencies for core registration operations
- Clear separation from match generation and ranking domains
- Entry abstraction provides foundation for schedule generation

---

## 3. Lifecycle Decision

### Minimal Registration Lifecycle

**Decision:** Define a minimal, extensible registration lifecycle with the following states:

**States:**
1. **PENDING** - Registration created, awaiting confirmation
2. **CONFIRMED** - Registration accepted and active
3. **WITHDRAWN** - Registration cancelled by participant or competition

**State Transitions:**
```
PENDING → CONFIRMED (by participant or competition)
PENDING → WITHDRAWN (by participant or competition)
CONFIRMED → WITHDRAWN (by participant or competition)
```

**Lifecycle Characteristics:**
- **Minimal:** Only essential states to support core registration functionality
- **Extensible:** Additional states can be added without breaking existing transitions
- **Clear:** Each state has well-defined meaning and valid transitions
- **Immutable:** Once a registration reaches a terminal state (WITHDRAWN), it cannot be reactivated

**Extensibility Strategy:**
- Future states can be added (e.g., APPROVED, REJECTED, WAITLISTED)
- Additional transitions can be defined as needed
- State machine should be configurable and not hardcoded
- Lifecycle hooks can be added for notifications and auditing

**Use Cases:**
- **PENDING:** New registrations awaiting approval or payment
- **CONFIRMED:** Active participants in the competition
- **WITHDRAWN:** Cancelled registrations (for historical tracking)

---

## 4. API Decision

### No Final Endpoint Definitions Yet

**Decision:** Do not define final API endpoints at this stage. Focus on domain model and ownership before API surface design.

**Rationale:**
- API design should follow from confirmed domain model
- Premature endpoint decisions can lead to refactoring
- Domain ownership model is still being finalized
- API surface should reflect business capabilities, not technical implementation

**Approach:**
- Define API contracts based on domain operations (e.g., create registration, update status)
- Use domain-driven design to identify API capabilities
- Leave endpoint paths and HTTP methods to be defined later
- Focus on request/response structures and validation rules

**Guiding Principles:**
- API design follows domain ownership (competition owns registrations)
- Operations are grouped by domain entity
- Validation is enforced at domain level
- Error handling is consistent with domain rules

**Next Steps:**
- Finalize domain model and ownership model
- Define API capabilities based on domain operations
- Design request/response structures
- Define endpoint paths and HTTP methods
- Document API contracts

---

## 5. Migration Decision

### Legacy Behavior Preservation

**Decision:** Maintain existing registration behavior while introducing modern registration capabilities incrementally.

**Strategy:**
- **Legacy Mode:** Existing registration functionality continues to work as before
- **Modern Mode:** New registration capabilities are introduced alongside legacy behavior
- **Gradual Migration:** Modern capabilities are adopted incrementally based on validation and feedback
- **Feature Flags:** Enable/disable modern features based on readiness and requirements

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

**Migration Approach:**
1. **Phase 1:** Introduce modern registration domain alongside legacy
2. **Phase 2:** Validate modern approach with limited scope
3. **Phase 3:** Gradually migrate to modern registration
4. **Phase 4:** Deprecate legacy registration (if needed)

**Rollback Strategy:**
- Legacy behavior remains functional throughout migration
- Feature flags enable quick rollback if issues arise
- Data migration is reversible if needed
- Comprehensive testing ensures safe migration

---

## 6. Scope Boundary

### Included Scope

**Registration Domain:**
- Registration entity definition and ownership model
- Registration lifecycle and state management
- Registration validation rules and constraints
- Registration data structures and relationships

**Ownership Model:**
- Competition ownership of registrations
- Participant registration relationships
- Context isolation and validation
- Authorization and access control

**Lifecycle Definition:**
- Registration states and transitions
- State machine implementation
- Lifecycle hooks and notifications
- Extensibility mechanisms

**API Planning:**
- API capabilities based on domain operations
- Request/response structures
- Validation and error handling
- API versioning strategy

**Regression Strategy:**
- Legacy behavior preservation
- Comprehensive test coverage
- Migration approach and rollback plan
- Validation and verification procedures

### Excluded Scope

**Match Generation:**
- Match generation algorithms
- Schedule generation logic
- Match scheduling rules
- Match execution workflows

**Ranking:**
- Ranking calculation algorithms
- Ranking tables and leaderboards
- Ranking updates and refresh
- Ranking display and presentation

**Pairing Algorithm:**
- Pairing algorithms for matches
- Random pairing logic
- Skill-based pairing
- Pairing optimization

**Frontend Redesign:**
- UI/UX improvements
- Frontend component redesign
- User interface changes
- Frontend framework updates

**Payment:**
- Payment processing
- Payment integration
- Payment validation
- Refund handling

**Database Redesign:**
- Schema changes (unless required by domain model)
- Database migrations
- Data migration scripts
- Database optimization

---

## 7. Implementation Guidance

### For Codex

**Do Not Redesign Unrelated Competition Modules:**
- Focus exclusively on registration domain
- Do not modify match generation, ranking, or pairing modules
- Do not touch frontend unless registration-specific changes are needed
- Do not alter database schema unless required by registration domain

**Preserve Existing Behavior:**
- Maintain backward compatibility with current registration flows
- Keep existing validation rules where applicable
- Do not break existing user workflows
- Ensure legacy registration continues to work

**Keep Changes Incremental:**
- Introduce modern registration capabilities alongside legacy
- Use feature flags to control new functionality
- Validate each increment before proceeding
- Test thoroughly at each step

**Wait for Domain Decisions Before Implementation:**
- Do not implement API endpoints until domain model is finalized
- Do not design database schema until ownership model is confirmed
- Do not create frontend components until API contracts are defined
- Wait for architecture approval before coding

**Implementation Order:**
1. Define registration domain entity and ownership model
2. Implement registration lifecycle and state machine
3. Add registration validation rules
4. Create modern registration API capabilities
5. Add comprehensive tests for new functionality
6. Validate legacy behavior preservation
7. Document migration approach and rollback strategy

**Testing Requirements:**
- Unit tests for registration domain logic
- Integration tests for registration API
- Regression tests for existing functionality
- Migration tests for new capabilities
- End-to-end tests for critical registration flows

**Documentation Requirements:**
- Domain model documentation
- API contract documentation
- Migration guide
- Testing strategy
- Rollback procedures

---

## Status

**Architecture Approved - Ready for Implementation Planning**

This architecture decision summary provides the foundation for TASK-REG-001 implementation. The decisions outlined above establish clear boundaries, ownership models, and migration strategies for the modern competition registration foundation.

Next steps:
1. Review and approve this architecture summary
2. Create detailed implementation plan
3. Define API contracts and endpoint specifications
4. Design database schema for registration domain
5. Begin incremental implementation following the guidance provided