const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('Legacy/referee.html', 'utf8');

function functionSource(name) {
  const markers = [`function ${name}(`, `window.${name} =`];
  let start = Math.max(...markers.map(marker => html.indexOf(marker)));
  assert.notEqual(start, -1, `${name} source exists`);
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

function element() {
  const classes = new Set();
  return { disabled: false, innerHTML: '', innerText: '', remove() { this.removed = true; },
    classList: { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), contains: x => classes.has(x), toggle(x, force) { if (force) classes.add(x); else classes.delete(x); } }
  };
}

test('between-game UI removes coin toss and court-end selection while exposing doubles-only per-game starters', () => {
  assert.match(html, /id="coinTossSetup"/);
  assert.match(html, /id="courtEndSetup"/);
  assert.match(html, /coinTossSetup'\)\.classList\.toggle\('hidden', betweenGames\)/);
  assert.match(html, /courtEndSetup'\)\.classList\.toggle\('hidden', betweenGames\)/);
  assert.match(html, /doublesStance'\)\.classList\.toggle\('hidden', currentMatch\.type !== 'doubles'/);
  assert.match(html, /本局右侧球员（两队独立选择）/);
  assert.match(html, /发球权（默认上一局胜方，可修改）/);
  assert.match(functionSource('backupPreparationChoices'), /t1Right:.*t1Stance/);
  assert.match(functionSource('backupPreparationChoices'), /t2Right:.*t2Stance/);
  assert.doesNotMatch(functionSource('backupPreparationChoices'), /init_ba/);
});

function medicalSandbox() {
  const nodes = new Map();
  const $ = id => { if (!nodes.has(id)) nodes.set(id, element()); return nodes.get(id); };
  const intervals = [];
  const stored = [];
  const context = { window: null, $, matchPhase: 'in_progress', activeTimer: null,
    matchState: { over: false }, gameState: { viewBa: false }, currentMatch: { t1Name: 'Blue', t2Name: 'Green' },
    timeoutUsed: { t1: false, t2: false, medicalT1: false, medicalT2: false },
    confirm: () => true, showToast() {}, renderGame() {}, backupState: () => stored.push({ ...context.timeoutUsed }),
    updateScoringAuthority() {}, clearInterval() {}, setInterval: fn => { intervals.push(fn); return intervals.length; },
    document: { body: { appendChild(node) { nodes.set(node.id, node); } }, createElement: () => element() }
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(`${functionSource('startElapsedTimer')}\n${functionSource('stopTimerManually')}\n${functionSource('requestMedical')}`, context);
  return { context, $, intervals, stored };
}

test('medical timeout is an elapsed timer explicitly ended by the referee with no universal duration', () => {
  const { context, $, intervals, stored } = medicalSandbox();
  context.requestMedical(true);
  assert.equal(context.timeoutUsed.medicalT1, true);
  assert.equal(stored.at(-1).medicalT1, true);
  assert.equal($('tsec').innerText, ''); // counter is rendered in the shield markup at 00:00
  intervals[0]();
  assert.equal($('tsec').innerText, '00:01');
  assert.doesNotMatch(functionSource('requestMedical'), /900|15 分钟/);
  assert.match(functionSource('startElapsedTimer'), /结束医疗伤停并继续/);
  context.stopTimerManually(true);
  assert.equal(context.activeTimer, null);
  assert.equal($('timerShield').removed, true);
});

test('medical used state persists between games while ordinary per-game timeout resets', () => {
  const source = functionSource('prepareNextGame');
  assert.match(source, /t1: false/);
  assert.match(source, /t2: false/);
  assert.match(source, /medicalT1: !!timeoutUsed\.medicalT1/);
  assert.match(source, /medicalT2: !!timeoutUsed\.medicalT2/);
  assert.match(functionSource('backupState'), /timeoutUsed, matchPhase/);
  assert.match(html, /timeoutUsed = data\.timeoutUsed/);
  assert.match(functionSource('renderGame'), /medL\.disabled = mT1Used/);
  assert.match(functionSource('renderGame'), /medR\.disabled = mT2Used/);
});

test('ordinary timeout remains a 60-second per-game countdown', () => {
  const source = functionSource('requestTimeout');
  assert.match(source, /timeoutUsed\.t1 = true/);
  assert.match(source, /timeoutUsed\.t2 = true/);
  assert.match(source, /startTimer\(60/);
  assert.doesNotMatch(source, /startElapsedTimer/);
});
