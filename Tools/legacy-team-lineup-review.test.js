const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const master = fs.readFileSync(new URL('../Legacy/master.html', `file://${__filename}`), 'utf8');
const captain = fs.readFileSync(new URL('../Legacy/team_lineup.html', `file://${__filename}`), 'utf8');
const php = fs.readFileSync(new URL('../Legacy/data.php', `file://${__filename}`), 'utf8');

function reviewHarness(lineups) {
  const start = master.indexOf('const TEAM_TYPE_LABELS');
  const end = master.indexOf('window.handlePushTeamMatches', start);
  assert.ok(start >= 0 && end > start, 'review helper source is present');
  const context = { globalDashboardData: { team_lineups: lineups } };
  vm.createContext(context);
  vm.runInContext(`${master.slice(start, end)}; this.reviewTeamLineup = reviewTeamLineup; this.selectDispatchableTeamRooms = selectDispatchableTeamRooms`, context);
  return context;
}

const template = [{ type: 'MD' }, { type: 'WS' }];
const room = { teams: [{ team_name: 'A' }, { team_name: 'B' }] };
const roster = [
  { name: 'A1', team: 'A' }, { name: 'A2', team: 'A' }, { name: 'A3', team: 'A' },
  { name: 'B1', team: 'B' }, { name: 'B2', team: 'B' }, { name: 'B3', team: 'B' }
];
const valid = {
  T01_A: { matches: [
    { template_type: 'MD', type: 'doubles', players: ['A1', 'A2'] },
    { template_type: 'WS', type: 'singles', players: ['A3', ''] }
  ] },
  T01_B: { matches: [
    { template_type: 'MD', type: 'doubles', players: ['B1', 'B2'] },
    { template_type: 'WS', type: 'singles', players: ['B3', ''] }
  ] }
};

test('Captain template cards preserve template authority and emphasize event over sequence', () => {
  assert.match(captain, /template_type: t\.type/);
  assert.match(captain, /text-2xl font-black[^`]+\$\{m\.displayType\}/);
  assert.match(captain, /text-\[11px\][^`]+第 \$\{idx\+1\} 盘/);
  assert.doesNotMatch(captain, /id="allowOverlap"/);
  assert.match(captain, /selectedPlayersSet\.has\(playerName\)/);
});

