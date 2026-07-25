# TASK-TOP-007C-2

## Modern Scoped Schedule Routes

Status:
Draft

Type:
CODE

Priority:
High

Risk:
High

Dependency:

TASK-TOP-007C-1

---

# 1. Objective

Migrate competition schedule lifecycle APIs from implicit competition context to explicit competition-scoped routes.

The goal is to make competition ownership explicit at the API boundary while preserving existing business behavior and backward compatibility.

---

# 2. Background

TOP is migrating from legacy-style APIs toward a Modern architecture.

Previous implementations may obtain competition context through:

- request body fields
- query parameters
- legacy hard-coded defaults

This task introduces explicit competition scope at the API route level.

---

# 3. Current State

Current pattern:


POST /api/competition/save

{
tournamentId: xxx,
...
}


or:


POST /api/competition/save?tournamentId=xxx


Some legacy paths may still use:


tournamentId = 1


---

# 4. Target State

Modern routes should express competition ownership explicitly.

Example:


POST /api/competition/:competitionId/schedule


The API layer extracts competition context from route parameters.

The service layer receives validated competition context.

Repository operations continue enforcing competition isolation.

---

# 5. Scope

## Included

- Define new competition-scoped schedule routes
- Propagate competitionId through API → Service → Repository
- Preserve existing transaction boundaries
- Maintain existing schedule lifecycle behavior
- Add regression tests

---

## Excluded

This task does NOT include:

- Removing all legacy APIs
- Removing tournamentId = 1 compatibility behavior
- Redesigning schedule generation algorithms
- Changing pairing logic
- Changing database schema
- Frontend migration

---

# 6. Migration Strategy

Migration should be incremental.

Phase 1:

Add modern scoped routes.

Phase 2:

Migrate internal callers.

Phase 3:

Deprecate legacy routes.

Phase 4:

Remove legacy compatibility when safe.

---

# 7. Acceptance Criteria

The task is complete when:

- Competition context is explicit in modern schedule routes
- Invalid competition IDs are rejected
- Non-existent competitions cannot trigger schedule writes
- Existing lifecycle transaction behavior remains unchanged
- Existing tests continue passing
- New API regression tests cover new routes
- Legacy behavior remains functional

---

# 8. Risks

Main risks:

- Breaking existing clients
- Duplicating route behavior
- Inconsistent competition context handling

Mitigation:

- Keep migration incremental
- Preserve legacy adapter paths
- Validate context at API boundary

---

# 9. Expected Deliverables


01-TASK.md
02-EXECUTIVE-SUMMARY.md
03-PATCH.diff
04-FULL-REPORT.md
STATUS.md


Implementation should be delivered through Pull Request following TES Handoff Protocol.