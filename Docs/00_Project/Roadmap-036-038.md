# TOP Modern Roadmap 036–038

Version: 1.0
Status: Proposed
Last Update: 2026-07-22
Owner: Paul Wu
Document Type: Roadmap (planning reference only)

---

## Current Position

### Dual-Track Status

TOP operates on two parallel tracks:

**Legacy** (PHP 7.4 + Apache + MySQL) is the stable production system deployed
to WeChat Cloud Hosting. It provides the full tournament operations capability:
主裁控制台、裁判终端、检录、场地调度、大屏直播、团体赛管理、OBS 记分牌。
Data is stored in a key-value pattern (`nhpa_store` table). Legacy is frozen —
it receives no new architecture investment, only critical fixes.

**Modern** (Node.js + Express 5 + MySQL) is the active rewrite, following a
layered architecture: API → Service → Repository → Database. It currently
covers the competition scheduling and scoring subset of Legacy's capability.
Modern uses normalized relational tables (6 tables) and preserves behavioral
compatibility with Legacy during migration (Principle 3: Compatibility First).

Both tracks share the same MySQL instance (`nhpa` database).

### Completed: Transaction Boundary Foundation (035)

Milestone 035 introduced `withTransaction()` in the database layer and wrapped
all four service-layer write workflows (`saveSchedule`, `updateMatch`,
`resetCompetition`, `generateCompetition`). All repository functions accept an
injectable connection parameter. The mechanism is sound — every repository call
within a transaction correctly receives the transaction connection.

035 was delivered under strict constraints: no schema changes, no API changes,
no frontend changes, `tournamentId` remains 1. These constraints were
intentional — 035 established the transaction *mechanism* without altering
behavior. The transaction *content* (what each transaction actually does) is
the subject of Milestone 036.

### Architecture Maturity

The layered architecture (API → Service → Repository → Database) is established
and stable. `server.js` handles only bootstrap. Business logic lives in the
service layer. SQL lives in the repository layer. Connection and transaction
management lives in the database layer.

What is not yet mature:

- Legacy-compatible routes (`api/legacy.js`) still bypass the service layer
  with direct SQL, creating a dual execution path.
- The Competition Engine and Operations Engine directories are empty stubs.
- Scheduling and ranking algorithms run entirely in the frontend.
- No automated tests, no linting, no CI/CD.
- `tournamentId` is hardcoded to 1 in all write paths.

---

# Milestone 036

## Transaction Consistency & Legacy Unification

## Objective

Make all data-mutation paths transactionally sound and route them through the
service layer, so that the system has a single execution path for every write
operation and no known data-integrity defects in its transaction content.

## Background

035 established the transaction mechanism. However, the analysis of the four
write workflows revealed consistency gaps between them:

- `saveSchedule()` does not clean `player_partners` or `player_opponents`,
  producing orphaned rows when players are deleted and re-created.
- Deletion order differs between `saveSchedule()` (players → pairings →
  matches) and `resetCompetition()`/`generateCompetition()` (matches →
  pairings → players → partners → opponents).
- `saveSchedule()` deletes pairings conditionally, leaving stale data when
  a tournament switches mode.
- `api/legacy.js` performs identical multi-table writes with direct SQL and
  no transaction wrapping.
- `withTransaction()` has no deadlock retry.
- `getSchedule()` reads across four separate pool connections with no
  snapshot consistency.

These are not theoretical risks — they are active defects that accumulate
inconsistent state during normal usage.

## Design Intent

036 is a **correctness milestone**, not a feature milestone. Its purpose is
to make the existing system *right* before building on it.

The design follows three decisions:

1. **Unify, don't duplicate.** Legacy routes will delegate to the same service
   functions used by modern routes. This eliminates the dual execution path
   and ensures every write goes through the same transaction boundary. The
   legacy URL paths and response shapes are preserved — only the internal
   execution path changes.

2. **Canonical deletion order.** All write workflows will follow a single
   documented deletion order: matches → pairings → player_partners →
   player_opponents → players (children before parents). This order is
   FK-safe and consistent across all functions.

