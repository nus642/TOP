# Contest Generation Boundary — Executive Summary

**Task:** TASK-COMP-003-A1

**Title:** Contest Generation Boundary

**Date:** 2026-07-31

**Status:** Documentation Complete

---

## What This Defines

Contest Generation establishes the prospective fact that a particular contest exists. Its narrow output identifies the competition context, the two configured sides, and—when authoritatively defined—the contest kind, format, and relationship to a parent team encounter.

## Guiding Principle

**TOP is a domain fact system, not a workflow engine.**

Generation records a contest fact. It does not advance a task through stages or command Scheduling, Match Operations, or Competition Result Recording to act.

## The Boundary in One Line

> **Competition Configuration defines rules and structure. Contest Generation creates contest facts. Scheduling places contests. Match Operations executes contests. Competition Result Recording records official results.**

## Facts Created by Generation

Contest Generation may establish:

- that a contest exists;
- its competition and structural context;
- its two configured entrant or team sides;
- whether it is an individual contest, team encounter, or constituent contest;
- an explicit parent-encounter relationship and ordered constituent position; and
- discipline and scoring/game format only when authoritatively configured.

Generation provenance may identify the rule, explicit pairing, authorized import, or manual assertion that established the contest. Legacy guesses, parser defaults, technical IDs, and placeholders are not automatically authoritative domain facts.

## Relationship to Neighboring Boundaries

| Boundary | Relationship to Contest Generation |
|----------|------------------------------------|
| Competition Configuration | Defines the pairing rules, structure, encounter composition, and configured format that Generation applies |
| Registration | Supplies accepted entrants, roster facts, constraint satisfaction, and prospective confirmed lineups; Generation does not own or alter them |
| Scheduling | Places an existing contest in time and assigns courts/referees; Generation creates no placement fact |
| Match Operations | Records actual participants and execution; generated sides and lineups are prospective context only |
| Competition Result Recording | Records the official result; Generation creates neither an outcome nor an official record |

These relationships are references between facts, not workflow transitions.

## Legacy Behaviors Interpreted Narrowly

Legacy TOP evidences all-pairs group expansion, import of explicit `VS` pairings, authorized manual pairing, team-encounter creation, and constituent-contest creation from lineups. The modern boundary preserves their fact-level meaning without adopting:

- a universal `Task` or room object;
- automatic scheduling or dispatch;
- technical IDs, statuses, array-index truncation, or parser heuristics as business rules;
- inferred/default formats as Competition Configuration;
- prospective player slots as proof of actual participation; or
- destructive generation and clearing as correction governance.

## What Generation Does Not Prove

A generated contest does not prove a date, time, court, referee, actual participant, start, score, completion, outcome, confirmation, or official result. Making it visible in an operational pool does not schedule or start it.

## Non-Goals

This package does not design production code or data models, draws or advancement, registration workflows, scheduling, resource assignment, match execution, official-result handling, ranking, analytics, notifications, correction policy, or cross-domain orchestration.

## Outcome

Contest Generation is deliberately narrow: it applies authoritative Competition Configuration to valid inputs and records the resulting contest facts. Every neighboring boundary remains authoritative for its own facts, and no fact automatically drives another boundary through a workflow.

---

*End of Executive Summary*
