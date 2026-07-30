# Legacy Player Registration and Participation Analysis

**Purpose:** Extract defensible business behavior from Legacy before defining Modern player-related boundaries.

**Date:** 2026-07-30

**Scope:** Player identity, registration, team/lineup membership, match participation, and availability. This is boundary analysis only; it does not propose implementation, ranking, analytics, player history, or automatic scheduling.

## Executive conclusion

Legacy does **not** contain a global Player domain or an account-backed player identity. It contains an **event-scoped player roster** whose rows are identified inconsistently by a generated `id_code` and, in most consequential lookups, by player name. The same person is not deliberately reused across competitions: every event has its own `players` collection, and waivers are keyed by event code and player name.

The durable business concepts worth retaining are:

1. A competition has accepted entrants and, for team events, team rosters.
2. An entrant may have to satisfy competition participation constraints before starting a match. Legacy's concrete constraint is signed waiver/check-in; it has no payment or broader eligibility model.
3. A team contest may require a signed lineup that assigns roster members to ordered singles or doubles slots.
4. A match has explicit participants. Those participants are execution facts when the match starts, even when they originated in an entry or lineup.
5. A person cannot execute two matches simultaneously. Legacy demonstrates this only in its isolated local organizer tool; the connected tournament path does not enforce it.

Recommended Modern boundary: **Player is not currently justified as a standalone domain. Registration is a bounded domain/capability owning competition entries, team rosters, and satisfaction of entry/participation constraints. Participant is a Match Operations fact. Team contest structure belongs to Competition; roster and submitted lineup belong to Registration; the resolved participants actually starting a sub-match belong to Match Operations.**

---

## Evidence and interpretation rules

This analysis distinguishes three levels:

- **Observed:** directly implemented by Legacy.
- **Inferred business behavior:** a stable fact implied by more than a UI or storage accident.
- **Not established:** absent, contradictory, or too weak to use as a Modern requirement.

Primary sources inspected:

| Source | Relevant behavior |
|---|---|
| `Legacy/data.php` | Event-scoped storage, player/check-in APIs, team rooms, lineup submission, match task/result persistence |
| `Legacy/players.html` | Master roster editing, batch addition, check-in overrides, waiver inspection |
| `Legacy/checkin.html` | Player lookup, identity-tail verification, waiver signature, check-in |
| `Legacy/team_lineup.html` | Team roster selection, singles/doubles slots, duplicate-use rule, leader confirmation |
| `Legacy/master.html` | Roster/schedule import, task construction, team lineup resolution into sub-matches |
| `Legacy/referee.html` | Pre-start roster/check-in gate and match execution participant state |
| `Legacy/zz.html` | Separate local tournament helper with simultaneous-play conflict detection |

`Legacy/zz.html` is treated as corroborating evidence for an operational conflict rule, not as evidence that the connected event API owns or enforces availability: it persists its independent state only in browser `localStorage`.

---

## 1. Player identity

### 1.1 What identifies a player?

**Observed:** a roster row commonly contains:

```text
id_code, name, team, group, position, checked_in,
and sometimes id_last4 and sign_time
```

There is no single enforced key.

- Batch/import paths generate `id_code`, but use different formats (`P###`, team-name plus sequence, or team-code plus sequence).
- Team-code changes can rewrite player IDs.
- Check-in finds and updates the first roster row whose `name` exactly matches the submitted name.
- Waiver lookup uses `(event_code, player_name)`, not `id_code`.
- The referee accepts either exact name or exact `id_code` at the pre-start gate, then copies the entered text into match state.
- Duplicate detection during roster import is `(name, team)`, while several other paths use name alone.

**Conclusion:** Legacy's effective identity is **an event-local roster row, addressed mostly by name and sometimes by a mutable local code**. Neither name nor `id_code` is a reliable global person identifier. The last four identity-document digits are verification data, not an identifier: they are optional, non-unique, and captured with a waiver.

### 1.2 Competition-local or global?

Player identity is a **competition/event concern in Legacy**:

- Event creation initializes a separate `players` collection.
- Every player API is scoped by `event_code`.
- Waivers are separately scoped by `event_code`.
- Deleting or resetting an event deletes that event's roster/waiver data.

There is no cross-event player table, lookup, merge, or stable person key. Consequently, Modern must not infer a global Player aggregate from this code.

### 1.3 Accounts and users

**Not established.** Players do not authenticate and have no user/account relationship. Check-in is a public event-code flow using name and, when present, matching last four identity-document digits. Team leaders use the shared event/referee password rather than a leader account. “Master” and “player” labels denote UI actors, not owned domain identities.

### 1.4 Reuse across competitions

