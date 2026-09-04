const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const MASTER_PATH = path.join(ROOT, 'Legacy', 'master.html');
const master = fs.readFileSync(MASTER_PATH, 'utf8');

function venueBoardFunction() {
  const match = master.match(/window\.openVenueBoard = function\(\) \{[\s\S]*?\n        \};/);
  assert.ok(match, 'Master must define openVenueBoard');
  return match[0];
}

function runOpenVenueBoard(currentEventCode, sysMode = 'ind') {
  const calls = { open: [], toast: [] };
  const sandbox = {
    currentEventCode,
    sysMode,
    encodeURIComponent,
    showToast: (...args) => calls.toast.push(args),
    window: {
      open: (...args) => calls.open.push(args),
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(venueBoardFunction(), sandbox);
  sandbox.window.openVenueBoard();
  return calls;
}

describe('Legacy Master Venue Board entry', () => {
  it('propagates and URL-encodes the canonical currentEventCode', () => {
    const calls = runOpenVenueBoard('秋季 公开赛/甲');
    assert.deepEqual(calls.open, [[
      'venue-board.html?event_code=%E7%A7%8B%E5%AD%A3%20%E5%85%AC%E5%BC%80%E8%B5%9B%2F%E7%94%B2',
      '_blank',
    ]]);
    assert.deepEqual(calls.toast, []);
  });

  it('opens in a new tab/window in both individual and team modes', () => {
    for (const mode of ['ind', 'team']) {
      const calls = runOpenVenueBoard(`EVENT-${mode}`, mode);
      assert.equal(calls.open.length, 1, `${mode}: Venue Board must open once`);
      assert.equal(calls.open[0][1], '_blank', `${mode}: Master must remain open`);
    }
  });

  it('fails closed when currentEventCode is unavailable', () => {
    for (const eventCode of [null, undefined, '']) {
      const calls = runOpenVenueBoard(eventCode);
      assert.deepEqual(calls.open, []);
      assert.equal(calls.toast.length, 1);
      assert.equal(calls.toast[0][1], true);
    }
  });

  it('places the action in the existing Dashboard card, outside mode-specific tools', () => {
    const dashboardHeading = master.indexOf('大屏实况广播 (Dashboard)');
    const action = master.indexOf('onclick="openVenueBoard()"');
    const broadcastInput = master.indexOf('id="dashboardBroadcastInput"');
    assert.ok(dashboardHeading >= 0 && dashboardHeading < action);
    assert.ok(action < broadcastInput);
    assert.equal(master.match(/onclick="openVenueBoard\(\)"/g)?.length, 1);
  });

  it('does not leak rehearsal routes or fixture event codes into Master', () => {
    assert.doesNotMatch(master, /\/__uat166\//);
    assert.doesNotMatch(master, /VENUE-UAT-166/);
  });

  it('preserves existing Master operational entry points and polling', () => {
    assert.match(master, /onclick="generateRefereeLink\(\)"/);
    assert.match(master, /onclick="handleSendBroadcast\('broadcast', false\)"/);
    assert.match(master, /onclick="handleSendBroadcast\('broadcast', true\)"/);
    assert.match(master, /dashInterval = setInterval/);
    assert.match(master, /window\.handleLogout = \(\) =>/);
  });
});
