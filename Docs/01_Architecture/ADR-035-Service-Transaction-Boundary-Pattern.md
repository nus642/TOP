# ADR-035 Service Transaction Boundary Pattern

## Status

Accepted.

## Context

Milestone 035 introduced transaction boundaries for Modern competition workflows that perform multiple database writes.

The goal is to prevent partial updates while preserving existing API behavior, database schema, and frontend behavior.

## Decision

The Service layer owns transaction boundaries.

A Service defines the business workflow and knows which Repository operations must commit or roll back as one unit. The Service opens that unit of work with `db.withTransaction()`.

Repositories receive an optional database connection.

When a Service opens a transaction, it passes the transaction connection to each Repository operation in the workflow. This ensures all related SQL statements use the same transaction. When no connection is provided, the Repository can use the default database connection for standalone operations.

Repositories must not create transactions.

A Repository is responsible for persistence only. If a Repository starts its own transaction, transaction ownership becomes hidden from the Service, business workflows can be split across multiple commits, and rollback behavior becomes inconsistent.

## Pattern

```text
Service
  ↓
db.withTransaction()
  ↓
Repository(connection)
  ↓
Database
```

## Verified Workflows

The pattern has been applied and verified for:

- `updateMatch()`
- `resetCompetition()`
- `generateCompetition()`
- `saveSchedule()`
