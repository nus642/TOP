# Contest Identity / Configuration Reference Policy — Executive Summary

**Task:** TASK-COMP-004-A1

**Title:** Contest Identity / Configuration Reference Policy

**Date:** 2026-08-02

**Status:** Awaiting Policy Decision

---

## What This Task Addresses

The completed boundary work establishes who owns each fact in TOP:

- Competition Configuration owns rules, structure, templates, and constraints.
- Contest Generation owns generated contest facts.
- Scheduling owns placement and assignment facts.
- Match Operations owns execution facts.
- Competition Result Recording owns official records.

These decisions answer **who owns each fact**. They do not answer **what must remain historically true about a reference between those facts** when configuration or a contest is later changed, corrected, cancelled, replaced, or superseded.

This task defines the policy decisions required to close that gap.

## Guiding Principle

**Policy before mechanism.**

This task records the questions that require business decisions and the invariants that must hold once those decisions are confirmed as domain rules. It does not choose identifiers, schemas, versioning strategies, APIs, or workflow machinery.

## The Policy Gap in One Line

> **Ownership boundaries tell us who creates and preserves each fact. This task tells us what must remain true when those facts reference each other across time and change.**

## Six Policy Decision Areas

| # | Area | Core question |
|---|------|---------------|
| 1 | Contest Identity Meaning | What makes a contest remain "the same contest" versus become a distinct replacement? |
| 2 | Contest Continuity | When configuration changes after contests exist, what happens to the relationship? |
| 3 | Configuration Reference Responsibility | Who preserves the governing configuration context for historical interpretation? |
| 4 | Historical Interpretation Guarantees | What must an authorized reader be able to reconstruct? |
| 5 | Correction and Supersession Governance | When a contest is corrected or replaced, which references remain and which concern a distinct contest? |
| 6 | Cross-Domain Reference Responsibilities | What guarantees must each boundary provide and respect? |

## Why This Matters

Without confirmed domain rules:

- Technical keys, mutable objects, or copied values may silently decide what "same contest" means.
- A later configuration edit could change how an earlier schedule, execution record, or official result is interpreted.
- Replacement may be implemented as overwrite or deletion, erasing the distinction between original and corrected facts.
- Scheduling could refer to one meaning of a contest while Match Operations resolves the same reference against another.
- TOP may be unable to answer which sides, format, structural context, assignment, execution, and official record applied at the relevant time.

## What This Task Does Not Do

This task does **not** define:

- identifier formats, UUID strategy, or technical key selection;
- database schema, tables, entities, fields, or persistence layouts;
- version tables, snapshots, event sourcing, or any versioning mechanism;
- APIs, commands, events, payloads, or endpoints;
- workflow engines, state machines, or orchestration;
- implementation architecture, code changes, or framework choices;
- UI flows, import behavior, or parser rules;
- draw, seeding, advancement, ranking, or tie-break policy;
- scheduling algorithms, resource allocation, or dispatch behavior;
- match-execution, scoring, or confirmation rules;
- official-result creation or correction design beyond its reference guarantee;
- creation of an Identity, Lifecycle, Coordination, or Workflow domain.

## Exit Condition

The task is complete when implementation planners can proceed without inventing identity, mutation, or historical-reference policy by accident.

---

*End of Executive Summary*
