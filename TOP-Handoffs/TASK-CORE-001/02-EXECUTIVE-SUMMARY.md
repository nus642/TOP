Task:
TASK-CORE-001

Title:
Modern Core Domain Foundation


Purpose:

Record the rationale and architectural decisions for implementing the Modern core domain foundation in TOP.


# Why Modern Core Domain is Needed

TOP is evolving from Legacy tournament workflows into a Modern tournament operation platform. The Legacy system lacks:

- Clear domain boundaries and ownership
- Consistent data model across tournament operations
- Foundation for future scheduling and match operations
- Sport-agnostic architecture for multi-sport expansion

The Modern core domain provides the essential structure required by all future tournament operations, establishing the internal competition hierarchy that supports scheduling, match generation, and operational workflows.


# Architecture Decision

TOP separates tournament structure into multiple levels:

Competition
    ↓
Group
    ↓
Event
    ↓
Entry
    ↓
Participant


This separation reflects real tournament operations and supports future multi-sport expansion.


# Ownership Boundaries

Clear ownership boundaries define domain responsibilities:

Competition:
- Overall tournament lifecycle
- Tournament-wide rules and configurations
- Group management
- Tournament-wide statistics

Group:
- Participant classification
- Group-specific rules
- Group-level statistics

Event:
- Competition format
- Entry composition rules
- Sport-specific competition behavior
- Event-level statistics

Entry:
- Participation representation
- Entry-specific rules
- Entry-level statistics

Participant:
- Individual person identity
- Personal information
- Participation history


# Why Entry Belongs to Event

Entry represents the competitive unit participating in an Event, not directly in a Competition.

Entry belongs to Event because:

1. **Format-Specific**: Different events have different entry requirements (e.g., singles vs. doubles)
2. **Rules-Based**: Entry rules are event-specific (e.g., gender restrictions, age limits)
3. **Competition-Specific**: Entry composition varies by event type
4. **Statistical Granularity**: Statistics are tracked per event, not per competition

Entry does not belong directly to Competition because:

- Competition-level statistics would be too aggregated
- Entry rules are event-specific, not competition-wide
- Future multi-sport expansion requires event-level flexibility


# Why This is Not a Registration System

This implementation focuses on the core domain structure, not registration workflows.

Registration system would include:

- Public-facing registration forms
- Payment processing
- External registration integration
- File import (team rosters, player lists)
- AI/OCR ingestion for player data
- Registration status tracking
- Registration deadlines and validations

Core domain focuses on:

- Internal competition structure
- Ownership relationships
- Domain validation
- Basic lifecycle management

Registration is a separate concern that will be addressed in future tasks (TASK-REG-002, TASK-REG-003, etc.).


# Legacy Compatibility Decision

Existing Legacy APIs and workflows must remain unchanged.

Key principles:

1. **No Breaking Changes**: All Legacy endpoints continue to function
2. **Data Migration**: Legacy data is preserved and mapped to Modern domain
3. **Dual Operation**: Legacy and Modern systems can coexist during transition
4. **Incremental Migration**: Modern domain is added alongside Legacy, not replacing it

This ensures business continuity and allows gradual migration without disrupting ongoing operations.


# Scope Boundary

Included:

- Competition context foundation
- Group model foundation
- Event model foundation
- Entry model foundation
- Participant relationship foundation
- Ownership validation
- Basic lifecycle validation
- Domain tests
- Legacy regression tests

Excluded:

- Registration platform
- Payment processing
- External registration integration
- File import
- AI/OCR ingestion
- Schedule generation algorithm
- Match generation
- Ranking calculations
- Scoring system
- Frontend redesign
- Database schema design
- API endpoint creation
- Service layer implementation
- Repository layer implementation


# Implementation Guidance

Future implementation must preserve:

- Competition as ownership boundary
- Group as participant classification
- Event as competition format
- Entry as Event-owned participation unit
- Participant as individual identity
- Clear ownership relationships
- Legacy compatibility

No production code modified.
Follow TES Handoff Protocol.