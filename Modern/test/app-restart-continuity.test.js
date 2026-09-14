"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../rehearsal/app-restart-continuity.js"), "utf8");

test("restart rehearsal establishes the approved A/B/C boundary and performs continuation", () => {
  assert.match(source, /\["confirmed", "playing", "assigned"\]/);
  assert.match(source, /condition, "occupied"/);
  assert.match(source, /state\.cCorrelation, state\.cExpectedVersion/);
  assert.match(source, /await scoreConfirm\(master, referees\[1\]/);
  assert.match(source, /await acceptStartScoreConfirm\(master, referees\[2\]/);
  assert.match(source, /correlation\("subsequent"\)/);
  assert.match(source, /allCourtsAvailable: true/);
  assert.match(source, /allRefereesAvailable: true/);
});

test("restart evidence preserves all approved phase distinctions", () => {
  for (const phase of [
    "pre-failure-state-committed", "failure-observed", "mysql-continuity-during-failure",
    "artifact-identity-after-restart", "post-restart-state-matched", "dispatch-replay-idempotent",
    "continuation-operation-complete", "final-integrity"
  ]) assert.ok(source.includes(phase), `missing evidence phase ${phase}`);
});

test("failure checkpoints consume sanitized host observations", () => {
  for (const field of [
    "RESTART_APP_STOPPED", "RESTART_HTTP_UNAVAILABLE", "RESTART_DB_SAME_CONTAINER",
    "RESTART_DB_SAME_STARTED_AT", "RESTART_DB_RUNNING", "RESTART_DB_HEALTHY",
    "RESTART_DB_READ_ONLY_QUERY_SUCCEEDED", "RESTART_DB_STATE_UNCHANGED"
  ]) assert.ok(source.includes(`observed("${field}")`), `missing host observation ${field}`);
  assert.doesNotMatch(source, /rawDb|databaseContents|environmentDump/);
});
