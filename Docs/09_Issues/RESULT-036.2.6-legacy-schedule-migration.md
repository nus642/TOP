# RESULT-036.2.6 Legacy Schedule Migration

Status:
Completed

## Changes

Migrated:

GET /api/schedule

from direct SQL queries in legacy.js

to:

competitionService.getSchedule()

## Architecture Impact

Before:

Legacy API
→ SQL
→ Database


After:

Legacy API
→ Service Layer
→ Repository
→ Database

## Compatibility

- URL unchanged
- Response structure preserved
- Mode inference changed from hardcoded value to actual state detection
- No active frontend dependency affected

## Improvements

- Removed direct database access from legacy.js
- Removed duplicated read logic
- Improved correctness of competition mode detection

## Verification

- node --check Modern/api/legacy.js
- git diff --check
