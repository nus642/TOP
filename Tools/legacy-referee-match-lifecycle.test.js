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
      id, disabled: false, readOnly: false, tagName: id === 'gameFormat' || id === 'scoreRule' || id === 'matchTypeSel' ? 'SELECT' : 'INPUT', value: 'P1', innerText: '', innerHTML: '', style: {},
      setAttribute() {},
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
  vm.runInContext(`${functionSource('projectCurrentMatchToSetup')}\n${functionSource('isGameComplete')}\n${functionSource('hideGameSettlementPrompt')}\n${functionSource('prepareNextGame')}\n${functionSource('endCurrentGame')}\n${functionSource('settleGameFromPrompt')}`, context);
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

test('previous-game winner is an editable default with no between-game position controls', () => {
  const preparation = functionSource('prepareNextGame');
  assert.match(preparation, /serveRadio\.checked = true/);
  assert.match(html, /name="serve" value="1" onchange="backupPreparationChoices\(\)"/);
  assert.doesNotMatch(html, /t1NextPlayer|t2NextPlayer|nextGamePlayerChoices|下一局发球员/);
  assert.match(functionSource('backupPreparationChoices'), /serveTeam: parseInt/);
  assert.doesNotMatch(functionSource('backupPreparationChoices'), /t1Stance|t2Stance/);
  assert.match(html, /doublesStance.*betweenGames \|\| currentMatch\.type !== 'doubles'/);
});

