const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', '..', 'Legacy', 'data.php'), 'utf8');

function actionBlock(action, nextAction) {
  const start = source.indexOf(`case '${action}':`);
  const end = source.indexOf(`case '${nextAction}':`, start + 1);
  assert.ok(start >= 0 && end > start, `cannot locate ${action} block`);
  return source.slice(start, end);
}

function assertTransactional(block) {
  assert.match(block, /beginTransaction\(\)/);
  assert.match(block, /lock_event_for_update/);
  assert.match(block, /commit\(\)/);
  assert.match(block, /rollBack\(\)/);
}

describe('active match ownership write guards', () => {
  it('referee_update_status only accepts idle and rejects a running owner before writing', () => {
    const block = actionBlock('referee_update_status', 'start_task');
    assertTransactional(block);
    assert.match(block, /requested_status !== '空闲'/);
    assert.match(block, /referee_owns_projection\(\$live, \$referee_id, '比赛中'\)/);
    assert.ok(block.indexOf('rollBack()') < block.indexOf("kv_set($event_code, 'referees'"));
  });

  it('delete and clear preserve running or projected tasks', () => {
    const deletion = actionBlock('delete_task', 'update_task_court');
    const clearing = actionBlock('clear_all_tasks', 'delete_team_room');
    assertTransactional(deletion);
    assertTransactional(clearing);
    assert.match(deletion, /projection_for_match/);
    assert.match(deletion, /=== '比赛中'/);
    assert.match(clearing, /'cleared_ids'/);
    assert.match(clearing, /'skipped_active_ids'/);
    assert.doesNotMatch(clearing, /live_scores',\s*\$live/);
    assert.doesNotMatch(clearing, /referees',/);
  });

  it('referee roster writes reject removal or ownership-field replacement atomically', () => {
    const deletion = actionBlock('delete_referee', 'set_referees');
    const replacement = actionBlock('set_referees', 'referee_update_status');
    assertTransactional(deletion);
    assertTransactional(replacement);
    assert.match(deletion, /referee_owns_projection/);
    assert.match(replacement, /\['current_court'\]/);
    assert.match(replacement, /\['status'\]/);
    assert.ok(replacement.indexOf('rollBack()') < replacement.indexOf("kv_set($event_code, 'referees'"));
  });

  it('bulk task writes retain omitted tasks and reject active task mutation before writing', () => {
    const block = actionBlock('set_bulk_tasks', 'delete_task');
    assertTransactional(block);
    assert.match(block, /\$final_tasks = \$existing/);
    assert.match(block, /\$incoming\[\$id\] != \$task/);
    assert.match(block, /projection_for_match/);
    assert.ok(block.indexOf('rollBack()') < block.indexOf("kv_set($event_code, 'tasks'"));
  });

  it('acceptance continues to create pending projection without making referee active', () => {
    const block = actionBlock('accept_task', 'release_task_acceptance');
    assert.match(block, /'status' => '待开赛'/);
    assert.doesNotMatch(block, /kv_set\(\$event_code, 'referees'/);
  });
});
