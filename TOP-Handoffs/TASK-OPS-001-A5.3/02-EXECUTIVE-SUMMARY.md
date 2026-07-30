Task:
TASK-OPS-001-A5.3

Title:
Fact Consumer Boundary


Purpose:

Define how confirmed match facts are consumed by other domains, establishing the directional boundary between fact creation and fact consumption.


# Core Principle

TOP is a domain fact system, not an automated workflow engine.

This principle guides all boundary decisions. Match Operations creates trusted facts — consumers interpret and use those facts independently.


# Important Note

Fact creation ≠ Fact consumption.

Match Operations creates trusted facts.
Consumers interpret and use those facts.

Consumers must not control Match Operations.


# Match Operations Ownership

Match Operations owns:

- Confirmed Match Outcome
- Confirmation facts
- Evidence references
- Timestamps

These are the trusted facts produced by the match execution and confirmation process.


# Consumer Domains

Consumers may include:

Competition:
- Ranking interpretation
- Tournament progression
- Master recording workflow

Analytics:
- Player history
- Match statistics
- Referee history

Dispute Resolution:
- Reading outcome facts
- Reviewing evidence


# Consumer Ownership

Consumers own their own interpretation.

Examples:

Competition owns:
- Points calculation
- Advancement rules

Analytics owns:
- Statistical calculations

Resource management owns:
- Court availability
- Player availability
- Referee availability


# Directional Boundary

The boundary is directional:

```
Confirmed Match Outcome
        |
        v
Consumers
```

Not:

```
Consumer
        |
        v
Match Operations
```

This means:
- Match Operations publishes facts
- Consumers read and interpret facts
- Consumers do not send commands back to Match Operations
- Consumer requirements do not alter fact structure


# Relationship with A5 Series

A5.1: Confirmed Match Outcome Boundary
- Defines what constitutes a confirmed match outcome
- Official confirmation required, participant confirmation optional

A5.2: Confirmation Evidence Boundary
- Defines boundary between confirmation record and evidence
- Evidence supports dispute review

A5.3: Fact Consumer Boundary
- Defines how confirmed facts flow to consumers
- Consumers interpret but do not control


# Explicit Exclusions

Do not introduce:

- Event bus architecture
- Workflow engine
- Automatic consumer triggering
- Ranking service
- Analytics service
- Notification workflow

This task does NOT define:

- New domain objects
- New code structures
- API contracts
- Database schemas
- Consumer implementation details
- Event publishing mechanisms
- Message queue design


# Scope Boundary

Included:

- Fact Consumer boundary definition
- Directional boundary principle
- Consumer domain examples
- Consumer ownership clarification
- Relationship with A5.1 and A5.2

Excluded:

- Production code changes
- MatchContext modifications
- MatchExecutionContext modifications
- Existing A1-A5.2 handoff file modifications
- Any implementation work


# Implementation Guidance

This is a documentation-only task. No code implementation required.

Future tasks may define:

- Consumer query interfaces
- Read model projections
- Consumer-specific interpretations

These future tasks must preserve:

- MatchContext unchanged from A1
- MatchExecutionContext unchanged from A3
- A3 domain objects unchanged
- Confirmed Match Outcome boundary from A5.1
- Confirmation Evidence boundary from A5.2
- Directional boundary principle
- Consumer independence from Match Operations

Follow TES Handoff Protocol.