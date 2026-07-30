# TASK-SCHED-001-A1: Scheduling Boundary Definition

**Status:** Documentation Complete

**Created:** 2026-07-30

**Scope:** Documentation only

---

## Purpose

Define the Scheduling boundary for TOP Modern architecture. This boundary identifies the scheduling and assignment facts TOP records while keeping resource ownership, match execution, and official competition records in their established domains.

## Core Principle

**TOP is a domain fact system, not a workflow engine.**

Scheduling records human scheduling decisions as domain facts. It does not automate the decisions, control the lifecycle of another domain's entities, or coordinate an end-to-end operational workflow.

## Boundary Definition

### Scheduling Owns

| Owned concern | Meaning |
|---------------|---------|
| Match scheduling facts | The recorded placement of a match in a schedule |
| Assignment relationships | Relationships created to associate a match with scheduled resources |
| Court assignment facts | Which court is assigned to a match |
| Referee assignment facts | Which referee is assigned to a match |
| Schedule date/time facts | When a match is scheduled to occur |
| Assignment history facts | The preserved history of assignment, reassignment, and unassignment decisions |

An assignment is a relationship recorded by Scheduling. Its references identify facts owned elsewhere; those references do not transfer ownership of the referenced match, court, or referee.

### Scheduling Does NOT Own

| Excluded concern | Owner or treatment |
|------------------|--------------------|
| Court identity and definition | Resource Management |
| Referee identity and qualification | Resource Management |
| Resource lifecycle | Resource Management |
| Availability management | Resource Management |
| Match execution | Match Operations |
| Scoring and live match facts | Match Operations |
| Match results and outcome facts | Match Operations |
| Official competition records | Competition Result Recording |
| Ranking | Separate downstream concern |
| Analytics | Separate reporting/analysis concern |

Scheduling also does not own the competition structure or reinterpret the match that is being scheduled. It records when and to which resources that match is assigned.

## Resource Management Relationship

**Resource Management provides resource facts. Scheduling consumes resource facts and creates assignments.**

The interaction must preserve these rules:

1. Resource Management remains authoritative for court and referee identities, definitions, qualifications, and availability facts.
2. Scheduling may read those facts to support a human scheduling decision.
3. Scheduling records the resulting court or referee assignment in its own boundary.
4. The assignment does not mutate or replace the referenced resource fact.
5. A scheduled court or referee remains owned by Resource Management.

**Assignment is not ownership.** A court assignment says that a court is related to a scheduled match; it does not make Scheduling the owner of the court. Likewise, a referee assignment does not make Scheduling the owner of referee identity, qualification, availability, or lifecycle.

Availability and assignment remain independently meaningful. Scheduling must not infer or write a resource's lifecycle or availability state solely from the existence, removal, or completion of an assignment.

## Match Operations Relationship

Scheduling provides assignment and date/time facts that may be consumed as context for match execution. Match Operations remains authoritative for what happens when the match is executed, including live match facts, scoring, confirmation, and outcomes.

The boundary interaction is factual rather than procedural:

1. Scheduling records the planned match, resource, and time relationships.
2. Match Operations may consume the relevant schedule and assignment facts.
3. Starting, conducting, completing, or abandoning a match does not become Scheduling behavior.
4. Match execution or completion does not implicitly rewrite assignments or resource state.
5. Outcome facts remain with Match Operations and official record creation remains with Competition Result Recording.

Scheduling does not start Match Operations, wait for its completion, or advance an operational workflow.

## Manual Planning and the Operational Task Pool

The following legacy behaviors remain valid:

- **Manual scheduling:** A human may make, change, or remove scheduling decisions.
- **Operational task pool:** Unscheduled or not-yet-placed matches may be presented as a pool of scheduling candidates.
- **Board-based planning:** A board may present the pool and court queues to support planning.
- **Human decision making:** The system records decisions; it does not assume an automatic scheduler.

The operational task pool is a scheduling projection or planning concept, not a universal domain model. An item appearing on a scheduling board does not become a general-purpose `Task` that owns resource, execution, result, competition, or workflow state.

Board movement represents a human request to record an assignment change. The board is a possible interaction model, not the Scheduling domain itself. Multiple planned matches may be displayed in a court queue, but that display does not establish court availability, execution state, or automatic dispatch behavior.

## Assignment History

Scheduling preserves assignment history as facts about scheduling decisions. History should make it possible to distinguish an initial assignment, reassignment, and unassignment without overwriting the fact that an earlier relationship existed.

Assignment history is not:

- Ownership history for the court, referee, or match
- A derived source of resource availability or lifecycle state
- Match execution history
- Scoring or result history
- A workflow log that instructs other domains what to do next

This task establishes ownership of assignment history but does not define its production schema, persistence mechanism, API, or correction model.

## Legacy Alignment

### Preserve

1. Manual court scheduling is valid.
2. Humans may plan from an operational pool of matches.
3. Board-based planning and court queues are useful interaction concepts.
4. A referee may be selected through a human operational decision.
5. Date-level scheduling remains valid, while the modern boundary also permits explicit time facts.
6. Reassignment is a scheduling fact and should retain history.

### Avoid

1. A task object becoming a universal object across domain boundaries.
2. Court or referee state being derived from assignment presence.
3. Referee state implicitly driving court state.
4. Automatic scheduling or optimization assumptions.
5. An assignment triggering match execution or record creation.
6. A workflow engine, task dispatcher, or cross-domain orchestration layer.
7. Copying the legacy generic KV storage or polling implementation as architecture.

## Explicit Non-Goals

This task does **not** design or introduce:

- Automatic scheduling, optimization, or conflict resolution
- Resource identity, qualification, lifecycle, or availability management
- Match execution, scoring, confirmation, or result recording
- Official competition record creation or correction
- Competition structure, advancement, or ranking
- Analytics or reporting pipelines
- Notifications, dispatch, approvals, or workflow orchestration
- A universal task model
- Production models, APIs, persistence, user interfaces, or board implementation

## Deliverables

| Document | Purpose |
|----------|---------|
| `01-TASK.md` | Scheduling boundary, relationships, and scope |
| `02-EXECUTIVE-SUMMARY.md` | Business-readable summary |
| `STATUS.md` | Completion record |

## Acceptance Criteria

- [x] Scheduling fact ownership is explicit.
- [x] Court, referee, date/time, and assignment-history facts are covered.
- [x] Assignment is distinguished from resource ownership and availability.
- [x] Resource Management remains the resource fact owner.
- [x] Match Operations remains the execution and outcome fact owner.
- [x] Manual scheduling, the operational task pool, board planning, and human decisions are preserved.
- [x] Universal task, derived resource state, automation, and workflow-engine behavior are excluded.
- [x] Competition records, ranking, and analytics remain outside the boundary.
- [x] No production code is changed.

---

*End of Task Definition*
