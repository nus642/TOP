# Competition Result Recording Boundary - Executive Summary

**For:** Business stakeholders and decision makers
**Date:** 2026-07-30

---

## What This Is

This document defines what "Competition Result Recording" means in the TOP system and where its boundaries lie.

## Core Principle

**TOP records facts. It does not run workflows.**

The system captures what happened (results) as trustworthy domain facts. It does not automatically calculate rankings, advance players, or orchestrate business processes.

---

## The Two Domains

### Match Operations (produces results)

When a match is played:
- Referee scores the match live
- System detects game/match completion
- Referee signs to confirm the result
- **This produces a trusted match result fact**

### Competition Result Recording (preserves results)

After a match result exists:
- System stores it as an official competition record
- Master can manually enter results when needed
- Corrections follow governance rules
- **This preserves the tournament's official history**

---

## What Each Domain Owns

| Match Operations | Competition Result Recording |
|------------------|------------------------------|
| Live scoring | Official record storage |
| Game completion detection | Tournament history |
| Referee confirmation | Manual entry capability |
| Signature creation | Correction governance |

---

## What Neither Domain Owns

These are explicitly **out of scope**:

- ❌ Ranking calculation (external process)
- ❌ Bracket advancement (external process)
- ❌ Court scheduling (Resource domain)
- ❌ Referee assignment (Resource domain)
- ❌ Analytics and reporting (separate concern)

---

## Master's Role

**The Master (裁判长) is an actor, not an owner.**

- Master can manually record results
- Master can request corrections
- Master's actions are logged as facts
- Master does not "own" the result domain

This distinction matters: the system grants Master authority; Master does not define the rules.

---

## Decisions Needed

### 1. Manual Entry

| Question | Options |
|----------|---------|
| Who can manually enter results? | Master only / Role-based / Permission-based |
| Do manual entries need extra confirmation? | Yes (signature) / No (audit log only) |

### 2. Corrections

| Question | Options |
|----------|---------|
| Can official results be corrected? | Yes / No / With approval |
| Who approves corrections? | Master / Admin / Multi-party |

### 3. Record Lifecycle

| Question | Options |
|----------|---------|
| Record states? | Simple (official/not) / Complex (draft→official→corrected→archived) |
| When immutable? | Never / Time window / Tournament close |

### 4. External Systems

| Question | Options |
|----------|---------|
| Relationship with external scoring systems? | Import / Sync / Reference only / None |

---

## Why This Matters

1. **Clear ownership** prevents confusion about who records what
2. **Fact-based design** keeps the system simple and auditable
3. **Explicit non-goals** prevent scope creep into workflow automation
4. **Open questions** ensure business decisions are made consciously, not by accident

---

## Next Steps

1. Business stakeholders answer the open questions
2. Answers become requirements for implementation
3. Implementation follows the boundary defined here

---

*End of Executive Summary*