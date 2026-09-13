"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  BUILD_ID_FILE,
  validateEvidenceBuildId,
  readRuntimeBuildId
} = require("../rehearsal/build-identity");

const SHA = "0123456789abcdef0123456789abcdef01234567";

test("accepts a full lowercase commit SHA", () => {
  assert.equal(validateEvidenceBuildId(`${SHA}\n`), SHA);
});

for (const value of ["development", "local-field-test", "replace-with-git-commit", "unknown"]) {
  test(`rejects placeholder evidence BUILD_ID ${value}`, () => {
    assert.throws(() => validateEvidenceBuildId(value), /placeholder/);
  });
}

for (const value of ["", "abc123", "G".repeat(40), "A".repeat(40), `${SHA}0`]) {
  test(`rejects invalid evidence BUILD_ID ${JSON.stringify(value)}`, () => {
    assert.throws(() => validateEvidenceBuildId(value), /40-character lowercase Git commit SHA/);
  });
}

test("reads BUILD_ID from the immutable running-artifact file", () => {
  let requested;
  const actual = readRuntimeBuildId({ readFileSync(filename, encoding) {
    requested = { filename, encoding };
    return `${SHA}\n`;
  }});
  assert.deepEqual(requested, { filename: BUILD_ID_FILE, encoding: "utf8" });
  assert.equal(actual, SHA);
});

test("does not fall back to a process environment BUILD_ID", () => {
  assert.throws(
    () => readRuntimeBuildId({ readFileSync() { throw new Error("missing"); } }),
    /Cannot read immutable runtime BUILD_ID/
  );
});

test("Compose cannot override image identity at container runtime", () => {
  const compose = fs.readFileSync(path.join(__dirname, "../deploy/field-test/compose.yaml"), "utf8");
  const runtimeEnvironment = compose.split("    environment:")[1].split("    ports:")[0];
  assert.doesNotMatch(runtimeEnvironment, /BUILD_ID/);
});

test("field-test wrapper never injects a host BUILD_ID with compose exec", () => {
  const wrapper = fs.readFileSync(path.join(__dirname, "../deploy/field-test/field-test"), "utf8");
  assert.doesNotMatch(wrapper, /rev-parse/);
  assert.doesNotMatch(wrapper, /BUILD_ID/);
  assert.match(wrapper, /compose exec -T app node/);
});
