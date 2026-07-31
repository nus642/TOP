# Legacy Competition Configuration Analysis

**Purpose:** Describe the competition-configuration behavior evidenced by the legacy application, without designing a replacement.

**Analysis date:** 2026-07-31

**Scope:** Tournament structure, competition formats, draws, groups, rounds, match generation, and team competition structure.

---

## 1. Interpretation principles

This analysis applies the following boundaries throughout:

- **TOP is a domain fact system, not a workflow engine.** Status labels, screens, buttons, polling, and the order in which a user visits pages are not automatically competition facts.
- **Master is an actor, not a domain owner.** A fact does not belong to a “Master domain” merely because the legacy Master screen creates, imports, edits, or views it.
- **Scheduling owns assignments.** Dates, courts, referees, and the dispatch of a configured match are scheduling/resource-assignment concerns, not competition structure.
- **Match Operations owns execution facts.** Live score, service, game state, completion, and the played result describe execution of a match, not its configuration.
- **Registration owns registration facts.** A player’s registration, check-in state, roster membership as registered, and identity data are not competition configuration.

The legacy application frequently stores several of these concerns in the same JSON objects. The classification below follows the meaning of each field or behavior, not its legacy storage location or screen.

---

## 2. Executive findings

1. The legacy system has only a **thin, partly implicit tournament structure**: an event is switched between `individual` and `team`, participants carry a group label, and generated matches or team “rooms” represent pairings. There is no persisted tournament tree, stage model, bracket, or advancement graph.
2. The only systematically generated format evidenced in the Master importer is **all-play-all within each detected group**. For every pair of participants in a group it creates one individual match task, or one team encounter room.
3. Knockout and ranking sections are **explicitly filtered out**, not modeled. Semifinals, finals, winners/losers, crossovers, placings, and ranking rows are ignored by the team schedule parser or terminate round-robin parsing.
4. There is no demonstrated draw mechanism. Codes such as `A1`, team codes, spreadsheet order, and group labels are **imported identifiers**, not evidence that TOP conducted or recorded a draw.
5. “Round” is mostly text that the parser skips. Generated match IDs use counters but do not establish round membership or order. The legacy system therefore does not preserve a reliable rounds model.
6. Match format is configured at the executable match level: singles/doubles, one game or best-of-three, rally scoring, target score, and cap. These fields coexist with tasks and are not a complete competition-format definition.
7. A team competition consists of a **team encounter** between two teams plus a sequence of constituent rubbers (“盘”). Each team independently submits players for corresponding lineup positions; the Master actor pairs positions by array index to create executable matches.
8. Legacy “room” status (`team_confirming`, `completed`) describes application coordination around lineup collection and dispatch. It is not sufficient evidence of a formal competition-stage lifecycle.

---

## 3. Legacy tournament structure

### 3.1 Observed hierarchy

The strongest hierarchy that can be reconstructed is:

```text
Event
└── event mode: individual or team
    └── group/category label
        ├── individual mode: participant-versus-participant match
        └── team mode: team-versus-team encounter (“room”)
            └── ordered constituent matches / rubbers (“盘”)
```

This hierarchy is inferred from behavior spread across `config`, registered player records, generated `tasks`, `team_event`, `team_lineups`, and `team_template`. It is not stored as one coherent aggregate.

### 3.2 Event and competition mode

- An event configuration contains an event `type`, and the Master UI can change it between `individual` and `team`.
- The type changes which import/generation path is used; it does not establish a general catalogue of competition formats.
- Event metadata such as name, code, venue, date, court list, and passwords is broader event configuration or application configuration. Court and date assignments are not competition-structure facts.

### 3.3 Stages and advancement

No durable stage entity was found. The importer recognizes textual evidence of group, ranking, and knockout portions only to decide what to parse:

- group data is accepted;
- ranking rows cause parsing to stop;
- knockout words cause schedule cells to be rejected;
- no winner-to-next-match relationship is stored;
- completed results remain flat records and do not advance a bracket.

Consequently, the legacy application provides evidence for configured group play, but not for a configured multi-stage tournament or advancement policy.