test('Master scan reviews a complete authoritative-template lineup without dispatching', () => {
  const review = reviewHarness(valid).reviewTeamLineup('T01', room, template, roster);
  assert.deepEqual([...review.errors], []);
  const scan = master.slice(master.indexOf('window.handlePushTeamMatches'), master.indexOf('window.confirmTeamDispatch'));
  assert.doesNotMatch(scan, /apiPost\('(?:set_bulk_tasks|dispatch_team_matches)'/);
});

test('Master review fails closed for incomplete, duplicate, foreign, and template-mismatched lineups', () => {
  for (const mutate of [
    data => { delete data.T01_B; },
    data => { data.T01_A.matches[1].players[0] = 'A1'; },
    data => { data.T01_A.matches[1].players[0] = 'B3'; },
    data => { data.T01_A.matches[0].template_type = 'WD'; },
    data => { data.T01_A.matches[0].players[1] = ''; }
  ]) {
    const lineups = structuredClone(valid); mutate(lineups);
    assert.ok(reviewHarness(lineups).reviewTeamLineup('T01', room, template, roster).errors.length > 0);
  }
});

test('a valid room remains dispatchable when another room is incomplete', () => {
  const mixed = structuredClone(valid);
  mixed.T02_A = structuredClone(mixed.T01_A);
  const harness = reviewHarness(mixed);
  const reviews = [
    harness.reviewTeamLineup('T01', room, template, roster),
    harness.reviewTeamLineup('T02', room, template, roster)
  ];
  assert.deepEqual([...harness.selectDispatchableTeamRooms(reviews)], ['T01']);
  assert.equal(reviews[1].errors.some(error => error.includes('未提交排阵')), true);
  assert.match(master, /已排除 · 不下发/);
  assert.match(master, /pendingTeamDispatchRooms = dispatchableRooms/);
  assert.doesNotMatch(master, /reviews\.some\(r => r\.errors\.length\) \? 'disabled'/);
});

test('normal Master UI has only explicit-confirm team dispatch and no placeholder force path', () => {
  assert.doesNotMatch(master, /forceResolveSubMatches|\u5f3a行下发空白对阵|t1p1:\s*'\u5f85定'/);
  assert.match(master, /window\.confirmTeamDispatch/);
  assert.match(master, /apiPost\('dispatch_team_matches'/);
});

test('server dispatch boundary validates all rooms before its atomic task and completion writes', () => {
  const start = php.indexOf("case 'dispatch_team_matches':");
  const end = php.indexOf("case 'set_bulk_tasks':", start);
  const dispatch = php.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(dispatch, /beginTransaction\(\)/);
  assert.match(dispatch, /check_referee_pwd/);
  assert.match(dispatch, /template_type/);
  assert.match(dispatch, /\$name === '\u5f85定' \|\| !isset\(\$roster\[\$name\]\)/);
  assert.match(dispatch, /isset\(\$used\[\$name\]\)/);
  const firstWrite = dispatch.indexOf("kv_set($event_code, 'tasks'");
  assert.ok(firstWrite > dispatch.lastIndexOf('foreach ($requested_rooms as $room) {'), 'writes follow complete validation/build');
  assert.ok(dispatch.indexOf("kv_set($event_code, 'team_event'") > firstWrite);
  assert.ok(dispatch.indexOf('$pdo->commit()') > firstWrite);
  assert.match(dispatch, /rollBack\(\)/);
});

test('event-day Master hides temporary codes and keeps roster management on Player page', () => {
  assert.doesNotMatch(master, /team[AB]Code\s*=\s*'TMP-/);
  assert.match(master, /getAuthoritativeTeamCode/);
  assert.match(master, /\^TMP-/);
  assert.doesNotMatch(master, /id="addMemberModal"|openAddMemberModal|confirmAddMember/);
  assert.match(master, /players\.html\?code=/);
});

test('team submission polling is bounded, display-only, and preserves active review', () => {
  assert.match(master, /setInterval\(refreshTeamRoomStatus, 7000\)/);
  const start = master.indexOf('async function refreshTeamRoomStatus');
  const end = master.indexOf('async function loadDashboard', start);
  const polling = master.slice(start, end);
  assert.match(polling, /apiGet\('get_full_dashboard'\)/);
  assert.doesNotMatch(polling, /apiPost|dispatch_team_matches|teamDispatchReview|pendingTeamDispatchRooms/);
});

test('four mixed rooms render as compact expandable summaries without weakening dispatch selection', () => {
  assert.match(master, /<details class="mb-3 rounded-lg border/);
  assert.match(master, /\u4ea4\u5377：\$\{review\.errors/);
  assert.match(master, /\u76d8\u6570：\$\{review\.rows\.length\}/);
  const mixedReviews = [
    { room: 'T01', errors: [] }, { room: 'T02', errors: ['A 未提交排阵'] },
    { room: 'T03', errors: [] }, { room: 'T04', errors: ['B 未提交排阵'] }
  ];
  const selected = reviewHarness(valid).selectDispatchableTeamRooms(mixedReviews);
  assert.deepEqual([...selected], ['T01', 'T03']);
  assert.match(master, /已排除 · 不下发/);
  assert.match(master, /将于确认后下发/);
});

test('wholesale room clearing is tucked behind an admin recovery disclosure', () => {
  assert.match(master, /<summary[^>]*>管理员恢复操作<\/summary>/);
  assert.match(master, /if \(!confirm\('⚠️ 确定要清空所有团体房间吗/);
  assert.match(master, /clear_all_team_rooms', \{ password: pwd \}/);
});
