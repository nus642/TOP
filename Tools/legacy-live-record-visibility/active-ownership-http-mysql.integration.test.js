/**
 * Real production-path integration test for PR #157.
 * Runs Legacy/data.php through HTTP backed by MySQL. It never reads backups or
 * writes KV rows directly. Every run owns a unique event and removes it in after().
 */
const { test, after } = require('node:test');
const assert = require('node:assert/strict');

const BASE = (process.env.LEGACY_BASE_URL || 'http://localhost:8082').replace(/\/$/, '');
const EVENT = `PR157-R1-${Date.now()}-${process.pid}`;
const SUPER_PWD = process.env.SUPER_ADMIN_PWD;
const REF_PENDING = 'R1待开赛裁判';
const REF_RUNNING = 'R1比赛中裁判';
let created = false;

async function post(action, body = {}, eventCode = EVENT) {
  const response = await fetch(`${BASE}/data.php`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action, event_code: eventCode, ...body }),
    signal: AbortSignal.timeout(5000),
  });
  assert.equal(response.ok, true, `${action} returned HTTP ${response.status}`);
  return response.json();
}

async function get(action) {
  const url = new URL(`${BASE}/data.php`);
  url.searchParams.set('action', action);
  url.searchParams.set('event_code', EVENT);
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  assert.equal(response.ok, true, `${action} returned HTTP ${response.status}`);
  return response.json();
}

async function snapshot() {
  const [dashboard, tasks, referees] = await Promise.all([
    get('get_full_dashboard'), get('get_personal_tasks'), get('get_referees'),
  ]);
  return {
    // courts is the public live_scores projection returned by production data.php.
    live_scores: dashboard.courts,
    tasks: tasks.tasks,
    referees: referees.data,
  };
}

async function rejectedWithoutWrites(action, body) {
  const before = await snapshot();
  const response = await post(action, body);
  assert.equal(response.status, 'error', `${action} should reject: ${JSON.stringify(response)}`);
  assert.deepStrictEqual(await snapshot(), before, `${action} made a partial write`);
}

function task(id, court, extra = {}) {
  return {
    id, court, t1: `${id}-A`, t2: `${id}-B`, t1p1: '甲', t2p1: '乙',
    target_score: 11, cap_score: 15, format: 1, meth: 'rally',
    is_team: false, status: '未开始', ...extra,
  };
}

after(async () => {
  if (!created) return;
  const result = await post('super_admin_delete_event', {
    super_pwd: SUPER_PWD, target_code: EVENT,
  }, '');
  assert.equal(result.status, 'success', 'isolated event cleanup failed');
});

