# Task-036.2.5 Legacy Match Migration

Version:
1.0

Status:
Planned

Milestone:
036 Transaction Consistency & Legacy Unification

---

# Objective

Migrate the Legacy PUT /api/match/:id route to delegate to the Modern Service Layer.

The goal is to remove duplicated match update logic and ensure score updates use the established transaction boundary.

---

# Background

The Legacy API currently handles match score updates directly through SQL operations.

The Modern architecture already provides:

competitionService.updateMatch()

which encapsulates:

- match score update
- match status update
- player runtime statistics reset

inside the Service Layer transaction boundary.

---

# Scope

## In Scope

Analyze:

- Modern/api/legacy.js PUT /api/match/:id
- competitionService.updateMatch()
- related match repository operations
- player statistics reset behavior

Identify:

- workflow differences
- response compatibility
- migration risks
- implementation approach

---

## Out of Scope

Do not:

- redesign scoring logic
- modify statistics algorithms
- change API contract
- change database schema
- migrate unrelated routes

---

# Constraints

- Preserve existing URL:
  
  PUT /api/match/:id

- Preserve request format
- Preserve response behavior
- Service Layer owns transaction boundary

---

# Expected Outcome

Provide:

- Legacy workflow analysis
- Modern workflow comparison
- Compatibility assessment
- Migration recommendation

---

# Verification Plan

Analysis phase only:

No code changes.

---

# Acceptance Criteria

Task is complete when:

- Legacy match update behavior is documented
- Migration risk is identified
- Implementation scope is approved

---

# Related Documents

- Roadmap-036-038.md
- TASK-036.2.3-legacy-save-migration.md
- TASK-036.2.4-legacy-reset-migration.md
