# TASK-REG-001-A1: Registration Boundary Definition

**Status:** Documentation Complete

**Created:** 2026-07-31

**Scope:** Documentation only

---

## Purpose

Define the Registration boundary for TOP Modern architecture. This boundary identifies the competition-scoped entry, roster, constraint-satisfaction, and confirmed-selection facts TOP records while keeping competition structure, scheduling decisions, and actual match participation in their established domains.

## Core Principle

**TOP is a domain fact system, not a workflow engine.**

Registration records facts established by authorized actors. It does not run an application or approval process, advance entrants through states, collect payment, schedule matches, or command another domain to act.

## Boundary Vocabulary

The boundary uses distinct terms for facts that may concern the same person:

| Term | Meaning | Fact owner |
|------|---------|------------|
| Entrant | A competition-scoped registration subject accepted into a competition | Registration |
| Team roster member | An entrant recorded as a member of a competition team roster | Registration |
| Eligible / constraint satisfied | A recorded determination or evidence that an entrant satisfies a Competition-defined participation constraint | Registration |
| Lineup selection | A confirmed selection of roster members for Competition-defined lineup slots | Registration |
| Match participant | A person actually accepted into a side or position for a particular match execution | Match Operations |

“Player” describes an actor or role in this scope. Current evidence does not justify a standalone Player domain, reusable global person profile, or account-backed player identity. Registration may identify an entrant locally to a competition and may reference a future external identity capability, but does not create that capability here.

## Registration Owns

| Owned fact | Meaning |
|------------|---------|
| Registration facts | Competition-scoped facts that identify and describe a registration subject for the purposes of that entry |
| Accepted entrant facts | The fact that an entrant has been admitted to the competition |
| Entrant classification facts | The accepted entrant's association to a Competition-defined group, division, category, or equivalent structure |
| Team roster membership facts | The fact that an accepted entrant belongs to a competition team roster |
| Participation-constraint satisfaction facts | Whether an entrant satisfies an explicit participation constraint defined by Competition |
| Constraint evidence | Evidence supporting a satisfaction fact, such as an event waiver acknowledgement, signature reference, or authorized administrative assertion |
| Team roster submission facts | The roster submitted for a team in the competition, including relevant submission confirmation facts |
| Lineup submission / confirmed selection facts | Where applicable, the confirmed selection of roster entrants into Competition-defined lineup slots, including relevant submitter confirmation evidence |

Registration owns the recorded satisfaction of a rule, not the definition of the rule. A fact may state that an entrant satisfied a waiver, roster, or eligibility constraint at a relevant time without creating a permanent, universal property of the person.

## Registration Does NOT Own

Registration does not own:

- competition structure, groups, divisions, categories, team contests, lineup templates, or participation-rule definitions;
- match or sub-match generation;
- schedule dates or times, court/referee assignments, participant assignment conflicts, or assignment history;
- court or referee facts;
- match execution, actual match participants, scoring, confirmation, or match outcomes;
- official competition result records or correction history;
- ranking, advancement, analytics, or reporting pipelines;
- a global player profile, cross-competition player history, account, authentication, or identity system;
- payment, fees, orders, refunds, or payment-based eligibility implementation;
- registration screens, reminders, notifications, queues, approvals, or an approval state machine;
- automatic scheduling, conflict resolution, dispatch, or cross-domain workflow orchestration.

## Registration Is Not Match Participation

> **Registration or roster membership does not establish actual participation in a match.**

A person can be an accepted entrant, appear on a team roster, satisfy all participation constraints, and be selected in a lineup without actually participating in a particular match. These facts remain independently meaningful.

| Registration | Match Operations |
|--------------|------------------|
| Records accepted entrants | Records actual match participants |
| Records competition team roster membership | Records the side/position occupied in execution |
| Records satisfaction of participation constraints | Records execution, scoring, confirmation, and outcomes |
| Records a confirmed prospective lineup selection | May retain provenance to the selection but owns the resulting participant fact |

The actual participant fact must remain stable as part of the match execution record even if registration or lineup facts are later corrected. A reference or provenance link to Registration does not transfer fact ownership.

## Competition Relationship

**Competition defines structure and participation rules. Registration records accepted subjects and whether those rules are satisfied.**

Competition owns, as applicable:

- the groups, divisions, categories, teams-as-competitors, and contest structure;
- ordered singles/doubles sub-match or lineup-slot definitions;
- constraints such as roster limits, slot requirements, qualification conditions, waiver requirements, and whether an entrant may appear in multiple lineup slots;
- the match's place in competition structure and the official competition result record.

Registration consumes those definitions without redefining them. It records entrant-to-structure associations, roster membership, supporting evidence, constraint-satisfaction facts, and confirmed selections against the defined slots.

A rule change in Competition and a satisfaction determination in Registration are separate facts. Neither should be hidden by mutating the other.

## Scheduling Relationship

Scheduling may consume Registration facts that are relevant to a human scheduling decision, such as proposed lineup selections or entrant references. Scheduling remains the owner of:

- match schedule date/time facts;
- court and referee assignment facts;
- assignment, reassignment, and unassignment history; and
- conflicts between assignments, including a conflict in which the same entrant would be assigned to overlapping matches.

