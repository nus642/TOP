# M2 Referee Match Operation Experience Engineering Design Record

| Field | Value |
|---|---|
| Design Record ID | ED-M2-RMO-001 |
| Version | 1.0 |
| Status | Approved |
| Design owner | TOP Engineering Team |
| Decision authority | TOP Engineering Governance |
| Design date | 2026-08-18 |
| Authorized by | ERA-M2-TC-001 Version 1.2 (`Ready`); product boundary: `M2-Referee-Match-Operation-Experience-Boundary.md` commit `cd13bf0` |
| Product baseline | M2 Referee Match Operation Experience Boundary (Approved) |
| Governing issue | TBD |

## 1. Design purpose

This record translates the approved M2 Referee Match Operation Experience boundary
into one coherent Modern engineering response.

It designs only the minimum loop:

> Master designates match format at match generation → Referee receives format via
> assigned-match read path → Referee experience pre-fills on-court setup → Referee
> performs pre-match ceremony → Point-by-point rally scoring with serve rotation
> and win-condition evaluation → Score-snapshot updates during play → Game-end
> evaluation → Multi-game tracking → Post-match confirmation with signature →
> Trusted result submission.

Alternative scoring rules (sideout, fixed-position, rally variants) are not part
of this design.

## 2. Current implementation evidence

The following is implementation evidence at the pre-design baseline; it is not
upstream business authority.

| Current evidence | Design relevance |
|---|---|
| `Modern/db.sql` L60–83 | `matches` table has no format columns (`game_format`, `score_rule`, `target_score`, `cap_score`). |
| `Modern/repositories/match-operation.repository.js` L23–54 | `mapRefereeWork` returns no format fields. |
| `Modern/repositories/match.repository.js` L20+ | `createMatch` INSERT does not include format columns. |
| `Modern/services/schedule-import.service.js` L378–391 | Schedule import creates matches without format fields. |
| `Modern/services/competition.service.js` L386+, L689+ | Competition match creation does not include format fields. |
| `Modern/services/match-operations.service.js` L162–166 | `recordScore` accepts only `score1`/`score2`; no live-snapshot endpoint exists. |
| `Modern/services/match-operations.service.js` L168–193 | `submitResult` validates transition and creates official record; unchanged by M2. |
| `Modern/engine/operations/domain/match-operation.js` | Match states unchanged: `accepted → playing → scored → confirmed`. |
| `Modern/operator/referee-workflow.js` | Minimal 4-step flow: accept → start → record final score → confirm. |
| `Modern/operator/app.js` | Match card rendering has no format display. |
| `Legacy/referee.html` L178–179, L711–712, L755, L819–860, L988–1058 | Complete reference implementation: target/cap inputs, task-accept pre-fill, localStorage defaults, executeStartMatch state init, award() rally/sideout logic. |

## 3. Design boundaries

### In this design

- Static match-format configuration columns on existing `matches` table (declared
  exception);
- `mapRefereeWork` read-path extension to return format fields;
- Master writing format defaults at match generation and dispatch;
- Referee experience pre-fill from format fields with on-site override;
- Point-by-point rally scoring client-side state machine (serve rotation, win
  condition, undo, multi-game);
- Score-snapshot write during play through existing `recordScore` endpoint;
- Public scoreboard and master view polling for live score display;
- Client-side backup/restore via localStorage;
- Migration script for existing databases.

### Not in this design

- Backend state machine changes;
- Sideout scoring, fixed-position doubles, rally variants;
- New tables, services, push channels, or workflow engines;
- Master UI for per-match format configuration (defaults only in M2);
- Signature capture implementation detail (separate design concern);
- Match format editing after play begins.

## 4. Engineering decisions

### ED-01: Match-format storage — column extension on existing `matches` table

**Decision:** Add four columns to the existing `matches` table:

