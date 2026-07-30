Task:
TASK-OPS-001-A5.2

Title:
Confirmation Evidence Boundary


Purpose:

Define the boundary between Confirmation Record and Confirmation Evidence, establishing how confirmation facts are supported by evidence for dispute review.


# Core Principle

TOP is a domain fact system, not an automated workflow engine.

This principle guides all boundary decisions. Match Operations records what happened and preserves trusted facts with supporting evidence — it does not manage storage infrastructure or orchestrate dispute workflows.


# Important Note

Legacy behavior is reference only.
Do not copy legacy implementation.
Do not design storage or infrastructure.


# Relationship with A5.1

A5.1 Confirmed Match Outcome contains:

- Match result
- Confirmation records
- Evidence references

A5.2 defines the boundary between:

```
Confirmation Record (who/what/when)
        |
        v
Confirmation Evidence (supporting proof)
```


# Confirmation Record Boundary

Confirmation Record represents:

- Who confirmed
- What responsibility/role they represent
- What was confirmed
- When confirmation occurred

This is the factual assertion that a confirmation event occurred.


# Confirmation Evidence Boundary

Confirmation Evidence represents:

- Supporting proof that the confirmation occurred
- Reference to original evidence
- Capture information

This is the proof that supports the confirmation record.


# Important Business Rules

1. Official confirmation is required for confirmed match outcome.

2. Participant confirmation is optional:
   - Some formally officiated matches may require player signatures
   - Some score-only matches may complete with authorized official confirmation only

3. Do not model:
   - RefereeConfirmation
   - ScorekeeperConfirmation
   
   Use generic confirmation responsibility concept.

4. Evidence cardinality:
   
   Do not assume: one person = one evidence item.
   
   A single confirmation event may have one or more evidence references.
   
   Example:
   - One signature image may contain both player signatures
   - One official confirmation may have one signature evidence


# Evidence as Part of Fact Boundary

Evidence must allow future dispute review.

Evidence is NOT:

- File upload service
- Storage implementation
- Document management system
- Retention policy
- Dispute workflow


# Ownership

Match Operations owns:

- Confirmation facts
- Evidence references
- Timestamps

Match Operations does NOT own:

- Storage infrastructure
- Retention decisions
- Complaint handling workflow
- Master data entry
- Ranking/statistics/analytics


# Relationship with A3

Existing A3 concepts:

- MatchResult — the result recorded by referee
- MasterConfirmation — the confirmation by master
- CompetitionUpdateIntent — the signal for competition updates

A5.2 adds the evidence dimension:

```
MatchResult + Confirmations + Evidence References
        |
        v
Confirmed Match Outcome (with evidence trail)
        |
        v
Future dispute review / consumer access
```


# Explicit Exclusions

This task does NOT define:

- Storage infrastructure design
- File upload implementation
- Document management system
- Retention policy definition
- Dispute workflow
- New domain objects
- New code structures
- API contracts
- Database schemas


# Scope Boundary

Included:

- Confirmation Record boundary definition
- Confirmation Evidence boundary definition
- Evidence cardinality rules
- Generic confirmation responsibility concept preserved
- Evidence as part of fact boundary

Excluded:

- Production code changes
- MatchContext modifications
- MatchExecutionContext modifications
- Existing A1-A5.1 handoff file modifications
- Any implementation work


# Implementation Guidance

This is a documentation-only task. No code implementation required.

Future tasks (A5.3 and beyond) may define:

- Fact Consumer Boundary
- Consumer access patterns
- Evidence query interfaces

These future tasks must preserve:

- MatchContext unchanged from A1
- MatchExecutionContext unchanged from A3
- A3 domain objects unchanged
- Generic confirmation responsibility concept
- Official confirmation as required
- Participant confirmation as optional
- Evidence cardinality flexibility

Follow TES Handoff Protocol.