#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const dotenv = require("dotenv");
const { validateDataSafety } = require("./data-safety");

const deployDirectory = __dirname;
const modernDirectory = path.resolve(deployDirectory, "../..");
const composeArguments = ["compose", "--project-directory", deployDirectory, "--env-file", path.join(deployDirectory, ".env"), "-f", path.join(deployDirectory, "compose.yaml")];
const operation = process.argv[2];
const prepareOnly = process.argv.includes("--prepare-only");
const destructive = operation === "reset" || operation === "restore";

function fail(message) {
  console.error(`field-test data operation rejected: ${message}`);
  process.exit(1);
}

function runDocker(args, options = {}) {
  const result = spawnSync("docker", [...composeArguments, "exec", "-T", "db", ...args], {
    cwd: deployDirectory,
    encoding: options.encoding === undefined ? "utf8" : options.encoding,
    input: options.input,
    maxBuffer: 64 * 1024 * 1024
  });
  if (result.error || result.status !== 0) {
    fail(result.error ? "Docker Compose is unavailable" : "the isolated db service rejected the operation");
  }
  return result.stdout;
}

function mysql(sql, input) {
  return runDocker(["sh", "-ceu", "export MYSQL_PWD=\"$MYSQL_PASSWORD\"; exec mysql --batch --skip-column-names -h 127.0.0.1 -u \"$MYSQL_USER\" \"$MYSQL_DATABASE\"", "field-test-mysql"], { input: input || sql });
}

function verify() {
  const output = mysql("SELECT CONCAT(DATABASE(), ':', COUNT(*)) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name IN ('tournaments','players','matches','waivers');").trim();
  if (output !== "modern_field_test_v1:4") fail("post-operation database identity/schema verification failed");
  console.log("verified Modern Field Test database identity and canonical schema");
}

function dropAllTables() {
  const names = mysql("SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE() ORDER BY table_name;").trim().split("\n").filter(Boolean);
  if (names.some((name) => !/^[A-Za-z0-9_]+$/.test(name))) fail("database returned an unsafe table identifier");
  if (names.length) mysql(`SET FOREIGN_KEY_CHECKS=0; ${names.map((name) => `DROP TABLE IF EXISTS \`${name}\``).join("; ")}; SET FOREIGN_KEY_CHECKS=1;`);
}

if (!["backup", "reset", "restore", "verify"].includes(operation)) {
  fail("usage: data-operation.js backup|reset|restore|verify [backup.sql] [--prepare-only]");
}

const envFile = path.join(deployDirectory, ".env");
let fileEnvironment = {};
if (fs.existsSync(envFile)) fileEnvironment = dotenv.parse(fs.readFileSync(envFile));
const environment = { ...fileEnvironment, ...process.env };
let safety;
try {
  safety = validateDataSafety(environment, { destructive });
} catch (error) {
  fail(error.message);
}
if (prepareOnly) {
  console.log(`${operation} preparation allowed for ${safety.environmentId}`);
  process.exit(0);
}

if (operation === "verify") {
  verify();
} else if (operation === "backup") {
  verify();
  const backupDirectory = path.join(deployDirectory, "backups");
  fs.mkdirSync(backupDirectory, { recursive: true, mode: 0o700 });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const finalPath = path.join(backupDirectory, `${safety.environmentId}-${stamp}.sql`);
  const temporaryPath = `${finalPath}.partial`;
  const rawDump = runDocker(["sh", "-ceu", "export MYSQL_PWD=\"$MYSQL_PASSWORD\"; exec mysqldump --single-transaction --routines --triggers --set-gtid-purged=OFF -h 127.0.0.1 -u \"$MYSQL_USER\" \"$MYSQL_DATABASE\"", "field-test-backup"]);
  const dump = `-- TOP-DATABASE: modern_field_test_v1\n${rawDump}`;
  fs.writeFileSync(temporaryPath, dump, { mode: 0o600 });
  if (fs.statSync(temporaryPath).size < 100 || !dump.includes("MySQL dump")) fail("backup artifact usability check failed");
  fs.renameSync(temporaryPath, finalPath);
  console.log(`backup created: ${path.relative(modernDirectory, finalPath)}`);
} else if (operation === "reset") {
  verify();
  dropAllTables();
  mysql("", fs.readFileSync(path.join(modernDirectory, "db.sql"), "utf8"));
  verify();
} else {
  const artifact = process.argv[3];
  if (!artifact) fail("restore requires one backup artifact path");
  const resolved = path.resolve(artifact);
  let stat;
  try { stat = fs.lstatSync(resolved); } catch { fail("restore artifact does not exist"); }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size < 100) fail("restore artifact must be a non-empty regular file");
  const sql = fs.readFileSync(resolved, "utf8");
  if (!sql.startsWith("-- TOP-DATABASE: modern_field_test_v1\n") || !sql.includes("MySQL dump") || /^\s*(?:USE|CREATE\s+DATABASE|DROP\s+DATABASE)\b/im.test(sql) || /`(?:mysql|nhpa)`\s*\./i.test(sql)) {
    fail("restore artifact contains an ambiguous or unsafe database target");
  }
  verify();
  dropAllTables();
  mysql("", sql);
  verify();
}
