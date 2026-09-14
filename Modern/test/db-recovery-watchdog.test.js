"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const watchdog = path.join(__dirname, "../deploy/field-test/db-unpause-watchdog");
const operator = path.join(__dirname, "../deploy/field-test/field-test");

test("watchdog accepts only one exact immutable 64-hex container ID", () => {
  assert.equal(spawnSync(watchdog, [], { encoding: "utf8" }).status, 64);
  assert.equal(spawnSync(watchdog, ["db"], { encoding: "utf8" }).status, 64);
  assert.equal(spawnSync(watchdog, ["a".repeat(64), "extra"], { encoding: "utf8" }).status, 64);
  assert.equal(spawnSync(watchdog, ["g".repeat(64)], { encoding: "utf8" }).status, 64);
});

test("watchdog and operator retain the narrow exact-ID unpause boundary", () => {
  const source = fs.readFileSync(watchdog, "utf8"); const wrapper = fs.readFileSync(operator, "utf8");
  const dockerActions = [...source.matchAll(/docker\s+([a-z-]+)/g)].map((match) => match[1]);
  assert.deepEqual(dockerActions, ["unpause"]);
  assert.match(source, /deadline_seconds=45/);
  assert.doesNotMatch(source, /docker\s+(?:stop|start|restart|rm|kill|pause)/);
  assert.match(wrapper, /setsid nohup/);
  assert.match(wrapper, /com\.docker\.compose\.project/);
  assert.match(wrapper, /modern-field-test-v1-db/);
  assert.doesNotMatch(source + wrapper, /docker\.sock|\/var\/run\/docker\.sock/);
});
