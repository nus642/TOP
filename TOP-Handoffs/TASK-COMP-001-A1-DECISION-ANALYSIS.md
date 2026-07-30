# TASK-COMP-001-A1 Decision Analysis

**Purpose:** Classify open questions by decision timing and domain ownership
**Date:** 2026-07-30
**Principle:** TOP is a domain fact system, not a workflow engine

---

## Decision Classification Summary

| Question | Classification | Rationale |
|----------|---------------|-----------|
| Q1: Manual entry authority | **Must decide** | Core to Competition Result Recording boundary |
| Q2: Manual entry status | **Must decide** | Affects record data model |
| Q3: Correction existence | **Must decide** | Determines if correction is in scope |
| Q4: Correction authorization | **Can defer** | Only relevant if Q3 = yes |
| Q5: Approval requirements | **Must decide** | Affects record lifecycle |
| Q6: Record states | **Must decide** | Core data model decision |
| Q7: Immutability timing | **Can defer** | Policy decision, not structural |
| Q8: External systems | **Another domain** | Integration concern, not result recording |

---

## Detailed Analysis

### Q1: Manual Entry Authority

**Question:** Who can perform manual result entry?

**Classification:** 1 - Must decide before design

**Rationale:**
- Manual entry is explicitly within Competition Result Recording scope
- Authority model affects API design and access control
- Legacy behavior (Master only) is a valid default

**Options:**
| Option | Implication |
|--------|-------------|
| Master only | Simple, matches legacy |
| Role-based | Requires role definition |
| Permission-based | Requires permission system |

**Recommended default:** Master only (preserve legacy behavior)

**Why must decide:** Cannot design manual entry API without knowing who can call it.

---

### Q2: Manual Entry Status

**Question:** What authority does manual entry carry?

**Classification:** 1 - Must decide before design

**Rationale:**
- Determines if manual entries are equal to referee-confirmed results
- Affects record data model (needs source/origin field)
- Legacy marks manual entries differently (`referee: '裁判长手动'`)

**Options:**
| Option | Implication |
|--------|-------------|
| Same status, marked | Simple, transparent |
| Different status | Requires status field |
| Requires confirmation | Adds workflow complexity |

**Recommended default:** Same status, marked with origin (preserve legacy behavior)

**Why must decide:** Record schema depends on whether origin matters.

---

### Q3: Correction Existence

**Question:** Can official results be corrected?

**Classification:** 1 - Must decide before design

**Rationale:**
- Fundamental scope question
- If yes, record model needs versioning or correction fields
- If no, records are immutable after creation
- Legacy has no correction mechanism

**Options:**
| Option | Implication |
|--------|-------------|
| No corrections | Simple, immutable records |
| Corrections allowed | Requires correction model |
| Corrections with approval | Requires approval workflow |

**Recommended default:** No corrections in initial scope (preserve legacy behavior)

**Why must decide:** Immutability is a core design constraint.

---

### Q4: Correction Authorization

**Question:** Who can authorize corrections?

**Classification:** 2 - Can defer to future task

**Rationale:**
- Only relevant if Q3 = "corrections allowed"
- If Q3 = no, this question is moot
- Can be decided when/if correction feature is added

**Defer to:** TASK-COMP-001-A2 or later (if corrections needed)

---

### Q5: Approval Requirements

**Question:** Do results require approval beyond referee confirmation?

**Classification:** 1 - Must decide before design

**Rationale:**
- Determines record lifecycle complexity
- Legacy: referee signature = immediate official (no approval)
- Adding approval introduces workflow (violates principle if overdone)

**Options:**
| Option | Implication |
|--------|-------------|
| No approval (legacy) | Simple, referee = authority |
| Master review | Adds workflow step |
| Auto-approve | Same as no approval |

**Recommended default:** No approval (preserve legacy behavior)

**Why must decide:** Affects whether records have "pending" state.

---

### Q6: Record States

**Question:** What states can an official record have?

**Classification:** 1 - Must decide before design

**Rationale:**
- Core data model decision
- Depends on Q3 (corrections) and Q5 (approval)
- Simpler is better for fact system

**Options:**
| Option | States | Complexity |
|--------|--------|------------|
| Simple | official | Minimal |
| With draft | draft → official | Low |
| Full lifecycle | draft → official → corrected → archived | High |

**Recommended default:** Simple (official only) if Q3=no and Q5=no

**Why must decide:** Schema design requires state model.

---

### Q7: Immutability Timing

**Question:** When does a record become immutable?

**Classification:** 2 - Can defer to future task

**Rationale:**
- Policy decision, not structural
- If Q3=no (no corrections), records are always immutable
- If Q3=yes, timing can be decided later
- Does not affect initial schema

**Defer to:** Policy configuration task (future)

---

### Q8: External System Relationship

**Question:** How do results relate to external tennis scoring systems?

**Classification:** 3 - Belongs to another domain

**Rationale:**
- Integration concern, not result recording
- External system sync is a separate boundary
- Competition Result Recording stores facts; how they arrive is separate
- Legacy "网球记" branding does not imply integration

**Belongs to:** Integration/Sync domain (future, if needed)

**Note:** If external systems produce results, they would be another source of facts (like manual entry), not a domain owner.

---

## Decisions Required Before Design

These must be answered to proceed with Competition Result Recording design:

| # | Question | Recommended Default |
|---|----------|---------------------|
| Q1 | Manual entry authority | Master only |
| Q2 | Manual entry status | Same status, marked with origin |
| Q3 | Correction existence | No corrections (initial scope) |
| Q5 | Approval requirements | No approval (referee = authority) |
| Q6 | Record states | Simple (official only) |

**If defaults accepted:** Design can proceed immediately with simple, immutable record model.

---

## Deferred Decisions

These can be decided in future tasks:

| # | Question | Defer Until |
|---|----------|-------------|
| Q4 | Correction authorization | If/when corrections are added |
| Q7 | Immutability timing | Policy configuration phase |

---

## Other Domain Decisions

These belong elsewhere:

| # | Question | Domain |
|---|----------|--------|
| Q8 | External system relationship | Integration/Sync (future) |

---

## Minimal Viable Design

If all recommended defaults are accepted:

```
CompetitionResultRecord {
  id: string
  matchId: string
  t1: string
  t2: string
  score: string
  winner: string
  details: string
  source: "referee" | "master_manual"
  referee: string
  signatureRef: string | null
  recordedAt: timestamp
  recordedBy: string
}
```

**Characteristics:**
- Immutable after creation
- No approval workflow
- No correction mechanism
- Source field distinguishes referee vs manual
- Simple, fact-based

---

*End of Decision Analysis*