| Column | Type | Default | Nullable | Semantics |
|---|---|---|---|---|
| `game_format` | TINYINT UNSIGNED | 1 | NOT NULL | 1 = single game, 3 = best-of-3 |
| `score_rule` | VARCHAR(10) | 'rally' | NOT NULL | `rally` (enabled); `sideout` (reserved, not exposed) |
| `target_score` | SMALLINT UNSIGNED | 21 | NOT NULL | Game-winning target score |
| `cap_score` | SMALLINT UNSIGNED | 21 | NOT NULL | Forced-end cap; 0 = no cap |

**Rationale:**
- Follows Legacy practice (`master.html` L2259: `target_score: 21, cap_score: 21, format: 1, meth: 'rally'`);
- Static configuration facts set before play; not match-state transitions;
- Column extension on existing table avoids new-table overhead while preserving
  the declared exception boundary;
- `cap_score = 0` means no cap (matches Legacy `cap: parseInt(capScore)||0` semantics).

**Alternatives considered:**
- JSON column `match_config` — rejected: harder to query, no default enforcement,
  Legacy uses discrete columns;
- Separate `match_formats` table — rejected: unnecessary normalization for 1:1
  relationship, adds join cost;
- No persistence (pure client-side) — rejected: violates Master-designated format
  delivery requirement.

**Impact:**
- Migration required for existing databases (see §5);
- `createMatch` callers must supply or accept defaults;
- No state machine change; no new service.

### ED-02: Read-path extension — both `map()` and `mapRefereeWork()` return format fields

**Decision:** Extend **both** mapping functions in `match-operation.repository.js`:

1. `mapRefereeWork()` — used by `findByReferee()` for the referee work list:
```javascript
format: {
  gameFormat: Number(row.game_format || 1),
  scoreRule: row.score_rule || 'rally',
  targetScore: Number(row.target_score || 21),
  capScore: Number(row.cap_score || 21)
}
```

2. `map()` — used by `findById()` and all single-match domain operations:
```javascript
format: {
  gameFormat: Number(row.game_format || 1),
  scoreRule: row.score_rule || 'rally',
  targetScore: Number(row.target_score || 21),
  capScore: Number(row.cap_score || 21)
}
```

**Rationale:**
- `findByReferee` uses `mapRefereeWork`; referee experience needs format to pre-fill
  on-court setup;
- `findById` uses `map`; it is the canonical single-match reader used by
  `submitResult`, `recordScore`, and all domain mutations — omitting format here
  would cause data loss on any refresh or re-read path;
- Both queries use `SELECT m.*` or `SELECT *` which includes new columns after
  migration; no additional JOIN required.

**Impact:**
- Frontend receives format in both assigned-match list and single-match reads;
- No breaking change to existing consumers (additive field).

### ED-03: Master writes format defaults at match generation

**Decision:** All `createMatch` call sites supply format defaults **and** the
`createMatch` INSERT statement is extended to include the new columns:

| Call site | Current behavior | M2 behavior |
|---|---|---|
| `schedule-import.service.js` L378 | No format fields | Add `game_format: 1, score_rule: 'rally', target_score: 21, cap_score: 21` |
| `competition.service.js` L386 | No format fields | Add defaults |
| `competition.service.js` L689 | No format fields | Add defaults |
| `match.repository.js` `createMatch` | INSERT without format columns | Extend INSERT column list and VALUES to include `game_format`, `score_rule`, `target_score`, `cap_score` |

**Rationale:**
- Legacy writes at task creation (`master.html` L2259, L2738, L2784, L2906);
- Defaults match Legacy (`rally/21/21`);
- Master UI for per-match override is out of M2 scope; defaults apply;
- The `createMatch` function in `match.repository.js` uses an explicit INSERT with
  a hardcoded column list; new columns **must** be appended to both the column list
  and VALUES clause to avoid `Column count doesn't match value count` errors.

**Alternatives considered:**
- Master UI for per-match format configuration — deferred to future milestone;
- Referee-only format setting — rejected: violates Master-designated requirement;
- Rely on DB defaults without explicit INSERT columns — rejected: explicit is
  clearer and avoids silent default drift.