test('between-game preparation preserves and locks established non-default match rules', () => {
  const source = functionSource('prepareNextGame');
  assert.match(source, /projectCurrentMatchToSetup\(\)/);
  const projection = functionSource('projectCurrentMatchToSetup');
  for (const [field, property] of [
    ['targetScore', 'target'], ['capScore', 'cap'], ['gameFormat', 'format'],
    ['scoreRule', 'meth'], ['matchTypeSel', 'type']
  ]) assert.match(projection, new RegExp(`${field}: '${property}'`));
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
  const calls = [];
  const context = {
    window: null, $, sysMode: mode, matchPhase: 'between_games_preparation', activeTimer: null,
    currentMatch: { id: 'M1', court: '1', format: 3, target: 11, cap: 0, type: 'doubles', meth: 'rally', t1Name: 'Blue', t2Name: 'Green', t1p1: 'A', t1p2: 'B', t2p1: 'C', t2p2: 'D' },
    matchState: { currentGame: 2, t1Wins: 1, t2Wins: 0, t1Score: 11, t2Score: 5, history: [{}], timeline: [1], halfSwitched: false, over: false },
    gameState: { viewBa: true, servTeam: 1, initServTeam: 1, servNum: 1, court: 'Left', t1: { r: 'B', l: 'A' }, t2: { r: 'D', l: 'C' }, initRightP1: 'A', initRightP2: 'C', servingPlayer: 'A' }, timeoutUsed: {}, getRadio: name => name === 'serve' ? '2' : 'f',
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

test('connected next game preserves inherited doubles positions while independently applying serving-team override', async () => {
  const { context, calls } = await runNextGame('team');
  assert.ok(!calls.includes('start_task'));
  assert.ok(!calls.includes('referee_update_status'));
  assert.ok(calls.includes('sync_live_score'));
  assert.equal(context.matchPhase, 'in_progress');
  assert.equal(context.matchState.currentGame, 2);
  assert.equal(context.matchState.t1Wins, 1);
  assert.equal(context.gameState.viewBa, true, 'between-game end change remains intact');
  assert.equal(context.gameState.servTeam, 2, 'referee override wins over default');
  assert.equal(context.gameState.servingPlayer, 'D', 'selected serving team uses its inherited right-court player');
  assert.deepEqual(JSON.parse(JSON.stringify(context.gameState.t1)), { r: 'B', l: 'A' });
  assert.deepEqual(JSON.parse(JSON.stringify(context.gameState.t2)), { r: 'D', l: 'C' });
});

test('Local next game runs the same behavior without any backend lifecycle call', async () => {
  const { context, calls } = await runNextGame('local');
  assert.equal(context.matchPhase, 'in_progress');
  assert.ok(!calls.includes('start_task'));
  assert.ok(!calls.includes('referee_update_status'));
});

test('doubles ends alternate G1 left to G2 right to G3 left before the independent deciding-game threshold change', async () => {
  const $ = elements();
  let selectedServeTeam = 2;
  const context = {
    window: null, $, console, sysMode: 'local', matchPhase: 'in_progress', activeTimer: null,
    currentMatch: { id: 'M1', court: '1', format: 3, target: 11, cap: 0, type: 'doubles', meth: 'rally', t1Name: 'Team A', t2Name: 'Team B', t1p1: 'A1', t1p2: 'A2', t2p1: 'B1', t2p2: 'B2' },
    matchState: { currentGame: 1, t1Wins: 1, t2Wins: 0, t1Score: 11, t2Score: 7, results: [], history: [], timeline: [], halfSwitched: false, over: true },
    gameState: { viewBa: false, servTeam: 1, initServTeam: 1, servNum: 1, court: 'Right', t1: { r: 'A2', l: 'A1' }, t2: { r: 'B1', l: 'B2' }, initRightP1: 'A1', initRightP2: 'B1', servingPlayer: 'A2' },
    timeoutUsed: { t1: true, t2: true, medicalT1: true, medicalT2: false }, getRadio: name => name === 'serve' ? String(selectedServeTeam) : 'f',
    document: { querySelector: () => ({ checked: false }) }, stopPrepCounting() {}, projectCurrentMatchToSetup() {}, setAuthoritativeFieldsLocked() {},
    hideGameSettlementPrompt() {}, showStep() {}, backupState() {}, renderGame() {}, syncLiveScore() {}, setLiveSyncStatus() {}, showToast() {},
    updateScoringAuthority() {}, setTimeout: fn => fn(), clearInterval() {}, alert() {}, startTimer() {}
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext([
    functionSource('prepareNextGame'), functionSource('executeStartMatch'), functionSource('isGameComplete'),
    functionSource('showGameSettlementPrompt'), functionSource('reconcileGameCompletion'), functionSource('award')
  ].join('\n'), context);

  context.prepareNextGame(1);
  assert.equal(context.matchState.currentGame, 2);
  assert.equal(context.gameState.viewBa, true, 'Team A changes from referee-left to referee-right');
  assert.deepEqual(JSON.parse(JSON.stringify(context.timeoutUsed)), { t1: false, t2: false, medicalT1: true, medicalT2: false }, 'ordinary timeout resets but medical usage persists');
  await vm.runInContext('executeStartMatch()', context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.gameState.t1)), { r: 'A2', l: 'A1' }, 'G1 player rotation is inherited');
  assert.equal(context.gameState.servTeam, 2, 'serving-team override is independent');
  assert.equal(context.gameState.viewBa, true);

  context.matchState.t1Score = 7; context.matchState.t2Score = 11; context.matchState.t2Wins = 1;
  context.matchState.over = true; context.matchPhase = 'in_progress'; selectedServeTeam = 1;
  context.prepareNextGame(2);
  assert.equal(context.matchState.currentGame, 3);
  assert.equal(context.gameState.viewBa, false, 'Team A returns to referee-left');
  await vm.runInContext('executeStartMatch()', context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.gameState.t1)), { r: 'A2', l: 'A1' });
  assert.equal(context.gameState.servTeam, 1);

  context.matchState.t1Score = 5; context.matchState.t2Score = 0;
  context.award(true);
  assert.equal(context.matchPhase, 'deciding_game_end_change');
  assert.equal(context.gameState.viewBa, true, 'Game 3 threshold changes ends as a separate event');
  assert.deepEqual(JSON.parse(JSON.stringify(context.gameState.t1)), { r: 'A1', l: 'A2' }, 'only normal rally rotation changes relative positions');
});

