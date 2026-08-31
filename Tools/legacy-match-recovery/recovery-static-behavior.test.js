const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

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
  for (const action of ['undo_pending_keep_court', 'undo_pending_unschedule',
    'return_running_unscheduled', 'move_court']) assert.match(body, new RegExp(action));
});

test('recovery writes validate under event lock in one transaction before KV writes', () => {
  for (const [name, next] of [['recover_match', 'get_recovery_audit'],
    ['update_task_court', 'accept_task']]) {
    const body = route(name, next);
    const transaction = body.indexOf('beginTransaction');
    const lock = body.indexOf('lock_event_for_update');
    const expected = body.indexOf('recovery_expected_error');
    const firstWrite = body.indexOf('kv_set');
    assert.ok(transaction >= 0 && lock > transaction && expected > lock && firstWrite > expected,
      `${name} must lock and validate before writing`);
    assert.match(body, /rollBack\(\)/);
    assert.match(body, /commit\(\)/);
  }
});

test('audit is minimal, idempotent, and excludes credential/signature material', () => {
  const helpers = source.slice(source.indexOf('function recovery_audit_existing'),
    source.indexOf('function check_referee_pwd'));
  for (const field of ['event_code', 'match_id', 'action', 'operator', 'reason',
    'time', 'expected', 'before', 'after', 'request_id']) assert.match(helpers, new RegExp(`'${field}'`));
  assert.doesNotMatch(helpers, /password|signature|secret|referee_password|super_pwd/i);
  assert.match(source, /recovery_audit_existing/);
});

test('PR #157 ownership guards and normal lifecycle routes remain present', () => {
  for (const action of ['accept_task', 'release_task_acceptance', 'start_task',
    'sync_live_score', 'save_score', 'delete_referee', 'set_referees']) {
    assert.match(source, new RegExp(`case '${action}':`));
  }
  assert.match(route('delete_referee', 'set_referees'), /referee_owns_projection/);
  assert.match(route('set_referees', 'referee_update_status'), /old_is_legal[\s\S]*incoming_is_legal/);
});
