const test = require("node:test");
const assert = require("node:assert/strict");

const { getRuntimeConfig, validateFieldTestEnvironment } = require("../runtime-config");

const validEnvironment = () => ({
  TOP_ENVIRONMENT: "field-test",
  TOP_ENVIRONMENT_ID: "modern-field-test-v1-test",
  TOP_FIELD_TEST_ACKNOWLEDGEMENT: "MODERN-FIELD-TEST-V1",
  MYSQL_HOST: "db",
  MYSQL_PORT: "3306",
  MYSQL_DB: "modern_field_test_v1",
  MYSQL_USER: "modern_field_test_v1",
  MYSQL_PASS: "test-only-placeholder"
});

test("accepts an explicit isolated field-test environment", () => {
  assert.doesNotThrow(() => validateFieldTestEnvironment(validEnvironment()));
});

for (const name of ["MYSQL_HOST", "MYSQL_PORT", "MYSQL_DB", "MYSQL_USER", "MYSQL_PASS"]) {
  test(`fails closed when ${name} is missing`, () => {
    const environment = validEnvironment();
    delete environment[name];
    assert.throws(() => validateFieldTestEnvironment(environment), new RegExp(name));
  });
}

test("fails closed for the Legacy database name", () => {
  assert.throws(
    () => validateFieldTestEnvironment({ ...validEnvironment(), MYSQL_DB: "nhpa" }),
    /must not be nhpa/
  );
});

test("fails closed for the root database user", () => {
  assert.throws(
    () => validateFieldTestEnvironment({ ...validEnvironment(), MYSQL_USER: "root" }),
    /must not be root/
  );
});

test("fails closed without the exact field-test acknowledgement", () => {
  assert.throws(
    () => validateFieldTestEnvironment({ ...validEnvironment(), TOP_FIELD_TEST_ACKNOWLEDGEMENT: "yes" }),
    /MODERN-FIELD-TEST-V1/
  );
});

test("fails closed when the field-test acknowledgement is missing", () => {
  const environment = validEnvironment();
  delete environment.TOP_FIELD_TEST_ACKNOWLEDGEMENT;
  assert.throws(() => validateFieldTestEnvironment(environment), /TOP_FIELD_TEST_ACKNOWLEDGEMENT/);
});

test("fails closed without an explicit environment ID", () => {
  assert.throws(
    () => validateFieldTestEnvironment({ ...validEnvironment(), TOP_ENVIRONMENT_ID: "" }),
    /TOP_ENVIRONMENT_ID/
  );
});

test("fails closed unless the environment is field-test", () => {
  assert.throws(
    () => validateFieldTestEnvironment({ ...validEnvironment(), TOP_ENVIRONMENT: "production" }),
    /must be field-test/
  );
});

test("fails closed unless the app database host is the Compose db service", () => {
  assert.throws(
    () => validateFieldTestEnvironment({ ...validEnvironment(), MYSQL_HOST: "localhost" }),
    /dedicated db service/
  );
});

test("runtime configuration supports a configurable port and build identity", () => {
  assert.deepEqual(getRuntimeConfig({
    PORT: "4321",
    BUILD_ID: "abc123",
    TOP_ENVIRONMENT: "field-test",
    TOP_ENVIRONMENT_ID: "modern-field-test-v1-test"
  }), {
    port: 4321,
    buildId: "abc123",
    environment: "field-test",
    environmentId: "modern-field-test-v1-test"
  });
});

test("runtime configuration rejects an invalid port", () => {
  assert.throws(() => getRuntimeConfig({ PORT: "public" }), /PORT/);
});