**No deliberate reuse.** A person appearing in two events becomes two independent roster rows and signs event-scoped waiver evidence. Importing similar data again is recreation, not reference or reuse.

### 1.5 Identity risks that are not business rules

- Name equality as a join key can collide and can break after a rename.
- `id_code` generation is inconsistent and sometimes depends on current array length.
- Team renaming rewrites roster membership by matching the old team name.
- A check-in API path can append a “现场加报” row if a submitted name is not found, although the current check-in UI blocks unknown names first.

These are Legacy implementation behaviors to understand, not identity semantics to preserve.

---

## 2. Registration behavior

### 2.1 Player registration versus tournament entry

Legacy has no independent person registration. Adding a row to an event's `players` collection is effectively **tournament entry/roster admission**.

Observed admission paths include:

- spreadsheet roster import by Master;
- batch/manual roster editing in `players.html`;
- adding a member to a team room, which also appends a player roster row;
- a backend check-in fallback that creates an on-site late-entry row.

The roster contains competition-facing data: group, team, position, and local code. There is no separate application, acceptance, withdrawal, cancellation, waitlist, or transfer lifecycle. `set_players` replaces the complete array, and deletion/clearing removes rows rather than recording a state transition.

**Business fact extracted:** the competition can have a set of accepted entrants. The full-array overwrite and implicit admission workflows are not business facts.

### 2.2 Eligibility and check-in

Legacy implements one meaningful participation constraint:

1. The player must appear in the event roster.
2. The player must have `checked_in === true` before a connected referee starts the match.
3. Normal self-check-in captures last-four verification, signature, the displayed waiver text, and server sign time.

The referee's pre-start check is the actual enforcement point. The lineup screen merely marks unchecked players as “未签” and still lets a leader select them. Master can toggle status or mark everyone checked in without individual electronic evidence, representing an administrative assertion that offline paperwork exists.

Important distinctions:

- **Waiver acceptance/evidence** is a compliance fact associated with an entrant and competition.
- **Check-in** is Legacy's derived/duplicated convenience flag.
- **Allowed to start this match** is evaluation of competition constraints at match start, not a permanent intrinsic quality of a player.
- The broad health assertions in waiver text are acknowledgements, not system-verified medical eligibility.

No age, division, gender, membership, qualification, suspension, seed, ranking, or roster-limit validation is implemented. Team template labels such as men's/women's/mixed are display/template types only; Legacy does not validate player attributes against them.

### 2.3 Payment and registration status

**Not present.** No player fee, order, payment, refund, balance, paid/unpaid status, or payment-based eligibility check was found. Modern boundaries must not reserve ownership based on payment behavior that Legacy does not establish.

Statuses that do exist are narrow and should not be conflated:

| Legacy status | Meaning |
|---|---|
| `checked_in` | Roster row is treated as waiver/check-in cleared |
| team room `team_confirming` / `completed` | Waiting for lineups / lineups resolved into tasks |
| lineup submitted presence | That team has submitted once for that room |

None is a general registration lifecycle.

### 2.4 Team registration and roster membership

Legacy represents a team in two overlapping places:

- player rows have `team` and `group` strings;
- a team-event room contains two team objects with `team_name`, optional `team_code`, group, and a `players` array.

A member added to a team room is also copied into the event player roster. Conversely, lineup loading primarily filters the event roster by team name, then merges missing team-room members as selectable players. This demonstrates a useful business distinction despite weak storage:

- **Team identity in a contest and competition structure** is a Competition fact.
- **A person's membership in the submitted competition roster for that team** is a Registration fact.

Room codes, duplicated arrays, generated prefixes, and string synchronization are implementation details.

### 2.5 Lineup registration

For a team-versus-team contest:

- Competition/Master may configure an ordered template of singles/doubles slot types.
- A leader selects members of that team roster into each slot.
- Singles require one selected name; doubles require two.
- By default, a name can appear only once across the submitted lineup because `selectedPlayersSet` disables reuse. Although the UI exposes “允许兼项” (allow multiple events), its handler only rerenders and does not alter this rule; overlap remains prohibited by the code.
- Submission requires leader name and drawn signature.
- The stored submission includes timestamp, slot/match array, leader name, and signature, keyed by room and team.
- A submitted team is disabled from resubmission in the normal UI. No revision/version/withdrawal semantics are defined.
- When both teams have submitted, Master pairs slots by array position, copies the selected names into match tasks, and marks the room completed.

**Business facts extracted:** a lineup is a confirmed team selection for a particular team contest; it assigns roster entrants to ordered sub-match slots and carries submitter confirmation/evidence. “Blind lineup” is a UI disclosure property—each team submits without the other lineup being returned—not a workflow engine requirement.

