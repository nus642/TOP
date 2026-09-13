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

Every attempt writes `deploy/field-test/evidence/latest.json` through the app's evidence-only bind mount. Generated manifests are ignored and mode 0600; the committed `evidence/manifest.schema.json` documents their sanitized shape. Evidence contains environment/build identity, fixture counts, timestamps, checkpoints, turnover/probe outcomes, and pass/fail only—never credentials, cookies, environment dumps, or participant inputs. Archive a reviewed manifest outside the working tree if retention is required. Reset and rerun to demonstrate equivalent fixture state; do not run a second rehearsal over existing data.

Real-device/browser evidence, interruption and restart recovery, Lighthouse/Nginx/HTTPS deployment, UI watermarking, real participant data, production cutover, and production eligibility remain explicitly deferred.
