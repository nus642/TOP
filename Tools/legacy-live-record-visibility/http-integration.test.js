/**
 * http-integration.test.js — Legacy 真实 HTTP API 行为验证（Docker + nhpa_test 隔离服务）
 *
 * 规则：
 * - 服务地址取环境变量 LEGACY_BASE_URL，缺省 http://localhost:8082；
 * - 服务不可达时测试明确失败（不得伪装通过、不得降级为源码测试）；
 * - 使用唯一隔离赛事码 TEAM-LIVE-HOTFIX-<timestamp>，不触碰任何生产/预演赛事；
 * - 禁止手工 SQL / 直接编辑 KV；任务创建走 set_bulk_tasks，清理走赛事整体删除 API；
 * - 每个失败场景均校验调用前后 KV 快照，确认零写入/无部分写入。
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = (process.env.LEGACY_BASE_URL || 'http://localhost:8082').replace(/\/$/, '');
const EVENT_CODE = `TEAM-LIVE-HOTFIX-${Date.now()}`;
const SUPER_PWD = process.env.SUPER_ADMIN_PWD; // 与隔离 Legacy 服务的环境配置保持一致

const REF_A = '测试裁判甲';
const REF_B = '测试裁判乙';
const REF_C = '测试裁判丙';

let available = false;

// ======================== HTTP 辅助 ========================
async function get(action, params = {}) {
  const url = new URL(`${BASE_URL}/data.php`);
  url.searchParams.set('action', action);
  url.searchParams.set('event_code', EVENT_CODE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url);
  return res.json();
}

async function post(action, body = {}) {
  const res = await fetch(`${BASE_URL}/data.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, event_code: EVENT_CODE, ...body }),
  });
  return res.json();
}

async function snapshot() {
  const dash = await get('get_full_dashboard');
  const tasks = await get('get_personal_tasks');
  const refs = await get('get_referees');
  return {
    courts: JSON.stringify(dash.courts || {}),
    tasks: JSON.stringify(tasks.tasks || {}),
    refs: JSON.stringify(refs.data || []),
    raw: dash,
  };
}

function makeTask(id, court, extra = {}) {
  return {
    id, court,
    t1: `红队${id}`, t2: `蓝队${id}`,
    target_score: 21, cap_score: 0, format: 1, meth: 'standard',
    is_team: true, ...extra,
  };
}

// ======================== 生命周期 ========================
describe('真实 HTTP 集成：隔离赛事生命周期', () => {
  before(async () => {
    try {
      const res = await fetch(`${BASE_URL}/data.php?action=get_event_config&event_code=NONEXISTENT`, { signal: AbortSignal.timeout(5000) });
      const j = await res.json();
      available = j.status === 'success';
    } catch (e) {
      available = false;
    }
  });

  it('H00: 隔离 Legacy 服务可达（不可达则全部失败，不得伪装通过）', () => {
    assert.ok(available, `服务 ${BASE_URL} 不可达——请启动隔离容器（如 nhpa-legacy-live-fix-test）后重试`);
  });

  it('H01: 创建隔离赛事 ' + EVENT_CODE, async () => {
    assert.ok(available, '服务不可达');
    const r = await post('create_event', {
      super_pwd: SUPER_PWD,
      event_name: 'HTTP集成隔离赛事（自动清理）',
      event_type: 'team',
      courts: ['1', '2', '3', '4'],
      referee_password: 'test123',
      custom_code: EVENT_CODE,
    });
    assert.equal(r.status, 'success', `创建隔离赛事失败: ${JSON.stringify(r)}`);
    assert.equal(r.event_code, EVENT_CODE);
    // 预注册两名裁判（referees KV 以 name 为主键）
    const sr = await post('set_referees', {
      referees: [
        { name: REF_A, status: '空闲', current_court: '', match_count: 0, comment: '', last_login: '' },
        { name: REF_B, status: '空闲', current_court: '', match_count: 0, comment: '', last_login: '' },
        { name: REF_C, status: '空闲', current_court: '', match_count: 0, comment: '', last_login: '' },
      ],
    });
    assert.equal(sr.status, 'success');
  });

  it('H02: 批量创建测试任务（set_bulk_tasks，不手工编辑 KV）', async () => {
    assert.ok(available, '服务不可达');
    const r = await post('set_bulk_tasks', {
      tasks: [
        makeTask('HT-001', '1'),
        makeTask('HT-002', ''),          // 无场地任务
        makeTask('HT-003', '2'),
        makeTask('HT-004', '3'),
      ],
    });
    assert.equal(r.status, 'success');
  });
});

// ======================== accept_task ========================
describe('accept_task 服务端权威边界（真实 HTTP）', () => {
  it('H03: task 不存在 → error，零写入', async () => {
    assert.ok(available, '服务不可达');
    const before = await snapshot();
    const r = await post('accept_task', { match_id: 'HT-NOPE', referee_id: REF_A });
    assert.equal(r.status, 'error');
    const after = await snapshot();
    assert.equal(after.courts, before.courts, 'courts 不应变化');
    assert.equal(after.tasks, before.tasks, 'tasks 不应变化');
    assert.equal(after.refs, before.refs, 'referees 不应变化');
  });

  it('H04: task 无 court → error，不创建默认场地，零写入', async () => {
    assert.ok(available, '服务不可达');
    const before = await snapshot();
    const r = await post('accept_task', { match_id: 'HT-002', referee_id: REF_A, court: '1', t1: '伪造队', t2: '伪造队2' });
    assert.equal(r.status, 'error');
    assert.match(r.message || '', /尚未分配场地/);
    const after = await snapshot();
    assert.equal(after.courts, before.courts, 'live_scores 不得写入（不得默认场地 1）');
  });

  it('H05: 客户端伪造 court/t1/t2 → 服务端忽略，投影取自服务端 task', async () => {
    assert.ok(available, '服务不可达');
    const r = await post('accept_task', { match_id: 'HT-001', referee_id: REF_A, court: '9', t1: '伪造红', t2: '伪造蓝', ref: '伪造裁判' });
    assert.equal(r.status, 'success');
    assert.equal(r.idempotent, false);
    const dash = await get('get_full_dashboard');
    // 服务端权威场地为 1（伪造的 9 不得出现投影）
    assert.ok(!dash.courts['9'] || dash.courts['9'].match_id === '', '伪造场地 9 不得出现投影');
    const c1 = dash.courts['1'];
    assert.equal(c1.status, '待开赛');
    assert.equal(c1.match_id, 'HT-001');
    assert.equal(c1.match_name, '红队HT-001 vs 蓝队HT-001', '队名必须来自服务端 task，客户端伪造被忽略');
    assert.equal(c1.referee, REF_A, '裁判必须为服务端归一化的 referee_id');
  });

  it('H06: 相同 task + 相同 referee → 幂等，不产生重复投影', async () => {
    assert.ok(available, '服务不可达');
    const before = await snapshot();
    const r = await post('accept_task', { match_id: 'HT-001', referee_id: REF_A });
    assert.equal(r.status, 'success');
    assert.equal(r.idempotent, true);
    const after = await snapshot();
    assert.equal(after.courts, before.courts, '幂等调用不得改变投影');
  });

  it('H07: 相同 task + 不同 referee → conflict，原裁判归属保持', async () => {
    assert.ok(available, '服务不可达');
    const before = await snapshot();
    const r = await post('accept_task', { match_id: 'HT-001', referee_id: REF_B });
    assert.equal(r.status, 'error');
    assert.match(r.message || '', /已被裁判/);
    const dash = await get('get_full_dashboard');
    assert.equal(dash.courts['1'].referee, REF_A, '原裁判归属必须保持');
    const after = await snapshot();
    assert.equal(after.courts, before.courts);
  });

  it('H08: 不同 task 争用同一 court → conflict，原比赛不被覆盖', async () => {
    assert.ok(available, '服务不可达');
    // 先验证争用前置：把 HT-003 改到被占用的场地 1 应被拒绝（零写入，HT-003 仍在 2）
    const rOcc = await post('update_task_court', { match_id: 'HT-003', court: '1' });
    assert.equal(rOcc.status, 'error', '改场到被占用场地应被拒绝');
    // 另造一个 task.court=1 的任务，验证 accept 层面的场地争用拒绝
    const before = await snapshot();
    await post('set_bulk_tasks', { tasks: [makeTask('HT-005', '1')] });
    const r = await post('accept_task', { match_id: 'HT-005', referee_id: REF_B });
    assert.equal(r.status, 'error');
    assert.match(r.message || '', /已被其他任务|无法覆盖/);
    const dash = await get('get_full_dashboard');
    assert.equal(dash.courts['1'].match_id, 'HT-001', '原比赛不得被覆盖');
    const after = await snapshot();
    assert.equal(after.courts, before.courts);
  });

  it('H09: 已领取任务对其他裁判不可领取（归属唯一）', async () => {
    assert.ok(available, '服务不可达');
    const r1 = await post('accept_task', { match_id: 'HT-001', referee_id: REF_B });
    assert.equal(r1.status, 'error');
    // get_personal_task 仍能读到 task 本身，但 accept 层面归属唯一已由 H07/H09 保证
    const t = await get('get_personal_task', { match_id: 'HT-001' });
    assert.equal(t.status, 'success');
  });
});

// ======================== release_task_acceptance ========================
describe('release_task_acceptance 待开赛释放（真实 HTTP）', () => {
  it('H10: 比赛中释放 → 拒绝，状态不变', async () => {
    assert.ok(available, '服务不可达');
    // 用 HT-003（court=2）接受并用 start_task 原子开赛（使用 REF_C 隔离，避免跨投影影响后续 REF_B 测试）
    await post('accept_task', { match_id: 'HT-003', referee_id: REF_C });
    const startRes = await post('start_task', { match_id: 'HT-003', referee_id: REF_C, score_text: 'G1 0-0', match_name: '红队HT-003 vs 蓝队HT-003' });
    assert.equal(startRes.status, 'success', `start_task 失败: ${JSON.stringify(startRes)}`);
    const dash = await get('get_full_dashboard');
    assert.equal(dash.courts['2'].status, '比赛中', '前置：场地 2 应为比赛中（start_task 原子开赛）');
    const r = await post('release_task_acceptance', { referee_id: REF_C, match_id: 'HT-003' });
    assert.equal(r.status, 'error');
    assert.match(r.message || '', /比赛已开始|禁止/);
    const dash2 = await get('get_full_dashboard');
    assert.equal(dash2.courts['2'].status, '比赛中', '比赛不得被清除，场地不得被清空');
  });

  it('H11: 其他裁判释放他人待开赛任务 → 拒绝，归属保持', async () => {
    assert.ok(available, '服务不可达');
    // 此刻 HT-001 由 REF_A 持有待开赛（court=1）
    const r = await post('release_task_acceptance', { referee_id: REF_B, match_id: 'HT-001' });
    assert.equal(r.status, 'error');
    assert.match(r.message || '', /其他裁判|无权/);
    const dash = await get('get_full_dashboard');
    assert.equal(dash.courts['1'].match_id, 'HT-001', '原归属投影不得被他人释放');
    assert.equal(dash.courts['1'].referee, REF_A);
  });

  it('H12: 不存在 task 的释放 → 幂等确定，零写入', async () => {
    assert.ok(available, '服务不可达');
    const before = await snapshot();
    const r = await post('release_task_acceptance', { referee_id: REF_A, match_id: 'HT-NOPE' });
    assert.equal(r.status, 'success');
    assert.equal(r.released, false);
    const after = await snapshot();
    assert.equal(after.courts, before.courts);
    assert.equal(after.refs, before.refs);
  });

  it('H13: 原裁判释放待开赛 → 投影删除、裁判空闲、task 可重新领取', async () => {
    assert.ok(available, '服务不可达');
    // HT-001 当前由 REF_A 持有待开赛（court=1）
    const r = await post('release_task_acceptance', { referee_id: REF_A, match_id: 'HT-001' });
    assert.equal(r.status, 'success');
    assert.equal(r.released, true);
    const dash = await get('get_full_dashboard');
    assert.ok(dash.courts['1'].match_id === '' || dash.courts['1'].status === '空闲', 'live 投影应已清除');
    const refs = await get('get_referees');
    const a = (refs.data || []).find(x => x.name === REF_A);
    assert.equal(a.status, '空闲');
    // 重新可领取
    const r2 = await post('accept_task', { match_id: 'HT-001', referee_id: REF_B });
    assert.equal(r2.status, 'success');
    assert.equal(r2.idempotent, false);
  });

  it('H14: 归属裁判重复释放 → 结果确定且无脏状态', async () => {
    assert.ok(available, '服务不可达');
    // H13 后 HT-001 由 REF_B 持有待开赛；REF_B 再次释放 → 成功；第三次 → released=false 确定结果
    const r = await post('release_task_acceptance', { referee_id: REF_B, match_id: 'HT-001' });
    assert.equal(r.status, 'success');
    assert.equal(r.released, true);
    const r2 = await post('release_task_acceptance', { referee_id: REF_B, match_id: 'HT-001' });
    assert.equal(r2.status, 'success');
    assert.equal(r2.released, false, '重复释放应明确报告无可释放投影');
    const dash = await get('get_full_dashboard');
    assert.ok(dash.courts['1'].match_id === '' || dash.courts['1'].status === '空闲', '场地 1 不得残留脏投影');
  });
});

// ======================== update_task_court ========================
describe('update_task_court 更换比赛场地（真实 HTTP）', () => {
  it('H15: 待开赛迁移成功（旧场地释放，新场地仅一条投影）', async () => {
    assert.ok(available, '服务不可达');
    // HT-004（court=3）由 REF_A 接受形成待开赛投影，迁到已空闲的场地 1
    const a = await post('accept_task', { match_id: 'HT-004', referee_id: REF_A });
    assert.equal(a.status, 'success');
    const r = await post('update_task_court', { match_id: 'HT-004', court: '1' });
    assert.equal(r.status, 'success');
    const dash = await get('get_full_dashboard');
    assert.ok(dash.courts['3'].match_id === '' || dash.courts['3'].status === '空闲', '旧场地应恢复空闲');
    assert.equal(dash.courts['1'].match_id, 'HT-004');
    assert.equal(dash.courts['1'].status, '待开赛');
    assert.equal(dash.courts['1'].referee, REF_A, '待开赛投影应保留裁判归属');
  });

  it('H16: 同场地重复提交 → 幂等', async () => {
    assert.ok(available, '服务不可达');
    const r = await post('update_task_court', { match_id: 'HT-004', court: '1' });
    assert.equal(r.status, 'success');
    assert.equal(r.idempotent, true);
    const dash = await get('get_full_dashboard');
    assert.equal(dash.courts['1'].match_id, 'HT-004', '幂等提交不得破坏现有投影');
  });

  it('H17: 比赛中迁移保留比分/状态，旧场地释放，归属不变', async () => {
    assert.ok(available, '服务不可达');
    // HT-003 在 court=2 比赛中（H10 已 start_task），推进比分到 7-5；迁到场地 4（空闲）
    await post('sync_live_score', { match_id: 'HT-003', court: '2', score_text: 'G1 7-5', status: '比赛中', match_name: '红队HT-003 vs 蓝队HT-003', referee_id: REF_C });
    const r = await post('update_task_court', { match_id: 'HT-003', court: '4' });
    assert.equal(r.status, 'success');
    const dash = await get('get_full_dashboard');
    assert.equal(dash.courts['4'].match_id, 'HT-003');
    assert.equal(dash.courts['4'].status, '比赛中');
    assert.equal(dash.courts['4'].score, 'G1 7-5', '新场地必须保留当前比分，不得重置 0-0');
    const tasks = await get('get_personal_tasks');
    assert.equal(tasks.tasks['HT-003'].live_score, 'G1 7-5', 'task.live_score 权威比分必须保留');
    assert.ok(dash.courts['2'].match_id === '' || dash.courts['2'].status === '空闲', '旧场地 2 应恢复空闲');
    // 归属不变：迁移后释放仍被"比赛中"规则拒绝（而非"无权"）
    const rel = await post('release_task_acceptance', { referee_id: REF_C, match_id: 'HT-003' });
    assert.equal(rel.status, 'error');
    assert.match(rel.message || '', /比赛已开始/);
  });

  it('H18: start_task 后换场 → 比分从权威数据保留', async () => {
    assert.ok(available, '服务不可达');
    // H14 后 HT-001 无投影；task.court=1 但 court 1 已被 HT-004 占用（H15），先改到空闲场地 3
    // H17 前：REF_A 仍持有 HT-004 投影（H15），需先释放才能领取 HT-001
    await post('release_task_acceptance', { referee_id: REF_A, match_id: 'HT-004' });
    await post('update_task_court', { match_id: 'HT-001', court: '3' });
    await post('accept_task', { match_id: 'HT-001', referee_id: REF_A });
    const startRes = await post('start_task', { match_id: 'HT-001', referee_id: REF_A, score_text: 'G1 9-3', match_name: '红队HT-001 vs 蓝队HT-001' });
    assert.equal(startRes.status, 'success', `start_task 失败: ${JSON.stringify(startRes)}`);
    // 换场到 court 2
    const r = await post('update_task_court', { match_id: 'HT-001', court: '2' });
    assert.equal(r.status, 'success');
    const dash = await get('get_full_dashboard');
    assert.equal(dash.courts['2'].match_id, 'HT-001');
    assert.equal(dash.courts['2'].score, 'G1 9-3', '比分必须从权威数据保留，不得默认 0-0');
    assert.equal(dash.courts['2'].status, '比赛中');
  });

  it('H19: 目标场地被其他 task 占用 → 拒绝且零写入（含 tasks KV）', async () => {
    assert.ok(available, '服务不可达');
    const before = await snapshot();
    // HT-005（court=1）→ 迁到 2（被 HT-001 比赛中投影占用）
    const r = await post('update_task_court', { match_id: 'HT-005', court: '2' });
    assert.equal(r.status, 'error');
    assert.match(r.message || '', /已被其他任务|占用/);
    const after = await snapshot();
    assert.equal(after.courts, before.courts, 'live_scores 零写入');
    assert.equal(after.tasks, before.tasks, 'tasks KV 零写入（不得先改 task.court）');
  });

  it('H20: 换场后仅存在一个投影（不出现双投影）', async () => {
    assert.ok(available, '服务不可达');
    const dash = await get('get_full_dashboard');
    let count = 0;
    for (const c of Object.values(dash.courts || {})) {
      if (c.match_id === 'HT-001') count++;
    }
    assert.equal(count, 1, 'HT-001 只能在一个场地出现投影');
  });
});

// ======================== 清理 ========================
describe('隔离赛事清理', () => {
  after(async () => {
    // 兜底：无论成败都尝试删除隔离赛事（测试后清理，非手工 SQL）
    if (!available) return;
    try {
      await post('super_admin_delete_event', { super_pwd: SUPER_PWD, target_code: EVENT_CODE });
    } catch (e) { /* ignore */ }
  });

  it('H21: 通过赛事整体删除 API 清理临时赛事', async () => {
    assert.ok(available, '服务不可达');
    const r = await post('super_admin_delete_event', { super_pwd: SUPER_PWD, target_code: EVENT_CODE });
    assert.equal(r.status, 'success');
    const cfg = await get('get_event_config');
    assert.ok(!cfg.data || Object.keys(cfg.data).length === 0, '隔离赛事应已被删除');
  });
});
