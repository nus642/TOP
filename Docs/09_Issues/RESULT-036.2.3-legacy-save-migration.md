# RESULT-036.2.3 Legacy Save Migration

Status:
Completed

## Changes

- Migrated POST /api/save from direct SQL implementation to competitionService.saveSchedule()
- Removed duplicated player/match persistence workflow
- Removed N+1 player ID lookup logic from legacy route
- Unified transaction handling through Service Layer

## Compatibility

- URL unchanged
- Error handling unchanged
- No active frontend caller depends on legacy response body
- Existing Modern frontend already uses /api/competition/save

## Architecture Impact

Before:

Legacy API
    |
    SQL
    |
    Database


After:

Legacy API
    |
    Service Layer
    |
    Repository
    |
    Database

## Verification

- node --check Modern/api/legacy.js
- git diff --check

## Follow-up

Continue incremental migration:

- DELETE /api/reset
- PUT /api/match/:id
- GET /api/schedule