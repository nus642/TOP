# Competition Result Record Model Boundary - Executive Summary

**For:** Business stakeholders and decision makers
**Date:** 2026-07-30

---

## What This Is

This document defines what a "Competition Result Record" contains and where its boundaries lie.

## Core Principle

**TOP records facts. It does not run workflows.**

The system captures what happened (results) as trustworthy domain facts. It does not automatically calculate rankings, advance players, or orchestrate business processes.

---

## The Model Relationship

```
Confirmed Match Outcome
        |
        v
Competition Result Record
```

A Competition Result Record **references** the match fact. It does not recreate or replace it.

---

## What Competition Result Record Owns

| Item | Description |
|------|-------------|
| Official competition record | The authoritative tournament result |
| Reference to confirmed match outcome | Link to the source fact |
| Competition/tournament identity | Which competition this result belongs to |
| Recording origin | How this record was created |
| Recording metadata | Timestamps, actor information |

---

## Recording Origin

Results can come from different sources. The origin is always preserved.

| Origin | Description |
|--------|-------------|
| referee-confirmed result | Result from Match Operations confirmation |
| master-entered result | Manual entry by authorized actor |

---

## Master's Role

**The Master (裁判长) is an actor, not an owner.**

Master:
- may create official records through authorized operation

Master does not:
- own match facts
- modify Match Operations facts

This distinction matters: the system grants Master authority; Master does not define the rules.

---

## What Is Explicitly Out of Scope

These are **not** part of Competition Result Record:

- ❌ Ranking calculation
- ❌ Advancement rules
- ❌ Player statistics
- ❌ Analytics
- ❌ Resource scheduling
- ❌ Court/referee lifecycle
- ❌ Workflow engine

---

## Decisions Made (from A1)

| Decision | Outcome |
|----------|---------|
| Manual entry | Valid recording path |
| Origin preservation | Required |
| Approval workflow | Not initially |
| Official record lifecycle | Simple |
| Correction governance | Deferred |

---

## Open Questions

| # | Question | Why It Matters |
|---|----------|----------------|
| Q1 | Does Competition store a snapshot or reference? | Determines data model and storage approach |
| Q2 | How are external score systems represented? | Affects integration with systems like 网球记 |
| Q3 | How are official records queried? | Shapes API and reporting capabilities |
| Q4 | Future correction/history approach | Impacts data governance and audit trail |

---

## Why This Matters

1. **Clear model boundary** prevents confusion about what data lives where
2. **Reference-based design** keeps match facts authoritative and single-sourced
3. **Origin preservation** ensures transparency about how records were created
4. **Explicit non-goals** prevent scope creep into workflow automation

---

## Next Steps

1. Business stakeholders answer the open questions
2. Answers become requirements for implementation
3. Implementation follows the boundary defined here

---

*End of Executive Summary*