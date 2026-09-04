const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(new URL('../Legacy/referee.html', `file://${__filename}`), 'utf8');
function functionSource(name) {
  const marker = `${name}(`;
  const asyncStart = source.indexOf(`async function ${marker}`);
  let start = asyncStart >= 0 ? asyncStart : source.indexOf(`function ${marker}`);
  assert.ok(start >= 0, `missing ${name}`);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}
const helperSource = source.slice(source.indexOf('const recoveryText ='), source.indexOf('function backupState()'));
const recoverySource = [
  helperSource,
  functionSource('validateRecoveryPayload'),
  functionSource('validateAuthoritativeRecovery'),
  functionSource('checkAndRestoreBackup'),
].join('\n');

const participants = ['蓝队', '绿队', '蓝一', '蓝二', '绿一', '绿二'];
function backup(eventId = 'EVENT-A') {
  const currentMatch = { id: 'M-01', eventId, matchId: 'M-01', court: '2', t1Name: participants[0], t2Name: participants[1], t1p1: participants[2], t1p2: participants[3], t2p1: participants[4], t2p2: participants[5] };
  return { version: 6, identity: { eventId, matchId: 'M-01', refereeId: 'REF-1', court: '2', lifecycle: 'in_progress', participants }, step: 3, currentMatch, matchState: { t1Score: 8, t2Score: 6, over: false, timeline: [] }, gameState: {}, timeoutUsed: {}, matchPhase: 'in_progress' };
}
function dashboard(overrides = {}) {
  return { status: 'success', tasks: { 'M-01': { id: 'M-01', court: '2', status: '比赛中', t1: participants[0], t2: participants[1], t1p1: participants[2], t1p2: participants[3], t2p1: participants[4], t2p2: participants[5] } }, courts: { '2': { status: '比赛中', match_id: 'M-01', referee: 'REF-1' } }, referees: [{ name: 'REF-1', status: '执裁中', current_court: '2' }], ...overrides };
}
function sandbox(data = backup(), server = dashboard()) {
  const key = 'pickle_referee_backup_v6:EVENT-A';
  const storage = new Map([[key, JSON.stringify(data)], ['pickle_referee_backup_v5', '{}']]);
  const calls = [];
  const context = {
    sysMode: 'team', eventCode: 'EVENT-A', currentRefereeId: 'REF-1', currentMatch: {}, matchState: {}, gameState: {}, timeoutUsed: {}, matchPhase: 'not_started',
    BACKUP_KEY_PREFIX: 'pickle_referee_backup_v6', LEGACY_BACKUP_KEY: 'pickle_referee_backup_v5',
    normalizeMatchId: id => String(id ?? '').replace(/\s+/g, '').toUpperCase(),
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k,v) => storage.set(k,v), removeItem: k => storage.delete(k) },
    apiCall: async action => { calls.push(action); return server; },
    confirm: () => { calls.push('confirm'); return true; }, showToast: msg => calls.push(msg),
    showStep: n => calls.push(`step:${n}`), renderGame: () => calls.push('render'), clearBackup: () => storage.delete(key),
    updateRefereeStatus: () => calls.push('WRITE_REFEREE'), syncLiveScore: () => calls.push('WRITE_SCORE'),
    $: () => ({ innerText: '', classList: { add() {}, remove() {} } }),
    Object, Array, String, JSON, encodeURIComponent,
  };
  vm.createContext(context); vm.runInContext(`${recoverySource}\nthis.validatePayload=validateRecoveryPayload;this.validateAuthority=validateAuthoritativeRecovery;this.restore=checkAndRestoreBackup`, context);
  return { context, calls, storage };
}

test('Event A backup is rejected in Event B even when presented directly', () => {
  const { context } = sandbox(); context.eventCode = 'EVENT-B';
  assert.match(context.validatePayload(backup('EVENT-A')), /赛事身份不匹配/);
});

test('same-event stale/ghost backup is rejected when server is no longer running', () => {
  const { context } = sandbox();
  const stale = dashboard({ tasks: {}, courts: { '2': { status: '空闲', match_id: '', referee: '' } }, referees: [{ name: 'REF-1', status: '空闲', current_court: '' }] });
  assert.match(context.validateAuthority(backup(), stale), /不存在对应活动比赛/);
});

test('mixed current/stale participant identity cannot be reconstructed', () => {
  const { context } = sandbox();
  const mixed = dashboard(); mixed.tasks['M-01'].t1p1 = '另一赛事选手';
  assert.match(context.validateAuthority(backup(), mixed), /参赛者.*不一致/);
});

test('reload recovery succeeds only after server reconciliation and never rewrites lifecycle', async () => {
  const { context, calls, storage } = sandbox();
  assert.equal(await context.restore(), true);
  assert.ok(calls.indexOf('get_full_dashboard') < calls.indexOf('confirm'), 'server reconciliation must precede recovery prompt');
  assert.ok(calls.includes('step:3'));
  assert.equal(context.matchState.t1Score, 8);
  assert.ok(!calls.includes('WRITE_REFEREE') && !calls.includes('WRITE_SCORE'), 'recovery must not resurrect server state');
  assert.equal(storage.has('pickle_referee_backup_v5'), false, 'identity-free legacy backup is discarded');
});

test('court, referee, and task lifecycle must all agree for Master-facing consistency', () => {
  const { context } = sandbox();
  const wrongCourt = dashboard(); wrongCourt.courts['2'].referee = 'REF-2';
  assert.match(context.validateAuthority(backup(), wrongCourt), /场地投影或裁判归属不一致/);
  const idleRef = dashboard(); idleRef.referees[0].status = '空闲';
  assert.match(context.validateAuthority(backup(), idleRef), /裁判执裁状态不一致/);
});
