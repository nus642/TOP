const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('Legacy/referee.html', 'utf8');

function functionSource(name) {
  const starts = [`function ${name}(`, `window.${name} =`];
  const start = Math.max(...starts.map(marker => html.indexOf(marker)));
  assert.notEqual(start, -1, `${name} source exists`);
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
    if (!map.has(id)) map.set(id, {
      id, disabled: false, value: 'P1', innerText: '', innerHTML: '', style: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }
    });
    return map.get(id);
  };
}

function scoringSandbox(game = 1, score = 5) {
  const $ = elements();
  const deferred = [];
  const context = {
    window: null, $, console, activeTimer: null, matchPhase: 'in_progress',
    currentMatch: { format: 3, target: 11, cap: 0, meth: 'rally', type: 'singles', t1p1: 'A', t2p1: 'B' },
    matchState: { t1Score: score, t2Score: 0, t1Wins: 0, t2Wins: 0, currentGame: game, history: [], timeline: [], halfSwitched: false, over: false },
    gameState: { viewBa: false, servTeam: 1, initServTeam: 1, servNum: 1, t1: { r: 'A', l: 'A' }, t2: { r: 'B', l: 'B' }, servingPlayer: 'A' },
    timeoutUsed: {}, setTimeout: fn => { deferred.push(fn); }, alert() {},
    renderGame() {}, syncLiveScore() {}, backupState() {}, startTimer() {}, showToast() {}
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext([
    functionSource('isGameComplete'), functionSource('reconcileGameCompletion'),
    functionSource('updateScoringAuthority'), functionSource('award')
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

function settlementSandbox({ game, t1Wins, t2Wins, t1Score = 11, t2Score = 5 }) {
  const $ = elements();
  const serve = { checked: false };
  const steps = [];
  const context = {
    window: null, $, document: { querySelector: () => serve },
    matchPhase: 'game_complete_pending_settlement',
    currentMatch: { id: 'M1', court: '1', format: 3, target: 11, cap: 0, type: 'doubles', meth: 'rally', t1Name: 'Blue', t2Name: 'Green', t1p1: 'A', t1p2: 'B', t2p1: 'C', t2p2: 'D', ref: 'R' },
    matchState: { currentGame: game, t1Wins, t2Wins, t1Score, t2Score, results: [], timeline: [1], history: [{}], halfSwitched: false, over: true },
    gameState: { viewBa: false }, timeoutUsed: {}, alert() {}, showToast() {},
    showStep: step => steps.push(step), setTimeout() {}
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(`${functionSource('isGameComplete')}\n${functionSource('prepareNextGame')}\n${functionSource('endCurrentGame')}`, context);
  context.endCurrentGame();
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

test('next games reuse match lifecycle without another backend start_task', () => {
  const start = functionSource('executeStartMatch');
  assert.match(start, /const isNextGame = matchPhase === 'between_games_preparation'/);
  assert.match(start, /sysMode !== 'local' && !isNextGame/);
  assert.equal((start.match(/apiCall\('start_task'/g) || []).length, 1);
});

test('backup accepts and restores preparation and deciding-game end-change phases', () => {
  assert.match(functionSource('backupState'), /between_games_preparation/);
  assert.match(functionSource('validateRecoveryPayload'), /deciding_game_end_change/);
  assert.match(functionSource('checkAndRestoreBackup'), /startTimer\(60, '🔄 恢复待完成的交换场区/);
  assert.match(functionSource('stopTimerManually'), /matchPhase = 'in_progress'/);
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
