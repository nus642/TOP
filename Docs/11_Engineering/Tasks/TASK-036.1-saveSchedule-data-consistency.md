# Task-036.1 SaveSchedule Data Consistency Fix

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

Fix data consistency issues in saveSchedule() identified during transaction architecture review.

The goal is to make saveSchedule() behavior consistent with resetCompetition() and generateCompetition(), without changing API contracts or database schema.

---

# Background

Issue-035 established the Service Layer Transaction Boundary pattern.

During post-implementation review, several consistency gaps were identified:

- saveSchedule() does not clean player relationship tables
- deletion order differs from other write workflows
- stale pairing data may remain when switching competition modes

These issues may create orphan data or inconsistent tournament state.

---

# Scope

## In Scope

- Review saveSchedule() cleanup workflow
- Add missing cleanup for player_partners
- Add missing cleanup for player_opponents
- Align deletion order with existing transaction pattern
- Ensure pairing cleanup is consistent across modes

---

## Out of Scope

Do not:

- modify API contracts
- modify database schema
- introduce tournament context changes
- add batch insert optimization
- migrate legacy routes
- redesign repository architecture

---

# Constraints

- Preserve existing Service → Repository architecture
- Preserve existing repository interfaces where possible
- Keep transaction boundary ownership in Service layer
- Avoid unrelated refactoring

---

# Expected Behavior

Before saving a new schedule:

1. Previous tournament data is removed safely.
2. No orphan relationship records remain.
3. Fixed-pair and round-robin transitions do not leave stale pairing data.
4. All operations remain inside a single transaction.

---

# Verification Plan

Required:

- git diff
- git diff --check
- node --check Modern/services/competition.service.js

Additional verification:

- Review transaction connection propagation
- Confirm API response remains unchanged

---

# Acceptance Criteria

Task is complete when:

- saveSchedule cleanup behavior matches resetCompetition/generateCompetition consistency
- no unrelated files are changed
- verification passes
- implementation result is recorded

---

# Related Documents

- Roadmap-036-038.md
- Issue-035 Transaction Boundary Foundation
- Engineering Playbook Rule-020