function realGameOneFlow() {
  const $ = elements();
  const stored = new Map();
  const serve = { checked: false };
  const context = {
    window: null, $, console, sysMode: 'local', matchPhase: 'not_started', activeTimer: null, prepInterval: null,
    AUTHORITATIVE_FIELD_IDS: ['matchIdInput2','courtNo','targetScore','capScore','gameFormat','scoreRule','matchTypeSel','t1Name','t2Name','t1p1','t1p2','t2p1','t2p2'],
    currentMatch: {}, currentRefLevel: 'Local', currentRefereeName: 'Referee', currentRefereeId: 'local_admin',
    matchState: { t1Score: 0, t2Score: 0, t1Wins: 0, t2Wins: 0, currentGame: 1, history: [], timeline: [], halfSwitched: false, over: false },
    gameState: { viewBa: false }, timeoutUsed: {},
    document: { querySelector: selector => selector.includes('serve') ? serve : null, querySelectorAll: () => [] },
    localStorage: { setItem: (key, value) => stored.set(key, value), getItem: key => stored.get(key) ?? null },
    getRadio: () => '1', validateAuthoritativeRules: () => '', stopPrepCounting() {},
    updateRefereeStatus: async () => {}, setLiveSyncStatus() {}, renderGame() {}, syncLiveScore() {},
    recoveryIdentity: () => ({}), recoveryBackupKey: () => 'backup', getCurrentStep: () => 2,
    showStep() {}, showToast() {}, alert() {}, setTimeout() {}
  };
  context.window = context;
  context.window.pendingTask = null;
  Object.assign($('targetScore'), { value: '15' });
  Object.assign($('capScore'), { value: '19' });
  Object.assign($('gameFormat'), { value: '3' });
  Object.assign($('scoreRule'), { value: 'rally' });
  Object.assign($('matchTypeSel'), { value: 'singles' });
  Object.assign($('courtNo'), { value: '7' });
  Object.assign($('matchIdInput2'), { value: 'LOCAL-15' });
  Object.assign($('t1Name'), { value: 'Blue' }); Object.assign($('t2Name'), { value: 'Green' });
  Object.assign($('t1p1'), { value: 'Alice' }); Object.assign($('t2p1'), { value: 'Bob' });
  vm.createContext(context);
  vm.runInContext([
    functionSource('setAuthoritativeFieldsLocked'), functionSource('projectCurrentMatchToSetup'),
    functionSource('backupState'),
    functionSource('handleStartSetup'), functionSource('executeStartMatch'), functionSource('isGameComplete'),
    functionSource('hideGameSettlementPrompt'), functionSource('prepareNextGame'), functionSource('endCurrentGame')
  ].join('\n'), context);
  return { context, $, stored };
}

async function recoverPreparation(serialized, mode) {
  const $ = elements();
  $('targetScore').value = '21'; $('capScore').value = '21'; $('gameFormat').value = '1';
  $('scoreRule').value = 'rally'; $('matchTypeSel').value = 'doubles';
  const context = {
    window: null, $, console, sysMode: mode, currentMatch: {}, matchState: {}, gameState: {}, timeoutUsed: {},
    currentRefereeId: 'local_admin', password: 'secret',
    AUTHORITATIVE_FIELD_IDS: ['matchIdInput2','courtNo','targetScore','capScore','gameFormat','scoreRule','matchTypeSel','t1Name','t2Name','t1p1','t1p2','t2p1','t2p2'],
    matchPhase: 'not_started', LEGACY_BACKUP_KEY: 'legacy', localStorage: {
      removeItem() {}, getItem: key => key === 'backup' ? serialized : null
    },
    document: { querySelector: () => ({ checked: false }) },
    recoveryBackupKey: () => 'backup', validateRecoveryPayload: () => '', validateAssignmentRecovery: () => '',
    apiCall: async () => ({ status: 'success', kind: 'assignment', assignment: { lifecycle: 'in_progress' } }),
    clearBackup() {}, confirm: () => true, reconcileGameCompletion() {}, showStep() {}, renderGame() {}, startTimer() {}
  };
  context.window = context;
  vm.createContext(context);
  const recoverySource = functionSource('checkAndRestoreBackup').replace('} catch(e) { clearBackup(); }', '} catch(e) { throw e; }');
  vm.runInContext([
    functionSource('setAuthoritativeFieldsLocked'), functionSource('projectCurrentMatchToSetup'),
    recoverySource, 'this.restore = checkAndRestoreBackup'
  ].join('\n'), context);
  assert.equal(await context.restore(), true);
  return { context, $ };
}

