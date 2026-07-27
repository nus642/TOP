# TASK-OPS-001-A: Tournament Operation Core Loop Foundation

**Type:** CODE  
**Priority:** High  
**Dependency:** TASK-OPS-001, TASK-CORE-001

**Objective:** Implement the Tournament Operation Core Loop Foundation based on the approved TASK-OPS-001 architecture. Establish the P0 core loop domain layer: external draw input, match context creation, Master operational control, Referee execution, result submission, and competition update.

**Background:** TASK-OPS-001 documented the approved Match Operations architecture including actor responsibilities, operational workflows, and state models. TASK-CORE-001 established the Competition Core Domain (Competition → Group → Event → Entry → Participant). This task implements the minimum viable operational foundation — the core loop — that enables a tournament to operate from draw input through result confirmation.

**Domain Location:** `Modern/engine/operations/`

**P0 Core Loop:**

```
External draw input
→ Match context creation
→ Master operational control
→ Referee execution
→ Result submission
→ Competition update
```

**Scope Included (P0):**  
- External draw input boundary
- Match context creation from Entry
- Master operational control boundary
- Referee execution context boundary
- Result submission domain concept
- Competition update boundary concept
- Operational ownership concepts
- Basic operational validation
- Domain tests

**Deferred (P1):**  
- Team lineup management / captain lineup

**Deferred (P2):**  
- Single tournament management authorization
- User permission model
- Access control system

**Scope Excluded (Not Implemented):**  
- Registration
- Payment
- User management
- Authentication
- Authorization
- Notification system
- Scheduling algorithm
- Scoring engine
- Ranking system
- Frontend
- Database design
- API design

**Implementation Boundary:**

TASK-OPS-001-A consumes the Competition Core Domain provided by TASK-CORE-001.

TASK-OPS-001-A does NOT recreate or redefine:

- Competition
- Group
- Event
- Entry
- Participant

These entities remain owned by the Competition Core Domain.

Match Operations works on confirmed competition data and uses Entry as the participation boundary.

**Implementation Principles:**

1. Entry is the input boundary for Match Operations.
2. Master holds operational authority over tournament execution.
3. Referee holds match execution authority within Master's operational context.
4. Match Operations does not own competition structure.
5. Match Operations does not own scheduling algorithms.
6. Operational validation ensures actor boundaries are respected.
7. Existing Legacy APIs and workflows must remain unchanged.

**Acceptance Criteria:**
- Match Operations domain consumes Entry from Competition Core Domain
- Master operational authority boundary defined and validated
- Referee operational context boundary defined and validated
- Invalid cross-boundary operations are rejected
- Existing tests remain passing
- New domain tests added

**Testing Requirements:**

Use Node built-in test runner (`node:test`) with `node:assert/strict`.

Include tests for:
- Valid Entry consumption from Competition Core Domain
- Master authority boundary validation
- Referee context boundary validation
- Invalid actor operation rejection
- Legacy regression protection
- Domain model construction validation

**Integration Boundary:**

This task does NOT modify:
- `Modern/api/`
- `Modern/services/`
- `Modern/repositories/`
- `Modern/db.sql`
- Legacy code

**Lifecycle Constraints:**

Do not implement full operational state machines.

Only implement:
- Construction validation
- Actor boundary invariants
- Entry input boundary validation

Do not add new architecture decisions.

**Important Notes:**

This is the first Match Operations domain implementation focused on the P0 core loop. Keep changes incremental. Do not implement P1/P2 deferred features. Do not modify production code outside the required domain scope. Follow TES Handoff Protocol.
