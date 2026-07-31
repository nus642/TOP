# Legacy Match Generation Analysis

**Purpose:** Describe only the match-generation behavior evidenced by the legacy TOP application and classify the facts it mixes together.

**Analysis date:** 2026-07-31

**Scope:** Creation of individual matches, team encounters, and team constituent matches from imported or manually supplied legacy data. This is an analysis, not a replacement design.

---

## 1. Sources and interpretation

This analysis reviewed:

- `LEGACY-COMPETITION-CONFIGURATION-ANALYSIS.md`;
- the available Competition configuration analysis and boundary conclusions (the repository does not contain a `TASK-COMP-002-A1` handoff package under that name);
- `TASK-SCHED-001-A1` (Scheduling Boundary);
- `TASK-REG-001-A1` (Registration Boundary);
- `TASK-OPS-001-A5` (Match Outcome Fact Boundary); and
- the relevant legacy behavior in `Legacy/master.html`, `Legacy/team_lineup.html`, and `Legacy/data.php`.

The classification follows meaning rather than the legacy screen, JSON object, or actor that happens to write a value.

### Governing distinctions

1. **TOP is a domain fact system, not a workflow engine.** A button sequence, polling loop, status label, queue, or room is not automatically a durable domain concept.
2. **Competition defines what contests exist.** It owns the configured pairing and the competitive composition of a contest.
3. **Scheduling places contests.** A date, court, referee, queue position, or reassignment is not part of match generation even when copied into the same legacy task.
4. **Match Operations executes contests.** Actual participants, live scoring, service, progress, completion, and trusted outcome evidence arise from execution, not generation.
5. **Competition Result Recording records official results.** A generated match neither is an official result nor automatically causes one to exist.
6. **Registration supplies prospective participation facts.** Entrants, rosters, group/category acceptance, and confirmed lineup selections may be inputs to generation, but Registration does not define the contest or prove who actually played.
7. **Master, team leader, referee, and player are actors, not domain owners.** Ownership follows the fact created, not the page or role that creates it.

---

## 2. Executive findings

1. Legacy “generation” is not one coherent operation. It includes at least four paths: all-pairs expansion of individual groups, all-pairs creation of team encounter rooms, extraction of explicit `VS` pairings from a schedule sheet, and resolution of two team lineup arrays into constituent match tasks.
2. In the round-robin path, an already populated group is the input. Every unordered pair (`i < j`) in that group produces exactly one contest. This is deterministic pair expansion, not a draw, round builder, bracket generator, or scheduler.
3. An individual generated task mixes a genuine contest fact (the two sides) with inferred/default match configuration and technical identifiers. It may later also carry scheduling and execution values. The legacy `tasks` bucket is therefore not a bounded domain model.
4. Team generation is two-stage. The first stage creates a two-team encounter “room”; the second pairs the teams' separately submitted lineup entries by array index to create executable constituent matches.
5. The team resolution path truncates to the shorter lineup, uses the first team's match `format`, and infers singles/doubles from submitted player-slot counts. The examined behavior does not validate equivalent lineup lengths, compatible slot disciplines, or matching formats.
6. A forced team path creates three doubles tasks with `待定` participants and hard-coded scoring defaults. This is a permissive operator override in the legacy implementation, not evidence that every team encounter consists of three doubles contests.
7. Explicit `VS` spreadsheet parsing reads already expressed pairings. It does not establish that TOP chose the opponents. Although such sheets may include time/court text, parsing a pairing and placing it in a schedule are distinct facts.
8. Persisting a generated task makes it available in the legacy operational/referee pool. That UI effect does not turn “generated,” “dispatched,” “scheduled,” “started,” and “officially recorded” into stages of a domain workflow.
9. Deleting or clearing legacy tasks physically removes the mixed records. The behavior does not preserve generation provenance, replacement history, supersession, or an audit trail.

---

## 3. What “match generation” means in the legacy application

The legacy application uses “task,” “match,” “room,” “pairing,” and “dispatch” across overlapping operations. For analysis, a **generated match fact** is the established fact that a particular contest exists, with identified sides and any evidenced competitive composition. Generation is the act that establishes that fact from supplied competition inputs.

The term does **not** include:

- accepting an entrant or roster member;
- assigning the contest to a date, time, court, or referee;
- choosing the actual participants at match execution;
- conducting, scoring, completing, or confirming the contest; or
- creating or correcting its official competition result.

Legacy code often performs or stores several of these concerns together. That coupling is evidence about the implementation, not evidence that the facts have one owner.

---

## 4. Generation paths

### 4.1 Individual all-pairs generation within a group

The primary round-robin parser:

1. detects a group-table header or falls back to an older row layout;
2. reads entrant display strings and normalizes them;
3. partitions those entrants by a parsed group label;
4. deduplicates entrants by normalized name in the header-based path;
5. iterates all index pairs where `i < j`; and
6. emits one task per pair.

