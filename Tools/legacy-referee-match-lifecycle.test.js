const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('Legacy/referee.html', 'utf8');

function functionSource(name) {
  const starts = [`function ${name}(`, `window.${name} =`];
  let start = Math.max(...starts.map(marker => html.indexOf(marker)));
  assert.notEqual(start, -1, `${name} source exists`);
  if (html.slice(start - 6, start) === 'async ') start -= 6;
  const arrow = html.indexOf('=>', start);
  const declarationEnd = html.indexOf(') {', start);
  const brace = arrow !== -1 && (declarationEnd === -1 || arrow < declarationEnd)
    ? html.indexOf('{', arrow)
    : declarationEnd + 2;
  let depth = 0;
  for (let i = brace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}' && --depth === 0) return html.slice(start, i + 2);
  }
  throw new Error(`unterminated ${name}`);
}

function elements() {
  const map = new Map();
  return id => {
    if (!map.has(id)) {
      const classes = new Set(['hidden-section']);
      map.set(id, {
      id, disabled: false, value: 'P1', innerText: '', innerHTML: '', style: {},
      remove() {}, classList: {
        add(...names) { names.forEach(name => classes.add(name)); },
        remove(...names) { names.forEach(name => classes.delete(name)); },
        toggle(name, force) { if (force === undefined ? !classes.has(name) : force) classes.add(name); else classes.delete(name); },
        contains(name) { return classes.has(name); }
      }
    });
    }
    return map.get(id);
  };
}

