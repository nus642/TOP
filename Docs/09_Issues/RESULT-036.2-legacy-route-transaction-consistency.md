# RESULT-036.2 Legacy Route Transaction Consistency

Status:
Completed

## Objective

Move all legacy API routes behind the Modern Service Layer.

## Completed Routes

- GET /api/schedule
- POST /api/generate
- POST /api/save
- PUT /api/match/:id
- DELETE /api/reset

## Architecture Impact

Before:

Route → SQL → Database


After:

Route → Service → Repository → Database

## Key Improvements

- Removed direct database access from legacy.js
- Unified transaction ownership
- Eliminated duplicated business workflows
- Improved consistency between legacy and modern paths

## Verification

- node --check
- git diff --check

## Next

Proceed to 036.3 / 037 according to roadmap.