3. **Minimal mechanism additions.** Deadlock retry and read-consistency
   connection are small, contained additions to `db.js`. They do not change
   the architecture — they harden the existing mechanism.

036 does not introduce new abstractions, new modules, or new endpoints.
It fixes what exists.

## Tasks

### 036.1 — Fix saveSchedule deletion completeness and order

Purpose: Eliminate orphaned data and unify deletion order across all
write workflows.

Scope: Add missing `player_partners` and `player_opponents` cleanup to
`saveSchedule()`. Reorder deletions to the canonical order. Make pairing
deletion unconditional.

Dependencies: None (035 completed).

Risk: Low. Internal reordering only; no API or schema changes.

### 036.2 — Add deadlock retry to withTransaction

Purpose: Prevent unhandled 500 errors from InnoDB gap-lock deadlocks
under concurrent access.

Scope: Retry loop in `db.js` for `ER_LOCK_DEADLOCK` (errno 1213),
max 3 attempts with short backoff. Non-deadlock errors propagate
immediately.

Dependencies: None. Independent of 036.1.

Risk: Low. Retry could mask logical lock-contention bugs. Mitigated by
logging each retry with context.

### 036.3 — Unify legacy POST /api/save through service layer

Purpose: Route the legacy save endpoint through the transactional
service path.

Scope: Replace inline SQL in `api/legacy.js` with a delegation to
`competitionService.saveSchedule()`. Preserve response shape.

Dependencies: 036.1 (delegates to the corrected function).

Risk: Medium. Response shape must match the legacy contract exactly,
not the modern contract. Requires before/after comparison.

### 036.4 — Unify legacy POST /api/generate through service layer

Purpose: Route the legacy generate endpoint through the transactional
service path.

Scope: Replace inline SQL with delegation to
`competitionService.generateCompetition()`. Preserve response shape.

Dependencies: 036.1.

Risk: Medium. Same response-shape concern as 036.3.

### 036.5 — Unify legacy PUT /api/match/:id through service layer

Purpose: Route the legacy match-update endpoint through the
transactional service path.

Scope: Replace inline SQL with delegation to
`competitionService.updateMatch()`. Preserve response shape.

Dependencies: None (updateMatch is already correct).

Risk: Low.

### 036.6 — Unify legacy DELETE /api/reset through service layer

Purpose: Route the legacy reset endpoint through the transactional
service path.

Scope: Replace inline SQL with delegation to
`competitionService.resetCompetition()`. Preserve response shape.

Dependencies: None (resetCompetition is already correct).

Risk: Low.

### 036.7 — Unify legacy GET /api/schedule through service layer

Purpose: Route the legacy schedule-read endpoint through the service
layer.

Scope: Replace inline SQL with delegation to
`competitionService.getSchedule()`. Adopt dynamic mode detection
(modern behavior) — strictly more correct than legacy's hardcoded
"round-robin".

Dependencies: None.

Risk: Low–Medium. If the frontend has a latent dependency on always
receiving "round-robin", this could surface. Verify frontend behavior
before deploying.

### 036.8 — Add read consistency to getSchedule

Purpose: Ensure the four read queries in `getSchedule()` observe a
consistent database snapshot.

Scope: Introduce a read-connection helper in `db.js`. Add connection
parameter support to the four read-only repository functions. Execute
all reads on a single connection.

Dependencies: None. Independent of 036.3–036.7.

Risk: Low. Additive change; existing behavior preserved.

### 036.9 — Remove direct database import from legacy.js

Purpose: Complete the unification — `legacy.js` should have no direct
database dependency.

Scope: Remove `pool` import from `api/legacy.js` after all routes are
delegated. The file should only import the service layer.

Dependencies: 036.3–036.7.

Risk: Low. Cleanup task.

## Out of Scope

- Input validation (belongs to 037 — requires a designed error contract).
- Test infrastructure (belongs to 037).
- `tournamentId` parameterization (belongs to 038).
- Database schema changes.
- Frontend changes.
- Competition engine logic.
- Code formatting or style enforcement.

---

# Milestone 037

## Engineering Foundation

## Objective

Establish the minimum viable engineering infrastructure — automated testing,
static analysis, input validation, error standardization, and continuous
integration — so that all subsequent milestones can be developed with
automated verification rather than manual checking.

