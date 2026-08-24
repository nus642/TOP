/**
 * team-code-logic.test.js — team_code 冻结修复自动化测试
 *
 * 运行：node --test Tools/legacy-team-event-readiness/team-code-logic.test.js
 *
 * 所有测试使用内存数据，不写入仓库，不包含真实人员信息。
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { parseCSV, processImport, resolveTeamPrefix, buildPlayersUrl } = require('./team-code-logic');

// ======================== 辅助函数 ========================

/** 快捷执行一次导入 */
function runImport(csvText, existingPlayers) {
  const parsed = parseCSV(csvText);
  const dbPlayers = existingPlayers ? existingPlayers.map(p => ({ ...p })) : [];
  const result = processImport(parsed.rows, parsed.nameIdx, parsed.teamIdx, parsed.groupIdx, dbPlayers);
  return { players: dbPlayers, ...result };
}

/** 提取所有 player 的 id_code */
function allIdCodes(players) {
  return players.map(p => p.id_code);
}

/** 提取所有 player 的 team_code */
function allTeamCodes(players) {
  return [...new Set(players.map(p => p.team_code))];
}

/** 按队名筛选球员 */
function teamPlayers(players, teamName) {
  return players.filter(p => p.team === teamName);
}

// ======================== 测试用例 ========================

