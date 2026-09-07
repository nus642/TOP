const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../Legacy/referee.html', `file://${__filename}`), 'utf8');

function functionSource(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `missing ${name}`);
  const declarationStart = html.slice(Math.max(0, start - 6), start) === 'async ' ? start - 6 : start;
  const bodyStart = html.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}' && --depth === 0) return html.slice(declarationStart, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

function windowFunctionSource(name, nextMarker) {
  const start = html.indexOf(`window.${name} =`);
  assert.ok(start >= 0, `missing window.${name}`);
  const end = html.indexOf(nextMarker, start);
  assert.ok(end > start, `missing marker after window.${name}`);
  return html.slice(start, end);
}

function harness({ mode = 'ind', matchId = 'M-01', t1 = 8, t2 = 6, target = 15 } = {}) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      disabled: false, innerHTML: '', innerText: '', style: {},
      className: id === 'liveSyncBadge' ? 'hidden w-full text-center mb-3' : '',
      classList: {
        hidden: id === 'liveSyncBadge',
        add(c) { if (c === 'hidden') this.hidden = true; },
        remove(c) { if (c === 'hidden') this.hidden = false; },
        contains(c) { return c === 'hidden' && this.hidden; },
        toggle(c, force) { if (c === 'hidden') this.hidden = force; },
      },
    });
    return elements.get(id);
  };
  const requests = [];
  const context = {
    window: null, sysMode: mode, currentRefereeId: 'REF-1', currentRefereeName: 'Referee', currentRefLevel: 'L1',
    currentMatch: { id: matchId, court: '2', t1Name: 'A', t2Name: 'B', t1p1: 'A1', t1p2: '', t2p1: 'B1', t2p2: '', meth: 'rally', type: 'singles', target, cap: 0 },
    matchState: { t1Score: t1, t2Score: t2, t1Wins: 0, t2Wins: 0, currentGame: 1, history: [], timeline: [], halfSwitched: true, over: false },
    gameState: { viewBa: false, servTeam: 1, initServTeam: 1, servNum: 1, t1: { r: 'A1', l: 'A1' }, t2: { r: 'B1', l: 'B1' }, servingPlayer: 'A1' },
    timeoutUsed: {}, matchPhase: 'in_progress', recoveryBlocked: false, serverAssignment: null,
    activeTimer: null, liveSyncGeneration: 0, $: element,
    apiCall(action, payload) { const item = deferred(); requests.push({ action, payload, ...item }); return item.promise; },
    renderGame() {}, backupCalls: 0, backupState() { context.backupCalls++; }, showToast() {},
    setAuthoritativeFieldsLocked() {}, document: { querySelectorAll: () => [] },
    setTimeout: fn => fn(), Math, JSON,
  };
  context.window = context;
  vm.createContext(context);
  const sources = [
    functionSource('setLiveSyncStatus'), functionSource('syncLiveScore'),
    functionSource('isGameComplete'), functionSource('reconcileGameCompletion'),
    html.slice(html.indexOf('window.award ='), html.indexOf('window.toggleRefereeView')),
    html.slice(html.indexOf('window.undoLastPoint ='), html.indexOf('window.endCurrentGame')),
    functionSource('resetVolatileMatchContext'),
  ].join('\n');
  vm.runInContext(`${sources}\nthis.syncLiveScore = syncLiveScore; this.setLiveSyncStatus = setLiveSyncStatus; this.resetVolatileMatchContext = resetVolatileMatchContext;`, context);
  return { context, elements, requests, badge: element('liveSyncBadge') };
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('current success confirms the latest snapshot', async () => {
  const { context, requests, badge } = harness();
  const pending = context.syncLiveScore();
  assert.match(badge.innerHTML, /云端未确认/);
  assert.equal(requests[0].payload.score_text, 'G1 8-6');
  requests[0].resolve({ status: 'success' });
  await pending;
  assert.match(badge.innerHTML, /云端已同步/);
});

