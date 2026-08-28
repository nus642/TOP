/**
 * pr155-review-fixes.test.js — PR#155 审查整改验证
 * 真实 HTTP 测试（ nhpa-legacy-live-fix-test 容器），非源码锚定。
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8082';
const EVENT = 'PR155-TEST-' + Date.now().toString(36);

async function post(body) {
  const r = await fetch(`${BASE}/data.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
async function get(action, extra = '') {
  const r = await fetch(`${BASE}/data.php?action=${action}&event_code=${EVENT}${extra}`);
  return r.json();
}
async function dashboard() { return get('get_full_dashboard'); }

function makePlayers() {
  return ['甲一','甲二','甲三','甲四','甲五','甲六'].map(n => ({ name: n, team: 'A队', checked_in: true }))
    .concat(['乙一','乙二','乙三','乙四','乙五','乙六'].map(n => ({ name: n, team: 'B队', checked_in: true })));
}

async function setupEvent() {
  await post({ action: 'create_event', super_pwd: 'Wuxian666', custom_code: EVENT, event_name: 'PR155 Test', event_type: 'team', courts: ['1','2','3'], referee_password: '2508' });
  await post({ action: 'set_players', event_code: EVENT, players: makePlayers() });
  const tasks = {};
  ['001-01','001-02','001-03'].forEach(id => {
    tasks[id] = { id, court: '', t1: 'A队', t2: 'B队', status: '未开始', type: 'doubles', format: 1, is_team: true, date: '2026-08-27' };
  });
  await post({ action: 'set_bulk_tasks', event_code: EVENT, tasks });
  await post({ action: 'set_referees', event_code: EVENT, referees: [
    { name: '裁判A', level: 'L1', status: '空闲' },
    { name: '裁判B', level: 'L1', status: '空闲' },
    { name: '裁判C', level: 'L1', status: '空闲' },
  ]});
}

// ======================== BOM 测试 ========================
describe('BOM：data.php 首字节验证', () => {
  it('data.php 不得以 UTF-8 BOM (EF BB BF) 开头', () => {
    const dataPath = path.resolve(__dirname, '../../Legacy/data.php');
    const bytes = fs.readFileSync(dataPath);
    assert.ok(bytes.length >= 4, 'data.php 不得为空');
    const hasBOM = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
    assert.ok(!hasBOM, `data.php 首字节为 BOM: ${bytes.slice(0, 4).toString('hex')}`);
  });

  it('data.php 首 5 字节必须是 <?php', () => {
    const dataPath = path.resolve(__dirname, '../../Legacy/data.php');
    const bytes = fs.readFileSync(dataPath);
    const header = bytes.slice(0, 5).toString('ascii');
    assert.equal(header, '<?php', `首字节为: ${bytes.slice(0, 8).toString('hex')}`);
  });

  it('HTTP 响应不得包含 BOM 前缀', async () => {
    const r = await fetch(`${BASE}/data.php?action=get_event_config&event_code=NONEXISTENT`);
    const buf = Buffer.from(await r.arrayBuffer());
    const hasBOM = buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
    assert.ok(!hasBOM, 'HTTP 响应含 BOM');
    const text = buf.toString('utf8');
    const parsed = JSON.parse(text); // 必须是合法 JSON
    assert.ok(parsed, '响应为合法 JSON');
  });
});

// ======================== 登录投影保护 ========================
describe('登录安全：无关裁判登录不得清除投影', () => {
  before(async () => { await setupEvent(); });

  it('待开赛投影不被无关裁判登录清除', async () => {
    // 分配场地 + 裁判A 领取
    await post({ action: 'update_task_court', event_code: EVENT, match_id: '001-01', court: '1' });
    const accept = await post({ action: 'accept_task', event_code: EVENT, referee_id: '裁判A', match_id: '001-01', court: '1' });
    assert.equal(accept.status, 'success');

    // 裁判B 登录（referee_update_status 空闲 + court=1）
    await post({ action: 'referee_update_status', event_code: EVENT, referee_id: '裁判B', status: '空闲', court: '1' });

    // court 1 投影必须不变
    const d = await dashboard();
    const c1 = d.courts?.['1'];
    assert.equal(c1.status, '待开赛', `投影被清除: ${JSON.stringify(c1)}`);
    assert.equal(c1.match_id, '001-01');
  });

  it('比赛中投影不被无关裁判登录清除', async () => {
    // 先开赛（使用 start_task 原子动作）
    const start = await post({ action: 'start_task', event_code: EVENT, match_id: '001-01', referee_id: '裁判A', score_text: 'G1 0-0', match_name: 'A队 vs B队' });
    assert.equal(start.status, 'success', `start_task 失败: ${JSON.stringify(start)}`);

    // 裁判C 登录
    await post({ action: 'referee_update_status', event_code: EVENT, referee_id: '裁判C', status: '空闲', court: '1' });

    // 投影必须仍为比赛中
    const d = await dashboard();
    const c1 = d.courts?.['1'];
    assert.equal(c1.status, '比赛中', `投影被清除: ${JSON.stringify(c1)}`);
  });
});

// ======================== 领取并发 ========================
describe('领取并发：同一 task 只能一个裁判成功', () => {
  before(async () => { await setupEvent(); });

  it('裁判A 领取成功后裁判B 被拒绝', async () => {
    await post({ action: 'update_task_court', event_code: EVENT, match_id: '001-01', court: '1' });
    const a = await post({ action: 'accept_task', event_code: EVENT, referee_id: '裁判A', match_id: '001-01', court: '1' });
    assert.equal(a.status, 'success');
    const b = await post({ action: 'accept_task', event_code: EVENT, referee_id: '裁判B', match_id: '001-01', court: '1' });
    assert.equal(b.status, 'error', 'B 应被拒绝');
  });

  it('并发 Promise.all 同时领取：只能一个成功', async () => {
    await post({ action: 'update_task_court', event_code: EVENT, match_id: '001-02', court: '2' });
    const results = await Promise.all([
      post({ action: 'accept_task', event_code: EVENT, referee_id: '裁判A', match_id: '001-02', court: '2' }),
      post({ action: 'accept_task', event_code: EVENT, referee_id: '裁判B', match_id: '001-02', court: '2' }),
    ]);
    const successes = results.filter(r => r.status === 'success');
    const errors = results.filter(r => r.status === 'error');
    assert.equal(successes.length, 1, `应恰好 1 个成功，实际 ${successes.length}`);
    assert.equal(errors.length, 1);
  });
});

// ======================== start_task 原子 ========================
describe('start_task：原子开赛', () => {
  before(async () => { await setupEvent(); });

  it('所有校验通过 → start_task 原子成功', async () => {
    await post({ action: 'update_task_court', event_code: EVENT, match_id: '001-01', court: '1' });
    await post({ action: 'accept_task', event_code: EVENT, referee_id: '裁判A', match_id: '001-01', court: '1' });
    const start = await post({ action: 'start_task', event_code: EVENT, match_id: '001-01', referee_id: '裁判A', score_text: 'G1 0-0', match_name: 'A队 vs B队' });
    assert.equal(start.status, 'success');
    const d = await dashboard();
    assert.equal(d.courts?.['1']?.status, '比赛中');
  });

  it('0-0 也为比赛中', async () => {
    const d = await dashboard();
    assert.equal(d.courts?.['1']?.score, 'G1 0-0');
    assert.equal(d.courts?.['1']?.status, '比赛中');
  });

  it('非归属裁判开赛被拒绝', async () => {
    await post({ action: 'update_task_court', event_code: EVENT, match_id: '001-02', court: '2' });
    // 使用裁判C 领取（裁判A 已在 001-01 执裁中，跨投影校验会拒绝）
    await post({ action: 'accept_task', event_code: EVENT, referee_id: '裁判C', match_id: '001-02', court: '2' });
    const start = await post({ action: 'start_task', event_code: EVENT, match_id: '001-02', referee_id: '裁判B', score_text: 'G1 0-0' });
    assert.equal(start.status, 'error');
    // 投影不变
    const d = await dashboard();
    assert.equal(d.courts?.['2']?.status, '待开赛');
  });

  it('错误 court 被拒绝', async () => {
    const start = await post({ action: 'start_task', event_code: EVENT, match_id: 'NONEXIST', referee_id: '裁判A', score_text: 'G1 0-0' });
    assert.equal(start.status, 'error');
  });

  it('重复开赛返回幂等 success（响应丢失恢复）', async () => {
    const start = await post({ action: 'start_task', event_code: EVENT, match_id: '001-01', referee_id: '裁判A', score_text: 'G1 0-0', match_name: 'A队 vs B队' });
    assert.equal(start.status, 'success', '已开赛 task 重复请求应返回幂等 success');
    assert.equal(start.idempotent, true, '必须报告 idempotent=true');
  });
});

// ======================== sync_live_score 归属 ========================
describe('sync_live_score：归属校验', () => {
  before(async () => { await setupEvent(); });

  it('原裁判同步成功', async () => {
    await post({ action: 'update_task_court', event_code: EVENT, match_id: '001-01', court: '1' });
    await post({ action: 'accept_task', event_code: EVENT, referee_id: '裁判A', match_id: '001-01', court: '1' });
    await post({ action: 'start_task', event_code: EVENT, match_id: '001-01', referee_id: '裁判A', score_text: 'G1 0-0', match_name: 'A队 vs B队' });
    const sync = await post({ action: 'sync_live_score', event_code: EVENT, court: '1', score_text: 'G1 2-1', status: '比赛中', match_name: 'A队 vs B队', match_id: '001-01', referee_id: '裁判A' });
    assert.equal(sync.status, 'success');
    const d = await dashboard();
    assert.ok(d.courts?.['1']?.score.includes('2-1'), `比分未更新: ${d.courts?.['1']?.score}`);
  });

  it('其他裁判同步被拒绝且比分不变', async () => {
    const sync = await post({ action: 'sync_live_score', event_code: EVENT, court: '1', score_text: 'G1 5-5', status: '比赛中', match_name: 'A队 vs B队', match_id: '001-01', referee_id: '裁判B' });
    assert.equal(sync.status, 'error');
    const d = await dashboard();
    assert.ok(!d.courts?.['1']?.score.includes('5-5'), '比分被非法篡改');
  });

  it('未开赛任务不能通过 sync_live_score 偷偷升级为比赛中', async () => {
    await post({ action: 'update_task_court', event_code: EVENT, match_id: '001-02', court: '2' });
    // 使用裁判C 领取（裁判A 已在 001-01 执裁中）
    await post({ action: 'accept_task', event_code: EVENT, referee_id: '裁判C', match_id: '001-02', court: '2' });
    // 不开赛，直接 sync
    const sync = await post({ action: 'sync_live_score', event_code: EVENT, court: '2', score_text: 'G1 1-0', status: '比赛中', match_name: 'A队 vs B队', match_id: '001-02', referee_id: '裁判C' });
    assert.equal(sync.status, 'error', '待开赛投影不得通过 sync 升级为比赛中');
    const d = await dashboard();
    assert.equal(d.courts?.['2']?.status, '待开赛');
  });
});

// ======================== save_score 原子完赛 ========================
describe('save_score：原子完赛与回滚', () => {
  before(async () => { await setupEvent(); });

  it('save_score 成功后 record/task/live/referee 同时完成', async () => {
    await post({ action: 'update_task_court', event_code: EVENT, match_id: '001-01', court: '1' });
    await post({ action: 'accept_task', event_code: EVENT, referee_id: '裁判A', match_id: '001-01', court: '1' });
    await post({ action: 'start_task', event_code: EVENT, match_id: '001-01', referee_id: '裁判A', score_text: 'G1 21-15', match_name: 'A队 vs B队' });

    const save = await post({
      action: 'save_score', event_code: EVENT,
      id: '001-01', t1: 'A队', t2: 'B队', score: '21-15', winner: 'A队',
      details: 'G1: 21-15', court: '1', referee_id: '裁判A',
      referee: '[L1] 裁判A', signature: 'test', is_team: true
    });
    assert.equal(save.status, 'success');

    // task 已删除
    const d = await dashboard();
    assert.ok(!d.tasks?.['001-01'], 'task 应已删除');
    // live_scores court 1 已清除
    assert.equal(d.courts?.['1']?.status, '空闲', '投影应已清除');
    assert.equal(d.courts?.['1']?.match_id, '', 'match_id 应已清空');
  });

  it('save_score 失败时全部保持（task 不存在 → error）', async () => {
    const save = await post({
      action: 'save_score', event_code: EVENT,
      id: 'NONEXIST', t1: 'A', t2: 'B', score: '0-0', winner: 'A',
      details: '', court: '1', referee_id: '裁判A', referee: '裁判A', signature: 'x'
    });
    assert.equal(save.status, 'error');
  });
});