### 3.4 Classification

| Observation | Classification | Reason |
|---|---|---|
| Event is individual or team | **Domain fact** | It changes the nature of entrants and generated contests. |
| A group contains named entrants | **Domain fact** | Membership determines which entrants meet in group play. |
| A team encounter contains constituent rubbers | **Domain fact** | This is the competitive composition of the encounter. |
| Master changes event mode or imports a sheet | **Actor/action** | Master is the operator issuing a command, not the owner of the resulting fact. |
| JSON keys `config`, `tasks`, `team_event` | **Legacy implementation detail** | These are persistence buckets, not the tournament hierarchy. |
| Page sequence from import to lineup to dispatch | **Legacy workflow detail** | UI coordination does not define the competition structure. |

---

## 4. Competition formats

### 4.1 Competition-level formats observed

The legacy import logic supports the following limited distinctions:

| Dimension | Observed behavior |
|---|---|
| Entrant kind | Individual entrant/pair or team |
| Group-play pairing | Every distinct pair within the same parsed group meets once |
| Team encounter | Two teams submit corresponding rubbers that become submatches |
| Knockout/ranking | Recognized as spreadsheet text but deliberately not configured or generated |

“Round robin” in legacy code means combinatorial pair generation within each group. It does not include persisted standings rules, tie-break rules, points allocation, home/away legs, repeat meetings, or advancement criteria.

### 4.2 Match-level formats observed

Generated or submitted matches can carry:

- `type`: `singles` or `doubles`;
- `format`: `1` (one game) or `3` (best of three, represented in the UI as three games/two wins);
- `meth`: `rally`;
- `target_score`: commonly `21` when team submatches are dispatched;
- `cap_score`: commonly `21` in those generated team submatches;
- `is_team`: whether the match is a constituent of a team encounter.

The team template additionally labels a rubber as `MD`, `WD`, `XD`, `MS`, or `WS` and permits a remark. These labels describe the intended discipline/slot. During actual task generation, singles versus doubles is inferred from whether either submitted side has a second player; the richer discipline label is not copied into the generated task in the observed path.

### 4.3 Important limits

- A match’s scoring/execution parameters are not, by themselves, a complete tournament format.
- The importer defaults generated individual group matches to one game and rally scoring.
- The team lineup UI allows a team to select one-game or best-of-three per rubber; the first team’s submitted `format` is used during pairing.
- No validation proves that both teams submitted the same rubber type or format.
- No encounter-level win threshold, early-stop rule, aggregate team score rule, tie resolution, or rubber weighting was found.
- The legacy presence of a value must not be generalized into a rule for all competitions.

### 4.4 Classification

| Item | Classification |
|---|---|
| Entrant kind, group pairing basis, rubber order/type, configured games per match, scoring parameters | **Domain facts** |
| Selecting a format, editing a template, importing format values | **Actor/actions** |
| Numeric encoding `format: 1/3`, strings `rally`, `singles`, `doubles`, and default literals embedded in JavaScript | **Legacy implementation details** |
| Point progression, service, current game, game wins, and the determination that play has ended | **Match Operations execution facts**, not competition configuration |

---

## 5. Draws

### 5.1 What is evidenced

The parser reads labels such as group name, `A1`, `B2`, a team code, or spreadsheet position. These identifiers can carry externally established placement information into TOP.

### 5.2 What is not evidenced

No legacy behavior was found that:

- randomizes entrants;
- seeds entrants;
- places seeds in a bracket;
- assigns entrants to groups through a draw;
- records draw lots, draw order, constraints, pots, byes, or provenance;
- distinguishes a provisional draw from an approved draw;
- redraws while retaining history.

The pair generator enumerates combinations from already grouped entrants. That is match generation from group membership, **not a draw**.

### 5.3 Classification

| Item | Classification |
|---|---|
| An entrant occupies an externally supplied group/position such as `A1` | **Domain fact**, if the imported label is authoritative |
| Master imports or corrects that label | **Actor/action** |
| Regex extraction of codes and prefixes such as `G-` or `C-` | **Legacy implementation detail** |
| A draw process, seeding policy, or allocation rule | **Not established by the legacy evidence** |

