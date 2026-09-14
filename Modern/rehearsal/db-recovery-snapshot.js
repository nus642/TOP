"use strict";

const crypto = require("node:crypto");

// This is deliberately a closed description of Modern/db.sql, not a generic
// MySQL serializer. Any schema change must be reviewed and added explicitly.
const SCHEMA = Object.freeze({
  tournaments: { pk: ["id"], columns: [["id","int"],["name","varchar(100)"],["sport","varchar(50)"],["status","varchar(30)"],["created_at","timestamp"],["updated_at","timestamp"]] },
  players: { pk: ["id"], columns: [["id","int"],["tournament_id","int"],["name","varchar(50)"],["level","int"],["wins","int"],["losses","int"],["net","int"],["curP","int"],["lastR","int"],["paired","tinyint(1)"]] },
  teams: { pk: ["id"], columns: [["id","int"],["tournament_id","int"],["name","varchar(100)"],["status","varchar(30)"],["created_at","timestamp"],["updated_at","timestamp"]] },
  team_members: { pk: ["id"], columns: [["id","int"],["team_id","int"],["player_id","int"],["role","varchar(30)"],["created_at","timestamp"]] },
  team_rooms: { pk: ["id"], columns: [["id","int"],["tournament_id","int"],["code","varchar(50)"],["name","varchar(100)"],["status","varchar(30)"],["created_at","timestamp"],["updated_at","timestamp"]] },
  matches: { pk: ["id"], columns: [["id","int"],["tournament_id","int"],["round_num","int"],["court","varchar(20)"],["player1_id","int"],["player2_id","int"],["player3_id","int"],["player4_id","int"],["team1_name","varchar(100)"],["team2_name","varchar(100)"],["score1","int"],["score2","int"],["game_format","tinyint unsigned"],["score_rule","varchar(10)"],["target_score","smallint unsigned"],["cap_score","smallint unsigned"],["referee_id","varchar(100)"],["assigned_at","timestamp"],["dispatch_id","varchar(100)"],["dispatch_version","bigint"],["responsibility_accepted_at","timestamp"],["started_at","timestamp"],["result_confirmed_at","timestamp"],["result_confirmed_by","varchar(100)"],["status","enum('idle','upcoming','assigned','accepted','playing','interrupted','scored','awaiting_confirmation','confirmed','finished')"]] },
  court_operating_conditions: { pk: ["tournament_id","court_id"], columns: [["tournament_id","int"],["court_id","varchar(100)"],["condition_name","enum('available','occupied','constrained','uncertain')"],["source_type","enum('initial_baseline','match_execution','master_report','migration_match_execution')"],["source_reference","varchar(100)"],["actor_id","varchar(100)"],["effective_at","timestamp(6)"],["version","bigint"],["last_chronology_id","bigint"]] },
  court_disruptions: { pk: ["id"], columns: [["id","bigint"],["tournament_id","int"],["court_id","varchar(100)"],["affected_match_id","int"],["opening_condition","enum('constrained','uncertain')"],["disposition","enum('attention_required','deferred','resolved')"],["opened_by","varchar(100)"],["opened_at","timestamp(6)"],["deferred_by","varchar(100)"],["deferred_at","timestamp(6)"],["recovered_by","varchar(100)"],["recovered_at","timestamp(6)"],["resolved_at","timestamp(6)"],["version","bigint"]] },
  competition_referees: { pk: ["id"], columns: [["id","bigint"],["competition_id","int"],["referee_id","varchar(100)"],["active","tinyint(1)"],["eligible","tinyint(1)"],["created_at","timestamp(6)"]] },
  referee_dispatch_reservations: { pk: ["id"], columns: [["id","bigint"],["dispatch_id","varchar(100)"],["match_id","int"],["court_id","varchar(100)"],["referee_id","varchar(100)"],["expected_version","bigint"],["correlation_id","varchar(100)"],["competition_id","int"],["accepted_at","timestamp(6)"],["rejected_at","timestamp(6)"],["rejected_reason","varchar(255)"],["created_at","timestamp(6)"]] },
  tournament_coordination_chronology: { pk: ["id"], columns: [["id","bigint"],["tournament_id","int"],["court_id","varchar(100)"],["match_id","int"],["event_type","varchar(80)"],["source_type","varchar(40)"],["actor_id","varchar(100)"],["effective_at","timestamp(6)"],["correlation_id","varchar(100)"],["court_version","bigint"],["disruption_version","bigint"],["details","json"]] },
  match_schedules: { pk: ["id"], columns: [["id","bigint"],["tournament_id","int"],["match_id","int"],["scheduled_at","datetime(6)"],["court_id","varchar(100)"],["created_at","timestamp(6)"]] },
  match_official_records: { pk: ["id"], columns: [["id","bigint"],["tournament_id","int"],["match_id","int"],["referee_id","varchar(100)"],["score1","int"],["score2","int"],["confirmed_by","varchar(100)"],["confirmed_at","timestamp(6)"],["confirmation_responsibility","varchar(100)"],["evidence_reference","varchar(500)"],["evidence_metadata","json"],["provenance","json"],["created_at","timestamp(6)"]] },
  competition_standings: { pk: ["competition_id","participant_id"], columns: [["competition_id","int"],["participant_id","int"],["played","int"],["wins","int"],["losses","int"],["score_for","int"],["score_against","int"],["score_difference","int"],["updated_at","timestamp(6)"]] },
  pairings: { pk: ["id"], columns: [["id","int"],["tournament_id","int"],["player1_id","int"],["player2_id","int"]] },
  player_partners: { pk: ["player_id","partner_id","tournament_id"], columns: [["player_id","int"],["partner_id","int"],["tournament_id","int"]] },
  player_opponents: { pk: ["player_id","opponent_id","tournament_id"], columns: [["player_id","int"],["opponent_id","int"],["tournament_id","int"]] },
  player_check_ins: { pk: ["id"], columns: [["id","int"],["tournament_id","int"],["player_id","int"],["checked_in","tinyint(1)"],["checked_in_at","timestamp"],["source","varchar(50)"],["updated_at","timestamp"]] },
  waivers: { pk: ["id"], columns: [["id","int"],["tournament_id","int"],["player_id","int"],["waiver_version","varchar(50)"],["accepted_by","varchar(100)"],["accepted_at","timestamp"]] }
});

