# M2 Referee Match Operation Experience Engineering Design Record

| Field | Value |
|---|---|
| Design Record ID | ED-M2-RMO-001 |
| Version | 0.1 |
| Status | Draft |
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

### ED-02: Read-path extension — `mapRefereeWork` returns format fields

**Decision:** Extend `mapRefereeWork` in `match-operation.repository.js` to return:

```javascript
format: {
  gameFormat: Number(row.game_format || 1),
  scoreRule: row.score_rule || 'rally',
  targetScore: Number(row.target_score || 21),
  capScore: Number(row.cap_score || 21)
}
```

**Rationale:**
- Referee experience needs format to pre-fill on-court setup;
- `findByReferee` query uses `SELECT m.*` which already includes new columns after
  migration;
- No additional JOIN required.

**Impact:**
- Frontend receives format in assigned-match response;
- No breaking change to existing consumers (additive field).

### ED-03: Master writes format defaults at match generation

**Decision:** All `createMatch` call sites supply format defaults:

| Call site | Current behavior | M2 behavior |
|---|---|---|
| `schedule-import.service.js` L378 | No format fields | Add `game_format: 1, score_rule: 'rally', target_score: 21, cap_score: 21` |
| `competition.service.js` L386 | No format fields | Add defaults |
| `competition.service.js` L689 | No format fields | Add defaults |

**Rationale:**
- Legacy writes at task creation (`master.html` L2259, L2738, L2784, L2906);
- Defaults match Legacy (`rally/21/21`);
- Master UI for per-match override is out of M2 scope; defaults apply.

**Alternatives considered:**
- Master UI for per-match format configuration — deferred to future milestone;
- Referee-only format setting — rejected: violates Master-designated requirement.

**Impact:**
- All new matches carry format;
- Existing matches receive defaults via migration;
- No API change required (format flows through existing read path).

### ED-04: Score-snapshot write during play

**Decision:** Reuse existing `recordScore` endpoint for live score snapshots.

**Mechanism:**
- Referee experience calls `PUT /api/match-operations/:tournamentId/matches/:matchId/score`
  (or equivalent existing endpoint) after each point with current `score1`/`score2`;
- Backend writes `score1`/`score2` to `matches` table without changing status;
- Status remains `playing` until final submission;
- Public scoreboard and master view poll `matches.score1/score2` at 3–5 second intervals.

**Rationale:**
- Legacy uses `sync_live_score` API call (`referee.html` L656–664);
- Modern already has `recordScore` which writes `score1`/`score2`;
- Polling avoids new push channel or service;
- Score-snapshot writes are idempotent and do not affect state machine.

**Alternatives considered:**
- WebSocket push — rejected: new service, violates boundary;
- Separate `live_score` table — rejected: unnecessary duplication;
- No live sync — rejected: violates M2-AC-14.

**Impact:**
- Increased write frequency to `matches` table (one write per point);
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

| File | Change |
|---|---|
| `Modern/db.sql` | Add migration block for 4 columns |
| `Modern/repositories/match-operation.repository.js` | Extend `mapRefereeWork` to return `format` object |
| `Modern/repositories/match.repository.js` | Extend `createMatch` INSERT to include format columns |
| `Modern/services/schedule-import.service.js` | Add format defaults to `createMatch` call |
| `Modern/services/competition.service.js` | Add format defaults to both `createMatch` call sites |
| `Modern/services/match-operations.service.js` | (No change — `recordScore` already accepts `score1`/`score2`) |
| `Modern/operator/referee-workflow.js` | Implement pre-match setup flow with format pre-fill |
| `Modern/operator/app.js` | Display format in match card |
| `Modern/operator/api-client.js` | Add score-snapshot write method |

## 7. Traceability

| Boundary requirement | Engineering decision |
|---|---|
| Master-designated format delivery | ED-01 (storage), ED-02 (read path), ED-03 (write defaults) |
| Pre-match setup with format pre-fill | ED-02 (read path), ED-05 (client state) |
| Rally scoring serve rotation | ED-05 (client state machine) |
| Win-condition evaluation | ED-05 (client state machine) |
| Live score sync | ED-04 (score snapshot) |
| Undo last point | ED-05 (history stack) |
| Multi-game tracking | ED-05 (client state) |
| localStorage backup | ED-06 |
| Declared database exception | ED-01 |

## 8. Acceptance criteria mapping

| AC | Engineering decision |
|---|---|
| M2-AC-01 (format config) | ED-01, ED-02, ED-05 |
| M2-AC-01a (Master pre-fill) | ED-02, ED-03 |
| M2-AC-01b (defaults) | ED-03 |
| M2-AC-03 (rally rotation) | ED-05 |
| M2-AC-04 (server display) | ED-05 |
| M2-AC-05 (timeline) | ED-05 |
| M2-AC-05a (win condition) | ED-05 |
| M2-AC-06 (side-switch) | ED-05 |
| M2-AC-07 (timeout) | ED-05 |
| M2-AC-08 (medical timeout) | ED-05 |
| M2-AC-09 (undo) | ED-05 |
| M2-AC-10 (multi-game) | ED-05 |
| M2-AC-14 (live sync) | ED-04 |
| M2-AC-18 (architectural compliance) | ED-01 (declared exception) |
| M2-AC-19 (client state) | ED-05, ED-06 |
| M2-AC-20 (automation coverage) | Test plan required |

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
- [ ] Score-snapshot write does not change status.

### 9.4 Client-side state machine tests

- [ ] Rally rotation: partner swap on serve win;
- [ ] Rally rotation: parity-based next server;
- [ ] Win condition: target + 2-point lead;
- [ ] Win condition: cap-score forced end;
- [ ] Win condition: cap=0 no cap;
- [ ] Undo: restores score, rotation, timeline;
- [ ] Side-switch: triggers at half-score;
- [ ] Multi-game: best-of-3 tracking;
- [ ] Timeout: quota tracking per game;
- [ ] Medical timeout: quota tracking per match.

### 9.5 Live sync tests

- [ ] Score-snapshot write updates `matches.score1/score2`;
- [ ] Public scoreboard displays in-progress score;
- [ ] Master view displays in-progress score;
- [ ] In-progress score is visually differentiated from official result.

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

## 11. Change and reconsideration control

This design applies only to the exact baselines above. A material change to the
product boundary, a cited source, a decision, or a finding requires governed
impact review and reassessment.

---

**Status:** Draft; awaiting review