For `n` distinct parsed entrants, the header-based traversal therefore emits `n(n-1)/2` tasks. No second leg is created and no home/away meaning is evidenced. Input order determines which side appears as `t1` and the sequence embedded in the task ID, but the code establishes no sporting significance for either.

Each emitted task contains:

- a generated textual `id`;
- side display values `t1` and `t2`;
- player-slot strings `t1p1`, `t1p2`, `t2p1`, and `t2p2` obtained by splitting the side text;
- inferred `type` of `singles` or `doubles`;
- default `format: 1` and `meth: 'rally'`; and
- `is_team: false`.

The fallback parser uses the same nested all-pairs traversal but different group recognition and ID formatting. This shows compatibility code, not a distinct competition rule.

#### Classification

| Observed item | Classification | Analysis |
|---|---|---|
| Existing group and the entrants accepted into it | **Competition / Registration input facts** | Competition defines the group; Registration records accepted association of entrants to it. |
| Rule “each distinct pair in this group contests once” | **Competition fact** | This rule defines which contests exist. |
| The resulting side-versus-side contest | **Generated match fact** | It is the durable meaning produced by applying the rule. |
| Singles/doubles and scoring format, if authoritative rather than guessed | **Competition fact attached to the generated match** | These define the configured contest. |
| Splitting a display string to infer player slots or doubles | **Legacy implementation detail** | Text punctuation is used as a proxy; it is not reliable evidence of identity or actual participation. |
| Loop counters, `t1`/`t2` orientation, and group-derived IDs | **Legacy implementation detail** | They make records addressable but do not establish rounds, seeds, or sporting order. |

### 4.2 Explicit individual `VS` import

A second parser scans spreadsheet cells containing `VS`, separates content above and below the marker, normalizes or fuzzily resolves names against known teams/players, rejects text matching invalid knockout/ranking patterns, and emits an individual task. It infers a singles/doubles abbreviation and generates an `MS-...` or `MD-...`-style ID, while still defaulting the stored format and scoring method.

This path imports an externally expressed pairing. The legacy evidence does not show whether that pairing was produced by a draw, a human schedule, or another system. TOP's legacy parser recognizes it; TOP does not demonstrably decide it.

The spreadsheet may mingle the contest with phrases about time, court, or following a previous match. Those phrases are parsing context. The two sides are a generated/imported match fact; any authoritative placement is a Scheduling fact.

### 4.3 Manual individual creation

The Master screen also accepts a textual `vs` or hyphen-separated expression. It attempts to resolve tokens by player code or name, then by code prefix, and otherwise retains the supplied text as a synthetic name/team value. It keeps no more than two resolved names per side, infers doubles from side size, supplies defaults, and immediately adds the record to `tasks`.

The domain meaning, when the operator's input is authoritative, is that the two supplied sides are to contest a match. The permissive fuzzy/prefix lookup, fallback identities, timestamp-derived ID, defaults, and immediate insertion into the referee pool are legacy implementation and UI behavior.

### 4.4 Team encounter generation

In team mode, the all-pairs traversal does not initially produce executable rubbers. For each unordered pair of teams in a group it creates one room containing:

- a room code;
- exactly two team objects with name, group, optional code, and an initially empty `players` array; and
- status `team_confirming`.

The same kind of room can be created by importing an explicit team `VS` cell or by a manual Master action. Thus, a room is the legacy container for a configured team-versus-team encounter, not proof of how the encounter was selected.

The enduring competition meaning is the team encounter and its two sides. Room codes, empty embedded player arrays, associative keys, creation timestamps, and `team_confirming` are implementation/coordination details unless separately supported as facts.

### 4.5 Team constituent-match resolution

Each team separately submits an ordered lineup `matches` array. When both arrays exist, the Master path resolves them by equal index:

1. iterate only to `Math.min(tl1.matches.length, tl2.matches.length)`;
2. take the players for side one and side two from the same array position;
3. take `format` only from side one's entry;
4. infer doubles if either entry supplies a second player;
5. create a task related to the room through its ID prefix and `is_team: true`;
6. apply fixed target/cap/method defaults;
7. write room status `completed`; and
8. bulk-add the tasks to the operational task pool.

This behavior resolves prospective lineup selections into contest definitions, but it does not prove actual participation. Under the Registration boundary, lineup submission/confirmed selection remains a Registration fact. Under the Match Operations boundary, the participants accepted when the contest is executed remain execution facts.

The following limitations are material legacy behavior:

- unmatched trailing lineup entries are silently omitted;
- no examined check requires the two entries at an index to declare compatible disciplines;
- the second side's `format` does not govern the generated task;
- configured team-template labels such as `MD`, `WD`, `XD`, `MS`, or `WS` are not copied into the generated task in this path;
- the relationship to the parent encounter is implicit in the ID and boolean rather than an explicit semantic reference; and
- setting room status to `completed` means lineup resolution/dispatch in this UI, not completion of sporting play.

