# TASK-CORE-001: Modern Competition Core Domain Foundation

**Type:** CODE  
**Priority:** High  
**Dependency:** TASK-REG-001-D

**Objective:** Implement the first Modern core domain foundation based on approved architecture decisions. Establish the internal competition structure required by future tournament operations.

**Background:** TOP is evolving from Legacy tournament workflows into a Modern tournament operation platform. Approved architecture defines the domain hierarchy: Competition → Group → Event → Entry → Participant. This implementation establishes the core objects and ownership relationships without implementing registration, scheduling algorithms, or match operations.

**Domain Location:** `Modern/engine/competition/domain/`
  +++++++ REPLACE

**Scope Included:**  
- Competition context foundation
- Group model foundation
- Event model foundation
- Entry model foundation
- Participant relationship foundation
- Ownership validation
- Basic lifecycle validation
- Regression tests

**Scope Excluded:**  
- Registration platform
- Payment
- External registration integration
- File import
- AI/OCR ingestion
- Schedule generation algorithm
- Match generation
- Ranking
- Frontend redesign

**Implementation Principles:**

1. Competition is the ownership boundary.
2. Group defines participant classification.
3. Event defines competition format.
4. Entry belongs to Event.
5. Participant is an Entry-scoped association to a Player/identity.
6. Participant is NOT the owner of long-lived player identity.
7. Event owns competition format, entry composition rules, and sport-specific constraints.
8. Entry owns participation state and participant associations.
9. Entry must NOT own scoring rules, scheduling rules, or event format rules.
10. Existing Legacy APIs and workflows must remain unchanged.
  +++++++ REPLACE

**Acceptance Criteria:**
- Competition can own Groups
- Group can own Events
- Event can own Entries
- Entry can reference Participants
- Invalid ownership relationships are rejected
- Existing tests remain passing
- New domain tests added

**Testing Requirements:**

Use Node built-in test runner (`node:test`) with `node:assert/strict`.

Include tests for:
- Valid Competition → Group → Event → Entry relationship
- Invalid cross-competition ownership
- Entry without valid Event rejection
- Participant association validation
- Legacy regression protection
- Domain model construction validation
- Ownership invariants validation
  +++++++ REPLACE

**Integration Boundary:**

This task does NOT modify:
- `Modern/api/`
- `Modern/services/`
- `Modern/repositories/`
- `Modern/db.sql`
- Legacy code

**Lifecycle Constraints:**

Do not introduce new lifecycle state machines for Group/Event/Entry/Participant.

Only implement:
- Construction validation
- Ownership invariants

Do not add new architecture decisions.

**Important Notes:**

This is the first Modern domain implementation. Keep changes incremental. Do not redesign unrelated services. Do not modify production code outside the required domain scope. Follow TES Handoff Protocol.
  +++++++ REPLACE
