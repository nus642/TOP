# TOP Modern Domain Architecture

## 1. Purpose

TOP is evolving from Legacy tournament management software into a multi-sport tournament platform. This document provides a platform-level architecture reference that summarizes approved architecture decisions from TASK-TOP-007C series, TASK-REG-001, and TASK-REG-001-A.

## 2. Core Architecture Principles

- **Platform first**: Modern architecture prioritizes platform-level concerns over legacy implementations
- **Domain boundaries before implementation**: Clear separation of concerns with explicit domain ownership
- **Explicit competition context**: Competition ownership is explicit at API boundaries
- **Incremental migration**: Legacy behavior remains functional while modern capabilities are introduced
- **Preserve legacy compatibility**: No unnecessary rewrites; maintain backward compatibility during migration

## 3. Competition Domain

Competition is the primary business boundary. Competition owns:

- **Registrations**: All participant registrations within its context
- **Registration rules and constraints**: Competition-specific validation and policies
- **Registration lifecycle operations**: State transitions and management
- **Registration context**: Competition context is immutable for registrations

Competition context is already isolated through modern API routes (e.g., POST /api/competition/:competitionId/schedule).

## 4. Competition Participation Domain

**Competition Participation is the core domain for TOP Phase 1.** This domain focuses on managing competition participation through Entries, with Registration serving as an upstream source of Entries.

**Current TOP boundary**:
- Competition Participation (via Entries) is the primary focus
- External registration platforms are supported
- Future TOP Registration capability may be added later

**Relationship**:

```
External Registration Source
        |
        ↓
Competition
        |
        ↓
Entry
        |
        ↓
Participant(s)
```

**Key characteristics**:

- Competition owns all registrations within its context
- Registration cannot exist without a valid competition context
- Competition context is immutable for a registration
- Registration represents a participant's intent to participate
- Competition manages registration lifecycle transitions
- Entry represents the actual competitive unit
- Entry abstraction provides stable integration point for schedule generation

## 5. Entry Abstraction

Entry represents the competitive unit. Relationship:

```
Competition
  |
  └── Registration
      |
      └── Entry
          |
          └── Participant(s)
```

**Entry types**:

- **IndividualEntry**: Represents a single player's participation
- **TeamEntry**: Represents a team's participation with multiple players
- Unified interface for competitive units
- Foundation for future schedule generation

Entry abstraction enables schedule generation to consume confirmed entries, supporting both individual and team participation models.

## 6. Player vs Participant

**Player**:
- Long-lived identity
- Part of Participant entity
- Not directly owned by Registration

**Participant**:
- Competition-specific participation context
- Can have multiple registrations across different competitions
- Can be individual or team
- Participates in competitions via Registration

**Key relationship**: Registration does not directly own Player. Participant relationships are managed through Registration.

## 7. Schedule Domain Dependency

Schedule generation consumes:

1. **Confirmed Registrations**: Valid registrations that have passed validation
2. **Eligible Entries**: Entries derived from confirmed registrations
3. **Matches**: Generated schedule items

**Critical constraint**: Schedule generation must not directly consume raw Players. The Entry abstraction provides the correct level of indirection between Registrations and schedule generation.

## 8. Legacy to Modern Migration Strategy

- **Legacy behavior remains functional**: Existing APIs and behaviors continue to work
- **Modern capabilities are introduced incrementally**: New features added alongside legacy support
- **No unnecessary rewrites**: Incremental improvements over complete rewrites
- **Explicit competition context**: Modern routes express competition ownership explicitly (e.g., POST /api/competition/:competitionId/schedule)
- **Preserve transaction boundaries**: Existing lifecycle transaction behavior remains unchanged

## 9. Current Domain Roadmap

```
Competition
    |
    └── Registration
        |
        └── Entry
            |
            └── Schedule
                |
                └── Match
                    |
                    └── Result
                        |
                        └── Analytics
```

**Status**:
- **Competition**: ✅ Implemented (TASK-TOP-007C series)
- **Registration**: ✅ Defined (TASK-REG-001, TASK-REG-001-A)
- **Entry**: ✅ Defined (TASK-REG-001-A)
- **Schedule**: 🚧 In progress (TASK-TOP-007C series)
- **Match**: 📅 Future
- **Result**: 📅 Future
- **Analytics**: 📅 Future

## 10. Architecture Governance

Future changes should:

- **Preserve domain boundaries**: Maintain clear separation between domains
- **Avoid direct shortcuts**: Use proper abstraction layers (e.g., Entry abstraction for schedule generation)
- **Update architecture documents before major implementation**: Ensure documentation reflects design decisions
- **Follow incremental migration**: Introduce changes gradually while preserving legacy compatibility

---

**Status**: Architecture Reference Document
**Last Updated**: 2026-07-25
**Approved By**: TASK-TOP-007C series, TASK-REG-001, TASK-REG-001-A