## Background

The project currently has zero automated safety nets:

- No test files, no test framework. `package.json` contains the default
  placeholder test script.
- No ESLint, Prettier, or `.editorconfig`. `Coding-Standards.md` exists
  but is empty.
- No input validation. Service functions accept `req.body` directly.
  Missing fields cause TypeError (500) or silent data corruption.
- No CI/CD. ENG-002 (Integration Test Standard) remains in Backlog.
- No standardized error response shape.

Milestone 038 involves structural refactoring (engine extraction, context
parameterization). Refactoring without tests violates Principle 4 (Small
Step Engineering — every change needs a clear verification method). 037
provides the safety net that makes 038 possible.

## Design Intent

037 is an **infrastructure milestone**. It adds no features and changes no
behavior. Its value is entirely in risk reduction for future work.

The design follows two decisions:

1. **Test the boundaries, not the internals.** Unit tests verify service-layer
   orchestration (correct calls in correct order) with mocked repositories.
   Integration tests verify full API lifecycle against a real test database.
   We do not test repository SQL syntax or Express routing internals.

2. **Validate at the service boundary.** Input validation lives in the service
   layer (or a dedicated validator module called by the service). The API layer
   maps validation errors to HTTP 400. The repository layer remains a thin SQL
   executor with no validation logic. This preserves the responsibility
   separation established in 034.1.

037 deliberately defers Prettier (code formatting) to avoid a massive
formatting-only diff that pollutes git history. ESLint with minimal rules
is sufficient at this stage.

## Tasks

### Testing Foundation

### 037.1 — Add Jest test framework

Purpose: Establish the test runner and directory structure.

Scope: Install `jest` and `supertest`. Create `tests/unit/` and
`tests/integration/` directories. Replace placeholder test script.

Dependencies: None.

Risk: Low.

### 037.2 — Write unit tests for withTransaction

Purpose: Verify the transaction mechanism (commit, rollback, release,
deadlock retry) with mocked connections.

Scope: 4+ test cases covering the happy path, error path, connection
release, and retry behavior.

Dependencies: 037.1. Also validates 036.2 (deadlock retry).

Risk: Low.

### 037.3 — Write unit tests for service-layer orchestration

Purpose: Verify that each service function calls repositories in the
correct order with correct arguments.

Scope: Mock all repositories. Test `saveSchedule` deletion order,
`resetCompetition` completeness, `generateCompetition` creation flow,
`updateMatch` stats reset. Happy path and error path for each.

Dependencies: 037.1. Also validates 036.1 (corrected deletion order).

Risk: Low.

### 037.4 — Write integration test for competition lifecycle

Purpose: Verify the full API lifecycle against a real database.

Scope: Test sequence: generate → save → getSchedule → updateMatch →
getSchedule → reset → getSchedule. Verify row counts and data
correctness. Test transaction rollback by injecting mid-workflow
failure. Requires a dedicated `nhpa_test` database.

Dependencies: 037.1, 036 (tests corrected behavior).

Risk: Medium. Test database management requires setup/teardown
discipline.

### CI/CD

### 037.5 — Add ESLint configuration

Purpose: Establish static analysis with minimal, non-opinionated rules.

Scope: CommonJS + Node.js + ES2022 config. Rules: `no-undef` (error),
`no-unused-vars` (warn), `eqeqeq` (warn). Add `lint` script.

Dependencies: None.

Risk: Low. Initial run may produce warnings; only errors block.

### 037.6 — Add GitHub Actions CI workflow

Purpose: Automate lint and test on every push and pull request.

Scope: Workflow triggered on push to `main` and PRs. Steps: checkout,
Node 20, `npm ci`, lint, test. MySQL 8.0 service container for
integration tests.

Dependencies: 037.1, 037.5.

Risk: Low. CI environment MySQL configuration may require iteration.

### Error Handling

### 037.7 — Add input validation to service layer

Purpose: Reject malformed requests with meaningful errors instead of
TypeError or silent corruption.

Scope: Validate required fields and types for `saveSchedule`,
`generateCompetition`, `updateMatch`. Return structured error objects.
Preserve backward compatibility — only reject inputs that currently
cause 500 or corruption.

