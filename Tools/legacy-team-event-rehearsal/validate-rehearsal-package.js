#!/usr/bin/env node
/**
 * validate-rehearsal-package.js — 团体赛最小预演包离线一致性校验
 *
 * 只读校验，不写数据库、不触碰 Legacy 业务代码。
 *
 * 校验内容：
 *   1. rehearsal-roster.csv 能否被 master.html handleImportSignFile 正确解析
 *   2. rehearsal-schedule.xlsx 能否被 master.html handleImportTeamFile/parseMatchCell 正确建房
 *   3. 日程中的队伍/组别与大名单严格匹配（复刻 matchDb 匹配规则）
 *   4. rehearsal-lineups.json 标准三盘排阵严格校验（双方各 3 盘、盘数一致、
 *      选手全部来自对应队伍 roster、无空白/无"待定"、同队无重复上场、
 *      核碰预期任务严格为 3 场）
 *   5. 每队人数满足标准三盘双打需求（3 盘 × 2 人，禁止重复上场 → 6 人）
 *
 * 用法：
 *   node validate-rehearsal-package.js
 *   node validate-rehearsal-package.js --roster <path> --schedule <path> --lineups <path>
 *
 * 退出码：0 = 全部通过；非 0 = 存在阻塞性问题
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { xlsxRead } = require('./lib-xlsx');

// ======================== Legacy 常量（与 master.html 一致） ========================
// master.html L446
const NAME_REGEX = /姓名|名单|参赛搭档|选手|运动员/i;
// master.html L2354
const TEAM_COL_REGEX = /队名|单位|学校|队伍/;
// master.html L2355
const GROUP_COL_REGEX = /项目名称|组别|所在小组|项目/i;
// master.html L444
const SPLIT_REGEX = /[\+＋\/／、＆&\|]/;
// master.html parseMatchCell L2465：含这些字眼的单元格不建房
const INVALID_CELL_REGEX = /半决赛|决赛|胜方|负方|名|交叉/;
// master.html parseMatchCell L2471：组别提取
const GROUP_EXTRACT_REGEX = /(公开|常青|青年|中年|U\d+)[A-Za-z0-9_]*组?/;

const FIXTURE_EVENT = 'TEAM-REHEARSAL-20260825';
// 标准三盘双打：3 盘 × 每盘 2 人，同一排阵内禁止同一球员重复上场（team_lineup.html L432-433）
const MIN_PLAYERS_PER_TEAM = 6;
// team_lineup.html L397 默认模板即 3 盘双打；预演标准固定 3 盘，禁止依赖较少方截断（master.html L2283）
const REQUIRED_MATCHES_PER_TEAM = 3;
// master.html L2283-2287：双方各 3 盘 → 严格生成 3 场任务 ${room}-01/02/03
const EXPECTED_TASK_COUNT = 3;
// master.html L2295 强发路径产物；referee.html L738 显式排除。标准预演包严禁出现（禁止强发空白对阵）
const FORBIDDEN_PLAYER_NAMES = ['待定'];

// ======================== 结果收集 ========================
const issues = [];
const infos = [];
function p0(msg) { issues.push(`[P0 阻塞] ${msg}`); }
function info(msg) { infos.push(`[信息] ${msg}`); }

// ======================== CSV 解析（复刻 handleImportSignFile） ========================
function stripBOM(text) { return text.replace(/^\uFEFF/, ''); }

function parseRosterCSV(filePath) {
  const raw = stripBOM(fs.readFileSync(filePath, 'utf-8'));
  // 简单 CSV 解析（预演名单无引号转义需求）
  const lines = raw.split(/\r?\n/).filter(l => l.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(l => l.split(',').map(c => c.trim()));
  return { headers, rows };
}

function buildPlayersFromRoster(headers, rows) {
  // 复刻 master.html L2350-2405 列定位与 team_code 分配
  const nameIdx = headers.findIndex(h => NAME_REGEX.test(String(h)));
  const teamIdx = headers.findIndex(h => TEAM_COL_REGEX.test(String(h)));
  const groupIdx = headers.findIndex(h => GROUP_COL_REGEX.test(String(h)));
  if (nameIdx === -1) return { players: [], nameIdx, teamIdx, groupIdx };

  const teamCodeMap = {};
  const teamPlayerCounters = {};
  let globalTeamCounter = 0;
  let currentTeamName = '未知队伍', currentGroupName = '系统池';
  const players = [];

  for (const row of rows) {
    let name = String(row[nameIdx] || '').trim();
    if (!name) continue;
    name = name.replace(/^\d+[.、\s]+|^\d+号\s*/, '').trim();
    const rowTeam = teamIdx !== -1 ? String(row[teamIdx] || '').trim() : '';
    const rowGroup = groupIdx !== -1 ? String(row[groupIdx] || '').trim() : '';
    if (rowTeam) currentTeamName = rowTeam.replace(/[\r\n]+/g, '');
    if (rowGroup) currentGroupName = rowGroup.replace(/[\r\n]+/g, '');
    if (!teamCodeMap[currentTeamName]) {
      globalTeamCounter++;
      teamCodeMap[currentTeamName] = 'T' + String(globalTeamCounter).padStart(2, '0');
    }
    const teamCode = teamCodeMap[currentTeamName];
    if (!teamPlayerCounters[currentTeamName]) teamPlayerCounters[currentTeamName] = 0;
    const names = name.split(SPLIT_REGEX).map(s => s.trim()).filter(s => s);
    for (const n of names) {
      const exists = players.find(p => p.name === n && p.team === currentTeamName);
      if (!exists) {
        teamPlayerCounters[currentTeamName]++;
        players.push({
          id_code: `${teamCode}-${String(teamPlayerCounters[currentTeamName]).padStart(2, '0')}`,
          team_code: teamCode,
          group: currentGroupName,
          name: n,
          team: currentTeamName,
          checked_in: false,
        });
      }
    }
  }
  return { players, nameIdx, teamIdx, groupIdx };
}

