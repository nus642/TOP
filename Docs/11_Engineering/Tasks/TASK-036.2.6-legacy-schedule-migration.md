# Task-036.2.6 Legacy Schedule Migration

Version:
1.0

Status:
Planned

Milestone:
036 Transaction Consistency & Legacy Unification

---

# Objective

Analyze and migrate the Legacy GET /api/schedule route to use the Modern Service Layer.

The goal is to remove duplicated read logic and unify schedule retrieval through the Modern competition service.

---

# Background

The Legacy API currently retrieves competition schedule data directly through SQL queries.

The Modern architecture already provides:

competitionService.getSchedule()

which assembles tournament state through:

- tournament repository
- player repository
- match repository
- pairing repository

---

# Scope

## In Scope

Analyze:

- Modern/api/legacy.js GET /api/schedule
- competitionService.getSchedule()
- related repositories

Identify:

- response differences
- frontend compatibility
- read consistency considerations
- migration approach

---

## Out of Scope

Do not:

- modify frontend behavior
- redesign response contracts
- change database schema
- add new caching layer
- introduce read optimization

---

# Constraints

- Preserve GET /api/schedule URL
- Preserve existing response compatibility where required
- Keep Service Layer as business access point

---

# Expected Outcome

Provide:

- Legacy read workflow analysis
- Modern read workflow comparison
- Compatibility assessment
- Migration recommendation

---

# Verification Plan

Analysis phase only:

No code changes.

---

# Acceptance Criteria

Complete when:

- Legacy schedule read behavior is documented
- Response differences are identified
- Migration scope is approved

---

# Related Documents

- Roadmap-036-038.md
- TASK-036.2.5-legacy-match-migration.md