### 4.6 Forced unresolved team matches

If lineups are absent, an operator can force generation after entering a password. The examined path emits three doubles tasks, uses `待定` in all player slots, applies one-game/rally/21-point defaults, marks them as team tasks, and changes the room status.

This proves only that legacy operations permit placeholder contests to enter the pool. It does **not** prove:

- that three rubbers are the competition's required encounter structure;
- that every rubber is doubles;
- that `待定` is an entrant or an actual participant;
- that 21 points is universally configured; or
- that the team encounter has been played or completed.

---

## 5. Inputs and outputs by fact boundary

### 5.1 Competition facts

Competition facts used or created around generation are:

- individual versus team competition mode;
- group identity and configured grouping structure;
- the rule that all distinct entrants within a group meet once, where that behavior is the authoritative competition definition;
- whether a contest is an individual match or a team encounter;
- the two entrant sides of a contest;
- the existence and order of constituent rubbers in a team encounter;
- configured discipline/kind (singles, doubles, or a more specific team-template discipline), where explicitly authoritative;
- configured scoring/game format, target, and cap, where explicitly authoritative; and
- the relationship of a constituent match to its team encounter.

Legacy defaults and guesses are evidence of values emitted by the program, but not necessarily evidence that organizers deliberately established the corresponding competition rule.

### 5.2 Generated match facts

The narrow output of generation is:

- a contest exists;
- it belongs to the relevant competition/group context when that context is retained;
- it has two configured sides;
- it may be a constituent contest of a team encounter at an ordered position; and
- it has whatever contest format was authoritatively established at creation.

A generated match fact is prospective: it states **what contest exists**, not when or where it will happen, who actually participates, what happens during play, or what becomes official.

The legacy implementation does not preserve enough information to distinguish reliably among:

- generated from an all-pairs rule;
- imported as an explicit pairing;
- entered manually;
- forced as a placeholder;
- regenerated after source correction; or
- replaced/superseded by another contest.

IDs sometimes hint at a path, but they are not reliable provenance facts.

### 5.3 Scheduling facts

The following are Scheduling facts even when present on or adjacent to a legacy task:

- scheduled date or time;
- assigned court;
- assigned referee;
- placement in a court queue or board;
- assignment, reassignment, or unassignment history; and
- conflicts among assignments.

Adding a generated task to the legacy pool means it can be considered for operations. It does not itself establish a date/court/referee assignment unless those facts are separately supplied. Likewise, changing a task's court does not change which contest exists.

The legacy task pool is best read as an operational projection mixing unplaced and placed contests, not as evidence for a universal `Task` domain or an automatic scheduler.

### 5.4 Execution facts

The following belong to Match Operations, not match generation:

- actual participants accepted on each side or position at execution;
- match start, live status, serving state, points, games, and sets;
- interruption, abandonment, walkover, or completion facts;
- recorded outcome;
- player/referee/Master confirmations;
- signatures and other outcome evidence; and
- execution timestamps.

The generated player-slot strings are prospective contest configuration derived from imported names or lineups. They must not be treated as proof that those people actually played.

Trusted outcome facts may later be consumed elsewhere, but generation does not calculate rankings, trigger scheduling changes, or create official competition records. Competition Result Recording separately records the official result.

### 5.5 Registration facts

Although not one of the five requested output classes, Registration is a necessary input boundary:

- accepted competition entrants;
- accepted group/category association;
- team roster membership;
- satisfaction of Competition-defined participation constraints; and
- submitted or confirmed lineup selections.

Generation may consume those facts. It neither owns them nor converts them automatically into actual match participation.

### 5.6 Legacy implementation details

The following must not be promoted into future domain truths merely because legacy code depends on them:

- PHP key/value buckets named `tasks`, `team_event`, `team_lineups`, and `team_template`;
- storing tasks in an associative array keyed by normalized `id`, with later writes replacing the same key;
- combining old and new task arrays during `set_bulk_tasks`;
- generated IDs based on group labels, local counters, room codes, abbreviations, or timestamps;
- `t1`, `t2`, `t1p1`, `t1p2`, `t2p1`, and `t2p2` field names;
- numeric `format` values and literal strings such as `rally`, `singles`, and `doubles`;
- `is_team` as the main team-submatch marker;
- browser-side spreadsheet parsing, regexes, fuzzy matching, name cleanup, and defaults such as `未知`;
- detecting doubles from separators or populated second-player slots;
- room statuses `team_confirming` and `completed`;
- pairing lineup arrays by index and truncating with `Math.min`;
- taking format from only the first team's submission;
- the forced three-doubles fallback and `待定` placeholders;
- immediate visibility in the referee/task pool after persistence;
- destructive delete/clear operations without preserved history; and
- the legacy sequence of import, confirmation, dispatch, execution, and record screens.

