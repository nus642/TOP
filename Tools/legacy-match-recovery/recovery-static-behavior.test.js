const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const source = fs.readFileSync(path.join(__dirname, '../../Legacy/data.php'), 'utf8');

function route(name, next) {
  const start = source.indexOf(`case '${name}':`);
  const end = source.indexOf(`case '${next}':`, start);
  assert.ok(start >= 0 && end > start, `${name} route not found`);
  return source.slice(start, end);
}

test('recovery preview is read-only and describes every supported action', () => {
  const body = route('get_match_recovery_preview', 'recover_match');
  assert.doesNotMatch(body, /kv_set|beginTransaction|FOR UPDATE/);
  assert.match(body, /check_referee_pwd/);
  for (const action of ['undo_pending_keep_court', 'undo_pending_unschedule',
    'return_running_unscheduled', 'move_court']) assert.match(body, new RegExp(action));
});

test('legacy Master/Courts payload remains transactionally compatible only for plain unstarted tasks', () => {
  const body = route('update_task_court', 'accept_task');
  assert.match(body, /Compatibility for the exact legacy UI payload/);
  assert.match(body, /!\$recovery_requested[\s\S]*projection_matches[\s\S]*未开始[\s\S]*kv_set\(\$event_code, 'tasks'/);
  assert.match(body, /比赛已有待开赛或比赛中投影，请使用完整恢复流程改场/);
  assert.match(body, /目标场地[\s\S]*存在其他比赛投影，请先处理场地异常/);
});

test('production recovery state reader detects duplicate tasks, projections, and referees', () => {
  const start = source.indexOf('function normalizeId');
  const end = source.indexOf('function recovery_expected_error');
  const helpers = source.slice(start, end);
  const php = `<?php\n${helpers}\n` + String.raw`
$tasks = ['a'=>['id'=>'DUP','court'=>'1'], 'b'=>['id'=>' dup ','court'=>'1']];
$live = ['1'=>['match_id'=>'DUP','referee'=>'R'], '2'=>['match_id'=>'dup','referee'=>'R']];
$refs = [['name'=>'R'], ['name'=>' r ']];
echo json_encode(recovery_find_state($tasks,$live,$refs,[],'DUP'), JSON_UNESCAPED_UNICODE);
`;
  const result = spawnSync('php', [], {input:php, encoding:'utf8'});
  assert.equal(result.status, 0, result.stderr);
  const state = JSON.parse(result.stdout);
  assert.equal(state.corrupted, true);
  assert.equal(state.task, null);
  assert.equal(state.projection, null);
  assert.ok(state.conflicts.includes('同一比赛ID匹配多个 task'));
  assert.ok(state.conflicts.includes('同一比赛存在多个实时投影'));

  const duplicateRefPhp = `<?php\n${helpers}\n` + String.raw`
echo json_encode(recovery_find_state(['D'=>['id'=>'D','court'=>'1']], ['1'=>['match_id'=>'D','referee'=>'R']], [['name'=>'R'],['name'=>' r ']], [], 'D'), JSON_UNESCAPED_UNICODE);
`;
  const duplicateRef = spawnSync('php', [], {input:duplicateRefPhp, encoding:'utf8'});
  assert.equal(duplicateRef.status, 0, duplicateRef.stderr);
  assert.ok(JSON.parse(duplicateRef.stdout).conflicts.includes('owner 对应多个 referee'));
});

test('recovery writes validate under event lock in one transaction before KV writes', () => {
  for (const [name, next] of [['recover_match', 'get_recovery_audit'],
    ['update_task_court', 'accept_task']]) {
    const body = route(name, next);
    const transaction = body.indexOf('beginTransaction');
    const lock = body.indexOf('lock_event_for_update');
    const expected = body.indexOf('recovery_expected_error');
    const firstWrite = body.indexOf('kv_set');
    assert.ok(transaction >= 0 && lock > transaction && firstWrite > lock,
      `${name} must lock before writing`);
    if (name === 'recover_match') assert.ok(expected > lock && firstWrite > expected);
    else assert.ok(expected > firstWrite && body.indexOf("kv_set($event_code, 'recovery_audit'") > expected,
      'recovery move validates expected state before recovery writes');
    assert.match(body, /rollBack\(\)/);
    assert.match(body, /commit\(\)/);
  }
});

test('audit is minimal, idempotent, and excludes credential/signature material', () => {
  const helpers = source.slice(source.indexOf('function recovery_audit_existing'),
    source.indexOf('function recovery_password'));
  for (const field of ['event_code', 'match_id', 'action', 'operator', 'reason',
    'time', 'expected', 'before', 'after', 'request_id']) assert.match(helpers, new RegExp(`'${field}'`));
  assert.doesNotMatch(helpers, /password|signature|secret|referee_password|super_pwd/i);
  assert.match(source, /recovery_audit_existing/);
  assert.match(helpers, /'operator' => 'Master'/);
});

test('PR #157 ownership guards and normal lifecycle routes remain present', () => {
  for (const action of ['accept_task', 'release_task_acceptance', 'start_task',
    'sync_live_score', 'save_score', 'delete_referee', 'set_referees']) {
    assert.match(source, new RegExp(`case '${action}':`));
  }
  assert.match(route('delete_referee', 'set_referees'), /referee_owns_projection/);
  assert.match(route('set_referees', 'referee_update_status'), /old_is_legal[\s\S]*incoming_is_legal/);
});
