"use strict";

const FIELD_TEST_ACKNOWLEDGEMENT = "MODERN-FIELD-TEST-V1";
const DESTRUCTIVE_ACKNOWLEDGEMENT = "DESTROY-MODERN-FIELD-TEST-V1-DATA";
const DATABASE = "modern_field_test_v1";
const BACKUP_HEADER = `-- TOP-DATABASE: ${DATABASE}\n`;
const ENVIRONMENT_ID_PATTERN = /^modern-field-test-v1-[a-z0-9][a-z0-9-]*$/;

function required(environment, name) {
  const value = environment[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Field-test data operation requires ${name}`);
  }
  return value.trim();
}

function artifactText(artifact) {
  if (!Buffer.isBuffer(artifact) || artifact.length < 100) {
    throw new Error("artifact must contain a non-empty MySQL dump");
  }
  return artifact.toString("utf8");
}

function validateBackupDump(artifact) {
  const text = artifactText(artifact);
  if (!text.includes("MySQL dump")) throw new Error("backup artifact usability check failed");
  const normalized = text.replace(
    /^\/\*!(\d{5}) DEFINER=`(?:``|[^`])+`@`(?:``|[^`])+` SQL SECURITY (DEFINER|INVOKER) \*\/$/gm,
    "/*!$1 SQL SECURITY $2 */"
  );
  return Buffer.from(BACKUP_HEADER + normalized);
}

function validateRestoreArtifact(artifact) {
  const text = artifactText(artifact);
  if (!text.startsWith(BACKUP_HEADER) || !text.includes("MySQL dump") || /^\s*(?:USE|CREATE\s+DATABASE|DROP\s+DATABASE)\b/im.test(text) || /`(?:mysql|nhpa)`\s*\./i.test(text)) {
    throw new Error("restore artifact contains an ambiguous or unsafe database target");
  }
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
  validateBackupDump,
  validateDataSafety,
  validateRestoreArtifact
};