function scoringSandbox(game = 1, score = 5) {
  const $ = elements();
  const deferred = [];
  const context = {
    window: null, $, console, activeTimer: null, matchPhase: 'in_progress',
    currentMatch: { format: 3, target: 11, cap: 0, meth: 'rally', type: 'singles', t1Name: 'Blue', t2Name: 'Green', t1p1: 'A', t2p1: 'B' },
    matchState: { t1Score: score, t2Score: 0, t1Wins: 0, t2Wins: 0, currentGame: game, history: [], timeline: [], halfSwitched: false, over: false },
    gameState: { viewBa: false, servTeam: 1, initServTeam: 1, servNum: 1, t1: { r: 'A', l: 'A' }, t2: { r: 'B', l: 'B' }, servingPlayer: 'A' },
    timeoutUsed: {}, setTimeout: fn => { deferred.push(fn); }, clearInterval() {}, alert() {},
    renderGame() {}, syncLiveScore() {}, backupState() {}, startTimer() {}, showToast() {}
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext([
    functionSource('isGameComplete'), functionSource('hideGameSettlementPrompt'), functionSource('showGameSettlementPrompt'), functionSource('reconcileGameCompletion'),
    functionSource('deferGameSettlement'),
    functionSource('updateScoringAuthority'), functionSource('award'),
    functionSource('completeDecidingGameEndChange'), functionSource('undoLastPoint')
  ].join('\n'), context);
  return { context, deferred };
}

test('Games 1 and 2 never perform an in-game change of ends at switchPoint', () => {
  for (const game of [1, 2]) {
    const { context, deferred } = scoringSandbox(game);
    context.award(true);
    assert.equal(context.matchState.t1Score, 6);
    assert.equal(context.gameState.viewBa, false);
    assert.equal(context.matchState.halfSwitched, false);
    assert.equal(context.matchPhase, 'in_progress');
    assert.equal(deferred.length, 1, 'only score animation was deferred');
  }
});

test('Game 3 locks synchronously at switchPoint and changes ends exactly once', () => {
  const { context, deferred } = scoringSandbox(3);
  context.award(true);
  assert.equal(context.matchState.t1Score, 6);
  assert.equal(context.matchPhase, 'deciding_game_end_change');
  assert.equal(context.matchState.endChangePending, true);
  assert.equal(context.matchState.halfSwitched, true);
  assert.equal(context.gameState.viewBa, true);
  context.award(true);
  assert.equal(context.matchState.t1Score, 6, 'immediate repeat cannot score');
  deferred.forEach(fn => fn());
  assert.equal(context.gameState.viewBa, true, 'deferred UI work cannot switch ends again');
});

test('between-game and final settlement branches implement best-of-three lifecycle', () => {
  const source = functionSource('endCurrentGame');
  assert.match(source, /matchState\.t1Wins === 2 \|\| matchState\.t2Wins === 2/);
  assert.match(source, /prepareNextGame\(winningTeam\)/);
  assert.doesNotMatch(functionSource('prepareNextGame'), /showStep\(4\)|initSignatureBoard/);
  assert.match(functionSource('prepareNextGame'), /gameState\.viewBa = !gameState\.viewBa/);
  assert.match(functionSource('prepareNextGame'), /matchPhase = 'between_games_preparation'/);
});

test('serving-team wording distinguishes Game 1 from between-game preparation', () => {
  assert.match(html, /id="servingTeamLabel"[^>]*>2\. 发球权（第一回合发球队伍）/);
  assert.match(html, /betweenGames \? '2\. 发球权（默认上一局胜方，可修改）' : '2\. 发球权（第一回合发球队伍）'/);
});

test('winning score opens one immediate settlement prompt and deferral preserves Undo', () => {
  const { context } = scoringSandbox(1, 10);
  context.award(true);
  assert.equal(context.matchPhase, 'game_complete_pending_settlement');
  assert.equal(context.$('gameSettlementPrompt').classList.contains('hidden-section'), false);
  assert.equal(context.$('gameSettlementSummary').innerText, 'Blue  11 - 0');
  context.deferGameSettlement();
  assert.equal(context.matchPhase, 'game_complete_pending_settlement');
  assert.equal(context.$('gameSettlementPrompt').classList.contains('hidden-section'), true);
  context.reconcileGameCompletion();
  assert.equal(context.$('gameSettlementPrompt').classList.contains('hidden-section'), true, 'repeated reconciliation does not reopen a deferred prompt');
  context.undoLastPoint();
  assert.equal(context.matchState.t1Score, 10);
  assert.equal(context.matchPhase, 'in_progress');
});

function settlementSandbox({ game, t1Wins, t2Wins, t1Score = 11, t2Score = 5, target = 11, cap = 0 }) {
  const $ = elements();
  const serve = { checked: false };
  const steps = [];
  const context = {
    window: null, $, document: { querySelector: () => serve },
    matchPhase: 'game_complete_pending_settlement',
    currentMatch: { id: 'M1', court: '1', format: 3, target, cap, type: 'doubles', meth: 'rally', t1Name: 'Blue', t2Name: 'Green', t1p1: 'A', t1p2: 'B', t2p1: 'C', t2p2: 'D', ref: 'R' },
    matchState: { currentGame: game, t1Wins, t2Wins, t1Score, t2Score, results: [], timeline: [1], history: [{}], halfSwitched: false, over: true },
    gameState: { viewBa: false }, timeoutUsed: {}, alert() {}, showToast() {},
    establishedRulesLocked: false, setAuthoritativeFieldsLocked(locked) { context.establishedRulesLocked = locked; },
    showStep: step => steps.push(step), setTimeout() {}
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(`${functionSource('isGameComplete')}\n${functionSource('hideGameSettlementPrompt')}\n${functionSource('prepareNextGame')}\n${functionSource('endCurrentGame')}\n${functionSource('settleGameFromPrompt')}`, context);
  context.settleGameFromPrompt();
  return { context, steps, serve };
}

test('Game 1 settles into Game 2 Preparation without a final signature', () => {
  const { context, steps, serve } = settlementSandbox({ game: 1, t1Wins: 0, t2Wins: 0 });
  assert.deepEqual(steps, [2]);
  assert.equal(context.matchPhase, 'between_games_preparation');
  assert.equal(context.matchState.currentGame, 2);
  assert.equal(context.matchState.t1Wins, 1);
  assert.equal(context.gameState.viewBa, true);
  assert.equal(serve.checked, true, 'Game 1 winner defaults to serve');
  assert.equal(context.currentMatch.t1p1, 'A', 'players remain on the same match');
});

test('Game 2 at 2-0 shows Final Summary, while 1-1 enters Game 3 Preparation', () => {
  const sweep = settlementSandbox({ game: 2, t1Wins: 1, t2Wins: 0 });
  assert.deepEqual(sweep.steps, [4]);
  const split = settlementSandbox({ game: 2, t1Wins: 0, t2Wins: 1 });
  assert.deepEqual(split.steps, [2]);
  assert.equal(split.context.matchPhase, 'between_games_preparation');
  assert.equal(split.context.matchState.currentGame, 3);
  assert.equal(split.context.matchState.t1Wins, 1);
  assert.equal(split.context.matchState.t2Wins, 1);
});

test('Game 3 settlement at 2-1 is the only remaining route to Final Summary', () => {
  const result = settlementSandbox({ game: 3, t1Wins: 1, t2Wins: 1 });
  assert.deepEqual(result.steps, [4]);
  assert.equal(result.context.matchState.t1Wins, 2);
});

test('previous-game winner is an editable default and player choices are independent', () => {
  const preparation = functionSource('prepareNextGame');
  assert.match(preparation, /serveRadio\.checked = true/);
  assert.match(html, /name="serve" value="1" onchange="backupPreparationChoices\(\)"/);
  assert.match(html, /id="t1Stance" onchange="backupPreparationChoices\(\)"/);
  assert.match(html, /id="t2Stance" onchange="backupPreparationChoices\(\)"/);
  assert.match(functionSource('backupPreparationChoices'), /serveTeam:[\s\S]*t1Stance:[\s\S]*t2Stance:/);
});

test('between-game preparation preserves and locks established non-default match rules', () => {
  const source = functionSource('prepareNextGame');
  for (const [field, property] of [
    ['targetScore', 'target'], ['capScore', 'cap'], ['gameFormat', 'format'],
    ['scoreRule', 'meth'], ['matchTypeSel', 'type']
  ]) assert.match(source, new RegExp(`\\$\\('${field}'\\)\\.value = currentMatch\\.${property}`));
  assert.match(source, /setAuthoritativeFieldsLocked\(true\)/);
  assert.match(functionSource('backToStep1'), /matchPhase === 'between_games_preparation'.*return showToast/);
  assert.match(functionSource('updateSetupAuthority'), /matchPhase === 'between_games_preparation'\) backBtn\.disabled = true/);

  const game2 = settlementSandbox({ game: 1, t1Wins: 0, t2Wins: 0, t1Score: 15, t2Score: 8, target: 15, cap: 19 });
  assert.equal(game2.context.currentMatch.target, 15);
  assert.equal(game2.context.currentMatch.cap, 19);
  assert.equal(game2.context.$('targetScore').value, 15);
  assert.equal(game2.context.$('capScore').value, 19);
  assert.equal(game2.context.establishedRulesLocked, true);

  const game3 = settlementSandbox({ game: 2, t1Wins: 0, t2Wins: 1, t1Score: 15, t2Score: 8, target: 15, cap: 19 });
  assert.equal(game3.context.matchState.currentGame, 3);
  assert.equal(game3.context.$('targetScore').value, 15);
  assert.equal(game3.context.$('capScore').value, 19);
  assert.equal(game3.context.establishedRulesLocked, true);
});

async function runNextGame(mode = 'team') {
  const $ = elements();
  $('t1Stance').value = 'P2'; $('t2Stance').value = 'P2';
  const calls = [];
  const context = {
    window: null, $, sysMode: mode, matchPhase: 'between_games_preparation', activeTimer: null,
    currentMatch: { id: 'M1', court: '1', format: 3, target: 11, cap: 0, type: 'doubles', meth: 'rally', t1Name: 'Blue', t2Name: 'Green', t1p1: 'A', t1p2: 'B', t2p1: 'C', t2p2: 'D' },
    matchState: { currentGame: 2, t1Wins: 1, t2Wins: 0, t1Score: 11, t2Score: 5, history: [{}], timeline: [1], halfSwitched: false, over: false },
    gameState: { viewBa: true }, timeoutUsed: {}, getRadio: name => name === 'serve' ? '2' : 'f',
    stopPrepCounting() {}, apiCall: async action => { calls.push(action); return { status: 'success' }; },
    updateRefereeStatus: async () => calls.push('referee_update_status'), setLiveSyncStatus() {},
    backupState() {}, renderGame() {}, syncLiveScore: async () => calls.push('sync_live_score'), showStep: step => calls.push(`step:${step}`), showToast() {}, document: { querySelector: () => null }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(`${functionSource('executeStartMatch')}\nthis.startNext = executeStartMatch`, context);
  await context.startNext();
  return { context, calls };
}

test('connected next game behavior reuses the match and independently applies overridden team/server/receiver', async () => {
  const { context, calls } = await runNextGame('team');
  assert.ok(!calls.includes('start_task'));
  assert.ok(!calls.includes('referee_update_status'));
  assert.ok(calls.includes('sync_live_score'));
  assert.equal(context.matchPhase, 'in_progress');
  assert.equal(context.matchState.currentGame, 2);
  assert.equal(context.matchState.t1Wins, 1);
  assert.equal(context.gameState.viewBa, true, 'between-game end change remains intact');
  assert.equal(context.gameState.servTeam, 2, 'referee override wins over default');
  assert.equal(context.gameState.servingPlayer, 'D', 'team 2 server selection is applied');
  assert.equal(context.gameState.t1.r, 'B', 'team 1 receiver selection is independent');
});

test('Local next game runs the same behavior without any backend lifecycle call', async () => {
  const { context, calls } = await runNextGame('local');
  assert.equal(context.matchPhase, 'in_progress');
  assert.ok(!calls.includes('start_task'));
  assert.ok(!calls.includes('referee_update_status'));
});

async function restoreLifecycleBackup(phase, step) {
  const $ = elements();
  const timers = [];
  const data = {
    version: 6, identity: {}, matchPhase: phase, step,
    currentMatch: { id: 'M1', type: 'doubles', t1Name: 'Blue', t2Name: 'Green', t1p1: 'A', t1p2: 'B', t2p1: 'C', t2p2: 'D' },
    matchState: { currentGame: step === 2 ? 2 : 3, t1Score: 6, t2Score: 2, timeline: [], endChangePending: phase === 'deciding_game_end_change', preparation: { serveTeam: 2, t1Stance: 'P2', t2Stance: 'P1' } },
    gameState: { viewBa: true }, timeoutUsed: {}
  };
  const context = {
    window: null, $, document: { querySelector: () => ({ checked: false }) }, sysMode: 'local',
    currentMatch: {}, matchState: {}, gameState: {}, timeoutUsed: {}, matchPhase: 'not_started',
    LEGACY_BACKUP_KEY: 'v5', localStorage: { removeItem() {}, getItem: key => key === 'backup' ? JSON.stringify(data) : null },
    recoveryBackupKey: () => 'backup', validateRecoveryPayload: () => '', clearBackup() {}, confirm: () => true,
    reconcileGameCompletion() {}, setAuthoritativeFieldsLocked() {}, showStep() {}, renderGame() {},
    startTimer: (sec, msg) => timers.push({ sec, msg })
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(`${functionSource('checkAndRestoreBackup')}\nthis.restore = checkAndRestoreBackup`, context);
  assert.equal(await context.restore(), true);
  return { context, timers };
}

test('recovery behavior restores editable between-game preparation choices', async () => {
  const { context, timers } = await restoreLifecycleBackup('between_games_preparation', 2);
  assert.equal(context.matchPhase, 'between_games_preparation');
  assert.equal(context.$('t1Stance').value, 'P2');
  assert.equal(context.$('t2Stance').value, 'P1');
  assert.equal(timers.length, 0);
});

test('recovery behavior keeps deciding-game end change locked and recreates its completion surface', async () => {
  const { context, timers } = await restoreLifecycleBackup('deciding_game_end_change', 3);
  assert.equal(context.matchPhase, 'deciding_game_end_change');
  assert.equal(context.matchState.endChangePending, true);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].sec, 60);
});

test('Local API guards remain backend-free for the shared lifecycle', () => {
  assert.match(functionSource('apiCall'), /sysMode === 'local'.*return \{ status: 'success' \}/);
  assert.match(functionSource('apiGet'), /sysMode === 'local'.*return \{ status: 'success', data: \[\] \}/);
  assert.doesNotMatch(functionSource('executeStartMatch'), /fetch\(/);
});

test('established deciding-game threshold and undo snapshot semantics remain intact', () => {
  assert.match(functionSource('award'), /Math\.ceil\(currentMatch\.target \/ 2\)/);
  assert.match(functionSource('award'), /halfSwitched: matchState\.halfSwitched/);
  assert.match(functionSource('undoLastPoint'), /gameState = last\.gameState/);
  assert.match(functionSource('undoLastPoint'), /matchState\.halfSwitched = last\.halfSwitched/);
});

test('undo is atomic around the deciding-game end-change transition', () => {
  const source = functionSource('undoLastPoint');
  assert.match(source, /!\['in_progress','game_complete_pending_settlement'\]\.includes\(matchPhase\) \|\| activeTimer/);
  assert.match(source, /matchState\.endChangePending = !!last\.endChangePending; matchPhase = last\.matchPhase/);
  assert.match(functionSource('award'), /if \(matchPhase !== 'deciding_game_end_change' \|\| !matchState\.endChangePending\) return/);
});

test('undo behavior cannot interleave with a pending switch and atomically restores its pre-rally snapshot afterward', () => {
  const { context } = scoringSandbox(3);
  context.award(true);
  context.undoLastPoint();
  assert.equal(context.matchState.t1Score, 6, 'pending transition rejects undo');
  assert.equal(context.gameState.viewBa, true);
  context.completeDecidingGameEndChange();
  context.undoLastPoint();
  assert.equal(context.matchState.t1Score, 5);
  assert.equal(context.gameState.viewBa, false);
  assert.equal(context.matchState.halfSwitched, false);
  assert.equal(context.matchState.endChangePending, false);
  assert.equal(context.matchPhase, 'in_progress');
});

test('deciding-game end change resumes only through its explicit completion action', () => {
  assert.doesNotMatch(functionSource('stopTimerManually'), /matchPhase = 'in_progress'/);
  const complete = functionSource('completeDecidingGameEndChange');
  assert.match(complete, /matchPhase !== 'deciding_game_end_change' \|\| !matchState\.endChangePending/);
  assert.match(complete, /matchState\.endChangePending = false/);
  assert.match(complete, /matchPhase = 'in_progress'/);
  assert.match(functionSource('startTimer'), /completeDecidingGameEndChange\(\)/);
});