**Impact:**
- All new matches carry format;
- Existing matches receive defaults via migration;
- No API change required (format flows through existing read path).

### ED-04: Score-snapshot write during play (dedicated lightweight endpoint)

**Decision:** Create a **new** lightweight score-snapshot endpoint that writes
`score1`/`score2` **without** changing status or invoking domain state transitions.
Do **not** reuse the existing `recordScore` service method.

**Why not reuse `recordScore`:**
- `match-operations.service.js` L162–166 calls `repository.recordScore()` which
  executes `UPDATE matches SET score1=?, score2=?, status='scored'` (L193);
- This changes status to `'scored'` on every call, terminating the match lifecycle
  after the first point;
- The existing `recordScore` also goes through domain validation via
  `MatchOperation.recordScore()` which enforces state machine transitions;
- Using it for per-point snapshots would irreversibly corrupt match state.

**New endpoint design:**

```
PUT /api/match-operations/:tournamentId/matches/:matchId/score-snapshot
Body: { score1: number, score2: number }
Response: 204 No Content
```

**Backend behavior:**
- Validate: match exists, status is `playing`, actor is the assigned referee;
- Execute a single lightweight UPDATE: `UPDATE matches SET score1=?, score2=? WHERE id=? AND tournament_id=? AND status='playing'`;
- No transaction wrapper, no `FOR UPDATE` lock, no domain state transition;
- No status change; match remains `playing`;
- Return 204 on success, 409 if match is not in `playing` state.

**Frontend behavior:**
- After each point, call the snapshot endpoint with current `score1`/`score2`;
- Use `AbortController` to cancel any in-flight snapshot request before sending a
  new one (prevents stale writes from overwriting newer state);
- On network error: retry once, then continue (local state is authoritative);
- Public scoreboard and master view poll at 3–5 second intervals.

**Rationale:**
- Legacy uses `sync_live_score` API call (`referee.html` L656–664) as a separate
  fire-and-forget call;
- Separating snapshot from final submission preserves state machine integrity;
- Lightweight UPDATE avoids connection pool exhaustion under concurrent matches;
- Polling avoids new push channel or service.

**Alternatives considered:**
- Reuse `recordScore` — rejected: changes status to `'scored'` (CRITICAL flaw);
- WebSocket push — rejected: new service, violates boundary;
- Separate `live_score` table — rejected: unnecessary duplication;
- No live sync — rejected: violates M2-AC-14.

**Impact:**
- New lightweight write path (one UPDATE per point, no transaction, no lock);
- `recordScore` endpoint remains unchanged for final score submission;
- Public scoreboard displays in-progress scores;
- M2-AC-15 requires clear "in-progress" vs "official" differentiation.

### ED-05: Client-side rally scoring state machine

**Decision:** Implement rally scoring logic entirely in client-side state.

**State shape:**
```javascript
{
  currentGame: 1,
  t1Score: 0,
  t2Score: 0,
  t1Wins: 0,
  t2Wins: 0,
  history: [],           // for undo
  timeline: [],          // point sequence
  halfSwitched: false,
  servTeam: 1 | 2,       // serving team
  servingPlayer: string, // current server identity
  viewBa: boolean,       // perspective swap
  t1: { r: string, l: string }, // team 1 right/left players
  t2: { r: string, l: string }, // team 2 right/left players
  timeoutUsed: { t1: false, t2: false, medicalT1: false, medicalT2: false }
}
```

**Rally rotation rules (from Legacy `award()` L1027–1043):**
1. Every rally produces 1 point for the winner;
2. Winner gains next serve (`servTeam = winTeam`);
3. Doubles: serving-side partners swap left/right only when serving side wins;
4. Next server determined by serving team's score parity:
   - Even score → right-court player serves;
   - Odd score → left-court player serves;
5. Singles: server identity follows team, position follows score parity.

**Game-over guard (from Legacy L989, L1057):**
- After win-condition evaluation returns `true`, set `state.over = true`;
- All subsequent `award()` calls must be rejected with an early return:
  `if (matchState.over || activeTimer) return;`
