const { test, after } = require('node:test');
const assert = require('node:assert/strict');

const BASE = (process.env.LEGACY_BASE_URL || 'http://localhost:8082').replace(/\/$/, '');
const EVENT = `ISSUE158-${Date.now()}-${process.pid}`;
const SUPER_PWD = 'Wuxian666';
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
const expected = (match_id,court,referee,status,request_id,extra={}) => ({match_id,expected_match_id:match_id,expected_court:court,expected_referee:referee,expected_status:status,request_id,operator:'Integration Master',reason:'isolated recovery verification',...extra});
async function state() { return {tasks:(await get('get_personal_tasks')).tasks, refs:(await get('get_referees')).data, audit:(await get('get_recovery_audit')).data}; }
async function rejectWithoutWrite(action, body) { const before=await state(); const result=await post(action,body); assert.equal(result.status,'error'); assert.deepStrictEqual(await state(),before); }

after(async () => { if (created) assert.equal((await post('super_admin_delete_event',{super_pwd:SUPER_PWD,target_code:EVENT},'')).status,'success'); });

test('Issue #158 recovery through real HTTP/MySQL', async (t) => {
  try { await fetch(`${BASE}/data.php?action=get_event_config&event_code=ISSUE158-PROBE`,{signal:AbortSignal.timeout(2000)}); }
  catch (error) { t.skip(`SKIP: isolated Legacy HTTP/MySQL unavailable at ${BASE}: ${error.cause?.code || error.message}`); return; }
  assert.equal((await post('create_event',{super_pwd:SUPER_PWD,custom_code:EVENT,event_name:'Issue 158 isolated',courts:['1','2','3','4'],referee_password:'test'},'')).status,'success'); created=true;
  const names=['待开赛保留','待开赛返回','进行中回退','待开赛改场','进行中改场','占用裁判'];
  assert.equal((await post('set_referees',{referees:names.map(name=>({name,status:'空闲',current_court:'',match_count:0,comment:'',last_login:''}))})).status,'success');
  assert.equal((await post('set_bulk_tasks',{tasks:[task('KEEP','1'),task('UNSCHEDULE','2'),task('RUNBACK','3'),task('MOVEP','4')]})).status,'success');

  for (const [id,ref] of [['KEEP',names[0]],['UNSCHEDULE',names[1]],['RUNBACK',names[2]],['MOVEP',names[3]]]) assert.equal((await post('accept_task',{match_id:id,referee_id:ref})).status,'success');
  assert.equal((await post('start_task',{match_id:'RUNBACK',referee_id:names[2],score_text:'4-2'})).status,'success');
  const preview=await get('get_match_recovery_preview',{match_id:'RUNBACK'}); assert.equal(preview.actions.return_running_unscheduled.allowed,true);

  let response=await post('recover_match',expected('KEEP','1',names[0],'待开赛','keep-1',{recovery_action:'undo_pending_keep_court'})); assert.equal(response.status,'success');
  response=await post('recover_match',expected('KEEP','1',names[0],'待开赛','keep-1',{recovery_action:'undo_pending_keep_court'})); assert.equal(response.idempotent,true);
  assert.equal((await state()).tasks.KEEP.court,'1');
  assert.equal((await post('recover_match',expected('UNSCHEDULE','2',names[1],'待开赛','unschedule-1',{recovery_action:'undo_pending_unschedule'}))).status,'success');
  assert.equal((await state()).tasks.UNSCHEDULE.court,'');
  assert.equal((await post('recover_match',expected('RUNBACK','3',names[2],'比赛中','runback-1',{recovery_action:'return_running_unscheduled'}))).status,'success');
  let snapshot=await state(); assert.equal(snapshot.tasks.RUNBACK.status,'未开始'); assert.equal(snapshot.tasks.RUNBACK.court,''); assert.equal('live_score' in snapshot.tasks.RUNBACK,false);

  assert.equal((await post('update_task_court',expected('MOVEP','4',names[3],'待开赛','move-p',{court:'1'}))).status,'success');
  assert.equal((await state()).tasks.MOVEP.court,'1');
  await rejectWithoutWrite('update_task_court',expected('MOVEP','4',names[3],'待开赛','stale',{court:'2'}));

  assert.equal((await post('set_bulk_tasks',{tasks:[task('MOVER','2'),task('OCCUPIED','3')]})).status,'success');
  assert.equal((await post('accept_task',{match_id:'MOVER',referee_id:names[4]})).status,'success');
  assert.equal((await post('start_task',{match_id:'MOVER',referee_id:names[4],score_text:'1-0'})).status,'success');
  assert.equal((await post('accept_task',{match_id:'OCCUPIED',referee_id:names[5]})).status,'success');
  await rejectWithoutWrite('update_task_court',expected('MOVER','2',names[4],'比赛中','occupied',{court:'3'}));
  assert.equal((await post('update_task_court',expected('MOVER','2',names[4],'比赛中','move-r',{court:'4'}))).status,'success');
  snapshot=await state(); assert.equal(snapshot.tasks.MOVER.court,'4'); assert.equal(snapshot.refs.find(r=>r.name===names[4]).current_court,'4');
  assert.equal(snapshot.audit.length,5); assert.equal(snapshot.audit.filter(a=>a.request_id==='move-r').length,1);
  assert.equal(JSON.stringify(snapshot.audit).includes('referee_password'),false); assert.equal(JSON.stringify(snapshot.audit).includes('signature'),false);
});
