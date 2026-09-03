const { test, after } = require('node:test');
const assert = require('node:assert/strict');

const BASE = (process.env.LEGACY_BASE_URL || 'http://localhost:8082').replace(/\/$/, '');
const EVENT = `ISSUE158-${Date.now()}-${process.pid}`;
const SUPER_PWD = process.env.SUPER_ADMIN_PWD;
const EVENT_PWD = 'issue158-test';
let created = false;

async function post(action, body = {}, event = EVENT) {
  const response = await fetch(`${BASE}/data.php`, { method: 'POST', headers: {'content-type':'application/json'}, body: JSON.stringify({action, event_code:event, ...body}), signal: AbortSignal.timeout(8000) });
  assert.ok(response.ok, `${action}: HTTP ${response.status}`); return response.json();
}
async function get(action, query = {}) {
  const url = new URL(`${BASE}/data.php`); url.searchParams.set('action', action); url.searchParams.set('event_code', EVENT);
  for (const [key,value] of Object.entries(query)) url.searchParams.set(key,value);
  const response = await fetch(url, {signal:AbortSignal.timeout(8000)}); assert.ok(response.ok); return response.json();
}
const task = (id,court) => ({id,court,t1:`${id}A`,t2:`${id}B`,status:'未开始',is_team:false,target_score:11,cap_score:15,format:1,meth:'rally'});
const expected = (match_id,court,referee,status,request_id,extra={}) => ({match_id,expected_match_id:match_id,expected_court:court,expected_referee:referee,expected_status:status,request_id,password:EVENT_PWD,operator_note:'Integration Master',reason:'isolated recovery verification',...extra});
async function state() {
  const [tasks, refs, dashboard, audit] = await Promise.all([
    get('get_personal_tasks'), get('get_referees'), get('get_full_dashboard'),
    post('get_recovery_audit', {password:EVENT_PWD}),
  ]);
  return {tasks:tasks.tasks, live_scores:dashboard.courts, referees:refs.data,
    records:dashboard.records, recovery_audit:audit.data, courts:dashboard.courts};
}
async function rejectWithoutWrite(action, body) { const before=await state(); const result=await post(action,body); assert.equal(result.status,'error'); assert.deepStrictEqual(await state(),before); }

after(async () => { if (created) assert.equal((await post('super_admin_delete_event',{super_pwd:SUPER_PWD,target_code:EVENT},'')).status,'success'); });

