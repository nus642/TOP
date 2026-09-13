"use strict";

const fs = require("node:fs");

const BUILD_ID_FILE = "/app/.build-id";
const PLACEHOLDERS = new Set([
  "development",
  "local-field-test",
  "replace-with-git-commit",
  "unknown"
]);

function validateEvidenceBuildId(value) {
  const buildId = typeof value === "string" ? value.trim() : "";
  if (PLACEHOLDERS.has(buildId.toLowerCase())) {
    throw new Error(`Evidence BUILD_ID must not be a placeholder: ${buildId}`);
  }
  if (!/^[0-9a-f]{40}$/.test(buildId)) {
    throw new Error("Evidence BUILD_ID must be a 40-character lowercase Git commit SHA");
  }
  return buildId;
}

function readRuntimeBuildId({ filename = BUILD_ID_FILE, readFileSync = fs.readFileSync } = {}) {
  let value;
  try {
    value = readFileSync(filename, "utf8");
  } catch (error) {
    throw new Error(`Cannot read immutable runtime BUILD_ID from ${filename}: ${error.message}`);
  }
  return validateEvidenceBuildId(value);
}

module.exports = { BUILD_ID_FILE, PLACEHOLDERS, validateEvidenceBuildId, readRuntimeBuildId };