test('PR #157 R1 active ownership HTTP + MySQL behavior', async (t) => {
  try {
    await fetch(`${BASE}/data.php?action=get_event_config&event_code=PR157-PROBE`, {
      signal: AbortSignal.timeout(2000),
    });
  } catch (error) {
    t.skip(`Legacy HTTP/MySQL service unavailable at ${BASE}: ${error.cause?.code || error.message}`);
    return;
  }

  let response = await post('create_event', {
    super_pwd: SUPER_PWD, custom_code: EVENT, event_name: 'PR157 R1 isolated test',
    event_type: 'ind', courts: ['1', '2', '3', '4'], referee_password: 'r1-test',
  }, '');
  assert.equal(response.status, 'success');
  created = true;

  const idleRefs = [REF_PENDING, REF_RUNNING, 'R1普通裁判'].map((name) => ({
    name, status: '空闲', current_court: '', match_count: 0, comment: '', last_login: '',
  }));
  assert.equal((await post('set_referees', { referees: idleRefs })).status, 'success');

  const initial = [task('R1-PENDING', '1'), task('R1-RUNNING', '2'), task('R1-SAFE', '3')];
  assert.equal((await post('set_bulk_tasks', { tasks: initial })).status, 'success');

  // J: acceptance keeps live pending while referee remains idle with no court.
  assert.equal((await post('accept_task', { match_id: 'R1-PENDING', referee_id: REF_PENDING })).status, 'success');
  assert.equal((await post('accept_task', { match_id: 'R1-RUNNING', referee_id: REF_RUNNING })).status, 'success');
  let state = await snapshot();
  assert.equal(state.live_scores['1'].status, '待开赛');
  assert.deepStrictEqual(state.referees.find((r) => r.name === REF_PENDING), idleRefs[0]);

  assert.equal((await post('start_task', {
    match_id: 'R1-RUNNING', referee_id: REF_RUNNING, score_text: '0-0',
  })).status, 'success');

  // A/B/K: lifecycle downgrade rejects and all three observable KVs are identical.
  await rejectedWithoutWrites('referee_update_status', {
    referee_id: REF_RUNNING, status: '空闲', court: '',
  });
  // C/E/K: active task and both projection owners cannot be removed.
  await rejectedWithoutWrites('delete_task', { match_id: 'R1-RUNNING' });
  await rejectedWithoutWrites('delete_referee', { referee_id: REF_RUNNING });
  await rejectedWithoutWrites('delete_referee', { referee_id: REF_PENDING });

  // F/K: reverse ownership validation rejects omission, overwrite, and wrong re-add.
  state = await snapshot();
  const legalRefs = state.referees;
  assert.equal((await post('set_referees', { referees: legalRefs })).status, 'success');
  await rejectedWithoutWrites('set_referees', { referees: idleRefs.filter((r) => r.name !== REF_PENDING) });
  await rejectedWithoutWrites('set_referees', { referees: legalRefs.map((r) =>
    r.name === REF_RUNNING ? { ...r, status: '空闲', current_court: '' } : r) });
  await rejectedWithoutWrites('set_referees', { referees: legalRefs.map((r) =>
    r.name === REF_PENDING ? { ...r, status: '执裁中', current_court: '1' } :
      r) });

  // G/K: omission cannot delete active tasks; mutation is rejected with no writes.
  assert.equal((await post('set_bulk_tasks', { tasks: [task('R1-IMPORT', '4')] })).status, 'success');
  state = await snapshot();
  assert.ok(state.tasks['R1-PENDING'] && state.tasks['R1-RUNNING']);
  await rejectedWithoutWrites('set_bulk_tasks', {
    tasks: [{ ...state.tasks['R1-RUNNING'], court: '4' }],
  });

  // I: importing the same IDs with reordered fields replaces by ID, never duplicates.
  const importTask = task('R1-IMPORT', '4', { t1: '更新队伍' });
  assert.equal((await post('set_bulk_tasks', { tasks: [importTask] })).status, 'success');
  assert.equal((await post('set_bulk_tasks', { tasks: [{ court: '4', ...importTask }] })).status, 'success');
  state = await snapshot();
  assert.equal(Object.values(state.tasks).filter((item) => item.id === 'R1-IMPORT').length, 1);

  // D/H: safe management works; clear reports and preserves accepted/running tasks.
  assert.equal((await post('set_bulk_tasks', { tasks: [task('R1-NORMAL', '3')] })).status, 'success');
  assert.equal((await post('set_bulk_tasks', { tasks: [task('R1-NORMAL', '3', { t1: '已修改' })] })).status, 'success');
  assert.equal((await post('delete_task', { match_id: 'R1-NORMAL' })).status, 'success');
  response = await post('clear_all_tasks');
  assert.equal(response.status, 'success');
  assert.ok(response.cleared_ids.includes('R1-SAFE'));
  assert.ok(response.cleared_ids.includes('R1-IMPORT'));
  assert.ok(response.skipped_active_ids.includes('R1-PENDING'));
  assert.ok(response.skipped_active_ids.includes('R1-RUNNING'));
  state = await snapshot();
  assert.deepStrictEqual(Object.keys(state.tasks).sort(), ['R1-PENDING', 'R1-RUNNING']);
  assert.equal(state.live_scores['1'].status, '待开赛');
  assert.equal(state.live_scores['2'].status, '比赛中');
});
