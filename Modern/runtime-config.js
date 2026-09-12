const FIELD_TEST_ACKNOWLEDGEMENT = "MODERN-FIELD-TEST-V1";

function requireValue(environment, name) {
  const value = environment[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Field-test configuration requires ${name}`);
  }
  return value.trim();
}

function validateFieldTestEnvironment(environment = process.env) {
  if (requireValue(environment, "TOP_ENVIRONMENT") !== "field-test") {
    throw new Error("TOP_ENVIRONMENT must be field-test");
  }

  requireValue(environment, "TOP_ENVIRONMENT_ID");

  if (requireValue(environment, "TOP_FIELD_TEST_ACKNOWLEDGEMENT") !== FIELD_TEST_ACKNOWLEDGEMENT) {
    throw new Error(`TOP_FIELD_TEST_ACKNOWLEDGEMENT must be ${FIELD_TEST_ACKNOWLEDGEMENT}`);
  }

  if (requireValue(environment, "MYSQL_HOST") !== "db") {
    throw new Error("Field-test MYSQL_HOST must be the dedicated db service");
  }
  requireValue(environment, "MYSQL_PORT");

  const database = requireValue(environment, "MYSQL_DB");
  if (database.toLowerCase() === "nhpa") {
    throw new Error("Field-test MYSQL_DB must not be nhpa");
  }

  const user = requireValue(environment, "MYSQL_USER");
  if (user.toLowerCase() === "root") {
    throw new Error("Field-test MYSQL_USER must not be root");
  }
  requireValue(environment, "MYSQL_PASS");
}

function getRuntimeConfig(environment = process.env) {
  const port = Number(environment.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }
  return {
    port,
    buildId: environment.BUILD_ID || "development",
    environment: environment.TOP_ENVIRONMENT || "development",
    environmentId: environment.TOP_ENVIRONMENT_ID || "local"
  };
}

module.exports = { getRuntimeConfig, validateFieldTestEnvironment };