Dependencies: 036 (validates corrected service logic).

Risk: Medium. Validation could reject requests the frontend currently
sends. Mitigate by only rejecting inputs that would currently fail.

### 037.8 — Standardize error response handling in API layers

Purpose: Ensure all error responses follow a consistent shape.

Scope: Standardize to `{ success: false, error: "<message>" }`.
Validation errors return 400; unexpected errors return 500. No raw
stack traces leak to the client.

Dependencies: 037.7.

Risk: Low.

### Engineering Standards

### 037.9 — Add .editorconfig

Purpose: Ensure consistent whitespace across editors.

Scope: UTF-8, 4 spaces, LF, final newline. Matching the dominant
existing code style.

Dependencies: None.

Risk: Low.

### 037.10 — Harden .gitignore

Purpose: Prevent accidental commit of environment secrets and
generated files.

Scope: Ensure `node_modules/`, `.env`, `*.log`, `coverage/` are
excluded.

Dependencies: None.

Risk: Low.

## Out of Scope

- `tournamentId` parameterization (belongs to 038).
- Competition engine extraction (belongs to 038).
- Prettier / automatic code formatting — deferred to avoid noisy diffs.
- End-to-end browser testing (Playwright, Cypress).
- Performance or load testing.
- Pre-commit hooks (Husky, lint-staged) — CI is sufficient at this stage.
- Database schema changes.
- Frontend changes.

---

# Milestone 038

## Tournament Context & Competition Engine

## Objective

Remove the hardcoded `tournamentId = 1` from all paths, introducing explicit
tournament context resolution, and extract the competition scheduling and
ranking logic into a pure, database-free Competition Engine module. This
milestone fulfills Rule-006 (Engine Separation) and transforms the system
from a single-tournament tool into a multi-tournament-capable platform.

## Background

- `tournamentId = 1` is hardcoded in all four write functions and implicitly
  in the API layer. ISSUE-tournament-context-management identifies this as a
  known limitation: "A permanent fixed tournament context is not suitable for
  production usage."

- `engine/competition/` and `engine/operations/` are empty stubs. Rule-006
  mandates a Competition Engine responsible for 赛制、编排、排名、比赛逻辑.
  None of this exists as a separable module.

- Scheduling algorithms (round-robin, fixed-pair) run entirely in the
  frontend. The backend persists whatever the client sends without validation.
  Ranking calculation is also frontend-only — the `players` table stats
  columns are reset but never computed server-side.

- `Docs/03_Modules/Competition-Engine.md` defines the engine's intended
  public interfaces. None are implemented.

## Design Intent

038 is an **architecture evolution milestone**. It introduces two structural
changes and follows four design decisions:

### Tournament Context

Tournament context is resolved by Express middleware, not by each route
handler. The middleware reads `tournamentId` from route parameter, query
parameter, or defaults to `1` for backward compatibility. The service layer
receives `tournamentId` as an explicit parameter — no function contains a
hardcoded ID.

Legacy routes continue to work by either passing `1` explicitly or using
the same middleware with default resolution. No client-side changes are
required.

### Removal of tournamentId Hardcoding

This is a mechanical refactoring: add a parameter, remove a constant. The
risk is low but the surface area is wide (every service function, every API
handler). It must be done after 036 (unified execution path) so there is
only one code path to modify, and after 037 (test safety net) so regressions
are caught automatically.

### Competition Engine Separation

The Competition Engine is a pure JavaScript module under `engine/competition/`.
It has **zero imports** from `database/`, `repositories/`, `services/`, or
`api/`. It accepts plain data objects and returns plain data objects. All I/O
remains in the service layer.

```
API (HTTP handling)
  │
  Service (orchestration + transaction boundary)
  │         │
  │         └── Competition Engine (pure computation)
  │
  Repository (SQL execution)
  │
  Database (connection + transaction infrastructure)
```

This separation means the engine can be unit-tested without any database,
HTTP server, or mocking. It also means the engine can be reused across
sports (Rule-013: Think Platform, Build Modules) and eventually exposed
to AI scheduling (Phase 5).

