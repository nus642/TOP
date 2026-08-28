/**
 * pr155-third-review.test.js — PR#155 第八轮独立 Review 整改验证
 *
 * 真实 HTTP 测试（隔离容器 nhpa-legacy-live-fix-test），覆盖：
 * - Dashboard 返回 referees 字段
 * - 裁判状态流转：空闲 → 执裁中 → 空闲
 * - match_count 只增加一次
 * - editCourt 真实运行（update_task_court）
 * - [L1] 不重复（前端逻辑验证）
 * - Master 任务池不重复显示实时比分
 * - 交换场区文案不含"官方暂停 60 秒"
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:8082';
const CONTAINER = 'nhpa-legacy-live-fix-test';
const createdEvents = [];
let EVENT = '';

async function post(body) {
  // 自动添加 event_code
  if (!body.event_code && EVENT) body.event_code = EVENT;
  const r = await fetch(`${BASE}/data.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
async function get(action, extra = '') {
  const r = await fetch(`${BASE}/data.php?action=${action}&event_code=${EVENT}${extra}`);
  return r.json();
}
async function dashboard() { return get('get_full_dashboard'); }
async function referees() { const r = await get('get_referees'); return r.data || []; }
function refByName(list, name) { return list.find(r => r.name === name); }

const DATA_PHP = path.join(__dirname, '..', '..', 'Legacy', 'data.php');
const MASTER_HTML = path.join(__dirname, '..', '..', 'Legacy', 'master.html');
const REFEREE_HTML = path.join(__dirname, '..', '..', 'Legacy', 'referee.html');

function hostSha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase();
}
function containerSha256(file) {
  const containerPath = file.replace(/.*Legacy[\\/]/, '/var/www/html/');
  return execSync(`docker exec ${CONTAINER} sha256sum ${containerPath}`).toString().split(' ')[0].toUpperCase();
}

describe('PR#155 R8 整改验证', () => {
  before(async () => {
    // 创建测试赛事
    EVENT = `R8TEST-${Date.now().toString(36).toUpperCase()}`;
    const res = await post({ action: 'create_event', super_pwd: 'Wuxian666', custom_code: EVENT, event_name: 'R8 测试赛事', event_type: 'team', courts: ['1','2','3'], referee_password: '2508' });
    assert.equal(res.status, 'success', `创建赛事成功: ${JSON.stringify(res)}`);
    createdEvents.push(EVENT);
  });

  after(async () => {
    // 清理测试赛事
    for (const ev of createdEvents) {
      await post({ action: 'reset_event', event_code: ev, super_pwd: 'Wuxian666' });
    }
  });

  describe('Dashboard 返回裁判矩阵数据', () => {
    it('R8-1: get_full_dashboard 包含 referees 字段', async () => {
      const dash = await dashboard();
      assert.equal(dash.status, 'success');
      assert.ok(Array.isArray(dash.referees), 'referees 必须为数组');
    });

    it('R8-2: referees 字段不包含密码', async () => {
      // 先登录一个裁判
      await post({ action: 'referee_login', name: 'R8裁判A', password: '2508' });
      const dash = await dashboard();
      const ref = dash.referees.find(r => r.name === 'R8裁判A');
      assert.ok(ref, '裁判存在');
      assert.equal(ref.pwd, undefined, '不得返回密码');
      assert.equal(ref.password, undefined, '不得返回密码字段');
    });

    it('R8-3: 裁判注册后状态为空闲', async () => {
      const refs = await referees();
      const ref = refByName(refs, 'R8裁判A');
      assert.ok(ref);
      assert.equal(ref.status, '空闲');
      assert.equal(ref.current_court, '');
    });
  });

  describe('裁判状态流转', () => {
    const taskId = 'R8M1';

    it('R8-4: 领取任务后裁判状态仍为空闲（start_task 才更新）', async () => {
      // 创建任务（使用 set_bulk_tasks）
      await post({ action: 'set_bulk_tasks', tasks: [{ id: taskId, t1: '队A', t2: '队B', court: '1', is_team: false, status: '未开始' }] });
      // 领取任务
      const acceptRes = await post({ action: 'accept_task', match_id: taskId, court: '1', t1: '队A', t2: '队B', ref: '[L1] R8裁判A', referee_id: 'R8裁判A' });
      assert.equal(acceptRes.status, 'success', `accept_task: ${JSON.stringify(acceptRes)}`);
      
      const refs = await referees();
      const ref = refByName(refs, 'R8裁判A');
      // accept_task 不改变裁判状态，只分配任务
      assert.equal(ref.status, '空闲', 'accept_task 后裁判仍为空闲');
    });

    it('R8-5: 开赛后裁判状态仍为执裁中', async () => {
      const startRes = await post({ action: 'start_task', match_id: taskId, referee_id: 'R8裁判A', score_text: 'G1 0-0', match_name: '队A vs 队B' });
      assert.equal(startRes.status, 'success');
      
      const refs = await referees();
      const ref = refByName(refs, 'R8裁判A');
      assert.equal(ref.status, '执裁中');
    });

    it('R8-6: 完赛后裁判状态恢复空闲，match_count +1', async () => {
      const saveRes = await post({
        action: 'save_score', id: taskId, t1: '队A', t2: '队B',
        score: 'G1 21-15', details: 'G1 21-15', winner: '队A', court: '1',
        referee_id: 'R8裁判A', referee: '[L1] R8裁判A', signature: 'test'
      });
      assert.equal(saveRes.status, 'success');
      
      const refs = await referees();
      const ref = refByName(refs, 'R8裁判A');
      assert.equal(ref.status, '空闲');
      assert.equal(ref.current_court, '');
      assert.equal(ref.match_count, 1, 'match_count 应为 1');
    });

    it('R8-7: 再次完赛 match_count 不重复增加（无第二次 save_score）', async () => {
      // 验证 records 只有 1 条
      const dash = await dashboard();
      const records = dash.records.filter(r => r.id === taskId);
      assert.equal(records.length, 1, 'records 应为 1 条');
    });
  });

  describe('editCourt 真实运行', () => {
    it('R8-8: update_task_court 成功修改场地', async () => {
      const taskId2 = 'R8M2';
      await post({ action: 'set_bulk_tasks', tasks: [{ id: taskId2, t1: '队C', t2: '队D', court: '2', is_team: false, status: '未开始' }] });
      
      const updateRes = await post({ action: 'update_task_court', match_id: taskId2, court: '3' });
      assert.equal(updateRes.status, 'success', `update_task_court: ${JSON.stringify(updateRes)}`);
      
      const dash = await dashboard();
      const task = Object.values(dash.tasks).find(t => t.id === taskId2);
      assert.ok(task);
      assert.equal(task.court, '3', '场地应已更新为 3');
    });
  });

  describe('前端文件静态验证', () => {
    it('R8-9: master.html 包含 normalizeId 定义', () => {
      const content = fs.readFileSync(MASTER_HTML, 'utf8');
      assert.ok(content.includes('const normalizeId'), 'master.html 必须定义 normalizeId');
    });

    it('R8-10: referee.html 结算单不重复 [L1]', () => {
      const content = fs.readFileSync(REFEREE_HTML, 'utf8');
      // 查找结算单模板
      const reportMatch = content.match(/执裁人:.*?\\n/);
      assert.ok(reportMatch, '找到执裁人字段');
      // 不应出现 [${currentRefLevel}] ${currentMatch.ref} 这种重复拼接
      assert.ok(!content.includes('[${currentRefLevel}] ${currentMatch.ref}'), '不得重复拼接等级');
    });

    it('R8-11: referee.html 提交 payload 不重复 [L1]', () => {
      const content = fs.readFileSync(REFEREE_HTML, 'utf8');
      // referee 字段应直接使用 currentMatch.ref
      assert.ok(content.includes("referee: currentMatch.ref"), 'payload 应直接使用 currentMatch.ref');
    });

    it('R8-12: referee.html 交换场区文案不含"官方暂停 60 秒"', () => {
      const content = fs.readFileSync(REFEREE_HTML, 'utf8');
      assert.ok(!content.includes('官方暂停 60 秒'), '不得宣称固定 60 秒');
      assert.ok(!content.includes('官方固定 60 秒'), '不得宣称固定 60 秒');
    });

    it('R8-13: referee.html 包含 matchPhase 生命周期字段', () => {
      const content = fs.readFileSync(REFEREE_HTML, 'utf8');
      assert.ok(content.includes("let matchPhase = 'not_started'"), '必须定义 matchPhase');
      assert.ok(content.includes("matchPhase === 'in_progress'"), '必须检查 in_progress 状态');
    });

    it('R8-14: referee.html 包含 resumeActiveMatch 函数', () => {
      const content = fs.readFileSync(REFEREE_HTML, 'utf8');
      assert.ok(content.includes('async function resumeActiveMatch'), '必须定义 resumeActiveMatch');
    });

    it('R8-15: master.html 任务池不显示实时比分', () => {
      const content = fs.readFileSync(MASTER_HTML, 'utf8');
      // 比赛中的任务应显示"比赛中"而非比分
      assert.ok(content.includes("'比赛中'") || content.includes('"比赛中"'), '必须包含比赛中状态');
      // 不应在 liveBadge 中显示 t.live_score
      const liveBadgeMatch = content.match(/liveBadge.*?t\.live_score/);
      assert.ok(!liveBadgeMatch, 'liveBadge 不得使用 live_score');
    });
  });

  describe('文件完整性验证', () => {
    it('R8-16: 宿主/容器 data.php SHA-256 一致', () => {
      const hostHash = hostSha256(DATA_PHP);
      const containerHash = containerSha256(DATA_PHP);
      assert.equal(containerHash, hostHash, 'SHA-256 必须一致');
    });

    it('R8-17: 宿主/容器 master.html SHA-256 一致', () => {
      const hostHash = hostSha256(MASTER_HTML);
      const containerHash = containerSha256(MASTER_HTML);
      assert.equal(containerHash, hostHash, 'SHA-256 必须一致');
    });

    it('R8-18: 宿主/容器 referee.html SHA-256 一致', () => {
      const hostHash = hostSha256(REFEREE_HTML);
      const containerHash = containerSha256(REFEREE_HTML);
      assert.equal(containerHash, hostHash, 'SHA-256 必须一致');
    });
  });
});
