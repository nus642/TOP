# TOP Runtime Ownership Decision Record

Record ID: D-03-DR

Version: 1.1

Status: Approved

Approved by: Paul Wu

Approved date: 2026-09-12

Last Updated: 2026-09-12

Owner: Paul Wu

Type: Architecture / Runtime Ownership Decision (ADR-class, governance binding)

Repository baseline: `nus642/TOP` @ `3b2d905` (evidence baseline for all findings in this record)

Derived from: Issue #190 Canon & Existing Capability Review → D-03 Legacy ↔ Modern Runtime Ownership Decision Review

Modifies code: No. Modifies Canon: No. Creates new architecture: No.

---

## Decision

TOP adopts a **gated dual-track runtime ownership policy**. Ownership is assigned per event class, not per codebase, and Modern's forward-development primacy is explicitly separated from Modern's runtime eligibility.

**D1. Legacy is the Production Runtime of Record.**
Until the gates in `## Production Go/No-Go Gates` are closed with committed evidence, every real-event runtime — including the next 9.12-class team event — runs on Legacy. Legacy receives **constrained enhancement only**, as enumerated in `## Legacy Policy`.

**D2. Modern is the Primary Forward Development runtime for the existing Online migration track.**
For the existing Online migration track, Modern is the Primary Forward Development runtime and the **default location for new authoritative domain modeling and new Online operational capability**. This primacy is a decision **by elimination**, not by aesthetic preference: Legacy's own handoff analyses characterize its model as destructive with versioning UNRESOLVED, and it has no relational headroom. Primacy in development does **not** confer runtime eligibility.

D2 is **scoped**. It does not determine the internal architecture of any future TOP Local, and it does not assert that all future productization of every kind must land in Modern. Anything outside the Online migration track is undecided by this Decision.

**D3. Modern must pass G1–G6 before it may be designated the runtime for any real event.**
The gates are mandatory, evidence-based, and individually non-waivable by assertion. An event may not be scheduled onto Modern because "Modern is ready in principle"; it may only be scheduled onto Modern after the gate evidence is committed to the repository.

**D4. Modern's readiness is evaluated separately per event class.**
Individual-event readiness and team-event readiness are distinct determinations with distinct evidence requirements. **Modern currently does not hold 9.12-class team-event runtime eligibility**, and no individual-event eligibility either, because G1 remains open.

**D5. Cutover is phased by event type and capability evidence, never a single global switch.**
See `## Cutover Policy`.

**D6. TOP Local is not a formally existing product or runtime and is out of scope for this Decision.**
What 9.12 validated is that **Competition Continuity fallback is feasible**. It did not validate "TOP Local". TOP Local's product and technical relationship to Legacy and Modern is currently **UNDECIDED**, and is to be determined by a Local Product Review, a DR / Competition Continuity Review, and a GTM Review. This Decision deliberately reaches **no** conclusion about Local's internal architecture.

**D7. Shared infrastructure coupling must be explicitly decoupled.**
Both tracks currently share the `nhpa` MySQL database name, and committed production dumps exist in the repository. This Decision requires that coupling to be documented and removed as a governance precondition, not left as an unstated assumption. *(Scope note: D7 concerns the Legacy↔Modern Online coupling only. It is not a statement about any future Local runtime.)*

**Decision sentence:** *下一场 9.12 级别的团体赛事将在 Legacy 上运行。这不是偏好，而是仓库当前唯一能支持的配置。同时，Modern 是 Online 迁移轨道上唯一具备建模余量的栈，因此是该轨道所有新能力的默认落点——但在通过 G1–G6 之前，不得被指定为任何真实赛事的 runtime。TOP Local 的产品与技术形态本 Decision 不予决定。*

---

## Context

Two runtimes exist in parallel and have diverged in opposite directions.

**Legacy** is a PHP 7.4 monolith: a single `action`-parameter switch router (`Legacy/data.php`, 1388 lines) over one MySQL key-value blob table (`nhpa_store (event_code, data_key, data_value LONGTEXT)`), with a referee **PULL** model (self-claim from a shared task pool). It is deployed to 微信云托管 as service `nhpa` on `https://www.referee.top`, **1 instance**, image `php:7.4-apache`. It carries concrete production deployment records — `nhpa-159` (2026-08-24 07:37:27, rollback target `nhpa-156`) and `nhpa-160` (2026-08-25, explicitly designated "下一场团体赛的 Legacy 生产基线").

**Modern** is Node.js / Express 5 over a relational schema (`Modern/db.sql`, 394 lines, 19+ objects plus one VIEW), layered API → Service → Repository → Database, with a Master **PUSH** model. It targets a Tencent Lighthouse VPS, Node 20 + MySQL 8, PM2 single fork, plain **HTTP on IP:3000, no HTTPS**. It has **zero** production deployment records.

The context that forced this Decision is a **capability inversion**: the stack that ran the 2026-09-12 event is the stack that cannot hold new domain modeling, and the stack that can hold new domain modeling is the stack that has never been deployed. Issue #190's field evidence was gathered entirely from the Legacy runtime, yet the capabilities it observed as missing or strained are, in roughly 70% of cases, already modeled — in Modern.

