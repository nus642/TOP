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
rehearsal with `node rehearsal.js`; that wrapper intentionally supplies no
host-checkout identity to `docker compose exec`. The evidence manifest reads
the identity from `/app/.build-id` inside the running container.

Before any future start, confirm the rendered configuration contains one app service, no database `ports`, an app binding beginning with `127.0.0.1`, and no unexpected credential values. Do not paste rendered environment values into logs, issues, or pull requests.

## Repository-defined data safety operations

These commands are pinned to this Compose file, project directory, and the `db` service. They validate the exact database, non-root user, Compose hostname, environment identity, and acknowledgement before invoking Docker. They neither require nor invoke a host MySQL client.

```bash
# Verify database identity and four canonical schema tables.
node data-operation.js verify

# Write a mode-0600, timestamped SQL artifact under ignored backups/.
node data-operation.js backup

# Reset from the repository-controlled ../../db.sql schema.
# Restore from a single-database mysqldump artifact.
export TOP_FIELD_TEST_DESTRUCTIVE_ACKNOWLEDGEMENT=DESTROY-MODERN-FIELD-TEST-V1-DATA
node data-operation.js reset
node data-operation.js restore backups/modern-field-test-v1-….sql
unset TOP_FIELD_TEST_DESTRUCTIVE_ACKNOWLEDGEMENT
```

Reset and restore reject a missing or inexact second acknowledgement before database access. Restore also rejects symlinks, empty/non-dump files, database-selection/creation/deletion statements, and references to Legacy/system schemas. Before dropping tables, both require the database connection itself to report the exact dedicated database identity; this deliberately does not require a healthy schema, so either operation can recover missing tables. Afterward, both require the target identity and canonical schema tables to pass verification. A failed backup remains a `.partial` file and is never reported as complete.

Do not print or render `.env`: Compose supplies credentials inside the `db` container and the scripts never include them in Docker/MySQL command arguments or artifact names. Only synthetic field-test data is permitted.

Fixture extraction, turnover waves, failure injection, device rehearsal, UI watermarking, and production eligibility remain explicitly deferred.
