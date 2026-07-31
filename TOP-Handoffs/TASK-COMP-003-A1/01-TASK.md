# TASK-COMP-003-A1: Contest Generation Boundary

**Status:** Documentation Complete

**Created:** 2026-07-31

**Depends On:** `TOP-Handoffs/LEGACY-MATCH-GENERATION-ANALYSIS.md`

**Scope:** Documentation only

---

## Purpose

Define the Contest Generation boundary for TOP Modern architecture: the facts established when Competition rules and eligible competition inputs are applied to create contests, and the separation of those facts from Registration, Scheduling, Match Operations, and Competition Result Recording.

## Core Principle

**TOP is a domain fact system, not a workflow engine.**

Contest Generation records that contests have been established. It does not advance a process, dispatch work, place contests, execute them, or record their official results.

## Boundary Statement

> **Competition Configuration defines rules and structure. Contest Generation creates contest facts. Scheduling places contests. Match Operations executes contests. Competition Result Recording records official results.**

These are fact-ownership boundaries, not sequential workflow stages. A fact in one boundary may be referenced by another without transferring ownership or commanding that boundary to act.

## Inputs to Contest Generation

Contest Generation may consume authoritative facts from other boundaries:

| Source | Input facts |
|--------|-------------|
| Competition Configuration | Competition mode, groups, pairing rules, explicit opponent relationships, team-encounter composition, ordered constituent slots, discipline, and configured scoring/game format |
| Registration | Accepted entrants, accepted group/category associations, team roster membership, participation-constraint satisfaction, and confirmed lineup selections |
| Authorized import or manual assertion | An explicitly supplied pairing when its authority and competition context are established |

Consuming an input does not make Contest Generation its owner. Generation must not infer authority merely from a display string, spreadsheet position, legacy default, screen, or actor.

## Facts Created During Contest Generation

The narrow output is a prospective **contest fact**. Depending on the configured competition, generation establishes:

| Created fact | Meaning |
|--------------|---------|
| Contest existence | A particular contest has been established in the competition |
| Competition context | The competition and, where applicable, group or structural context to which it belongs |
| Configured sides | The two entrant or team sides that are to contest it |
| Contest kind | Whether it is an individual contest, team encounter, or constituent contest, when authoritatively configured |
| Parent relationship | A constituent contest's explicit relationship to its team encounter |
| Constituent position | The configured ordered position of a constituent contest within an encounter |
| Configured discipline and format | Singles, doubles, more specific discipline, games, target, cap, or method only when established by authoritative Competition Configuration |
| Generation provenance | The authoritative rule, explicit pairing, import, or manual assertion used to establish the contest, if recorded |

The durable minimum is that a contest exists with identified configured sides and competition context. Optional details are contest facts only when their authority is established; legacy guesses and defaults do not become Competition rules merely because they were persisted.

### What a Contest Fact Does Not Prove

A generated contest is prospective. It does not prove:

- when or where the contest will occur;
- that a court or referee has been assigned;
- who actually participates;
- that play has started, progressed, or completed;
- an outcome, confirmation, or official result; or
- that another domain must now take an action.

## Generation Behaviors Supported by the Legacy Evidence

The boundary permits the evidenced ways of establishing contest facts without promoting their implementation details into the domain model:

1. **Configured all-pairs expansion:** applying a rule that every unordered pair of accepted entrants in a group meets once.
2. **Explicit-pairing import:** recording an already expressed `A VS B` pairing whose source is authoritative.
3. **Authorized manual creation:** recording an explicitly supplied contest assertion.
4. **Team-encounter creation:** establishing a team-versus-team encounter.
5. **Constituent-contest creation:** applying configured encounter composition and prospective lineup selections to establish the contests within a team encounter.

These mechanisms can establish the same kind of contest fact. They do not imply a draw engine, bracket advancement, a scheduler, or a workflow lifecycle.

## Competition Configuration Relationship

**Competition Configuration defines rules and structure; Contest Generation applies them to establish particular contests.**

Competition Configuration owns:

- competition mode and structural definitions;
- groups, divisions, categories, and team encounter structure;
- pairing rules, such as one meeting for every unordered pair in a group;
- explicit contest templates and ordered constituent slots;
- configured disciplines and scoring/game formats; and
- participation constraints that Registration evaluates.

Contest Generation references those definitions and creates the concrete fact that specified sides are paired in a contest. It does not redefine the rule while applying it. A configuration change and a previously generated contest remain distinct facts; whether contests are corrected, superseded, or regenerated requires explicit governance rather than silent mutation.

Legacy parser defaults, array ordering, string punctuation, and forced fallbacks are not authoritative configuration. In particular, the forced three-doubles path does not establish a universal team format.

## Registration Relationship

**Registration supplies prospective participation facts; Contest Generation creates contests from valid competition inputs.**

Registration remains authoritative for accepted entrants, group/category association, roster membership, participation-constraint satisfaction, roster submissions, and confirmed lineup selections. Generation may reference those facts to identify configured sides or create constituent contests.

The boundaries must preserve these distinctions:

- being registered does not itself create a contest;
- being on a roster does not define encounter composition;
- a confirmed lineup is prospective and does not prove actual participation;
- Generation does not accept entrants, change rosters, or determine Registration-owned constraint satisfaction; and
- creating a contest does not mutate or consume the underlying Registration fact.

If lineup facts help establish a constituent contest, the generated contest may retain provenance to that selection. Match Operations still owns the actual participant fact when the contest is executed.

## Scheduling Relationship

**Contest Generation creates contests; Scheduling places them.**