- This prevents accidental point recording after the game has ended;
- Undo restores `matchState.over = false` (from Legacy L1067).

**Win-condition evaluation (from Legacy L1056–1057):**
```javascript
const maxScore = Math.max(t1Score, t2Score);
const diff = Math.abs(t1Score - t2Score);
const gameEnd = (maxScore >= targetScore && diff >= 2) ||
                (capScore > 0 && maxScore >= capScore);
```

**Undo mechanism (from Legacy L1063–1070):**
- `history` stack stores complete state snapshot before each point;
- Undo pops last snapshot and restores score, rotation, timeline, timeout state;
- `halfSwitched` state also restored.

**Side-switch prompt (from Legacy L1048–1054):**
- Trigger when `maxScore === Math.ceil(targetScore / 2)` and not yet switched;
- Auto-swap perspective and start 60-second timer.

**Rationale:**
- Client-side state ensures UX responsiveness;
- Backend only validates final score submission;
- Legacy implementation is proven and complete.

**Alternatives considered:**
- Backend state machine for point-by-point — rejected: violates boundary, adds
  complexity;
- No undo — rejected: violates M2-AC-09, critical for error recovery.

**Impact:**
- No backend state change;
- Client state is not persisted as backend truth (M2-AC-19);
- localStorage backup provides crash recovery.

### ED-06: localStorage backup and recovery

**Decision:** Implement localStorage backup following Legacy pattern.

**Mechanism:**
- After each point, timeout, side-switch, or game-end, serialize complete client
  state to localStorage keyed by match ID;
- On page load, check for existing backup and offer recovery;
- Clear backup on successful final submission.

**Rationale:**
- Legacy uses `backupState()` after every state change (`referee.html` L727, L859,
  L1058, L1068);
- Provides crash recovery without backend persistence;
- Aligns with M2-AC-19 (client state not persisted as backend truth).

**Impact:**
- Browser storage required;
- Recovery is user-initiated (offer on load).

## 5. Migration

### 5.1 Schema migration

Add idempotent migration for existing databases:

```sql
-- game_format
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='matches' AND COLUMN_NAME='game_format');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE matches ADD COLUMN game_format TINYINT UNSIGNED NOT NULL DEFAULT 1 AFTER score2',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- score_rule
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='matches' AND COLUMN_NAME='score_rule');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE matches ADD COLUMN score_rule VARCHAR(10) NOT NULL DEFAULT ''rally'' AFTER game_format',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- target_score
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='matches' AND COLUMN_NAME='target_score');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE matches ADD COLUMN target_score SMALLINT UNSIGNED NOT NULL DEFAULT 21 AFTER score_rule',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- cap_score
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='matches' AND COLUMN_NAME='cap_score');
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE matches ADD COLUMN cap_score SMALLINT UNSIGNED NOT NULL DEFAULT 21 AFTER target_score',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
```

### 5.2 Default backfill

Existing matches receive defaults via column DEFAULT clause; no data migration
required.

## 6. File change summary

| File | Change | Reason |
|---|---|---|
| `Modern/db.sql` | Add migration block for 4 columns | ED-01 |
| `Modern/repositories/match-operation.repository.js` | Extend `mapRefereeWork()` AND `map()` to return `format` object; add `writeScoreSnapshot()` | ED-02, ED-04 |
| `Modern/repositories/match.repository.js` | Extend `createMatch` INSERT to include format columns in column list and VALUES | ED-03 |
| `Modern/services/schedule-import.service.js` | Add format defaults to `createMatch` call | ED-03 |
| `Modern/services/competition.service.js` | Add format defaults to both `createMatch` call sites | ED-03 |
| `Modern/services/match-operations.service.js` | Add `writeScoreSnapshot()` method (lightweight UPDATE, no transaction, no state change) | ED-04 |
| `Modern/api/referee-workflow.js` | Add `PUT /:matchId/score-snapshot` route | ED-04 |
| `Modern/operator/referee-workflow.js` | Implement pre-match setup flow with format pre-fill | ED-05 |
| `Modern/operator/app.js` | Display format in match card | ED-02 |
| `Modern/operator/api-client.js` | Add score-snapshot write method with AbortController | ED-04 |

