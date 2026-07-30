# Scheduling Boundary — Executive Summary

**Task:** TASK-SCHED-001-A1

**Date:** 2026-07-30

**Status:** Documentation Complete

---

## What This Defines

Scheduling is the authoritative source of TOP's match schedule and assignment facts. It records when a match is planned and the relationships assigning courts and referees to that match. It also preserves the history of those assignment decisions.

Scheduling does not own the resources it assigns and does not execute the match.

## Guiding Principle

**TOP is a domain fact system, not a workflow engine.**

Scheduling captures human decisions as facts. It does not automatically choose resources, dispatch work, start matches, or coordinate other domains.

## Facts Owned by Scheduling

| Fact group | Facts owned |
|------------|-------------|
| Match schedule | Scheduled match placement and schedule date/time |
| Court assignment | Match-to-court relationship |
| Referee assignment | Match-to-referee relationship |
| Assignment history | Initial assignments, reassignments, and unassignments |

These are relationship facts. References to a court, referee, or match do not transfer ownership of those entities to Scheduling.

## The Critical Separation

> **Assignment is not ownership.**

| Resource Management | Scheduling | Match Operations |
|---------------------|------------|------------------|
| Owns court and referee facts | Consumes resource facts | Consumes relevant schedule context |
| Owns resource availability | Creates assignment relationships | Owns match execution facts |
| Manages resource lifecycle | Records schedule date/time and history | Owns scoring and outcome facts |
| Does not assign matches | Does not own or execute resources | Does not own scheduling assignments |

A scheduled court remains a Resource Management resource. An assignment must not be used as the definition of court or referee availability, and changing an assignment must not implicitly change a resource's lifecycle state.

## Human Planning Is Preserved

The modern boundary retains the useful legacy operating model:

- Manual scheduling is valid.
- A pool of matches awaiting planning may be shown to operators.
- Board-based planning and court queues may support human decisions.
- Reassignment is allowed as a new scheduling decision with preserved history.

The pool and board are planning representations. They do not make a task into a universal object containing resource, execution, score, result, or competition-record state.

## Outside the Boundary

Scheduling does not own:

- Court or referee identity, qualification, lifecycle, or availability
- Match execution, scoring, confirmation, or results
- Official competition records
- Competition structure, ranking, or advancement
- Analytics
- Automatic scheduling, optimization, or conflict resolution
- Notifications, dispatch, approvals, or workflow orchestration

No production model, API, persistence design, or user interface is introduced by this package.

## Outcome

The boundary is deliberately narrow:

**Resource Management provides resource facts. Scheduling records human-created schedule and assignment facts. Match Operations records execution and outcome facts.**

Each domain remains authoritative for its own facts, and none controls another domain through workflow behavior.

---

*End of Executive Summary*
