"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const modern = path.join(__dirname, "..");
const operator = path.join(modern, "deploy/field-test/field-test");

function harness({ failPreflight = false, failDump = false, failNormalization = false, databaseIdentity = "modern_field_test_v1" } = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "field-test-operator-"));
  const log = path.join(directory, "docker.log");
  for (const command of ["node", "npm"]) {
    fs.writeFileSync(path.join(directory, command), `#!/bin/sh\necho host-${command} >>"$TRACE"\nexit 99\n`, { mode: 0o755 });
  }
  fs.writeFileSync(path.join(directory, "docker"), `#!/bin/sh
echo "$*" >>"$TRACE"
[ "$1" = info ] && exit 0
case "$*" in
  *"compose.yaml config --services"*) printf 'app\ndb\n' ;;
  *"compose.yaml ps -q db"*) printf 'db-container-id\n' ;;
  *"compose.yaml ps -q app"*) printf 'app-container-id\n' ;;
  *"db sh"*"mysqldump"*)
    printf '%s\n' '-- partial MySQL dump'
    ${failDump ? "exit 29" : "exit 0"} ;;
  *"app node deploy/field-test/data-operation.js validate-backup"*)
    ${failNormalization ? "exit 31" : "cat"} ;;
  *"app node deploy/field-test/data-operation.js validate-restore"*) cat ;;
  *"app node deploy/field-test/data-operation.js preflight --destructive --emit-drop-sql"*)
    ${failPreflight ? "exit 23" : "printf 'DROP TABLE IF EXISTS `safe`;\\n'"} ;;
  *" db sh "*)
    input="$HARNESS/input.$(wc -l <"$TRACE")"
    cat >"$input"
    if [ "$(cat "$input")" = "SELECT DATABASE();" ]; then
      printf '%s\\n' "$DB_ID"
      rm -f "$input"
    else
      mv "$input" "$CAPTURE.$(wc -l <"$TRACE")"
    fi ;;
esac
`, { mode: 0o755 });
  return { directory, log, databaseIdentity };
}

function run(operation, fixture) {
  return spawnSync("/bin/sh", [operator, ...operation], {
    cwd: path.join(modern, "deploy/field-test"),
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${fixture.directory}:/usr/bin:/bin`,
      TRACE: fixture.log,
      CAPTURE: path.join(fixture.directory, "db-input"),
      HARNESS: fixture.directory,
      DB_ID: fixture.databaseIdentity,
      TOP_FIELD_TEST_DESTRUCTIVE_ACKNOWLEDGEMENT: "deliberately-not-validated-by-shell"
    }
  });
}

test("canonical host verify and rehearsal paths invoke Node only through app", () => {
  const fixture = harness();
  assert.equal(run(["verify"], fixture).status, 0);
  assert.equal(run(["rehearsal"], fixture).status, 0);
  const trace = fs.readFileSync(fixture.log, "utf8");
  assert.doesNotMatch(trace, /host-(?:node|npm)/);
  assert.match(trace, /exec -T app node deploy\/field-test\/data-operation\.js verify/);
  assert.match(trace, /exec -T app node rehearsal\/full-scale-rehearsal\.js/);
});

test("app restart continuity stops and starts only app while preserving container identities", () => {
  const fixture = harness();
  assert.equal(run(["app-restart-continuity"], fixture).status, 0);
  const trace = fs.readFileSync(fixture.log, "utf8");
  assert.match(trace, /exec -T app node rehearsal\/app-restart-continuity\.js before/);
  assert.match(trace, /compose\.yaml stop app/);
  assert.match(trace, /compose\.yaml start app/);
  assert.match(trace, /exec -T app node rehearsal\/app-restart-continuity\.js after/);
  assert.doesNotMatch(trace, /(?:stop|start|restart|rm) db/);
  assert.doesNotMatch(trace, /(?:down|up|create|recreate)/);
});

test("failed destructive preflight cannot reach a db command", () => {
  const fixture = harness({ failPreflight: true });
  const artifact = path.join(fixture.directory, "backup.sql");
  fs.writeFileSync(artifact, `-- TOP-DATABASE: modern_field_test_v1\n-- MySQL dump\n${"x".repeat(150)}`);
  assert.notEqual(run(["restore", artifact], fixture).status, 0);
  const trace = fs.readFileSync(fixture.log, "utf8");
  assert.doesNotMatch(trace, / db sh /);
});

test("mysqldump failure fails closed before validation or publication", () => {
  const fixture = harness({ failDump: true });
  const backupDirectory = path.join(modern, "deploy/field-test/backups");
  fs.mkdirSync(backupDirectory, { recursive: true });
  const before = fs.readdirSync(backupDirectory).sort();

  const result = run(["backup"], fixture);

  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stdout, /backup created/);
  assert.match(result.stderr, /mysqldump failed; no backup was created/);
  assert.deepEqual(fs.readdirSync(backupDirectory).sort(), before);
  const trace = fs.readFileSync(fixture.log, "utf8");
  assert.match(trace, /exec -T db sh .*mysqldump .*--no-tablespaces/);
  assert.doesNotMatch(trace, /data-operation\.js validate-backup/);
});

test("failed backup normalization does not publish a final artifact", () => {
  const fixture = harness({ failNormalization: true });
  const backupDirectory = path.join(modern, "deploy/field-test/backups");
  fs.mkdirSync(backupDirectory, { recursive: true });
  const before = fs.readdirSync(backupDirectory).sort();

  const result = run(["backup"], fixture);

  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stdout, /backup created/);
  assert.deepEqual(fs.readdirSync(backupDirectory).sort(), before);
  const trace = fs.readFileSync(fixture.log, "utf8");
  assert.match(trace, /data-operation\.js validate-backup/);
});

test("wrong db-container mysql target prevents every destructive command", () => {
  const fixture = harness({ databaseIdentity: "modern_other" });
  const artifact = path.join(fixture.directory, "backup.sql");
  fs.writeFileSync(artifact, `-- TOP-DATABASE: modern_field_test_v1\n-- MySQL dump\n${"x".repeat(150)}`);
  const result = run(["restore", artifact], fixture);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /unsafe destructive target/);
  assert.deepEqual(fs.readdirSync(fixture.directory).filter((name) => name.startsWith("db-input.")), []);
});

test("restore stages exact validated bytes, imports through db, and cleans staging", () => {
  const fixture = harness();
  const artifact = path.join(fixture.directory, "backup.sql");
  const bytes = Buffer.from(`-- TOP-DATABASE: modern_field_test_v1\n-- MySQL dump\n${"payload\\n".repeat(30)}`);
  fs.writeFileSync(artifact, bytes);
  assert.equal(run(["restore", artifact], fixture).status, 0);
  const captures = fs.readdirSync(fixture.directory).filter((name) => name.startsWith("db-input."));
  assert.equal(captures.length, 2);
  assert.deepEqual(fs.readFileSync(path.join(fixture.directory, captures[1])), bytes);
  assert.deepEqual(fs.readdirSync(path.join(modern, "deploy/field-test")).filter((name) => name.startsWith(".restore.")), []);
  const source = fs.readFileSync(operator, "utf8");
  const compose = fs.readFileSync(path.join(modern, "deploy/field-test/compose.yaml"), "utf8");
  assert.match(source, /db.*mysql/);
  assert.match(source, /db.*mysqldump/);
  assert.doesNotMatch(source, /docker\.sock/);
  assert.doesNotMatch(compose, /docker\.sock|\/var\/run\/docker\.sock/);
});
