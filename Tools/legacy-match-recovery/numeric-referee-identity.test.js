const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const source = fs.readFileSync(path.join(__dirname, '../../Legacy/data.php'), 'utf8');
const helpers = source.slice(source.indexOf('function normalizeId'), source.indexOf('function recovery_expected_error'));

function evaluate(script) {
  const result = spawnSync('php', [], {
    input: `<?php\n${helpers}\n${script}`,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function runningState(referee = '1') {
  return {
    tasks: { 'T6771-02': { id: 'T6771-02', court: '1', status: '比赛中', live_score: 'G1 2-0' } },
    live: { 1: { match_id: 'T6771-02', status: '比赛中', referee, score: 'G1 2-0' } },
    refs: [{ name: referee, status: '执裁中', current_court: '1' }],
    records: [],
  };
}

function findState(state) {
  return evaluate(`
$input = json_decode('${JSON.stringify(state)}', true);
$state = recovery_find_state($input['tasks'], $input['live'], $input['refs'], $input['records'], 'T6771-02');
echo json_encode(['state'=>$state, 'preview'=>recovery_summary($state)], JSON_UNESCAPED_UNICODE);
`);
}

function activeAssignment(state, referee) {
  return evaluate(`
$input = json_decode('${JSON.stringify(state)}', true);
echo json_encode(referee_active_assignment($input['tasks'], $input['live'], $input['refs'], $input['records'], '${referee}'), JSON_UNESCAPED_UNICODE);
`);
}

test('UAT-0909 numeric referee 1 remains a string through recovery and re-entry', () => {
  const fixture = runningState('1');
  const { state, preview } = findState(fixture);
  assert.equal(state.corrupted, false);
  assert.deepEqual(state.conflicts, []);
  assert.equal(state.referee_matches.length, 1);
  assert.equal(state.referee.name, '1');
  assert.equal(preview.corrupted, false, 'get_match_recovery_preview summary must remain valid');
  assert.deepEqual(preview.conflicts, []);
  assert.equal(preview.match_counts.referees, 1);

  const result = activeAssignment(fixture, '1');
  assert.equal(result.kind, 'assignment');
  assert.equal(result.assignment.lifecycle, 'in_progress');
  assert.equal(result.assignment.match_id, 'T6771-02');
  assert.equal(result.assignment.court, '1');
  assert.equal(result.assignment.score.text, 'G1 2-0');
});

for (const referee of ['2', '张裁判', 'REF-A7']) {
  test(`recovery preserves valid ${referee} referee identity`, () => {
    const fixture = runningState(referee);
    const { state, preview } = findState(fixture);
    assert.equal(state.corrupted, false);
    assert.equal(state.referee_matches.length, 1);
    assert.equal(preview.match_counts.referees, 1);
    assert.equal(activeAssignment(fixture, referee).kind, 'assignment');
  });
}

test('missing referee remains fail closed', () => {
  const fixture = runningState('1');
  fixture.refs = [];
  const { state } = findState(fixture);
  assert.equal(state.corrupted, true);
  assert.ok(state.conflicts.includes('owner/referee 在赛事中不存在'));
  assert.equal(activeAssignment(fixture, '1').kind, 'blocked');
});

test('duplicate normalized referee remains fail closed', () => {
  const fixture = runningState('REF-A7');
  fixture.refs.push({ name: ' ref-a7 ', status: '执裁中', current_court: '1' });
  const { state } = findState(fixture);
  assert.equal(state.corrupted, true);
  assert.ok(state.conflicts.includes('owner 对应多个 referee'));
  assert.equal(activeAssignment(fixture, 'REF-A7').kind, 'blocked');
});

test('missing projection owner remains fail closed', () => {
  const fixture = runningState('1');
  fixture.live[1].referee = '';
  const { state } = findState(fixture);
  assert.equal(state.corrupted, true);
  assert.ok(state.conflicts.includes('实时投影缺少 owner/referee'));
  assert.equal(activeAssignment(fixture, '1').kind, 'none');
});

test('lifecycle inconsistency remains fail closed', () => {
  const fixture = runningState('1');
  fixture.refs[0].status = '空闲';
  const result = activeAssignment(fixture, '1');
  assert.equal(result.kind, 'blocked');
  assert.equal(result.message, '活动比赛生命周期不一致，请联系主控');
});