---

## 6. Classification matrix

| Legacy observation | Competition fact | Generated match fact | Scheduling fact | Execution fact | Legacy detail / caveat |
|---|:---:|:---:|:---:|:---:|---|
| Entrants share a configured group | ✓ | Input |  |  | Parsed labels may be unreliable; accepted association is recorded by Registration. |
| Every unordered pair in a group meets once | ✓ | Produces |  |  | Nested `i < j` loops implement the rule. |
| `t1` versus `t2` task exists | Context | ✓ |  |  | Side orientation follows input order. |
| Explicit spreadsheet `A VS B` | May express | ✓ | Maybe separate |  | Parser cannot establish the pairing's provenance. |
| Task has `date` |  |  | ✓ |  | Same JSON object does not change ownership. |
| Task has `court` or referee |  |  | ✓ |  | Assignment is not resource ownership or execution. |
| Singles/doubles or scoring format | ✓ when authoritative | ✓ as configured contest data |  | Used during play | Often inferred/defaulted in legacy. |
| Team A versus Team B room | ✓ | ✓ (encounter) |  |  | “Room” and its status are coordination constructs. |
| Ordered team rubber slot | ✓ | ✓ when contest is established |  |  | Template discipline may be lost during resolution. |
| Team leader lineup submission | Defines no rule | Generation input |  | Not actual participation | Registration fact plus declaration evidence. |
| Resolved lineup index becomes task | Context | ✓ |  | Prospective only | Shorter-length truncation and first-side format are legacy behaviors. |
| Forced task with `待定` | No general rule proven | Placeholder emitted |  | No participant proven | Operator override with hard-coded defaults. |
| Task appears in referee pool |  | Contest already exists | Planning/dispatch projection | Not started merely by appearance | UI/persistence coupling. |
| Live score/status on task |  |  |  | ✓ | Mixed into the task storage object. |
| Confirmed outcome/signatures |  |  |  | ✓ | Official result remains Competition Result Recording's concern. |
| Clearing `tasks` | Does not redefine rules | Physical removal | May erase placement too | May erase mixed context | Destructive implementation, not a domain correction model. |

---

## 7. What the legacy evidence does not establish

The examined behavior does not establish:

- a persisted draw, seeding, pot, bye, or random-allocation process;
- knockout, ranking-playoff, crossover, advancement, or winner-to-next-match generation;
- a reliable tournament-round model (task counters and rubber positions are not rounds);
- repeat meetings, legs, home/away semantics, or balanced side orientation;
- Swiss or standings-driven pair generation;
- generation provenance, approval, versioning, correction, cancellation, or supersession facts;
- validation that all imported group members are accepted/eligible entrants;
- a universal scoring format merely because the parser supplies a default;
- a universal team-encounter composition or aggregate win rule;
- validation that opposing team lineups have equal lengths, matching disciplines, or compatible formats;
- actual match participants from generated player slots;
- a schedule from array order, match ID, task-pool presence, or room creation time;
- match completion from room status `completed`;
- an official result from a live/confirmed operational outcome; or
- an automatic transition from generation to scheduling, execution, ranking, or official result recording.

Absence of evidence must remain absence of evidence. These gaps should not be filled by interpreting UI order or hard-coded fallback behavior as business policy.

---

## 8. Boundary conclusions

### Competition defines what contests exist

The all-pairs rule, explicit opponent relationship, individual/team nature, team-encounter composition, and authoritative contest format are Competition concerns. Applying the evidenced rule establishes generated match facts; it does not schedule or execute them.

### Scheduling places contests

Date/time, court, referee, and queue/board placement remain separate assignment facts. The fact that legacy code stores or displays them on the same task does not make placement part of generation. No automatic scheduler is evidenced or implied by this analysis.

### Match Operations executes contests

Actual participants and everything that happens during play belong to Match Operations. A generated side, roster entry, or confirmed lineup is context for execution, not proof of execution.

### Competition Result Recording records official results

An operational outcome and its confirmation evidence can be trusted Match Operations facts without themselves being the official competition record. Generation creates neither kind of result and must not be interpreted as a workflow trigger for either.

### Final statement

Legacy TOP usefully demonstrates several ways humans and importers establish prospective contests. It also collapses competition definition, operational pooling, scheduling fields, participant guesses, and execution data into shared task-shaped records. The behavior should therefore be preserved as evidence at the fact level, not copied as a cross-domain workflow:

> **Competition defines the contest. Generation establishes that the contest exists. Scheduling places it. Match Operations executes it. Competition Result Recording records the official result.**

---

*End of Legacy Match Generation Analysis*