// ======================== 日程解析（复刻 handleImportTeamFile + parseMatchCell） ========================
function parseMatchCell(cellText, knownTeams) {
  // L2465 严苛过滤
  if (INVALID_CELL_REGEX.test(cellText)) return null;
  // L2467 拆行
  const lines = cellText.split(/\n|<br\s*\/?>/i).map(s => s.trim()).filter(s => s);
  // L2468 找独立 VS 行
  const vsIdx = lines.findIndex(l => l.toUpperCase() === 'VS');
  if (vsIdx === -1) return null;
  // L2471 组别提取
  const groupMatch = cellText.match(GROUP_EXTRACT_REGEX);
  let groupName = groupMatch ? groupMatch[0] : '未知组';
  if (!groupName.includes('组') && groupName !== '未知组') groupName += '组';
  const groupPrefix = groupName.includes('公开') ? 'G-' : (groupName.includes('常青') ? 'C-' : '');

  const parseTeam = (block) => {
    let code = ''; let name = '';
    for (const line of block) {
      if (/紧跟前场|第\d+轮|时间|场地/.test(line) || line === groupName) continue;
      const codeMatch = line.match(/^([A-Z])组?(\d+)\s*(.*)/);
      if (codeMatch) { code = groupPrefix + codeMatch[1] + codeMatch[2]; name = codeMatch[3]; break; }
    }
    if (!name) {
      for (const line of block) {
        if (/紧跟前场|第\d+轮|时间|场地/.test(line) || line === groupName) continue;
        if (!line.startsWith('(') && !line.startsWith('（') && !line.startsWith('[')) { name = line; break; }
      }
    }
    if (name) name = name.replace(/[\(（\[].*?[\)）\]]/g, '').replace(/[\)）\]]/g, '').trim();
    return { code, name, group: groupName };
  };

  const t1 = parseTeam(lines.slice(0, vsIdx));
  const t2 = parseTeam(lines.slice(vsIdx + 1));
  if (!t1.name || !t2.name) return null;

  // L2500-2506 matchDb：与已知队伍匹配
  const matchDb = (t) => {
    const bestKey = Object.keys(knownTeams).find(kt => {
      const dbInfo = knownTeams[kt];
      return dbInfo.group === t.group && (dbInfo.name.includes(t.name) || t.name.includes(dbInfo.name));
    });
    if (bestKey) { t.name = knownTeams[bestKey].name; if (!t.code) t.code = knownTeams[bestKey].code; }
  };
  matchDb(t1); matchDb(t2);
  return { t1, t2, group: groupName };
}

