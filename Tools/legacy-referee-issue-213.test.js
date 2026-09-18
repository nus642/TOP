const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('Legacy/referee.html', 'utf8');

function functionSource(name) {
  const markers = [`function ${name}(`, `window.${name} =`];
  let start = Math.max(...markers.map(marker => html.indexOf(marker)));
  assert.notEqual(start, -1, `${name} source exists`);
  if (html.slice(start - 6, start) === 'async ') start -= 6;
  const arrow = html.indexOf('=>', start);
  const declarationEnd = html.indexOf(') {', start);
  const brace = arrow !== -1 && (declarationEnd === -1 || arrow < declarationEnd) ? html.indexOf('{', arrow) : declarationEnd + 2;
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
      const classes = new Set();
      map.set(id, { id, innerHTML: '', innerText: '', disabled: false, style: {},
        appendChild() {}, remove() {}, outerHTML: '',
        classList: { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle(x, force) { if (force === undefined ? !classes.has(x) : force) classes.add(x); else classes.delete(x); } }
      });
    }
    return map.get(id);
  };
}

function courtSandbox(type = 'singles') {
  const $ = elements();
  const context = { window: null, $, console, activeTimer: null, matchPhase: 'in_progress',
    currentMatch: { format: 3, target: 11, cap: 0, meth: 'rally', type, id: 'M1', court: '1', t1Name: 'Blue', t2Name: 'Green', t1p1: 'Alice', t1p2: 'Amy', t2p1: 'Bob', t2p2: 'Ben' },
    matchState: { t1Score: 0, t2Score: 0, t1Wins: 0, t2Wins: 0, currentGame: 1, history: [], timeline: [], halfSwitched: false, over: false },
    gameState: { viewBa: false, servTeam: 1, initServTeam: 1, servNum: 1, t1: { r: 'Alice', l: type === 'singles' ? 'Alice' : 'Amy' }, t2: { r: 'Bob', l: type === 'singles' ? 'Bob' : 'Ben' }, initRightP1: 'Alice', initRightP2: 'Bob', servingPlayer: 'Alice' },
    timeoutUsed: {}, document: { createElement: () => ({ style: {} }) }, setTimeout: fn => fn(), alert() {}, clearInterval() {},
    updateScoringAuthority() {}, syncLiveScore() {}, backupState() {}, startTimer() {}, showToast() {}
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext([functionSource('projectSinglesCourtPositions'), functionSource('renderGame'), functionSource('isGameComplete'),
    functionSource('hideGameSettlementPrompt'), functionSource('showGameSettlementPrompt'), functionSource('reconcileGameCompletion'),
    functionSource('award'), functionSource('undoLastPoint')].join('\n'), context);
  return { context, $ };
}

function visibleSlots($) {
  return ['slotTL', 'slotBL', 'slotTR', 'slotBR'].filter(id => $(id).innerHTML.includes("text-2xl"));
}

test('singles projects server and receiver diagonally from current service through scoring, service change, Undo, and recovery', () => {
  const { context, $ } = courtSandbox();
  context.renderGame();
  assert.deepEqual(visibleSlots($), ['slotBL', 'slotTR']);
  assert.equal($('slotBL').innerHTML.includes('发球: Alice'), true);
  context.timeoutUsed.medicalT1 = true;
  context.renderGame();
  assert.equal($('medTimeoutLeft').disabled, true);
  assert.equal($('medTimeoutLeft').className.includes('line-through'), true);

  context.award(false); // Bob scores, takes service, and both players project to the odd-service diagonal.
  assert.deepEqual(visibleSlots($), ['slotTL', 'slotBR']);
  assert.equal($('slotBR').innerHTML.includes('发球: Bob'), true);
  assert.equal($('slotTR').innerHTML, '');

  context.undoLastPoint();
  assert.deepEqual(visibleSlots($), ['slotBL', 'slotTR']);
  assert.equal($('slotBL').innerHTML.includes('发球: Alice'), true);

  // Browser recovery can contain the old duplicated r/l representation; rendering normalizes the state itself.
  context.gameState.t1 = { r: 'Alice', l: 'Alice' }; context.gameState.t2 = { r: 'Bob', l: 'Bob' };
  context.matchState.t1Score = 1; context.matchState.t2Score = 2; context.gameState.servTeam = 2; context.gameState.servingPlayer = 'Bob';
  context.renderGame();
  assert.deepEqual(visibleSlots($), ['slotBL', 'slotTR']);
  assert.deepEqual(context.gameState.t1, { r: 'Alice', l: '' });
  assert.deepEqual(context.gameState.t2, { r: 'Bob', l: '' });
  assert.equal($('slotTR').innerHTML.includes('发球: Bob'), true);
});

test('every singles server parity uses the correct service box and the diagonally opposite receiving box', () => {
  const { context, $ } = courtSandbox();
  const cases = [
    { team: 1, t1: 0, t2: 7, slots: ['slotBL', 'slotTR'], server: 'slotBL', player: 'Alice' },
    { team: 1, t1: 1, t2: 2, slots: ['slotTL', 'slotBR'], server: 'slotTL', player: 'Alice' },
    { team: 2, t1: 5, t2: 0, slots: ['slotBL', 'slotTR'], server: 'slotTR', player: 'Bob' },
    { team: 2, t1: 4, t2: 1, slots: ['slotTL', 'slotBR'], server: 'slotBR', player: 'Bob' }
  ];
  for (const entry of cases) {
    context.gameState.servTeam = entry.team;
    context.gameState.servingPlayer = entry.player;
    context.matchState.t1Score = entry.t1;
    context.matchState.t2Score = entry.t2;
    context.renderGame();
    assert.deepEqual(visibleSlots($), entry.slots);
    assert.equal($(entry.server).innerHTML.includes(`发球: ${entry.player}`), true);
    assert.equal(visibleSlots($).length, 2);
  }
});

test('doubles retains four visible player instances', () => {
  const { context, $ } = courtSandbox('doubles');
  context.renderGame();
  assert.deepEqual(visibleSlots($), ['slotTL', 'slotBL', 'slotTR', 'slotBR']);
});

function settlementSandbox(mode) {
  const $ = elements();
  const calls = [];
  const links = [];
  const context = { window: null, $, console, sysMode: mode, matchPhase: 'game_complete_pending_settlement', signedRecordImageData: '',
    currentMatch: { id: 'M213', court: '1', format: 1, t1Name: 'Blue', t2Name: 'Green', ref: 'R' },
    matchState: { t1Wins: 1, t2Wins: 0, t1Score: 11, t2Score: 4, results: ['G1: 11 - 4'] }, hasSigned: true,
    refereeSigCanvas: { toDataURL: () => 'data:image/jpeg;base64,SIGNATURE' }, currentRefereeId: 'R1',
    generateReportWithSignature: async () => 'data:image/jpeg;base64,ACTUAL_RECORD',
    apiCall: async (action, payload) => { calls.push({ action, payload }); return { status: 'success' }; },
    clearBackup() {}, showToast() {}, document: { body: { appendChild() {} }, createElement: tag => { const node = { tag, click() { links.push(this.href); }, remove() {} }; return node; } }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(`let signedRecordImageData = '';\n${functionSource('saveSignedRecordImage')}\n${functionSource('submitFinalReport')}`, context);
  return { context, $, calls, links };
}

test('Local signature completes without a backend phase and explicitly exports the generated JPEG record', async () => {
  const { context, $, calls, links } = settlementSandbox('local');
  await context.submitFinalReport();
  assert.equal(calls.length, 0);
  assert.equal(context.matchPhase, 'finalized');
  assert.equal($('submitReport').innerText, '✅ 本地比赛已完成');
  assert.equal($('saveSignedRecord').classList.contains('hidden'), false);
  context.saveSignedRecordImage();
  assert.deepEqual(links, ['data:image/jpeg;base64,ACTUAL_RECORD']);
});

test('connected signature keeps the existing save_score backend settlement', async () => {
  const { context, calls } = settlementSandbox('ind');
  await context.submitFinalReport();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].action, 'save_score');
  assert.equal(context.matchPhase, 'finalized');
});

test('Local final action has no upload wording and the signed record remains the generated canvas JPEG data URL', () => {
  assert.match(html, /sysMode === 'local' \? '✓ 签名确认并完成比赛'/);
  assert.match(functionSource('generateReportWithSignature'), /document\.createElement\('canvas'\)/);
  assert.match(functionSource('generateReportWithSignature'), /canvas\.toDataURL\('image\/jpeg', 0\.8\)/);
  assert.match(functionSource('submitFinalReport'), /signedRecordImageData = signedReportBase64/);
  assert.doesNotMatch(functionSource('submitFinalReport'), /单机模式：无需上传/);
});
