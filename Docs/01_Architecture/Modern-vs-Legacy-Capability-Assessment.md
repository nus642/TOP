# Modern vs Legacy Capability Assessment

**Assessment date:** 2026-08-09  
**Repository baseline:** `b95e3d2` (`test: verify modern tournament lifecycle end to end`)  
**Scope:** Current replacement readiness after the first complete Modern tournament lifecycle

## 1. Purpose and assessment rules

This document answers three questions from the repository as it exists today:

1. Which Legacy capabilities Modern can replace now;
2. Which Legacy capabilities remain unmatched or only partly matched; and
3. Which existing capability should be migrated next.

This is a capability assessment, not an architecture or implementation plan. It does not add domain concepts, infer capabilities that are not present in code, or treat a passing isolated test as proof of a complete operator-facing replacement.

The readiness terms used below are:

| Rating | Meaning in this assessment |
|---|---|
| **Replaceable today** | A Modern API/service and persistence path exists, and automated tests cover the relevant behavior. It can replace the stated capability for API consumers, within the listed boundary. |
| **Partial** | Modern contains a meaningful part of the capability, but a Legacy workflow or material behavior has no Modern equivalent. |
| **Not available** | No corresponding Modern route/service and durable behavior is present. |
| **Compatibility only** | Modern serves the existing rapid-scheduler behavior through compatibility routes; this is migration of the old workflow, not coverage by the new lifecycle workflow. |

### 1.1 Evidence boundary

The first complete Modern lifecycle is demonstrated by `Modern/test/tournament-lifecycle.integration.test.js`. It creates a competition, registers players, advances lifecycle state, generates round-robin matches, schedules them, assigns a referee, accepts responsibility, records and confirms one result, calculates standings, and completes the competition without calling the Legacy API.

That test uses an in-memory repository harness. It verifies orchestration across Modern services and domain rules, but it is not a browser test, an HTTP test, or a live-MySQL end-to-end test. Only one generated match is executed and confirmed; the remaining generated matches are scheduled but not played. “Complete lifecycle” therefore means that all lifecycle stages are traversable, not that Modern has reproduced the complete Legacy event operation.

The currently shipped Modern browser page is the rapid scheduling/scoring interface. It calls the compatibility-style `/api/competition/schedule`, `/save`, `/match/:id`, and `/reset` endpoints. It does not expose competition creation, lifecycle transitions, registration, check-in, team administration, match assignment and responsibility, official confirmation, or persisted standings from the new Modern APIs.

## 2. Legacy capability inventory

The Legacy inventory is derived from the checked-in pages and the actions implemented by `Legacy/data.php`. The inventory records working repository scope; it does not assert production usage or quality.

| Legacy capability area | Repository evidence | Material behaviors present in Legacy |
|---|---|---|
| Event configuration and access | `master.html`, `data.php` | Read/update event configuration and event code, switch event mode, referee login/password checks, reset an event. |
| Participant roster and readiness | `players.html`, `checkin.html`, `data.php` | Read/edit/clear rosters, identity-last-four check, waiver text and acceptance lookup, signature check-in, forced bulk check-in, waiver downloads. |
| Team competition and lineup | `team_import.html`, `team_lineup.html`, `master.html`, `data.php` | Import team events, maintain team codes/members/templates/rooms, submit signed lineups, synchronize team/player identifiers, clear team rooms and radar data. |
| Draw, schedule, and court coordination | `master.html`, `courts.html`, `zz.html`, `data.php` | Player/team draws, schedule parsing/import, bulk match tasks, task date/court changes, match deletion, full court dashboard, rapid local round-robin/fixed-pair scheduling. |
| Referee administration | `umpire.html`, `master.html`, `data.php` | Referee roster maintenance, comments, status/court updates, referee messages, performance/history view. |
| Referee match operation | `referee.html`, `scoreboard.html`, `data.php` | Personal assignment retrieval, responsibility workflow, live score synchronization, match timers and operational prompts, final score/report/signature submission, live scoreboard retrieval. |
| Master operation | `master.html`, `courts.html`, `data.php` | Cross-court task control, referee and participant visibility, schedule changes, operational notices, team rooms, live match supervision, manual exception handling. |
| Results and spectator output | `dashboard.html`, `scoreboard.html`, `zz.html`, `data.php` | Live scoreboard, tournament dashboard, notices, broadcast link, rapid-scheduler live rankings and copied results. |
| Documents and organizer content | `docs.html`, `blog.html`, `data.php` | Publish/read/delete documents and articles; download event and waiver data. |

## 3. Modern capability mapping and replacement readiness

### 3.1 Lifecycle path now proven

Modern has a coherent API/service path for a narrow individual round-robin lifecycle:

