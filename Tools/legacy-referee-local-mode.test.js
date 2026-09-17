const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync(new URL('../Legacy/referee.html', `file://${__filename}`), 'utf8');

function functionSource(name) {
  const marker = `function ${name}(`;
  const start = html.indexOf(marker);
  assert.ok(start >= 0, `missing ${name}`);
  const declarationStart = html.slice(Math.max(0, start - 6), start) === 'async ' ? start - 6 : start;
  const bodyStart = html.indexOf(') {', start) + 2;
  let depth = 0;
  for (let i = bodyStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}' && --depth === 0) return html.slice(declarationStart, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}

function elementFactory() {
  const elements = new Map();
  return id => {
    if (!elements.has(id)) {
      const classes = new Set(id === 'mainApp' ? ['hidden-section'] : []);
      elements.set(id, {
        value: '', innerText: '', innerHTML: '',
        classList: {
          add(...names) { names.forEach(name => classes.add(name)); },
          remove(...names) { names.forEach(name => classes.delete(name)); },
          contains(name) { return classes.has(name); },
        },
      });
    }
    return elements.get(id);
  };
}

function initializationHarness(search) {
  const element = elementFactory();
  const local = new Map();
  const session = new Map();
  const fetchCalls = [];
  const context = {
    window: null,
    location: { search },
    history: null,
    document: { title: 'Referee' },
    URLSearchParams,
    localStorage: {
      getItem: key => local.get(key) ?? null,
      setItem: (key, value) => local.set(key, value),
      removeItem: key => local.delete(key),
    },
    sessionStorage: {
      getItem: key => session.get(key) ?? null,
      setItem: (key, value) => session.set(key, value),
      removeItem: key => session.delete(key),
    },
    fetch: async (...args) => { fetchCalls.push(args); throw new Error('unexpected fetch'); },
    $: element,
    setAuthoritativeFieldsLocked() {},
    checkAndRestoreBackup: async () => false,
    showStep() {},
  };
  context.window = context;
  vm.createContext(context);

  const modeInitialization = html.slice(
    html.indexOf('const urlParams ='),
    html.indexOf('let eventCode =')
  );
  const onloadSource = html.slice(
    html.indexOf('window.onload = async () => {'),
    html.indexOf('window.handleLogin = async () => {')
  );
  vm.runInContext([
    modeInitialization,
    "let eventCode = null, currentRefereeId = null, currentRefereeName = '', currentRefLevel = 'L1';",
    onloadSource,
    'this.readInitialization = () => ({ sysMode, eventCode, currentRefereeId, currentRefereeName, currentRefLevel });',
  ].join('\n'), context);
  return { context, element, fetchCalls, session };
}

function apiHarness(mode) {
  const fetchCalls = [];
  const context = {
    sysMode: mode,
    eventCode: 'EVENT-A',
    API: '/data.php',
    URLSearchParams,
    Date,
    Object,
    String,
    fetch: async (url, options = {}) => {
      fetchCalls.push({ url, options });
      return { json: async () => ({ status: 'success' }) };
    },
  };
  vm.createContext(context);
  vm.runInContext([
    "const recoveryText = value => String(value ?? '').trim();",
    functionSource('apiCall'),
    functionSource('apiGet'),
    'this.callApi = apiCall; this.getApi = apiGet;',
  ].join('\n'), context);
  return { context, fetchCalls };
}

test('?mode=local activates the existing standalone initialization without login', async () => {
  const { context, element, fetchCalls } = initializationHarness('?mode=local');

  await context.onload();

  const initialized = context.readInitialization();
  assert.equal(initialized.sysMode, 'local');
  assert.equal(initialized.eventCode, null);
  assert.equal(initialized.currentRefereeId, 'local_admin');
  assert.equal(initialized.currentRefereeName, '单机执裁者');
  assert.equal(initialized.currentRefLevel, 'Local');
  assert.equal(element('loginPanel').classList.contains('hidden-section'), true);
  assert.equal(element('mainApp').classList.contains('hidden-section'), false);
  assert.equal(element('cloudPullBlock').classList.contains('hidden-section'), true);
  assert.equal(element('chiefMessageBlock').classList.contains('hidden-section'), true);
  assert.equal(element('refereeInfoBar').classList.contains('hidden-section'), true);
  assert.equal(element('sysBadge').innerText, '单机离线模式');
  assert.equal(fetchCalls.length, 0);
});

for (const [label, search, expectedCode] of [
  ['normal URL', '', ''],
  ['event-code URL', '?code=EVENT-A', 'EVENT-A'],
  ['non-local mode', '?mode=team', ''],
]) {
  test(`${label} preserves the SaaS login entry`, async () => {
    const { context, element, fetchCalls } = initializationHarness(search);

    await context.onload();

    assert.equal(context.readInitialization().sysMode, 'ind');
    assert.equal(element('loginPanel').classList.contains('hidden-section'), false);
    assert.equal(element('mainApp').classList.contains('hidden-section'), true);
    assert.equal(element('eventCode').value, expectedCode);
    assert.equal(fetchCalls.length, 0);
  });
}

test('Local API boundaries do not request /data.php', async () => {
  const { context, fetchCalls } = apiHarness('local');

  assert.equal((await context.callApi('start_task', { match_id: 'LOCAL-1' })).status, 'success');
  assert.equal((await context.callApi('sync_live_score', { match_id: 'LOCAL-1' })).status, 'success');
  assert.equal((await context.callApi('save_score', { id: 'LOCAL-1' })).status, 'success');
  const getResult = await context.getApi('get_players');
  assert.equal(getResult.status, 'success');
  assert.deepEqual(Array.from(getResult.data), []);
  assert.equal(fetchCalls.length, 0);
});

test('online API behavior remains connected to /data.php', async () => {
  const { context, fetchCalls } = apiHarness('ind');

  await context.callApi('referee_login', { name: 'Referee', password: 'secret' }, 'EVENT-B');
  await context.getApi('get_event_config');

  assert.equal(fetchCalls.length, 2);
  assert.equal(fetchCalls[0].url, '/data.php');
  assert.equal(fetchCalls[0].options.method, 'POST');
  assert.deepEqual(JSON.parse(fetchCalls[0].options.body), {
    name: 'Referee', password: 'secret', action: 'referee_login', event_code: 'EVENT-B',
  });
  const getUrl = new URL(fetchCalls[1].url, 'https://www.referee.top');
  assert.equal(getUrl.pathname, '/data.php');
  assert.equal(getUrl.searchParams.get('action'), 'get_event_config');
  assert.equal(getUrl.searchParams.get('event_code'), 'EVENT-A');
});
