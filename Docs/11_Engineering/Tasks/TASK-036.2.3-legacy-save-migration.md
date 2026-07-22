# Task-036.2.3 Legacy Save Migration

Version:
1.0

Status:
Planned

Milestone:
036 Transaction Consistency & Legacy Unification

---

# Objective

Analyze and migrate the Legacy POST /api/save route to use the Modern Service Layer while preserving existing API behavior.

The goal is to eliminate duplicated database workflow and ensure transaction consistency.

---

# Background

The Legacy API currently implements schedule saving through direct SQL operations.

Modern architecture already provides:

competitionService.saveSchedule()

with:

- transaction boundary
- repository abstraction
- normalized workflow

This task evaluates migration of the Legacy save workflow into the Modern execution path.

---

# Scope

## In Scope

Analyze:

- Modern/api/legacy.js POST /api/save
- competitionService.saveSchedule()
- response compatibility
- behavior differences
- data consistency

Identify:

- migration risks
- required adjustments
- implementation approach

---

## Out of Scope

Do not:

- modify frontend behavior
- redesign save workflow
- change database schema
- modify scheduling algorithms
- migrate unrelated routes

---

# Constraints

- Preserve `/api/save` URL
- Preserve response contract
- Maintain Legacy compatibility
- Service layer owns transactions

---

# Expected Outcome

Provide:

- compatibility analysis
- migration plan
- affected files
- implementation risks

---

# Verification Plan

Analysis phase only:

No code changes.

---

# Acceptance Criteria

Complete when:

- Legacy save behavior is mapped
- Migration approach is approved
- Implementation scope is defined