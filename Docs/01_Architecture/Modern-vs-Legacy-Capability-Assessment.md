# Modern vs Legacy Capability Assessment

**Assessment date:** 2026-08-09

**Repository baseline:** `0519dcd` (`Add competition archive read model`), current main after PR86

**Scope:** Replacement readiness after completion of the Modern operational backend workflow

## 1. Executive assessment

Modern has reached **operational capability parity for core tournament execution at the backend level**. A backend consumer can now move a competition through its lifecycle, establish participant readiness, generate and schedule matches, coordinate master and referee work, expose live operational state, confirm official results, calculate standings, publish a scoreboard, and read the completed competition archive.

This is not full Legacy product replacement. Backend capability completeness means that the core business actions and authoritative views exist and are tested. Complete tournament operating product completeness additionally requires people to perform those actions effectively in their roles. Legacy still provides much of that human-facing experience, together with identity and access behavior, communications, specialist team-event workflows, content, and downloads.

The assessment therefore reaches two conclusions that must remain distinct:

| Assessment level | Conclusion |
|---|---|
| **Modern backend capability completeness** | **Core tournament execution is operationally complete.** The central individual-competition path no longer depends on a missing referee, master, live-status, public-result, archive, or standings backend capability. |
| **Complete tournament operating product completeness** | **Not complete.** Modern does not yet replace all role-facing Legacy workflows or every peripheral and specialist Legacy capability. |

## 2. Assessment method

This document is business-first and capability-driven. It evaluates whether Modern can produce the business outcome, not whether it copies a Legacy page or data structure. It does not prescribe interfaces, identity solutions, future architecture, domains, or persistence changes.

The ratings mean:

| Rating | Meaning |
|---|---|
| **Backend-replaceable** | Modern has the business actions and/or authoritative read capability needed to replace this Legacy backend responsibility within the stated scope. A human-facing replacement may still be absent. |
| **Partially replaceable** | Modern covers a useful part of the Legacy business outcome, but a material backend capability remains outside the Modern path. |
| **Not replaceable** | The Legacy business capability has no corresponding Modern backend capability. |
| **Compatibility only** | Modern continues to serve the old rapid-scheduler behavior, but that path is not evidence of replacement by the Modern operational workflow. |

### 2.1 Evidence boundary

The assessment is based on the checked-in Modern services, routes, repositories, and automated tests at the stated baseline. The end-to-end lifecycle test is service-level and uses an in-memory repository harness. The newer operational projections and workflow actions have focused route, service, and repository tests. Together they establish backend capability; they do not establish a complete browser-based product, production deployment readiness, or the usability of a live tournament workflow.

The proven core path is:

`competition lifecycle → participant readiness → match generation → scheduling → master assignment → referee responsibility and result actions → live operational status → official record → standings → public scoreboard → competition archive`

## 3. Re-evaluation of all Legacy capabilities