test('real Game 1 setup preserves non-default cap through Games 2 and 3 preparation and recovery', async () => {
  const game = realGameOneFlow();
  await game.context.handleStartSetup({ currentTarget: { innerText: '', disabled: false } });
  await vm.runInContext('executeStartMatch()', game.context);
  assert.equal(game.context.currentMatch.target, 15);
  assert.equal(game.context.currentMatch.cap, 19);

  game.context.matchState.t1Score = 15; game.context.matchState.t2Score = 8;
  game.context.matchPhase = 'game_complete_pending_settlement';
  game.context.endCurrentGame();
  assert.equal(game.$('targetScore').value, 15);
  assert.equal(game.$('capScore').value, 19);

  game.context.backupState();
  const game2Backup = game.stored.get('backup');
  for (const mode of ['local', 'ind']) {
    const recovered = await recoverPreparation(game2Backup, mode);
    assert.equal(recovered.context.currentMatch.cap, 19);
    for (const [id, value] of Object.entries({
      matchIdInput2: 'LOCAL-15', courtNo: '7', targetScore: 15, capScore: 19,
      gameFormat: 3, scoreRule: 'rally', matchTypeSel: 'singles',
      t1Name: 'Blue', t2Name: 'Green', t1p1: 'Alice', t2p1: 'Bob'
    })) assert.equal(recovered.$(id).value, value, `${mode} recovery projects ${id}`);
    assert.equal(recovered.$('capScore').readOnly, true);
  }

  await vm.runInContext('executeStartMatch()', game.context);
  game.context.matchState.t1Score = 8; game.context.matchState.t2Score = 15;
  game.context.matchPhase = 'game_complete_pending_settlement';
  game.context.endCurrentGame();
  assert.equal(game.context.matchState.currentGame, 3);
  game.context.backupState();
  const game3Backup = game.stored.get('backup');
  for (const mode of ['local', 'ind']) {
    const recovered = await recoverPreparation(game3Backup, mode);
    assert.equal(recovered.context.matchState.currentGame, 3);
    assert.equal(recovered.$('targetScore').value, 15);
    assert.equal(recovered.$('capScore').value, 19);
  }
});

test('fresh Local setup restores the saved cap default alongside target', () => {
  const $ = elements();
  $('targetScore').value = '21'; $('capScore').value = '21';
  const saved = { pickle_def_target: '15', pickle_def_cap: '19' };
  const context = { $, localStorage: { getItem: key => saved[key] ?? null } };
  vm.createContext(context);
  vm.runInContext(`${functionSource('restoreLocalSetupDefaults')}\nrestoreLocalSetupDefaults()`, context);
  assert.equal($('targetScore').value, '15');
  assert.equal($('capScore').value, '19');
});

async function restoreLifecycleBackup(phase, step) {
  const $ = elements();
  const timers = [];
  const data = {
    version: 6, identity: {}, matchPhase: phase, step,
    currentMatch: { id: 'M1', type: 'doubles', t1Name: 'Blue', t2Name: 'Green', t1p1: 'A', t1p2: 'B', t2p1: 'C', t2p2: 'D' },
    matchState: { currentGame: step === 2 ? 2 : 3, t1Score: 6, t2Score: 2, timeline: [], endChangePending: phase === 'deciding_game_end_change', preparation: { serveTeam: 2 } },
    gameState: { viewBa: true, t1: { r: 'B', l: 'A' }, t2: { r: 'C', l: 'D' } },
    timeoutUsed: { t1: false, t2: false, medicalT1: true, medicalT2: false }
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
  vm.runInContext(`${functionSource('projectCurrentMatchToSetup')}\n${functionSource('checkAndRestoreBackup')}\nthis.restore = checkAndRestoreBackup`, context);
  assert.equal(await context.restore(), true);
  return { context, timers };
}

test('recovery behavior restores inherited between-game positioning with no position selector', async () => {
  const { context, timers } = await restoreLifecycleBackup('between_games_preparation', 2);
  assert.equal(context.matchPhase, 'between_games_preparation');
  assert.deepEqual(JSON.parse(JSON.stringify(context.gameState.t1)), { r: 'B', l: 'A' });
  assert.deepEqual(JSON.parse(JSON.stringify(context.gameState.t2)), { r: 'C', l: 'D' });
  assert.deepEqual(JSON.parse(JSON.stringify(context.timeoutUsed)), { t1: false, t2: false, medicalT1: true, medicalT2: false });
  assert.doesNotMatch(html, /t1NextPlayer|t2NextPlayer|nextGamePlayerChoices/);
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