test('Issue #158 recovery through real HTTP/MySQL', async (t) => {
  try { await fetch(`${BASE}/data.php?action=get_event_config&event_code=ISSUE158-PROBE`,{signal:AbortSignal.timeout(2000)}); }
  catch (error) { t.skip(`SKIP: isolated Legacy HTTP/MySQL unavailable at ${BASE}: ${error.cause?.code || error.message}`); return; }
  assert.equal((await post('create_event',{super_pwd:SUPER_PWD,custom_code:EVENT,event_name:'Issue 158 isolated',courts:['1','2','3','4'],referee_password:EVENT_PWD},'')).status,'success'); created=true;
  assert.equal((await get('get_match_recovery_preview',{match_id:'NONE'})).status,'error');
  assert.equal((await post('recover_match',{match_id:'NONE',recovery_action:'undo_pending_keep_court',request_id:'unauthorized',reason:'x'})).status,'error');
  assert.equal((await post('get_recovery_audit')).status,'error');
  const names=['待开赛保留','待开赛返回','进行中回退','待开赛改场','进行中改场','占用裁判'];
  assert.equal((await post('set_referees',{referees:names.map(name=>({name,status:'空闲',current_court:'',match_count:0,comment:'',last_login:''}))})).status,'success');
  assert.equal((await post('set_bulk_tasks',{tasks:[task('KEEP','1'),task('UNSCHEDULE','2'),task('RUNBACK','3'),task('MOVEP','4'),task('LEGACY','1')]})).status,'success');
  // Exact payload shapes currently emitted by master.html and courts.html.
  assert.equal((await post('update_task_court',{match_id:'LEGACY',court:'2'})).status,'success');
  assert.equal((await post('update_task_court',{match_id:'LEGACY',court:'2'})).idempotent,true);
  assert.equal((await post('update_task_court',{match_id:'LEGACY',court:''})).status,'success');

  for (const [id,ref] of [['KEEP',names[0]],['UNSCHEDULE',names[1]],['RUNBACK',names[2]],['MOVEP',names[3]]]) assert.equal((await post('accept_task',{match_id:id,referee_id:ref})).status,'success');
  await rejectWithoutWrite('update_task_court',{match_id:'MOVEP',court:'1'});
  assert.equal((await post('start_task',{match_id:'RUNBACK',referee_id:names[2],score_text:'4-2'})).status,'success');
  const preview=await get('get_match_recovery_preview',{match_id:'RUNBACK',password:EVENT_PWD}); assert.equal(preview.actions.return_running_unscheduled.allowed,true);
  for (const payload of [
    expected('WRONG','3',names[2],'比赛中','wrong-match',{match_id:'RUNBACK',recovery_action:'return_running_unscheduled'}),
    expected('RUNBACK','3','错误裁判','比赛中','wrong-ref',{recovery_action:'return_running_unscheduled'}),
    expected('RUNBACK','4',names[2],'比赛中','wrong-court',{recovery_action:'return_running_unscheduled'}),
    expected('RUNBACK','3',names[2],'待开赛','wrong-status',{recovery_action:'return_running_unscheduled'}),
  ]) await rejectWithoutWrite('recover_match',payload);

  let response=await post('recover_match',expected('KEEP','1',names[0],'待开赛','keep-1',{recovery_action:'undo_pending_keep_court'})); assert.equal(response.status,'success');
  response=await post('recover_match',expected('KEEP','1',names[0],'待开赛','keep-1',{recovery_action:'undo_pending_keep_court'})); assert.equal(response.idempotent,true);
  assert.equal((await state()).tasks.KEEP.court,'1');
  assert.equal((await post('recover_match',expected('UNSCHEDULE','2',names[1],'待开赛','unschedule-1',{recovery_action:'undo_pending_unschedule'}))).status,'success');
  assert.equal((await state()).tasks.UNSCHEDULE.court,'');
  assert.equal((await post('recover_match',expected('RUNBACK','3',names[2],'比赛中','runback-1',{recovery_action:'return_running_unscheduled'}))).status,'success');
  let snapshot=await state(); assert.equal(snapshot.tasks.RUNBACK.status,'未开始'); assert.equal(snapshot.tasks.RUNBACK.court,''); assert.equal('live_score' in snapshot.tasks.RUNBACK,false);

  await rejectWithoutWrite('update_task_court', expected('MOVEP','4',names[3],'待开赛','unauth-move',{court:'1',password:'wrong'}));
  assert.equal((await post('update_task_court',expected('MOVEP','4',names[3],'待开赛','move-p',{court:'1'}))).status,'success');
  assert.equal((await state()).tasks.MOVEP.court,'1');
  await rejectWithoutWrite('update_task_court',expected('MOVEP','4',names[3],'待开赛','stale',{court:'2'}));

  assert.equal((await post('set_bulk_tasks',{tasks:[task('CONCURRENT','2')]})).status,'success');
  assert.equal((await post('accept_task',{match_id:'CONCURRENT',referee_id:names[0]})).status,'success');
  const concurrent = await Promise.all([
    post('recover_match',expected('CONCURRENT','2',names[0],'待开赛','concurrent-a',{recovery_action:'undo_pending_unschedule'})),
    post('recover_match',expected('CONCURRENT','2',names[0],'待开赛','concurrent-b',{recovery_action:'undo_pending_unschedule'})),
  ]);
  assert.equal(concurrent.filter(item=>item.status==='success').length,1);
  assert.equal(concurrent.filter(item=>item.status==='error').length,1);

  assert.equal((await post('set_bulk_tasks',{tasks:[task('MOVER','2'),task('OCCUPIED','3')]})).status,'success');
  assert.equal((await post('accept_task',{match_id:'MOVER',referee_id:names[4]})).status,'success');
  assert.equal((await post('start_task',{match_id:'MOVER',referee_id:names[4],score_text:'1-0'})).status,'success');
  assert.equal((await post('accept_task',{match_id:'OCCUPIED',referee_id:names[5]})).status,'success');
  await rejectWithoutWrite('update_task_court',expected('MOVER','2',names[4],'比赛中','occupied',{court:'3'}));
  assert.equal((await post('update_task_court',expected('MOVER','2',names[4],'比赛中','move-r',{court:'4'}))).status,'success');
  // Normal accept/release/accept/start/sync/save semantics remain operational.
  assert.equal((await post('set_bulk_tasks',{tasks:[task('LIFECYCLE','2')]})).status,'success');
  assert.equal((await post('accept_task',{match_id:'LIFECYCLE',referee_id:names[0]})).status,'success');
  assert.equal((await post('release_task_acceptance',{match_id:'LIFECYCLE',referee_id:names[0]})).status,'success');
  assert.equal((await post('accept_task',{match_id:'LIFECYCLE',referee_id:names[0]})).status,'success');
  assert.equal((await post('start_task',{match_id:'LIFECYCLE',referee_id:names[0],score_text:'0-0'})).status,'success');
  assert.equal((await post('sync_live_score',{match_id:'LIFECYCLE',referee_id:names[0],court:'2',score_text:'11-7',match_name:'LIFECYCLEA vs LIFECYCLEB'})).status,'success');
  assert.equal((await post('save_score',{id:'LIFECYCLE',referee_id:names[0],court:'2',score:'11-7',winner:'LIFECYCLEA',details:'',signature:''})).status,'success');
  // Re-created task with the same ID cannot be recovered over its formal record.
  assert.equal((await post('set_bulk_tasks',{tasks:[task('LIFECYCLE','2')]})).status,'success');
  assert.equal((await post('accept_task',{match_id:'LIFECYCLE',referee_id:names[0]})).status,'success');
  await rejectWithoutWrite('recover_match',expected('LIFECYCLE','2',names[0],'待开赛','record-block',{recovery_action:'undo_pending_keep_court'}));
  snapshot=await state(); assert.equal(snapshot.tasks.MOVER.court,'4'); assert.equal(snapshot.referees.find(r=>r.name===names[4]).current_court,'4');
  assert.equal(snapshot.recovery_audit.length,6); assert.equal(snapshot.recovery_audit.filter(a=>a.request_id==='move-r').length,1);
  assert.equal(JSON.stringify(snapshot.recovery_audit).includes('referee_password'),false); assert.equal(JSON.stringify(snapshot.recovery_audit).includes('signature'),false);
});
