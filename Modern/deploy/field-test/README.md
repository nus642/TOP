# MODERN-FIELD-TEST-V1 deployment foundation

This Compose project is the isolated deployment boundary for Modern Field Test v1. It is **not production-eligible** and must not be deployed to the Lighthouse host as part of this foundation change.

## Safety boundary

- Run exactly one `app` container and one dedicated `db` container on the named `modern-field-test-v1` network.
- The app is reachable only through `127.0.0.1:${APP_HOST_PORT}` on the host. The database has no host-published port.
- Use only synthetic field-test records. Never import Legacy credentials, Legacy data, or real participant data.
- Use a new database name, non-root application user, and unique random passwords. `nhpa`, `root`, missing database settings, a non-`db` host, or a missing acknowledgement stop the app before startup.
- The named `modern-field-test-v1-db` volume belongs only to this field test. Docker provides Node.js and MySQL; PM2, host Node/MySQL, and Kubernetes are outside this boundary.

## Render and inspect (do not deploy yet)

```bash
cd Modern/deploy/field-test
cp .env.example .env
# Replace all placeholder identity and password values, then keep .env untracked.
docker compose config --quiet
docker compose config
```

Build from a clean checkout and explicitly bind the image to that checkout's
full commit identity:

```bash
test -z "$(git status --porcelain)"
BUILD_ID="$(git rev-parse --verify HEAD^{commit})" docker compose build app
```

`BUILD_ID` is a build input only. The Dockerfile rejects anything other than a
40-character lowercase commit SHA, stores it in the image label
`org.opencontainers.image.revision`, and writes it to `/app/.build-id`. Compose
does not set a runtime `BUILD_ID`, so an environment override cannot change the
identity used by rehearsal evidence. After the app is running, execute the
rehearsal with `./field-test rehearsal`; that wrapper intentionally supplies no
host-checkout identity to `docker compose exec`. The evidence manifest reads
the identity from `/app/.build-id` inside the running container.

Before any future start, confirm the rendered configuration contains one app service, no database `ports`, an app binding beginning with `127.0.0.1`, and no unexpected credential values. Do not paste rendered environment values into logs, issues, or pull requests.

## Repository-defined data safety operations

These commands are pinned to this Compose file and project directory. The host wrapper only orchestrates Docker: Node validation runs in `app`, while `mysql` and `mysqldump` run in `db`. They require neither host Node/npm nor a host MySQL client. When Docker requires elevation, the wrapper uses `sudo docker`.

```bash
# Verify database identity and four canonical schema tables.
./field-test verify

# Write a mode-0600, timestamped SQL artifact under ignored backups/.
./field-test backup

# Reset from the repository-controlled ../../db.sql schema.
# Restore from a single-database mysqldump artifact.
export TOP_FIELD_TEST_DESTRUCTIVE_ACKNOWLEDGEMENT=DESTROY-MODERN-FIELD-TEST-V1-DATA
./field-test reset
./field-test restore backups/modern-field-test-v1-….sql
unset TOP_FIELD_TEST_DESTRUCTIVE_ACKNOWLEDGEMENT
```

Reset and restore reject a missing or inexact second acknowledgement before database access. Restore also rejects symlinks, empty/non-dump files, database-selection/creation/deletion statements, and references to Legacy/system schemas. Before dropping tables, both require the database connection itself to report the exact dedicated database identity; this deliberately does not require a healthy schema, so either operation can recover missing tables. Afterward, both require the target identity and canonical schema tables to pass verification. A failed backup remains a `.partial` file and is never reported as complete.

Do not print or render `.env`: Compose supplies credentials inside the `db` container and the scripts never include them in Docker/MySQL command arguments or artifact names. Only synthetic field-test data is permitted.

## Deterministic rehearsal

After an operator performs the separately acknowledged reset above, this single repository-defined command loads and verifies the canonical synthetic fixture and runs both live-operations waves and the conflict probes:

```bash
./field-test rehearsal
```

The command reuses all Field Test identity checks, targets only the running app in this pinned Compose project, and **never resets data**. It fails closed if tournament 1 already exists. The fixture is `modern-field-test-rehearsal-v1`: one competition, 25 pairs/50 synthetic players, 60 matches in 10 rounds, six courts, and six synthetic referees. The first wave dispatches, accepts, starts, scores, and confirms six matches. Its released court/referee are then used by a real second match. Two matches concurrently contend for C1 (exactly one must succeed). The stale-version probe independently uses otherwise-free C2 and referee 03, requires the exact `STALE_DISPATCH_VERSION` rejection, compares match assignment/version and full Court state, and follows with a valid control dispatch to prove no hidden reservation was left. These probes are real MySQL evidence only when this command completes against the isolated Compose stack; unit tests do not make that claim.

