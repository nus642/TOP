#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateDataSafety } = require("../deploy/field-test/data-safety");
const { VERSION, COUNTS, COURTS, REFEREES, buildFixture } = require("./event-scale-fixture");
const { readRuntimeBuildId, BUILD_ID_FILE } = require("./build-identity");
const { assertNoConcurrentResources, buildUsageEvidence } = require("./event-scale-accounting");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUTPUT = process.env.REHEARSAL_EVIDENCE_DIR || path.join(__dirname, "evidence");
const evidence = {
  schemaVersion: 1,
  environment: { id: process.env.TOP_ENVIRONMENT_ID || null, database: process.env.MYSQL_DB || null },
  build: { identity: null, source: BUILD_ID_FILE }, profile: "event-scale",
  fixture: { version: VERSION, counts: COUNTS }, target: { ...COUNTS },
  actual: { exercisedMatches: 0, completedMatches: 0, confirmedMatches: 0 }, usage: null,
  integrity: { noConcurrentCourt: false, noConcurrentReferee: false, overviewConsistent: false, resourcesReleased: false },
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
async function courtState(cookie, competitionId, courtId) {
  const live = await call("GET", `/api/master-workflow/${competitionId}/live-status`, { cookie });
  return live.json.courts.find((court) => court.courtId === courtId);
}
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
  evidence.build.identity = readRuntimeBuildId();
  const safety = validateDataSafety(process.env); assert.equal(safety.database, "modern_field_test_v1"); checkpoint("safety-guards-accepted");
  const fixture = buildFixture(); const master = await establish("synthetic-master-01", "master");
  const existing = await call("GET", "/api/competition?tournamentId=1", { cookie: master });
  assert.equal(existing.json.tournament, null, "event-scale rehearsal requires an explicitly reset database; it never auto-resets");
  const created = await call("POST", "/api/competition", { cookie: master, body: fixture.competition });
  const competitionId = created.json.competition?.id ?? created.json.id; assert.ok(competitionId);
  const imported = await call("POST", `/api/competition/${competitionId}/schedule/import`, { cookie: master, body: fixture.schedule });
  assert.deepEqual({ players: imported.json.summary.players, pairs: imported.json.summary.pairs, matches: imported.json.summary.matches }, { players: COUNTS.players, pairs: COUNTS.pairs, matches: COUNTS.matches });
  await call("POST", `/api/referee-coordination/${competitionId}/referees/roster`, { cookie: master, body: { refereeIds: fixture.referees } });
  for (const state of ["registration_open", "ready", "running"]) await call("POST", `/api/competition/${competitionId}/lifecycle/transition`, { cookie: master, body: { state } });
  const checked = await call("POST", `/api/master-workflow/${competitionId}/check-in-all`, { cookie: master, body: {} }); assert.equal(checked.json.checkedInCount, COUNTS.players);
  let matches = await overview(master, competitionId); assert.equal(matches.length, COUNTS.matches); assert.equal(new Set(matches.map((m) => m.schedule.courtId)).size, COUNTS.courts); checkpoint("event-fixture-loaded", { competitionId });
  const refereeCookies = Object.fromEntries(await Promise.all(REFEREES.map(async (id) => [id, await establish(id, "referee")])));
  const assignments = [];
  let waveNumber = 0;

  async function exerciseWave(wave) {
    assertNoConcurrentResources(wave.map(({ match, referee }) => ({ courtId: match.schedule.courtId, refereeId: referee })));
    await Promise.all(wave.map(({ match, referee }, index) => dispatch(master, competitionId, match, referee, `wave${waveNumber}:${index}`)));
    const active = await overview(master, competitionId);
    const dispatched = active.filter((match) => status(match) === "dispatched");
    assertNoConcurrentResources(dispatched.map((match) => ({ courtId: match.schedule.courtId, refereeId: match.referee.refereeId })));
    await Promise.all(wave.map(({ match, referee }) => complete(master, refereeCookies[referee], competitionId, match.matchId, referee, `wave${waveNumber}`)));
    assignments.push(...wave.map(({ match, referee }) => ({ courtId: match.schedule.courtId, refereeId: referee })));
    const after = await overview(master, competitionId);
    assert.equal(after.filter((match) => ["dispatched", "accepted", "playing"].includes(status(match))).length, 0);
    assert.equal(after.filter((match) => status(match) === "confirmed").length, assignments.length);
    checkpoint(`operational-wave-${waveNumber}-complete`, { matches: wave.length, confirmedTotal: assignments.length });
    waveNumber += 1;
  }

  // The first eight referees are initially resident on C1-C8.
  await exerciseWave(matches.slice(0, 8).map((match, index) => ({ match, referee: REFEREES[index] })));

  // Retain the proven contention and stale-write probes before prolonged turnover.
  matches = await overview(master, competitionId); const contenders = [matches[8], matches[16]];
  assert.equal(contenders[0].schedule.courtId, COURTS[0]); assert.equal(contenders[1].schedule.courtId, COURTS[0]);
  const contention = await Promise.all(contenders.map((match, index) => dispatch(master, competitionId, match, REFEREES[index], `contention:${index}`, undefined, true)));
  assert.equal(contention.filter((result) => result.ok).length, 1); assert.equal(contention.filter((result) => !result.ok).length, 1);
  const winnerIndex = contention.findIndex((result) => result.ok); matches = await overview(master, competitionId);
  const winner = matches.find((match) => match.matchId === contenders[winnerIndex].matchId);
  const loser = matches.find((match) => match.matchId === contenders[1 - winnerIndex].matchId); assert.equal(status(loser), "available");
  evidence.probes.sameCourtContention = { passed: true, successes: 1, rejections: 1, loserUnchanged: true };
  await complete(master, refereeCookies[REFEREES[winnerIndex]], competitionId, winner.matchId, REFEREES[winnerIndex], "contention-winner");
  assignments.push({ courtId: winner.schedule.courtId, refereeId: REFEREES[winnerIndex] });

  matches = await overview(master, competitionId); const staleTarget = matches[9]; const staleReferee = REFEREES[2];
  const staleVersion = staleTarget.referee?.dispatchVersion ?? 0; const courtBeforeStale = await courtState(master, competitionId, COURTS[1]);
  const stale = await dispatch(master, competitionId, staleTarget, staleReferee, "stale-version", staleVersion + 1, true);
  assert.equal(stale.status, 409); assert.match(stale.json.error || "", /^STALE_DISPATCH_VERSION:/);
  const staleTargetAfter = (await overview(master, competitionId)).find((match) => match.matchId === staleTarget.matchId);
  assert.equal(status(staleTargetAfter), "available"); assert.equal(staleTargetAfter.referee?.dispatchId, null); assert.equal(staleTargetAfter.referee?.dispatchVersion ?? 0, staleVersion);
  assert.deepEqual(await courtState(master, competitionId, COURTS[1]), courtBeforeStale);
  await dispatch(master, competitionId, staleTargetAfter, staleReferee, "stale-control", staleVersion);
  const control = (await overview(master, competitionId)).find((match) => match.matchId === staleTarget.matchId);
  await call("POST", `/api/master-workflow/${competitionId}/matches/${control.matchId}/withdraw`, { cookie: master, body: { reason: "synthetic stale-probe cleanup", expectedVersion: control.referee.dispatchVersion, correlationId: correlation("stale-control:withdraw") } });
  evidence.probes.staleExpectedVersion = { passed: true, rejectionCode: "STALE_DISPATCH_VERSION", stateUnchanged: true, noAssignment: true, courtUnchanged: true, controlDispatchSucceeded: true };

  while (assignments.length < COUNTS.matches) {
    matches = await overview(master, competitionId);
    const available = matches.filter((match) => status(match) === "available");
    const byCourt = new Map(); for (const match of available) if (!byCourt.has(match.schedule.courtId)) byCourt.set(match.schedule.courtId, match);
    const waveMatches = COURTS.map((court) => byCourt.get(court)).filter(Boolean).slice(0, COUNTS.matches - assignments.length);
    assert.ok(waveMatches.length, "available matches must remain until the target is complete");
    // Offset each wave across ten ordinary roster members; refs 9/10 therefore rotate in after the resident opening wave.
    const wave = waveMatches.map((match, index) => ({ match, referee: REFEREES[(waveNumber * COUNTS.courts + index) % REFEREES.length] }));
    await exerciseWave(wave);
  }
  matches = await overview(master, competitionId);
  const confirmed = matches.filter((match) => status(match) === "confirmed").length;
  assert.equal(confirmed, COUNTS.matches);
  evidence.usage = buildUsageEvidence(assignments, COURTS, REFEREES);
  assert.ok(evidence.usage.allCourtsUsed && evidence.usage.allRefereesUsed && evidence.usage.courtsReused && evidence.usage.refereesReused);
  evidence.actual = { exercisedMatches: assignments.length, completedMatches: confirmed, confirmedMatches: confirmed };
  evidence.integrity = { noConcurrentCourt: true, noConcurrentReferee: true, overviewConsistent: true, resourcesReleased: true };
  evidence.summary = { passed: true, checkpointCount: evidence.checkpoints.length };
}
run().catch((error) => { evidence.summary = { passed: false, error: String(error.message).slice(0, 500) }; process.exitCode = 1; }).finally(writeEvidence);
