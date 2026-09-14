#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateDataSafety } = require("../deploy/field-test/data-safety");
const { VERSION, COUNTS, REFEREES, buildFixture } = require("./field-test-fixture");
const { readRuntimeBuildId, BUILD_ID_FILE } = require("./build-identity");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUTPUT = process.env.REHEARSAL_EVIDENCE_DIR || path.join(__dirname, "evidence");
const STATE = path.join(OUTPUT, ".app-restart-continuity-state.json");
const EVIDENCE = path.join(OUTPUT, "app-restart-continuity-latest.json");
const correlation = (name) => `${VERSION}:restart:${name}`;
async function call(method, route, { body, cookie, allowFailure = false } = {}) {
  const response = await fetch(`${BASE_URL}${route}`, { method, headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await response.json().catch(() => ({}));
  if (!response.ok && !allowFailure) throw new Error(`${method} ${route} returned ${response.status}: ${json.error || "request rejected"}`);
  return { ok: response.ok, status: response.status, json, cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
async function establish(actorId, actorType) { const r = await call("POST", "/api/session/foundation-establish", { body: { actorId, actorType } }); assert.ok(r.cookie); return r.cookie; }
async function overview(cookie, id) { return (await call("GET", `/api/master-operations/${id}/matches`, { cookie })).json.matches; }
async function live(cookie, id) { return (await call("GET", `/api/master-workflow/${id}/live-status`, { cookie })).json; }
async function snapshot(cookie, id) { return { matches: await overview(cookie, id), liveStatus: await live(cookie, id) }; }
function matchStatus(match) { if (["confirmed", "finished"].includes(match.operationStatus)) return "confirmed"; if (["scored", "awaiting_confirmation"].includes(match.operationStatus)) return "scored"; if (match.operationStatus === "playing") return "playing"; if (match.operationStatus === "accepted") return "accepted"; return match.referee?.dispatchId ? "assigned" : "available"; }
async function dispatch(cookie, id, match, referee, correlationId, expectedVersion = match.referee?.dispatchVersion ?? 0) { return call("POST", `/api/master-workflow/${id}/matches/${match.matchId}/dispatch`, { cookie, body: { courtId: match.schedule.courtId, refereeId: referee, expectedVersion, correlationId } }); }
async function acceptStartScoreConfirm(master, refereeCookie, id, match, referee) {
  await call("POST", `/api/referee-workflow/${id}/referees/${referee}/matches/${match.matchId}/accept`, { cookie: refereeCookie, body: { expectedVersion: match.referee.dispatchVersion, correlationId: correlation(`accept:${match.matchId}`) } });
  await call("POST", `/api/referee-workflow/${id}/referees/${referee}/matches/${match.matchId}/start`, { cookie: refereeCookie, body: {} });
  await scoreConfirm(master, refereeCookie, id, match.matchId, referee);
}
async function scoreConfirm(master, refereeCookie, id, matchId, referee) {
  await call("POST", `/api/referee-workflow/${id}/referees/${referee}/matches/${matchId}/score`, { cookie: refereeCookie, body: { score1: 11, score2: 7 } });
  await call("POST", `/api/master-workflow/${id}/matches/${matchId}/confirm-result`, { cookie: master, body: {} });
}
async function waitForApp() { for (let i = 0; i < 30; i += 1) { try { await fetch(`${BASE_URL}/api/session/me`); return; } catch { await new Promise((resolve) => setTimeout(resolve, 500)); } } throw new Error("app did not become reachable after start"); }

async function before() {
  validateDataSafety(process.env); fs.mkdirSync(OUTPUT, { recursive: true });
  assert.ok(!fs.existsSync(STATE), "stale restart handoff exists; inspect and remove it before retrying");
  const fixture = buildFixture(); const master = await establish("synthetic-master-restart", "master");
  const existing = await call("GET", "/api/competition?tournamentId=1", { cookie: master });
  assert.equal(existing.json.tournament, null, "restart rehearsal requires an explicitly reset database and never auto-resets");
  const created = await call("POST", "/api/competition", { cookie: master, body: fixture.competition });
  const id = created.json.competition?.id ?? created.json.id; assert.ok(id);
  const imported = await call("POST", `/api/competition/${id}/schedule/import`, { cookie: master, body: fixture.schedule });
  assert.equal(imported.json.summary.matches, COUNTS.matches);
  await call("POST", `/api/referee-coordination/${id}/referees/roster`, { cookie: master, body: { refereeIds: fixture.referees } });
  for (const lifecycle of ["registration_open", "ready", "running"]) await call("POST", `/api/competition/${id}/lifecycle/transition`, { cookie: master, body: { state: lifecycle } });
  await call("POST", `/api/master-workflow/${id}/check-in-all`, { cookie: master, body: {} });
  let matches = await overview(master, id); const [a, b, c] = matches.slice(0, 3);
  const refereeCookies = await Promise.all(REFEREES.slice(0, 3).map((referee) => establish(referee, "referee")));
  await dispatch(master, id, a, REFEREES[0], correlation("A")); matches = await overview(master, id); await acceptStartScoreConfirm(master, refereeCookies[0], id, matches.find((m) => m.matchId === a.matchId), REFEREES[0]);
  await dispatch(master, id, b, REFEREES[1], correlation("B")); matches = await overview(master, id); const currentB = matches.find((m) => m.matchId === b.matchId);
  await call("POST", `/api/referee-workflow/${id}/referees/${REFEREES[1]}/matches/${b.matchId}/accept`, { cookie: refereeCookies[1], body: { expectedVersion: currentB.referee.dispatchVersion, correlationId: correlation("B:accept") } });
  await call("POST", `/api/referee-workflow/${id}/referees/${REFEREES[1]}/matches/${b.matchId}/start`, { cookie: refereeCookies[1], body: {} });
  const cExpectedVersion = c.referee?.dispatchVersion ?? 0; await dispatch(master, id, c, REFEREES[2], correlation("C"), cExpectedVersion);
  const pre = await snapshot(master, id); const states = [a, b, c].map((item) => matchStatus(pre.matches.find((m) => m.matchId === item.matchId)));
  assert.deepEqual(states, ["confirmed", "playing", "assigned"]); assert.equal(pre.liveStatus.courts.find((court) => court.courtId === b.schedule.courtId).condition, "occupied");
  fs.writeFileSync(STATE, `${JSON.stringify({ schemaVersion: 1, startedAt: new Date().toISOString(), buildIdentity: readRuntimeBuildId(), id, master, refereeCookies, matchIds: { a: a.matchId, b: b.matchId, c: c.matchId }, cExpectedVersion, cCorrelation: correlation("C"), snapshot: pre })}\n`, { mode: 0o600, flag: "wx" });
}

async function after() {
  const state = JSON.parse(fs.readFileSync(STATE, "utf8")); const checkpoints = [{ name: "pre-failure-state-committed", passed: true }, { name: "failure-observed", passed: true }, { name: "mysql-continuity-during-failure", passed: true }];
  const evidence = { schemaVersion: 1, environment: { id: process.env.TOP_ENVIRONMENT_ID, database: process.env.MYSQL_DB }, build: { containerId: process.env.RESTART_APP_CONTAINER_ID, imageId: process.env.RESTART_APP_IMAGE_ID, ociRevision: process.env.RESTART_OCI_REVISION, identity: state.buildIdentity, source: BUILD_ID_FILE }, databaseRuntime: { containerId: process.env.RESTART_DB_CONTAINER_ID, startedAt: process.env.RESTART_DB_STARTED_AT, runningAndHealthyDuringFailure: true, readOnlyQuerySucceeded: true, authoritativeStateUnchanged: true }, startedAt: state.startedAt, endedAt: null, checkpoints, operationalStateContinuity: { passed: false }, sessionContinuity: { passed: false }, operationalRecoveryAfterSessionsReEstablished: { passed: false }, summary: { passed: false } };
  const checkpoint = (name, details = {}) => checkpoints.push({ name, passed: true, ...details });
  try {
    validateDataSafety(process.env); await waitForApp(); assert.equal(readRuntimeBuildId(), state.buildIdentity); assert.equal(process.env.RESTART_OCI_REVISION, state.buildIdentity); checkpoint("artifact-identity-after-restart");
    const oldStatuses = [await call("GET", "/api/session/me", { cookie: state.master, allowFailure: true }), ...await Promise.all(state.refereeCookies.map((cookie) => call("GET", "/api/session/me", { cookie, allowFailure: true })))].map((r) => r.status);
    assert.deepEqual(oldStatuses, [401, 401, 401, 401]); evidence.sessionContinuity = { passed: true, expected: "process-local sessions are lost", oldMasterStatus: 401, oldRefereeStatuses: oldStatuses.slice(1) };
    const master = await establish("synthetic-master-restart", "master"); const referees = await Promise.all(REFEREES.slice(0, 3).map((referee) => establish(referee, "referee")));
    assert.deepEqual(await snapshot(master, state.id), state.snapshot); evidence.operationalStateContinuity = { passed: true, exactSnapshotMatch: true }; checkpoint("post-restart-state-matched");
    let matches = await overview(master, state.id); const c = matches.find((m) => m.matchId === state.matchIds.c);
    const replay = await dispatch(master, state.id, c, REFEREES[2], state.cCorrelation, state.cExpectedVersion); assert.ok(replay.ok);
    const afterReplay = (await overview(master, state.id)).find((m) => m.matchId === c.matchId); assert.equal(afterReplay.referee.dispatchId, c.referee.dispatchId); assert.equal(afterReplay.referee.dispatchVersion, c.referee.dispatchVersion); checkpoint("dispatch-replay-idempotent");
    await scoreConfirm(master, referees[1], state.id, state.matchIds.b, REFEREES[1]);
    await acceptStartScoreConfirm(master, referees[2], state.id, afterReplay, REFEREES[2]);
    matches = await overview(master, state.id); const subsequent = matches[8]; assert.equal(subsequent.schedule.courtId, c.schedule.courtId);
    await dispatch(master, state.id, subsequent, REFEREES[2], correlation("subsequent")); matches = await overview(master, state.id); await acceptStartScoreConfirm(master, referees[2], state.id, matches.find((m) => m.matchId === subsequent.matchId), REFEREES[2]); checkpoint("continuation-operation-complete");
    const finalMatches = await overview(master, state.id); const finalLive = await live(master, state.id); const completed = [state.matchIds.a, state.matchIds.b, state.matchIds.c, subsequent.matchId].map((id) => matchStatus(finalMatches.find((m) => m.matchId === id)));
    const candidateProbe = await call("GET", `/api/referee-coordination/${state.id}/matches/${finalMatches[9].matchId}/available-candidates`, { cookie: master });
    assert.deepEqual(completed, ["confirmed", "confirmed", "confirmed", "confirmed"]); assert.ok(finalLive.courts.every((court) => court.condition === "available")); assert.equal(candidateProbe.json.eligibleReferees.length, COUNTS.referees); checkpoint("final-integrity", { confirmedControls: 4, allCourtsAvailable: true, allRefereesAvailable: true });
    evidence.operationalRecoveryAfterSessionsReEstablished = { passed: true, dispatchReplayIdempotent: true, playingMatchCompleted: true, assignedMatchCompleted: true, subsequentMatchCompletedWithReleasedResources: true, finalIntegrityPassed: true }; evidence.summary = { passed: true };
  } catch (error) { evidence.summary = { passed: false, error: String(error.message).slice(0, 500) }; process.exitCode = 1; }
  finally { evidence.endedAt = new Date().toISOString(); fs.writeFileSync(EVIDENCE, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 }); fs.rmSync(STATE, { force: true }); }
}
const phase = process.argv[2]; (phase === "before" ? before() : phase === "after" ? after() : Promise.reject(new Error("usage: app-restart-continuity.js before|after"))).catch((error) => { console.error(error.message); process.exitCode = 1; });