A prior planning document, `Docs/00_Project/Roadmap-036-038.md:17-21` (Version 1.0, **Status: Proposed**, Last Update 2026-07-22), asserts that "**Legacy is frozen — it receives no new architecture investment, only critical fixes.**" That assertion is contradicted by subsequent repository history: all eight Legacy commits fall in 2026-08-24 → 2026-09-03 (#151, #152, #153, #154, #155, #157, #159, #162, #164), including two production releases, an atomic match-recovery command set, and active-match ownership hardening. Meanwhile Modern's last commit is `02a29e0` (2026-08-21) — 22 days before the 9.12 event, while HEAD is 9 days before it. The "frozen" framing therefore cannot be used as the basis for an ownership decision; it describes an intention that the repository did not follow.

This Decision exists to replace that ambiguous state with an explicit, enforceable ownership rule, per `Development-Principles.md` §9 (Documentation As System Memory: "The project should not depend on conversation history alone") and §2 (Architecture Before Feature Expansion).

**Scope limitation of this Decision.** D-03 was asked to determine runtime ownership between two existing runtimes. It was not asked to define a third one. Where 9.12 field evidence touched on disconnected or single-machine operation, that evidence is recorded here only as *continuity behavior observed under interruption*, and is explicitly not converted into a product or architecture position.

---

## Evidence

All evidence below is repository-observed at baseline `3b2d905`. No evidence is inferred from #190's hypotheses.

### E1 — The 9.12 event ran on Legacy, not Modern
- `get_full_dashboard` exists only at `Legacy/data.php:500-542`. Modern has no equivalent single-call master projection endpoint of that shape.
- Legacy has two dated production deployment records with image digests and file SHA-256 hashes matching production downloads (`RESULT-Legacy-nhpa-159-production-security-hotfix.md:65-80, 84-89`; `RESULT-Legacy-nhpa-160-team-code-production-deployment.md:3-11, 84-110`).
- Modern has no production deployment record of any kind.
- All dedicated operational tooling targets Legacy: `Tools/legacy-live-record-visibility/`, `Tools/legacy-match-recovery/`, `Tools/legacy-team-event-readiness/`, `Tools/legacy-team-event-rehearsal/`.
- Commit chronology: Legacy active through 2026-09-03; Modern silent since 2026-08-21.

**Conclusion:** 9.12 was not a Modern failure. Modern never ran. Any inference from #190 about "Modern's production behavior" is category-invalid.

### E2 — Modern cannot operate a team event
- `Modern/db.sql:48-58` defines `team_rooms (id, tournament_id, code, name, status VARCHAR(30) DEFAULT 'draft', created_at, updated_at)` — but `Modern/repositories/team.repository.js:138, 150, 163-175` (`createTeamRoom`, `getTeamRoomByIdForTournament`, `listTeamRooms`) are referenced **only inside that same file**. No service, route, UI, or test consumes them. This is dead code.
- `Modern/services/team.service.js:208-216` provides team and member CRUD only and never calls any team-room function.
- Legacy's team-event chain — `import_team_event` (`:926`), `get_team_room` (`:980`), `submit_team_lineup` (`:985`), room lifecycle (`:918-997`), Master 核碰下发 (`master.html:2268-2310`) — has **no Modern counterpart**.
- This corroborates the standing assessment: `Modern-vs-Legacy-Capability-Assessment.md:49` rates "Team competition and lineup" as **Partially replaceable**, with the gap type explicitly "**Backend capability**".

### E3 — Modern's own audit records a still-open Blocking defect at HEAD
`Docs/09_Issues/ISSUE-m2-matchday-delivery-audit-and-plan.md` (baseline `main @ 6fd2f29`, test baseline 517/517) §3:
- **B1 (Blocking):** `Modern/docs/FIRST-EVENT-RUNBOOK.md:74-75` and `:177-178` instruct `MYSQL_PASSWORD` / `MYSQL_DATABASE`, while `Modern/database/db.js:8-9` reads `MYSQL_PASS` / `MYSQL_DB`. `Modern/docs/deployment.md:60-61` is correct — **the two Modern documents contradict each other.** Stated impact: "按 runbook 部署云端会静默回落 root/123456 默认值，DB 连接失败，**整场赛事无法开始**."
- **M2:** "云端部署与云端彩排尚未执行；仓库内仅有本地彩排记录."
- **M3:** 备份恢复演练未执行过.
- **M4:** 本地回退（local fallback）未作为演练正式演示.
- **M1:** 彩排只跑 1 波 6 场 + 1 次换派，未满足 Issue #142 要求的「至少两轮 turnover」，场地周转未被验证.
- The document has **no status-closure header** — it remains an open plan. Its prescribed closure artifacts `RESULT-m2-matchday-gonogo.md` and `RESULT-m2-local-fallback-demo.md` **do not exist**.

### E4 — Modern's identity boundary is weaker than Legacy's
- `Modern/api/session.js:7` — "Development bootstrap only: replace this boundary with credential verification." `:8-17` `POST /api/session/foundation-establish` accepts a **caller-declared** actor.
- `Modern/docs/README.md:14-16` — "Entering an actor ID **does not prove identity**, and this endpoint is **not production authentication**." `:24-33` — a referee picks their own name from a public roster; "anyone on the network can impersonate a listed referee."
- `Modern/session/actor-session.js:12-28` — a process-local `Map` of opaque tokens; no accounts, credentials, or persistence. `Modern/ecosystem.config.js:3-4` warns cluster mode would break identity.
- `Modern/server.js:44` mounts `competitionRoutes` on `/api/competition` **without** `requireActorSession`; `:41` mounts `/dev` **unconditionally**, making `Modern/dev/dev-login.html` publicly reachable.
- `Modern/session/production-identity-boundary.js` defines the future seam but is **not mounted**; `Modern/docs/production-identity-integration.md:5-8, 19-21, 64-68` confirm `identityAdapter.verify` and `actorLink.resolve` are unimplemented ports with no provider, protocol, account model, or persistence.
- By contrast Legacy gates referee actions behind `referee_password` (`data.php:172, 174, 360, 494, 564, 612, 622`) and super-admin actions behind `is_super_admin_authorized` — externalized in #162.

**Conclusion:** Modern cannot be said to be "more production-ready" on access control. It is strictly weaker.

### E5 — Modern has no CI, no HTTPS, no push transport
- No `.github/` directory anywhere; no root `package.json`. Tests exist (≈67 files) but are only runnable manually via `npm test` = `node --test` (`Modern/package.json:9`).
- `Modern/docs/deployment.md:99, 180-181` — plain HTTP on `IP:3000`, no HTTPS; `:171-183` enumerates accepted risks (in-memory sessions lost on restart, no password authentication, single instance, no HTTPS, timezone dependency).
- `Modern/public/` has **no** `setInterval` and no auto-refresh; `Modern/test/public-scoreboard-ui.test.js:78, 135` actively **forbids** websocket and notification machinery.

### E6 — Legacy holds a complete, tested, audited recovery capability with zero UI wiring
Commit `2d733c8` (#159) added `get_match_recovery_preview` (`data.php:675-689`), `recover_match` (`:690-723`), `get_recovery_audit` (`:724-727`), with four actions (`undo_pending_keep_court`, `undo_pending_unschedule`, `return_running_unscheduled`, `move_court`), `request_id` idempotency, `expected_*` optimistic concurrency, and a `recovery_audit` trail excluding password/signature. It correctly refuses once an official result exists ("必须进入赛果更正流程"). Mirrored by `Tools/legacy-match-recovery/recovery-static-behavior.test.js:16-94` and `recovery-http-mysql.integration.test.js:20-101`.

**`Legacy/master.html` contains no call to any of the three recovery actions.** The capability is backend-complete and unreachable by a human operator.

### E7 — Legacy holds an unguarded legacy-compatible court-mutation path
`Legacy/data.php:728` `update_task_court` operates in two modes; `:334` `update_task_date` has no lock, no audit, no guard, and **no frontend caller**. Combined with the first-writer-wins court-card projection precedence at `data.php:504-531`, this is a concrete, testable mechanism candidate for stale court display in Master. Recorded here as **hypothesis for RCA to measure**, not as a conclusion.

### E8 — Committed production data with PII
`Legacy/backup.sql` (261 KB) and `Legacy/backup_fixed.sql` (268 KB, BOM + UTF-8→GBK mojibake) are real mysqldump outputs (client 8.0.25, host `30.47.14.16`, server `8.0.30-cynos`) containing June-2026 events with full player PII, a plaintext `referee_password:"1231"`, and base64 signature JPEGs. They are committed to git. They are **not** the 9.12 event.

### E9 — Shared infrastructure coupling
`Docs/00_Project/Roadmap-036-038.md:26` — "Both tracks share the same MySQL instance (`nhpa` database)." `Modern/init-db.js:6-19` connects to DB `nhpa` and executes the whole `Modern/db.sql`. `Legacy/data.php:21-25` issues `CREATE DATABASE` / `USE` / `CREATE TABLE` on **every request**. No document evaluates the interference risk of these two schema regimes coexisting.

### E10 — Navigation documents are materially distorted
- `Docs/00_Project/Migration-Inventory.md` (Last Update **2026-07-23**) records Referee Management and Results as "**Not Started**", contradicting the 2026-08-09 assessment and the implemented code. Its "Team Management — Not Started" entry remains true.
- `Docs/05_Database/Database-Contract.md` (v1.1, 2026-07-10) documents 6 core tables while `Modern/db.sql` holds 19+ objects; it self-declares as "the reference contract for Repository Layer / Service Layer / API Layer".
- `Docs/02_Product/M2-Tournament-Coordination-Loop-Boundary.md` §12 and `TOP-Handoffs/LEGACY-RESOURCE-SCHEDULING-ANALYSIS.md` describe pre-implementation baselines, superseded by Approved ED-M2-TC-001 and by Legacy hardening #155/#157/#159. The handoff's "no conflict detection" claim is stale.
- `Modern/docs/deployment.md:104` wrongly advertises `/presentation/` as the public scoreboard; `Modern/presentation/` is a stub containing only a 28-line label-mapping module with no `index.html`.

### E11 — Git investment distribution
Commit counts by area: **Legacy 8, Modern 120, Docs 86, Tools 7**. Tags: only `m1-rehearsal-passed-2026-08-14` (`4f8387f`) and `v0.1.0-deployment-candidate` (`33f3d4e`, 2026-08-17). No freeze tag exists for the current HEAD.

---

## Legacy Policy

**Formal wording — Runtime Ownership Policy, Legacy clause:**

> Legacy is the **Production Runtime of Record**. It receives **constrained enhancement only**. Enhancement scope is defined by an allow-list; anything not on the allow-list is denied by default and requires a separate Product or Architecture decision.

### Allowed work types (exhaustive)

| # | Allowed type | Definition | Test |
|---|---|---|---|
| **L-A1** | **Production-critical fix** | A defect that would prevent an already-scheduled real event from starting, continuing, or recording an official result. | Must name the event, the failing operator action, and the observed failure. |
| **L-A2** | **Security / privacy** | Credential exposure, authorization bypass, PII leakage, or committed production data. | Must be remediable without changing the domain model. |
| **L-A3** | **Narrow DR / Local continuity work** | Work that makes an in-progress competition survivable through a connectivity or runtime interruption, strictly within the existing KV model. | Must not introduce a new source of truth; must not introduce a sync/merge protocol; must not be presented as building a Local product. |
| **L-A4** | **Migration-enabling work** | Instrumentation, evidence capture, read-only exports, or reconciliation tooling whose sole purpose is to make a later Modern migration safer or verifiable. | Must not extend Legacy's product surface. |

Also permitted, and treated as L-A1/L-A3 hybrids: **wiring already-built, already-tested backend capability to a human operator** — specifically E6's recovery actions into `master.html`, and retiring or guarding the unguarded dual path at E7. This is exposure of an existing capability, not new modeling.

### Forbidden work types (explicit)

| # | Forbidden | Reason |
|---|---|---|
| **L-F1** | **New domain modeling in Legacy** | Legacy's KV blob has no relational headroom; `TOP-Handoffs/LEGACY-COMPETITION-LIFECYCLE-VERSIONING-ANALYSIS.md` records the `tasks` bucket as mixing contest + assignment + execution facts, **destructive not historical**, with versioning/correction/supersession **UNRESOLVED**. New modeling here compounds an unresolved defect. |
| **L-F2** | **New KV sources of truth** | Each new `data_key` becomes an ungoverned authority with no schema, no constraint, and no migration path. |
| **L-F3** | **Rebuilding capabilities already modeled in Modern** | Direct duplication. Examples: standings (`Modern/engine/competition/results/round-robin-result-engine.js`), participant readiness gating (`Modern/engine/readiness/domain/readiness-state.js`, `participant-readiness.service.js:34-64`), court-condition authority (`court_operating_conditions.version`, `court-coordination.service.js:22-24`), dispatch idempotency and reassignment (`referee_dispatch_reservations`, `dispatch.service.js:292-466`), append-only coordination history (`tournament_coordination_chronology`), immutable official records (`match_official_records`). |
| **L-F4** | **Performance architecture redesign before RCA** | Per the Issue #190 Production Incident Boundary. No change to polling, endpoint structure, KV layout, or instance topology may be justified by field impression. `Roadmap-036-038.md:440` already lists "Performance or load testing" as Out of Scope, so no measurement baseline exists to redesign against. |
| **L-F5** | **Treating Legacy as the long-term product architecture** | Legacy may hold the runtime; it may not hold the roadmap. |

### Anti-scope-creep mechanism (answers Question 5)

Four binding controls, all procedural rather than architectural:

1. **Allow-list default-deny.** A Legacy change request must cite one of L-A1…L-A4 by name. "No citation" is a rejection, not a discussion.
2. **Mandatory duplication check.** Every Legacy change request must state which Modern capability — if any — covers the same business outcome, using the vocabulary of `Modern-vs-Legacy-Capability-Assessment.md` §3. If Modern covers it, the request is **redirected to Modern**, not implemented twice. This is the single most effective control, because the assessment already exists and is current (2026-08-09).
3. **Event-anchored justification.** L-A1 requires naming a scheduled event. This eliminates speculative "we might need it" work, which is how the 8 Legacy commits' scope could otherwise expand indefinitely.
4. **No-new-authority rule.** Any Legacy change that would create a persisted fact not derivable from an existing `data_key` is automatically L-F1/L-F2 and requires escalation to an Architecture decision. Exposure work (E6) is exempt because it creates no new fact.

This mechanism is deliberately cheap. It does not require new tooling, new governance bodies, or new documents — only that a Legacy issue template carry the four fields (allow-list citation, Modern duplication check, event anchor, new-authority declaration).

---

## Modern Policy

**Formal wording — Runtime Ownership Policy, Modern clause:**

> For the existing **Online migration track**, Modern is the **Primary Forward Development runtime** and the **default location for new authoritative domain modeling and new Online operational capability**. Modern is **not** a Production Runtime of Record and may not be designated the runtime for any real event until gates **G1–G6** are closed with evidence committed to the repository. Gate closure is a governance act, not an engineering opinion.

### Scope of Modern's forward primacy

Modern's primacy covers the **Legacy → Modern Online migration track**. Within that track it is the sole forward destination: Legacy is barred from new domain modeling (L-F1) and from becoming the long-term product architecture (L-F5), so there is no second forward track.

Modern's primacy does **not** extend to:
- the internal architecture, data authority, identity model, or continuity mechanism of any future TOP Local — all **UNDECIDED** by this Decision (see `## TOP Local Boundary`);
- productization work that belongs to a non-Online runtime form, which has not been defined and therefore cannot be assigned;
- any determination that a capability must exist *only* in a cloud deployment form. Where a capability's authoritative model belongs in Modern, its deployment form remains a separate question.

### What Modern owns forward (within the Online migration track)

- New business-object modeling, per `TOP-Core-Business-Object-Model.md` and the Canon chain.
- New competition-format capability (Phase 3 plugin work: 单败淘汰, 瑞士制, 转转赛, 双阶段, 固定搭档, 团体追逐赛).
- Authoritative result, standings, official-record, and archive capability.
- New operational workflow (Master push, referee dispatch/reservation, court condition authority, exception chronology).
- Online productization: identity, authorization, operational UX, communication surfaces, archive presentation — **for the Online runtime**.

### What Modern may not do yet

- Serve as runtime for any real event (G1–G6 open).
- Be described in any document as "production-ready" without the gate evidence attached.
- Preempt the open D-08 domain decision (`TOP-Handoffs/TASK-COMP-004-A1/06-DECISION-BATCH-1-DISCUSSION-PAPER.md:150`, ID-1/ID-2: whether contest identity is a structural position, configured sides, or temporal context). `TASK-COMP-004-A1/STATUS.md` records Status "**Awaiting Domain Rule Confirmation**", "**Confirmed domain rules: None**", and the companion architecture recommendation mandates a **documentation-only policy task before any competition-configuration implementation**. Modern's forward primacy does not override that sequencing.

### Individual-event readiness vs team-event readiness (answers part of Question 4)

These are **separate determinations** and must never be reported as one.

| Dimension | Individual-event readiness | Team-event readiness |
|---|---|---|
| Backend | Core path complete: lifecycle → readiness → generation → scheduling → dispatch → referee actions → live status → official record → standings → public scoreboard → archive (`Modern-vs-Legacy-Capability-Assessment.md:41`) | **Absent.** No team room, no import, no signed lineup, no 核碰下发, no team-match operation. `team_rooms` is dead code (E2). |
| Generator | `generateRoundRobin()` is the **only** Modern generator (`competition.service.js:669-712`) | No team draw, no group-stage, no knockout. `Modern/db.sql` has **no** `bracket_position`, `seed`, `bye`, `feeder_match_id`, `source_match_id`, `stage`, or `next_match_id` anywhere. |
| Standings | `findLatestConfirmedResults` (`match-official-record.repository.js:85-90`) selects `m.player1_id`/`m.player2_id` only — **individual/singles path only** | Team standings not covered. |
| Scale rehearsal | `Modern/rehearsal/full-scale-rehearsal.js` models 25 pairs / 50 players / 60 matches / 6 courts / 6 referees — but only 1 wave + 1 reassignment, so court turnover is unvalidated (audit M1) | No team rehearsal exists in Modern at all. |
| Gate status | G1 open ⇒ **not eligible** | G1 open **and** backend absent ⇒ **not eligible, and not near-term eligible** |

**Explicit determination required by this Decision: Modern 当前不具备 9.12 级团体赛事 runtime 资格。** This is not a temporary shortfall closable by gate work; it requires a scoped migration program (see `## Team-event Exception`).

---

## Cutover Policy

**Answers Question 3: phased by event type and capability evidence — not a single global switch.**

A single global switch is rejected on evidence. It would require Modern to simultaneously satisfy individual-event gates and a team-event backend that does not exist (E2), and it would forfeit the only production-proven runtime at the moment of maximum operational risk. It would also violate `Development-Principles.md` §1 (Evolution Over Rewrite) and §4 (Small Step Engineering).

### Cutover rule

Cutover is granted **per (event class × capability)**, and only when all four conditions hold:

1. **Gate condition.** G1–G6 closed with committed evidence.
2. **Capability-parity condition.** The specific capability is rated **Backend-replaceable** (not "Partially replaceable", not "Compatibility only") in a *current* capability assessment — the 2026-08-09 assessment must be refreshed before it is used to justify a cutover, since it predates Legacy #155/#157/#159/#162/#164.
3. **Rehearsal condition.** A rehearsal at representative scale for that event class has been executed and its record committed, including at least two court-turnover rounds for individual events.
4. **Fallback condition.** A named, tested Legacy fallback exists for that event class, with a documented cutover-abort trigger and a decision owner.

### Cutover sequence

| Phase | Event class | Precondition | Effect |
|---|---|---|---|
| **C0 (current)** | All | — | Legacy runtime for everything. Modern development-only. |
| **C1** | Individual round-robin, non-critical / rehearsal-adjacent events | G1–G6 closed + C-phase conditions 2–4 | First real Modern runtime. Deliberately the class with the strongest backend evidence and the weakest Legacy modeling advantage. |
| **C2** | Individual events generally | C1 evidence + a second successful C1 event | Legacy moves to maintain-only for this class. |
| **C3** | Team events | **Separate program** per `## Team-event Exception`, with its own gate set | Only after Modern team backend exists, is tested, and has been rehearsed at representative team scale. |
| **C4** | Legacy retirement | C2 + C3 both demonstrated | Legacy ceases to be Production Runtime of Record **for the Online track**. This Decision makes no claim about what, if anything, succeeds Legacy in a non-Online runtime form. |

### Legacy exit condition (answers Question 2)

**Legacy may exit a given event type only when, for that event type:**
- Modern holds a **Backend-replaceable** rating in a current assessment; **and**
- Modern holds a **committed rehearsal record** at representative scale for that type; **and**
- **two consecutive real events** of that type have run on Modern with a completed official record and no Legacy fallback invocation; **and**
- the human-facing workflow for that type is usable by the actual operators — because backend parity explicitly "does not establish production operability, accessibility, usability, or staff training readiness" (`Modern-vs-Legacy-Capability-Assessment.md:112`); **and**
- identity and authorization meet or exceed the Legacy bar for that type's actors (E4).

Exit is **per event type**. Legacy does not exit globally. There is no date-based exit; exit is evidence-based.

### Migration strategy statement (answers Question 4)

**Yes — "团体赛仍在 Legacy，个人赛未来可先进入 Modern" becomes explicit migration strategy**, formalized as phases C1–C3 above, with two qualifications:

1. "个人赛先进入 Modern" is a *sequencing* statement, not a *commitment*. It remains gated on G1–G6. Individual-event priority is justified by evidence (the core path is the only one rated Backend-replaceable end-to-end), not by convenience.
2. "团体赛仍在 Legacy" is a *constraint on Legacy*, not a *license for Legacy*. It means team-event runtime stays on Legacy; it does **not** authorize new team-event domain modeling in Legacy (L-F1). Team-event work in Legacy is limited to L-A1…L-A4 — which in practice means exposing the already-built recovery capability, guarding `submit_team_lineup` (see D-11a), and hardening what production already depends on.

---

## Production Go/No-Go Gates

**Answers Question 6: these gates become a mandatory governance rule before any future real-event go-live.**

### Gate definitions

| Gate | Name | Requirement | Evidence artifact required | Current status |
|---|---|---|---|---|
| **G1** | **Runbook / environment correctness** | Fix B1: align `FIRST-EVENT-RUNBOOK.md:74-75, 177-178` with `Modern/database/db.js:8-9` (`MYSQL_PASS` / `MYSQL_DB`), and remove the contradiction between the runbook and `deployment.md:60-61`. Also correct `deployment.md:104`'s `/presentation/` scoreboard mislabel, and gate `/dev` behind `NODE_ENV` (audit MD-FIX-6). | Committed diff + a startup log showing the intended database and credentials source. | **OPEN — Blocking** |
| **G2** | **Cloud deployment + rehearsal + backup/restore + fallback evidence** | Execute audit items M1–M4: real cloud deployment; a rehearsal at representative scale with **≥2 court-turnover rounds**; a backup-and-restore drill (`scripts/backup-db.sh`) actually performed; and a local-fallback demo performed as a rehearsal. | Committed records at the paths the audit already prescribes: `RESULT-m2-matchday-gonogo.md`, `RESULT-m2-local-fallback-demo.md`, plus a cloud deployment record in the same form as the Legacy nhpa-159/160 records (image digest, file hashes, acceptance results, rollback target). | **OPEN** |
| **G3** | **Version freeze / tag** | Create the freeze tag the audit already prescribes (`v0.1.0-m2-freeze`), or a successor tag naming the exact commit designated for event use. | Tag present in the repository and referenced by the go-live decision. | **OPEN** — only `m1-rehearsal-passed-2026-08-14` and `v0.1.0-deployment-candidate` exist (E11). |
| **G4** | **Authentication / authorization hardening** | `competitionRoutes` must be behind `requireActorSession` (`Modern/server.js:44`); `/dev` must not be publicly mounted (`:41`); and the identity boundary must meet or exceed Legacy's bar — i.e. it may not remain "caller-declared actor" with public-roster self-selection (E4). `Modern/session/production-identity-boundary.js` must be mounted with `identityAdapter.verify` and `actorLink.resolve` actually implemented. | Committed implementation + tests demonstrating that an unauthenticated caller cannot read or mutate competition state, and that a referee cannot self-assert identity. | **OPEN** |
| **G5** | **CI** | An automated pipeline running the full `node --test` suite (≈67 files) plus the Legacy mirror tests in `Tools/`, gating merges. Currently there is no `.github/` and no root `package.json`. | Pipeline definition committed + a green run on the freeze-tagged commit. | **OPEN** |
| **G6** | **HTTPS + target production platform** | Modern currently serves plain HTTP on `IP:3000` (E5). A real event requires TLS and a decided, documented hosting platform. | Deployment record naming the platform, the domain, the certificate mechanism, and the instance count — in the same evidentiary form as the Legacy records. | **OPEN** |

### Governance rule (binding)

1. **No go-live without gates.** No Modern instance may be designated the runtime for a real event — including a rehearsal with real participants — until G1–G6 are all closed.
2. **Evidence, not assertion.** A gate closes only when its named evidence artifact is committed to the repository. A statement in an issue comment, a chat, or a plan document does not close a gate. This mirrors `Product-Map.md:63-64`: "The approved design authorizes a bounded implementation issue. It does not itself authorize a milestone, release, deployment, or completion claim."
3. **Per-class determination.** Gates are evaluated against the event class being proposed. Closing G1–G6 for individual events does not confer team-event eligibility (see `## Team-event Exception`).
4. **Single decision owner.** The go/no-go decision for a specific event is made by one named person, recorded in a `RESULT-`-style document, and must cite each gate's evidence artifact by path.
5. **Abort trigger pre-declared.** Every go-live decision must name the Legacy fallback and the observable condition that triggers abort, decided **before** the event, not during it.
6. **Gates re-open on regression.** A gate that was closed re-opens if its evidence artifact becomes stale relative to the code — e.g. a G1 closure is invalidated by any subsequent change to `db.js` credential handling or to the runbook.
7. **Gates apply to future events, permanently.** This is not a one-time M2 checklist. It is the standing rule for every Modern go-live.
8. **Gates govern the Online track.** G1–G6 are Modern go-live gates. They do not constitute, and may not be reused as, a gate set for any future non-Online runtime, whose readiness criteria have not been defined.

---

## Team-event Exception

Team events are the material exception to Modern's forward primacy and require their own program.

### Why an exception is necessary

- Modern's team backend does not exist (E2). This is a **backend capability** gap, not a UI-exposure gap — the distinction the Canon review insists on.
- The Legacy team chain is production-proven and carries a designated baseline (`nhpa-160`, "下一场团体赛的 Legacy 生产基线").
- Team events are the class with the highest operational coupling: 建房 → 排阵 → 领队签名交卷 → Master 核碰 → 下发裁判池 → 执裁 → 完赛. Each step has a human actor and a time pressure.
- The external-format dependency is real: Legacy imports 网球记 Excel schedules (`team_import.html:38, 81-137, 162-182`) and deliberately filters knockout cells via `/半决赛|决赛|胜方|负方|名|交叉/` (`master.html:2493-2495`, mirrored and test-enshrined at `Tools/legacy-team-event-rehearsal/validate-rehearsal-package.js:39` and `validate-rehearsal-package.test.js:281-284`).

### Exception rules

**T1. Team-event runtime stays on Legacy until C3.** No gate closure on the individual path may be cited as team-event readiness.

**T2. Legacy team-event work is restricted to L-A1…L-A4.** In practice this means:
- **Permitted:** server-side validation of `submit_team_lineup` (currently `data.php:985` stores `{submitted_at, matches, leader_name, signature}` with **no server-side password or ownership check**; the only lock is a frontend `<option disabled>` at `team_lineup.html:355`) — this is L-A2 security.
- **Permitted:** wiring the recovery actions into Master UI (E6) — this is exposure of existing capability.
- **Permitted:** fixing the bare `名` branch in the knockout filter regex, which over-matches (a genuine parsing defect, distinct from the deliberate filter).
- **Forbidden:** new team-domain modeling in Legacy, new `team_event`/`team_lineups` KV authorities, or any team standings/bracket/ranking capability in Legacy (L-F1/L-F2/L-F3).

**T3. The Modern team-event migration is a separately scoped, evidence-led program.** It follows `Modern-vs-Legacy-Capability-Assessment.md` §6 priority 5 ("Evidence-led migration of specialist Legacy capabilities"), and 9.12 now supplies exactly the "actual operational dependence" evidence that priority requires. The program must:
- Not preempt the D-08 ID-1/ID-2 domain decision on contest identity.
- Not assume a bracket model. `TOP-Handoffs/LEGACY-COMPETITION-CONFIGURATION-ANALYSIS.md:27` records "There is no persisted tournament tree, stage model, bracket, or advancement graph," and §12 confirms the absence of knockout generation, advancement, byes, and qualification criteria. A Modern team-event design that silently introduces a bracket would be a new-concept introduction masquerading as migration.
- Decide explicitly whether room `'completed'` means *dispatch* (Legacy's actual semantics — `LEGACY-MATCH-GENERATION-ANALYSIS.md` §4.5: room 'completed' = lineup resolution, **not** sporting completion) or *sporting completion*. These are different facts and Legacy conflates them.
- Address the lineup truncation rule (`Math.min(tl1.matches.length, tl2.matches.length)`, format taken from side one only) as an explicit domain decision rather than inheriting it silently.

**T4. One reversed-direction duplication risk is named explicitly.** **Batch Dispatch** is the single capability where **Legacy is the reference implementation and Modern must extend.** `Legacy/data.php:632` `set_bulk_tasks` performs transactional, event-locked batch dispatch with active-task guards, driven by `master.html:2200-2243` (极速盲派下发 / 一键下发) and `:2246-2266` (`forceResolveSubMatches`). `Modern/services/dispatch.service.js:61` `dispatch` is **strictly per-match**. This is the opposite direction from every other concept in this Decision and must not be "migrated" by rewriting Legacy; Modern must grow the batch capability.

**T5. Team-event cutover requires a team-scale rehearsal.** `Modern/rehearsal/full-scale-rehearsal.js` models individual pairs only. A team rehearsal must model rooms, lineups, 核碰, and multi-match-per-room dispatch, at a scale comparable to `Tools/legacy-team-event-rehearsal/` — and must exceed that package's deliberately minimal 2 teams / 12 players / 1 room if it is to justify a real-event cutover.

---

## TOP Local Boundary

**Answers Question 7: TOP Local belongs in a separate Local Product Review, DR / Competition Continuity Review, and GTM Review, and is explicitly NOT pre-defined by this Decision.**

### What 9.12 actually validated

> **9.12 验证的是：Competition Continuity fallback 可行。**
> **不是：「TOP Local 已经验证」。**

This distinction is load-bearing and must be preserved verbatim in every downstream document. A continuity fallback is a *behavior under interruption*. "TOP Local" is a *product*. Validating the former does not create, evidence, or authorize the latter.

### What this Decision determines about TOP Local — and only this

D-03 is entitled to determine exactly five things about TOP Local:

| # | Determination |
|---|---|
| **1** | **TOP Local currently does not formally exist.** There is no Local runtime, no Local product definition, no Local architecture document, and no Local deployment artifact in the repository. |
| **2** | **9.12 validated Competition Continuity fallback, not TOP Local.** |
| **3** | **TOP Local must NOT be assumed to equal "Legacy on a laptop".** |
| **4** | **TOP Local's product and technical relationship to Legacy and Modern is currently UNDECIDED.** This Decision records that the question is open; it does not answer it. |
| **5** | **The question is to be decided by a Local Product Review, a DR / Competition Continuity Review, and a GTM Review** — none of which this Decision authorizes, scopes, or pre-empts. |

**Retained principle (the only architectural-adjacent statement this Decision makes about Local):**

> **Do not define TOP Local by inheriting Legacy implementation accidentally.**

This is a caution about *how the question gets answered*, not an answer. It says that if a Local definition ever emerges, it must emerge from a review that consciously chose it — not from the incidental fact that today's only way to run TOP on one machine happens to be the whole Legacy stack.

### What this Decision deliberately does NOT determine

This Decision reaches **no conclusion** on any of the following, and no downstream document may cite D-03-DR as authority for any of them:

- whether TOP Local requires its own authoritative data store, or consumes an existing one;
- whether TOP Local requires its own identity model, or reuses one;
- whether TOP Local requires its own continuity or reconciliation protocol, or none;
- whether TOP Local must be technically decoupled from the Legacy stack, the Modern stack, both, or neither;
- whether TOP Local is an edition, a mode, a companion artifact, a deployment topology, or not a product at all;
- whether TOP Local has a commercial form, and if so what.

Each of these is a substantive architecture or product decision that requires its own evidence, its own options analysis, and its own approval. Deciding them here — in a document whose evidence base is a Legacy↔Modern runtime ownership review — would violate `TOP-Product-Layer-Definition.md:111` ("a downstream layer does not silently redefine an upstream decision") by having an *ownership* decision pre-empt a *product* decision, and `Development-Principles.md` §8 (Avoid Premature Complexity) by fixing structure before the foundation requires it.

### Current state: what actually exists

| Artifact | What it actually is | Status relative to "TOP Local" |
|---|---|---|
| `Legacy/referee.html?mode=local` | The portal entry at `Legacy/index.html:102` labelled "📱 裁判打分终端 (离线单机)" | **Inert.** `referee.html` reads only `code` (`:564`) and `pwd` (`:565`) from the URL — `mode` is **never read**. The local bootstrap at `:540-561` is reachable, but `sysMode` is only ever reassigned at `:612` from a **successful server login**, so local mode cannot be entered from the advertised URL. |
| Local result handling | `referee.html:1329-1338` | **Structured results are discarded.** `submitFinalReport` in local mode shows a toast "单机模式：无需上传", then calls `clearBackup()` and returns. No file, no queue, no later upload. |
| Sync / merge / upload-later | — | **Zero implementation in either stack.** No path exists to return locally-held facts to an authoritative runtime. This is why Modern's own audit records M4: "本地回退（local fallback）未作为演练正式演示." |
| `Legacy/zz.html` | The **only genuinely stack-independent operational artifact**: zero `fetch(`, zero `data.php` references, zero CDN dependencies, runs from `file://`, single localStorage key `pickleball_state` | **Narrow model.** Covers only 4-person mixed doubles / fixed pairs — no team rooms, no brackets, no check-in, no waivers, no signatures. Export is **clipboard text only** (`copySchedule()` `:1205-1224`). Auth is a hardcoded `admin123` via `prompt()` (`:503-511`). Whether this artifact should become, seed, or be replaced by a Local product is **UNDECIDED**. |
| `Legacy/umpire.html` | 精英裁判管理大盘 (referee roster / HR) | **Requires server.** Note the common misattribution: the "离线单机" portal label belongs to card 7 (`referee.html?mode=local`), not to card 3 (`umpire.html`, described at `index.html:66-72` as "裁判大数据库"). |
| Today's practical "Local" | The entire Legacy stack running on one machine (`Legacy/docker-compose.yml`: php build + mysql 8.0, 8080:80) | This is, descriptively, **Legacy on a laptop**. It is recorded as the current factual state, and simultaneously as the thing determination **3** forbids mistaking for a Local product definition. |

### Boundary rules

**LB1. TOP Local does not formally exist.** No document may refer to "TOP Local" as a delivered, validated, or planned-and-approved product. It may be referred to only as an open question.

**LB2. Continuity ≠ Local.** Evidence about competition continuity under interruption is evidence about continuity. It may not be accumulated into a claim that a Local product exists, works, or is scoped.

**LB3. Do not assume TOP Local = Legacy on a laptop.** The current factual state (whole Legacy stack on one machine) is an *observation*, not a *definition*. Treating it as the definition would convert an open product question into a packaging decision made by default, and would silently answer determination 4 without a review.

**LB4. The relationship is UNDECIDED.** TOP Local's product relationship and technical relationship to Legacy and Modern are both open. This Decision does not narrow the option space, and no downstream document may claim D-03-DR as precedent for any particular option.

**LB5. Where the question belongs (Question 7, explicit answer).** Three separate reviews, none authorized by this Decision:

| Review | Question it must answer | Nearest documented ancestor |
|---|---|---|
| **Local Product Review** | What is TOP Local as a product? Who uses it, what does it do when disconnected, what does it do when reconnected? Is it an edition, a mode, a companion, or nothing at all? What is its relationship to the Online track? | `Docs/09_Issues/Issue-005.md` ("Public Experience & Commercial Platform Layer", Decision: "Not part of current MVP refactor. Keep as a future architecture direction.") — the precedent for parking a product-layer question without pre-deciding it. |
| **DR / Competition Continuity Review** | What exactly must survive an interruption, for how long, with what fidelity, and how do facts return to authority? This is the review that formalizes what 9.12 informally demonstrated, and it must decide whether continuity is a property of the Online track, of a Local product, or of both. | `Docs/01_Architecture/TOP-Engineering-Readiness-Plan.md:114-118` §4.1 venue risks (unreliable network, noisy venue, multi-device); `TOP-Initial-Operational-Workflows.md:46` WA-TCR-CONTINUITY (OW-M-006). |
| **GTM Review** | Is there a commercial form for a disconnected or single-machine TOP, and does it change the commercial model? | `Docs/09_Issues/ISSUE-hardware-independent-operation-model.md:49-73` ("Platform subscription / tournament authorization", future "Tournament license management") — the nearest documented ancestor of a "Market Hook", though that document is about **devices**, not network independence, and is marked Status "Strategic product direction. Not part of current MVP." |

**LB6. Interim continuity work is permitted — inside Legacy, under L-A3.** Making the *existing* fallback survivable (e.g. not discarding local results at `referee.html:1338`, making the `?mode=local` entry actually functional) is narrow DR/continuity work and is allowed. It must not be described as "building TOP Local", must not introduce a sync/merge protocol, and must not create a new source of truth. This is the line between L-A3 and LB3. Note that LB6 authorizes *fixing observed defects in existing Legacy continuity behavior*; it does not authorize designing a Local product.

**LB7. No external DR or Local capability may be promised.** Until the DR Review and the Local Product Review close, no document, page, pitch, or manual may state that TOP provides offline operation, disconnected operation, disaster-recovery operation, or a local edition as a product capability.

---

## Consequences

### Immediate operational consequences

1. **The next 9.12-class team event runs on Legacy**, on baseline `nhpa-160` or a successor produced under L-A1…L-A4.
2. **Modern development continues unchanged in direction within the Online migration track**, but every Modern go-live claim now requires gate evidence. The absence of a go-live is not a slowdown of development; it is a slowdown of *promising*.
3. **G1 becomes the highest-priority single item in the repository.** It is a Blocking defect, it is small (a documentation/config consistency fix), and until it closes, every other gate is unproducible because a cloud deployment following the runbook would fail to start.
4. **E6 becomes the highest-value Legacy item.** The recovery backend is built, tested, and audited; only Master UI wiring is missing. This is capability *exposure*, not capability *creation* — the cheapest possible operational gain available anywhere in the repository.

### Governance consequences

5. **The "Legacy is frozen" framing is formally retired.** It was a `Status: Proposed` intention contradicted by two production releases and eight commits. Replacing it with an allow-list is more honest and more enforceable.
6. **Capability ratings may no longer be cited from the 2026-08-09 assessment without a currency check.** That assessment predates Legacy #155/#157/#159/#162/#164. Using it to justify a cutover without refresh would cite stale evidence for a load-bearing decision.
7. **A duplication check becomes mandatory on every Legacy change.** This is the mechanism that prevents the two stacks from independently building the same capability — the failure mode the Canon review was designed to catch.
8. **Gate discipline generalizes beyond Modern.** The pattern "evidence artifact committed, or the claim is not made" is now the repository's standard for any production claim, and should be applied to future Legacy releases too (which already follow it well — nhpa-159/160 records are exemplary).
9. **The TOP Local question is now formally open rather than informally assumed.** Three reviews are named as its owners. Until they report, no Local architecture may be asserted anywhere in the repository, and — equally — no Local architecture may be *ruled out* by citing this Decision. The option space is preserved intact, which is itself a consequence: a future Local Product Review starts from a clean slate rather than from a constraint inherited by accident.

### Technical-debt consequences accepted

10. **Legacy's unresolved versioning/correction/supersession problem is accepted, not fixed.** `LEGACY-COMPETITION-LIFECYCLE-VERSIONING-ANALYSIS.md` records it as UNRESOLVED, and `LEGACY-COMPETITION-RESULT-ANALYSIS.md` §5.1 records "Legacy: No correction mechanism found." This Decision does **not** authorize building result correction in Legacy (L-F1). It accepts that Legacy events will continue to lack a correction workflow, and that the *post-confirmation result-correction* capability identified in the Canon review as genuinely new must be built in Modern **for the Online track**.
11. **The KV model persists longer than intended.** This is the explicit cost of choosing continuity over cleanliness, and it is accepted knowingly.
12. **Shared-`nhpa` coupling must be resolved before C1.** E9 is not a hypothetical: `data.php:21-25` runs DDL on every request against the same database name Modern's `init-db.js` provisions. Modern's first real deployment must not share a database name with Legacy.

### Consequences explicitly NOT accepted (refusals preserved)

This Decision does **not** conclude, and forbids downstream documents from concluding, that:
- the Master dashboard response is too large;
- the event data volume is too big;
- the MySQL database is the bottleneck;
- the polling architecture is wrong;
- WebSocket is required;
- `data.php` must be split into multiple endpoints;
- any re-architecture is required.

E7's mechanism candidate remains a **hypothesis for RCA to measure**. `Roadmap-036-038.md:440` lists performance/load testing as Out of Scope, so no measurement baseline exists; redesigning against field impression would violate `Development-Principles.md` §8 (Avoid Premature Complexity) and §7 (Behavioral Compatibility Over Clever Improvement).

---

## Superseded / Conflicting Documents

**These documents require modification. This Decision Record does NOT modify them.** Modification is authorized only after approval, and is dispatched as follow-up issues.

### Category A — Directly superseded by this Decision

| Document | Conflicting content | Required change |
|---|---|---|
| `Docs/00_Project/Roadmap-036-038.md:17-21` | "**Legacy is frozen — it receives no new architecture investment, only critical fixes.**" (Status: Proposed, 2026-07-22) | Annotate as **superseded by D-03-DR**. Replace "frozen" with the allow-list L-A1…L-A4. Also update `:26` (shared `nhpa` instance) to record the decoupling requirement. |
| `Docs/00_Project/Roadmap.md:41` | Phase 2 Operations Integration: "**把 Legacy 的能力全部迁移到新的架构**" | See Question 8 below — requires re-interpretation, not deletion. |

### Category B — Materially stale; must be refreshed before being cited for any decision

| Document | Defect | Required change |
|---|---|---|
| `Docs/00_Project/Migration-Inventory.md` (Last Update **2026-07-23**) | Referee Management and Results recorded as "**Not Started**", contradicting the 2026-08-09 assessment and the implemented code. "Team Management — Not Started" remains true. | Update Referee Management and Results to reflect actual state; keep Team Management as Not Started; add a "Last verified against commit" column so staleness is visible. |
| `Docs/05_Database/Database-Contract.md` (v1.1, 2026-07-10) | Documents 6 core tables while `Modern/db.sql` holds 19+ objects and 1 VIEW. Omits `match_official_records`, `competition_standings`, `court_operating_conditions`, `court_disruptions`, `match_schedules`, `tournament_coordination_chronology`, `competition_referees`, `referee_dispatch_reservations`, `team_rooms`, `team_members`, `teams`, `player_check_ins`, `waivers`, `master_operational_match_overview`. Self-declares as "the reference contract for Repository Layer / Service Layer / API Layer". | Either bring to parity with `db.sql` or downgrade its self-declared authority and point to `db.sql` as the contract of record. |
| `Docs/02_Product/M2-Tournament-Coordination-Loop-Boundary.md` §12 | States Modern had only an immutable schedule, no interruption/resume, no court-condition. Describes the **pre-implementation** baseline; superseded by Approved ED-M2-TC-001. | Mark §12 as a historical baseline note, not current state. |
| `TOP-Handoffs/LEGACY-RESOURCE-SCHEDULING-ANALYSIS.md` | "no conflict detection" is stale — predates Legacy hardening #155/#157/#159. | Annotate with the hardening commits that changed the described behavior. |
| `Docs/01_Architecture/CURRENT-STATUS.md` (567 lines) | Ends in the 035 / 033 / 034.1 / Sprint-005 era; stale relative to M1/M2 delivery. | Refresh or explicitly mark as historical. |
| `Docs/01_Architecture/Modern-vs-Legacy-Capability-Assessment.md` (2026-08-09, baseline `0519dcd`) | Not *wrong*, but predates Legacy #155/#157/#159/#162/#164 and Modern's own stall. Its ratings are load-bearing for C-phase condition 2. | Must be **refreshed before it is cited to justify any cutover**. Add a currency-check requirement. |

### Category C — Internal contradictions requiring correction

| Document | Defect | Required change |
|---|---|---|
| `Modern/docs/FIRST-EVENT-RUNBOOK.md:74-75, 177-178` | `MYSQL_PASSWORD` / `MYSQL_DATABASE` contradict `Modern/database/db.js:8-9` (`MYSQL_PASS` / `MYSQL_DB`). **This is Blocking gate G1.** | Correct to match `db.js`. Also `:180-183` cleanup script omits `team_rooms`, `player_partners`, `player_opponents`; §6.3 赛后 closure has no external-transfer step. |
| `Modern/docs/deployment.md:104` | Advertises `/presentation/` as the public scoreboard; `Modern/presentation/` is a stub with no `index.html`. | Correct the path. |
| `Modern/docs/deployment.md` vs `FIRST-EVENT-RUNBOOK.md` | The two Modern deployment documents contradict each other on credential variable names. | Reconcile; declare one as authoritative. |
| `Modern/server.js:41, 44` | `/dev` mounted unconditionally; `competitionRoutes` mounted without `requireActorSession`. **Gate G4.** | Code change, authorized separately under G4 — not under this Decision. |

### Category D — Empty or absent canon creating governance vacuum

| Path | State | Required change |
|---|---|---|
| `Docs/01_Architecture/API.md`, `Database.md`, `System-Architecture.md` | **0 bytes** | Populate or delete. Empty canon files read as authoritative-by-path. |
| `Docs/02_Product/Modules.md`, `Workflow.md` | **0 bytes** | Populate or delete. |
| `Docs/12_Business/Marketing-Strategy.md`, `Product-Overview.md`, `Sales-Pitch.md` | **0 bytes** | No business canon exists. Relevant to LB5's GTM Review — that review has no starting document. |
| `Docs/04_Reviews/2026-09-12-Production-Trial-Field-Validation-Review.md` | **Referenced by Issue #190 but does not exist**; the entire `Docs/04_Reviews/` directory does not exist. | Either create the review document or correct the Issue's reference. As it stands, #190's cited evidence source is unverifiable from the repository. |
| `Docs/09_Issues/RESULT-m2-matchday-gonogo.md`, `RESULT-m2-local-fallback-demo.md` | Prescribed by the M2 audit; **do not exist**. | These are the G2 evidence artifacts. Their absence *is* the gate-open state. |

### Question 8 — Re-interpreting Roadmap Phase 2

`Docs/00_Project/Roadmap.md:41` states Phase 2's goal as "**把 Legacy 的能力全部迁移到新的架构**", listing 主裁 / 裁判 / 检录 / 场地 / 大屏 / Workflow, and adds "这一阶段，用户会开始真正感受到系统升级."

Read literally, "全部迁移到新的架构" is ambiguous between two very different claims: migration of **domain authority**, and consolidation of **deployment form**. The second reading would pre-judge questions that this Decision has deliberately left open — including whether any non-Online runtime form should exist at all, and what its relationship to the migrated model would be. The Roadmap should not be the document that answers those questions by implication.

**Required re-interpretation (to be written into `Roadmap.md`, not applied here):**

Phase 2's goal is re-read as:

> **把 Legacy 承担的赛事运营职责，迁移到具备权威建模能力的架构中。**
> 迁移的单位是**运营职责与领域权威**，不是**页面、部署形态或运行位置**。
> 因此，「全部迁移」指：Legacy 不再是任何领域事实的权威来源。
> 它不指：所有能力都必须以某一种部署形态存在。

Three clarifying clauses must accompany it:

1. **Authority migration ≠ deployment consolidation.** A capability is migrated when its authoritative facts live in the new architecture. Where that authority runs is a separate question, and the Roadmap does not answer it.
2. **Phase 2 does not pre-decide any future non-Online runtime form.** Whether a Local or disconnected form of TOP should exist, and if so how it relates to the migrated domain model, is **UNDECIDED** and belongs to the Local Product Review and the DR / Competition Continuity Review (LB5). Phase 2 must not be cited as having settled it in either direction — neither as eliminating such a form nor as specifying its architecture.
3. **Phase 2 completion is per-capability, evidenced.** "全部" is satisfied when each capability in the Phase 2 list reaches C-phase exit conditions per `## Cutover Policy`, not when a date arrives. Team events are explicitly the last item, per `## Team-event Exception`.

This re-interpretation preserves the Roadmap's intent (users feel the upgrade), removes the implied pre-judgement of open questions, and aligns Phase 2 with the evidence-led priority already stated in `Modern-vs-Legacy-Capability-Assessment.md` §6. It requires **no change to the Roadmap's phase structure** — only to the wording of Phase 2's goal and the addition of the three clauses.

---

## Follow-up Issues

Each item carries a recommended AI model dispatch per standing practice: **qwen3.8Max / gemini pro** for complex architecture design and large coding tasks; **qwen3.7plus / cline+deepseek v4flash** for routine coding and review; **qwen3.6flash / deepseek v4flash** for lightweight documentation updates and simple changes.

These items are **derived and recorded only**. Approval of this Decision Record does not authorize their execution. Each requires its own dispatch decision.

### Tier 1 — Blocking, do first

| ID | Title | Scope | Coding allowed | Recommended model |
|---|---|---|---|---|
| **N-1** | Close gate G1: Modern runbook / environment correctness | Fix `FIRST-EVENT-RUNBOOK.md:74-75, 177-178` to match `db.js:8-9`; reconcile with `deployment.md:60-61`; correct `deployment.md:104`; gate `/dev` behind `NODE_ENV`; extend the runbook cleanup script to `team_rooms`, `player_partners`, `player_opponents`; add an external-transfer step to §6.3. | **YES** — documentation + configuration consistency fix | **qwen3.6flash** (mechanical, well-specified, low risk) |
| **N-7** | Wire Legacy atomic match recovery into Master UI | Expose `get_match_recovery_preview` / `recover_match` / `get_recovery_audit` (`data.php:675-727`) in `master.html`; retire or guard the unguarded dual path at `data.php:334` / `:728`. Backend is complete, tested, audited. | **YES** — capability exposure only, creates no new fact; must pass the Legacy duplication check | **qwen3.7plus** (UI wiring against an existing tested backend; needs care with the four-action model and `expected_*` concurrency) |
| **D-11a** | Legacy `submit_team_lineup` server-side validation | `data.php:985` stores lineup with no server-side password or ownership check; the only lock is frontend `<option disabled>` (`team_lineup.html:355`). Add server-side authorization. Classified L-A2. | **YES** | **qwen3.7plus** (security fix in a legacy PHP monolith; requires reading the surrounding room lifecycle) |

### Tier 2 — Gate closure

| ID | Title | Scope | Coding allowed | Recommended model |
|---|---|---|---|---|
| **N-2** | Close gate G4: Modern authorization hardening | Mount `competitionRoutes` behind `requireActorSession`; gate `/dev`; mount `production-identity-boundary.js` with `identityAdapter.verify` / `actorLink.resolve` implemented; raise the identity bar to at least Legacy's `referee_password` level; eliminate public-roster self-selection. | **YES** — but requires an identity design decision first | **gemini pro** (security architecture with an unimplemented port; highest-risk item in the list) |
| **N-8** | Close gate G5: CI pipeline | Create `.github/` workflow running `node --test` (≈67 files) plus `Tools/` mirror tests, gating merges. Note `mysql-integration.test.js` needs a MySQL service with a `MYSQL_FORCE` guard. | **YES** | **qwen3.7plus** (standard CI authoring; the MySQL service job is the only subtlety) |
| **N-9** | Close gate G3: freeze tag | Tag the commit designated for event use (`v0.1.0-m2-freeze` or a named successor), referenced by the go-live decision. | **YES** — trivial, but must follow N-1 | **qwen3.6flash** |
| **N-10** | Close gate G2: cloud deployment + rehearsal + backup/restore + fallback evidence | Execute audit M1–M4. Produce `RESULT-m2-matchday-gonogo.md`, `RESULT-m2-local-fallback-demo.md`, and a cloud deployment record in nhpa-159/160 form (image digest, file hashes, acceptance, rollback target). Rehearsal must include **≥2 court-turnover rounds**. Note: the fallback demo records *continuity behavior*; per LB2 it must not be written up as validating a Local product. | **NO** — this is execution and evidence capture, not coding. Requires real infrastructure and human operators. | **Not an AI task.** Human-executed with **qwen3.7plus** assisting on record drafting only. |
| **N-11** | Close gate G6: HTTPS + target production platform decision | Decide and document platform, domain, certificate mechanism, instance count. Currently plain HTTP on `IP:3000`. | **NO** — decision + procurement first | **qwen3.8Max** for the decision paper (platform trade-offs against 微信云托管 parity with Legacy) |

### Tier 3 — Governance and documentation truth

| ID | Title | Scope | Coding allowed | Recommended model |
|---|---|---|---|---|
| **N-5** | Ratify D-03-DR into Canon and annotate superseded claims | Add the Runtime Ownership Policy to the governance chain; annotate `Roadmap-036-038.md:17-21` as superseded; apply the Question-8 re-interpretation to `Roadmap.md:41`. Ratification must carry the v1.1 scope limitation: the Online migration track only, with TOP Local explicitly UNDECIDED. | **NO** — Canon modification requires separate approval | **qwen3.8Max** (Canon wording; must not redefine upstream decisions per `TOP-Product-Layer-Definition.md:111`) |
| **D-04 + D-05 (merged)** | Documentation Truth Refresh | Refresh `Migration-Inventory.md`, `Database-Contract.md`, `M2-Tournament-Coordination-Loop-Boundary.md` §12, `LEGACY-RESOURCE-SCHEDULING-ANALYSIS.md`, `CURRENT-STATUS.md`; resolve the 0-byte canon files; add "last verified against commit" metadata; document the shared-`nhpa` coupling and its decoupling requirement. | **NO** | **qwen3.7plus** for the inventory/contract refresh; **qwen3.6flash** for annotation-only staleness markers |
| **N-12** | Refresh `Modern-vs-Legacy-Capability-Assessment.md` to current baseline | The 2026-08-09 assessment predates Legacy #155/#157/#159/#162/#164. Its ratings are load-bearing for C-phase condition 2 and must be current before any cutover is justified from them. | **NO** | **qwen3.8Max** (requires whole-repository capability reasoning across both stacks) |
| **N-13** | Create or correct `Docs/04_Reviews/2026-09-12-Production-Trial-Field-Validation-Review.md` | Issue #190 cites a file that does not exist, in a directory that does not exist. Either create the review document from #190's content or correct #190's reference. | **NO** | **qwen3.6flash** |
| **N-3** | Remove committed production dumps | `Legacy/backup.sql` and `Legacy/backup_fixed.sql` contain June-2026 player PII, plaintext `referee_password:"1231"`, and base64 signature JPEGs. Classified L-A2. **Requires explicit user authorization. Must NOT rewrite git history unilaterally** — removal from HEAD does not remove from history, and history rewriting is a destructive operation on shared state. | **YES with authorization** — file removal only; history rewrite is a separate decision requiring user approval | **qwen3.7plus** for the removal + `.gitignore` policy; **history rewrite: not an AI decision** |

### Tier 4 — Scoped programs

| ID | Title | Scope | Coding allowed | Recommended model |
|---|---|---|---|---|
| **N-4** | Modern team-event migration program | Scoped, evidence-led, per `## Team-event Exception` T3. Must not preempt D-08 ID-1/ID-2. Must decide room `'completed'` semantics, lineup truncation, and whether a bracket is introduced at all. Online track only. | **NO** — design and policy first | **gemini pro** (largest architecture design task in this list; multiple unresolved domain decisions) |
| **D-08** | Contest identity domain decision (ID-1 / ID-2) | `TASK-COMP-004-A1/06-DECISION-BATCH-1-DISCUSSION-PAPER.md:150` — structural position vs configured sides vs temporal context. Status "Awaiting Domain Rule Confirmation", "Confirmed domain rules: None". Companion recommendation mandates a **documentation-only policy task before any competition-configuration implementation**. **HOLD/GATE** — blocks N-4. | **NO** | **gemini pro** |
| **D-14** | DR / Competition Continuity Review | Formalize what 9.12 informally demonstrated. Elevated because the DR claim is currently **unvalidated**: `?mode=local` is inert (`referee.html:564-565` never reads `mode`), local results are discarded (`:1338`), no sync/merge/upload-later path exists in either stack, and audit M4 records the fallback was never demonstrated. Per LB5 this review must also decide whether continuity is a property of the Online track, of a future Local product, or of both — **D-03-DR does not pre-answer that**. | **NO** | **qwen3.8Max** |
| **N-14** | Local Product Review *(newly named owner for an open question; not authorized to start by this Decision)* | Determine whether TOP Local exists as a product at all, and if so what it is. Must treat the option space as unconstrained (LB4). Must not inherit the current "whole Legacy stack on one machine" state as a definition (LB3). | **NO** | **gemini pro** (greenfield product definition with no existing evidence base; must resist anchoring on Legacy) |
| **N-15** | GTM Review for a disconnected / single-machine TOP form | Determine whether a commercial form exists. `Docs/12_Business/` is entirely 0 bytes, so this review has no starting canon. | **NO** | **qwen3.8Max** |
| **N-6** | Legacy continuity defect fixes (L-A3 only) | Make the `?mode=local` entry functional; stop discarding local results at `referee.html:1338`; provide a non-clipboard export from `zz.html`. **Must not be described as "building TOP Local"**; must not introduce a sync protocol or new source of truth; must not be scoped by reference to any assumed Local architecture. These are defect fixes to existing Legacy continuity behavior, nothing more. | **YES** — narrow, under L-A3 | **qwen3.7plus** |
| **D-09a / D-09b** | Post-confirmation result-correction capability | Canon review identified this as one of only two genuinely-new items. **D-09a** = Canon authority decision (where does correction authority live, given `match_official_records` is immutable and Legacy's `recover_match` already refuses once an official record exists — "必须进入赛果更正流程"). **D-09b** = Modern implementation, Online track. **Legacy side held** (L-F1). | **NO** for D-09a; **NO** for D-09b until D-09a closes | **gemini pro** for D-09a; **qwen3.8Max** for D-09b |
| **D-02** | Legacy production performance RCA harness | **Elevated and Legacy-scoped.** Must be barred from proposing migration as the fix. Establishes the measurement baseline that `Roadmap-036-038.md:440` currently declares Out of Scope. Absorbs **D-15a**. Measures E7's hypothesis (first-writer-wins court-card precedence at `data.php:504-531` + the unguarded `update_task_court` path). | **NO** — measurement first, no redesign | **qwen3.8Max** (must design measurement without prejudging the architecture conclusion) |
| **D-10** | Modern communications capability | Merged into Modern communications under assessment §6 priority 3, Online track. **Must first resolve the direction inversion**: `ISSUE-referee-assistance-request.md` (Priority "Medium (Future)", zero implementation) is Referee→Officials with a Requested→Acknowledged→On the Way→Resolved model; #190's observed need is Master→Referee. These are different capabilities. Also note `TOP-Legacy-Capability-Mapping.md:87-89` already documents Participant Communication as a Legacy gap. | **NO** | **qwen3.8Max** |

### Items unchanged from the Canon review

- **D-01, D-07, D-12** — PROCEED unchanged. **D-07 is the only Canon-review item with coding allowed = YES.**
- **D-11b** (Modern `team_rooms.status` submission window) — folded into N-4.
- **D-15b** (Modern individual-scale rehearsal with ≥2 turnovers) — folded into N-10 / G2.
- **D-06** — elevated and re-scoped as **N-7**.
- **D-13, D-16** — HOLD/GATE.

### STOP list (no issue may be opened for these)

- No push transport or WebSocket anywhere — actively forbidden by `Modern/test/public-scoreboard-ui.test.js:78, 135`.
- No endpoint splitting or KV redesign before D-02's RCA produces measurements.
- No new Legacy domain models (L-F1).
- No Legacy standings, readiness-gate, or bracket storage (L-F3 — all already modeled in Modern).
- No implementation of the strategic four-piece hypothesis (`Core + Capability Modules + Competition Configuration + Operational Workspaces`) — it remains a hypothesis.
- No AI-layer implementation — `Development-Principles.md` §8 explicitly delays "advanced AI layers"; Roadmap Phase 5 is not authorized by this Decision.
- No external DR or Local capability promise (LB7).
- **No TOP Local architecture proposal of any kind** — including proposals for its data authority, identity model, continuity protocol, or degree of decoupling from Legacy/Modern. The question is UNDECIDED (LB4) and belongs to N-14 / D-14 / N-15.

---

## Approval Recommendation

### Verdict: **APPROVE**

**Outcome: Approved by Paul Wu on 2026-09-12**, with the three mandatory attachments below recorded as binding conditions of approval.

The three attachments do not alter the Decision's substance:

**Attachment 1 — Sequencing condition.** N-1 (G1) must be dispatched and closed before any other Tier-1 or Tier-2 item consumes effort. G1 is Blocking by the repository's own audit, it is cheap, and every other gate depends on a cloud deployment that G1 currently prevents from starting. Approving this Decision while leaving G1 open would be approving a policy whose gates cannot be reached.

**Attachment 2 — Currency condition.** N-12 (assessment refresh) must complete before any C-phase cutover is justified. The 2026-08-09 assessment is the only document that rates capability parity, it predates five Legacy production commits, and C-phase condition 2 cites it as evidence. Approving a cutover policy whose evidence base is known-stale would be a governance defect.

**Attachment 3 — Scope-discipline condition.** This Decision must be cited only for what it determines. Specifically, no document, issue, or implementation may cite D-03-DR as authority for any TOP Local architecture position, in either direction. `## TOP Local Boundary` records five determinations and one retained principle; everything beyond them is open. If a future proposal needs a Local architecture premise, it must obtain one from N-14, D-14, or N-15 — not from this record.

### Why APPROVE rather than REVISE

- **It resolves a real, evidenced ambiguity.** The repository currently carries a `Status: Proposed` claim that Legacy is frozen, contradicted by two production releases and eight commits, alongside a Modern track that has never been deployed. No document states which runtime owns what. That ambiguity is itself an operational risk.
- **It is derived, not presupposed.** Every clause traces to E1–E11. The Decision does not choose Modern for being cleaner (it is weaker on identity — E4, carries a live Blocking bug — E3, and has no team backend — E2) and does not choose Legacy for having production evidence (its own handoffs call its model destructive with versioning UNRESOLVED).
- **It preserves both stacks' legitimate value.** Legacy keeps the runtime and gains cheap capability exposure (N-7). Modern keeps all modeling headroom on the Online track and gains a concrete, finite path to eligibility (G1–G6).
- **It is falsifiable and enforceable.** Gates close on committed artifacts, not assertions. Legacy changes require an allow-list citation. Cutover requires four named conditions. Each can be checked by a reader without access to this conversation — satisfying `Development-Principles.md` §9.
- **It refuses what it cannot support.** The Production Incident Boundary refusals, the Local non-definition, and the STOP list are all preserved. A decision that only says yes to things is not a decision.
- **v1.1 makes it smaller, and therefore safer.** By removing the pre-committed Local architecture conclusions and narrowing Modern's primacy to the Online migration track, the Decision now asserts less than the evidence it holds. That is the correct posture for a governance document: the removed claims were not *wrong*, but they were unsupported by a review that never examined Local options, and leaving them in would have made them citable as precedent. A decision that stays inside its own evidence base is more likely to survive contact with the reviews that follow it.

### Why not REJECT

Rejecting would leave the status quo: an unenforced "frozen" claim, an unowned runtime boundary, a Blocking deployment defect with no gate compelling its fix, and a team-event class whose runtime ownership is implied rather than stated. REJECT would be the higher-risk option. Rejecting on the grounds that the Local question is unanswered is also not available — v1.1 makes the openness explicit and assigns it named owners, which is a stronger position than either a hidden assumption or a premature answer.

### Conditions under which this Decision should be revisited

1. **G1–G6 all closed** → revisit D1; Legacy may cease to be Production Runtime of Record for individual events (C1/C2).
2. **N-4 completes and a team-scale rehearsal passes** → revisit the Team-event Exception (C3).
3. **The Local Product Review (N-14), the DR / Competition Continuity Review (D-14), or the GTM Review (N-15) closes** → the entire `## TOP Local Boundary` section must be re-issued against that review's conclusions. LB1–LB7 are deliberately provisional parking rules that preserve an open question; none of them is a product position, and all of them are expected to be replaced rather than extended.
4. **D-08 (ID-1/ID-2) resolves** → N-4's design constraints change materially; the Team-event Exception's T3 must be re-read against the resolved domain rule.
5. **A production incident produces RCA measurements** → D-02's findings may justify revisiting L-F4. Until then, L-F4 stands.
6. **A non-Online runtime form is ever approved** → D2's scope limitation and G-governance rule 8 must both be re-examined, because the Online track would no longer be the only forward track.

### Sign-off

- **Paul Wu** (Owner) — **Approved, 2026-09-12.**
- **Architecture review** — still required for N-5 (Canon ratification), which this Decision authorizes but does not perform.
- **Explicit owner authorization** — still required for N-3 (removal of committed production dumps), and separately for any git history rewrite, which this Decision does **not** authorize.

---

## Revision Log

| Version | Date | Status | Changes |
|---|---|---|---|
| 1.0 | 2026-09-12 | Draft for Approval | Initial Decision Record converging D-03. |
| 1.1 | 2026-09-12 | Draft for Approval | Two revisions: (1) removed premature TOP Local architecture decision; (2) narrowed Modern forward primacy to the Online migration track. Consistency pass applied to Decision, Modern Policy, TOP Local Boundary, Consequences, Cutover Policy, Production Go/No-Go Gates, Roadmap Phase 2 reinterpretation, Follow-up Issues, and Approval Recommendation. No research re-performed, no scope expanded. |
| 1.1 | 2026-09-12 | **Approved** | Approved by Paul Wu. Recorded in the repository as an Approved Decision Record with the three mandatory attachments retained as binding conditions. No content change from the approved v1.1 draft beyond status, approval metadata, and this Revision Log entry. No Canon, Roadmap, or code modified by this landing. |

### Revision 1 (v1.1) — Removed premature TOP Local architecture decision

**Problem.** v1.0 simultaneously stated that TOP Local was out of scope for this Decision *and* prescribed its architecture — that Local "must ultimately be decoupled from both the Legacy and Modern stacks", and that "its authoritative store, its identity model, and its continuity protocol must be its own". Those are substantive architecture conclusions drawn from a review that never examined Local options, and they conflicted with the Decision's own stated scope.

**Change.**
- **Removed** former LB2 in its entirety (the decoupling mandate and the authoritative-store / identity-model / continuity-protocol requirements).
- **Removed** the same claim from **D6** in `## Decision`; D6 now states that Local's product and technical relationship to Legacy and Modern is **UNDECIDED**.
- **Rewrote** `## TOP Local Boundary` around an explicit five-item list of what D-03 *is* entitled to determine (does not formally exist / 9.12 validated continuity not Local / must not be assumed to equal Legacy-on-a-laptop / relationship UNDECIDED / owned by three named reviews), followed by an explicit list of what it does **not** determine.
- **Retained exactly one** architecture-adjacent principle, as authorized: *"Do not define TOP Local by inheriting Legacy implementation accidentally."* Reframed as a caution about how the question gets answered, not an answer.
- **Rewrote LB3** so that its rationale no longer depends on a decoupling conclusion; the reason not to equate Local with Legacy-on-a-laptop is now that doing so would answer determination 4 without a review.
- **Adjusted** the `zz.html` and "today's practical Local" rows of the current-state table so they record facts without implying a Local design verdict.
- **Added LB7** consolidating the no-promise rule (formerly LB6) and extended it to cover Local capability claims, not only DR claims.
- **Added a STOP-list entry** forbidding any TOP Local architecture proposal from being opened against this Decision.

### Revision 2 (v1.1) — Narrowed Modern forward primacy

**Problem.** v1.0's D2 and Modern Policy asserted that "All new domain modeling, new capability authoring, and productization investment land in Modern." Because TOP Local is undefined, a claim over *all* productization implicitly decided where a future non-Online runtime's productization would live — the same over-reach as Revision 1, from the other direction.

**Change.**
- **D2** now reads: *"For the existing Online migration track, Modern is the Primary Forward Development runtime and the default location for new authoritative domain modeling and new Online operational capability."* A scope paragraph was added stating that D2 does not determine any future Local's internal architecture and does not assert that all productization of every kind lands in Modern.
- **Modern Policy** formal wording narrowed identically, and a new subsection **"Scope of Modern's forward primacy"** enumerates what the primacy does *not* extend to.
- **"What Modern owns forward"** re-headed as *within the Online migration track*; every bullet qualified; "All productization" narrowed to "Online productization … for the Online runtime".
- **All three preserved constraints retained verbatim in force:** Legacy is still barred from new domain modeling (**L-F1**), Legacy still may not become the long-term product architecture (**L-F5**), and Modern is still stated to be the **sole** forward track for the Legacy→Modern Online migration ("there is no second forward track").
- **Consistency pass applied** to the seven sections requested. Resulting edits: `## Decision` (D2, D6, D7 scope note, decision sentence), `## Modern Policy` (as above), `## TOP Local Boundary` (full rewrite per Revision 1), `## Consequences` (item 2 scoped to the Online track; item 10 scoped to the Online track; new item 9 recording that the Local question is now formally open and that the option space is preserved in *both* directions), `## Cutover Policy` (C4 clarified as Online-track retirement only), `## Production Go/No-Go Gates` (new governance rule 8: G1–G6 govern the Online track and may not be reused as a gate set for a non-Online runtime), Roadmap Phase 2 reinterpretation (clause 2 rewritten so it no longer asserts that Local "consumes the migrated domain model" or that Phase 2 "provides Local with a better one"; the re-interpretation now removes an implied pre-judgement rather than making one), `## Follow-up Issues` (N-4 / D-09b / D-10 explicitly scoped to the Online track; N-5 must carry the scope limitation into Canon; N-6 rescoped from "TOP Local minimum-viable fixes" to "Legacy continuity defect fixes (L-A3 only)"; N-10 annotated so the fallback demo is recorded as continuity evidence per LB2; D-14 annotated as the review that must decide where continuity lives; **N-14 Local Product Review** and **N-15 GTM Review** added as named owners of the open question, neither authorized to start by this Decision), `## Approval Recommendation` (new **Attachment 3** scope-discipline condition; new bullet on why v1.1's smaller assertion set is safer; "Why not REJECT" extended; revisit condition 3 broadened to all three Local reviews and to the whole Boundary section; new revisit condition 6 for the case where a non-Online runtime is ever approved).
- **No other content was altered.** `## Context`, `## Evidence` (E1–E11), `## Legacy Policy` (L-A/L-F tables and the anti-scope-creep mechanism), `## Team-event Exception` (T1–T5), and `## Superseded / Conflicting Documents` Categories A–D are unchanged except where a cross-reference number moved (LB4→LB5, LB6→LB7). One addition was made to `## Context` — a short scope-limitation paragraph — because Revision 1's determinations require the reader to know why Local evidence is recorded but not converted into a position.

---

## Landing Record

This Decision Record was landed in the repository as an approved governance document only.

**Performed by this landing:**
- Added this file at `Docs/01_Architecture/D-03-DR-Runtime-Ownership-Decision.md`.
- Set Status to `Approved` and recorded approver and approval date.
- Retained the three mandatory attachments as binding conditions of approval.

**Explicitly NOT performed by this landing:**
- No Canon document modified.
- No Roadmap document modified (`Roadmap.md`, `Roadmap-036-038.md` unchanged).
- No `Modern/` or `Legacy/` code modified.
- No N-1 implementation started.
- No N-5 Canon ratification changes made.
- No TOP Local architecture created or proposed.
- No other derived issue executed.

**Known baseline divergence at time of landing.** This record's evidence was gathered at `3b2d905`. At the moment of landing, `origin/main` was 20 commits ahead of that baseline, and those commits modify files this record cites as evidence — including `Legacy/data.php`, `Legacy/master.html`, `Legacy/referee.html`, and `Legacy/team_lineup.html` — and add a new Legacy Venue Board capability (`Legacy/venue-board.html`, `Legacy/venue-projection.js`) that did not exist at the evidence baseline. Notably, `origin/main` includes PR #182 "Team lineup Master Review & Safe Dispatch" and PR #184 "Simplify team event-day Master operations", which may affect the currency of E2, T2, and D-11a.

This landing did **not** re-perform the review or re-verify evidence against `origin/main`, because doing so was outside the authorized scope. The record's stated baseline remains `3b2d905` and its findings are true as of that baseline. **Attachment 2 (the N-12 currency condition) is the mechanism this Decision already provides for exactly this situation**, and N-12 should be scoped to include the post-baseline Legacy work described above before any C-phase cutover is justified.

---

**Approved: Paul Wu, 2026-09-12.**
