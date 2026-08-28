/**
 * validate-rehearsal-package.js 自动化测试（标准三盘版）
 *
 * 运行：node --test Tools/legacy-team-event-rehearsal/validate-rehearsal-package.test.js
 *
 * 覆盖（任务要求的 9 项场景 → T14~T22 为主）：
 *   1. 标准 2 队 × 6 人 × 3 盘 → 通过（T01）
 *   2. 双方各 3 盘 → 预期任务严格为 3（T01 / T14）
 *   3. 一方只有 2 盘 → 失败（T15）
 *   4. 双方盘数不一致 → 失败（T16）
 *   5. 空白选手 → 失败（T17）
 *   6. 非 roster 选手 → 失败（T18）
 *   7. "待定"选手 → 失败（T19）
 *   8. 三盘组合全部来自对应队伍（T01 / T20 / T21）
 *   9. 预演包仍能被 SheetJS 0.18.5 解析（T22 日程 / T24 名单列头，
 *      缺 xlsx 依赖时由 node:test 原生标记 skip，不计入 pass；
 *      T23 断言 roster CSV 固定 UTF-8 BOM）
 *
 * 其余为解析规则回归：名单/日程/匹配/负面用例（T02~T13）。
 * 所有测试使用临时目录，不写入仓库，不包含真实人员信息。
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const DIR = __dirname;
const TOOL = path.join(DIR, 'validate-rehearsal-package.js');
const {
  buildPlayersFromRoster, parseMatchCell, parseScheduleXlsx, validateLineups,
  NAME_REGEX, TEAM_COL_REGEX, GROUP_COL_REGEX, FIXTURE_EVENT,
  REQUIRED_MATCHES_PER_TEAM, EXPECTED_TASK_COUNT,
} = require('./validate-rehearsal-package');
const { xlsxWrite } = require('./lib-xlsx');

// ======================== xlsx 依赖探测（T22/T24：缺失时由 node:test 真正标记 skip） ========================
let XLSX_DEP = null;
try { XLSX_DEP = require('xlsx'); } catch (e) { /* 依赖不可用 */ }
const XLSX_SKIP_REASON = 'node_modules/xlsx 不可用（已由仓库外独立 SheetJS 0.18.5 交叉验证覆盖）';

// ======================== 临时目录管理 ========================
let tmpDir;

function writeTmp(name, content) {
  const fp = path.join(tmpDir, name);
  if (Buffer.isBuffer(content)) fs.writeFileSync(fp, content);
  else fs.writeFileSync(fp, content, 'utf-8');
  return fp;
}

function runValidator(extraArgs) {
  const args = [TOOL, ...(extraArgs || [])];
  try {
    const stdout = execFileSync(process.execPath, args, { encoding: 'utf-8', timeout: 15000 });
    return { exitCode: 0, stdout };
  } catch (e) {
    return { exitCode: e.status || 1, stdout: (e.stdout || '') + (e.stderr || '') };
  }
}

function makeSchedule(vsCells) {
  return xlsxWrite([vsCells]);
}

// ======================== 标准三盘基准数据（全虚构） ========================
const NAMES_A = ['甲一', '甲二', '甲三', '甲四', '甲五', '甲六'];
const NAMES_B = ['乙一', '乙二', '乙三', '乙四', '乙五', '乙六'];

function stdRosterCsv() {
  let csv = '姓名,队名,组别\n';
  for (const n of NAMES_A) csv += `${n},先锋预备队,公开组\n`;
  for (const n of NAMES_B) csv += `${n},铁壁预备队,公开组\n`;
  return csv;
}

function stdLineupDoc(overrides) {
  const doc = {
    event_code: FIXTURE_EVENT,
    room_code: '001',
    lineups: {
      '先锋预备队': [
        { type: 'doubles', format: 1, players: ['甲一', '甲二'] },
        { type: 'doubles', format: 1, players: ['甲三', '甲四'] },
        { type: 'doubles', format: 1, players: ['甲五', '甲六'] },
      ],
      '铁壁预备队': [
        { type: 'doubles', format: 1, players: ['乙一', '乙二'] },
        { type: 'doubles', format: 1, players: ['乙三', '乙四'] },
        { type: 'doubles', format: 1, players: ['乙五', '乙六'] },
      ],
    },
  };
  return Object.assign(doc, overrides || {});
}

function stdPlayers() {
  const { players } = buildPlayersFromRoster(
    ['姓名', '队名', '组别'],
    [...NAMES_A, ...NAMES_B].map(n => [n, n.startsWith('甲') ? '先锋预备队' : '铁壁预备队', '公开组'])
  );
  return players;
}

const KNOWN = {
  '公开组_先锋预备队': { name: '先锋预备队', group: '公开组', code: 'T01' },
  '公开组_铁壁预备队': { name: '铁壁预备队', group: '公开组', code: 'T02' },
};