`competition creation → player registration → lifecycle transitions → round-robin generation → match scheduling → referee assignment → responsibility acceptance → score capture → result confirmation → standings → completion`

The lifecycle states available in code are `draft`, `registration_open`, `ready`, `running`, `completed`, and `archived`. Match confirmation creates an append-only official record, and standings are derived from the latest confirmed official records rather than from scheduled or merely scored matches.

### 3.2 Capability map

| Legacy capability | Modern repository capability | Readiness | What Modern can replace today | What remains |
|---|---|---|---|---|
| Event creation/configuration | Competition create, update, delete, read; explicit lifecycle transitions | **Partial** | Basic competition identity (`name`, `sport`) and lifecycle state for API consumers | Legacy event-code workflow, operating mode, access/password behavior, and broader configuration have no Modern equivalent. |
| Player roster | Register, withdraw, and list players scoped to a competition | **Replaceable today** | Basic participant roster maintenance through Modern APIs | Bulk editing/import, Legacy identity fields, and the operator roster UI remain. Modern registration is deliberately narrower than the Legacy player record. |
| Waiver and check-in | Accept waiver, check in, and read check-in state with competition/player validation | **Partial** | Durable waiver acceptance and player check-in through Modern APIs; check-in requires an accepted waiver | Legacy waiver text administration, identity-last-four validation, signature capture/view, bulk check-in, exports, and participant-facing check-in UI remain. |
| Team membership | Team CRUD and team-member add/list/remove | **Partial** | Basic teams and membership through Modern APIs | Team event import, templates, rooms/codes, signed lineup submission, lineup polling, and team-match workflow remain. The existing `team_rooms` table is not exposed by a Modern service/API. |
| Round-robin match generation | Competition-domain round-robin generation and match persistence | **Replaceable today** | Individual round-robin match creation for registered players through the scoped Modern API | Fixed-pair generation remains on the compatibility flow; team draws, imported schedules, Legacy draw controls, and alternate competition formats remain. |
| Match scheduling | Persist/read one placement per match with time and optional court | **Partial** | Programmatic placement and lookup of an existing match | No Modern schedule-board workflow, bulk rescheduling, court-state dashboard, task date/court operations, or conflict-aware operational view is present. |
| Rapid scheduler | Modern browser UI plus migrated generate/save/update/reset/read routes | **Compatibility only** | The checked-in rapid round-robin/fixed-pair schedule and score workflow, including its current browser page | This path does not use the new assignment/confirmation/official-record lifecycle and remains centered on default tournament ID `1` in its UI-facing calls. |
| Referee assignment and responsibility | Assign match and accept assigned referee responsibility | **Partial** | Per-match assignment and responsibility acceptance through Modern APIs, with identity consistency enforced by the match-operation domain | Referee accounts/login, roster/availability/status, personal task list, messaging, court workflow, and referee UI remain. A referee ID is currently a string on the match, not a managed Modern referee capability. |
| Score capture and result confirmation | Record score, confirm result, read official record | **Partial** | Ordered API workflow for an assigned referee to accept, score, and confirm a match; durable attributed official record with optional evidence reference | Live point-by-point scoreboard sync, game/timer workflow, signatures/report generation, corrections/operational exceptions, and referee/master UI remain. |
| Results/standings | Round-robin standings calculated from confirmed official records and persisted | **Partial** | Confirmed-result standings for the individual round-robin result shape covered by tests | No Modern results UI, full event completion validation, team standings, broader ranking/tiebreak behavior, or exports. Calling the standings read endpoint recalculates and replaces the materialized standings. |
| Trusted match record | Append-only `match_official_records` with attribution, evidence reference/metadata, and provenance | **Partial** | Retrieval of confirmed official records for a match | No event-level archive/read model, archive presentation/export, retention operation, or Legacy signature/report migration is present. Lifecycle state `archived` alone is not an archive capability. |
| Master control and court dashboard | Individual lifecycle, schedule, and match-operation APIs | **Partial** | The underlying API actions for the narrow lifecycle can be driven by a technical client | There is no Modern master console, cross-match operational overview, court board, exception workflow, or integrated readiness/referee/schedule view. |
| Live spectator output and communications | Compatibility rapid-scheduler page can poll schedule data | **Partial** | Read-only observation of the compatibility scheduler state | Legacy live scoreboard, full dashboard, event notices, broadcast link, referee messages, and participant-facing communications remain unmatched. |
| Documents, articles, and downloads | None | **Not available** | Nothing | Legacy organizer document/article management and event/waiver downloads remain Legacy-only. |

## 4. What Modern can replace today

Modern is replacement-ready today for **API-driven execution of the narrow lifecycle that the repository test proves**, specifically:

- creating a basic competition and maintaining a basic player roster;
- advancing a competition through the defined lifecycle states;
- generating individual round-robin matches;
- scheduling each match with a time and optional court;
- assigning a referee identifier, accepting responsibility, recording a final score, and confirming a result in the required order;
- preserving and reading an attributed official match record; and
- calculating individual round-robin standings exclusively from confirmed records.

Modern also has independently tested API capabilities for basic team membership and waiver-gated check-in. Those capabilities can replace their narrow data operations, but not the corresponding Legacy user workflows.

The existing rapid scheduler can continue to be served from Modern through its migrated compatibility endpoints and browser page. That is useful current coverage, but it must not be counted as proof that the new Modern lifecycle has replaced Legacy match operation: its direct match update endpoint does not create the confirmed official record used by the new standings path.

## 5. Current gaps

### 5.1 Replacement blockers

The following gaps prevent Modern from replacing Legacy as the operating application for a complete event today:

1. **No operator-facing lifecycle application.** The new lifecycle APIs are not assembled into a Modern organizer, check-in, referee, master, court, or results interface.
2. **No complete referee capability.** Assignment accepts an opaque referee identifier, while referee roster, login, availability/status, personal tasks, messaging, live scoring, reports, and signatures remain in Legacy.
3. **No master/court coordination.** Modern can place and mutate one match at a time but cannot provide the cross-match/cross-court situational view that Legacy operators use.
4. **Readiness is narrower than Legacy.** Modern persists waiver acceptance and check-in, but not configured waiver text, identity verification, signatures, bulk controls, exports, or participant UI.
5. **Team operation stops at membership.** Team rooms, imports, templates, signed lineups, and team competition operation remain unmatched.
6. **Competition output is narrow.** Modern standings cover confirmed individual round-robin results, without the Legacy dashboards, live scoreboard, communications, team results, or exports.
7. **Archive is only a state and match-level record.** Modern can mark a competition `archived` and retain official match records, but has no repository capability for an understandable event-level archive or archive output.

### 5.2 Verification limits

- The lifecycle integration test replaces repositories with in-memory functions; it does not prove the entire lifecycle against MySQL.
- The lifecycle test calls services directly; it does not prove all lifecycle routes as one HTTP workflow.
- The lifecycle test confirms one of three generated matches before completing the competition. Current lifecycle rules therefore allow completion without all matches being confirmed.
- Existing API, service, repository, domain, and integration tests establish strong component behavior, but there is no browser-level test of the new lifecycle and no Modern UI for it to exercise.

## 6. Migration priority

Priority is based only on current Legacy operational value and the Modern foundations already present. It identifies **what should migrate next**, not how to implement it.

| Priority | Capability to migrate next | Repository-grounded reason |
|---|---|---|
| **1** | Referee match workflow and master/court operational visibility | Modern already has the core assignment → responsibility → score → confirmation APIs, but Legacy still owns the human workflow that drives those actions and the live oversight needed to operate multiple matches. This is the largest gap between the proven lifecycle and an actual tournament replacement. |
| **2** | Participant readiness workflow | Modern already persists waiver acceptance and check-in, while Legacy still supplies waiver content, identity/signature evidence, participant UI, bulk oversight, and exports. Readiness precedes match operation and is already represented by working Modern services. |
| **3** | Team lineup and team-event operation | Modern has teams and membership, but the validated Legacy value lies in rooms, templates/import, signed lineup submission, and team match coordination, none of which is replaced by membership CRUD alone. |
| **4** | Live results, spectator display, and operational notices | Modern has confirmed official records and derived standings, but current event-facing output remains in Legacy. This follows the operational workflow because the output must reflect the confirmed path rather than the compatibility score path. |
| **5** | Event-level archive and exports | Match official records provide source evidence, but Legacy downloads and other event artifacts remain separate. This is important after operation and output, but it is not the immediate blocker to driving a live event through the Modern lifecycle. |
| **6** | Documents and articles | These are real Legacy capabilities, but they do not block the tournament lifecycle now proven in Modern and have no current Modern foundation. |

## 7. Replacement conclusion

Modern has crossed an important but narrow threshold: the repository contains a coherent, tested service-level lifecycle from competition creation through confirmed results and completion. It can replace basic API-level administration, individual round-robin generation/scheduling, ordered final-score confirmation, official match records, and confirmed-result standings within that boundary.

Modern cannot yet replace Legacy as the complete tournament operating product. Legacy remains required for the participant-facing check-in experience, referee terminal, master and court coordination, team lineup operation, live audience output, communications, exports, and organizer content. The next migration priority is therefore the existing referee/master/court workflow around Modern's already-working match-operation core—not another scheduling or result model.

---

**Status:** Current-state capability assessment; documentation only