### Pure Function Algorithm Design

Each algorithm is a standalone file under `engine/competition/`:

- `round-robin.js` — circle method for 4-player doubles courts
- `fixed-pair.js` — pair-vs-pair rotation
- `ranking.js` — win/loss/net/curP calculation and sorting
- `validation.js` — schedule structural integrity checks

All functions are deterministic: same input always produces same output.
No randomness, no I/O, no side effects. This makes them trivially testable
and future-proof for AI integration.

Integration into the service layer is opt-in: `data.serverGenerate === true`
triggers server-side schedule generation. The existing client-generated
workflow remains the default, preserving Compatibility First (Principle 3).

## Tasks

### 038.1 — Introduce tournament context resolution middleware

Purpose: Resolve `tournamentId` from request context with backward-
compatible default.

Scope: New Express middleware. Resolves from route param, query param,
or defaults to `1`. Attaches `req.tournamentId`.

Dependencies: 036 (unified execution path), 037 (test safety net).

Risk: Medium. Default-to-1 logic must be bulletproof for backward
compatibility.

### 038.2 — Parameterize tournamentId in service layer

Purpose: Remove all hardcoded `tournamentId = 1` from service
functions.

Scope: Add `tournamentId` as explicit first parameter to all four
write functions. `getSchedule` already accepts it.

Dependencies: 038.1.

Risk: Low. Mechanical refactoring, protected by 037 tests.

### 038.3 — Update API layers to pass tournament context

Purpose: Connect middleware-resolved tournamentId to service calls.

Scope: Modern routes read `req.tournamentId`. Legacy routes pass `1`
explicitly or use the same middleware. Update API documentation.

Dependencies: 038.2.

Risk: Low.

### 038.4 — Add tournament lifecycle endpoints

Purpose: Enable creation and listing of multiple tournaments.

Scope: `POST /api/competition/tournament`,
`GET /api/competition/tournaments`,
`GET /api/competition/tournament/:id`.
New repository functions for tournament CRUD.

Dependencies: 038.2.

Risk: Low. Additive; no existing endpoints change.

### 038.5 — Define Competition Engine interface contract

Purpose: Establish the engine's public API before implementation.

Scope: Export function signatures from `engine/competition/index.js`:
`generateRoundRobin`, `generateFixedPair`, `calculateRankings`,
`validateSchedule`. Zero infrastructure imports.

Dependencies: None. Can begin in parallel with 038.1–038.4.

Risk: Low. Interface design only.

### 038.6 — Implement generateRoundRobin

Purpose: Server-side round-robin scheduling for 4-player doubles.

Scope: Circle method algorithm. Handles even/odd player counts,
balanced partner rotation, bye management. Pure function.

Dependencies: 038.5.

Risk: Medium. Scheduling algorithms have subtle edge cases. Mitigated
by property-based unit tests.

### 038.7 — Implement calculateRankings

Purpose: Server-side ranking computation from match results.

Scope: Calculate wins, losses, net, curP from finished matches.
Sort by ranking criteria. Pure function.

Dependencies: 038.5.

Risk: Low.

### 038.8 — Implement validateSchedule

Purpose: Structural validation of schedules before persistence.

Scope: Check no duplicate player per round, all players exist,
courts non-empty, round structure well-formed. Return
`{ valid, errors[] }`.

Dependencies: 038.5.

Risk: Low. Initially log warnings without rejecting; enable strict
mode after frontend verification.

### 038.9 — Integrate Competition Engine into service layer

Purpose: Connect engine computation to the service orchestration.

Scope: `generateCompetition` optionally calls engine when
`data.serverGenerate === true`. `saveSchedule` optionally calls
`validateSchedule`. Default behavior (client-generated) unchanged.

Dependencies: 038.6, 038.7, 038.8.

Risk: Medium. Must preserve existing client-generated workflow as
default.

### 038.10 — Write comprehensive engine unit tests

Purpose: Verify algorithm correctness without any infrastructure.

Scope: 15+ test cases: even/odd player counts, minimum players,
edge cases, partner balance, ranking correctness, validation
rejection.

Dependencies: 038.6, 038.7, 038.8.

Risk: Low.