function parseScheduleXlsx(filePath, knownTeams) {
  const rows = xlsxRead(fs.readFileSync(filePath));
  const matches = [];
  for (const row of rows) {
    for (const cell of row) {
      const text = String(cell || '').trim();
      if (text.toUpperCase().includes('VS')) {
        const m = parseMatchCell(text, knownTeams);
        if (m) matches.push(m);
      }
    }
  }
  return matches;
}

// ======================== 排阵严格校验（标准三盘） ========================
/**
 * 校验双方排阵是否满足标准三盘团体赛：
 *   - 双方各 REQUIRED_MATCHES_PER_TEAM 盘且盘数一致（禁止依赖 master.html L2283 较少方截断）
 *   - 每盘双打 2 名选手，无空白、无 FORBIDDEN_PLAYER_NAMES（"待定"）
 *   - 选手全部来自对应队伍的大名单（复刻 team_lineup.html L374 按队过滤）
 *   - 同一排阵内同一球员不得重复上场（team_lineup.html L432-433 selectedPlayersSet）
 *   - 核碰预期任务数严格为 EXPECTED_TASK_COUNT（master.html L2283-2287）
 */
function validateLineups(lineupsDoc, players, roomCode) {
  const errs = []; const notes = [];
  const lineups = (lineupsDoc && lineupsDoc.lineups) || {};
  const teams = Object.keys(lineups);
  if (teams.length !== 2) {
    return { errors: [`排阵必须恰好包含 2 支队伍（实际 ${teams.length} 支）`], notes: [], taskCount: 0 };
  }
  const rosterByTeam = {};
  for (const p of players) {
    if (!rosterByTeam[p.team]) rosterByTeam[p.team] = new Set();
    rosterByTeam[p.team].add(p.name);
  }
  const counts = [];
  for (const teamName of teams) {
    const ms = lineups[teamName];
    if (!Array.isArray(ms)) { errs.push(`${teamName} 排阵不是数组`); counts.push(0); continue; }
    counts.push(ms.length);
    if (ms.length !== REQUIRED_MATCHES_PER_TEAM) {
      errs.push(`${teamName} 提交 ${ms.length} 盘，标准要求恰好 ${REQUIRED_MATCHES_PER_TEAM} 盘双打（禁止依赖较少方截断）`);
    }
    const used = new Set();
    ms.forEach((m, i) => {
      const label = `${teamName} 第 ${i + 1} 盘`;
      const ps = (m && Array.isArray(m.players)) ? m.players : [];
      const need = (m && m.type === 'singles') ? 1 : 2;
      for (let k = 0; k < need; k++) {
        const nm = String(ps[k] === undefined ? '' : ps[k]).trim();
        if (!nm) { errs.push(`${label} 选手空白（team_lineup.html L520-530 提交前会拦截空盘）`); continue; }
        if (FORBIDDEN_PLAYER_NAMES.includes(nm)) { errs.push(`${label} 含禁止占位名「${nm}」（强发空白对阵产物，标准预演严禁）`); continue; }
        if (!rosterByTeam[teamName] || !rosterByTeam[teamName].has(nm)) {
          errs.push(`${label} 选手「${nm}」不在 ${teamName} 大名单中`); continue;
        }
        if (used.has(nm)) { errs.push(`${label} 选手「${nm}」在同一排阵内重复上场（team_lineup.html L432-433 禁止）`); continue; }
        used.add(nm);
      }
    });
  }
  if (counts[0] !== counts[1]) {
    errs.push(`双方盘数不一致（${counts[0]} vs ${counts[1]}），标准预演要求双方各 ${REQUIRED_MATCHES_PER_TEAM} 盘`);
  }
  const taskCount = Math.min(counts[0], counts[1]);
  if (taskCount !== EXPECTED_TASK_COUNT) {
    errs.push(`核碰预期任务数为 ${taskCount}，标准要求严格 ${EXPECTED_TASK_COUNT} 场（${roomCode}-01 ~ ${roomCode}-${String(EXPECTED_TASK_COUNT).padStart(2, '0')}）`);
  } else {
    for (let i = 1; i <= EXPECTED_TASK_COUNT; i++) notes.push(`${roomCode}-${String(i).padStart(2, '0')}`);
  }
  return { errors: errs, notes, taskCount };
}

