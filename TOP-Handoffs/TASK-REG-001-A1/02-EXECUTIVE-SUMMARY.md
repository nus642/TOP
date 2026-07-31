# Registration Boundary — Executive Summary

**Task:** TASK-REG-001-A1

**Date:** 2026-07-31

**Status:** Documentation Complete

---

## What This Defines

Registration is the authoritative source of competition-scoped registration facts. It records accepted entrants, team roster membership and submissions, satisfaction of Competition-defined participation constraints, and confirmed lineup selections where a competition uses lineups.

Registration does not define the competition, schedule a match, or decide who actually participates when a match is executed.

## Guiding Principle

**TOP is a domain fact system, not a workflow engine.**

Registration records facts established by authorized actors. It does not run applications through an approval lifecycle, coordinate other domains, collect payment, or automatically advance an entrant into a match.

## Facts Owned by Registration

| Fact group | Facts owned |
|------------|-------------|
| Entry | Registration facts and accepted entrant facts scoped to a competition |
| Classification | Accepted association to Competition-defined groups, divisions, or categories |
| Team roster | Roster membership and team roster submission facts |
| Participation constraints | Satisfaction facts and relevant evidence for Competition-defined eligibility or participation constraints |
| Confirmed selection | Lineup submission or confirmed selection of roster entrants into Competition-defined slots, where applicable |

Player is not currently justified as a standalone domain. In this boundary a person is a competition-scoped entrant or registration subject; no global profile, account, cross-competition history, ranking, or analytics ownership is implied.

## The Critical Separation

> **Registration is not match participation.**

A person may be accepted, listed on a roster, eligible, and selected in a lineup without becoming an actual participant in a particular match.

| Competition | Registration | Scheduling | Match Operations |
|-------------|--------------|------------|------------------|
| Defines structure, slots, and participation rules | Records entrants, rosters, rule satisfaction, and confirmed selections | Records dates, resource assignments, history, and assignment conflicts | Records actual participants and execution facts |

Team membership, lineup selection, and actual participation are related facts, but they are not interchangeable. A reference between them does not transfer ownership.

## Domain Relationships

### Competition

Competition defines groups, categories, team contest structure, lineup slots, roster/eligibility constraints, and rules such as whether lineup reuse is permitted. Registration records who was accepted into that structure and whether the defined constraints were satisfied.

### Scheduling

Scheduling may consume entrant or confirmed-lineup facts when a human creates a schedule. It owns date/time, court/referee assignments, assignment history, and conflicts between assignments. Scheduling an entrant does not change registration status or prove actual participation.

### Match Operations

Match Operations may use Registration facts as context, but owns the participant accepted into each match side or position at execution. A confirmed lineup is prospective; the actual participant is a match fact and remains distinct even if it originated from that lineup.

## Actors, Not Owners

Master, admin, leader, and player are actors. Their authorized actions create facts in Registration, Scheduling, Match Operations, Competition, or another appropriate boundary; the role or screen used for the action does not own a domain.

## Outside the Boundary

Registration does not own or introduce:

- competition structure, match generation, or participation-rule definitions;
- scheduling, automatic scheduling, or court/referee assignments;
- match execution, actual match participants, scoring, outcomes, or official competition records;
- a workflow engine, approval state machine, notifications, or dispatch;
- payment implementation;
- accounts, authentication, global identity, or a standalone Player domain;
- ranking, advancement, analytics, or player history;
- production models, APIs, persistence, or user interfaces.

## Decisions Still Required

Business owners must later decide:

- whether an entrant may have multiple entries, teams, groups, or categories in one competition;
- whether lineup reuse is permitted and whether it varies by competition;
- when rosters and lineups become final and how corrections preserve history;
- whether and how actual participants may differ from confirmed lineups;
- which participation constraints and evidence are required, including whether administrative assertions are acceptable;
- whether withdrawal, injury, rest, or future unavailability must be recorded and by which boundary;
- which entrant identity/display value official competition records preserve; and
- when team roster submission is distinct from membership and what confirmation evidence it requires.

These are future policy decisions, not reasons to create a workflow or implementation in this task.

## Outcome

The boundary is deliberately fact-focused:

**Competition defines participation structure and rules. Registration records accepted entrants, rosters, satisfaction, and confirmed selections. Scheduling records assignments. Match Operations records actual participants and execution.**

---

*End of Executive Summary*
