# TASK-COMP-001-A2: Competition Result Record Model Boundary

**Status:** Documentation Complete
**Created:** 2026-07-30
**Depends On:** TASK-COMP-001-A1

---

## Purpose

Define the boundary of Competition Result Record.

## Core Principle

**TOP is a domain fact system, not a workflow engine.**

---

## Context

TASK-COMP-001-A1 established:

### Match Operations

- produces trusted match facts
- owns Confirmed Match Outcome
- owns confirmation facts
- owns evidence references

### Competition Result Recording

- consumes confirmed match outcome
- creates official competition records

---

## Competition Result Record Owns

| Responsibility | Description |
|----------------|-------------|
| Official competition record | The authoritative tournament result |
| Reference to confirmed match outcome | Link to the source fact |
| Competition/tournament identity | Which competition this result belongs to |
| Recording origin | How this record was created |
| Recording metadata | Timestamps, actor information |

### Recording Origin Examples

| Origin | Description |
|--------|-------------|
| referee-confirmed result | Result from Match Operations confirmation |
| master-entered result | Manual entry by authorized actor |

---

## Model Relationship

```
Confirmed Match Outcome
        |
        v
Competition Result Record
```

The Competition record should reference the fact, not recreate or replace the match fact.

---

## Actor Model

**Master is an actor, not an owner.**

Master:
- may create official records through authorized operation

Master does not:
- own match facts
- modify Match Operations facts

---

## Explicit Non-Goals

This task does NOT include:

- ❌ Ranking calculation
- ❌ Advancement rules
- ❌ Player statistics
- ❌ Analytics
- ❌ Resource scheduling
- ❌ Court/referee lifecycle
- ❌ Workflow engine

---

## Business Decisions from A1

Accepted direction:

| Decision | Outcome |
|----------|---------|
| Manual entry | Valid recording path |
| Origin preservation | Required |
| Approval workflow | Not initially |
| Official record lifecycle | Simple |
| Correction governance | Deferred |

---

## Open Questions

| # | Question | Impact |
|---|----------|--------|
| Q1 | Does Competition store a snapshot or reference? | Data model design |
| Q2 | How are external score systems represented? | Integration design |
| Q3 | How are official records queried? | API design |
| Q4 | Future correction/history approach | Data governance |

---

## Deliverables

| Document | Purpose |
|----------|---------|
| 01-TASK.md | This task definition |
| 02-EXECUTIVE-SUMMARY.md | Business-readable summary |
| STATUS.md | Current status and next steps |

---

## Success Criteria

- [x] Model boundary clearly defined
- [x] Ownership mapping complete
- [x] Non-goals explicitly stated
- [x] Open questions documented
- [x] Business decisions captured from A1

---

*End of Task Definition*