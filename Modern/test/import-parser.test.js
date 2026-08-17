const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const ImportParser = require("../operator/import-parser");
const { validateImportData } = require("../services/schedule-import.service");

const HEADER = "round,court,time,p1,p2,p3,p4,team1,team2";

function fixedPairCsv() {
  return [
    HEADER,
    "1,1号场,2026-09-12 08:00,张伟,李强,王芳,刘敏,张伟 & 李强,王芳 & 刘敏",
    "1,2号场,2026-09-12 08:00,陈杰,杨丽,赵磊,黄静,陈杰 & 杨丽,赵磊 & 黄静",
    "2,1号场,2026-09-12 08:30,张伟,李强,陈杰,杨丽,张伟 & 李强,陈杰 & 杨丽"
  ].join("\r\n");
}

// ─── Normalization ───────────────────────────────────────────────────────────

test("fixed-pair CSV normalizes to the server import payload", () => {
  const { data, errors } = ImportParser.normalizeCsvToImport(fixedPairCsv());
  assert.equal(errors.length, 0);
  assert.equal(data.mode, "fixed-pair");
  assert.deepEqual(data.players.map((p) => p.name), ["张伟", "李强", "王芳", "刘敏", "陈杰", "杨丽", "赵磊", "黄静"]);
  assert.equal(data.pairs.length, 4);
  assert.equal(data.rounds.length, 2);
  assert.equal(data.rounds[0].matches.length, 2);
  assert.equal(data.rounds[1].matches[0].court, "1号场");
  const expectedAt = new Date(2026, 8, 12, 8, 0, 0).toISOString().replace(/\.\d{3}Z$/, "Z");
  assert.equal(data.rounds[0].matches[0].scheduledAt, expectedAt);
});

test("normalized payload passes server-side validateImportData with zero errors", () => {
  const { data, errors } = ImportParser.normalizeCsvToImport(fixedPairCsv());
  assert.equal(errors.length, 0);
  const server = validateImportData(ImportParser.stripClientMeta(data));
  assert.deepEqual(server.errors, []);
});

test("published 32-draw sample file passes both client and server validation", () => {
  const sample = fs.readFileSync(
    path.join(__dirname, "..", "operator", "templates", "top-import-sample-32.csv"), "utf8");
  const { data, errors } = ImportParser.normalizeCsvToImport(sample);
  assert.equal(errors.length, 0);
  assert.equal(data.players.length, 64);
  assert.equal(data.pairs.length, 32);
  assert.equal(data.rounds[0].matches.length, 16);
  const server = validateImportData(ImportParser.stripClientMeta(data));
  assert.deepEqual(server.errors, []);
});

test("published template file parses cleanly", () => {
  const template = fs.readFileSync(
    path.join(__dirname, "..", "operator", "templates", "top-import-template.csv"), "utf8");
  const { data, errors } = ImportParser.normalizeCsvToImport(template);
  assert.equal(errors.length, 0);
  assert.equal(data.rounds[0].matches.length, 1);
});

test("rows without team columns normalize to rotate mode", () => {
  const csv = [
    HEADER,
    "1,1号场,2026-09-12 08:00,张伟,李强,王芳,刘敏,,",
    "1,2号场,2026-09-12 08:00,陈杰,杨丽,赵磊,黄静,,"
  ].join("\n");
  const { data, errors } = ImportParser.normalizeCsvToImport(csv);
  assert.equal(errors.length, 0);
  assert.equal(data.mode, "rotate");
  assert.equal(data.pairs, undefined);
});

test("BOM and CRLF from Excel export are handled", () => {
  const csv = "\uFEFF" + fixedPairCsv();
  const { data, errors } = ImportParser.normalizeCsvToImport(csv);
  assert.equal(errors.length, 0);
  assert.equal(data.mode, "fixed-pair");
});

test("quoted fields with embedded commas are parsed", () => {
  const records = ImportParser.parseCsvText('a,"b,c",d\r\n"x""y",2,3');
  assert.equal(records.length, 2);
  assert.deepEqual(records[0].cells, ["a", "b,c", "d"]);
  assert.deepEqual(records[1].cells, ['x"y', "2", "3"]);
});

