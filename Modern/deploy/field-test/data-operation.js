#!/usr/bin/env node
"use strict";

const mysql = require("mysql2/promise");
const {
  validateBackupDump,
  validateDataSafety,
  validateRestoreArtifact
} = require("./data-safety");

const action = process.argv[2];
const destructive = process.argv.includes("--destructive");

function fail(message) {
  console.error(`field-test data operation rejected: ${message}`);
  process.exit(1);
}

async function connectionFor(environment) {
  return mysql.createConnection({
    host: environment.MYSQL_HOST,
    port: Number(environment.MYSQL_PORT),
    database: environment.MYSQL_DB,
    user: environment.MYSQL_USER,
    password: environment.MYSQL_PASS
  });
}

async function verifyTargetIdentity(connection) {
  const [rows] = await connection.query("SELECT DATABASE() AS database_name");
  if (rows.length !== 1 || rows[0].database_name !== "modern_field_test_v1") {
    throw new Error("database connection resolved to an unsafe target");
  }
}

async function verifySchema(connection) {
  await verifyTargetIdentity(connection);
  const [rows] = await connection.query("SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name IN ('tournaments','players','matches','waivers')");
  if (Number(rows[0]?.table_count) !== 4) throw new Error("canonical schema verification failed");
}

async function safeDropStatements(connection) {
  const [rows] = await connection.query("SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE() ORDER BY table_name");
  const names = rows.map((row) => row.TABLE_NAME || row.table_name);
  if (names.some((name) => typeof name !== "string" || !/^[A-Za-z0-9_]+$/.test(name))) {
    throw new Error("database returned an unsafe table identifier");
  }
  if (!names.length) return "SELECT 1;\n";
  return `SET FOREIGN_KEY_CHECKS=0;\n${names.map((name) => `DROP TABLE IF EXISTS \`${name}\`;`).join("\n")}\nSET FOREIGN_KEY_CHECKS=1;\n`;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function main() {
  if (!action || !["verify", "preflight", "postcheck", "validate-backup", "validate-restore"].includes(action)) {
    fail("usage: data-operation.js verify|preflight|postcheck|validate-backup|validate-restore [--destructive] [--emit-drop-sql]");
  }

  const environment = process.env;
  validateDataSafety(environment, { destructive });

  if (action === "validate-backup") {
    process.stdout.write(validateBackupDump(await readStdin()));
    return;
  }
  if (action === "validate-restore") {
    const artifact = await readStdin();
    validateRestoreArtifact(artifact);
    process.stdout.write(artifact);
    return;
  }

  const connection = await connectionFor(environment);
  try {
    if (action === "verify" || action === "postcheck") {
      await verifySchema(connection);
      console.error("verified Modern Field Test database identity and canonical schema");
      return;
    }
    await verifyTargetIdentity(connection);
    if (!destructive) await verifySchema(connection);
    if (process.argv.includes("--emit-drop-sql")) process.stdout.write(await safeDropStatements(connection));
    console.error(`field-test ${destructive ? "destructive " : ""}preflight passed`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => fail(error.message));