// ======================== 主流程 ========================
function main() {
  const args = process.argv.slice(2);
  const getArg = (flag, def) => {
    const i = args.indexOf(flag);
    return i !== -1 && args[i + 1] ? args[i + 1] : def;
  };
  const dir = __dirname;
  const rosterPath = getArg('--roster', path.join(dir, 'rehearsal-roster.csv'));
  const schedulePath = getArg('--schedule', path.join(dir, 'rehearsal-schedule.xlsx'));
  const lineupsPath = getArg('--lineups', path.join(dir, 'rehearsal-lineups.json'));

  console.log('═══════════════════════════════════════════════════════');
  console.log(' Legacy 团体赛最小预演包 — 离线一致性校验');
  console.log(` 预演赛事码: ${FIXTURE_EVENT}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // ---------- 1. 名单 ----------
  console.log('▶ 步骤 1/5：校验大名单 rehearsal-roster.csv');
  if (!fs.existsSync(rosterPath)) {
    p0(`名单文件不存在: ${rosterPath}`);
  } else {
    const { headers, rows } = parseRosterCSV(rosterPath);
    info(`列头: ${JSON.stringify(headers)}`);
    if (!headers.some(h => NAME_REGEX.test(h))) {
      p0('缺少姓名列（NAME_REGEX: /姓名|名单|参赛搭档|选手|运动员/i），master.html 将跳过该表');
    }
    if (!headers.some(h => TEAM_COL_REGEX.test(h))) {
      p0('缺少队名列（/队名|单位|学校|队伍/），所有球员将归入"未知队伍"');
    }
    if (!headers.some(h => GROUP_COL_REGEX.test(h))) {
      p0('缺少组别列（/项目名称|组别|所在小组|项目/），日程组别将无法匹配');
    }
    // 空姓名 / 分隔符误用
    const nameIdx = headers.findIndex(h => NAME_REGEX.test(h));
    rows.forEach((r, i) => {
      const nm = String(r[nameIdx] || '').trim();
      if (!nm) p0(`第 ${i + 2} 行姓名为空`);
      else if (SPLIT_REGEX.test(nm)) p0(`第 ${i + 2} 行姓名含组合分隔符（${nm}），团体赛应为单人姓名`);
    });
  }

  // 构建球员库
  const rosterParsed = fs.existsSync(rosterPath) ? parseRosterCSV(rosterPath) : { headers: [], rows: [] };
  const { players } = buildPlayersFromRoster(rosterParsed.headers, rosterParsed.rows);
  info(`解析出球员 ${players.length} 人`);

  // 队伍聚合
  const teamMap = {};
  for (const p of players) {
    const key = `${p.group}_${p.team}`;
    if (!teamMap[key]) teamMap[key] = { name: p.team, group: p.group, code: p.team_code, players: [] };
    teamMap[key].players.push(p.name);
  }
  const knownTeams = teamMap; // 复刻 handleImportTeamFile L2433-2436

  console.log('  队伍清单:');
  for (const key of Object.keys(teamMap)) {
    const t = teamMap[key];
    console.log(`    ${t.code}  ${t.name}（${t.group}）— ${t.players.length} 人: ${t.players.join('、')}`);
  }

  // 每队人数下限（双打最小 2 人/盘）
  for (const key of Object.keys(teamMap)) {
    const t = teamMap[key];
    if (t.players.length < MIN_PLAYERS_PER_TEAM) {
      p0(`队伍 ${t.name} 仅 ${t.players.length} 人，标准三盘双打需 ${MIN_PLAYERS_PER_TEAM} 名不同球员（3 盘×2 人，同一排阵禁止重复上场，team_lineup.html L432-433）`);
    }
  }

  // ---------- 2. 日程 ----------
  console.log('\n▶ 步骤 2/5：校验日程 rehearsal-schedule.xlsx');
  let matches = [];
  if (!fs.existsSync(schedulePath)) {
    p0(`日程文件不存在: ${schedulePath}`);
  } else {
    matches = parseScheduleXlsx(schedulePath, knownTeams);
    info(`建房解析出 ${matches.length} 场团体对抗`);
    if (matches.length === 0) {
      p0('日程未能解析出任何对阵房间（检查 VS 单元格格式与组别/队名）');
    }
  }

  // ---------- 3. 日程 ↔ 名单交叉匹配 ----------
  console.log('\n▶ 步骤 3/5：日程与名单交叉匹配');
  matches.forEach((m, i) => {
    for (const side of [m.t1, m.t2]) {
      const hit = Object.values(knownTeams).find(t =>
        t.group === side.group && (t.name.includes(side.name) || side.name.includes(t.name)));
      if (!hit) {
        p0(`第 ${i + 1} 场队伍「${side.name}」（${side.group}）在大名单中找不到匹配（组别须精确相等且队名互含）`);
      } else {
        info(`第 ${i + 1} 场「${side.name}」→ 匹配名单队 ${hit.name}（${hit.code}）`);
      }
    }
    if (!m.t1.code) p0(`第 ${i + 1} 场左队未获得 team_code（将回退默认值，可能覆盖错误）`);
    if (!m.t2.code) p0(`第 ${i + 1} 场右队未获得 team_code（将回退默认值，可能覆盖错误）`);
  });

  // ---------- 4. 排阵严格校验（标准三盘） ----------
  console.log('\n▶ 步骤 4/5：排阵严格校验（标准三盘）');
  let roomCode = '001';
  let lineupsDoc = null;
  if (lineupsPath === 'none') {
    info('跳过排阵校验（--lineups none，仅限单项负面测试使用）');
  } else if (!fs.existsSync(lineupsPath)) {
    p0(`排阵文件不存在: ${lineupsPath}`);
  } else {
    try { lineupsDoc = JSON.parse(fs.readFileSync(lineupsPath, 'utf-8')); }
    catch (e) { p0(`排阵文件解析失败: ${e.message}`); }
    if (lineupsDoc) {
      if (lineupsDoc.event_code !== FIXTURE_EVENT) p0(`排阵赛事码 ${lineupsDoc.event_code} ≠ 固定预演码 ${FIXTURE_EVENT}`);
      if (lineupsDoc.room_code) roomCode = lineupsDoc.room_code;
      const lv = validateLineups(lineupsDoc, players, roomCode);
      lv.errors.forEach(e => p0(e));
      lv.notes.forEach(id => info(`核碰预期任务: ${id}`));
      if (lv.errors.length === 0) {
        info(`双方各 ${REQUIRED_MATCHES_PER_TEAM} 盘，核碰严格生成 ${lv.taskCount} 场任务`);
        if (Array.isArray(lineupsDoc.expected_tasks)) {
          const expect = lv.notes.join(',');
          const given = lineupsDoc.expected_tasks.join(',');
          if (expect !== given) p0(`fixture expected_tasks（${given}）与推导任务（${expect}）不一致`);
        }
      }
    }
  }

  // ---------- 5. 最小链路规模 ----------
  console.log('\n▶ 步骤 5/5：标准三盘可运行规模核验');
  const teamCount = Object.keys(teamMap).length;
  const matchCount = matches.length;
  info(`队伍数 ${teamCount}，球员数 ${players.length}，对阵房间数 ${matchCount}`);
  if (teamCount < 2) p0('至少需要 2 支队伍才能组成对阵');
  if (matchCount < 1) p0('至少需要 1 场团体对抗才能走通核碰下发');
  // ---------- 汇总 ----------
  console.log('\n═══════════════════════════════════════════════════════');
  infos.forEach(m => console.log('  ' + m));
  if (issues.length === 0) {
    console.log('\n  ✅ 预演包一致性校验通过，可进入隔离赛事浏览器预演。');
    console.log(`     建议赛事码：${FIXTURE_EVENT}\n`);
    process.exit(0);
  } else {
    console.log('\n  ❌ 发现阻塞性问题：');
    issues.forEach(m => console.log('    ' + m));
    console.log('');
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = {
  parseRosterCSV, buildPlayersFromRoster, parseMatchCell, parseScheduleXlsx, validateLineups,
  NAME_REGEX, TEAM_COL_REGEX, GROUP_COL_REGEX, SPLIT_REGEX,
  INVALID_CELL_REGEX, GROUP_EXTRACT_REGEX, FIXTURE_EVENT,
  MIN_PLAYERS_PER_TEAM, REQUIRED_MATCHES_PER_TEAM, EXPECTED_TASK_COUNT, FORBIDDEN_PLAYER_NAMES,
};