---

## 6. Groups

### 6.1 Meaning and use

The term “group” is overloaded:

1. In player data it identifies a competition category/group and is also used with team name to locate the appropriate roster.
2. In round-robin sheets it partitions entrants; only entrants with the same normalized group are paired.
3. In team encounter data each team carries its group so that the correct registered players can be retrieved.
4. Some fallback/default paths use values such as `未知`, `未知组`, `未知组别`, or `现场加报`; these are data-quality or UI fallbacks and must not be mistaken for deliberately configured groups.

### 6.2 Group membership behavior

- Group membership is primarily imported from spreadsheets or carried on player/team records.
- Team identity is effectively matched using both team name and group, which permits the same displayed team name in different groups.
- Pair generation is confined to a group and enumerates each unordered entrant pair once.
- Group standings, rank, played/won/lost totals, tie-breakers, and qualification places are not persisted as configuration by the examined behavior.

### 6.3 Classification

| Item | Classification |
|---|---|
| Group identity and entrant membership | **Domain facts** |
| Master imports, previews, removes, or edits a parsed pairing | **Actor/actions** |
| Header detection, fuzzy name matching, suffix removal, default “unknown” labels | **Legacy implementation details** |
| Player identity, eligibility, registered roster membership, and check-in | **Registration facts** |

---

## 7. Rounds

### 7.1 Observed behavior

Round text such as `第N轮` may appear in imported schedule cells, but the parser skips it while extracting team names. Round-robin generation assigns sequential match or room identifiers based on loop order. Neither behavior persists a round entity or reliable round membership.

The word `format` in match tasks refers to number of games, not tournament rounds. A team rubber index (`第1盘`, `第2盘`, and so on) is an ordered position inside a team encounter, not a tournament round.

### 7.2 Absent behavior

There is no evidence of:

- configured round identity or round order;
- round start/completion facts;
- simultaneous-round constraints;
- Swiss pairing rounds;
- bracket rounds or dependencies;
- qualification from one round/stage to another.

### 7.3 Classification

| Item | Classification |
|---|---|
| Ordered rubber position inside a team encounter | **Domain fact** |
| Tournament round membership | **Not reliably represented in legacy** |
| Sequence numbers embedded in generated IDs | **Legacy implementation detail**, not proof of a round |
| Date, court, or referee attached to a match | **Scheduling assignment** |

---

## 8. Match generation

### 8.1 Individual group generation

For each parsed group, legacy code:

1. collects distinct entrant names from the group table;
2. iterates every index pair where `i < j`;
3. creates one task for each pair;
4. infers doubles when either entrant name contains a configured separator and splits names into player slots;
5. defaults the task to one game, rally scoring, and `is_team: false`;
6. assigns an ID using the group name and a local counter.

This is a deterministic all-pairs expansion of existing group membership. Spreadsheet row order influences generated IDs and sides but no sporting significance for that order is established.

### 8.2 Team encounter generation

For team mode, the same all-pairs traversal creates one room for each pair of teams in a group. The room initially contains the two teams and awaits lineup submissions. It does not initially contain executable submatches.

After both team lineups exist, legacy code:

1. pairs lineup entries by array index;
2. processes only up to the shorter lineup length;
3. takes match format from the first team’s entry;
4. determines singles/doubles by the submitted player slot counts;
5. assigns fixed score defaults and an ID derived from room plus rubber index;
6. marks each task `is_team: true`;
7. changes the room status to `completed` and bulk-adds the tasks.

A forced path can create three doubles tasks with `待定` player values when lineups are absent. This demonstrates an operator override and a permissive legacy fallback, not a trustworthy competition rule.

### 8.3 Imported scheduled encounters

A separate spreadsheet path scans cells containing `VS`, rejects cells with knockout/ranking language, extracts two teams and a group, allows preview edits, and creates a two-team room. It may also carry a global date into the request, although the server-side room persistence shown does not retain that date. The date is an intended scheduling input, not competition configuration.

