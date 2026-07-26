Task:
TASK-REG-001-D

Title:
Competition Group and Event Architecture


Purpose:

Record the architecture decisions for how TOP represents tournament structure from Competition to Participant.


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


# Group Decision

Group represents participant classification and competition scope.

Examples:

- Open Group
- Senior Group
- U10
- U12
- 50+

Group answers:

"Which category of participants can join?"


Group does not define:

- Match format
- Entry composition
- Schedule


# Event Decision

Event represents the actual competition format.

Examples:

- Men's Singles
- Women's Singles
- Men's Doubles
- Mixed Doubles
- Parent-child events


Event defines:

- Competition format
- Entry composition rules
- Sport-specific competition behavior


Event does not own:

- Participant identity
- Match scheduling


# Entry Decision

Entry represents the competitive unit participating in an Event.

Examples:

- Individual player
- Pair
- Team


Entry belongs to Event.

Entry does not belong directly to Competition.


# Rule Ownership Decision

Rules belong to the correct domain:

Competition:
Overall tournament lifecycle

Group:
Participant classification

Event:
Competition format and entry rules

Entry:
Participation representation

Participant:
Individual person


# Multi-Sport Decision

The model is sport-agnostic.

Future sports should extend through:

- Group configuration
- Event configuration
- Entry composition rules

without changing the core relationship.


# Schedule Dependency

Future schedule generation consumes confirmed Entries under Events.


Flow:

Competition

↓

Group

↓

Event

↓

Confirmed Entries

↓

Schedule

↓

Match Operations


# Scope Boundary

Included:

- Competition structure
- Group concept
- Event concept
- Entry ownership
- Domain responsibilities


Excluded:

- Database schema
- Schedule algorithm
- Match generation
- Ranking
- Scoring
- Frontend


# Implementation Guidance

Future implementation must preserve:

- Group/Event separation
- Event-owned rules
- Entry as participation boundary
- Sport-agnostic design


No production code modified.
Follow TES Handoff Protocol.