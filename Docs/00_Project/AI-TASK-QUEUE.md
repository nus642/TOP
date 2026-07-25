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

TASK-DOC-001
Referee Manual

TASK-DOC-002
Organizer Manual

TASK-DOC-003
Player Guide

TASK-TEST-001
Title:
Regression Test Expansion