for (const [name, response] of [
  ['network failure', { status: 'error', message: '网络连接异常' }],
  ['server rejection', { status: 'error', message: '裁判归属不匹配' }],
]) test(`${name} leaves the current snapshot unconfirmed`, async () => {
  const { context, requests, badge } = harness();
  const pending = context.syncLiveScore();
  requests[0].resolve(response);
  await pending;
  assert.match(badge.innerHTML, /云端未确认/);
  assert.doesNotMatch(badge.innerHTML, /云端已同步/);
  assert.equal(requests.length, 1, 'failure must not schedule a retry');
});

test('older success cannot confirm a newer pending request', async () => {
  const { context, requests, badge } = harness();
  const old = context.syncLiveScore();
  context.matchState.t1Score++;
  context.syncLiveScore();
  requests[0].resolve({ status: 'success' });
  await old;
  assert.match(badge.innerHTML, /云端未确认/);
});

test('older success cannot erase a newer failure', async () => {
  const { context, requests, badge } = harness();
  const old = context.syncLiveScore();
  const current = context.syncLiveScore();
  requests[1].resolve({ status: 'error', message: 'rejected' });
  await current;
  requests[0].resolve({ status: 'success' });
  await old;
  assert.match(badge.innerHTML, /云端未确认/);
});

test('older failure cannot erase a newer success', async () => {
  const { context, requests, badge } = harness();
  const old = context.syncLiveScore();
  const current = context.syncLiveScore();
  requests[1].resolve({ status: 'success' });
  await current;
  requests[0].resolve({ status: 'error' });
  await old;
  assert.match(badge.innerHTML, /云端已同步/);
});

test('later legitimate success clears an existing warning', async () => {
  const { context, requests, badge } = harness();
  const failed = context.syncLiveScore();
  requests[0].resolve({ status: 'error' });
  await failed;
  assert.match(badge.innerHTML, /云端未确认/);
  const later = context.syncLiveScore();
  requests[1].resolve({ status: 'success' });
  await later;
  assert.match(badge.innerHTML, /云端已同步/);
});

test('context reset monotonically invalidates an outstanding response', async () => {
  const { context, requests, badge } = harness();
  const pending = context.syncLiveScore();
  const requestGeneration = context.liveSyncGeneration;
  context.resetVolatileMatchContext();
  assert.ok(context.liveSyncGeneration > requestGeneration);
  requests[0].resolve({ status: 'success' });
  await pending;
  assert.equal(badge.innerHTML, '');
  assert.equal(badge.className.includes('hidden'), true);
});

test('local mode makes no API call and hides the cloud badge', async () => {
  const { context, requests, badge } = harness({ mode: 'local' });
  context.setLiveSyncStatus('confirmed');
  await context.syncLiveScore();
  assert.equal(requests.length, 0);
  assert.equal(badge.innerHTML, '');
  assert.equal(badge.className.includes('hidden'), true);
});

test('missing match makes no API call and no misleading confirmation', async () => {
  const { context, requests, badge } = harness({ matchId: '' });
  await context.syncLiveScore();
  assert.equal(requests.length, 0);
  assert.doesNotMatch(badge.innerHTML, /云端已同步/);
});

test('scoring and backup remain non-blocking while API is indefinitely pending', () => {
  const { context, requests, badge } = harness();
  context.award(true);
  assert.equal(context.matchState.t1Score, 9);
  assert.equal(context.backupCalls, 1);
  assert.equal(requests.length, 1);
  assert.match(badge.innerHTML, /云端未确认/);
});

test('Undo and backup remain non-blocking while API is indefinitely pending', () => {
  const { context, requests, badge } = harness();
  context.matchState.history.push({ t1Score: 7, t2Score: 6, gameState: JSON.parse(JSON.stringify(context.gameState)), timeoutUsed: {}, halfSwitched: true });
  context.matchState.timeline.push(1);
  context.undoLastPoint();
  assert.equal(context.matchState.t1Score, 7);
  assert.equal(context.backupCalls, 1);
  assert.equal(requests.length, 1);
  assert.match(badge.innerHTML, /云端未确认/);
});

test('terminal scoring stays pending-settlement and keeps failed sync warning visible', async () => {
  const { context, requests, badge } = harness({ t1: 14, t2: 13 });
  context.award(true);
  assert.equal(context.matchState.t1Score, 15);
  assert.equal(context.matchPhase, 'game_complete_pending_settlement');
  context.award(true);
  assert.equal(context.matchState.t1Score, 15, 'normal scoring remains blocked after terminal point');
  requests[0].resolve({ status: 'error', message: '网络连接异常' });
  await flush();
  assert.match(badge.innerHTML, /云端未确认/);
  assert.equal(badge.className.includes('hidden'), false);
});

