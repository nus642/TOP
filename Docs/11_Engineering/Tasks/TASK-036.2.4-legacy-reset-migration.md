# Task-036.2.4 Legacy Reset Migration

Version:
1.0

Status:
Planned

Milestone:
036 Transaction Consistency & Legacy Unification

---

# Objective

Migrate the Legacy DELETE /api/reset route to delegate to the Modern Service Layer.

The goal is to remove duplicated database reset logic and ensure reset operations use the established transaction boundary.

---

# Background

The Legacy API currently performs competition reset operations through direct SQL statements.

The Modern architecture already provides:

competitionService.resetCompetition()

which handles:

- match cleanup
- pairing cleanup
- player cleanup
- player relationship cleanup
- tournament reset

inside a single database transaction.

---

# Scope

## In Scope

Analyze:

- Modern/api/legacy.js DELETE /api/reset
- competitionService.resetCompetition()

Identify:

- behavior differences
- response compatibility
- migration requirements

---

## Out of Scope

Do not:

- modify reset behavior
- change database schema
- migrate unrelated routes
- redesign reset workflow

---

# Constraints

- Preserve `/api/reset` URL
- Preserve existing HTTP behavior
- Service layer owns transaction boundary
- Keep migration incremental

---

# Expected Outcome

Provide:

- compatibility analysis
- implementation plan
- affected files
- migration risks

---

# Verification

Analysis phase only:

No code changes.

---

# Acceptance Criteria

Complete when:

- Legacy reset behavior is mapped
- Migration plan is approved
- Implementation scope is defined
