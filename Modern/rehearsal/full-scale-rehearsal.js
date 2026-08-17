/**
 * Full-scale rehearsal for the first event.
 *
 * Scale: 25 pairs (50 players), 60 matches, 6 courts, 6 referees.
 *
 * Verifies the complete match-day chain:
 *   create competition -> import arrangement -> roster -> lifecycle ->
 *   master bulk check-in -> 6 concurrent dispatches -> 6 concurrent
 *   accept/start -> score submission -> master confirmation ->
 *   withdraw + reassign of one waiting match.
 *
 * Usage (server must be running, e.g. `npm start`):
 *   node rehearsal/full-scale-rehearsal.js            # full rehearsal
 *   node rehearsal/full-scale-rehearsal.js --verify   # after pm2 restart,
 *                                                      # asserts DB state survived
 *   BASE_URL=http://<server-ip>:3000 node rehearsal/full-scale-rehearsal.js
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const STATE_FILE = path.join(__dirname, ".rehearsal-state.json");

const COURTS = ["C1", "C2", "C3", "C4", "C5", "C6"];
const REFEREES = ["裁判甲", "裁判乙", "裁判丙", "裁判丁", "裁判戊", "裁判己"];
const PAIR_COUNT = 25;
const MATCH_COUNT = 60;
const MASTER_ID = "rehearsal-master";

// ---------------------------------------------------------------- helpers

async function call(method, urlPath, { body, cookie } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (cookie) headers["Cookie"] = cookie;
  const response = await fetch(`${BASE_URL}${urlPath}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${method} ${urlPath} -> ${response.status}: ${json.error || JSON.stringify(json)}`);
  }
  return { json, cookie: response.headers.get("set-cookie")?.split(";")[0] };
}

function step(name) {
  console.log(`\n=== ${name} ===`);
}

// Mirrors UiText.deriveDispatchStatus on the master console.
function dispatchStatusOf(match) {
  const op = match.operationStatus;
  if (op === "confirmed" || op === "finished") return "confirmed";
  if (op === "scored" || op === "awaiting_confirmation") return "scored";
  if (op === "playing" || op === "interrupted") return "playing";
  if (op === "accepted") return "referee_accepted";
  if (match.referee?.dispatchId && !match.referee?.responsibilityAcceptedAt) return "waiting_acceptance";
  return "not_dispatched";
}

async function establish(actorId, actorType) {
  const { cookie } = await call("POST", "/api/session/foundation-establish", {
    body: { actorId, actorType }
  });
  assert.ok(cookie, "session cookie expected");
  return cookie;
}

// ---------------------------------------------------------------- fixtures

function playerNames() {
  return Array.from({ length: PAIR_COUNT * 2 }, (_, i) => `彩排选手${String(i + 1).padStart(2, "0")}`);
}

function buildImportPayload() {
  const names = playerNames();
  const players = names.map((name) => ({ name }));
  const pairs = [];
  for (let i = 0; i < PAIR_COUNT; i++) {
    pairs.push({ name: `${names[2 * i]} & ${names[2 * i + 1]}` });
  }
  // Round-robin rotation: round r pairs pair i against pair (i + r) mod 25.
  // 6 courts x 10 rounds = 60 matches.
  const rounds = [];
  let matchIndex = 0;
  for (let round = 1; round <= 10 && matchIndex < MATCH_COUNT; round++) {
    const matches = [];
    for (let court = 0; court < COURTS.length && matchIndex < MATCH_COUNT; court++, matchIndex++) {
      const home = court + (round - 1) * 6;
      const a = home % PAIR_COUNT;
      const b = (home + PAIR_COUNT - round) % PAIR_COUNT;
      const [p1, p2] = pairs[a].name.split(" & ");
      const [p3, p4] = pairs[b].name.split(" & ");
      const startMinutes = (round - 1) * 30;
      const scheduledAt = `2026-08-20T${String(8 + Math.floor(startMinutes / 60)).padStart(2, "0")}:${String(startMinutes % 60).padStart(2, "0")}:00+08:00`;
      matches.push({ court: COURTS[court], scheduledAt, p1, p2, p3, p4, team1: pairs[a].name, team2: pairs[b].name });
    }
    rounds.push({ round, matches });
  }
  return { mode: "fixed-pair", players, pairs, rounds };
}

async function overview(masterCookie, competitionId) {
  const { json } = await call("GET", `/api/master-operations/${competitionId}/matches`, { cookie: masterCookie });
  return json.matches;
}

// ---------------------------------------------------------------- phases

async function runFullRehearsal() {
  step("0. 主控身份建立");
  const masterCookie = await establish(MASTER_ID, "master");

  step("1. 创建赛事");
  const { json: created } = await call("POST", "/api/competition", {
    cookie: masterCookie,
    body: { name: `彩排赛事 ${new Date().toISOString()}`, sport: "pickleball" }
  });
  const competitionId = created.competition?.id ?? created.id;
  assert.ok(competitionId, "competition id expected");
  console.log(`competitionId = ${competitionId}`);

  step("2. 导入 60 场对阵（25 对 / 50 人 / 6 场地）");
  const payload = buildImportPayload();
  const { json: imported } = await call("POST", `/api/competition/${competitionId}/schedule/import`, {
    cookie: masterCookie,
    body: payload
  });
  assert.equal(imported.summary.players, 50);
  assert.equal(imported.summary.pairs, 25);
  assert.equal(imported.summary.matches, MATCH_COUNT);
  console.log(`导入成功：${JSON.stringify(imported.summary)}`);

  step("3. 登记 6 人裁判花名册");
  await call("POST", `/api/referee-coordination/${competitionId}/referees/roster`, {
    cookie: masterCookie,
    body: { refereeIds: REFEREES }
  });
  const { json: publicRoster } = await call("GET", `/api/public/competitions/${competitionId}/referee-roster`);
  assert.equal(publicRoster.referees.length, 6);
  console.log("花名册公开接口可见（裁判身份入口数据源）:", publicRoster.referees.join("、"));

  step("4. 生命周期推进 draft → registration_open → ready → running");
  for (const state of ["registration_open", "ready", "running"]) {
    await call("POST", `/api/competition/${competitionId}/lifecycle/transition`, {
      cookie: masterCookie,
      body: { state }
    });
  }

  step("5. Master 一键签到全部 50 名选手");
  const { json: checkin } = await call("POST", `/api/master-workflow/${competitionId}/check-in-all`, {
    cookie: masterCookie,
    body: {}
  });
  assert.equal(checkin.checkedInCount, 50);

  step("6. 并发派单：6 场比赛、6 位裁判各 1 场");
  const matches = await overview(masterCookie, competitionId);
  assert.equal(matches.length, MATCH_COUNT);
  const firstWave = matches.slice(0, 6);
  const dispatchResults = await Promise.all(firstWave.map((match, i) =>
    call("POST", `/api/master-workflow/${competitionId}/matches/${match.matchId}/dispatch`, {
      cookie: masterCookie,
      body: {
        courtId: match.schedule.courtId,
        refereeId: REFEREES[i],
        expectedVersion: match.referee?.dispatchVersion ?? 0,
        correlationId: randomUUID()
      }
    })
  ));
  dispatchResults.forEach(({ json }) => assert.ok(json.reservation || json.match, "dispatch result expected"));
  console.log("6 场派单全部成功");

  step("7. 6 位裁判并发接单");
  const refereeCookies = await Promise.all(REFEREES.map((name) => establish(name, "referee")));
  const afterDispatch = await overview(masterCookie, competitionId);
  const wave = afterDispatch.filter((m) => firstWave.some((f) => f.matchId === m.matchId));
  await Promise.all(wave.map((match, i) =>
    call("POST", `/api/referee-workflow/${competitionId}/referees/${encodeURIComponent(REFEREES[i])}/matches/${match.matchId}/accept`, {
      cookie: refereeCookies[i],
      body: { expectedVersion: match.referee.dispatchVersion, correlationId: randomUUID() }
    })
  ));
  console.log("6 位裁判接单全部成功");

  step("8. 6 位裁判并发开赛");
  await Promise.all(wave.map((match, i) =>
    call("POST", `/api/referee-workflow/${competitionId}/referees/${encodeURIComponent(REFEREES[i])}/matches/${match.matchId}/start`, {
      cookie: refereeCookies[i],
      body: {}
    })
  ));
  console.log("6 场比赛全部进入 playing");

  step("9. 记分上报（让分后的最终比分）");
  await Promise.all(wave.map((match, i) =>
    call("POST", `/api/referee-workflow/${competitionId}/referees/${encodeURIComponent(REFEREES[i])}/matches/${match.matchId}/score`, {
      cookie: refereeCookies[i],
      body: { score1: 11, score2: 7 }
    })
  ));
  console.log("6 场比分全部上报");

  step("10. 主控确认赛果");
  const afterScore = await overview(masterCookie, competitionId);
  const scored = afterScore.filter((m) => firstWave.some((f) => f.matchId === m.matchId));
  await Promise.all(scored.map((match) =>
    call("POST", `/api/master-workflow/${competitionId}/matches/${match.matchId}/confirm-result`, {
      cookie: masterCookie,
      body: {}
    })
  ));
  const confirmed = await overview(masterCookie, competitionId);
  const confirmedWave = confirmed.filter((m) => firstWave.some((f) => f.matchId === m.matchId));
  confirmedWave.forEach((m) => assert.equal(dispatchStatusOf(m), "confirmed", `match ${m.matchId} should be confirmed`));
  console.log("6 场赛果全部确认");

  step("11. 中途撤回 + 换派（第二波第 1 场）");
  const nextMatch = confirmed.find((m) => dispatchStatusOf(m) === "not_dispatched");
  assert.ok(nextMatch, "a pending match for withdraw/reassign drill");
  const court = nextMatch.schedule.courtId;
  await call("POST", `/api/master-workflow/${competitionId}/matches/${nextMatch.matchId}/dispatch`, {
    cookie: masterCookie,
    body: { courtId: court, refereeId: REFEREES[0], expectedVersion: nextMatch.referee?.dispatchVersion ?? 0, correlationId: randomUUID() }
  });
  let current = (await overview(masterCookie, competitionId)).find((m) => m.matchId === nextMatch.matchId);
  await call("POST", `/api/master-workflow/${competitionId}/matches/${nextMatch.matchId}/withdraw`, {
    cookie: masterCookie,
    body: { reason: "彩排撤回演练", expectedVersion: current.referee.dispatchVersion, correlationId: randomUUID() }
  });
  current = (await overview(masterCookie, competitionId)).find((m) => m.matchId === nextMatch.matchId);
  await call("POST", `/api/master-workflow/${competitionId}/matches/${nextMatch.matchId}/dispatch`, {
    cookie: masterCookie,
    body: { courtId: court, refereeId: REFEREES[1], expectedVersion: current.referee?.dispatchVersion ?? 0, correlationId: randomUUID() }
  });
  current = (await overview(masterCookie, competitionId)).find((m) => m.matchId === nextMatch.matchId);
  assert.equal(current.referee.refereeId, REFEREES[1], "reassigned referee expected");
  assert.equal(dispatchStatusOf(current), "waiting_acceptance", "reassigned match should await acceptance");
  console.log(`比赛 ${nextMatch.matchId} 撤回后已换派给 ${REFEREES[1]}`);

  fs.writeFileSync(STATE_FILE, JSON.stringify({ competitionId, savedAt: new Date().toISOString() }, null, 2));
  step("彩排全部通过 ✔");
  console.log(`状态已写入 ${STATE_FILE}；可重启服务后运行 --verify 验证状态恢复。`);
}

async function runPostRestartVerification() {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error(`缺少 ${STATE_FILE}，请先运行完整彩排。`);
  }
  const { competitionId } = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  step("重启后状态恢复验证");
  const masterCookie = await establish(MASTER_ID, "master");
  const matches = await overview(masterCookie, competitionId);
  assert.equal(matches.length, MATCH_COUNT, "all 60 matches survive restart");
  const confirmed = matches.filter((m) => dispatchStatusOf(m) === "confirmed");
  assert.equal(confirmed.length, 6, "six confirmed results survive restart");
  const reassigned = matches.find((m) => m.referee?.refereeId === REFEREES[1] && dispatchStatusOf(m) === "waiting_acceptance");
  assert.ok(reassigned, "reassigned dispatch survives restart");
  console.log(`赛事 ${competitionId}：60 场在库、6 场已确认、换派场仍等待接单。状态恢复 ✔`);
}

(process.argv.includes("--verify") ? runPostRestartVerification() : runFullRehearsal())
  .catch((error) => {
    console.error(`\n彩排失败：${error.message}`);
    process.exitCode = 1;
  });
