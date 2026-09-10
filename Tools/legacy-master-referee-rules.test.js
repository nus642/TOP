const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const master = fs.readFileSync(new URL('../Legacy/master.html', `file://${__filename}`), 'utf8');
const referee = fs.readFileSync(new URL('../Legacy/referee.html', `file://${__filename}`), 'utf8');

function assignedFunction(source, marker, nextMarker) {
  const start = source.indexOf(marker);
  assert.ok(start >= 0, `missing ${marker}`);
  return source.slice(start, source.indexOf(nextMarker, start));
}

function refereeFunction(name) {
  const start = referee.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `missing ${name}`);
  const body = referee.indexOf('{', start);
  let depth = 0;
  for (let i = body; i < referee.length; i++) {
    if (referee[i] === '{') depth++;
    if (referee[i] === '}' && --depth === 0) return referee.slice(start, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}

function masterHarness(values = {}) {
  const elements = new Map();
  const value = (id, fallback) => values[id] ?? fallback;
  for (const [id, fallback] of Object.entries({
    manualDispatchInput: 'M-15 Alpha vs Beta', manualTargetScore: '15', manualCapScore: '17',
    manualGameFormat: '3', manualScoreRule: 'sideout',
  })) elements.set(id, { value: value(id, fallback) });
  const calls = [];
  const context = {
    window: null, $: id => elements.get(id), SPLIT_REGEX: /\s*\/\s*/,
    apiGet: async () => ({ status: 'success', data: [] }),
    apiPost: async (action, payload) => { calls.push({ action, payload }); return { status: 'success' }; },
    showToast: (message, error) => calls.push({ message, error }), loadDashboard() {},
    Date, Number, String, Set, Array,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(`${assignedFunction(master, 'window.handleManualDispatch = async', '// ======================== 团体房间解析')}`, context);
  return { context, calls };
}

test('manual dispatch rejects invalid or absent Master-confirmed rules without writing', async () => {
  for (const values of [
    { manualTargetScore: '' }, { manualTargetScore: '0' }, { manualCapScore: '14' },
    { manualGameFormat: '2' }, { manualScoreRule: 'unknown' },
  ]) {
    const { context, calls } = masterHarness(values);
    await context.handleManualDispatch();
    assert.equal(calls.some(call => call.action === 'set_bulk_tasks'), false);
    assert.ok(calls.some(call => call.error === true));
  }
});

test('manual dispatch emits every explicit rule and preserves Master-selected 15/17', async () => {
  const { context, calls } = masterHarness();
  await context.handleManualDispatch();
  const write = calls.find(call => call.action === 'set_bulk_tasks');
  assert.ok(write);
  const task = write.payload.tasks[0];
  assert.deepEqual(
    { target_score: task.target_score, cap_score: task.cap_score, format: task.format, meth: task.meth },
    { target_score: 15, cap_score: 17, format: 3, meth: 'sideout' },
  );
});

function reentryHarness(task, score = { t1: 4, t2: 3 }) {
  const calls = [];
  const fields = new Map();
  const element = id => {
    if (!fields.has(id)) fields.set(id, { value: '', innerText: '', readOnly: false, disabled: false, tagName: id === 'gameFormat' || id === 'scoreRule' || id === 'matchTypeSel' ? 'SELECT' : 'INPUT', setAttribute() {}, classList: { add() {}, remove() {}, toggle() {} } });
    return fields.get(id);
  };
  const assignment = { lifecycle: 'in_progress', match_id: 'M-15', court: '2', task, score };
  const context = {
    window: null, serverAssignment: assignment, currentMatch: {}, matchState: {}, gameState: {}, timeoutUsed: {}, matchPhase: 'not_started',
    currentRefLevel: 'L1', currentRefereeName: 'Ref', AUTHORITATIVE_FIELD_IDS: [], $: element,
    recoveryConflict: message => calls.push(`conflict:${message}`), showToast: message => calls.push(`toast:${message}`),
    showStep: step => calls.push(`step:${step}`), renderGame: () => calls.push('render'),
    setLiveSyncStatus() {},
    Number, String, Array,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext([
    refereeFunction('validateAuthoritativeRules'), refereeFunction('matchFromServerAssignment'),
    refereeFunction('isGameComplete'), refereeFunction('reconcileGameCompletion'),
    assignedFunction(referee, 'window.continueServerAssignment = async', 'async function discoverServerAssignment'),
  ].join('\n'), context);
  return { context, calls };
}

const completeTask = () => ({ id: 'M-15', court: '2', target_score: 15, cap_score: 17, format: 3, meth: 'sideout', t1: 'Alpha', t2: 'Beta', t1p1: 'A', t2p1: 'B' });

test('fresh-device in-progress re-entry preserves complete rules and enters scoring', async () => {
  const { context, calls } = reentryHarness(completeTask());
  await context.continueServerAssignment();
  assert.equal(context.currentMatch.target, 15);
  assert.equal(context.currentMatch.cap, 17);
  assert.equal(context.currentMatch.format, 3);
  assert.equal(context.currentMatch.meth, 'sideout');
  assert.ok(calls.includes('render'));
  assert.equal(calls.some(call => call.startsWith('toast:')), false);
});

test('fresh-device re-entry derives pending settlement from authoritative terminal score', async () => {
  const task = { ...completeTask(), cap_score: 0 };
  const { context } = reentryHarness(task, { t1: 15, t2: 13 });
  await context.continueServerAssignment();
  assert.equal(context.currentMatch.cap, 0);
  assert.equal(context.matchPhase, 'game_complete_pending_settlement');
  assert.equal(context.matchState.over, true);
});

test('fresh-device re-entry fails closed for each missing or invalid authoritative rule', async () => {
  const invalidTasks = [
    { ...completeTask(), target_score: '' }, { ...completeTask(), cap_score: -1 },
    { ...completeTask(), format: 2 }, { ...completeTask(), meth: '' },
  ];
  for (const task of invalidTasks) {
    const { context, calls } = reentryHarness(task);
    assert.equal(await context.continueServerAssignment(), false);
    assert.equal(calls.includes('render'), false);
    assert.ok(calls.some(call => call.includes('权威比赛规则不完整')));
    assert.deepEqual(Object.keys(context.currentMatch), []);
    assert.equal(calls.some(call => /accept_task|start_task|sync_live_score|referee_update_status/.test(call)), false);
  }
});

test('referee acceptance locks and starts with explicit 15/17 without fallback', async () => {
  const task = completeTask();
  const fields = new Map();
  const element = id => {
    if (!fields.has(id)) fields.set(id, { value: '', innerText: '', innerHTML: '', disabled: false, readOnly: false, tagName: ['gameFormat', 'scoreRule', 'matchTypeSel'].includes(id) ? 'SELECT' : 'INPUT', setAttribute() {}, classList: { add() {}, remove() {} } });
    return fields.get(id);
  };
  const steps = [];
  const context = {
    window: null, $: element, sysMode: 'ind', currentRefLevel: 'L1', currentRefereeName: 'Ref', currentRefereeId: 'REF-1',
    currentMatch: {}, playerDB: [], AUTHORITATIVE_FIELD_IDS: ['matchIdInput2','courtNo','targetScore','capScore','gameFormat','scoreRule','matchTypeSel','t1Name','t2Name','t1p1','t1p2','t2p1','t2p2'],
    apiCall: async () => ({ status: 'success' }), apiGet: async () => ({ status: 'success', data: [{ name: 'A', checked_in: true }, { name: 'B', checked_in: true }] }),
    showToast() {}, alert: message => assert.fail(message), localStorage: { setItem() {} },
    showStep: step => steps.push(step), Date, Number, String, Array, parseInt,
  };
  context.window = context;
  context.pendingTask = task;
  context.syncInputs = () => {};
  vm.createContext(context);
  vm.runInContext([
    refereeFunction('setAuthoritativeFieldsLocked'), refereeFunction('validateAuthoritativeRules'),
    assignedFunction(referee, 'window.handleTaskAccept = async', 'window.syncInputs ='),
    assignedFunction(referee, 'window.handleStartSetup = async', 'window.backToStep1 ='),
  ].join('\n'), context);

  await context.handleTaskAccept();
  assert.equal(element('targetScore').value, 15);
  assert.equal(element('capScore').value, 17);
  assert.equal(element('targetScore').readOnly, true);
  assert.equal(element('gameFormat').disabled, true);

  await context.handleStartSetup({ currentTarget: { innerText: 'start', disabled: false } });
  assert.equal(context.currentMatch.target, 15);
  assert.equal(context.currentMatch.cap, 17);
  assert.equal(context.currentMatch.format, 3);
  assert.equal(context.currentMatch.meth, 'sideout');
  assert.ok(steps.includes(2));
});
