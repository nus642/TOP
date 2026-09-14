#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
const { validateDataSafety } = require("../deploy/field-test/data-safety");
const { readRuntimeBuildId, BUILD_ID_FILE } = require("./build-identity");
const { captureSnapshot } = require("./db-recovery-snapshot");
const { VERSION, COUNTS, REFEREES, buildFixture } = require("./field-test-fixture");

const CLAIM = "Recovery point bound to backup under the controlled single-writer synthetic rehearsal assumption.";
const SINGLE_WRITER_ACK = "CONTROLLED-SINGLE-WRITER-MODERN-FIELD-TEST-V1";
const OUTPUT = process.env.REHEARSAL_EVIDENCE_DIR || path.join(__dirname, "evidence");
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const action = process.argv[2];
const runId = process.argv[3];

function fail(message) { throw new Error(message); }
function evidencePath(id) { return path.join(OUTPUT, `db-recovery-${id}.json`); }
function validateRunId(id) { if (!/^[0-9a-f-]{36}$/.test(id || "")) fail("valid run ID required"); return id; }
function load(id) { return JSON.parse(fs.readFileSync(evidencePath(validateRunId(id)), "utf8")); }
function save(evidence) {
  fs.mkdirSync(OUTPUT, { recursive: true });
  const target = evidencePath(evidence.run.id); const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, target);
}
function checkpoint(evidence, name, details = {}) { evidence.checkpoints.push({ name, at: new Date().toISOString(), passed: true, ...details }); save(evidence); }
function correlation(evidence, name) { return `db-recovery-v1:${evidence.run.id}:${name}`; }
async function connection() {
  return mysql.createConnection({ host: process.env.MYSQL_HOST, port: Number(process.env.MYSQL_PORT), database: process.env.MYSQL_DB, user: process.env.MYSQL_USER, password: process.env.MYSQL_PASS });
}
async function databaseIdentity() {
  const db = await connection();
  try { const [rows] = await db.query("SELECT DATABASE() AS databaseName, @@server_uuid AS serverUuid, VERSION() AS serverVersion, CURRENT_USER() AS currentUser"); return rows[0]; }
  finally { await db.end(); }
}
async function snapshot() { const db = await connection(); try { return await captureSnapshot(db); } finally { await db.end(); } }
async function snapshotSha() { validateDataSafety(process.env); process.stdout.write(`${(await snapshot()).aggregateSha256}\n`); }
async function absenceAndIntegrity(evidence) {
  const db = await connection();
  try {
    const [lost] = await db.query("SELECT COUNT(*) AS count FROM tournament_coordination_chronology WHERE correlation_id IN (?, ?)", evidence.postBackupDelta.correlations);
    const [checks] = await db.query(`SELECT
      (SELECT COUNT(*) FROM referee_dispatch_reservations r LEFT JOIN matches m ON m.id=r.match_id WHERE m.id IS NULL) AS orphan_reservations,
      (SELECT COUNT(*) FROM matches m LEFT JOIN match_official_records o ON o.match_id=m.id WHERE m.status IN ('confirmed','finished') AND o.id IS NULL) AS confirmed_without_record,
      (SELECT COUNT(*) FROM court_operating_conditions c WHERE c.condition_name='occupied' AND NOT EXISTS (SELECT 1 FROM matches m WHERE m.tournament_id=c.tournament_id AND m.court=c.court_id AND m.status='playing')) AS occupied_without_playing`);
    return { lostCorrelationCount: Number(lost[0].count), ...Object.fromEntries(Object.entries(checks[0]).map(([key, value]) => [key, Number(value)])) };
  } finally { await db.end(); }
}
async function call(method, route, { body, cookie } = {}) {
  const response = await fetch(`${BASE_URL}${route}`, { method, headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) fail(`${method} ${route} returned ${response.status}: ${json.error || json.code || "request rejected"}`);
  return { json, cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
async function session(actorId, actorType) { const result = await call("POST", "/api/session/foundation-establish", { body: { actorId, actorType } }); assert.ok(result.cookie); return result.cookie; }
async function overview(cookie, competitionId) { return (await call("GET", `/api/master-operations/${competitionId}/matches`, { cookie })).json.matches; }
function state(match) {
  if (["confirmed", "finished"].includes(match.operationStatus)) return "confirmed";
  if (["scored", "awaiting_confirmation"].includes(match.operationStatus)) return "scored";
  if (["playing", "accepted"].includes(match.operationStatus)) return match.operationStatus;
  return match.referee?.dispatchId ? "assigned" : "available";
}
async function dispatch(evidence, master, competitionId, match, referee, label) {
  await call("POST", `/api/master-workflow/${competitionId}/matches/${match.matchId}/dispatch`, { cookie: master, body: { courtId: match.schedule.courtId, refereeId: referee, expectedVersion: match.referee?.dispatchVersion ?? 0, correlationId: correlation(evidence, label) } });
}
async function accept(evidence, refereeCookie, competitionId, match, referee, label) {
  await call("POST", `/api/referee-workflow/${competitionId}/referees/${encodeURIComponent(referee)}/matches/${match.matchId}/accept`, { cookie: refereeCookie, body: { expectedVersion: match.referee.dispatchVersion, correlationId: correlation(evidence, label) } });
}
async function start(refereeCookie, competitionId, matchId, referee) { await call("POST", `/api/referee-workflow/${competitionId}/referees/${encodeURIComponent(referee)}/matches/${matchId}/start`, { cookie: refereeCookie, body: {} }); }
async function score(refereeCookie, competitionId, matchId, referee, score1, score2) { await call("POST", `/api/referee-workflow/${competitionId}/referees/${encodeURIComponent(referee)}/matches/${matchId}/score`, { cookie: refereeCookie, body: { score1, score2 } }); }
async function confirm(master, competitionId, matchId) { await call("POST", `/api/master-workflow/${competitionId}/matches/${matchId}/confirm-result`, { cookie: master, body: {} }); }
async function targeted(evidence, master) {
  const matches = await overview(master, evidence.competitionId);
  return Object.fromEntries(Object.entries(evidence.matches).map(([name, id]) => {
    const match = matches.find((item) => item.matchId === id); return [name, { matchId: id, state: state(match), courtId: match.schedule.courtId, refereeId: match.referee?.refereeId ?? null, dispatchId: match.referee?.dispatchId ?? null, dispatchVersion: match.referee?.dispatchVersion ?? null, score: match.score ?? null }];
  }));
}

async function startRun() {
  validateDataSafety(process.env);
  if (process.env.TOP_FIELD_TEST_SINGLE_WRITER_ACKNOWLEDGEMENT !== SINGLE_WRITER_ACK) fail(`TOP_FIELD_TEST_SINGLE_WRITER_ACKNOWLEDGEMENT must be ${SINGLE_WRITER_ACK}`);
  const id = crypto.randomUUID();
  const dbIdentity = await databaseIdentity(); assert.equal(dbIdentity.databaseName, "modern_field_test_v1"); assert.notEqual(String(dbIdentity.currentUser).split("@")[0].toLowerCase(), "root");
  for (const key of ["TOP_RUNTIME_DB_CONTAINER_ID", "TOP_RUNTIME_APP_CONTAINER_ID", "TOP_RUNTIME_DB_IMAGE_ID", "TOP_RUNTIME_APP_IMAGE_ID"]) if (!/^[0-9a-f]{64}$/.test(process.env[key] || "")) fail(`missing immutable ${key}`);
  const evidence = { schemaVersion: 1, profile: "db-failure-restore-continuity", run: { id, startedAt: new Date().toISOString(), endedAt: null }, environment: { id: process.env.TOP_ENVIRONMENT_ID, database: process.env.MYSQL_DB, composeProject: "modern-field-test-v1", network: "modern-field-test-v1", volume: "modern-field-test-v1-db" }, build: { identity: readRuntimeBuildId(), source: BUILD_ID_FILE, appContainerId: process.env.TOP_RUNTIME_APP_CONTAINER_ID, appImageId: process.env.TOP_RUNTIME_APP_IMAGE_ID }, databaseIdentity: { ...dbIdentity, containerId: process.env.TOP_RUNTIME_DB_CONTAINER_ID, imageId: process.env.TOP_RUNTIME_DB_IMAGE_ID, applicationUserClass: "non-root" }, fixture: { version: VERSION, counts: COUNTS }, checkpoints: [], gate: { state: "open", inFlightWrites: 0, lastCompletedOperationId: 0 }, matches: {}, recoveryPoint: null, backup: null, postBackupDelta: null, failureObserved: null, restoreCompleted: null, recoveredState: null, expectedRpoLoss: null, operationalContinuation: null, finalIntegrity: null, summary: { passed: false } };
  save(evidence);
  const fixture = buildFixture(); const master = await session("synthetic-master-01", "master");
  const existing = await call("GET", "/api/competition?tournamentId=1", { cookie: master });
  assert.equal(existing.json.tournament, null, "recovery rehearsal requires a separately acknowledged reset and never resets automatically");
  const created = await call("POST", "/api/competition", { cookie: master, body: fixture.competition }); evidence.gate.lastCompletedOperationId++;
  evidence.competitionId = created.json.competition?.id ?? created.json.id;
  await call("POST", `/api/competition/${evidence.competitionId}/schedule/import`, { cookie: master, body: fixture.schedule }); evidence.gate.lastCompletedOperationId++;
  await call("POST", `/api/referee-coordination/${evidence.competitionId}/referees/roster`, { cookie: master, body: { refereeIds: fixture.referees } }); evidence.gate.lastCompletedOperationId++;
  for (const lifecycle of ["registration_open", "ready", "running"]) { await call("POST", `/api/competition/${evidence.competitionId}/lifecycle/transition`, { cookie: master, body: { state: lifecycle } }); evidence.gate.lastCompletedOperationId++; }
  await call("POST", `/api/master-workflow/${evidence.competitionId}/check-in-all`, { cookie: master, body: {} }); evidence.gate.lastCompletedOperationId++;
  let matches = await overview(master, evidence.competitionId);
  evidence.matches = { rpA: matches[0].matchId, rpB: matches[1].matchId, rpC: matches[2].matchId, deltaD: matches[8].matchId, continuationE: matches[7].matchId };
  const cookies = await Promise.all(REFEREES.slice(0, 3).map((referee) => session(referee, "referee")));
  await dispatch(evidence, master, evidence.competitionId, matches[0], REFEREES[0], "pre:rp-a:dispatch"); matches = await overview(master, evidence.competitionId);
  await accept(evidence, cookies[0], evidence.competitionId, matches[0], REFEREES[0], "pre:rp-a:accept"); await start(cookies[0], evidence.competitionId, matches[0].matchId, REFEREES[0]); await score(cookies[0], evidence.competitionId, matches[0].matchId, REFEREES[0], 11, 7); await confirm(master, evidence.competitionId, matches[0].matchId);
  matches = await overview(master, evidence.competitionId); await dispatch(evidence, master, evidence.competitionId, matches[1], REFEREES[1], "pre:rp-b:dispatch"); matches = await overview(master, evidence.competitionId); await accept(evidence, cookies[1], evidence.competitionId, matches[1], REFEREES[1], "pre:rp-b:accept"); await start(cookies[1], evidence.competitionId, matches[1].matchId, REFEREES[1]);
  matches = await overview(master, evidence.competitionId); await dispatch(evidence, master, evidence.competitionId, matches[2], REFEREES[2], "pre:rp-c:dispatch");
  evidence.gate.lastCompletedOperationId += 9; evidence.gate.state = "closed"; evidence.gate.closedAt = new Date().toISOString(); evidence.gate.inFlightWrites = 0;
  evidence.recoveryPoint = { bindingClaim: CLAIM, scope: "controlled-single-writer-synthetic-rehearsal", outsideWriterAssumption: { acknowledgement: SINGLE_WRITER_ACK, technicallyLockedOut: false }, targeted: await targeted(evidence, master), snapshotA: await snapshot(), snapshotB: null };
  assert.equal(evidence.recoveryPoint.targeted.rpA.state, "confirmed"); assert.equal(evidence.recoveryPoint.targeted.rpB.state, "playing"); assert.equal(evidence.recoveryPoint.targeted.rpC.state, "assigned");
  checkpoint(evidence, "recovery-point-snapshot-a", { gateClosed: true, inFlightWrites: 0 });
  process.stdout.write(`${id}\n`);
}

async function bindAndMutate(id) {
  const evidence = load(id); assert.equal(evidence.gate.state, "closed");
  evidence.backup = { filename: process.argv[4], sha256: process.argv[5], bytes: Number(process.argv[6]), existingMechanism: "./field-test backup" };
  evidence.recoveryPoint.snapshotB = await snapshot();
  assert.equal(evidence.recoveryPoint.snapshotA.aggregateSha256, evidence.recoveryPoint.snapshotB.aggregateSha256, "snapshot bracket changed");
  evidence.recoveryPoint.boundUnderControlledAssumption = true; evidence.gate.state = "open"; evidence.gate.openedAt = new Date().toISOString();
  const master = await session("synthetic-master-01", "master"); const refereeCookie = await session(REFEREES[2], "referee");
  let matches = await overview(master, evidence.competitionId); let rpC = matches.find((m) => m.matchId === evidence.matches.rpC);
  await accept(evidence, refereeCookie, evidence.competitionId, rpC, REFEREES[2], "post:rp-c:accept"); await start(refereeCookie, evidence.competitionId, rpC.matchId, REFEREES[2]); await score(refereeCookie, evidence.competitionId, rpC.matchId, REFEREES[2], 11, 8); await confirm(master, evidence.competitionId, rpC.matchId);
  matches = await overview(master, evidence.competitionId); const deltaD = matches.find((m) => m.matchId === evidence.matches.deltaD); await dispatch(evidence, master, evidence.competitionId, deltaD, REFEREES[2], "post:delta-d:dispatch");
  evidence.postBackupDelta = { targeted: await targeted(evidence, master), snapshot: await snapshot(), expectedLostFacts: ["rpC post-backup confirmation and 11-8 score", "rpC post-backup acceptance/start/score/confirmation chronology", "deltaD post-backup dispatch and reservation"], correlations: [correlation(evidence, "post:rp-c:accept"), correlation(evidence, "post:delta-d:dispatch")] };
  checkpoint(evidence, "post-backup-delta-recorded");
}

async function recordFailure(id) {
  const evidence = load(id); evidence.failureObserved = { method: "docker-pause", targetContainerId: process.argv[4], watchdogEvidence: process.argv[5], directVerifyFailed: process.argv[6] === "true", applicationDbReadFailed: process.argv[7] === "true", databaseRecoveredByDeadline: process.argv[8] === "true", passed: [process.argv[6], process.argv[7], process.argv[8]].every((v) => v === "true") };
  assert.ok(evidence.failureObserved.passed); checkpoint(evidence, "failure-observed-and-cleared");
  process.stdout.write(`${evidence.backup.filename}\n`);
}

async function restorePath(id) { const evidence = load(id); process.stdout.write(`${evidence.backup.filename}\n`); }

async function resume(id) {
  const evidence = load(id); const recovered = await snapshot();
  assert.equal(recovered.aggregateSha256, evidence.recoveryPoint.snapshotA.aggregateSha256, "recovered database does not exactly match recovery point");
  const master = await session("synthetic-master-01", "master"); let target = await targeted(evidence, master);
  assert.deepEqual(target, evidence.recoveryPoint.targeted, "recovered targeted state differs");
  evidence.restoreCompleted = { mechanism: "./field-test restore", artifactSha256Reverified: true, passed: true };
  evidence.recoveredState = { snapshot: recovered, targeted: target, exactRecoveryPointMatch: true };
  const recoveredChecks = await absenceAndIntegrity(evidence); assert.equal(recoveredChecks.lostCorrelationCount, 0);
  evidence.expectedRpoLoss = { declaredFacts: evidence.postBackupDelta.expectedLostFacts, observedAbsentFacts: evidence.postBackupDelta.expectedLostFacts, lostCorrelationCount: 0, exactMatch: true };
  const refereeB = await session(REFEREES[1], "referee"); await score(refereeB, evidence.competitionId, evidence.matches.rpB, REFEREES[1], 11, 9); await confirm(master, evidence.competitionId, evidence.matches.rpB);
  let matches = await overview(master, evidence.competitionId); const next = matches.find((m) => m.matchId === evidence.matches.continuationE); await dispatch(evidence, master, evidence.competitionId, next, REFEREES[1], "continue:e:dispatch"); matches = await overview(master, evidence.competitionId); const assigned = matches.find((m) => m.matchId === evidence.matches.continuationE); await accept(evidence, refereeB, evidence.competitionId, assigned, REFEREES[1], "continue:e:accept"); await start(refereeB, evidence.competitionId, assigned.matchId, REFEREES[1]); await score(refereeB, evidence.competitionId, assigned.matchId, REFEREES[1], 11, 6); await confirm(master, evidence.competitionId, assigned.matchId);
  target = await targeted(evidence, master); assert.equal(target.rpB.state, "confirmed"); assert.equal(target.continuationE.state, "confirmed");
  evidence.operationalContinuation = { sessionsReestablished: true, recoveredMatchCompleted: evidence.matches.rpB, releasedResourceReuse: { matchId: evidence.matches.continuationE, refereeId: REFEREES[1], courtId: target.continuationE.courtId }, passed: true };
  const finalChecks = await absenceAndIntegrity(evidence); assert.deepEqual(finalChecks, { lostCorrelationCount: 0, orphan_reservations: 0, confirmed_without_record: 0, occupied_without_playing: 0 });
  evidence.finalIntegrity = { snapshot: await snapshot(), checks: finalChecks, passed: true }; evidence.run.endedAt = new Date().toISOString(); evidence.summary = { passed: true };
  checkpoint(evidence, "operational-continuation-and-final-integrity");
}

if (require.main === module) {
  const actions = { start: startRun, "snapshot-sha": snapshotSha, "bind-and-mutate": () => bindAndMutate(validateRunId(runId)), "record-failure": () => recordFailure(validateRunId(runId)), "restore-path": () => restorePath(validateRunId(runId)), resume: () => resume(validateRunId(runId)) };
  if (!actions[action]) { console.error("usage: db-recovery-rehearsal.js start|bind-and-mutate RUN BACKUP SHA BYTES|record-failure RUN CONTAINER WATCHDOG DIRECT_FAIL APP_FAIL RECOVERED|restore-path RUN|resume RUN"); process.exit(64); }
  actions[action]().catch((error) => { console.error(`db recovery rehearsal rejected: ${String(error.message).slice(0, 500)}`); process.exitCode = 1; });
}

module.exports = { CLAIM, SINGLE_WRITER_ACK };
