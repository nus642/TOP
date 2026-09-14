"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { SCHEMA, captureSnapshot, validateMetadata } = require("../rehearsal/db-recovery-snapshot");

function metadata() {
  const columns = []; const keys = [];
  for (const [table, spec] of Object.entries(SCHEMA)) {
    spec.columns.forEach(([name, type], index) => columns.push({ table_name: table, column_name: name, column_type: type, ordinal_position: index + 1 }));
    spec.pk.forEach((name, index) => keys.push({ table_name: table, column_name: name, ordinal_position: index + 1 }));
  }
  return { columns, keys };
}

test("snapshot contract covers exactly the 19 canonical Modern base tables", () => {
  assert.equal(Object.keys(SCHEMA).length, 19);
  assert.doesNotThrow(() => validateMetadata(metadata().columns, metadata().keys));
  assert.ok(Object.values(SCHEMA).every((table) => table.pk.length > 0));
});

test("snapshot contract fails closed on schema drift and unsupported types", () => {
  const changed = metadata(); changed.columns.find((row) => row.table_name === "matches" && row.column_name === "score1").column_type = "decimal(10,2)";
  assert.throws(() => validateMetadata(changed.columns, changed.keys), /schema drift/);
  const missing = metadata(); missing.keys = missing.keys.filter((row) => row.table_name !== "player_opponents");
  assert.throws(() => validateMetadata(missing.columns, missing.keys), /schema drift/);
});

test("snapshot uses UTC, server hex cells, primary-key ordering, and stable hashes", async () => {
  const meta = metadata(); const queries = [];
  const connection = { query: async (input) => {
    const sql = typeof input === "string" ? input : input.sql; queries.push(sql);
    if (sql.startsWith("SET time_zone")) return [[], []];
    if (sql.includes("information_schema.columns")) return [meta.columns, []];
    if (sql.includes("information_schema.key_column_usage")) return [meta.keys, []];
    return [[["31", null]], []];
  } };
  const first = await captureSnapshot(connection); const second = await captureSnapshot(connection);
  assert.equal(first.aggregateSha256, second.aggregateSha256);
  assert.equal(first.tableCount, 19);
  assert.match(queries.join("\n"), /HEX\(CAST\(`/);
  assert.match(queries.join("\n"), /ORDER BY `player_id`, `partner_id`, `tournament_id`/);
  assert.equal(queries[0], "SET time_zone = '+00:00'");
});