### 8.4 Boundary classification

| Concern | Classification / owner |
|---|---|
| The configured fact that two entrants are opponents in a match | **Competition configuration fact** |
| The configured fact that a match is a rubber of a team encounter | **Competition configuration fact** |
| Generate all intra-group pairings | **Actor action applying a competition pairing rule**; generated pairings are facts |
| Bulk dispatch tasks, attach date/court/referee, change court/date | **Scheduling** |
| Start match, live score, serving state, completion, result | **Match Operations** |
| Master presses “解析并下发” or forces blank tasks | **Actor/action** |
| Task-map mutation, ID strings, use of `Math.min`, inferred doubles, hard-coded defaults | **Legacy implementation details** |

---

## 9. Team competition structure

### 9.1 Encounter

A `team_event` room represents one encounter between exactly two teams in the examined paths. Each side has:

- team name;
- optional team code;
- group;
- an embedded `players` array that is usually empty in imported rooms.

The room code is a coordination identifier and is also reused as a prefix for generated match IDs. It is not evidence of a bracket node or competition round.

### 9.2 Team template

The event can store a shared ordered template of rubber slots. Each slot may state a discipline label and remark. When present, the lineup screen initializes a team’s submission from that template. When absent, the screen defaults to three doubles rubbers and allows rubbers to be added or removed.

The template is therefore evidence of an intended encounter composition, but the legacy system does not consistently enforce it. Submitted arrays can differ, and pairing truncates to the shorter array.

### 9.3 Lineups

Each team submits its own ordered `matches` array, leader name, leader signature, and timestamp. Each entry contains players and a match format. The opposing submissions are later “resolved” into submatches by matching equal indexes.

Boundary distinctions are essential:

- the **registered roster** from which players may be selected is owned by Registration;
- the **declared lineup for this encounter** is a competition/team-composition fact;
- the leader’s submission/signature is evidence of who declared it;
- whether a registered player is checked in remains a Registration fact;
- execution of each resolved rubber belongs to Match Operations;
- court/date/referee allocation for each rubber belongs to Scheduling.

### 9.4 Team outcome limits

The legacy code marks individual result records with `is_team`, but the examined configuration behavior does not establish:

- how rubber wins aggregate into an encounter result;
- the number of rubber wins required;
- whether remaining rubbers are played after an encounter is decided;
- how forfeits or incomplete lineups affect the encounter;
- encounter standings or advancement.

Those rules must be treated as unknown legacy behavior rather than inferred from the default three-rubber UI.

---

## 10. Consolidated classification

### 10.1 Domain facts evidenced by legacy

- Event competition mode: individual or team.
- Competition group identity and membership of entrants in a group.
- Entrant pairing: the two sides configured to contest a match or team encounter.
- Individual match kind: singles or doubles.
- Match game/scoring configuration where explicitly carried: one game or best-of-three, rally method, target, and cap.
- Team encounter identity and its two teams.
- Ordered team rubber structure, including intended discipline/remark where a template supplies it.
- A team’s declared lineup for each rubber and declaration evidence.
- Relationship of a generated submatch to a team encounter (`is_team` plus room-derived identity in legacy evidence).

### 10.2 Actors and actions

| Actor | Legacy actions | Facts affected |
|---|---|---|
| Master / tournament operator | Select event mode; import entrants/schedule; preview or remove pairings; edit team template; create/delete rooms; generate or force-dispatch tasks | Competition configuration facts and, when dispatching, Scheduling facts |
| Team leader | Find encounter; choose players and per-rubber format; sign and submit lineup | Team lineup/declaration facts |
| Referee | Accept/execute a dispatched match and record play | Match Operations facts, not competition configuration |

The actor performing an action does not determine domain ownership. In particular, Master’s broad legacy permissions do not make Master the owner of competition, scheduling, registration, or execution facts.

### 10.3 Legacy implementation details — do not reinterpret as domain facts

