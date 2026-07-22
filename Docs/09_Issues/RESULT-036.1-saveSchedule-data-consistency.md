# RESULT-036.1 SaveSchedule Data Consistency Fix

Status:
Completed

## Changes

- Unified saveSchedule cleanup order with resetCompetition/generateCompetition
- Added player_partners cleanup
- Added player_opponents cleanup
- Made pairing cleanup unconditional before optional fixed-pair creation

## Changed Files

- Modern/services/competition.service.js

## Verification

- node --check Modern/services/competition.service.js
- git diff --check

## Decisions

No API, schema, or repository changes were introduced.

## Follow-up

Future 036 tasks may address legacy route transaction consistency.