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

function lockHarness() {
  const idsMatch = html.match(/const AUTHORITATIVE_FIELD_IDS = (\[[^;]+\]);/);
  assert.ok(idsMatch);
  const ids = vm.runInNewContext(idsMatch[1]);
  const fields = new Map(ids.map(id => [id, {
    tagName: ['gameFormat', 'scoreRule', 'matchTypeSel'].includes(id) ? 'SELECT' : 'INPUT',
    disabled: false, readOnly: false, value: '', attributes: {},
    setAttribute(key, value) { this.attributes[key] = value; },
  }]));
  const context = { AUTHORITATIVE_FIELD_IDS: ids, $: id => fields.get(id) };
  vm.createContext(context);
  vm.runInContext(`${functionSource('setAuthoritativeFieldsLocked')}\nthis.lock=setAuthoritativeFieldsLocked`, context);
  return { fields, lock: context.lock };
}

test('connected authoritative fields are user-locked after acceptance and pending server re-entry', () => {
  const acceptStart = html.indexOf('window.handleTaskAccept = async');
  const acceptBlock = html.slice(acceptStart, html.indexOf('window.syncInputs =', acceptStart));
  const reentryStart = html.indexOf('window.continueServerAssignment = async');
  const reentryBlock = html.slice(reentryStart, html.indexOf('async function discoverServerAssignment', reentryStart));
  assert.match(acceptBlock, /setAuthoritativeFieldsLocked\(true\)/);
  assert.match(reentryBlock, /setAuthoritativeFieldsLocked\(true\)/);

  const { fields, lock } = lockHarness();
  lock(true);
  for (const field of fields.values()) {
    if (field.tagName === 'SELECT') assert.equal(field.disabled, true);
    else assert.equal(field.readOnly, true);
  }
});

test('local/manual mode remains editable', () => {
  const { fields, lock } = lockHarness();
  lock(true);
  lock(false);
  for (const field of fields.values()) {
    if (field.tagName === 'SELECT') assert.equal(field.disabled, false);
    else assert.equal(field.readOnly, false);
  }
  const localBlock = html.slice(html.indexOf("if (sysMode === 'local') {"), html.indexOf('// 联网模式'));
  assert.match(localBlock, /setAuthoritativeFieldsLocked\(false\)/);
});

test('locked authoritative controls retain DOM values and allow programmatic population', () => {
  const { fields, lock } = lockHarness();
  lock(true);
  fields.get('targetScore').value = '15';
  fields.get('gameFormat').value = '3';
  assert.equal(fields.get('targetScore').value, '15');
  assert.equal(fields.get('gameFormat').value, '3');
});

test('missing task details use placeholders and never authoritative defaults', () => {
  const pullStart = html.indexOf('window.handleTaskPull = async');
  const pullBlock = html.slice(pullStart, html.indexOf('// [PR#155 REVIEW FIX]', pullStart));
  const acceptStart = html.indexOf('window.handleTaskAccept = async');
  const acceptBlock = html.slice(acceptStart, html.indexOf('window.syncInputs =', acceptStart));
  assert.match(pullBlock, /待确认/);
  assert.doesNotMatch(pullBlock, /\$\{data\.data\.(?:target_score|cap_score)\}/);
  assert.doesNotMatch(acceptBlock, /target_score[^;]*:\s*21|cap_score[^;]*:\s*21/);
  assert.match(html, /权威比赛规则不完整/);
});

test('task detail wording describes pre-acceptance state without claiming ownership', () => {
  const taskArea = html.slice(html.indexOf('id="taskArea"'), html.indexOf('</div>', html.indexOf('id="taskContent"')));
  assert.match(taskArea, /已读取任务详情，请确认并领取/);
  assert.doesNotMatch(taskArea, /成功获取信息/);
});
