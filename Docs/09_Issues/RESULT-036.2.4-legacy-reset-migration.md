# RESULT-036.2.4 Legacy Reset Migration

Status:
Completed

## Changes

- Migrated DELETE /api/reset from direct SQL implementation to competitionService.resetCompetition()
- Removed 6 duplicated pool.query() calls from legacy route
- Unified transaction handling through Service Layer

## Compatibility

- URL unchanged
- Response body unchanged: { success: true }
- Error handling unchanged: { error: "重置失败" }
- No active frontend caller depends on legacy endpoint
- Existing Modern frontend already uses /api/competition/reset

## Architecture Impact

Legacy reset endpoint is now a compatibility adapter only.

Business logic ownership moved completely to:
competitionService.resetCompetition()

Transaction ownership remains in Service Layer.

Before:

Legacy API
    |
    SQL (6 direct queries, no atomicity)
    |
    Database


After:

Legacy API (thin adapter)
    |
    Service Layer (transaction boundary)
    |
    Repository
    |
    Database

## Verification

- node --check Modern/api/legacy.js
- git diff --check

## Follow-up

Continue incremental migration:

- PUT /api/match/:id
- GET /api/schedule
