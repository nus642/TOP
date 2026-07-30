# Legacy Competition Result Recording Analysis

**Purpose:** Understand existing business logic before designing Modern Competition Result Recording Boundary.

**Date:** 2026-07-30

---

## 1. Legacy Behavior Summary

### 1.1 Match Completion Flow

#### What happens when a match ends

1. **Point tracking phase** (referee.html `addPoint()`):
   - Referee records each point winner during live play
   - System tracks score, serving team, player positions (doubles)
   - Game ends when: `(maxScore >= target && diff >= 2) || (cap > 0 && maxScore >= cap)`
   - For multi-game formats, game winner is recorded and next game starts

2. **Game completion** (`endCurrentGame()`):
   - Alert reminds referee to collect balls and wristbands
   - Game result stored: `matchState.results.push("G{n}: {t1Score} - {t2Score}")`
   - Win counter incremented: `t1Wins++` or `t2Wins++`
   - Match ends when: single-game format OR someone reaches 2 game wins

3. **Final report generation**:
   - Report text generated with match details
   - Referee signature required before submission
   - Signature embedded into report image

#### Who confirms result

- **Primary:** Referee (裁判) signs via canvas signature
- **Validation:** `hasSigned` flag must be true before `submitFinalReport()`
- **Report includes:** Referee name with certification level: `[${currentRefLevel}] ${refereeName}`

#### What data is recorded

| Field | Description | Example |
|-------|-------------|---------|
| `id` | Match identifier | "M001" |
| `court` | Court number | "1" |
| `t1`, `t2` | Team/player names | "张三/李四" |
| `score` | Final score | "21-15" or "2-1" |
| `details` | Game-by-game breakdown | "G1: 21-15 \| G2: 18-21 \| G3: 21-19" |
| `winner` | Winning side name | "张三/李四" |
| `referee` | Referee with level | "[国家级] 王五" |
| `signature` | Base64 image | "data:image/jpeg;base64,..." |
| `is_team` | Team match flag | true/false |
| `time` | Recording timestamp | "2026-07-30 14:30:00" |

#### When record becomes official

Record becomes official when `save_score` API succeeds:
1. Record appended to `records` array
2. Task removed from `tasks` array (match no longer pending)
3. Referee status set to "空闲" (idle)
4. Referee match count incremented

**Key insight:** No separate "approval" step. Referee signature = official confirmation.

---

### 1.2 Master Operation Flow

#### What master receives

Dashboard (`get_full_dashboard`) provides:
- `tasks`: Pending/scheduled matches
- `records`: Completed match results (reversed chronological)
- `courts`: Court status map (idle/in-use, assigned referee, live score)
- `referees`: Referee roster with status and workload
- `team_lineups`: Submitted team lineups
- `team_event`: Team room configurations

#### What master reviews

1. **Match schedules** - Tasks with court assignments, dates
2. **Team lineups** - Lineup submissions with leader signatures
3. **Completed records** - Historical match results
4. **Referee assignments** - Who is officiating where, match counts

#### What master enters manually

**Manual score entry** (`manualScoreTask()`):
```javascript
// Master can record result without referee flow
let payload = {
    action: 'save_score',
    id: taskId,
    court: '1',
    t1: t1Name,
    t2: t2Name,
    score: score,           // e.g., "21-15"
    winner: winner,         // Auto-determined from score
    details: '裁判长手动录入：' + score,
    referee: '裁判长手动',
    referee_id: 'master',
    is_team: false
};
```

**Characteristics:**
- No signature required
- Winner auto-calculated from score comparison
- Marked as "裁判长手动" (Master manual entry)
- Task deleted after recording

#### What master can modify

| Operation | API Action | Notes |
|-----------|------------|-------|
| Create matches | `set_bulk_tasks` | Batch task creation |
| Delete matches | `delete_task` | Remove pending task |
| Change court | `update_task_court` | Reassign match to different court |
| Change date | `update_task_date` | Reschedule match |
| Clear all tasks | `clear_all_tasks` | Reset schedule |
| Manage referees | `set_referees`, `delete_referee` | Roster management |
| Broadcast messages | `set_broadcast` | Announcements |

**Key insight:** Master has full authority over scheduling but does NOT modify completed records in normal flow.

---

## 2. Business Facts Extracted

### 2.1 Domain Facts (Competition Result)

| Fact | Legacy Source | Business Rule |
|------|---------------|---------------|
| Match result | `records[].score` | Final score determines outcome |
| Winner | `records[].winner` | Higher score wins; stored explicitly |
| Game details | `records[].details` | Multi-game matches track each game |
| Confirmation | `records[].signature` | Referee signature = official confirmation |
| Evidence | `records[].signature` (image) | Visual proof embedded in record |
| Timestamp | `records[].time` | Server time at submission |
| Referee identity | `records[].referee` | Includes certification level |
| Match identity | `records[].id` | Links to original task/schedule |

### 2.2 Competition Records

| Record Type | Legacy Storage | Purpose |
|-------------|----------------|---------|
| Official result | `records` array | Tournament history |
| Export data | CSV download | Archival, reporting |
| Signature archive | ZIP download | Legal/compliance evidence |

**Advancement:** Legacy does NOT track bracket advancement. Results are flat records; bracket logic would be external.

### 2.3 Resource/Workflow Data

| Data | Legacy Storage | Domain |
|------|----------------|--------|
| Court state | `courts` object | Resource Management |
| Referee assignment | `referees[].current_court` | Resource Management |
| Referee status | `referees[].status` | Resource Management |
| Match schedule | `tasks` array | Scheduling |
| Live score | `live_scores` object | Match Operations (transient) |

