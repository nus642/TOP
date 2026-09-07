const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../Legacy/referee.html', `file://${__filename}`), 'utf8');

function functionSource(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `missing ${name}`);
  const bodyStart = html.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}

const lifecycleHelpers = ['isGameComplete', 'reconcileGameCompletion', 'updateScoringAuthority', 'updateSetupAuthority']
  .map(functionSource).join('\n');
const awardSource = html.slice(html.indexOf('window.award ='), html.indexOf('window.toggleRefereeView'));
const undoSource = html.slice(html.indexOf('window.undoLastPoint ='), html.indexOf('window.endCurrentGame'));

function harness({ t1 = 14, t2 = 13, target = 15, cap = 0 } = {}) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      disabled: false, style: {}, innerText: '',
      classList: { hidden: true, add(c) { if (c === 'hidden') this.hidden = true; }, remove(c) { if (c === 'hidden') this.hidden = false; }, toggle(c, force) { if (c === 'hidden') this.hidden = force; } },
    });
    return elements.get(id);
  };
  const context = {
    window: null, matchPhase: 'in_progress', activeTimer: null,
    currentMatch: { target, cap, meth: 'rally', type: 'singles', t1p1: 'A', t2p1: 'B' },
    matchState: { t1Score: t1, t2Score: t2, history: [], timeline: [], halfSwitched: true, over: false },
    gameState: { viewBa: false, servTeam: 1, t1: { r: 'A', l: 'A' }, t2: { r: 'B', l: 'B' } },
    timeoutUsed: {}, $: element,
    document: { querySelectorAll: () => [] }, setTimeout: fn => fn(),
    renderGame() {}, syncLiveScore() {}, backupState() {}, showToast() {},
    Math, JSON,
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(`${lifecycleHelpers}\n${awardSource}\n${undoSource}`, context);
  return { context, elements };
}

test('winning point enters pending settlement and a normal +1 cannot produce 16:13', () => {
  const { context } = harness();
  context.award(true);
  assert.equal(context.matchState.t1Score, 15);
  assert.equal(context.matchPhase, 'game_complete_pending_settlement');
  context.award(true);
  assert.equal(context.matchState.t1Score, 15);
});

test('Undo from pending settlement returns 15:13 to in_progress and scoring resumes', () => {
  const { context } = harness();
  context.award(true);
  context.undoLastPoint();
  assert.equal(context.matchState.t1Score, 14);
  assert.equal(context.matchPhase, 'in_progress');
  context.award(true);
  assert.equal(context.matchState.t1Score, 15);
});

test('a correction that remains terminal stays pending and blocks normal scoring', () => {
  const { context } = harness({ t1: 15, t2: 12 });
  context.reconcileGameCompletion();
  assert.equal(context.matchPhase, 'game_complete_pending_settlement');
  context.award(false);
  assert.deepEqual([context.matchState.t1Score, context.matchState.t2Score], [15, 12]);
});

test('pending settlement makes initialization settings read-only without disabling return', () => {
  const { context, elements } = harness({ t1: 15, t2: 13 });
  const controls = [{ disabled: false }, { disabled: false }];
  context.document.querySelectorAll = () => controls;
  context.reconcileGameCompletion();
  context.updateSetupAuthority();
  assert.ok(controls.every(control => control.disabled));
  assert.equal(elements.get('backToSetupBtn').disabled, true);
  assert.equal(elements.get('confirmStartBtn').disabled, false);
});

test('cap_score=0 means no cap', () => {
  const { context } = harness({ t1: 15, t2: 14, target: 15, cap: 0 });
  context.reconcileGameCompletion();
  assert.equal(context.matchPhase, 'in_progress');
});

test('re-entry derives pending settlement from authoritative score and preserves zero cap', () => {
  assert.match(html, /cap: Number\(t\.cap_score \?\? 21\)/);
  const reentry = html.slice(html.indexOf('window.continueServerAssignment ='), html.indexOf('async function discoverServerAssignment'));
  assert.match(reentry, /reconcileGameCompletion\(\)/);
  assert.match(html, /\['not_started','in_progress','game_complete_pending_settlement'\]/);
});