describe('team_code 冻结修复', () => {

  // ---------- 1. 基本场景：2 队 × 3 人 ----------
  it('T01: 2 队 × 3 人 — 每队共享 team_code，两队不同', () => {
    const csv = `姓名,队名,组别\n张三,猛虎队,公开组\n李四,猛虎队,公开组\n王五,猛虎队,公开组\n赵六,飞龙队,公开组\n钱七,飞龙队,公开组\n孙八,飞龙队,公开组\n`;
    const r = runImport(csv);

    // 导入 6 人
    assert.equal(r.added, 6, '应导入 6 人');
    assert.equal(r.players.length, 6, '球员总数 6');

    // 每队只有一个 team_code
    const tigers = teamPlayers(r.players, '猛虎队');
    const dragons = teamPlayers(r.players, '飞龙队');
    assert.equal(tigers.length, 3, '猛虎队 3 人');
    assert.equal(dragons.length, 3, '飞龙队 3 人');

    const tigerCodes = allTeamCodes(tigers);
    const dragonCodes = allTeamCodes(dragons);
    assert.equal(tigerCodes.length, 1, '猛虎队只有一个 team_code');
    assert.equal(dragonCodes.length, 1, '飞龙队只有一个 team_code');
    assert.notEqual(tigerCodes[0], dragonCodes[0], '两队 team_code 不同');

    // 6 个不同的 player id_code
    const ids = allIdCodes(r.players);
    assert.equal(new Set(ids).size, 6, '6 个不同的 id_code');

    // id_code 格式：team_code-XX
    for (const p of tigers) {
      assert.ok(p.id_code.startsWith(tigerCodes[0] + '-'), `id_code 应以 team_code 开头: ${p.id_code}`);
    }
    for (const p of dragons) {
      assert.ok(p.id_code.startsWith(dragonCodes[0] + '-'), `id_code 应以 team_code 开头: ${p.id_code}`);
    }
  });

  // ---------- 2. 重复导入稳定性 ----------
  it('T02: 重复导入同一 CSV — team_code 和 id_code 稳定', () => {
    const csv = `姓名,队名,组别\n张三,猛虎队,公开组\n李四,猛虎队,公开组\n王五,猛虎队,公开组\n赵六,飞龙队,公开组\n钱七,飞龙队,公开组\n孙八,飞龙队,公开组\n`;

    // 第一次导入
    const r1 = runImport(csv);
    assert.equal(r1.added, 6);

    // 第二次导入（已有球员）
    const r2 = runImport(csv, r1.players);
    assert.equal(r2.added, 0, '重复导入不应新增');
    assert.equal(r2.players.length, 6, '球员总数不变');

    // id_code 和 team_code 完全一致
    for (let i = 0; i < r1.players.length; i++) {
      assert.equal(r2.players[i].id_code, r1.players[i].id_code, `id_code 应稳定: ${r1.players[i].name}`);
      assert.equal(r2.players[i].team_code, r1.players[i].team_code, `team_code 应稳定: ${r1.players[i].name}`);
    }
  });

  // ---------- 3. UTF-8 BOM CSV ----------
  it('T03: UTF-8 BOM CSV — 正常解析', () => {
    const csvBody = `姓名,队名,组别\n张三,猛虎队,公开组\n李四,猛虎队,公开组\n王五,猛虎队,公开组\n`;
    const bom = '\uFEFF';
    const r = runImport(bom + csvBody);

    assert.equal(r.added, 3, 'BOM CSV 应正常导入 3 人');
    const tigerCodes = allTeamCodes(r.players);
    assert.equal(tigerCodes.length, 1, '同队共享一个 team_code');
  });

  // ---------- 4. 中文队名 — team_code 不含中文 ----------
  it('T04: 中文队名 — team_code 为短码（T01），不是完整队名', () => {
    const csv = `姓名,队名,组别\n张三,恒兆国际匹克球俱乐部,公开组\n李四,恒兆国际匹克球俱乐部,公开组\n王五,恒兆国际匹克球俱乐部,公开组\n`;
    const r = runImport(csv);

    assert.equal(r.added, 3);
    for (const p of r.players) {
      assert.equal(p.team_code, 'T01', '中文长队名应映射为 T01');
      assert.ok(!p.id_code.includes('恒兆'), `id_code 不应包含完整队名: ${p.id_code}`);
      assert.ok(p.id_code.startsWith('T01-'), `id_code 应以 T01- 开头: ${p.id_code}`);
    }
  });

  // ---------- 5. 多队伍 — 每队独立编号 ----------
  it('T05: 11 支队伍 — 每队独立编号，不冲突', () => {
    let csv = '姓名,队名,组别\n';
    for (let t = 1; t <= 11; t++) {
      for (let p = 1; p <= 3; p++) {
        csv += `球员${t}-${p},队伍${t}号,公开组\n`;
      }
    }
    const r = runImport(csv);

    assert.equal(r.added, 33, '导入 33 人');

    // 检查每队只有一个 team_code
    for (let t = 1; t <= 11; t++) {
      const members = teamPlayers(r.players, `队伍${t}号`);
      assert.equal(members.length, 3, `队伍${t}号 3 人`);
      const codes = allTeamCodes(members);
      assert.equal(codes.length, 1, `队伍${t}号 只有一个 team_code`);
    }

    // 33 个不同的 id_code
    const allIds = allIdCodes(r.players);
    assert.equal(new Set(allIds).size, 33, '33 个不同的 id_code');

    // 11 个不同的 team_code
    const allTC = allTeamCodes(r.players);
    assert.equal(new Set(allTC).size, 11, '11 个不同的 team_code');
  });

  // ---------- 6. 搭档格式（+ 分隔） ----------
  it('T06: 搭档格式（姓名含 + 分隔）— 两人都归入同队', () => {
    const csv = `姓名,队名,组别\n张三+李四,猛虎队,公开组\n王五,猛虎队,公开组\n`;
    const r = runImport(csv);

    assert.equal(r.added, 3, '搭档拆分为 2 人 + 1 人 = 3 人');
    const tigers = teamPlayers(r.players, '猛虎队');
    assert.equal(tigers.length, 3);
    assert.equal(allTeamCodes(tigers).length, 1, '同队共享 team_code');

    const ids = allIdCodes(tigers);
    assert.equal(new Set(ids).size, 3, '3 个不同 id_code');
  });

  // ---------- 7. 已有球员时新球员追加 ----------
  it('T07: 已有球员时追加新球员 — team_code 延续', () => {
    const existing = [
      { id_code: 'T01-01', team_code: 'T01', name: '张三', team: '猛虎队', group: '公开组', checked_in: true, position: 1 }
    ];
    const csv = `姓名,队名,组别\n张三,猛虎队,公开组\n李四,猛虎队,公开组\n王五,飞龙队,公开组\n`;
    const r = runImport(csv, existing);

    assert.equal(r.added, 2, '张三已存在，新增李四+王五');
    assert.equal(r.players.length, 3);

    // 张三保持原有 team_code
    const zhang = r.players.find(p => p.name === '张三');
    assert.equal(zhang.team_code, 'T01', '张三保持 T01');
    assert.equal(zhang.id_code, 'T01-01', '张三 id_code 不变');

    // 李四继承猛虎队的 T01
    const li = r.players.find(p => p.name === '李四');
    assert.equal(li.team_code, 'T01', '李四继承 T01');
    assert.equal(li.id_code, 'T01-02', '李四 id_code 为 T01-02');

    // 王五是飞龙队，分配新 team_code
    const wang = r.players.find(p => p.name === '王五');
    assert.notEqual(wang.team_code, 'T01', '王五不是 T01');
    assert.equal(wang.team_code, 'T02', '飞龙队分配 T02');
  });

  // ---------- 8. 空行和空姓名跳过 ----------
  it('T08: 空行和空姓名 — 跳过不报错', () => {
    const csv = `姓名,队名,组别\n张三,猛虎队,公开组\n,猛虎队,公开组\n\n李四,猛虎队,公开组\n`;
    const r = runImport(csv);
    assert.equal(r.added, 2, '空行跳过，只导入 2 人');
  });

  // ---------- 9. 无队名列时的默认处理 ----------
  it('T09: 无队名列 — 所有球员归入默认队', () => {
    const csv = `姓名,组别\n张三,公开组\n李四,公开组\n`;
    const r = runImport(csv);
    assert.equal(r.added, 2);
    // 所有球员归入 "未知队伍"
    for (const p of r.players) {
      assert.equal(p.team, '未知队伍');
      assert.equal(p.team_code, 'T01', '共享默认 team_code');
    }
  });

  // ---------- 10. team_code 字段存在于每个 player 对象 ----------
  it('T10: 每个 player 对象都包含 team_code 字段', () => {
    const csv = `姓名,队名,组别\n张三,猛虎队,公开组\n李四,飞龙队,公开组\n`;
    const r = runImport(csv);
    for (const p of r.players) {
      assert.ok(p.team_code, `player ${p.name} 应有 team_code`);
      assert.ok(typeof p.team_code === 'string', 'team_code 应为字符串');
      assert.ok(/^T\d{2}$/.test(p.team_code), `team_code 格式应为 TXX: ${p.team_code}`);
    }
  });

  // ---------- 11. 大量队伍（>9 时编号不丢失前导零） ----------
  it('T11: 超过 9 支队伍 — 编号保持两位（T10, T11…）', () => {
    let csv = '姓名,队名,组别\n';
    for (let t = 1; t <= 12; t++) {
      csv += `球员${t},队伍${t},公开组\n`;
    }
    const r = runImport(csv);
    assert.equal(r.added, 12);

    // 检查 T10, T11, T12 格式正确
    const lastPlayer = r.players[r.players.length - 1];
    assert.ok(/^T\d{2}$/.test(lastPlayer.team_code), `team_code 保持两位: ${lastPlayer.team_code}`);
  });

  // ---------- 12. 模拟真实场景：84 人 11 队 ----------
  it('T12: 真实场景 — 84 人 11 队，每队 team_code 唯一', () => {
    const teamNames = [
      '恒兆国际匹克球俱乐部', '飞鹰匹克球队', '阳光运动队',
      '海浪匹克球会', '北极星俱乐部', '雷霆战队',
      '凤凰体育会', '龙腾匹克球', '银河战队',
      '飓风俱乐部', '巅峰运动队'
    ];
    let csv = '姓名,队名,组别\n';
    let totalPlayers = 0;
    // 分配 84 人到 11 队（不均匀分配）
    const perTeam = [9, 8, 8, 8, 8, 8, 7, 7, 7, 7, 7]; // sum = 83... let me fix
    // 9+8+8+8+8+8+7+7+7+7+7 = 84 ✓
    for (let t = 0; t < teamNames.length; t++) {
      for (let p = 0; p < perTeam[t]; p++) {
        csv += `选手${t+1}-${p+1},${teamNames[t]},公开组\n`;
        totalPlayers++;
      }
    }
    assert.equal(totalPlayers, 84, '预设 84 人');

    const r = runImport(csv);
    assert.equal(r.added, 84, '导入 84 人');

    // 每队只有一个 team_code
    for (const teamName of teamNames) {
      const members = teamPlayers(r.players, teamName);
      assert.ok(members.length > 0, `${teamName} 应有球员`);
      const codes = allTeamCodes(members);
      assert.equal(codes.length, 1, `${teamName} 只有一个 team_code (实际: ${codes.join(',')})`);
    }

    // 11 个不同的 team_code
    const allTC = allTeamCodes(r.players);
    assert.equal(new Set(allTC).size, 11, '11 个不同的 team_code');

    // 84 个不同的 id_code
    const allIds = allIdCodes(r.players);
    assert.equal(new Set(allIds).size, 84, '84 个不同的 id_code');

    // 没有任何 id_code 包含完整中文队名
    for (const p of r.players) {
      assert.ok(!p.id_code.includes('恒兆'), `id_code 不含中文队名: ${p.id_code}`);
      assert.ok(!p.id_code.includes('飞鹰'), `id_code 不含中文队名: ${p.id_code}`);
    }
  });

  // ==================== 队伍编号显示选择逻辑 ====================

  // ---------- 13. 有 team_code 时优先使用 ----------
  it('T13: resolveTeamPrefix — 有 team_code 时直接返回', () => {
    assert.equal(resolveTeamPrefix({ team_code: 'T01', id_code: 'T01-03' }), 'T01');
  });

  // ---------- 14. 无 team_code 时回退到 id_code 前缀 ----------
  it('T14: resolveTeamPrefix — 旧数据无 team_code，回退 id_code 前缀', () => {
    // 旧数据 id_code 格式为 "完整队名-序号"，回退后仍含序号（与 players.html 原始行为一致）
    assert.equal(resolveTeamPrefix({ id_code: '恒兆国际-01' }), '恒兆国际-01');
    assert.equal(resolveTeamPrefix({ id_code: 'T02-05' }), 'T02-05');
  });

  // ---------- 15. 两者都无时返回占位符 ----------
  it('T15: resolveTeamPrefix — 无 team_code 且无 id_code → "—"', () => {
    assert.equal(resolveTeamPrefix({ name: '张三' }), '—');
    assert.equal(resolveTeamPrefix({ id_code: 'P001' }), '—');  // 无 '-' 分隔
    assert.equal(resolveTeamPrefix(null), '—');
  });

  // ---------- 16. 同队所有球员显示相同 team_code ----------
  it('T16: 同队 3 人显示相同队伍编号', () => {
    const csv = `姓名,队名,组别\n张三,猛虎队,公开组\n李四,猛虎队,公开组\n王五,猛虎队,公开组\n`;
    const r = runImport(csv);
    const prefixes = r.players.map(p => resolveTeamPrefix(p));
    assert.equal(new Set(prefixes).size, 1, '同队所有人队伍编号相同');
    assert.equal(prefixes[0], 'T01');
  });

  // ==================== URL 构建 ====================

  // ---------- 17. URL 包含 code 且禁止凭据 ----------
  it('T17: buildPlayersUrl — 仅含 code，禁止 pwd/password', () => {
    const url = buildPlayersUrl('TEST01');
    assert.ok(url.startsWith('players.html?'), '应以 players.html? 开头');
    assert.ok(url.includes('code=TEST01'), '应包含 code');
    assert.ok(!url.includes('pwd'), 'URL 不得包含 pwd');
    assert.ok(!url.includes('password'), 'URL 不得包含 password');
    assert.ok(!url.includes('referee_password'), 'URL 不得包含 referee_password');
  });

  // ---------- 18. URL 特殊字符编码且无凭据泄漏 ----------
  it('T18: buildPlayersUrl — 特殊字符编码，无明文密码', () => {
    const url = buildPlayersUrl('ABC&123');
    assert.ok(url.includes('code=ABC%26123'), '& 应被 encodeURIComponent 编码');
    const parsed = new URLSearchParams(url.split('?')[1]);
    assert.equal(parsed.get('code'), 'ABC&123');
    // 安全断言：URL 中不得出现任何凭据字段
    assert.ok(!/pwd|password|secret|token|auth/i.test(url), 'URL 不得含任何凭据关键词');
  });
});