test("empty rows are skipped with a warning", () => {
  const csv = fixedPairCsv() + "\r\n\r\n";
  const { data, errors, warnings } = ImportParser.normalizeCsvToImport(csv);
  assert.equal(errors.length, 0);
  assert.ok(warnings.some((w) => w.includes("空行")));
  assert.equal(data.rounds[1].matches.length, 1);
});

// ─── Row-numbered errors ─────────────────────────────────────────────────────

test("invalid round reports the physical CSV line number", () => {
  const csv = [
    HEADER,
    "1,1号场,2026-09-12 08:00,张伟,李强,王芳,刘敏,张伟 & 李强,王芳 & 刘敏",
    "x,2号场,2026-09-12 08:00,陈杰,杨丽,赵磊,黄静,陈杰 & 杨丽,赵磊 & 黄静"
  ].join("\n");
  const { data, errors } = ImportParser.normalizeCsvToImport(csv);
  assert.equal(data, null);
  assert.ok(errors.some((e) => e.line === 3 && e.message.includes("round")));
});

test("unparsable time reports the physical CSV line number", () => {
  const csv = [HEADER, "1,1号场,下周一,张伟,李强,王芳,刘敏,张伟 & 李强,王芳 & 刘敏"].join("\n");
  const { errors } = ImportParser.normalizeCsvToImport(csv);
  assert.ok(errors.some((e) => e.line === 2 && e.message.includes("time")));
});

test("missing player name reports the physical CSV line number", () => {
  const csv = [HEADER, "1,1号场,2026-09-12 08:00,张伟,,王芳,刘敏,张伟 & 李强,王芳 & 刘敏"].join("\n");
  const { errors } = ImportParser.normalizeCsvToImport(csv);
  assert.ok(errors.some((e) => e.line === 2 && e.message.includes("p2")));
});

test("header without optional team columns falls back to rotate mode", () => {
  const csv = ["round,court,time,p1,p2,p3,p4", "1,1号场,2026-09-12 08:00,张伟,李强,王芳,刘敏"].join("\n");
  const { data, errors } = ImportParser.normalizeCsvToImport(csv);
  assert.equal(errors.length, 0);
  assert.equal(data.mode, "rotate");
});

test("missing required header column is reported as structural error", () => {
  const csv = ["round,court,time,p1,p2,p3", "1,1号场,2026-09-12 08:00,张伟,李强,王芳"].join("\n");
  const { data, errors } = ImportParser.normalizeCsvToImport(csv);
  assert.equal(data, null);
  assert.ok(errors.some((e) => e.message.includes("模板")));
});

test("mixed fixed-pair and rotate rows are rejected", () => {
  const csv = [
    HEADER,
    "1,1号场,2026-09-12 08:00,张伟,李强,王芳,刘敏,张伟 & 李强,王芳 & 刘敏",
    "1,2号场,2026-09-12 08:00,陈杰,杨丽,赵磊,黄静,,"
  ].join("\n");
  const { errors } = ImportParser.normalizeCsvToImport(csv);
  assert.ok(errors.some((e) => e.message.includes("模式不一致")));
});

test("filling only team1 is rejected", () => {
  const csv = [HEADER, "1,1号场,2026-09-12 08:00,张伟,李强,王芳,刘敏,张伟 & 李强,"].join("\n");
  const { errors } = ImportParser.normalizeCsvToImport(csv);
  assert.ok(errors.some((e) => e.line === 2 && e.message.includes("同时")));
});

test("team member absent from p1~p4 pool is rejected with line number", () => {
  const csv = [HEADER, "1,1号场,2026-09-12 08:00,张伟,李强,王芳,刘敏,张伟 & 神秘人,王芳 & 刘敏"].join("\n");
  const { errors } = ImportParser.normalizeCsvToImport(csv);
  assert.ok(errors.some((e) => e.line === 2 && e.message.includes("神秘人")));
});

test("team with more than two members is rejected", () => {
  const csv = [HEADER, "1,1号场,2026-09-12 08:00,张伟,李强,王芳,刘敏,张伟 & 李强 & 王芳,王芳 & 刘敏"].join("\n");
  const { errors } = ImportParser.normalizeCsvToImport(csv);
  assert.ok(errors.some((e) => e.line === 2 && e.message.includes("team1")));
});