## 7. Traceability

| Boundary requirement | Engineering decision |
|---|---|
| Master-designated format delivery | ED-01 (storage), ED-02 (read path), ED-03 (write defaults) |
| Pre-match setup with format pre-fill | ED-02 (read path), ED-05 (client state) |
| Rally scoring serve rotation | ED-05 (client state machine) |
| Win-condition evaluation | ED-05 (client state machine) |
| Live score sync | ED-04 (dedicated snapshot endpoint) |
| Undo last point | ED-05 (history stack) |
| Multi-game tracking | ED-05 (client state) |
| localStorage backup | ED-06 |
| Declared database exception | ED-01 |
| Public scoreboard compatibility | ED-07 (read path already compatible) |
| Master visibility compatibility | ED-07 (read path already compatible) |

### ED-07: Public scoreboard and master visibility read paths (no change required)

**Assessment:** The existing read paths already read `m.score1` and `m.score2`:

- `public-match-scoreboard.repository.js` L15–16: `m.score1, m.score2` in SELECT;
- `public-match-scoreboard.service.js` L23–26: maps `score1`/`score2` to public response;
- `public-match-scoreboard.service.js` L22: returns `status: row.match_status` (enables
  in-progress vs final differentiation);
- `master-operational-visibility.repository.js` L31–32: maps `score1`/`score2`.

**Conclusion:** No code changes required for these read paths. Once ED-04 writes
score snapshots to `matches.score1/score2`, both the public scoreboard and master
visibility will automatically display in-progress scores because they already read
these columns. The `confirmed: Boolean(row.has_official_record)` field in the
public scoreboard provides the required M2-AC-15 differentiation.

## 8. Acceptance criteria mapping

| AC | Engineering decision | Notes |
|---|---|---|
| M2-AC-01 (format config) | ED-01, ED-02, ED-05 | |
| M2-AC-01a (Master pre-fill) | ED-02, ED-03 | |
| M2-AC-01b (defaults) | ED-03 | |
| M2-AC-03 (rally rotation) | ED-05 | Includes game-over guard |
| M2-AC-04 (server display) | ED-05 | |
| M2-AC-05 (timeline) | ED-05 | |
| M2-AC-05a (win condition) | ED-05 | |
| M2-AC-06 (side-switch) | ED-05 | |
| M2-AC-07 (timeout) | ED-05 | |
| M2-AC-08 (medical timeout) | ED-05 | |
| M2-AC-09 (undo) | ED-05 | Includes over-state restore |
| M2-AC-10 (multi-game) | ED-05 | |
| M2-AC-14 (live sync) | ED-04 | Dedicated snapshot endpoint |
| M2-AC-15 (in-progress vs official) | ED-04, ED-07 | Scoreboard already differentiates |
| M2-AC-18 (architectural compliance) | ED-01 (declared exception) | |
| M2-AC-19 (client state) | ED-05, ED-06 | |
| M2-AC-20 (automation coverage) | Test plan §9 | |

## 9. Test plan

### 9.1 Database migration tests

- [ ] Fresh database: verify 4 columns exist with correct defaults;
- [ ] Existing database: verify migration adds columns without data loss;
- [ ] Verify existing matches receive default values.

### 9.2 Read-path tests

- [ ] `findByReferee` returns format object;
- [ ] Format fields are correct types and defaults.

### 9.3 Write-path tests

- [ ] `createMatch` with format fields succeeds;
- [ ] `createMatch` without format fields uses defaults;
- [ ] Score-snapshot write does NOT change status (remains `playing`);
- [ ] Score-snapshot write returns 409 if match status is not `playing`;
- [ ] Score-snapshot write is a single UPDATE without transaction/lock;
- [ ] Final `recordScore` still changes status to `scored` (regression).

