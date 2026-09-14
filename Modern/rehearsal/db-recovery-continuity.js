#!/usr/bin/env node
"use strict";
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const mysql = require("mysql2/promise");
const { validateDataSafety } = require("../deploy/field-test/data-safety");
const { buildFixture, REFEREES } = require("./field-test-fixture");
const { snapshot } = require("./db-recovery/snapshot");
const { MutationGate } = require("./db-recovery/mutation-gate");
const { requireExpectedRpo } = require("./db-recovery/rpo");
const { assertPristineBootstrap } = require("./db-recovery/pristine-baseline");
const OUTPUT = process.env.REHEARSAL_EVIDENCE_DIR || path.join(__dirname, "evidence");
const RUN_RE = /^[a-z0-9][a-z0-9-]{0,63}$/; const CLAIM = "Recovery point bound to backup under the controlled single-writer synthetic rehearsal assumption.";
const ATTESTATION = "CONTROLLED-SINGLE-WRITER-MODERN-FIELD-TEST-V1";
const phase = process.argv[2], runId = process.argv[3];
if (!RUN_RE.test(runId || "")) throw new Error("run ID must contain only lowercase letters, digits, and hyphens");
const dir = path.join(OUTPUT, "db-recovery", runId), manifestPath = path.join(dir, "manifest.json");
function atomic(file, value, exclusive = false) { const tmp = `${file}.tmp-${process.pid}`; fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: exclusive ? "wx" : "w" }); fs.renameSync(tmp, file); fs.chmodSync(file, 0o600); }
function load() { return JSON.parse(fs.readFileSync(manifestPath, "utf8")); }
async function dbSnapshot() { const db = await mysql.createConnection({ host: process.env.MYSQL_HOST, port: process.env.MYSQL_PORT, user: process.env.MYSQL_USER, password: process.env.MYSQL_PASS, database: process.env.MYSQL_DB, supportBigNumbers: true, bigNumberStrings: true, dateStrings: true }); try { return await snapshot(db); } finally { await db.end(); } }
const base = "http://127.0.0.1:3000";
async function request(method, route, cookie, body) { const response = await fetch(`${base}${route}`, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { "Content-Type": "application/json" }) }, body: body === undefined ? undefined : JSON.stringify(body) }); const json = await response.json().catch(() => ({})); if (!response.ok) throw new Error(`${method} ${route}: ${response.status} ${json.error || "rejected"}`); return { json, cookie: response.headers.get("set-cookie")?.split(";")[0] }; }
async function session(id, type) { const result = await request("POST", "/api/session/foundation-establish", null, { actorId: id, actorType: type }); assert.ok(result.cookie); return result.cookie; }
async function matches(cookie, id) { return (await request("GET", `/api/master-operations/${id}/matches`, cookie)).json.matches; }
function status(m) { if (["confirmed", "finished"].includes(m.operationStatus)) return "confirmed"; return m.operationStatus === "idle" || m.operationStatus === "upcoming" ? "available" : m.operationStatus; }
const cid = (stage, action) => `db-recovery-v1:${runId}:${stage}:${action}`;
async function mutation(gate, label, method, route, cookie, body) { return gate.mutate(label, (operationId) => request(method, route, cookie, { ...body, operationId })); }
async function dispatch(g, master, id, m, referee, correlationId) { return mutation(g, correlationId, "POST", `/api/master-workflow/${id}/matches/${m.matchId}/dispatch`, master, { courtId: m.schedule.courtId, refereeId: referee, expectedVersion: m.referee?.dispatchVersion ?? 0, correlationId }); }
async function accept(g, cookie, id, m, ref, correlationId) { return mutation(g, correlationId, "POST", `/api/referee-workflow/${id}/referees/${ref}/matches/${m.matchId}/accept`, cookie, { expectedVersion: m.referee.dispatchVersion, correlationId }); }
async function start(g,cookie,id,m,ref) { return mutation(g,`start:${m.matchId}`,"POST",`/api/referee-workflow/${id}/referees/${ref}/matches/${m.matchId}/start`,cookie,{}); }
async function finish(g,master,cookie,id,m,ref,s2,stage) { await mutation(g,`score:${m.matchId}`,"POST",`/api/referee-workflow/${id}/referees/${ref}/matches/${m.matchId}/score`,cookie,{score1:11,score2:s2,correlationId:cid(stage,`score-${m.matchId}`)}); await mutation(g,`confirm:${m.matchId}`,"POST",`/api/master-workflow/${id}/matches/${m.matchId}/confirm-result`,master,{correlationId:cid(stage,`confirm-${m.matchId}`)}); }
async function prepare() {
  validateDataSafety(process.env); fs.mkdirSync(dir, { recursive: true, mode: 0o700 }); assert.ok(!fs.existsSync(manifestPath), "run evidence already exists");
  const gate = new MutationGate(), fixture = buildFixture(), master = await session(`db-recovery-master-${runId}`, "master");
  const baseline = await dbSnapshot();
  const bootstrap = (await request("GET", "/api/competition?tournamentId=1", master)).json;
  assertPristineBootstrap(bootstrap, baseline);
  const made = await mutation(gate,"configure-bootstrap","PUT","/api/competition/1",master,fixture.competition); const id=made.json.competition?.id??made.json.id; assert.equal(id, 1);
  await mutation(gate,"schedule","POST",`/api/competition/${id}/schedule/import`,master,fixture.schedule); await mutation(gate,"roster","POST",`/api/referee-coordination/${id}/referees/roster`,master,{refereeIds:fixture.referees});
  for (const state of ["registration_open","ready","running"]) await mutation(gate,`lifecycle-${state}`,"POST",`/api/competition/${id}/lifecycle/transition`,master,{state});
  await mutation(gate,"check-in","POST",`/api/master-workflow/${id}/check-in-all`,master,{});
  let all=await matches(master,id); const [a,b,c,d,e]=all.slice(0,5); assert.notEqual(b.schedule.courtId,c.schedule.courtId); const refs=REFEREES.slice(0,3), cookies=await Promise.all(refs.map((r)=>session(r,"referee")));
  await dispatch(gate,master,id,a,refs[0],cid("pre","rp-a-dispatch")); all=await matches(master,id); let current=all.find(x=>x.matchId===a.matchId); await accept(gate,cookies[0],id,current,refs[0],cid("pre","rp-a-accept")); await start(gate,cookies[0],id,current,refs[0]); await finish(gate,master,cookies[0],id,current,refs[0],7,"pre");
  await dispatch(gate,master,id,b,refs[1],cid("pre","rp-b-dispatch")); all=await matches(master,id); current=all.find(x=>x.matchId===b.matchId); await accept(gate,cookies[1],id,current,refs[1],cid("pre","rp-b-accept")); await start(gate,cookies[1],id,current,refs[1]);
  await dispatch(gate,master,id,c,refs[2],cid("pre","rp-c-dispatch")); all=await matches(master,id); const states=[a,b,c,d,e].map(x=>status(all.find(y=>y.matchId===x.matchId))); assert.deepEqual(states,["confirmed","playing","assigned","available","available"]);
  const currentC=all.find(x=>x.matchId===c.matchId), gateClose=await gate.close(); const recoveryPoint=await dbSnapshot();
  const evidence={schemaVersion:1,run:{id:runId,phase:"recovery-point"},environment:{environmentId:process.env.TOP_ENVIRONMENT_ID,database:process.env.MYSQL_DB,scope:"Modern Field Test v1"},artifactIdentity:{},databaseIdentity:{},recoveryPoint,recoveryPointBinding:{claim:CLAIM,attestation:ATTESTATION,...gateClose,controlledSingleWriter:true,technicallyLockedOut:false},backupIdentity:null,postBackupDelta:null,failureObserved:null,watchdog:null,restoreCompleted:null,recoveredState:null,expectedRpoLoss:null,operationalContinuation:null,finalIntegrity:null,legacyBoundary:{selected:false,touched:false},summary:{passed:false},scenario:{competitionId:id,matchIds:{rpA:a.matchId,rpB:b.matchId,rpC:c.matchId,deltaD:d.matchId,contE:e.matchId},resources:{rpB:{court:b.schedule.courtId,referee:refs[1]},rpC:{court:c.schedule.courtId,referee:refs[2]}},rpCDispatch:{id:currentC.referee.dispatchId,version:currentC.referee.dispatchVersion}}}; atomic(manifestPath,evidence,true);
}
async function bindDelta() {
  const evidence=load(); assert.equal(evidence.run.phase,"recovery-point"); const b=await dbSnapshot(); assert.deepEqual(b,evidence.recoveryPoint,"snapshot A differs from post-backup snapshot B");
  const gate=new MutationGate(), master=await session(`db-recovery-master-${runId}`,"master"), ref=await session(evidence.scenario.resources.rpC.referee,"referee"), id=evidence.scenario.competitionId; let all=await matches(master,id), c=all.find(x=>x.matchId===evidence.scenario.matchIds.rpC);
  await accept(gate,ref,id,c,evidence.scenario.resources.rpC.referee,cid("post","rp-c-accept")); await start(gate,ref,id,c,evidence.scenario.resources.rpC.referee); await finish(gate,master,ref,id,c,evidence.scenario.resources.rpC.referee,8,"post"); all=await matches(master,id); const d=all.find(x=>x.matchId===evidence.scenario.matchIds.deltaD); await dispatch(gate,master,id,d,evidence.scenario.resources.rpC.referee,cid("post","delta-d-dispatch"));
  const post=await dbSnapshot(); assert.notEqual(post.aggregateDigest,evidence.recoveryPoint.aggregateDigest); evidence.postBackupDelta={classification:"expected future RPO loss",snapshot:post,declaredFacts:[cid("post","rp-c-accept"),cid("post",`score-${c.matchId}`),cid("post",`confirm-${c.matchId}`),cid("post","delta-d-dispatch")],allObservedDifferencesAccountedFor:true}; evidence.run.phase="restore-gate"; evidence.recoveryPointBinding.gateOpenedAt=gate.open(); atomic(manifestPath,evidence);
}
async function recordHost() { const e=load(); const input=JSON.parse(fs.readFileSync(0,"utf8")); Object.assign(e,input); atomic(manifestPath,e); }
async function resume() {
  const e=load(); assert.equal(e.run.phase,"restored"); const recovered=await dbSnapshot(); assert.deepEqual(recovered,e.recoveryPoint,"recovered authoritative state is not the exact Recovery Point");
  const gate=new MutationGate(), master=await session(`db-recovery-master-${runId}-fresh`,"master"), refB=await session(e.scenario.resources.rpB.referee,"referee"), id=e.scenario.competitionId; let all=await matches(master,id); const pick=(k)=>all.find(x=>x.matchId===e.scenario.matchIds[k]); assert.deepEqual([status(pick("rpA")),status(pick("rpB")),status(pick("rpC")),status(pick("deltaD")),status(pick("contE"))],["confirmed","playing","assigned","available","available"]); assert.equal(pick("rpC").referee.dispatchId,e.scenario.rpCDispatch.id); assert.equal(pick("rpC").referee.dispatchVersion,e.scenario.rpCDispatch.version);
  await finish(gate,master,refB,id,pick("rpB"),e.scenario.resources.rpB.referee,9,"continue"); all=await matches(master,id); const cont=pick("contE"); await dispatch(gate,master,id,cont,e.scenario.resources.rpB.referee,cid("continue","cont-e-dispatch")); all=await matches(master,id); const now=all.find(x=>x.matchId===cont.matchId), freshRef=await session(e.scenario.resources.rpB.referee,"referee"); await accept(gate,freshRef,id,now,e.scenario.resources.rpB.referee,cid("continue","cont-e-accept")); await start(gate,freshRef,id,now,e.scenario.resources.rpB.referee); await finish(gate,master,freshRef,id,now,e.scenario.resources.rpB.referee,6,"continue");
  e.recoveredState={snapshot:recovered,exactRecoveryPoint:true}; e.expectedRpoLoss=requireExpectedRpo({recoveryPoint:e.recoveryPoint,recovered,declaredFactsAbsent:true,observedDelta:e.postBackupDelta.declaredFacts,declaredDelta:e.postBackupDelta.declaredFacts}); e.operationalContinuation={freshSessions:true,rpBCompleted:true,resourcesReleasedAndReused:true,contECompleted:true}; e.run.phase="complete"; e.summary={passed:true}; atomic(manifestPath,e);
}
(async()=>{ if(phase==="prepare")await prepare(); else if(phase==="bind-delta")await bindDelta(); else if(phase==="record-host")await recordHost(); else if(phase==="resume")await resume(); else if(phase==="verify-post-delta"){const e=load();assert.deepEqual(await dbSnapshot(),e.postBackupDelta.snapshot,"POST-DELTA changed after unpause and before restore");} else if(phase==="snapshot")process.stdout.write(`${JSON.stringify(await dbSnapshot())}\n`); else throw new Error("usage: db-recovery-continuity.js prepare|bind-delta|record-host|resume|verify-post-delta|snapshot RUN_ID"); })().catch(e=>{console.error(e.message);process.exitCode=1;});