test("empty file and header-only file are rejected with guidance", () => {
  assert.ok(ImportParser.normalizeCsvToImport("").errors.length > 0);
  const headerOnly = ImportParser.normalizeCsvToImport(HEADER);
  assert.ok(headerOnly.errors.some((e) => e.message.includes("没有任何比赛行")));
});

// ─── Datetime parsing ────────────────────────────────────────────────────────

test("parseLocalDateTime accepts naive local, slash, and ISO forms", () => {
  const local = ImportParser.parseLocalDateTime("2026-09-12 08:00");
  assert.ok(local && local.endsWith("Z"));
  const expected = new Date(2026, 8, 12, 8, 0, 0).toISOString().replace(/\.\d{3}Z$/, "Z");
  assert.equal(local, expected);
  assert.equal(ImportParser.parseLocalDateTime("2026-09-12 08:00"), ImportParser.parseLocalDateTime("2026/09/12 08:00"));
  assert.equal(ImportParser.parseLocalDateTime("2026-09-12T08:00:00Z"), "2026-09-12T08:00:00Z");
  assert.equal(ImportParser.parseLocalDateTime("2026-13-40 08:00"), null);
  assert.equal(ImportParser.parseLocalDateTime(""), null);
});

test("parseLocalDateTime rejects out-of-range hour/minute/second without rollover (B1 regression)", () => {
  // These must NOT silently roll over via Date (e.g. 08:60 must not become 09:00)
  assert.equal(ImportParser.parseLocalDateTime("2026-09-12 08:60"), null);
  assert.equal(ImportParser.parseLocalDateTime("2026-09-12 08:99"), null);
  assert.equal(ImportParser.parseLocalDateTime("2026-09-12 24:00"), null);
  assert.equal(ImportParser.parseLocalDateTime("2026-09-12 08:00:60"), null);
  // Boundaries remain valid
  assert.ok(ImportParser.parseLocalDateTime("2026-09-12 23:59:59"));
  assert.ok(ImportParser.parseLocalDateTime("2026-09-12 00:00"));
});

test("invalid minute in CSV reports the physical line number (B1 regression)", () => {
  const csv = [
    HEADER,
    "1,1号场,2026-09-12 08:00,张伟,李强,王芳,刘敏,张伟 & 李强,王芳 & 刘敏",
    "1,2号场,2026-09-12 08:60,陈杰,杨丽,赵磊,黄静,陈杰 & 杨丽,赵磊 & 黄静"
  ].join("\n");
  const { data, errors } = ImportParser.normalizeCsvToImport(csv);
  assert.equal(data, null);
  assert.ok(errors.some((e) => e.line === 3 && e.message.includes("time")));
  // No match may carry a silently rolled-over scheduledAt
  const allMatches = (data?.rounds ?? []).flatMap((r) => r.matches);
  assert.ok(!allMatches.some((m) => m.scheduledAt && m.scheduledAt.includes("09:00")));
});

test("published sample file contains only legal clock times (B1 regression)", () => {
  const sample = fs.readFileSync(
    path.join(__dirname, "..", "operator", "templates", "top-import-sample-32.csv"), "utf8");
  assert.ok(!/\d{2}:(?:[6-9]\d|\d{3})/.test(sample), "sample must not contain minutes >= 60");
  const times = sample.split(/\r?\n/).slice(1).filter(Boolean).map((l) => l.split(",")[2]);
  assert.equal(times.length, 16);
  for (const t of times) {
    assert.ok(ImportParser.parseLocalDateTime(t) !== null, `sample time must be legal: ${t}`);
  }
});

// ─── Server error mapping and client meta stripping ─────────────────────────

test("stripClientMeta removes __line from the posted payload", () => {
  const { data } = ImportParser.normalizeCsvToImport(fixedPairCsv());
  const clean = ImportParser.stripClientMeta(data);
  for (const round of clean.rounds) for (const match of round.matches) {
    assert.equal(match.__line, undefined);
  }
});

test("mapServerErrorRows maps server match errors back to CSV lines", () => {
  const { data } = ImportParser.normalizeCsvToImport(fixedPairCsv());
  const mapped = ImportParser.mapServerErrorRows(data, [
    { row: "rounds[0].matches[1]", message: "Court-time conflict" },
    { row: "players[2]", message: "some player error" }
  ]);
  assert.equal(mapped[0].line, 3);
  assert.equal(mapped[1].line, undefined);
});