### 9.4 Client-side state machine tests

- [ ] Rally rotation: partner swap on serve win;
- [ ] Rally rotation: parity-based next server;
- [ ] Rally rotation: no swap when receiving side wins;
- [ ] Win condition: target + 2-point lead;
- [ ] Win condition: cap-score forced end;
- [ ] Win condition: cap=0 no cap;
- [ ] Game-over guard: points rejected after game ends;
- [ ] Undo: restores score, rotation, timeline, and over-state;
- [ ] Side-switch: triggers at half-score;
- [ ] Side-switch: triggers only once;
- [ ] Multi-game: best-of-3 tracking;
- [ ] Timeout: quota tracking per game;
- [ ] Medical timeout: quota tracking per match;
- [ ] AbortController: in-flight snapshot cancelled before new one sent.

### 9.5 Live sync tests

- [ ] Score-snapshot write updates `matches.score1/score2`;
- [ ] Score-snapshot write does NOT update `matches.status`;
- [ ] Public scoreboard displays in-progress score (status=`playing`, confirmed=false);
- [ ] Master view displays in-progress score;
- [ ] In-progress score is visually differentiated from official result (M2-AC-15);
- [ ] After final submission, score shows as confirmed;
- [ ] Concurrent snapshot writes do not corrupt data.

### 9.6 Backup/restore tests

- [ ] State is backed up to localStorage after each point;
- [ ] Recovery restores complete state;
- [ ] Backup is cleared on final submission.

## 10. Non-decisions

ED-M2-RMO-001 makes no decision about:
- Sideout scoring implementation (deferred);
- Fixed-position doubles implementation (deferred);
- Master UI for per-match format configuration (deferred);
- Signature capture implementation detail;
- WebSocket or push-channel implementation;
- Match format editing after play begins;
- Tournament creation, draw generation, or schedule optimization.

## 11. Implementation constraints (from review)

These constraints are derived from the Gemini review findings and must be observed
during implementation:

1. **XSS prevention:** All HTML template interpolations in the referee scoring panel
   must use an `escapeHtml` function that escapes `<`, `>`, `"`, `'`, and `&`.
   Attribute values (e.g., `data-team="${team}"`) require quote-aware escaping.
2. **Polling lifecycle:** Score-snapshot writes must use `AbortController` to cancel
   in-flight requests before sending new ones. On network error, retry once then
   continue (local state is authoritative).
3. **Status guard:** The score-snapshot endpoint must reject requests when match
   status is not `playing` (return 409). This prevents writes after final submission.
4. **No domain bypass:** The score-snapshot endpoint validates actor identity and
   match assignment but does NOT invoke domain state machine transitions.

## 12. Review record

| Round | Reviewer | Result | Outcome |
|---|---|---|---|
| R1 (2026-08-18) | Independent audit (Gemini Pro) | Hold — Needs Revision | 3 CRITICAL (status-machine conflict in score snapshot; `map()` read-path gap; public/master read-path coverage), 2 MAJOR (transaction/lock contention; INSERT column list), 4 MINOR findings. |
| R1 disposition (2026-08-18) | Design owner | Findings closed | ED-04 rewritten (dedicated snapshot endpoint, no transaction/lock/state change); ED-02 extended to `map()`; ED-07 added (read paths verified compatible); ED-03 expanded (INSERT column list); ED-05 game-over guard; implementation constraints §11. Commit `7569cd8`. |
| R2 (2026-08-18) | Independent audit (Gemini Pro) | Pass — Clear to proceed | All 6 dimensions pass with zero findings. Snapshot path decoupled from state machine; read paths closed; high-frequency write path lightweight. |

## 13. Change and reconsideration control

This design applies only to the exact baselines above. A material change to the
product boundary, a cited source, a decision, or a finding requires governed
impact review and reassessment.

---

**Status:** Approved; implementation authorized per review record §12