- PHP key/value storage with arrays under `config`, `players`, `tasks`, `records`, `team_event`, `team_lineups`, and `team_template`.
- Rooms as associative-array entries and lineups keyed by concatenating room and team name.
- Status strings such as `team_confirming` and `completed` used to coordinate screens.
- Spreadsheet parsing in the browser, keyword rejection, regex-derived groups/codes, fuzzy name matching, and “unknown” placeholders.
- IDs generated from group labels, counters, room codes, timestamps, or fixed prefixes.
- `format` encoded as `1` or `3`, `is_team` as a Boolean, and discipline/type represented by unrelated string vocabularies.
- Task creation as the persistence representation of both configured pairing and operational work.
- Array-index lineup reconciliation, shorter-array truncation, first-side format precedence, and player-count inference of singles/doubles.
- Hard-coded one-game/21-point defaults and the forced creation of three blank doubles rubbers.
- Deleting or overwriting rooms/tasks and clearing JSON buckets rather than retaining historical configuration versions.

---

## 11. Ownership boundary ledger

| Fact or behavior | Classification / owner | Boundary note |
|---|---|---|
| Event mode, group membership, pairing, encounter/rubber composition | **Competition configuration** | Structural facts about what competition is configured. |
| Import, edit, generate, force, clear, view | **Actor/application actions** | Commands and UI behavior are not facts merely because they occur. |
| Registered person/team roster, identity, eligibility, check-in | **Registration** | A lineup may reference these facts but does not own them. |
| Match date/time, court, referee, dispatch/readiness assignment | **Scheduling** | Scheduling owns assignments even when Master performs the action. |
| Point/game state, service, live score, played winner, completion | **Match Operations** | These describe execution, not configured structure. |
| Master credentials, polling, modal confirmation, file parsing | **Legacy application details** | No competition-domain meaning. |

### Boundary cautions

- A generated `task` mixes a configured contest with scheduling/execution readiness. Its legacy shape must not be treated as evidence that one domain owns all fields.
- A `player` record mixes registration identity with group/team labels used by configuration. Classify individual facts, not the whole blob.
- A `team_event` room mixes an encounter fact with lineup-coordination status. “Both lineups submitted” is observable evidence; a UI status transition is not automatically a competition lifecycle.
- A result’s `is_team` marker links execution to team context but does not define the team encounter’s aggregation rules.

---

## 12. Confirmed absences and unresolved semantics

The following are not supported strongly enough by legacy behavior to state as domain rules:

- draw or seeding rules;
- persisted tournament stages or rounds;
- knockout bracket generation or advancement;
- byes, withdrawals, walkovers, substitutions, or redraws;
- group standings, points tables, tie-breaks, qualification criteria, or ranking matches;
- repeated round-robin legs or home/away semantics;
- team encounter victory/termination rules;
- validation that opposing lineup slots and formats agree;
- a stable distinction among category, division, age class, and pool—the legacy `group` field can represent several labels;
- versioning, approval, publication, or effective-time semantics for configuration.

These are evidence gaps, not invitations to design behavior. Any later boundary work should distinguish policy supplied outside TOP from facts that the legacy system actually recorded.

---

## 13. Legacy source map

| Area | Primary evidence |
|---|---|
| Event creation/mode and key/value initialization | `Legacy/data.php` event/config actions; `Legacy/master.html` event management |
| Groups and round-robin generation | `Legacy/master.html` `parseRoundRobinData()` |
| Team schedule parsing and knockout filtering | `Legacy/master.html` `handleImportTeamFile()` and `parseMatchCell()` |
| Individual/manual match task shape | `Legacy/master.html` manual dispatch and generated round-robin tasks |
| Team encounter persistence | `Legacy/data.php` `import_team_event`, `get_team_room`, and team update actions |
| Team template and lineup declaration | `Legacy/master.html` team-template management; `Legacy/team_lineup.html`; `Legacy/data.php` `submit_team_lineup` |
| Team submatch generation | `Legacy/master.html` `forceResolveSubMatches()` and bulk resolution path |
| Scheduling and result separation | `Legacy/data.php` task court/date updates, live-score, and `save_score` actions |

This source map identifies where the observations came from; it does not imply that the legacy file or screen is the owner of the corresponding domain fact.