**Not established:** whether one entrant may validly play multiple sub-matches. The current implementation prohibits it, the unused checkbox implies the opposite may sometimes be desired, and no server validation exists. Modern should make this an explicit competition rule rather than preserving either accidental behavior.

---

## 3. Match participation

### 3.1 How a player becomes a participant

Legacy has three paths:

1. **Imported/constructed individual match:** Master resolves roster names or codes and writes `t1p1`, optional `t1p2`, `t2p1`, and optional `t2p2` into a match task.
2. **Team sub-match:** after both lineups exist, Master pairs corresponding lineup slots and writes their player names into the same task fields.
3. **Referee/manual entry:** the referee can edit the four participant text inputs before starting; local mode supplies arbitrary names.

Immediately before connected execution, the referee checks each nonblank/non-`待定` participant against the current event roster and requires `checked_in`. The referee then copies the input values into `currentMatch`, which drives serving position and scoring.

**Conclusion:** scheduled/lineup names are proposed participants; the names accepted at match start become **match participants**, owned as execution facts by Match Operations.

### 3.2 Singles, doubles, and team scenarios

| Scenario | Legacy representation | Extracted fact |
|---|---|---|
| Singles | One participant field per side; second fields cleared | Each match side has one participant |
| Doubles | Two participant fields per side | Each match side has two participants; execution tracks serving/positions |
| Team contest | Team name per side plus a sequence of singles/doubles sub-match tasks | Team contest structure contains sub-matches; each sub-match still has concrete participants |

`is_team` only labels the sub-match/result as belonging to team mode. It does not replace participant identity or make the whole team the executing participant.

### 3.3 Referenced, copied, or snapshotted?

**Copied, not referenced.** Lineups contain player-name strings. Resolution copies those strings into task participant fields. Referee execution copies them again into client match state. No roster ID or relational reference is carried through.

This is **partial denormalization, not a proper player snapshot**:

- copied: entered participant names and team-side labels;
- not copied: player code, roster membership identity, group, check-in evidence, or other roster attributes;
- mutable before start: referee inputs can change the names;
- official result record: stores only `t1` and `t2` side/team labels, score, winner, etc.; it does not store the individual participant fields at all.

Therefore Legacy establishes that a match needs its own participant fact, but does not establish a full player-profile snapshot. Modern should preserve the participant fact independently of later roster edits; this conclusion does not require a global player-history system.

### 3.4 Participant versus entrant

- **Entrant:** admitted to the competition or a team roster; Registration owns this fact.
- **Lineup selection:** entrant assigned to a prospective team sub-match slot; Registration owns the confirmed selection.
- **Participant:** person/entrant accepted into the execution of a specific match side; Match Operations owns this fact.
- **Competition record:** completed match and its result within competition structure; Competition receives/owns the official competition record, while Match Operations owns execution facts.

These concepts may refer to the same human but are not interchangeable.

---

## 4. Availability behavior

### 4.1 What Legacy actually provides

The connected event system has no player availability calendar, declared unavailability, injury/withdrawal state, rest window, estimated duration, or player-to-task conflict query. Scheduling can assign tasks without participant conflict validation.

Two narrower behaviors exist:

- check-in is a participation constraint, not availability; it answers whether a roster/waiver requirement is satisfied, not whether the player is free now;
- `Legacy/zz.html`, an isolated browser-local organizer tool, derives a busy set from matches whose status is `playing`, flags idle matches sharing a name, and disables their start button. Its pairing generator also prevents using a player twice in the same round.

The second behavior is valid evidence for a simple rule: **an executing participant is unavailable for another simultaneous match**. It is not evidence of a durable availability subsystem.

### 4.2 Conflicts and scheduling impact

Legacy's local conflict is derived from match execution state and participant-name equality. It prevents an operator from starting the conflicting match; it does not automatically reschedule anything. The connected Master/court scheduler neither shows nor enforces the player conflict.

The Modern implication is fact-oriented:

1. Match Operations records that a participant is in an active match.
2. Resource Management may project that fact as current player occupancy/availability if operational allocation needs it.
3. Scheduling evaluates assignments for conflicts and records/declines a human scheduling decision according to competition constraints.
4. No domain automatically rearranges the schedule.

### 4.3 Classification

| Concern | Classification | Rationale |
|---|---|---|
| “Player X is currently in match M” | **Match Operations fact** | Derived directly from active execution and participants |
| “Player X is currently unavailable because of M” | **Resource Management projection/fact** | Current allocatability across courts/matches |
| “These two assigned matches overlap for X” | **Scheduling conflict** | Relationship between assignments and availability |
| “A participant must not play simultaneous matches” | **Competition constraint** | Rule under which assignments/starts are valid |
| Declared future availability, leave, rest, injury | **Other / not established** | No Legacy evidence sufficient to define ownership |

