const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const { DESTRUCTIVE_ACKNOWLEDGEMENT, validateDataSafety } = require("../deploy/field-test/data-safety");

const validEnvironment = () => ({
  TOP_ENVIRONMENT: "field-test",
  TOP_ENVIRONMENT_ID: "modern-field-test-v1-test",
  TOP_FIELD_TEST_ACKNOWLEDGEMENT: "MODERN-FIELD-TEST-V1",
  MYSQL_HOST: "db",
  MYSQL_PORT: "3306",
  MYSQL_DB: "modern_field_test_v1",
  MYSQL_USER: "modern_field_test_v1",
  MYSQL_PASS: "test-placeholder"
});

test("safe field-test configuration allows operation preparation", () => {
  assert.deepEqual(validateDataSafety(validEnvironment()), {
    database: "modern_field_test_v1",
    environmentId: "modern-field-test-v1-test"
  });
});

const unsafeCases = [
  ["non-field-test environment", "TOP_ENVIRONMENT", "production", /must be field-test/],
  ["missing environment ID", "TOP_ENVIRONMENT_ID", undefined, /TOP_ENVIRONMENT_ID/],
  ["incorrect environment ID", "TOP_ENVIRONMENT_ID", "legacy-uat", /MODERN-FIELD-TEST-V1/],
  ["missing acknowledgement", "TOP_FIELD_TEST_ACKNOWLEDGEMENT", undefined, /TOP_FIELD_TEST_ACKNOWLEDGEMENT/],
  ["incorrect acknowledgement", "TOP_FIELD_TEST_ACKNOWLEDGEMENT", "yes", /MODERN-FIELD-TEST-V1/],
  ["Legacy database", "MYSQL_DB", "nhpa", /dedicated modern_field_test_v1/],
  ["another database", "MYSQL_DB", "modern_other", /dedicated modern_field_test_v1/],
  ["root user", "MYSQL_USER", "root", /must not be root/],
  ["host database", "MYSQL_HOST", "localhost", /Compose db service/]
];

for (const [label, key, value, expected] of unsafeCases) {
  test(`rejects ${label}`, () => {
    const environment = validEnvironment();
    if (value === undefined) delete environment[key]; else environment[key] = value;
    assert.throws(() => validateDataSafety(environment), expected);
  });
}

for (const key of ["MYSQL_HOST", "MYSQL_PORT", "MYSQL_DB", "MYSQL_USER", "MYSQL_PASS"]) {
  test(`rejects missing required ${key}`, () => {
    const environment = validEnvironment();
    delete environment[key];
    assert.throws(() => validateDataSafety(environment), new RegExp(key));
  });
}

test("destructive operations require their separate exact acknowledgement", () => {
  assert.throws(() => validateDataSafety(validEnvironment(), { destructive: true }), /TOP_FIELD_TEST_DESTRUCTIVE_ACKNOWLEDGEMENT/);
  assert.throws(() => validateDataSafety({ ...validEnvironment(), TOP_FIELD_TEST_DESTRUCTIVE_ACKNOWLEDGEMENT: "yes" }, { destructive: true }), new RegExp(DESTRUCTIVE_ACKNOWLEDGEMENT));
  assert.doesNotThrow(() => validateDataSafety({ ...validEnvironment(), TOP_FIELD_TEST_DESTRUCTIVE_ACKNOWLEDGEMENT: DESTRUCTIVE_ACKNOWLEDGEMENT }, { destructive: true }));
});

test("restore rejects an artifact that can select an unsafe target before database access", () => {
  const artifact = `-- TOP-DATABASE: modern_field_test_v1\n-- MySQL dump\nUSE nhpa;\n${"-".repeat(120)}\n`;
  const result = spawnSync(process.execPath, [path.join(__dirname, "../deploy/field-test/data-operation.js"), "validate-restore", "--destructive"], {
    encoding: "utf8",
    input: artifact,
    env: { ...process.env, ...validEnvironment(), TOP_FIELD_TEST_DESTRUCTIVE_ACKNOWLEDGEMENT: DESTRUCTIVE_ACKNOWLEDGEMENT }
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ambiguous or unsafe database target/);
  assert.doesNotMatch(result.stderr, /password|test-placeholder/i);
});

test("recovery operations separate pre-drop target identity from post-operation schema health", () => {
  const source = fs.readFileSync(path.join(__dirname, "../deploy/field-test/data-operation.js"), "utf8");
  const operator = fs.readFileSync(path.join(__dirname, "../deploy/field-test/field-test"), "utf8");
  assert.match(source, /function verifyTargetIdentity\(connection\)[\s\S]*SELECT DATABASE\(\)/);
  assert.match(source, /function verifySchema\(connection\)[\s\S]*verifyTargetIdentity\(connection\)[\s\S]*information_schema\.tables/);
  assert.match(operator, /preflight --destructive --emit-drop-sql[\s\S]*db_mysql_destructive <"\$drops"[\s\S]*postcheck --destructive/);
});