/** 写入完整标准包（6人×2队 + 日程 + 指定排阵），返回校验参数 */
function writeStdPackage(lineupDoc) {
  const roster = writeTmp('roster.csv', stdRosterCsv());
  const sched = writeTmp('s.xlsx', makeSchedule(['公开组\n先锋预备队\nVS\n铁壁预备队']));
  const lineups = writeTmp('lineups.json', JSON.stringify(lineupDoc));
  return ['--roster', roster, '--schedule', sched, '--lineups', lineups];
}

// ======================== 测试套件 ========================

describe('validate-rehearsal-package（标准三盘）', () => {
  before(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rehearsal-test-'));
  });
  after(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // ========== 场景 1+2：标准包整体通过，任务严格为 3 ==========
  it('T01: 仓库内标准预演包（2队×6人×3盘）整体校验 → exit 0，任务严格 3 场', () => {
    const r = runValidator([]);
    assert.equal(r.exitCode, 0, `应通过，实际输出:\n${r.stdout}`);
    assert.ok(r.stdout.includes('校验通过'), '应输出通过结论');
    assert.ok(r.stdout.includes(FIXTURE_EVENT), '应包含固定预演赛事码');
    assert.ok(r.stdout.includes('001-01') && r.stdout.includes('001-02') && r.stdout.includes('001-03'),
      '应列出严格 3 场预期任务 001-01/02/03');
    assert.ok(!r.stdout.includes('001-04'), '不得出现第 4 场任务');
  });

  // ========== 场景 8：三盘组合全部来自对应队伍（函数级） ==========
  it('T14: validateLineups — 标准双方各 3 盘 → 零错误，任务严格 3', () => {
    const lv = validateLineups(stdLineupDoc(), stdPlayers(), '001');
    assert.deepEqual(lv.errors, [], `不应有错误: ${lv.errors}`);
    assert.equal(lv.taskCount, EXPECTED_TASK_COUNT);
    assert.deepEqual(lv.notes, ['001-01', '001-02', '001-03']);
  });

  // ========== 场景 3：一方只有 2 盘 → 失败 ==========
  it('T15: 一方只有 2 盘 → 校验失败', () => {
    const doc = stdLineupDoc();
    doc.lineups['铁壁预备队'] = doc.lineups['铁壁预备队'].slice(0, 2);
    const lv = validateLineups(doc, stdPlayers(), '001');
    assert.ok(lv.errors.some(e => e.includes('铁壁预备队') && e.includes('2 盘')), '应指明缺盘队伍');
    assert.notEqual(lv.taskCount, EXPECTED_TASK_COUNT);
    // 集成：整体校验 exit 非 0
    const r = runValidator(writeStdPackage(doc));
    assert.notEqual(r.exitCode, 0, '缺盘应阻塞整体校验');
  });

  // ========== 场景 4：双方盘数不一致 → 失败 ==========
  it('T16: 双方盘数不一致（3 vs 2）→ 校验失败', () => {
    const doc = stdLineupDoc();
    doc.lineups['铁壁预备队'] = doc.lineups['铁壁预备队'].slice(0, 2);
    const lv = validateLineups(doc, stdPlayers(), '001');
    assert.ok(lv.errors.some(e => e.includes('盘数不一致')), '应报盘数不一致');
  });

  // ========== 场景 5：空白选手 → 失败 ==========
  it('T17: 空白选手 → 校验失败', () => {
    const doc = stdLineupDoc();
    doc.lineups['先锋预备队'][2].players = ['甲五', ''];
    const lv = validateLineups(doc, stdPlayers(), '001');
    assert.ok(lv.errors.some(e => e.includes('空白')), '应报选手空白');
    const r = runValidator(writeStdPackage(doc));
    assert.notEqual(r.exitCode, 0, '空白选手应阻塞整体校验');
  });

  // ========== 场景 6：非 roster 选手 → 失败 ==========
  it('T18: 非名单选手 → 校验失败', () => {
    const doc = stdLineupDoc();
    doc.lineups['先锋预备队'][2].players = ['甲五', '幽灵选手'];
    const lv = validateLineups(doc, stdPlayers(), '001');
    assert.ok(lv.errors.some(e => e.includes('幽灵选手') && e.includes('大名单')), '应报非名单选手');
    const r = runValidator(writeStdPackage(doc));
    assert.notEqual(r.exitCode, 0);
  });

  // ========== 场景 7："待定"选手 → 失败 ==========
  it('T19: 「待定」占位选手 → 校验失败', () => {
    const doc = stdLineupDoc();
    doc.lineups['铁壁预备队'][2].players = ['待定', '待定'];
    const lv = validateLineups(doc, stdPlayers(), '001');
    assert.ok(lv.errors.some(e => e.includes('待定')), '应拦截待定占位');
    const r = runValidator(writeStdPackage(doc));
    assert.notEqual(r.exitCode, 0, '待定占位应阻塞整体校验');
  });

  // ========== 场景 8 补充：跨队冒名 → 失败 ==========
  it('T20: 选手属于对方队伍 → 校验失败', () => {
    const doc = stdLineupDoc();
    doc.lineups['先锋预备队'][2].players = ['甲五', '乙六'];
    const lv = validateLineups(doc, stdPlayers(), '001');
    assert.ok(lv.errors.some(e => e.includes('乙六') && e.includes('先锋预备队')), '应报跨队冒名');
  });

  // ========== 场景 8 补充：同队重复上场 → 失败 ==========
  it('T21: 同一排阵内选手重复上场 → 校验失败', () => {
    const doc = stdLineupDoc();
    doc.lineups['先锋预备队'][2].players = ['甲一', '甲六'];
    const lv = validateLineups(doc, stdPlayers(), '001');
    assert.ok(lv.errors.some(e => e.includes('甲一') && e.includes('重复上场')), '应拦截重复上场');
  });

  // ========== 场景 9：SheetJS 0.18.5 兼容性（缺 xlsx 时 node:test 原生 skip） ==========
  it('T22: rehearsal-schedule.xlsx 能被 SheetJS 0.18.5 解析', { skip: XLSX_DEP ? false : XLSX_SKIP_REASON }, () => {
    const XLSX = XLSX_DEP;
    assert.equal(XLSX.version, '0.18.5', '必须与 Legacy CDN 同版本');
    const wb = XLSX.read(fs.readFileSync(path.join(DIR, 'rehearsal-schedule.xlsx')), { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const cellTexts = rows.flat().map(c => String(c)).filter(s => s.toUpperCase().includes('VS'));
    assert.equal(cellTexts.length, 1, '应恰有 1 个 VS 单元格');
    const lines = cellTexts[0].split(/\n/).map(s => s.trim()).filter(s => s);
    assert.deepEqual(lines, ['公开组', '先锋预备队', 'VS', '铁壁预备队'], '四行内容与换行保留必须正确');
  });

  it('T23: rehearsal-roster.csv 前三字节为 UTF-8 BOM（EF BB BF）', () => {
    const buf = fs.readFileSync(path.join(DIR, 'rehearsal-roster.csv'));
    assert.deepEqual([buf[0], buf[1], buf[2]], [0xEF, 0xBB, 0xBF], 'roster 必须固定保存为 UTF-8 BOM');
  });

  it('T24: roster CSV 中文列头能被 SheetJS 0.18.5 识别', { skip: XLSX_DEP ? false : XLSX_SKIP_REASON }, () => {
    const XLSX = XLSX_DEP;
    assert.equal(XLSX.version, '0.18.5', '必须与 Legacy CDN 同版本');
    const wb = XLSX.read(fs.readFileSync(path.join(DIR, 'rehearsal-roster.csv')), { type: 'array' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    assert.ok(rows.length >= 1, '应能解析出行');
    const headers = rows[0].map(h => String(h).replace(/^\uFEFF/, '').trim());
    assert.ok(headers.some(h => NAME_REGEX.test(h)), `姓名列头应被识别: ${JSON.stringify(headers)}`);
    assert.ok(headers.some(h => TEAM_COL_REGEX.test(h)), `队名列头应被识别: ${JSON.stringify(headers)}`);
    assert.ok(headers.some(h => GROUP_COL_REGEX.test(h)), `组别列头应被识别: ${JSON.stringify(headers)}`);
    assert.ok(rows.filter(r => r.some(c => String(c).trim())).length >= 13, '应为 1 行表头 + 12 行虚构球员');
  });

  // ========== 回归：名单解析 ==========
  it('T02: 名单解析 — 同队共享 team_code，id_code 唯一', () => {
    const headers = ['姓名', '队名', '组别'];
    const rows = NAMES_A.map(n => [n, '先锋预备队', '公开组']).concat(NAMES_B.map(n => [n, '铁壁预备队', '公开组']));
    const { players } = buildPlayersFromRoster(headers, rows);
    assert.equal(players.length, 12);
    const t1 = players.filter(p => p.team === '先锋预备队');
    assert.ok(t1.every(p => p.team_code === 'T01'), '同队共享 team_code');
    const idCodes = players.map(p => p.id_code);
    assert.equal(new Set(idCodes).size, idCodes.length, '全体 id_code 唯一');
    assert.equal(t1[0].id_code, 'T01-01');
    assert.equal(t1[5].id_code, 'T01-06');
  });

  // ========== 回归：列头正则 ==========
  it('T03: 列头正则 — 与 master.html 常量一致', () => {
    assert.ok(NAME_REGEX.test('姓名'));
    assert.ok(NAME_REGEX.test('运动员'));
    assert.ok(!NAME_REGEX.test('队名'));
    assert.ok(TEAM_COL_REGEX.test('队名'));
    assert.ok(TEAM_COL_REGEX.test('单位'));
    assert.ok(GROUP_COL_REGEX.test('组别'));
    assert.ok(GROUP_COL_REGEX.test('项目名称'));
  });

  // ========== 回归：日程建房 ==========
  it('T04: parseMatchCell — 标准四行 VS 单元格建房成功', () => {
    const m = parseMatchCell('公开组\n先锋预备队\nVS\n铁壁预备队', KNOWN);
    assert.ok(m);
    assert.equal(m.group, '公开组');
    assert.equal(m.t1.code, 'T01');
    assert.equal(m.t2.code, 'T02');
  });

  it('T05: parseMatchCell — 含决赛/胜方等字眼不建房', () => {
    assert.equal(parseMatchCell('决赛\n先锋预备队\nVS\n铁壁预备队', KNOWN), null);
    assert.equal(parseMatchCell('半决赛\nA\nVS\nB', KNOWN), null);
    assert.equal(parseMatchCell('胜方\nVS\n负方', KNOWN), null);
  });

  it('T06: parseMatchCell — 无独立 VS 行返回 null', () => {
    assert.equal(parseMatchCell('公开组\n先锋预备队 铁壁预备队', KNOWN), null);
    assert.equal(parseMatchCell('公开组\n先锋预备队VS铁壁预备队', KNOWN), null);
  });

  it('T07: parseScheduleXlsx — 从生成的 xlsx 建房', () => {
    const xlsxPath = writeTmp('sched.xlsx', makeSchedule(['公开组\n先锋预备队\nVS\n铁壁预备队']));
    const matches = parseScheduleXlsx(xlsxPath, KNOWN);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].t1.name, '先锋预备队');
  });

  it('T08: 日程组别与名单组别不一致 → 无法获得 team_code', () => {
    const m = parseMatchCell('常青组\n先锋预备队\nVS\n铁壁预备队', KNOWN);
    assert.ok(m);
    assert.equal(m.t1.code, '', '组别不匹配时不继承 code');
  });

  it('T09: 队名互含（子串）也能匹配', () => {
    const m = parseMatchCell('公开组\n先锋\nVS\n铁壁', KNOWN);
    assert.ok(m);
    assert.equal(m.t1.name, '先锋预备队');
    assert.equal(m.t1.code, 'T01');
  });

  // ========== 回归：负面用例（单维度，跳过排阵） ==========
  it('T10: 名单缺姓名列 → 整体校验 exit 非 0', () => {
    const roster = writeTmp('bad-roster.csv', '队名,组别\n先锋预备队,公开组\n');
    const sched = writeTmp('s.xlsx', makeSchedule(['公开组\n先锋预备队\nVS\n铁壁预备队']));
    const r = runValidator(['--roster', roster, '--schedule', sched, '--lineups', 'none']);
    assert.notEqual(r.exitCode, 0);
    assert.ok(r.stdout.includes('姓名列'));
  });

  it('T11: 日程队名与名单不匹配 → 整体校验 exit 非 0', () => {
    const roster = writeTmp('roster.csv', stdRosterCsv());
    const sched = writeTmp('s.xlsx', makeSchedule(['公开组\n幽灵队\nVS\n铁壁预备队']));
    const r = runValidator(['--roster', roster, '--schedule', sched, '--lineups', 'none']);
    assert.notEqual(r.exitCode, 0);
    assert.ok(r.stdout.includes('幽灵队'));
  });

  it('T12: 队伍人数 < 6（标准三盘需求）→ 整体校验 exit 非 0', () => {
    const roster = writeTmp('roster.csv', '姓名,队名,组别\n甲一,先锋预备队,公开组\n甲二,先锋预备队,公开组\n乙一,铁壁预备队,公开组\n乙二,铁壁预备队,公开组\n');
    const sched = writeTmp('s.xlsx', makeSchedule(['公开组\n先锋预备队\nVS\n铁壁预备队']));
    const r = runValidator(['--roster', roster, '--schedule', sched, '--lineups', 'none']);
    assert.notEqual(r.exitCode, 0, '每队 2 人无法排标准三盘双打，应阻塞');
    assert.ok(r.stdout.includes('6 名不同球员'), '应指明标准三盘人数需求');
  });

  it('T13: 固定预演赛事码为 ' + FIXTURE_EVENT, () => {
    assert.equal(FIXTURE_EVENT, 'TEAM-REHEARSAL-20260825');
    assert.equal(REQUIRED_MATCHES_PER_TEAM, 3);
    assert.equal(EXPECTED_TASK_COUNT, 3);
  });
});
