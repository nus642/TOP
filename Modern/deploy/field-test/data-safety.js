"use strict";

const FIELD_TEST_ACKNOWLEDGEMENT = "MODERN-FIELD-TEST-V1";
const DESTRUCTIVE_ACKNOWLEDGEMENT = "DESTROY-MODERN-FIELD-TEST-V1-DATA";
const DATABASE = "modern_field_test_v1";
const ENVIRONMENT_ID_PATTERN = /^modern-field-test-v1-[a-z0-9][a-z0-9-]*$/;

function required(environment, name) {
  const value = environment[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Field-test data operation requires ${name}`);
  }
  return value.trim();
}

function validateDataSafety(environment, { destructive = false } = {}) {
  if (required(environment, "TOP_ENVIRONMENT") !== "field-test") {
    throw new Error("TOP_ENVIRONMENT must be field-test");
  }
  const environmentId = required(environment, "TOP_ENVIRONMENT_ID");
  if (!ENVIRONMENT_ID_PATTERN.test(environmentId)) {
    throw new Error("TOP_ENVIRONMENT_ID must identify MODERN-FIELD-TEST-V1");
  }
  if (required(environment, "TOP_FIELD_TEST_ACKNOWLEDGEMENT") !== FIELD_TEST_ACKNOWLEDGEMENT) {
    throw new Error(`TOP_FIELD_TEST_ACKNOWLEDGEMENT must be ${FIELD_TEST_ACKNOWLEDGEMENT}`);
  }
  if (required(environment, "MYSQL_HOST") !== "db") {
    throw new Error("MYSQL_HOST must be the dedicated Compose db service");
  }
  required(environment, "MYSQL_PORT");
  if (required(environment, "MYSQL_DB") !== DATABASE) {
    throw new Error(`MYSQL_DB must be the dedicated ${DATABASE} database`);
  }
  if (required(environment, "MYSQL_USER").toLowerCase() === "root") {
    throw new Error("MYSQL_USER must not be root");
  }
  required(environment, "MYSQL_PASS");
  if (destructive && required(environment, "TOP_FIELD_TEST_DESTRUCTIVE_ACKNOWLEDGEMENT") !== DESTRUCTIVE_ACKNOWLEDGEMENT) {
    throw new Error(`TOP_FIELD_TEST_DESTRUCTIVE_ACKNOWLEDGEMENT must be ${DESTRUCTIVE_ACKNOWLEDGEMENT}`);
  }
  return { database: DATABASE, environmentId };
}

module.exports = {
  DATABASE,
  DESTRUCTIVE_ACKNOWLEDGEMENT,
  validateDataSafety
};