| Legacy capability area | Modern backend assessment | What is replaceable now | What remains | Gap type |
|---|---|---|---|---|
| **Event configuration and access** | **Partially replaceable** | Competition creation, reading, maintenance, deletion, and explicit lifecycle transitions | Legacy event-code and operating-mode behavior, referee login/password behavior, and broader event configuration | **Backend capability** for Legacy-specific configuration; **product/identity** for access behavior |
| **Participant roster and readiness** | **Backend-replaceable for core readiness** | Registration and withdrawal, waiver acceptance, check-in, participant readiness state, and competition-level readiness visibility | Bulk roster operations, waiver content administration, identity-last-four checks, signature-oriented evidence, downloads, and participant/operator-facing journeys | Primarily **product experience** for usable role workflows; some **backend capability** for the listed specialist administration and exports |
| **Team competition and lineup** | **Partially replaceable** | Basic team and membership administration | Team-event import, templates, rooms/codes, signed lineup submission and coordination, and team-match operation | **Backend capability** |
| **Draw and match generation** | **Backend-replaceable for the core individual path** | Individual round-robin generation and persisted matches | Team draws, imported schedules, Legacy draw controls, fixed-pair generation outside the compatibility path, and other competition formats | **Backend capability** outside the core path |
| **Scheduling and court placement** | **Backend-replaceable for core execution** | Match placement and retrieval with time and court, available to the operational views | Legacy bulk schedule import/edit controls and its human-operated schedule board | Primarily **product experience** for core execution; **backend capability** for specialist bulk/import behavior |
| **Rapid scheduler** | **Compatibility only** | Existing rapid round-robin/fixed-pair schedule-and-score behavior remains available through the migrated compatibility path | It remains separate from the official Modern operational and result path | **Migration/product consolidation**, not a missing core backend capability |
| **Referee administration** | **Partially replaceable** | Referee-scoped work visibility and validation of the referee's operational context | Referee identity/accounts, roster administration, availability/status management, comments, messages, and performance/history | **Identity/product experience**, plus **backend capability** for administration and communications |
| **Referee match operation** | **Backend-replaceable for core execution** | Assigned-work visibility; responsibility acceptance; start, score, and official confirmation actions; access to match context and readiness; official-record creation | Human-facing referee journey, point-by-point/game/timer assistance, prompts, signatures, reports, messages, and exception handling | Primarily **product experience**; specialist reporting/communication remains a **backend capability** gap |
| **Master operation and court coordination** | **Backend-replaceable for core execution** | Competition-wide operational visibility, readiness/schedule/referee/match status, and master assignment/reassignment/unassignment actions | Human-facing command workflow, notices, manual exception handling, team-room coordination, and other Legacy convenience controls | Primarily **product experience**; communications, team operation, and specialist exceptions remain **backend capability** gaps |
| **Live match operational status** | **Backend-replaceable** | Competition-level view of unassigned, assigned, active, scored, and confirmed matches with schedule, court, referee, and official-result state | Role-appropriate presentation and operational interaction | **Product experience** |
| **Results and spectator output** | **Backend-replaceable for the core path** | Official records, confirmed-result round-robin standings, and a public match scoreboard with score, schedule, court, and confirmation state | Tournament dashboard experience, notices, broadcast links, team results, broader ranking/tiebreak cases, and exports | Primarily **product experience** for core output; **backend capability** for communications, team/broader results, and exports |
| **Competition archive and official records** | **Backend-replaceable for the core path** | Attributed official match records and a completed-competition archive of authoritative competition, match-result, and standings facts | Human-facing archive discovery/presentation, export packages, retention operations, and migration of Legacy signatures/reports | Primarily **product experience**; exports and Legacy artifact continuity remain **backend/migration capability** gaps |
| **Documents and organizer content** | **Not replaceable** | None | Publishing, reading, and deleting documents/articles, plus related downloads | **Backend capability and product experience**, but outside core tournament execution |

## 4. Legacy capabilities now replaceable by the Modern backend

Within the core individual tournament execution boundary, Modern can now replace the following Legacy backend responsibilities:

1. **Competition lifecycle** — establish a competition and move it through its controlled operating states.
2. **Participant readiness** — register participants, record prerequisite readiness actions, and expose readiness for operations.
3. **Scheduling and match generation** — generate the supported round-robin contests and place them in time and on courts.
4. **Match Operations** — assign responsibility, move a match through its operational actions, capture its result, and confirm the outcome.
5. **Referee operational workflow visibility and actions** — show a referee the relevant assigned work and allow the authorized workflow actions.
6. **Master operational visibility and assignment actions** — provide the competition-wide operating picture and manage referee assignment, reassignment, and removal.
7. **Live match operational status** — expose current match state across the competition without treating the operational view as a second authority.
8. **Public scoreboard** — expose the supported live/public match facts and distinguish an officially confirmed outcome.
9. **Official records and Result Engine standings** — retain the confirmed record and derive supported round-robin standings from official outcomes.
10. **Competition archive** — expose a completed competition through its authoritative results and standings rather than treating an `archived` status alone as an archive.

“Replaceable” here is deliberately bounded. It means another product surface or technical consumer no longer needs Legacy to obtain these core actions and facts. It does not mean that tournament staff and participants can stop using every Legacy page today.

