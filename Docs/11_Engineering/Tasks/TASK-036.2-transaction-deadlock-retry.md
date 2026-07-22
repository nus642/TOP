# Task-036.2 Transaction Deadlock Retry

Version:
1.0

Status:
Planned

Milestone:
036 Transaction Consistency & Legacy Unification

---

# Objective

Improve the database transaction utility by adding retry handling for transient deadlock failures.

---

# Background

The current transaction boundary implementation provides:

- begin transaction
- commit
- rollback
- connection release

However, it performs only a single attempt.

Under concurrent writes, InnoDB may raise deadlock errors. These transient failures can often be resolved by retrying the transaction.

---

# Scope

## In Scope

Analyze:

- Modern/database/db.js
- withTransaction()

Review:

- current transaction flow
- error handling
- retry strategy
- deadlock detection

---

## Out of Scope

Do not:

- modify repository SQL
- redesign transaction architecture
- change database schema
- add distributed locking

---

# Expected Outcome

Provide:

1. Current transaction implementation analysis
2. Deadlock risk assessment
3. Retry design recommendation
4. Maximum retry count recommendation
5. Implementation scope

---

# Verification

Analysis only.

No code changes.

---

# Acceptance Criteria

Migration plan approved before implementation.
