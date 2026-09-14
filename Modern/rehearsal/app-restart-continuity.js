#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateDataSafety } = require("../deploy/field-test/data-safety");
const { readRuntimeBuildId, BUILD_ID_FILE } = require("./build-identity");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUTPUT = process.env.REHEARSAL_EVIDENCE_DIR || path.join(__dirname, "evidence");
const STATE = path.join(OUTPUT, ".app-restart-continuity-state.json");
const EVIDENCE = path.join(OUTPUT, "app-restart-continuity-latest.json");

async function call(method, route, { body, cookie, allowFailure = false } = {}) {
  const response = await fetch(`${BASE_URL}${route}`, {
    method,
    headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(cookie ? { Cookie: cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok && !allowFailure) throw new Error(`${method} ${route} returned ${response.status}`);
  return { status: response.status, json, cookie: response.headers.get("set-cookie")?.split(";")[0] };
}

async function establish(actorId, actorType) {
  const result = await call("POST", "/api/session/foundation-establish", { body: { actorId, actorType } });
  assert.ok(result.cookie);
  return result.cookie;
}

async function waitForApp() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await fetch(`${BASE_URL}/api/session/me`);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  throw new Error("app did not become reachable after start");
}

async function snapshot(master, competitionId) {
  const matches = await call("GET", `/api/master-operations/${competitionId}/matches`, { cookie: master });
  const live = await call("GET", `/api/master-workflow/${competitionId}/live-status`, { cookie: master });
  return { matches: matches.json.matches, liveStatus: live.json };
}

async function before() {
  validateDataSafety(process.env);
  fs.mkdirSync(OUTPUT, { recursive: true });
  assert.ok(!fs.existsSync(STATE), "stale restart handoff exists; inspect and remove it before retrying");
  const master = await establish("synthetic-master-restart", "master");
  const referee = await establish("synthetic-referee-01", "referee");
  const competition = await call("GET", "/api/competition?tournamentId=1", { cookie: master });
  const competitionId = competition.json.competition?.id;
  assert.ok(competitionId, "run the deterministic rehearsal before restart continuity");
  const state = {
    schemaVersion: 1, startedAt: new Date().toISOString(), buildIdentity: readRuntimeBuildId(),
    competitionId, master, referee, operationalSnapshot: await snapshot(master, competitionId)
  };
  fs.writeFileSync(STATE, `${JSON.stringify(state)}\n`, { mode: 0o600, flag: "wx" });
}

async function after() {
  const state = JSON.parse(fs.readFileSync(STATE, "utf8"));
  const evidence = {
    schemaVersion: 1,
    environment: { id: process.env.TOP_ENVIRONMENT_ID, database: process.env.MYSQL_DB },
    build: { identity: state.buildIdentity, source: BUILD_ID_FILE, unchangedAfterRestart: false },
    startedAt: state.startedAt, endedAt: null,
    operationalStateContinuity: { passed: false }, sessionContinuity: { passed: false },
    operationalRecoveryAfterSessionsReEstablished: { passed: false }, summary: { passed: false }
  };
  try {
    validateDataSafety(process.env);
    await waitForApp();
    evidence.build.unchangedAfterRestart = readRuntimeBuildId() === state.buildIdentity;
    assert.ok(evidence.build.unchangedAfterRestart, "runtime build identity changed across restart");
    const oldMaster = await call("GET", "/api/session/me", { cookie: state.master, allowFailure: true });
    const oldReferee = await call("GET", "/api/session/me", { cookie: state.referee, allowFailure: true });
    assert.deepEqual([oldMaster.status, oldReferee.status], [401, 401]);
    evidence.sessionContinuity = { passed: true, expected: "process-local sessions are lost", oldMasterStatus: 401, oldRefereeStatus: 401 };
    const master = await establish("synthetic-master-restart", "master");
    const referee = await establish("synthetic-referee-01", "referee");
    const afterSnapshot = await snapshot(master, state.competitionId);
    assert.deepEqual(afterSnapshot, state.operationalSnapshot);
    evidence.operationalStateContinuity = { passed: true, exactSnapshotMatch: true, matchCount: afterSnapshot.matches.length };
    const masterMe = await call("GET", "/api/session/me", { cookie: master });
    const refereeMe = await call("GET", "/api/session/me", { cookie: referee });
    await call("GET", `/api/referee-workflow/${state.competitionId}/referees/synthetic-referee-01/draft-assignments`, { cookie: referee });
    assert.equal(masterMe.json.actorType, "master");
    assert.equal(refereeMe.json.actorType, "referee");
    evidence.operationalRecoveryAfterSessionsReEstablished = { passed: true, masterWorkflowReadable: true, refereeWorkflowReadable: true };
    evidence.summary = { passed: true };
  } catch (error) {
    evidence.summary = { passed: false, error: String(error.message).slice(0, 500) };
    process.exitCode = 1;
  } finally {
    evidence.endedAt = new Date().toISOString();
    fs.writeFileSync(EVIDENCE, `${JSON.stringify(evidence, null, 2)}\n`, { mode: 0o600 });
    fs.rmSync(STATE, { force: true });
  }
}

const phase = process.argv[2];
(phase === "before" ? before() : phase === "after" ? after() : Promise.reject(new Error("usage: app-restart-continuity.js before|after")))
  .catch((error) => { console.error(error.message); process.exitCode = 1; });
