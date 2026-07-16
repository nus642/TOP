# ISSUE-transaction-boundary-foundation-035

## Objective

Introduce transaction boundaries into Modern competition workflows.

Goal:

Prevent partial database updates during multi-step operations.

## Scope

Target workflows:

- updateMatch()
- resetCompetition()
- generateCompetition()
- saveSchedule()


## Constraints

- No API changes
- No frontend changes
- No schema redesign
- Keep tournamentId = 1
- Preserve current response behavior


## Architecture Principle

Database layer:
- owns transaction helper

Service layer:
- owns transaction boundary

Repository layer:
- executes SQL using provided connection


## Acceptance Criteria

- Failed workflow rolls back completely
- Existing success responses unchanged
- Existing endpoints unchanged
- Existing database schema unchanged