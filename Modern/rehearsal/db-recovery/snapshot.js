"use strict";
const crypto = require("node:crypto");
const contract = require("./schema-contract.json");
const ALLOWED_TYPES = /^(int|bigint|tinyint\(1\)|tinyint unsigned|smallint unsigned|varchar\(\d+\)|enum\(.+\)|timestamp|timestamp\(6\)|datetime\(6\)|json)$/;
const digest = (value) => crypto.createHash("sha256").update(value).digest("hex");
function normalizeMetadata(rows) {
  const tables = {};
  for (const row of rows) {
    const table = row.TABLE_NAME; (tables[table] ||= { columns: [], primaryKey: [] });
    const type = String(row.COLUMN_TYPE).toLowerCase();
    if (!ALLOWED_TYPES.test(type)) throw new Error(`unsupported current-schema type ${table}.${row.COLUMN_NAME}: ${type}`);
    tables[table].columns.push({ name: row.COLUMN_NAME, type, nullable: row.IS_NULLABLE === "YES" });
    if (row.PK_ORDINAL != null) tables[table].primaryKey[Number(row.PK_ORDINAL) - 1] = row.COLUMN_NAME;
  }
  return tables;
}
function validateSchema(rows) {
  const actual = normalizeMetadata(rows);
  if (JSON.stringify(actual) !== JSON.stringify(contract)) throw new Error("Modern Field Test current-schema contract drift detected");
  return actual;
}
function quote(name) { if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error("unsafe schema identifier"); return `\`${name}\``; }
function rowQuery(table, spec) {
  const cells = spec.columns.map((c, i) => `IF(${quote(c.name)} IS NULL,'N',CONCAT('H',HEX(CAST(${quote(c.name)} AS BINARY)))) AS c${i}`);
  return `SELECT ${cells.join(",")} FROM ${quote(table)} ORDER BY ${spec.primaryKey.map(quote).join(",")}`;
}
async function snapshot(connection) {
  await connection.query("SET time_zone = '+00:00'");
  const [metadata] = await connection.query(`SELECT c.TABLE_NAME,c.COLUMN_NAME,c.COLUMN_TYPE,c.IS_NULLABLE,k.ORDINAL_POSITION AS PK_ORDINAL FROM INFORMATION_SCHEMA.COLUMNS c LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE k ON k.TABLE_SCHEMA=c.TABLE_SCHEMA AND k.TABLE_NAME=c.TABLE_NAME AND k.COLUMN_NAME=c.COLUMN_NAME AND k.CONSTRAINT_NAME='PRIMARY' WHERE c.TABLE_SCHEMA=DATABASE() AND c.TABLE_NAME IN (SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE') ORDER BY c.TABLE_NAME,c.ORDINAL_POSITION`);
  const schema = validateSchema(metadata); const tables = {};
  for (const [name, spec] of Object.entries(schema)) {
    const [rows] = await connection.query(rowQuery(name, spec));
    const canonical = rows.map((row) => spec.columns.map((_, i) => row[`c${i}`]));
    tables[name] = { rowCount: String(rows.length), digest: digest(JSON.stringify(canonical)) };
  }
  const schemaDigest = digest(JSON.stringify(schema));
  return { format: "modern-field-test-db-snapshot-v1", schema, schemaDigest, tables, aggregateDigest: digest(JSON.stringify({ schemaDigest, tables })) };
}
function compareExact(expected, actual) {
  const equal = JSON.stringify(expected) === JSON.stringify(actual);
  return { classification: equal ? "exact recovery point" : "corruption", equal };
}
module.exports = { ALLOWED_TYPES, contract, normalizeMetadata, validateSchema, rowQuery, snapshot, compareExact };