Registration does not create assignments or automatically resolve conflicts. Conversely, being scheduled does not accept an entrant, add a roster member, satisfy an eligibility constraint, confirm a lineup, or establish actual match participation.

## Match Operations Relationship

Match Operations may consume accepted entrant, roster, constraint-satisfaction, and confirmed-lineup facts as operational context. It remains authoritative for the people who actually participate in a particular match and for all execution facts.

A submitted lineup is a prospective confirmed selection. Match Operations establishes the actual participant no later than match start. If substitution or deviation from a lineup is permitted, the business rules and the fact needed to explain that difference require a future decision; the distinction does not change ownership of the actual participant.

## Team Membership, Lineup, and Participation

These related facts must not be collapsed:

1. **Competition team:** Competition records the team as a competitor and defines its contest structure.
2. **Roster membership:** Registration records that an entrant belongs to that team's competition roster.
3. **Confirmed lineup:** Registration records that roster entrants were selected for defined prospective slots, with confirmation evidence where applicable.
4. **Scheduled sub-match:** Scheduling records the time and resource assignments for the sub-match.
5. **Actual participation:** Match Operations records who occupies each side or position when the sub-match is executed.

No step implies automatic progression or a workflow command from one domain to the next.

## Actors Are Not Domain Owners

Master, admin, leader, and player are actors that may perform authorized actions. Their actions create facts in the domain that owns those facts:

- an admin or Master accepting an entrant creates a Registration fact;
- a team leader submitting a confirmed roster or lineup creates a Registration fact;
- a scheduler assigning a court creates a Scheduling fact;
- a referee accepting actual participants and conducting a match creates Match Operations facts.

Actor names, screens, permissions, and authorization flows do not determine domain ownership. Authorization remains an application-layer concern.

## Legacy Alignment

### Preserve

1. A competition can have accepted entrants and team rosters.
2. An entrant can be associated with Competition-defined groups or categories.
3. An entrant may need to satisfy explicit competition participation constraints.
4. Waiver acknowledgement and supporting evidence are narrow registration/compliance facts, not general player availability.
5. A team may submit a roster and a confirmed lineup against ordered competition slots.
6. Actual match participants remain distinct from entrants and lineup selections.

### Avoid

1. Treating names or mutable local codes as global person identity.
2. Creating a standalone Player domain from event-local roster evidence.
3. Copying whole-array replacement, duplicated roster storage, polling, or string-based joins as business semantics.
4. Treating `checked_in` as a universal registration lifecycle or permanent person eligibility.
5. Treating lineup submission as proof of actual match participation.
6. Treating Master, admin, leader, or player as a domain owner.
7. Turning the boundary into registration workflow, approvals, payment, dispatch, or automatic scheduling.

## Explicit Non-Goals

This task does **not** design or introduce:

- a registration workflow engine or approval state machine;
- registration application, waitlist, withdrawal, cancellation, transfer, reminder, or notification workflows;
- payment implementation or payment-driven rules;
- a global identity, account, authentication, or player-profile system;
- ranking, advancement, analytics, player history, or reporting;
- automatic scheduling, optimization, or conflict resolution;
- match generation, execution, scoring, outcomes, or official competition records;
- production models, APIs, schemas, persistence, user interfaces, or authorization implementation.

## Open Business Questions

The following require explicit business decisions before later modeling or implementation:

1. Can one entrant hold multiple entries or belong to multiple teams, groups, divisions, or categories in the same competition?
2. Is reuse of one entrant across multiple lineup slots permitted, prohibited, or configurable per competition?
3. When is a roster or lineup final, and may a confirmed submission be corrected, replaced, withdrawn, or versioned while preserving history?
4. May an actual match participant differ from the confirmed lineup, under what rule, and what substitution/deviation fact and evidence must be retained?
5. Which participation constraints exist beyond roster membership and waiver acknowledgement, and at what time must each be satisfied?
6. May an authorized administrative assertion substitute for entrant-supplied evidence, and what actor, reason, and audit evidence must be recorded?
7. Must future withdrawal, injury, rest, or unavailability be recorded; if so, is it competition-specific or independently managed?
8. What competition-local entrant identity and authoritative participant display value must official competition records preserve?
9. Are team roster submission and roster membership separate facts in every competition format, and what confirmation evidence is required?

These questions are boundary inputs, not invitations to infer a workflow, state machine, or implementation.

## Deliverables

| Document | Purpose |
|----------|---------|
| `01-TASK.md` | Registration ownership, boundary relationships, non-goals, and open questions |
| `02-EXECUTIVE-SUMMARY.md` | Business-readable boundary summary |
| `STATUS.md` | Completion record |

## Acceptance Criteria

- [x] Registration fact ownership is explicit.
- [x] Accepted entrants, roster membership, constraint satisfaction, roster submissions, and lineup selections are covered.
- [x] Registration is distinguished from actual match participation.
- [x] Competition remains the owner of structure and participation rules.
- [x] Scheduling remains the owner of schedule, assignment, and assignment-conflict facts.
- [x] Match Operations remains the owner of actual participants and execution facts.
- [x] Actors are distinguished from domain owners.
- [x] Workflow, approvals, payment, identity, ranking, analytics, history, and automation scope are excluded.
- [x] Open business questions are recorded without inventing answers.
- [x] No production code is changed.

---

*End of Task Definition*