test('healthy fresh-device server re-entry marks the authoritative score confirmed without live-score sync', async () => {
  const { context, requests, badge } = harness();
  context.serverAssignment = {
    lifecycle: 'in_progress', match_id: 'M-01', court: '2', score: { t1: 8, t2: 6 },
    task: { id: 'M-01', court: '2', t1: 'A', t2: 'B', t1p1: 'A1', t2p1: 'B1', target_score: 15, cap_score: 0, format: 1, meth: 'rally' },
  };
  context.validateAuthoritativeRules = () => '';
  context.matchFromServerAssignment = assignment => ({ ...context.currentMatch, id: assignment.match_id, court: assignment.court });
  context.reconcileGameCompletion = () => {};
  context.renderGame = () => {};
  context.showStep = () => {};
  vm.runInContext(windowFunctionSource('continueServerAssignment', 'async function discoverServerAssignment'), context);

  await context.continueServerAssignment();

  assert.match(badge.innerHTML, /云端已同步/);
  assert.equal(context.matchState.t1Score, 8);
  assert.equal(context.matchState.t2Score, 6);
  assert.equal(requests.length, 0, 're-entry must not manufacture sync_live_score');
});

test('healthy connected recovery marks replaced authoritative score confirmed without live-score sync', async () => {
  const { context, requests, badge } = harness({ t1: 11, t2: 7 });
  const backup = {
    currentMatch: context.currentMatch, matchState: context.matchState, gameState: context.gameState,
    timeoutUsed: context.timeoutUsed, matchPhase: 'in_progress', step: 3,
  };
  context.localStorage = { getItem: () => JSON.stringify(backup), removeItem() {} };
  context.LEGACY_BACKUP_KEY = 'legacy-backup';
  context.recoveryBackupKey = () => 'backup';
  context.validateRecoveryPayload = () => '';
  context.validateAssignmentRecovery = () => '';
  context.recoveryConflict = message => { throw new Error(message); };
  context.apiCall = async action => {
    requests.push({ action });
    return { status: 'success', kind: 'assignment', assignment: { lifecycle: 'in_progress', score: { t1: 8, t2: 6 } } };
  };
  context.confirm = () => true;
  context.setAuthoritativeFieldsLocked = () => {};
  context.reconcileGameCompletion = () => {};
  context.renderGame = () => {};
  context.showStep = () => {};
  vm.runInContext(`${functionSource('checkAndRestoreBackup')}\nthis.checkAndRestoreBackup = checkAndRestoreBackup;`, context);

  assert.equal(await context.checkAndRestoreBackup('pwd'), true);
  assert.equal(context.matchState.t1Score, 8, 'recovery must display authoritative server score');
  assert.equal(context.matchState.t2Score, 6, 'recovery must display authoritative server score');
  assert.match(badge.innerHTML, /云端已同步/);
  assert.deepEqual(requests.map(request => request.action), ['get_referee_active_assignment']);
  assert.ok(!requests.some(request => request.action === 'sync_live_score'), 'recovery must not manufacture sync_live_score');
});

for (const [name, phase, initialStatus] of [
  ['Settings return preserves confirmed state', 'in_progress', 'confirmed'],
  ['Settings return preserves unconfirmed state', 'in_progress', 'unconfirmed'],
  ['pending-settlement return preserves prior sync state', 'game_complete_pending_settlement', 'unconfirmed'],
]) test(name, () => {
  const { context, badge } = harness();
  context.matchPhase = phase;
  context.setLiveSyncStatus(initialStatus);
  const before = badge.innerHTML;
  context.updateSetupAuthority = () => {};
  context.getCurrentStep = () => 3;
  for (let step = 1; step <= 4; step++) context.$(`step${step}`);
  vm.runInContext(`${functionSource('showStep')}\nthis.showStep = showStep;`, context);

  context.showStep(3);

  assert.equal(badge.innerHTML, before);
});