const quote = (name) => `\`${name.replaceAll("`", "``")}\``;
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");

function validateMetadata(columnRows, keyRows) {
  const tables = [...new Set(columnRows.map((row) => row.table_name))].sort();
  assertEqual(tables, Object.keys(SCHEMA).sort(), "canonical base-table inventory");
  for (const [table, expected] of Object.entries(SCHEMA)) {
    const actualColumns = columnRows.filter((row) => row.table_name === table)
      .sort((a, b) => Number(a.ordinal_position) - Number(b.ordinal_position))
      .map((row) => [row.column_name, String(row.column_type).toLowerCase()]);
    assertEqual(actualColumns, expected.columns, `${table} columns/types`);
    const actualPk = keyRows.filter((row) => row.table_name === table)
      .sort((a, b) => Number(a.ordinal_position) - Number(b.ordinal_position))
      .map((row) => row.column_name);
    assertEqual(actualPk, expected.pk, `${table} primary key`);
  }
}

function assertEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`snapshot rejected schema drift in ${label}`);
  }
}

async function captureSnapshot(connection) {
  await connection.query("SET time_zone = '+00:00'");
  const [columnRows] = await connection.query("SELECT table_name, column_name, column_type, ordinal_position FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name IN (SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE() AND table_type='BASE TABLE') ORDER BY table_name, ordinal_position");
  const [keyRows] = await connection.query("SELECT table_name, column_name, ordinal_position FROM information_schema.key_column_usage WHERE table_schema=DATABASE() AND constraint_name='PRIMARY' ORDER BY table_name, ordinal_position");
  validateMetadata(columnRows, keyRows);
  const tableEvidence = {};
  for (const table of Object.keys(SCHEMA).sort()) {
    const spec = SCHEMA[table];
    const projection = spec.columns.map(([name]) => `CASE WHEN ${quote(name)} IS NULL THEN NULL ELSE HEX(CAST(${quote(name)} AS BINARY)) END AS ${quote(name)}`).join(", ");
    const order = spec.pk.map(quote).join(", ");
    const [rows] = await connection.query({ sql: `SELECT ${projection} FROM ${quote(table)} ORDER BY ${order}`, rowsAsArray: true });
    const metadata = { columns: spec.columns, primaryKey: spec.pk };
    const stream = `${JSON.stringify(metadata)}\n${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
    tableEvidence[table] = { rowCount: rows.length, sha256: sha(stream), metadata };
  }
  const aggregateSha256 = sha(Object.entries(tableEvidence).map(([name, value]) => `${name}\0${value.rowCount}\0${value.sha256}\n`).join(""));
  return { representation: "modern-db-v1-null-or-server-hex", tableCount: Object.keys(SCHEMA).length, tables: tableEvidence, aggregateSha256 };
}

module.exports = { SCHEMA, captureSnapshot, validateMetadata };
