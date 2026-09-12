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

Before any future start, confirm the rendered configuration contains one app service, no database `ports`, an app binding beginning with `127.0.0.1`, and no unexpected credential values. Do not paste rendered environment values into logs, issues, or pull requests.

Destructive reset, backup/restore automation, fixture extraction, turnover waves, failure injection, device rehearsal, UI watermarking, and production eligibility are explicitly deferred.
