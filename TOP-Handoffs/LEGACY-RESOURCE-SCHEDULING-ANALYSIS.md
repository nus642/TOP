# Legacy Resource & Scheduling Behavior Analysis

**Purpose:** Extract valid business behavior from legacy before designing Modern Resource/Scheduling boundary.

**Source Files Analyzed:**
- `Legacy/courts.html` - Court scheduling Kanban board
- `Legacy/referee.html` - Referee match execution terminal
- `Legacy/data.php` - Backend data API


## 1. Court Lifecycle

### Court Definition
- Courts are defined in event config as a simple array (e.g., `['1', '2', '3', '4']`)
- Courts are static resources configured at event creation
- No court capacity or type attributes

### Court Assignment
- Matches (tasks) are assigned to courts via drag-and-drop on Kanban board
- `update_task_court` API updates task's court field
- Assignment is manual, performed by OBS director role

### Court State
- Court status is **derived**, not stored directly
- Status computed from referee status: if any referee has `status === '执裁中'` and `current_court === X`, then court X is "比赛中"
- Otherwise court is "空闲"
- Live score tracked per court in `live_scores` KV store

### Court Release
- When referee status changes to "空闲", the court's live score entry is deleted
- Court becomes available implicitly
- No explicit release action or reservation system


## 2. Referee Lifecycle

### Referee Registration
- Referees self-register at login with: name, password, level
- Levels: L1 (见习裁判), L2 (认证裁判), L3 (高级裁判)
- Level affects scoring weight (W=0.8, 1.2, 1.5) - legacy rating concept
- Referee record created on first login if not exists

### Referee State
- States: "空闲" (idle), "执裁中" (officiating)
- State stored in `referees` KV array
- Record: `{ name, status, current_court, match_count, comment, last_login }`

### Referee Assignment
- Referees pull tasks from a shared task list (`get_personal_tasks`)
- No automatic assignment or qualification matching
- Referee manually selects and accepts a task

### Task Ownership
- Once referee accepts a task, they own its execution
- Referee status updates tied to match lifecycle:
  - Accept task → "执裁中"
  - Complete/abandon → "空闲"
- `match_count` incremented when score is saved

### Qualification/History
- Level selected at login (self-declared)
- `match_count` tracks total matches officiated
- `comment` field for manual notes
- No formal qualification verification or history tracking


## 3. Scheduling Behavior

### Match Scheduling
- Matches (tasks) created via `set_bulk_tasks` API
- Task structure: `{ id, t1, t2, court, status, date, format, target_score, cap_score, live_score, ... }`
- Tasks initially in "待办调度池" (pending pool) with no court assigned
- Director drags tasks to courts on Kanban board

### Reassignment
- Tasks can be dragged between courts at any time
- `update_task_court` updates task's court and migrates live score
- No conflict detection or validation

### Delays
- No explicit delay tracking
- Tasks remain in pool until assigned
- No time-based scheduling (only date-level granularity)

### Conflicts
- No conflict detection
- Multiple tasks can be assigned to same court (queue)
- Court displays queue of pending tasks

### Completion
- When score is saved (`save_score`):
  - Task removed from `tasks`
  - Record added to `records`
  - Referee `match_count` incremented
- Record structure: `{ id, court, t1, t2, score, winner, details, referee, signature, is_team, time }`


## 4. Ownership Classification

### Domain Facts

**Assignment Facts:**
- Task-to-court assignment (which match on which court)
- Referee-to-match assignment (who officiates which match)
- Task date assignment (which day)

**Availability Facts:**
- Referee status (idle/officiating)
- Court status (derived from referee status)

**Completion Facts:**
- Match record (final score, winner, referee, signature, time)
- Referee match count

### Workflow Behavior

**Task Handling:**
- Drag-and-drop court assignment
- Task queue per court
- Manual task pull by referee

**Notifications:**
- Chief referee message broadcast (`referee_msg`)
- Broadcast message to all (`broadcast_msg`)
- No automated notifications

**Operational Actions:**
- Manual court assignment
- Manual task acceptance
- Manual status updates

### Legacy Implementation Details

**UI Choices:**
- Kanban board for court scheduling
- Mobile-first referee terminal
- Drag-and-drop interaction

**API Choices:**
- Single PHP endpoint with action routing
- KV store pattern (event_code + data_key → JSON)
- Polling-based updates (5s interval)

**Storage Choices:**
- MySQL with generic KV table (`nhpa_store`)
- Separate table for waivers (`nhpa_waivers`)
- JSON-encoded values


## 5. Modern Boundary Proposal

### Resource Management Domain

**Owns:**
- Court resource definition (static configuration)
- Court availability state
- Referee resource definition
- Referee availability state

**Does NOT own:**
- Match assignment decisions
- Task queue management
- Score recording

### Scheduling Domain

**Owns:**
- Match-to-court assignment facts
- Match date assignment
- Task queue per court
- Reassignment operations

**Does NOT own:**
- Court resource lifecycle
- Referee resource lifecycle
- Match execution
- Score recording

### Match Operations Domain

**Owns:**
- Match execution context
- Live score state
- Match result facts
- Confirmation facts
- Evidence references

**Does NOT own:**
- Court assignment
- Referee assignment
- Task scheduling
- Resource availability

### Competition Domain

**Owns:**
- Tournament structure
- Match generation (which teams play)
- Advancement rules
- Ranking interpretation

**Does NOT own:**
- Court scheduling
- Referee assignment
- Match execution
- Resource management


## 6. Key Observations

### Valid Business Behaviors to Preserve

1. **Court as static resource** - Courts are configured per event, not dynamically created
2. **Referee self-registration** - Referees register at login, not pre-configured
3. **Manual assignment** - Court assignment is a human decision, not automated
4. **Derived court status** - Court busy/free derived from match activity
5. **Task queue model** - Multiple matches can queue on one court
6. **Date-level scheduling** - Multi-day events with date granularity
7. **Completion removes task** - Finished matches move from tasks to records

### Legacy Coupling to Avoid

1. **Referee status drives court status** - Tight coupling between referee and court
2. **Single KV store** - All data in generic JSON blobs
3. **Polling-based sync** - No event-driven updates
4. **No conflict detection** - Silent over-assignment possible
5. **Self-declared qualification** - No verification of referee level

### Explicitly Excluded from Modern Design

- Workflow engine
- Automatic scheduling
- Notification service
- Ranking calculation
- Analytics pipeline
- Event bus architecture


## 7. Principle Reminder

**TOP is a domain fact system, not a workflow engine.**

Resource Management records resource facts.
Scheduling records assignment facts.
Match Operations records execution facts.
Competition records tournament facts.

Each domain owns its facts.
No domain controls another domain's behavior.
Consumers read facts; they do not trigger workflows.