For the separate full-event operational profile, reset explicitly and run
`./field-test event-scale-rehearsal`. It imports the deterministic
`modern-event-scale-rehearsal-2026-09-12-v1` fixture (80 synthetic players/40
pairs, 156 matches, 8 courts, 10 referees, and 20 scheduling rounds), then
dispatches, accepts, starts, scores, and confirms every match in repeated
resource-turnover waves. The first eight referees initially cover C1-C8; the
ordinary deterministic rotation subsequently brings referees 9 and 10 across
the courts. This is an integrity rehearsal, not a throughput benchmark. It
retains both contention and stale-write probes and the same isolation,
no-auto-reset, and runtime-build-identity boundaries as the fast profile.

Every attempt writes `deploy/field-test/evidence/latest.json` through the app's evidence-only bind mount. Generated manifests are ignored and mode 0600; the committed `evidence/manifest.schema.json` documents their sanitized shape. Evidence contains environment/build identity, fixture counts, timestamps, checkpoints, turnover/probe outcomes, and pass/fail only—never credentials, cookies, environment dumps, or participant inputs. Archive a reviewed manifest outside the working tree if retention is required. Reset and rerun to demonstrate equivalent fixture state; do not run a second rehearsal over existing data.

## App failure / restart continuity

After an explicitly acknowledged reset, run `./field-test app-restart-continuity`; the rehearsal creates its own deterministic fixture and refuses pre-existing tournament data. It commits Match A as confirmed, Match B as playing with its court occupied, and Match C as dispatched but unaccepted. The command fails closed unless the pinned project contains exactly `app` and `db`, both are already running, and their container identities remain unchanged. It executes only `docker compose stop app` followed by `docker compose start app`; it never stops, restarts, or recreates `db`, and it does not invoke reset or restore.

While the app is down, the wrapper requires stopped/unreachable app observations, an unchanged and healthy DB container with the same `StartedAt`, a successful read-only authoritative-state query, and exact state equality. After restart it checks container, image, OCI revision, and `/app/.build-id` identity; requires old Master and referee sessions to return 401; re-establishes sessions; replays C's dispatch idempotently; completes B and C; and completes a subsequent match with C's released resources. The resulting `evidence/app-restart-continuity-latest.json` retains the eight approved phase checkpoints and separately reports operational state, session, and recovered-operation continuity. Cookies exist only in a mode-0600 transient handoff, are deleted after verification, and are never included in evidence. Authentication persistence is intentionally unchanged.

Source-level tests validate orchestration and evidence logic with fakes; they are not real Lighthouse or real MySQL recovery evidence. The real rehearsal must still be run on the reviewed Lighthouse Modern Field Test stack and its sanitized manifest reviewed and archived.

Real-device/browser evidence, Lighthouse/Nginx/HTTPS deployment, UI watermarking, real participant data, production cutover, and production eligibility remain explicitly deferred.

## DB failure / restore continuity (source-review commands)

This Modern Field Test v1 rehearsal is deliberately split at a destructive restore gate. It never resets data automatically and never selects a backup by `latest` or wildcard.

```sh
./field-test db-recovery RUN_ID
TOP_FIELD_TEST_DESTRUCTIVE_ACKNOWLEDGEMENT=DESTROY-MODERN-FIELD-TEST-V1-DATA \
  ./field-test db-recovery-resume RUN_ID
```

The first command establishes the five-match Recovery Point, invokes the existing `backup` path, creates and accounts for the post-backup delta, performs the bounded exact-container pause/unpause, and stops. The resume command resolves the run-specific manifest, checks the recorded artifact hash, invokes the existing `restore` path with that exact path, proves an exact snapshot match, and continues with fresh sessions.

The separate manual Lighthouse prerequisite is intentionally two-session and must not be run automatically from development:

```sh
# Session 1: this controller deliberately SIGKILLs itself after arming and pausing.
./field-test db-recovery-watchdog-proof-start RUN_ID
# Independent session 2: wait for deadline recovery and prove before == after.
./field-test db-recovery-watchdog-proof-observe RUN_ID
```

Neither watchdog-only command creates a backup, restores data, or issues a competition mutation. Evidence is run-specific under `evidence/db-recovery/RUN_ID/` with private file modes.

The host controller pins one Docker access mode before arming: direct `docker`, or non-interactive `sudo -n docker`. In sudo mode it proves password-cache-independent foreground and detached-session access before pause; the watchdog receives only that validated mode plus the immutable container ID and can still perform only the exact-ID `unpause` action.

Before authorizing the Lighthouse DB recovery run, execute the disposable MySQL 8.4 JSON dump/restore proof from the repository's `Modern` directory:

```sh
TOP_MYSQL_84_JSON_STABILITY=1 node --test --test-name-pattern='MySQL 8.4 JSON byte stability' test/db-recovery-continuity.test.js
```

The opt-in test starts an isolated `mysql:8.4` container with no published ports, fails unless the server reports MySQL 8.4, inserts the reviewed JSON value matrix, captures `HEX(CAST(payload AS BINARY))`, dumps with the Field Test backup options, restores into a second disposable database, and requires exact byte equality. It removes only the exact disposable container ID it created and never addresses a Field Test or Legacy database.
