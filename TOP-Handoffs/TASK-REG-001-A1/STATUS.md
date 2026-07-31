# TASK-REG-001-A1 Status

**Task:** Registration Boundary Definition

**Status:** Documentation Complete

**Last Updated:** 2026-07-31

---

## Completed

- [x] Defined Registration as a focused domain fact boundary rather than a workflow engine.
- [x] Assigned ownership of registration and accepted entrant facts.
- [x] Assigned ownership of team roster membership and roster submission facts.
- [x] Assigned ownership of satisfaction facts and evidence for Competition-defined participation constraints.
- [x] Assigned ownership of lineup submission and confirmed-selection facts where applicable.
- [x] Distinguished entrants, roster members, lineup selections, and actual match participants.
- [x] Kept competition structure and participation-rule definitions in Competition.
- [x] Kept schedule, assignment, history, and assignment-conflict facts in Scheduling.
- [x] Kept actual participant, execution, scoring, confirmation, and outcome facts in Match Operations.
- [x] Confirmed Master, admin, leader, and player are actors rather than domain owners.
- [x] Excluded workflow, approvals, payment, identity/accounts, ranking, analytics, player history, and automatic scheduling.
- [x] Recorded unresolved business questions without designing implementation.
- [x] Confirmed this package makes no production-code changes.

## Deliverables

| File | Status |
|------|--------|
| `TOP-Handoffs/TASK-REG-001-A1/01-TASK.md` | ✅ Complete |
| `TOP-Handoffs/TASK-REG-001-A1/02-EXECUTIVE-SUMMARY.md` | ✅ Complete |
| `TOP-Handoffs/TASK-REG-001-A1/STATUS.md` | ✅ Complete |

## Ownership Confirmed

| Domain | Fact ownership |
|--------|----------------|
| Competition | Competition structure, team contests, lineup slots, participation rules, and official competition records |
| Competition Result Recording |  official competition records |
| Registration | Accepted entrants, competition roster membership/submission, participation-constraint satisfaction/evidence, and confirmed lineup selections |
| Scheduling | Schedule date/time, court/referee assignments, assignment history, and participant assignment conflicts |
| Match Operations | Actual match participants, execution, live match facts, scoring, confirmation, and outcomes |

## Key Principles Established

1. TOP is a domain fact system, not a workflow engine.
2. Player is not currently justified as a standalone domain.
3. Registration records whether entrants satisfy participation rules; Competition defines those rules.
4. Registration, roster membership, lineup selection, and actual match participation are distinct facts.
5. Match Operations owns the actual participant in a specific match.
6. Scheduling owns assignments and assignment conflicts without changing registration facts.
7. Master, admin, leader, and player are actors, not domain owners.

## Open Business Decisions

- Multiplicity of entries, team memberships, groups, divisions, and categories within one competition.
- Entrant reuse across lineup slots.
- Roster/lineup finality, correction, replacement, withdrawal, versioning, and history.
- Permitted differences between a confirmed lineup and actual match participants, including required evidence.
- Required participation constraints and acceptable evidence or administrative assertions.
- Ownership and meaning of future withdrawal, injury, rest, or unavailability facts.
- Authoritative entrant identity/display value preserved in official competition records.
- Whether roster submission and membership are always separate and what confirms a submission.

## Scope Confirmation

No production code, model, API, persistence design, registration workflow engine, approval state machine, payment implementation, identity/account system, ranking, analytics, player-history capability, automatic scheduler, or match-operation behavior has been designed or added.

## Next Step

Use this package as the source constraint for later Registration modeling. Resolve the listed business questions explicitly before authorizing any production implementation; do not infer answers from Legacy UI or storage behavior.

---

*End of Status*