### 038.11 — Update documentation

Purpose: Reflect milestone completion in project docs.

Scope: Update CURRENT-STATUS.md, Competition-Engine.md,
ISSUE-tournament-context-management.md.

Dependencies: All 038 tasks.

Risk: Low.

## Out of Scope

- Operations Engine (referee, check-in, courts, scoreboard — Phase 2).
- Authentication or authorization for tournament access.
- Multi-tenant data isolation beyond tournamentId parameterization.
- Swiss system, elimination brackets, or other formats (Phase 3).
- AI scheduling (Phase 5).
- Frontend changes to adopt server-side generation.
- Real-time sync (WebSocket / SSE).
- Cross-tournament analytics.

---

# Execution Order

```
036 ──→ 037 ──→ 038
```

With partial overlap: 037.5 (ESLint) and 037.9 (.editorconfig) can begin
while 036 is finishing. 038 must not start until 036 is fully complete and
037.1–037.3 (test framework + unit tests) are in place.

## Why 036 first

036 fixes active data-corruption bugs. Every day the system runs with the
`saveSchedule()` orphan defect and the untransactional legacy routes, the
database accumulates inconsistent state. This is a correctness milestone —
it makes the existing system right before we build on it. It is also the
smallest in scope and lowest in risk: no new infrastructure, no new modules,
no API changes.

Fixing these bugs before writing tests (037) means the tests validate
correct behavior, not codify bugs into the test suite.

## Why 037 second

038 is a structural refactoring milestone: extracting engine logic,
parameterizing tournamentId, restructuring routes. Refactoring without
tests violates Principle 4 (Small Step Engineering — every change needs
a clear verification method). The test infrastructure from 037 provides
the safety net for 038's structural changes. Input validation from 037
also protects the system during 038's transition period.

## Why 038 last

038 is the most architecturally ambitious milestone. It depends on both
the corrected transaction behavior (036) and the test/validation
infrastructure (037). Attempting engine extraction before tests exist
would make it impossible to verify behavioral equivalence. Attempting
tournament context before legacy unification would require parameterizing
two code paths instead of one.

This ordering follows Principle 2: Architecture Before Feature Expansion.
Fix the foundation (036). Build the safety net (037). Expand capability
(038).

---

# Architecture Principles

The following principles govern all three milestones. They are derived from
the Engineering Playbook and Development Principles, and are restated here
for quick reference during implementation.

## Architecture Before Feature Expansion

Establish clear boundaries before adding capabilities. Priority:
Architecture → Data integrity → Domain model → New features.
(Principle 2)

## Service Owns Workflow

The service layer is the single owner of business workflow orchestration
and transaction boundaries. No business logic lives in the API layer or
the repository layer. (Principle 5, Rule-006)

## Repository Owns Data Access

All SQL lives in the repository layer. Repository functions accept an
injectable connection parameter to participate in transactions. The
repository has no business logic — it executes SQL and returns data.
(Principle 5)

## Engine Contains Pure Business Logic

The Competition Engine is a pure computation module. It has zero
infrastructure dependencies — no HTTP, no database, no I/O. It accepts
plain data and returns plain data. This makes it testable, reusable
across sports, and ready for AI integration. (Rule-006, Rule-013)

## Human Controls Scope Decisions

AI is an engineering partner, not an automatic code generator. AI
analyzes, proposes, and reviews. The human owner makes final decisions
on scope, priority, and acceptance. No milestone task begins without
human approval. (Principle 6, Rule-009)

---

# Document References

| Document | Relationship |
|---|---|
| Engineering Playbook | Constitution — this roadmap aligns with its rules |
| Roadmap.md | Phase-level roadmap — this document details milestones within Phase 1 |
| CURRENT-STATUS.md | Tracks milestone completion — updated when milestones finish |
| Development-Principles.md | Principles referenced throughout this document |
| ISSUE-tournament-context-management.md | Resolved by 038.1–038.3 |
| Competition-Engine.md | Engine interface spec — implemented by 038.5–038.9 |
| Eng_Backlog.md | ENG-001, ENG-002 addressed by 037 |

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-22 | Initial roadmap for milestones 036–038 |
