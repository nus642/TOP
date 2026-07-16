# ISSUE-modern-architecture-stabilization-034.1

## Status

In Progress


## Objective

Stabilize TOP Modern Architecture after Node v1 migration.

Make Modern API/Service/Repository the single execution path.


## Background

Task 033 completed Node v1 migration.

Current state:

Modern API:
 /api/competition/*

Legacy compatibility:
 /api/*

server.js still contains direct SQL and business logic.


## Scope

Included:

- Remove direct SQL from server.js
- Move compatibility routes to Modern service path
- Keep current API behavior
- Update API documentation


Excluded:

- Transaction
- Multi tournament
- Real-time sync
- Backend scheduling engine
- Statistics redesign


## Acceptance Criteria

- server.js contains no competition SQL
- Legacy API paths still work
- Modern service layer is single business entry
- Existing integration tests pass