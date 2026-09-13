#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateDataSafety } = require("../deploy/field-test/data-safety");
const { VERSION, COUNTS, COURTS, REFEREES, buildFixture } = require("./field-test-fixture");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUTPUT = process.env.REHEARSAL_EVIDENCE_DIR || path.join(__dirname, "evidence");
const evidence = {
  schemaVersion: 1,
  environment: { id: process.env.TOP_ENVIRONMENT_ID || null, database: process.env.MYSQL_DB || null },
  build: { identity: process.env.BUILD_ID || "unknown" }, fixture: { version: VERSION, counts: COUNTS },
  startedAt: new Date().toISOString(), endedAt: null, checkpoints: [], firstWave: null, secondWave: null,
  probes: { sameCourtContention: null, staleExpectedVersion: null }, summary: { passed: false }
};

function checkpoint(name, details = {}) { evidence.checkpoints.push({ name, passed: true, ...details }); }
function correlation(name) { return `${VERSION}:${name}`; }
async function call(method, route, { body, cookie, allowFailure = false } = {}) {
  const response = await fetch(`${BASE_URL}${route}`, { method, headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await response.json().catch(() => ({}));
  if (!response.ok && !allowFailure) throw new Error(`${method} ${route} returned ${response.status}: ${json.error || json.code || "request rejected"}`);
  return { ok: response.ok, status: response.status, json, cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
async function establish(actorId, actorType) {
  const result = await call("POST", "/api/session/foundation-establish", { body: { actorId, actorType } });
  assert.ok(result.cookie, "session cookie expected"); return result.cookie;
}
async function overview(cookie, competitionId) { return (await call("GET", `/api/master-operations/${competitionId}/matches`, { cookie })).json.matches; }
function status(match) {
  if (["confirmed", "finished"].includes(match.operationStatus)) return "confirmed";
  if (["scored", "awaiting_confirmation"].includes(match.operationStatus)) return "scored";
  if (match.operationStatus === "playing") return "playing";
  if (match.operationStatus === "accepted") return "accepted";
  return match.referee?.dispatchId ? "dispatched" : "available";
}
function writeEvidence() {
  evidence.endedAt = new Date().toISOString(); fs.mkdirSync(OUTPUT, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT, "latest.json"), `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
}
async function dispatch(cookie, competitionId, match, referee, name, expectedVersion = match.referee?.dispatchVersion ?? 0, allowFailure = false) {
  return call("POST", `/api/master-workflow/${competitionId}/matches/${match.matchId}/dispatch`, { cookie, allowFailure, body: { courtId: match.schedule.courtId, refereeId: referee, expectedVersion, correlationId: correlation(name) } });
}
async function complete(cookie, refereeCookie, competitionId, matchId, referee, name) {
  let match = (await overview(cookie, competitionId)).find((item) => item.matchId === matchId);
  await call("POST", `/api/referee-workflow/${competitionId}/referees/${encodeURIComponent(referee)}/matches/${matchId}/accept`, { cookie: refereeCookie, body: { expectedVersion: match.referee.dispatchVersion, correlationId: correlation(`${name}:accept`) } });
  const started = await call("POST", `/api/referee-workflow/${competitionId}/referees/${encodeURIComponent(referee)}/matches/${matchId}/start`, { cookie: refereeCookie, body: {} });
  match = (await overview(cookie, competitionId)).find((item) => item.matchId === matchId); assert.equal(status(match), "playing"); assert.equal(started.json.courtCondition.condition, "occupied");
  const scored = await call("POST", `/api/referee-workflow/${competitionId}/referees/${encodeURIComponent(referee)}/matches/${matchId}/score`, { cookie: refereeCookie, body: { score1: 11, score2: 7 } });
  assert.equal(scored.json.courtCondition.condition, "available");
  await call("POST", `/api/master-workflow/${competitionId}/matches/${matchId}/confirm-result`, { cookie, body: {} });
  match = (await overview(cookie, competitionId)).find((item) => item.matchId === matchId); assert.equal(status(match), "confirmed");
  return match;
}

async function run() {
  const safety = validateDataSafety(process.env); assert.equal(safety.database, "modern_field_test_v1"); checkpoint("safety-guards-accepted");
  const fixture = buildFixture(); const master = await establish("synthetic-master-01", "master");
  const existing = await call("GET", "/api/competition?tournamentId=1", { cookie: master });
  assert.equal(existing.json.tournament, null, "rehearsal requires an explicitly reset database; it never auto-resets");
  const created = await call("POST", "/api/competition", { cookie: master, body: fixture.competition });
  const competitionId = created.json.competition?.id ?? created.json.id; assert.ok(competitionId);
  const imported = await call("POST", `/api/competition/${competitionId}/schedule/import`, { cookie: master, body: fixture.schedule });
  assert.deepEqual({ players: imported.json.summary.players, pairs: imported.json.summary.pairs, matches: imported.json.summary.matches }, { players: 50, pairs: 25, matches: 60 });
  await call("POST", `/api/referee-coordination/${competitionId}/referees/roster`, { cookie: master, body: { refereeIds: fixture.referees } });
  const roster = await call("GET", `/api/public/competitions/${competitionId}/referee-roster`); assert.equal(roster.json.referees.length, COUNTS.referees);
  for (const state of ["registration_open", "ready", "running"]) await call("POST", `/api/competition/${competitionId}/lifecycle/transition`, { cookie: master, body: { state } });
  const checked = await call("POST", `/api/master-workflow/${competitionId}/check-in-all`, { cookie: master, body: {} }); assert.equal(checked.json.checkedInCount, COUNTS.players);
  let matches = await overview(master, competitionId); assert.equal(matches.length, COUNTS.matches); assert.equal(new Set(matches.map((m) => m.schedule.courtId)).size, COUNTS.courts); checkpoint("fixture-loaded-and-verified", { competitionId });

  const refereeCookies = await Promise.all(REFEREES.map((referee) => establish(referee, "referee")));
  const first = matches.slice(0, 6); await Promise.all(first.map((match, index) => dispatch(master, competitionId, match, REFEREES[index], `wave1:${index}`)));
  await Promise.all(first.map((match, index) => complete(master, refereeCookies[index], competitionId, match.matchId, REFEREES[index], `wave1:${index}`)));
  evidence.firstWave = { passed: true, completedMatches: first.length, resourcesReleased: true }; checkpoint("first-wave-complete");

  matches = await overview(master, competitionId); const contenders = [matches[6], matches[12]]; assert.equal(contenders[0].schedule.courtId, COURTS[0]); assert.equal(contenders[1].schedule.courtId, COURTS[0]);
  const contention = await Promise.all(contenders.map((match, index) => dispatch(master, competitionId, match, REFEREES[index], `contention:${index}`, undefined, true)));
  assert.equal(contention.filter((result) => result.ok).length, 1, "exactly one same-court dispatch must succeed"); assert.equal(contention.filter((result) => !result.ok).length, 1);
  const winnerIndex = contention.findIndex((result) => result.ok); const loserIndex = 1 - winnerIndex;
  matches = await overview(master, competitionId); const winner = matches.find((m) => m.matchId === contenders[winnerIndex].matchId); const loser = matches.find((m) => m.matchId === contenders[loserIndex].matchId);
  assert.ok(winner.referee?.dispatchId); assert.equal(status(loser), "available"); evidence.probes.sameCourtContention = { passed: true, successes: 1, rejections: 1, loserUnchanged: true };
  const stale = await dispatch(master, competitionId, loser, REFEREES[loserIndex], "stale-version", (loser.referee?.dispatchVersion ?? 0) + 1, true); assert.equal(stale.ok, false);
  const loserAfter = (await overview(master, competitionId)).find((m) => m.matchId === loser.matchId); assert.equal(status(loserAfter), "available"); assert.equal(loserAfter.referee?.dispatchVersion ?? 0, loser.referee?.dispatchVersion ?? 0);
  evidence.probes.staleExpectedVersion = { passed: true, rejected: true, stateUnchanged: true };
  await complete(master, refereeCookies[winnerIndex], competitionId, winner.matchId, REFEREES[winnerIndex], "wave2");
  evidence.secondWave = { passed: true, completedMatches: 1, reusedCourt: COURTS[0], reusedReferee: REFEREES[winnerIndex], resourcesReleased: true }; checkpoint("second-turnover-wave-complete");
  evidence.summary = { passed: true, checkpointCount: evidence.checkpoints.length };
}

run().catch((error) => { evidence.summary = { passed: false, error: String(error.message).slice(0, 500) }; process.exitCode = 1; }).finally(writeEvidence);
