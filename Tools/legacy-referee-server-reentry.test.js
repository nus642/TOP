const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const php = fs.readFileSync(new URL('../Legacy/data.php', `file://${__filename}`), 'utf8');
const html = fs.readFileSync(new URL('../Legacy/referee.html', `file://${__filename}`), 'utf8');

function helperResult(tasks, live, refs, records, referee) {
  const start = php.indexOf('function normalizeId');
  const end = php.indexOf('function recovery_summary');
  const helpers = php.slice(start, end);
  const program = `<?php\n${helpers}\necho json_encode(referee_active_assignment(json_decode('${JSON.stringify(tasks)}',true),json_decode('${JSON.stringify(live)}',true),json_decode('${JSON.stringify(refs)}',true),json_decode('${JSON.stringify(records)}',true),${JSON.stringify(referee)}), JSON_UNESCAPED_UNICODE);`;
  return JSON.parse(execFileSync('php', { input: program, encoding: 'utf8' }));
}
const task = (id='M1', status='比赛中', court='1') => ({ [id]: { id, court, status, t1:'A', t2:'B', t1p1:'A1', t2p1:'B1', live_score:'G1 7-5' } });
const live = (ref='裁判A', status='比赛中', id='M1', court='1') => ({ [court]: { match_id:id, referee:ref, status, score:'G1 7-5' } });
const refs = (name='裁判A', status='执裁中', court='1') => [{ name, status, current_court:court }];

test('new browser/device can discover its unique in-progress assignment and score', () => {
  const r = helperResult(task(), live(), refs(), [], '裁判A');
  assert.equal(r.kind, 'assignment'); assert.equal(r.assignment.lifecycle, 'in_progress');
  assert.deepEqual(r.assignment.score, { text:'G1 7-5', t1:7, t2:5 });
});
test('wrong referee has no assignment', () => assert.equal(helperResult(task(), live(), refs('裁判B','空闲',''), [], '裁判B').kind, 'none'));
test('accepted/not-started is returned without changing ownership', () => {
  const r = helperResult(task('M1','未开始'), live('裁判A','待开赛'), refs('裁判A','空闲',''), [], '裁判A');
  assert.equal(r.kind, 'assignment'); assert.equal(r.assignment.lifecycle, 'not_started'); assert.equal(r.assignment.court, '1');
});
test('multiple ownership fails closed', () => {
  const projections = { ...live(), ...live('裁判A','待开赛','M2','2') };
  assert.equal(helperResult({...task(), ...task('M2','未开始','2')}, projections, refs(), [], '裁判A').kind, 'blocked');
});
test('corrupt lifecycle and completed record fail closed', () => {
  assert.equal(helperResult(task(), live('裁判A','待开赛'), refs(), [], '裁判A').kind, 'blocked');
  assert.equal(helperResult(task(), live(), refs(), [{id:'M1'}], '裁判A').kind, 'blocked');
});
test('event isolation is intrinsic: contract reads only supplied event KVs', () => {
  assert.equal(helperResult({}, {}, [{name:'裁判A',status:'空闲'}], [], '裁判A').kind, 'none');
});
test('route is password protected and read-only', () => {
  const block = php.slice(php.indexOf("case 'get_referee_active_assignment':"), php.indexOf("case 'get_full_dashboard':"));
  assert.match(block, /check_referee_pwd/); assert.doesNotMatch(block, /kv_set|accept_task|start_task/);
});
test('server re-entry path never calls accept_task or start_task', () => {
  const start = html.indexOf('window.continueServerAssignment =');
  const end = html.indexOf('async function discoverServerAssignment', start);
  const block = html.slice(start, end);
  assert.doesNotMatch(block, /apiCall\s*\(\s*['"](?:accept_task|start_task)/);
  assert.match(block, /serverAssignment\.score/);
});
test('login preserves valid v6 recovery first and otherwise discovers server authority', () => {
  const block = html.slice(html.indexOf('window.handleLogin ='), html.indexOf('window.handleLogout ='));
  assert.ok(block.indexOf('checkAndRestoreBackup()') < block.indexOf('discoverServerAssignment(pwd)'));
  assert.match(block, /if \(!restoredLocal\)/);
});
