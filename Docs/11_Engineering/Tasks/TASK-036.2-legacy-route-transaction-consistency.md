# Task-036.2 Legacy Route Transaction Consistency

Version:
1.0

Status:
Planned

Milestone:
036 Transaction Consistency & Legacy Unification

Author:
Paul Wu + ChatGPT

---

# Objective

Analyze and unify transaction handling for Legacy-compatible API routes.

The goal is to prevent multi-step database operations from bypassing the Service Layer transaction boundary.

---

# Background

Issue-035 established the Modern transaction architecture:

- Database layer owns transaction helper.
- Service layer owns transaction boundary.
- Repository layer executes database operations.

During architecture review, `api/legacy.js` was identified as still performing direct database operations through `pool.query()`.

This creates a second execution path outside the Modern transaction model.

---

# Scope

## In Scope

- Analyze all routes in `api/legacy.js`
- Identify direct database operations
- Classify which operations require transaction protection
- Propose migration path toward Service Layer usage
- Identify reusable existing services

---

## Out of Scope

Do not:

- migrate all Legacy business logic immediately
- change frontend behavior
- change API response contracts
- remove Legacy routes
- redesign database schema

---

# Constraints

- Preserve backward compatibility
- Modern Service Layer remains the transaction owner
- Avoid large-scale migration in a single task
- Prefer incremental migration

---

# Expected Outcome

A migration plan that identifies:

- current transaction risks
- affected routes
- recommended migration order
- required future tasks

---

# Verification Plan

Analysis task:

- No code changes required
- Confirm affected routes and database operations

---

# Acceptance Criteria

Complete when:

- Legacy transaction bypasses are documented
- Migration priority is defined
- No implementation scope expansion occurs

---

# Related Documents

- Roadmap-036-038.md
- Issue-035 Transaction Boundary Foundation
- Engineering Playbook