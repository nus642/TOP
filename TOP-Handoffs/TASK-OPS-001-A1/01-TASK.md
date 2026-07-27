# TASK-OPS-001-A1: Match Context Foundation

**Type:** CODE
**Priority:** High
**Dependency:** TASK-OPS-001-A, TASK-CORE-001

**Objective:** Implement the minimal operations domain foundation. Establish MatchContext as the operational aggregate root, define actor operational contexts (Master, Referee), and validate all construction and boundary invariants.

**Background:** TASK-OPS-001-A defined the Tournament Operation Core Loop Foundation architecture. This sub-task implements the first code deliverable: the domain objects that represent a match operational context, its actor boundaries, and its relationship to the Competition Core Domain via Entry reference.

**Domain Location:** `Modern/engine/operations/domain/`

**Scope Included:**
- MatchContext (operational aggregate root)
- OperationsError (operations domain error type)
- MasterOperationalContext (Master authority boundary)
- RefereeOperationalContext (Referee execution boundary)
- CommonJS exports (index.js)
- Domain tests

**Scope Excluded (Not Implemented):**
- Workflow methods
- State machine
- Authentication
- Authorization system
- Notification
- Scoring
- Ranking
- Scheduling algorithm
- API design
- Database design
- Frontend

**Implementation Boundary:**

MatchContext consumes Competition Core Domain references.

MatchContext does NOT own:

- Competition
- Group
- Event
- Entry
- Participant

These entities remain owned by the Competition Core Domain. MatchContext holds read-only references only.

**Domain Objects:**

| Object | File | Responsibility |
|--------|------|----------------|
| MatchContext | `match-context.js` | Operational aggregate root. Holds Entry reference, draw position, actor contexts |
| OperationsError | `operations-error.js` | Operations domain error type |
| MasterOperationalContext | `master-operational-context.js` | Master authority boundary validation |
| RefereeOperationalContext | `referee-operational-context.js` | Referee execution boundary validation |
| index | `index.js` | CommonJS unified exports |

**Implementation Principles:**

1. MatchContext is the single aggregate root for operations domain.
2. MasterOperationalContext and RefereeOperationalContext belong to MatchContext.
3. Entry reference is read-only â€?MatchContext does not modify Entry.
4. Construction validation only â€?no workflow methods.
5. Actor boundary invariants enforced at construction and association.
6. Follow existing CommonJS style from Competition Core Domain.
7. Existing Legacy APIs and workflows must remain unchanged.

**Acceptance Criteria:**
- MatchContext constructed with valid Entry reference
- MatchContext rejects invalid Entry reference
- MatchContext rejects missing draw position
- MasterOperationalContext validates authority boundary
- RefereeOperationalContext validates execution boundary
- Cross-boundary operations rejected with OperationsError
- Existing tests remain passing
- New domain tests added

**Testing Requirements:**

Use Node built-in test runner (`node:test`) with `node:assert/strict`.

Include tests for:
- Valid MatchContext construction with Entry reference
- Invalid MatchContext construction (missing Entry, invalid Entry)
- Invalid MatchContext construction (missing draw position)
- MasterOperationalContext boundary validation
- RefereeOperationalContext boundary validation
- Cross-boundary operation rejection
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

Do not implement workflow methods.

Only implement:
- Construction validation
- Actor boundary invariants
- Entry reference validation
- Draw position validation

Do not add new architecture decisions.

**Code Style:**

Follow existing Competition Core Domain patterns:
- CommonJS (`require` / `module.exports`)
- Class + constructor validation
- Private collections with `_` prefix + getter returning copies
- Error pattern: `OperationsError(code, message)`
- Lazy require for circular references

**Important Notes:**

This is the first operations domain code implementation. Keep changes minimal. No workflow methods. No state transitions. Only construction validation and boundary invariants. Follow TES Handoff Protocol.