**Decision:** player availability is **not justified as a separate domain** by Legacy. Present-time occupancy spans Match Operations, Resource Management, Scheduling, and a Competition constraint; each owns its own fact. A broader availability domain should be considered only if future requirements introduce independently managed availability facts.

---

## 5. Ownership classification

### 5.1 Behavior-by-behavior classification

| Behavior/fact | Domain fact owner | Actor/action only or Legacy detail | Confidence/notes |
|---|---|---|---|
| Competition has an accepted entrant | **Registration** | Master imports/adds/edits | High; Legacy roster row is the combined representation |
| Entrant's competition-local display name/code | **Registration** | Code-generation algorithms are Legacy details | High; no global identity semantics |
| Account/global person identity | **Other** | — | Not present |
| Group/division structure and its rules | **Competition** | Spreadsheet parsing is a Master/UI action | High for structural ownership; Legacy validation is absent |
| Entrant assigned to a group | **Registration** | Import/edit operation | High |
| Team exists in a team contest | **Competition** | Master creates/imports room | High |
| Entrant is on a competition team roster | **Registration** | Master/import/add-member actions | High |
| Waiver terms for an event | **Registration** (compliance policy) | Master edits/uploads text | Medium; could become Other/compliance if that capability grows |
| Entrant accepted waiver; signature/time/evidence | **Registration** | Player check-in UI captures it | High |
| `checked_in` convenience flag | **Registration** projection | Master toggle/force-all is an actor assertion | High; do not treat the UI action as owner |
| Eligibility beyond waiver/roster | **Registration + Competition rules** | — | Not established; Competition defines constraints, Registration records satisfaction |
| Payment status | **Other** | — | Not present |
| Team lineup template/ordered sub-match slots | **Competition** | Master configures template | High |
| Confirmed lineup selection and leader evidence | **Registration** | Leader fills/signs/submits UI | High |
| Pairing two submitted lineup slots into a sub-match | **Competition** | Master “scan/resolve” is an actor action | High; deterministic realization of contest structure |
| Match scheduled date/court/queue | **Scheduling** | Master drag/import actions | High |
| Proposed participants on a scheduled match | **Scheduling** consumes Registration/Competition selections | Task string fields are Legacy storage | Medium; not yet execution truth |
| Participants accepted at match start | **Match Operations** | Referee edits/starts | High |
| Singles/doubles execution positions and serving player | **Match Operations** | Referee UI operations | High |
| Active participant occupancy | **Match Operations** source; **Resource Management** availability projection | Local busy-map code is Legacy detail | High for current execution only |
| Participant assignment conflict | **Scheduling** | Warning/disabled button is UI behavior | High as classification; connected path lacks enforcement |
| No-simultaneous-play rule | **Competition** | — | Medium; explicit only in isolated local tool |
| Match result within the competition record | **Competition** | Referee/Master records it | Per stated principles; execution evidence remains Match Operations |

### 5.2 Actor actions are not domain ownership

The following describe permissions or interactions, not domains:

- Master imports, adds, edits, removes, clears, renames, or force-checks-in players.
- A player searches for a roster row and signs a waiver.
- A team leader selects a team, fills a lineup, and signs it.
- Master configures lineup templates, creates team rooms, or resolves lineups.
- A referee edits participants and starts a match.
- An organizer starts/finishes a local-tool match and sees a conflict warning.

“Master,” “leader,” “player,” “referee,” and “admin” are actors. Their screens and privileges do not own the resulting facts.

### 5.3 Legacy implementation details not to carry into boundaries

| Category | Legacy choice |
|---|---|
| Screens | Separate `players.html`, `checkin.html`, `team_lineup.html`, Master dashboard, referee terminal, and standalone `zz.html` |
| APIs | Action-switched `/data.php` endpoint (`get_players`, `set_players`, `player_checkin`, `submit_team_lineup`, etc.) |
| Storage | Event-keyed JSON blobs in `nhpa_store`; waiver rows in `nhpa_waivers`; browser `localStorage` for the local organizer |
| Identity joins | Names and mutable string codes |
| Updates | Whole-array replacement and duplicated roster/team arrays |
| Participation transport | Copied `t1p1`/`t1p2`/`t2p1`/`t2p2` strings |
| Lineup state | Map key composed from room code and team name; presence means submitted |
| Evidence | Base64 signatures embedded directly in JSON/SQL records |
| Coordination | Polling and Master buttons such as “scan and dispatch” |