---

## 3. Proposed Modern Domain Ownership Mapping

### 3.1 Competition Result Recording Domain (NEW)

**Owns:**
- Official match result (score, winner, details)
- Result confirmation state
- Result evidence (signatures, timestamps)
- Result immutability rules
- Result correction workflow (if needed)

**Receives from Match Operations:**
- Match completion event
- Final score data
- Referee identity

**Emits to:**
- Tournament Bookkeeping: official result for records
- Advancement Engine: winner for bracket progression (future)

### 3.2 Match Operations Domain

**Owns:**
- Live score tracking during play
- Game state (serving, positions, timeouts)
- Match format rules (target score, win-by-2, cap)
- Multi-game progression

**Does NOT own:**
- Official result storage (transfers to Result Recording at completion)
- Court assignment (Resource domain)
- Referee assignment (Resource domain)

### 3.3 Resource/Scheduling Domain

**Owns:**
- Court availability and assignment
- Referee availability and assignment
- Match scheduling (tasks)
- Schedule modifications

**Does NOT own:**
- Match results (read-only access)
- Live score (Match Operations)

### 3.4 Legacy Implementation Details (DO NOT COPY)

| Legacy Pattern | Issue | Modern Approach |
|----------------|-------|-----------------|
| KV store with JSON blobs | No schema, hard to query | Proper relational/document schema |
| `records` as flat array | No indexing, no relations | Structured result entities |
| Signature as base64 in record | Bloats records | Separate evidence storage |
| Master manual entry bypasses signature | Inconsistent confirmation | Unified confirmation workflow |
| Task deletion on completion | Loses schedule history | Status transition, not deletion |

---

## 4. Boundary Analysis

### 4.1 What belongs to Match Operations

- Point-by-point scoring
- Game/match completion detection
- Serving rotation logic
- Position swapping (doubles)
- Timeout tracking
- Half-court switch reminders

### 4.2 What should become Competition Result Recording

- **Final score capture** - At match completion
- **Winner determination** - Based on score/format rules
- **Confirmation collection** - Referee signature
- **Evidence storage** - Signature image, timestamp
- **Result finalization** - Making record official
- **Manual result entry** - Master override capability
- **Result correction** - Error handling (not in legacy, needed)

### 4.3 What belongs to Resource/Scheduling Domain

- Court status management
- Referee roster and availability
- Match task creation/deletion
- Court assignment changes
- Date rescheduling

### 4.4 What is only legacy implementation detail

- `nhpa_store` table structure
- `kv_get`/`kv_set` functions
- Specific API action names (`save_score`, etc.)
- HTML/JS UI logic
- Base64 signature embedding in JSON

---

## 5. Open Questions Requiring Business Decisions

### 5.1 Result Finalization

**Q1:** Should results require explicit "approval" beyond referee signature?
- Legacy: Referee signature = immediate official
- Consider: Master review step? Auto-approve?

**Q2:** What is the correction workflow for erroneous results?
- Legacy: No correction mechanism found
- Needed: How to handle score entry errors discovered later?

### 5.2 Manual Entry Authority

**Q3:** Who can manually enter results?
- Legacy: Master only (`referee: '裁判长手动'`)
- Consider: Should this be role-based? Audit trail?

**Q4:** Should manual entries require different confirmation?
- Legacy: No signature for manual entry
- Consider: Require master signature? Reason for manual entry?

### 5.3 Evidence Requirements

**Q5:** Is referee signature legally required?
- Legacy: Yes, embedded in record
- Consider: Digital signature validity by jurisdiction

**Q6:** How long must evidence be retained?
- Legacy: Indefinite (in KV store)
- Consider: Compliance requirements, storage costs

### 5.4 Advancement Integration

**Q7:** How do results feed into bracket advancement?
- Legacy: Not implemented (flat records only)
- Needed: Event-driven advancement or manual bracket update?

### 5.5 Multi-Game Formats

**Q8:** What game details must be preserved?
- Legacy: "G1: 21-15 | G2: 18-21 | G3: 21-19"
- Consider: Structured game-by-game data vs. string?

---

## 6. Summary

### Legacy Strengths (Preserve)

1. **Referee signature as confirmation** - Clear authority, audit trail
2. **Detailed game-by-game recording** - Complete match history
3. **Timestamp at submission** - Temporal evidence
4. **Manual override capability** - Handles edge cases
5. **Export functionality** - Archival and reporting

### Legacy Weaknesses (Redesign)

1. **No schema enforcement** - Data integrity risks
2. **Task deletion on completion** - Loses scheduling history
3. **No result correction workflow** - Errors cannot be fixed
4. **Signature embedded in record** - Storage inefficiency
5. **No advancement tracking** - Manual bracket management required

### Recommended Modern Boundary

```
┌─────────────────────────────────────────────────────────────┐
│                    Match Operations                          │
│  - Live scoring, game state, completion detection           │
│  - Emits: MatchCompletedEvent(score, winner, details)       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Competition Result Recording                    │
│  - Receives completion event                                 │
│  - Collects confirmation (signature)                         │
│  - Stores official result with evidence                      │
│  - Handles manual entry and corrections                      │
│  - Emits: ResultFinalizedEvent                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Tournament Bookkeeping / Advancement            │
│  - Receives finalized results                                │
│  - Updates standings, brackets                               │
│  - Historical records                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              Resource/Scheduling (Separate)                  │
│  - Courts, referees, tasks                                   │
│  - Read-only access to results                               │
└─────────────────────────────────────────────────────────────┘
```

---

*End of Analysis*