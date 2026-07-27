# TASK-OPS-001-A2: Match Execution Core Loop

**Type:** CODE
**Priority:** High
**Dependency:** TASK-OPS-001-A1

**Objective:** Implement the minimal match execution behavior on top of the A1 foundation. Introduce MatchExecutionContext as the execution behavior owner, define result recording boundary (Referee creates), master confirmation boundary (Master creates), and competition update intent signal.

**Background:** TASK-OPS-001-A1 delivered the structural foundation: MatchContext aggregate root, MasterOperationalContext, RefereeOperationalContext, OperationsError. All construction validation and actor boundary invariants are in place. This sub-task adds the first behavior layer: the core execution loop that moves a match from scheduled through completion.

**Domain Location:** `Modern/engine/operations/domain/`

**Scope Included:**
- MatchExecutionContext (execution behavior owner)
- MatchResult value object (created by Referee authority)
- MasterConfirmation (created by Master authority)
- CompetitionUpdateIntent signal (emitted by MatchExecutionContext)
- RefereeOperationalContext.recordResult() extension
- MasterOperationalContext.confirmResult() extension
- Domain tests

**Scope Excluded (Not Implemented):**
- UI
- API endpoints
- Notification
- Scheduling algorithm
- Scoring engine
- Ranking system
- Authentication
- Authorization
- Full workflow state machine
- State transition rules
- Database persistence
- Service layer
- Repository layer

**Implementation Boundary:**

MatchContext remains unchanged from A1 (identity boundary only).

This task does NOT modify MatchContext. Execution behavior lives in MatchExecutionContext.

This task does NOT:

- Modify Competition Core Domain
- Modify MatchContext (A1 contract preserved)
- Implement state machine framework
- Define state transition rules
- Add state history tracking
- Introduce notification triggers
- Introduce persistence

**Approved Match States (from architecture):**

```
Scheduled → Match Calling → In Progress → Completed
Scheduled → Cancelled
```

**Core Loop (from approved architecture):**

```
Match Ready → Calling Issued → Player Ready → Referee Ready → Court Ready → Match Start → Result
```

This task implements the minimal domain behavior for:
- Match Start (In Progress)
- Result (Referee records + Master confirms)
- Match Complete
- Match Cancel

**Domain Objects:**

| Object | File | Responsibility |
|--------|------|----------------|
| MatchExecutionContext | `match-execution-context.js` | Execution behavior owner. Holds status, result, confirmation. Emits intent |
| MatchResult | `match-result.js` | Immutable value object. Created by Referee authority |
| MasterConfirmation | `master-confirmation.js` | Immutable confirmation. Created by Master authority |
| CompetitionUpdateIntent | `competition-update-intent.js` | Pure signal object. Emitted by MatchExecutionContext |
| RefereeOperationalContext (extended) | `referee-operational-context.js` | Add recordResult() — creation authority |
| MasterOperationalContext (extended) | `master-operational-context.js` | Add confirmResult() — creation authority |
| index (updated) | `index.js` | Add new exports |

**Responsibility Separation:**

| Concern | Owner |
|---------|-------|
| Match identity (Entry, draw position, actor contexts) | MatchContext (A1, unchanged) |
| Execution lifecycle (status, result, confirmation) | MatchExecutionContext |
| Result creation authority | RefereeOperationalContext |
| Confirmation creation authority | MasterOperationalContext |
| Intent emission | MatchExecutionContext |

**Implementation Principles:**

1. MatchContext remains unchanged — identity boundary only (A1 contract).
2. MatchExecutionContext is the execution behavior owner.
3. MatchResult is created by RefereeOperationalContext (creation authority).
4. MasterConfirmation is created by MasterOperationalContext (creation authority).
5. MatchExecutionContext receives and stores result/confirmation (ownership).
6. CompetitionUpdateIntent is a pure signal — does not perform the update.
7. Execution prerequisites are simple if-checks, not state transition rules.
8. No state machine framework. No transition table. No history.
9. Follow existing CommonJS style from A1 and Competition Core Domain.
10. Existing Legacy APIs and workflows must remain unchanged.

**Acceptance Criteria:**
- MatchContext unchanged from A1 (no new methods or fields)
- MatchExecutionContext constructed with MatchContext reference
- MatchExecutionContext.start() sets status to In Progress
- MatchExecutionContext.start() rejects if already started or terminal
- RefereeOperationalContext.recordResult() creates MatchResult
- MatchExecutionContext.submitResult() receives and stores result
- MatchExecutionContext.submitResult() rejects if not In Progress
- MasterOperationalContext.confirmResult() creates MasterConfirmation
- MatchExecutionContext.submitConfirmation() receives and stores confirmation
- MatchExecutionContext.complete() requires confirmed result
- MatchExecutionContext.cancel() sets status to Cancelled
- MatchExecutionContext.getCompetitionUpdateIntent() returns intent after completion
- CompetitionUpdateIntent does not perform actual competition update
- Existing A1 tests remain passing
- New execution tests added

**Testing Requirements:**

Use Node built-in test runner (`node:test`) with `node:assert/strict`.

Include tests for:
- MatchExecutionContext valid construction
- MatchExecutionContext rejects invalid MatchContext
- Valid match start (status → In Progress)
- Invalid match start (wrong status)
- RefereeOperationalContext.recordResult() creates valid MatchResult
- MatchExecutionContext.submitResult() stores result
- MatchExecutionContext.submitResult() rejected when not In Progress
- MasterOperationalContext.confirmResult() creates valid MasterConfirmation
- MatchExecutionContext.submitConfirmation() stores confirmation
- MatchExecutionContext.complete() valid after confirmation
- MatchExecutionContext.complete() rejected without confirmation
- MatchExecutionContext.cancel() valid
- MatchExecutionContext.cancel() rejected when terminal
- CompetitionUpdateIntent emitted after completion
- CompetitionUpdateIntent not emitted before completion
- MatchContext A1 contract unchanged (regression)
- Legacy regression protection

**Integration Boundary:**

This task does NOT modify:
- `Modern/api/`
- `Modern/services/`
- `Modern/repositories/`
- `Modern/db.sql`
- `Modern/engine/competition/`
- Legacy code

**Lifecycle Constraints:**

Do not implement:
- State machine framework
- State transition rules or transition table
- State history tracking
- Notification triggers
- Persistence logic
- Scoring calculation
- Ranking calculation

Do not add new architecture decisions.

**Code Style:**

Follow existing A1 patterns:
- CommonJS (`require` / `module.exports`)
- Class + constructor validation
- Private collections with `_` prefix + getter returning copies
- Error pattern: `OperationsError(code, message)`
- Lazy require for circular references

**Important Notes:**

This is the second operations domain implementation. Build on A1 foundation without modifying it. MatchContext stays stable. MatchExecutionContext carries execution behavior. Follow TES Handoff Protocol.