These explain Legacy behavior but do not define Modern aggregates, APIs, schemas, workflows, or services.

---

## 6. Modern boundary proposal

### 6.1 Is Player a domain?

**No, not on Legacy evidence.** “Player” is a role a person/entrant takes in a competition and in a match. Legacy has no global lifecycle, account, reusable identity, cross-competition profile, or player-owned rules. A standalone Player domain would prematurely invite the explicitly excluded history, ranking, and analytics concerns.

Modern may use a neutral identity reference supplied by an external identity/contact capability if one later exists, but this analysis neither requires nor designs it. Within current scope, Registration can own a competition-local entrant identifier and attributes needed for that entry.

### 6.2 Is Registration a domain?

**Yes, as a focused fact boundary—not a workflow engine.** Registration owns:

- competition entry/admission facts;
- team roster membership for the competition;
- entrant-to-group/category assignment as acceptance of Competition structure;
- waiver acknowledgement and evidence;
- satisfaction/status of explicit competition participation constraints;
- confirmed team lineup selections and submission evidence.

Registration does **not** own screens, reminders, approval workflows, match execution, scheduling, team contest structure, payment absent a future explicit requirement, or a global player profile.

Competition defines the structural choices and constraints (groups, team contests, sub-match slot definitions, permitted lineup reuse). Registration records who entered and how those constraints are satisfied.

### 6.3 Is Participant a match fact?

**Yes.** A Match Operations participant fact identifies the actual person occupying a side/position for that match execution. It should be established no later than match start and remain part of the match record even if a roster or lineup later changes.

The fact may retain provenance to an entry/lineup selection, but provenance does not transfer ownership back to Registration. Match Operations owns execution facts; Competition owns the match's place and completed record in competition structure.

### 6.4 Where should team and lineup belong?

Use the following split:

- **Competition:** team as competitor in competition structure; team-versus-team contest; ordered sub-match/lineup template; constraints such as slot type and whether roster reuse is permitted.
- **Registration:** competition team roster; confirmed lineup selecting roster entrants into those defined slots; leader/submission confirmation evidence.
- **Match Operations:** resolved, actual participants for each singles/doubles sub-match and their execution positions.
- **Scheduling:** assignment of those sub-matches to dates/courts and detection of participant assignment conflicts.
- **Resource Management:** present operational availability/occupancy projection where needed.

### 6.5 Fact flow, not workflow orchestration

The boundary relationship can be stated without designing automation:

1. Competition records contest structure and constraints.
2. Registration records accepted entries, rosters, waiver satisfaction, and confirmed lineup selections.
3. Competition records the resulting sub-match structure; Scheduling may assign it.
4. Match Operations records who actually participates and the execution facts.
5. Competition records the official completed match in its competition record.

No step implies that one domain commands the next, that Master owns a domain, or that TOP must run an approval/notification workflow.

---

## 7. Decisions and unresolved business questions

### Decisions supported now

1. Treat Legacy players as event-local entrants, not global people/accounts.
2. Create a Registration boundary focused on facts.
3. Treat waiver/check-in as a competition participation constraint and evidence, not general availability.
4. Treat confirmed lineup as Registration-owned selection against Competition-owned slots.
5. Treat actual participant as a Match Operations fact.
6. Do not create a separate Availability or Player domain from current evidence.
7. Do not preserve name joins, mutable code formats, duplicated arrays, or whole-roster overwrite as business behavior.

### Questions requiring explicit business decisions later

- Can one entrant hold multiple entries, teams, or groups within the same competition?
- Is lineup reuse across sub-matches permitted, prohibited, or controlled per competition?
- When is a lineup final, and may a confirmed lineup be corrected or replaced? Legacy provides no revision semantics.
- Can the actual match participant differ from the submitted lineup, and what fact records that substitution?
- Is waiver evidence the only required participation constraint, and can an administrative assertion substitute for evidence?
- Must future unavailability (withdrawal, injury, rest) be recorded, and if so is it competition-specific or independently managed?
- What is the authoritative participant display value retained in the official Competition record, since Legacy results discard individual names?

These are boundary inputs, not invitations to design workflows or implementation.

---

## Principle check

- **TOP is a domain fact system, not a workflow engine:** the proposal records entries, selections, participants, availability, assignments, and records as facts.
- **Master is an actor, not a domain owner:** Master actions create or correct facts in the appropriate domain.
- **Match Operations owns match execution facts:** actual participants, positions, active execution, and execution evidence remain there.
- **Competition owns competition structure and records:** groups, team contests, sub-match definitions, constraints, and official competition records remain there.

