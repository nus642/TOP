"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const IMAGE = "mysql:8.4";
const ROOT_PASSWORD = "disposable-json-stability-only";
const SOURCE_DB = "top_json_stability_source";
const RESTORED_DB = "top_json_stability_restored";
const VALUES = [
  { label: "multi-key-object", value: { zeta: 1, alpha: "two", middle: false } },
  { label: "nested-object", value: { outer: { child: { enabled: true, value: null } } } },
  { label: "array", value: [1, "two", false, null, { nested: [3, 4] }] },
  { label: "numeric-values", value: { integer: 9007199254740993n.toString(), decimal: 123.456, negative: -7 } },
  { label: "booleans", value: { yes: true, no: false } },
  { label: "strings", value: { ascii: "pickleball", unicode: "匹克球", escaped: "quote\\\"slash\\\\" } },
  { label: "json-null", value: null }
];

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, `${command} ${args.join(" ")} failed:\n${result.stderr}`);
  return result.stdout;
}
function dockerExec(containerId, command, input) {
  return run("docker", ["exec", "-i", containerId, ...command], input === undefined ? {} : { input });
}
function mysql(containerId, database, sql) {
  const args = ["mysql", "--batch", "--skip-column-names", "--default-character-set=utf8mb4", `-uroot`, `-p${ROOT_PASSWORD}`];
  if (database) args.push(database);
  return dockerExec(containerId, args, sql);
}
function representations(containerId, database) {
  return mysql(containerId, database, "SET time_zone = '+00:00'; SELECT id, label, HEX(CAST(payload AS BINARY)) FROM json_stability_cases ORDER BY id;\n");
}
async function waitForMysql(containerId) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const result = spawnSync("docker", ["exec", containerId, "mysqladmin", "ping", "-h", "127.0.0.1", "-uroot", `-p${ROOT_PASSWORD}`, "--silent"], { encoding: "utf8" });
    if (result.status === 0) return;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error("disposable MySQL 8.4 did not become ready");
}

async function proveMysql84JsonDumpRestoreStability() {
  const suffix = `${process.pid}-${crypto.randomBytes(6).toString("hex")}`;
  const name = `top-json-stability-${suffix}`;
  let containerId;
  try {
    containerId = run("docker", ["run", "--detach", "--rm", "--name", name, "--env", `MYSQL_ROOT_PASSWORD=${ROOT_PASSWORD}`, IMAGE]).trim();
    assert.match(containerId, /^[0-9a-f]{64}$/, "Docker did not return one immutable container ID");
    await waitForMysql(containerId);
    const identity = mysql(containerId, null, "SELECT VERSION(), @@version_comment;\n").trim().split("\t");
    assert.match(identity[0], /^8\.4(?:\.|$)/, `required MySQL 8.4, received ${identity[0]}`);
    assert.match(identity[1], /MySQL/i, `required Oracle MySQL, received ${identity[1]}`);

    mysql(containerId, null, `CREATE DATABASE ${SOURCE_DB} CHARACTER SET utf8mb4; CREATE DATABASE ${RESTORED_DB} CHARACTER SET utf8mb4;\n`);
    mysql(containerId, SOURCE_DB, "CREATE TABLE json_stability_cases (id INT NOT NULL PRIMARY KEY, label VARCHAR(40) NOT NULL, payload JSON NOT NULL);\n");
    const inserts = VALUES.map(({ label, value }, index) => {
      const json = JSON.stringify(value).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
      return `INSERT INTO json_stability_cases (id,label,payload) VALUES (${index + 1},'${label}','${json}');`;
    }).join("\n");
    mysql(containerId, SOURCE_DB, `${inserts}\n`);
    const before = representations(containerId, SOURCE_DB);
    assert.equal(before.trim().split("\n").length, VALUES.length);

    const dump = dockerExec(containerId, ["mysqldump", "--single-transaction", "--routines", "--triggers", "--no-tablespaces", "--set-gtid-purged=OFF", "--default-character-set=utf8mb4", "-uroot", `-p${ROOT_PASSWORD}`, SOURCE_DB]);
    assert.match(dump, /CREATE TABLE `json_stability_cases`/);
    mysql(containerId, RESTORED_DB, dump);
    const after = representations(containerId, RESTORED_DB);
    assert.equal(after, before, "server-derived JSON bytes changed across mysqldump/restore");
    return { image: IMAGE, version: identity[0], cases: VALUES.map(({ label }) => label), representation: "HEX(CAST(payload AS BINARY))", exactMatch: true };
  } finally {
    if (containerId && /^[0-9a-f]{64}$/.test(containerId)) spawnSync("docker", ["rm", "--force", containerId], { encoding: "utf8" });
  }
}
module.exports = { IMAGE, SOURCE_DB, RESTORED_DB, VALUES, proveMysql84JsonDumpRestoreStability };