## 5. Remaining gaps, classified

### 5.1 Backend capability gaps

The remaining backend gaps are concentrated outside the core individual tournament execution path:

- specialist team-event and signed-lineup operation;
- imported, fixed-pair, team, and other broader draw/schedule behavior not on the core Modern path;
- Legacy-specific event configuration and bulk administration;
- communications such as notices and referee/participant messages;
- detailed referee administration, performance/history, reports, and signature workflows;
- broader result variants, downloads, and export packages;
- document and article publishing; and
- continuity for Legacy-specific artifacts and historical data.

These gaps are real, so Modern must not be described as having complete parity with every Legacy feature.

### 5.2 Product experience gaps

For the now-complete core backend workflow, the larger remaining gap is the operating experience:

- human-facing organizer, participant, referee, master, court, spectator, and archive workflows;
- coherent navigation and role-appropriate presentation across the end-to-end tournament journey;
- operational UX for rapid decisions, bulk work, exceptions, and live coordination;
- identity and authentication needed to connect a real person to the appropriate responsibilities; and
- communication surfaces that deliver readiness requests, assignments, changes, notices, and results to people.

Identity/authentication is essential to a complete operating product, but its absence does not undo the business actions and authoritative read models already present in the Modern backend. Likewise, missing human-facing workflows do not imply that another tournament backend domain is needed; they mean the completed capabilities are not yet assembled into a complete product experience.

### 5.3 Verification and scope limits

- The service-level lifecycle test is not a browser, full HTTP, or live-database end-to-end test.
- Focused tests establish the new operational workflow actions and read models independently; the repository does not yet prove a single human journey across all of them.
- The supported standings path is individual round-robin and is based on officially confirmed results. This does not establish parity for every Legacy format or ranking convention.
- Backend capability parity for core execution does not establish production operability, accessibility, usability, or staff training readiness.

## 6. Migration priority after backend completion

The previous priority was to complete referee/master/court operational backend capability. That work is now present. Migration priority should therefore shift from creating more core backend concepts to making the completed operational path usable and adoptable, while preserving explicit scope for genuine specialist gaps.

| Priority | Migration focus | Business reason |
|---|---|---|
| **1** | Human-facing core operating workflows | Organizer, participant, referee, and master/court users must be able to carry the completed lifecycle in real tournament conditions. This is now the main barrier to replacing Legacy for core execution. |
| **2** | Identity, authentication, and responsibility continuity | Real operators must be connected reliably to referee, master, organizer, and participant responsibilities before Legacy access behavior can be retired. |
| **3** | Operational UX and communication surfaces | Live coordination depends on clear readiness requests, assignments, changes, notices, exception handling, and audience-facing updates—not merely on callable backend actions. |
| **4** | Archive, official-result, and standings product experience | Completed competitions need an understandable human-facing record and usable outputs built from the now-available authoritative archive and result capabilities. |
| **5** | Evidence-led migration of specialist Legacy capabilities | Team events, imports, bulk tools, reports, exports, documents, and other non-core features should migrate according to actual operational dependence; their existence must not be confused with a missing core backend workflow. |

This ordering is a migration priority, not an implementation proposal. It identifies which Legacy value should be displaced next without prescribing interfaces, authentication design, architecture, domains, or storage.

## 7. Conclusion

Modern backend has reached **operational capability parity for core tournament execution**. Competition lifecycle, readiness, scheduling, generation, match operation, referee and master operational workflows, live status, official records, standings, public scoreboard, and competition archive now form a coherent backend capability set.

Modern has **not** reached complete Legacy product replacement. Remaining Legacy value is primarily in:

- human-facing workflows;
- identity and authentication;
- operational UX; and
- communication surfaces.

Legacy also retains genuine non-core backend value in team operation, specialist formats and bulk controls, reporting/exports, and organizer content. The migration should now prioritize adoption of the completed core backend through real operating experiences, then retire or migrate remaining specialist capabilities according to demonstrated business need.

---

**Status:** Current-state capability assessment; documentation only
