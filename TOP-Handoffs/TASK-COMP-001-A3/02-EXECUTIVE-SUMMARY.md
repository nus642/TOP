# Official Record Creation Boundary - Executive Summary

**For:** Business stakeholders and decision makers
**Date:** 2026-07-30

---

## What This Is

This document defines how official competition records are created in the TOP system. It specifies:

- When a record becomes official
- How results enter the system
- Who can create records
- How the source of each record is preserved

## Core Principle

**TOP records facts. It does not run workflows.**

Records become official at the moment of creation. There is no approval step, no pending state, no workflow to manage.

---

## Two Paths to an Official Record

### Path 1: Referee-Confirmed Result

The normal path during live match operations:

```
Match played → Referee scores → Referee signs → Official Record created
```

| Step | What Happens |
|------|--------------|
| 1 | Referee records points during live play |
| 2 | Match reaches completion condition |
| 3 | Referee signs to confirm the result |
| 4 | System creates Official Competition Record |

**Key:** The referee's signature is the confirmation. No further approval is needed.

### Path 2: Master Manual Entry

The operational path for edge cases:

```
Master enters result → Official Record created (marked as manual)
```

| Step | What Happens |
|------|--------------|
| 1 | Master accesses manual entry function |
| 2 | Master enters match details and score |
| 3 | System creates Official Competition Record |

**Key:** Manual entries have the same status as referee-confirmed results, but are marked with their origin.

---

## Recording Authority

| Actor | Can Create Records | Authority Source |
|-------|-------------------|------------------|
| Referee | Yes (via signature) | System grants during match assignment |
| Master | Yes (via manual entry) | System grants based on role |

**Important:** Authority is granted by the system, not inherent. The Master is an actor, not an owner of the domain.

---

## Source Preservation

Every record captures how it was created:

| Source Type | Meaning | Evidence |
|-------------|---------|----------|
| `referee_confirmed` | Result from live match with referee signature | Signature reference, referee identity |
| `master_entered` | Manual entry by Master | Master identity, entry timestamp |

**Why this matters:** Transparency. Anyone reviewing records can see exactly how each result was produced.

---

## What Is NOT Included

These are explicitly **out of scope**:

| Excluded | Reason |
|----------|--------|
| Approval workflow | Business decision: referee signature = official |
| Correction mechanism | Deferred to future scope |
| Ranking calculation | External process |
| Bracket advancement | External process |
| Analytics | Separate concern |

---

## Record Lifecycle

Simple by design:

```
[Creation] → Official (permanent)
```

- Records are official immediately upon creation
- Records are not modified in place (future corrections would create new records referencing prior records)
- No draft state, no pending state, no archived state

---

## Why This Matters

1. **Clear creation boundary** - Everyone knows when a record becomes official
2. **Dual path support** - Handles both normal operations and edge cases
3. **Source transparency** - Full visibility into how records were produced
4. **Simple lifecycle** - No complex workflow to manage or debug
5. **Fact-based design** - Consistent with TOP's core principle

---

## Relationship to Previous Documents

| Document | Established | This Document Adds |
|----------|-------------|-------------------|
| A1 | Domain boundary, ownership | Creation conditions |
| A2 | Model boundary, contents | Acceptance mechanisms |
| **A3** | — | **How records are created and accepted** |

---

## Next Steps

1. Implementation design based on this boundary
2. API design for record creation
3. Data model implementation
4. Test scenarios for both acceptance paths

---

*End of Executive Summary*