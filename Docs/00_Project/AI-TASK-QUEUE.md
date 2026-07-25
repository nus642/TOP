# AI Task Queue

## READY

### TASK-TOP-007C-3
Title:
Complete Modern Scoped Schedule Lifecycle

Type:
CODE

Priority:
Medium

Dependency:
TASK-TOP-007C-2

Description:
Complete remaining competition-scoped schedule lifecycle routes.

Scope:

Included:
- Add scoped reset route
- Add scoped generate route
- Preserve legacy compatibility
- Add regression tests

Excluded:
- Schedule algorithm changes
- Pairing logic changes
- Database redesign
- Frontend migration

## BLOCKED

## BACKLOG

### TASK-REG-001
Title:
Modern Competition Registration

Type:
CODE

Priority:
Medium

Dependency:
TASK-REG-001-A

Description:
Implements modern competition registration foundation. Must follow Entry abstraction architecture.

### TASK-MATCH-001
Title:
Modern Match Lifecycle Foundation

Type:
CODE

Priority:
Medium

### IDEA-MATCH-001
Title:
Deterministic Match Sequence Number

Type:
IDEA

Priority:
Low

## DONE

### TASK-TOP-007C-2
Title:
Modern Scoped Schedule Routes

Type:
CODE

Priority:
High

Dependency:
TASK-TOP-007C-1
Status Context:
- PR #18 merged
- Competition scoped schedule route implemented
- Modern API boundary established
- Regression tests added

### TASK-TOP-007C-3
Title:
Complete Modern Scoped Schedule Lifecycle

Type:
CODE

Priority:
Medium

Dependency:
TASK-TOP-007C-2
Status Context:
- PR merged
- Scoped reset route implemented
- Scoped generate route implemented
- Legacy schedule lifecycle routes preserved
- Regression tests added
  - 72 tests passing

  ### TASK-REG-001-A
  Title:
  Registration Domain Model

  Type:
  ARCHITECTURE

  Status:
  Architecture Decision Recorded