Scheduling owns scheduled date/time, court and referee assignments, queue or board placement when authoritative, and assignment/reassignment/unassignment history. A generated contest may be shown in an operational pool as a candidate for human planning, but pool presence is not placement and does not create a universal `Task` domain.

Generation must not:

- assign a date, time, court, or referee;
- infer a schedule from contest order, ID, room creation time, or spreadsheet layout;
- treat persistence or visibility as dispatch; or
- automatically trigger scheduling.

Scheduling may reference the contest without changing what contest exists. Reassignment changes placement facts, not the generated contest fact.

## Match Operations Relationship

**Contest Generation establishes the prospective contest; Match Operations records its execution.**

Match Operations owns actual participants, start and execution timestamps, live status, service, scoring, games and sets, interruption, abandonment, walkover, completion, outcome, confirmations, signatures, and other execution evidence.

Generated sides and prospective player slots provide context, not execution evidence. A contest does not start because it was generated or exposed to a referee pool. Any difference between a configured side or lineup and actual participation must be represented by the appropriate facts and governance, not hidden by overwriting generation inputs.

Generation neither conducts the contest nor consumes an outcome to generate downstream contests unless a separately defined Competition rule and generation capability explicitly support that behavior. Knockout advancement is not established by the current legacy evidence.

## Competition Result Recording Relationship

**Competition Result Recording records the official result; Contest Generation creates no result.**

Match Operations may produce trusted outcome and confirmation facts. Competition Result Recording separately preserves the authoritative competition result and its correction history. Contest Generation creates neither an operational outcome nor an official record, and contest creation must not be modeled as a command or automatic transition to result recording.

## Fact Ownership Summary

| Boundary | Authoritative responsibility |
|----------|------------------------------|
| Competition Configuration | Defines competition rules and structure |
| Registration | Records accepted entrants, rosters, constraint satisfaction, and confirmed prospective selections |
| Contest Generation | Establishes that particular contests exist, with configured sides and composition |
| Scheduling | Records when and where contests are placed and which resources are assigned |
| Match Operations | Records actual participants and what happens during execution |
| Competition Result Recording | Records the official competition result |

## Legacy Alignment

### Preserve

1. All-pairs expansion can establish one contest for each unordered pair when that is the configured rule.
2. Authoritative explicit pairings can be imported or entered manually.
3. Team encounters and their constituent contests are distinct facts linked explicitly.
4. Confirmed lineup selections may inform prospective constituent contests without proving participation.
5. Generated contests may be made available to human scheduling and operations views.

### Avoid

1. A universal task object spanning configuration, generation, scheduling, execution, and results.
2. Treating technical IDs, side orientation, array indexes, room codes, or statuses as sporting rules.
3. Inferring identities, disciplines, or formats from punctuation or placeholder strings.
4. Treating legacy defaults as organizer decisions.
5. Pairing unequal lineups by truncation or accepting incompatible constituent definitions without an explicit rule.
6. Treating room status `completed` as completion of play.
7. Destructive regeneration or deletion without explicit correction, provenance, or supersession semantics.
8. Turning import, generation, pool visibility, scheduling, execution, and recording into an automatic workflow.

## Explicit Non-Goals

This task does **not** design or introduce:

- production models, schemas, APIs, persistence, services, user interfaces, or authorization;
- a draw, seeding, bye, knockout, advancement, ranking, Swiss, or standings-driven generation engine;
- automatic scheduling, optimization, resource assignment, dispatch, notifications, queues, or approvals;
- registration intake, roster management, eligibility determination, or lineup workflow;
- match execution, participant acceptance, scoring, confirmation, outcome, or signature behavior;
- official result creation, correction, ranking, analytics, or reporting;
- contest correction, cancellation, replacement, versioning, or supersession policy;
- a universal task, room, status lifecycle, state machine, event bus, or workflow orchestrator; or
- adoption of legacy IDs, key/value buckets, parser heuristics, defaults, polling, or destructive clearing behavior.

## Open Business Questions

Later modeling must resolve, without inferring answers from legacy mechanics:

1. Which generation mechanisms and pairing rules are supported beyond evidenced all-pairs and explicit pairings?
2. What provenance must every generated contest preserve, including configuration version and actor/source for imports or manual assertions?
3. What identity and stable references define a contest, its sides, its parent encounter, and its structural position?
4. How are generated contests corrected, cancelled, replaced, regenerated, or superseded while preserving history?
5. Which configured format details must be copied onto a contest versus referenced from versioned Competition Configuration?
6. When may a constituent contest be established from a confirmed lineup, and how are missing, unequal, or incompatible selections handled?
7. May a configured side or prospective participant selection change after generation, and what facts preserve the change?
8. Are placeholders ever valid contest sides or participants; if so, what explicit meaning and resolution rules apply?

## Deliverables

| Document | Purpose |
|----------|---------|
| `01-TASK.md` | Detailed boundary, fact ownership, relationships, non-goals, and open questions |
| `02-EXECUTIVE-SUMMARY.md` | Business-readable boundary summary |
| `STATUS.md` | Completion and scope record |

## Acceptance Criteria

- [x] Facts created during contest generation are explicit.
- [x] Competition Configuration is distinguished from Contest Generation.
- [x] Registration inputs remain Registration-owned and distinct from actual participation.
- [x] Scheduling placement facts remain separate from generated contest facts.
- [x] Match Operations remains the owner of actual participants and execution facts.
- [x] Competition Result Recording remains the owner of official results.
- [x] Non-goals prevent automation, workflow, and legacy implementation leakage.
- [x] TOP is consistently described as a domain fact system, not a workflow engine.
- [x] No production code is changed.

---

*End of Task Definition*
