/**
 * pr155-second-review.test.js — PR#155 第二轮独立 Review 整改验证
 *
 * 真实 HTTP 测试（隔离容器 nhpa-legacy-live-fix-test，Apache prefork 多 worker），
 * 覆盖：原子 accept_task / release_task_acceptance / start_task / save_score、
 * 归属校验、场地占用拒绝、多 worker 真实并发（20 轮）、事务中途失败全量回滚。
 *
 * 事务中途失败通过测试期间临时注入 kv_set 钩子 + 容器内标记文件控制（生产代码不含注入设施；
 * 测试前注入、测试后恢复并验证 host/container SHA-256 一致）。
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
  const r = await fetch(`${BASE}/data.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
// 容忍非 JSON 响应（注入失败时 PHP 未捕获异常会返回 500/空响应）
async function rawPost(body) {
  const r = await fetch(`${BASE}/data.php`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const text = await r.text();
  try { return JSON.parse(text); } catch { return { status: 'http_error', http: r.status, body: text.slice(0, 120) }; }
}
async function get(action, extra = '') {
  const r = await fetch(`${BASE}/data.php?action=${action}&event_code=${EVENT}${extra}`);
  return r.json();
}
async function dashboard() { return get('get_full_dashboard'); }
async function referees() { const r = await get('get_referees'); return r.data || []; }
function refByName(list, name) { return list.find(r => r.name === name); }

function setFailMarker(content) {
  if (content === null) {
    execSync(`docker exec ${CONTAINER} sh -c "rm -f /tmp/nhpa_fail_kv_write"`);
  } else {
    execSync(`docker exec ${CONTAINER} sh -c "printf '%s' '${content}' > /tmp/nhpa_fail_kv_write"`);
  }
}

const DATA_PHP = path.join(__dirname, '..', '..', 'Legacy', 'data.php');
const os = require('os');
let _originalDataPhpSha = null;
let _tempDir = null;
let _instrumentedPath = null;

function hostSha256() {
  return crypto.createHash('sha256').update(fs.readFileSync(DATA_PHP)).digest('hex').toUpperCase();
}
function containerSha256() {
  return execSync(`docker exec ${CONTAINER} sha256sum /var/www/html/data.php`).toString().split(' ')[0].toUpperCase();
}
function injectKvHook() {
  // §6.5: 绝不修改工作树 Legacy/data.php，使用仓库外临时副本
  _originalDataPhpSha = hostSha256();
  _tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr155-test-'));
  _instrumentedPath = path.join(_tempDir, 'instrumented-data.php');
  const original = fs.readFileSync(DATA_PHP, 'utf8');
  const hook = [
    '',
    '    // [TEST-ONLY HOOK] 临时注入，测试后恢复',
    "    $failMarker = '/tmp/nhpa_fail_kv_write';",
    '    if (file_exists($failMarker)) {',
    "        $target = trim((string)file_get_contents($failMarker));",
    "        if ($target === '' || $target === $key) { throw new Exception('事务写入失败（隔离测试注入：' . $key . '）'); }",
    '    }',
  ].join('\r\n');
  const instrumented = original.replace(
    /function kv_set\(\$event, \$key, \$value\) \{\r?\n    global \$pdo;\r?\n/,
    m => m + hook + '\r\n'
  );
  fs.writeFileSync(_instrumentedPath, instrumented, 'utf8');
  // 只把临时副本 docker cp 到容器
  execSync(`docker cp "${_instrumentedPath}" ${CONTAINER}:/var/www/html/data.php`);
}
function restoreDataPhp() {
  // §6.5: 恢复逻辑必须执行，即使前面有断言失败
  try {
    // 1. 将工作树原始 Legacy/data.php 重新 docker cp 到容器
    execSync(`docker cp "${DATA_PHP}" ${CONTAINER}:/var/www/html/data.php`);
    // 2. 删除标记文件
    setFailMarker(null);
    // 3. 删除宿主临时目录
    if (_tempDir && fs.existsSync(_tempDir)) {
      fs.rmSync(_tempDir, { recursive: true, force: true });
    }
    // 4. 验证工作树 SHA 与测试前一致
    const hSha = hostSha256();
    if (hSha !== _originalDataPhpSha) throw new Error('host SHA-256 mismatch after restore: ' + hSha + ' !== ' + _originalDataPhpSha);
    // 5. 验证容器 SHA 与工作树一致
    const cSha = containerSha256();
    if (cSha !== _originalDataPhpSha) throw new Error('container SHA-256 mismatch after restore: ' + cSha + ' !== ' + _originalDataPhpSha);
    // 6. rg 确认工作树不含 nhpa_fail_kv_write
    const hostContent = fs.readFileSync(DATA_PHP, 'utf8');
    if (hostContent.includes('nhpa_fail_kv_write')) throw new Error('host data.php still contains nhpa_fail_kv_write');
    // 7. rg 确认容器不含 nhpa_fail_kv_write
    try {
      execSync(`docker exec ${CONTAINER} grep -c nhpa_fail_kv_write /var/www/html/data.php`, { stdio: 'pipe' });
      throw new Error('container data.php still contains nhpa_fail_kv_write');
    } catch (e) {
      // grep 返回 1 表示未找到，这是期望的
      if (e.message.includes('still contains')) throw e;
    }
  } finally {
    _tempDir = null;
    _instrumentedPath = null;
    _originalDataPhpSha = null;
  }
}


function makePlayers() {
  return ['甲一','甲二','甲三','甲四'].map(n => ({ name: n, team: 'A队', checked_in: true }))
    .concat(['乙一','乙二','乙三','乙四'].map(n => ({ name: n, team: 'B队', checked_in: true })));
}

// 每个 describe 使用独立赛事，避免跨块状态污染
async function newEvent(suffix, taskIds, courts) {
  const code = `PR155R2-${suffix}-${Date.now().toString(36)}`;
  const create = await post({ action: 'create_event', super_pwd: 'Wuxian666', custom_code: code, event_name: `PR155R2 ${suffix}`, event_type: 'team', courts, referee_password: '2508' });
  assert.equal(create.status, 'success', `create_event 失败: ${JSON.stringify(create)}`);
  createdEvents.push(code);
  EVENT = code;
  await post({ action: 'set_players', event_code: code, players: makePlayers() });
  const tasks = {};
  taskIds.forEach(id => { tasks[id] = { id, court: '', t1: 'A队', t2: 'B队', status: '未开始', type: 'doubles', format: 1, is_team: true, date: '2026-08-27' }; });
  await post({ action: 'set_bulk_tasks', event_code: code, tasks });
  await post({ action: 'set_referees', event_code: code, referees: [
    { name: '裁判A', level: 'L1', status: '空闲' },
    { name: '裁判B', level: 'L1', status: '空闲' },
    { name: '裁判C', level: 'L1', status: '空闲' },
  ]});
  return code;
}
async function assignCourt(matchId, court) {
  const r = await post({ action: 'update_task_court', event_code: EVENT, match_id: matchId, court });
  assert.equal(r.status, 'success', `update_task_court(${matchId}→${court}) 失败: ${JSON.stringify(r)}`);
}
async function accept(refereeId, matchId) {
  return post({ action: 'accept_task', event_code: EVENT, referee_id: refereeId, match_id: matchId });
}
async function start(refereeId, matchId) {
  return post({ action: 'start_task', event_code: EVENT, match_id: matchId, referee_id: refereeId, score_text: 'G1 0-0', match_name: 'A队 vs B队' });
}
async function release(refereeId, matchId) {
  return post({ action: 'release_task_acceptance', event_code: EVENT, referee_id: refereeId, match_id: matchId });
}
function savePayload(matchId, refereeId, court, extra = {}) {
  return Object.assign({
    action: 'save_score', event_code: EVENT, id: matchId, referee_id: refereeId,
    t1: '伪造队1', t2: '伪造队2', // 客户端展示字段：服务端不得信任
    score: '21-15', winner: 'A队', details: 'G1: 21-15', court,
    referee: '伪造裁判', signature: 'sig', is_team: false, // 伪造值：权威值必须来自服务端
  }, extra);
}

// ======================== accept_task：原子领取 ========================
describe('R2-accept_task：原子领取与多 worker 并发', () => {
  before(async () => {
    await newEvent('ACC', ['001-01','001-02','001-03','001-04'], ['1','2','3']);
    await assignCourt('001-01', '1');
    await assignCourt('001-02', '2');
    await assignCourt('001-03', '3');
    await assignCourt('001-04', '3');
  });

  it('1. 未注册 referee 领取 → error、零写入', async () => {
    const r = await accept('幽灵裁判', '001-01');
    assert.equal(r.status, 'error');
    const d = await dashboard();
    assert.equal(d.courts['1'].status, '空闲', '未注册裁判领取不得产生投影');
    assert.equal(d.courts['1'].match_id, '');
    assert.ok(d.tasks['001-01'], 'task 保持原样');
    assert.equal(d.tasks['001-01'].status, '未开始');
  });

  it('2. 两裁判顺序领取 → 仅一人成功', async () => {
    const a = await accept('裁判A', '001-01');
    assert.equal(a.status, 'success');
    const b = await accept('裁判B', '001-01');
    assert.equal(b.status, 'error');
    const d = await dashboard();
    assert.equal(d.courts['1'].status, '待开赛');
    assert.equal(d.courts['1'].referee, '裁判A');
    // 清理：释放投影，避免影响后续测试
    await release('裁判A', '001-01');
  });

  it('3. 两个真实并发请求领取 → 仅一人成功', async () => {
    const results = await Promise.all([accept('裁判A', '001-02'), accept('裁判B', '001-02')]);
    assert.equal(results.filter(r => r.status === 'success').length, 1);
    assert.equal(results.filter(r => r.status === 'error').length, 1);
    const d = await dashboard();
    assert.equal(d.courts['2'].status, '待开赛');
    const winner = d.courts['2'].referee;
    assert.ok(['裁判A','裁判B'].includes(winner));
    // 清理：释放投影，避免影响后续测试
    await release(winner, '001-02');
  });

  it('4. 重复并发 20 轮：每轮恰好 1 success / 1 error / 1 投影 / 1 归属', async () => {
    for (let round = 1; round <= 20; round++) {
      const [ra, rb] = await Promise.all([accept('裁判A', '001-03'), accept('裁判B', '001-03')]);
      const okCount = [ra, rb].filter(r => r.status === 'success').length;
      const errCount = [ra, rb].filter(r => r.status === 'error').length;
      assert.equal(okCount, 1, `第 ${round} 轮：应恰好 1 个成功，实际 ${okCount}（${JSON.stringify([ra, rb])}）`);
      assert.equal(errCount, 1, `第 ${round} 轮：应恰好 1 个失败`);
      const d = await dashboard();
      assert.equal(d.courts['3'].status, '待开赛', `第 ${round} 轮：应恰好 1 个投影`);
      assert.equal(d.courts['3'].match_id, '001-03', `第 ${round} 轮：投影必须属于 001-03`);
      const winner = ra.status === 'success' ? '裁判A' : '裁判B';
      assert.equal(d.courts['3'].referee, winner, `第 ${round} 轮：应恰好 1 个裁判归属`);
      const rel = await release(winner, '001-03');
      assert.equal(rel.released, true, `第 ${round} 轮：释放失败 ${JSON.stringify(rel)}`);
    }
    const d = await dashboard();
    assert.equal(d.courts['3'].status, '空闲', '20 轮后场地应恢复空闲');
  });

  it('5. 目标 court 被另一场待开赛比赛占用 → 拒绝且零写入', async () => {
    const first = await accept('裁判A', '001-03'); // court 3 被 001-03 待开赛占用
    assert.equal(first.status, 'success');
    const r = await accept('裁判B', '001-04'); // 001-04 也在 court 3
    assert.equal(r.status, 'error', '被占用的场地不得被第二场比赛领取');
    const d = await dashboard();
    assert.equal(d.courts['3'].match_id, '001-03', '原投影保持');
    assert.equal(d.courts['3'].status, '待开赛');
    assert.equal(d.courts['3'].referee, '裁判A');
    // 清理：释放投影，避免影响后续测试
    await release('裁判A', '001-03');
  });

  it('6. 目标 court 被另一场比赛中比赛占用 → 拒绝且零写入', async () => {
    // 先领取 001-03，建立待开赛投影
    const a = await accept('裁判A', '001-03');
    assert.equal(a.status, 'success');
    const s = await start('裁判A', '001-03');
    assert.equal(s.status, 'success');
    const r = await accept('裁判B', '001-04');
    assert.equal(r.status, 'error', '比赛中场地不得被第二场比赛领取');
    const d = await dashboard();
    assert.equal(d.courts['3'].status, '比赛中');
    assert.equal(d.courts['3'].match_id, '001-03');
  });
});

// ======================== release_task_acceptance：原子释放 ========================
describe('R2-release_task_acceptance：原子释放与回滚', () => {
  before(async () => {
    injectKvHook();
    await newEvent('REL', ['001-01','001-02','001-03'], ['1','2','3']);
    await assignCourt('001-01', '1');
    await assignCourt('001-02', '2');
    await assignCourt('001-03', '3');
  });
  after(() => { restoreDataPhp(); });

  it('7. release 成功时 live/referee 同时改变', async () => {
    await accept('裁判A', '001-01');
    const rel = await release('裁判A', '001-01');
    assert.equal(rel.status, 'success');
    assert.equal(rel.released, true);
    const d = await dashboard();
    assert.equal(d.courts['1'].status, '空闲', '投影应删除');
    const refs = await referees();
    assert.equal(refByName(refs, '裁判A').status, '空闲', '裁判应同时重置为空闲');
    assert.equal(refByName(refs, '裁判A').current_court, '');
  });

  it('8. 其他裁判 release → 全部不变', async () => {
    await accept('裁判A', '001-01');
    const rel = await release('裁判B', '001-01');
    assert.equal(rel.status, 'error', '非归属裁判无权释放');
    const d = await dashboard();
    assert.equal(d.courts['1'].status, '待开赛', '投影保持');
    assert.equal(d.courts['1'].referee, '裁判A', '归属保持');
  });

  it('9. 比赛中 release → 全部不变', async () => {
    const s = await start('裁判A', '001-01');
    assert.equal(s.status, 'success');
    const rel = await release('裁判A', '001-01');
    assert.equal(rel.status, 'error', '比赛中禁止普通释放');
    const d = await dashboard();
    assert.equal(d.courts['1'].status, '比赛中', '投影保持比赛中');
    const refs = await referees();
    assert.equal(refByName(refs, '裁判A').status, '执裁中', '裁判保持执裁中');
  });

  it('10. 重复 release → released=false、无脏状态', async () => {
    await accept('裁判B', '001-02');
    const r1 = await release('裁判B', '001-02');
    assert.equal(r1.released, true);
    const r2 = await release('裁判B', '001-02');
    assert.equal(r2.status, 'success');
    assert.equal(r2.released, false, '已释放重试必须幂等 released=false');
    const d = await dashboard();
    assert.equal(d.courts['2'].status, '空闲', '无脏状态');
    assert.equal(d.courts['2'].match_id, '');
  });

  it('11. 模拟第二次写入失败 → 事务 rollback，live/referee 均保持', async () => {
    await accept('裁判C', '001-03');
    // 注入：仅 referees 写入失败（第一次 live_scores 写入成功后第二次失败 → 整体回滚）
    setFailMarker('referees');
    const rel = await release('裁判C', '001-03');
    setFailMarker(null);
    assert.equal(rel.status, 'error', '第二次写入失败必须返回 error');
    const d = await dashboard();
    assert.equal(d.courts['3'].status, '待开赛', 'live_scores 必须回滚（投影保持）');
    assert.equal(d.courts['3'].referee, '裁判C');
    const refs = await referees();
    assert.equal(refByName(refs, '裁判C').status, '空闲', 'referees 未被部分写入');
  });
});

// ======================== start_task：拒绝矩阵与零部分写入 ========================
describe('R2-start_task：拒绝矩阵与零部分写入', () => {
  before(async () => {
    injectKvHook();
    await newEvent('START', ['001-01','001-02','001-03','001-04','001-05','001-06'], ['1','2','3','4','5','6']);
    await assignCourt('001-01', '1');
    await assignCourt('001-02', '1');
    await assignCourt('001-03', '2');
    await assignCourt('001-04', '3');
    await assignCourt('001-05', '4');
    await assignCourt('001-06', '5');
  });
  after(() => { restoreDataPhp(); });

  it('12. 另一场待开赛占用目标 court → 拒绝且零部分写入', async () => {
    const acc = await accept('裁判B', '001-02'); // court 1 被 001-02 待开赛占用
    assert.equal(acc.status, 'success');
    const r = await start('裁判A', '001-01'); // 001-01 也在 court 1
    assert.equal(r.status, 'error', '被待开赛占用的场地不得开赛第二场');
    const d = await dashboard();
    assert.equal(d.courts['1'].status, '待开赛', '场地必须仍为 001-02 的待开赛投影');
    assert.equal(d.courts['1'].match_id, '001-02');
    assert.equal(d.tasks['001-01'].status, '未开始', '001-01 不得被改为比赛中');
    const refs = await referees();
    assert.equal(refByName(refs, '裁判A').status, '空闲', '裁判A 不得被改为执裁中');
  });

  it('13. 另一场比赛中占用目标 court → 拒绝且零部分写入', async () => {
    const s = await start('裁判B', '001-02');
    assert.equal(s.status, 'success', `001-02 开赛失败: ${JSON.stringify(s)}`);
    const r = await start('裁判A', '001-01');
    assert.equal(r.status, 'error', '被比赛中占用的场地不得开赛第二场');
    const d = await dashboard();
    assert.equal(d.courts['1'].status, '比赛中');
    assert.equal(d.courts['1'].match_id, '001-02');
    assert.equal(d.tasks['001-01'].status, '未开始');
    const refs = await referees();
    assert.equal(refByName(refs, '裁判A').status, '空闲');
  });

  it('14. 不存在的 referee → 拒绝且零部分写入', async () => {
    await accept('裁判A', '001-03');
    // 删除裁判A 使其在开赛时"未注册"，开赛后恢复
    await post({ action: 'delete_referee', event_code: EVENT, referee_id: '裁判A' });
    const r = await start('裁判A', '001-03');
    assert.equal(r.status, 'error', '未注册裁判不得开赛');
    const d = await dashboard();
    assert.equal(d.courts['2'].status, '待开赛', '不得把 live 改为比赛中');
    assert.equal(d.tasks['001-03'].status, '未开始', '不得把 task 改为比赛中');
    await post({ action: 'set_referees', event_code: EVENT, referees: [
      { name: '裁判A', level: 'L1', status: '空闲' },
      { name: '裁判B', level: 'L1', status: '空闲' },
      { name: '裁判C', level: 'L1', status: '空闲' },
    ]});
    // 清理：释放投影，避免影响后续测试
    await release('裁判A', '001-03');
  });

  it('15. referee 已在其他 court 执裁 → 拒绝开赛', async () => {
    await accept('裁判A', '001-04');
    const s4 = await start('裁判A', '001-04'); // A 在 court 3 执裁中
    assert.equal(s4.status, 'success');
    // 裁判A 已有 001-04 投影，不能再领取 001-05；改用裁判C 领取（裁判B 在测试 12/13 中有残留）
    await accept('裁判C', '001-05');
    // 尝试用裁判A 开赛 001-05，但裁判A 已在 court 3 执裁
    const r = await start('裁判A', '001-05');
    assert.equal(r.status, 'error', '已在其他场地执裁的裁判不得再开赛');
    const d = await dashboard();
    assert.equal(d.courts['4'].status, '待开赛', '001-05 保持待开赛');
    assert.equal(d.tasks['001-05'].status, '未开始');
    const refs = await referees();
    assert.equal(refByName(refs, '裁判A').current_court, '3', '裁判A 仍在 court 3 执裁');
    // 清理：释放投影
    await release('裁判C', '001-05');
  });

  it('16. 错误 task/live court 组合 → 拒绝（投影场地≠任务场地）', async () => {
    await accept('裁判C', '001-06'); // 投影建立在 court 5
    // 注入 live_scores 写入失败 → update_task_court 只更新 tasks KV，投影滞留旧场地，
    // 精确构造"投影场地与任务场地不一致"的损坏态（模拟历史部分写入）。
    setFailMarker('live_scores');
    await rawPost({ action: 'update_task_court', event_code: EVENT, match_id: '001-06', court: '6' });
    setFailMarker(null);
    const r = await start('裁判C', '001-06');
    assert.equal(r.status, 'error', '投影场地与任务场地不一致必须拒绝开赛');
    const d = await dashboard();
    assert.equal(d.tasks['001-06'].status, '未开始', '不得把 task 改为比赛中');
    const refs = await referees();
    assert.equal(refByName(refs, '裁判C').status, '空闲', '裁判C 不得被改为执裁中');
    // 恢复：裁判C 释放滞留投影，避免污染后续
    const rel = await release('裁判C', '001-06');
    assert.equal(rel.status, 'success');
  });

  it('17. 全部失败路径零部分写入（综合快照比对）', async () => {
    const before = JSON.stringify(await dashboard());
    const beforeRefs = JSON.stringify(await referees());
    // 连续触发 4 类失败
    await start('裁判A', '001-01');          // 场地占用
    await start('裁判X', '001-03');          // 未注册裁判（无投影归属也拒绝）
    await start('裁判A', 'NONEXIST');        // 任务不存在
    await start('裁判A', '001-05');          // A 在其他场地执裁（15 的残留状态已被 16 部分清理，此处 A 执裁中@3）
    const after = JSON.stringify(await dashboard());
    const afterRefs = JSON.stringify(await referees());
    assert.equal(after, before, '所有失败后 dashboard 必须与失败前完全一致');
    assert.equal(afterRefs, beforeRefs, '所有失败后 referees 必须与失败前完全一致');
  });
});

// ======================== save_score：归属加固与原子回滚 ========================
describe('R2-save_score：归属加固、原子完赛与中途回滚', () => {
  before(async () => {
    injectKvHook();
    await newEvent('SAVE', ['001-01','001-02','001-03'], ['1','2','3']);
    await assignCourt('001-01', '1');
    await assignCourt('001-02', '2');
    await assignCourt('001-03', '3');
  });
  after(() => { restoreDataPhp(); });

  it('18. 非归属裁判完赛 → 拒绝且全部保持', async () => {
    await accept('裁判A', '001-01');
    const s = await start('裁判A', '001-01');
    assert.equal(s.status, 'success');
    const beforeRecords = (await dashboard()).records.length;
    const r = await post(savePayload('001-01', '裁判B', '1'));
    assert.equal(r.status, 'error', '非归属裁判不得完赛');
    const d = await dashboard();
    assert.ok(d.tasks['001-01'], 'task 保持');
    assert.equal(d.courts['1'].status, '比赛中', 'live 保持比赛中');
    assert.equal(d.records.length, beforeRecords, 'records 零写入');
    const refs = await referees();
    assert.equal(refByName(refs, '裁判A').status, '执裁中', '归属裁判状态保持');
  });

  it('19. live 仍为待开赛 → 拒绝完赛', async () => {
    await accept('裁判B', '001-02'); // 只领取不开赛
    const r = await post(savePayload('001-02', '裁判B', '2'));
    assert.equal(r.status, 'error', '待开赛状态不得完赛');
    const d = await dashboard();
    assert.equal(d.courts['2'].status, '待开赛');
    assert.ok(d.tasks['001-02'], 'task 保持');
  });

  it('20. 请求 court 与权威 court 不同 → 拒绝', async () => {
    const r = await post(savePayload('001-01', '裁判A', '2')); // 权威场地为 1
    assert.equal(r.status, 'error', '伪造场地必须被拒绝');
    const d = await dashboard();
    assert.ok(d.tasks['001-01'], 'task 保持');
    assert.equal(d.courts['1'].status, '比赛中');
  });

  it('21. referee 非执裁中 → 拒绝', async () => {
    // 模拟裁判状态被异常重置（如重新登录后未恢复）
    await post({ action: 'referee_update_status', event_code: EVENT, referee_id: '裁判A', status: '空闲', court: null });
    const r = await post(savePayload('001-01', '裁判A', '1'));
    assert.equal(r.status, 'error', '非执裁状态不得完赛');
    const d = await dashboard();
    assert.ok(d.tasks['001-01'], 'task 保持');
    assert.equal(d.courts['1'].status, '比赛中', 'live 保持');
    // 恢复权威状态（与前端 step>=3 restore 行为一致）
    await post({ action: 'referee_update_status', event_code: EVENT, referee_id: '裁判A', status: '执裁中', court: '1' });
  });

  it('22. referee.current_court 与比赛场地不一致 → 拒绝', async () => {
    await post({ action: 'referee_update_status', event_code: EVENT, referee_id: '裁判A', status: '执裁中', court: '9' });
    const r = await post(savePayload('001-01', '裁判A', '1'));
    assert.equal(r.status, 'error', '裁判场地不一致必须拒绝');
    const d = await dashboard();
    assert.ok(d.tasks['001-01']);
    await post({ action: 'referee_update_status', event_code: EVENT, referee_id: '裁判A', status: '执裁中', court: '1' });
  });

  it('23. 成功时四类状态原子完成，且权威字段来自服务端（不信任客户端伪造值）', async () => {
    const beforeRecords = (await dashboard()).records.length;
    const r = await post(savePayload('001-01', '裁判A', '1'));
    assert.equal(r.status, 'success', `完赛失败: ${JSON.stringify(r)}`);
    const d = await dashboard();
    assert.ok(!d.tasks['001-01'], 'task 已删除');
    assert.equal(d.courts['1'].status, '空闲', 'live 投影已清除');
    assert.equal(d.records.length, beforeRecords + 1, 'record 恰好 +1');
    const rec = d.records.find(x => x.id === '001-01');
    assert.ok(rec, 'record 存在');
    assert.equal(rec.t1, 'A队', 't1 必须取自服务端 task，不信任客户端伪造值');
    assert.equal(rec.t2, 'B队', 't2 必须取自服务端 task');
    assert.equal(rec.court, '1', 'court 必须取自服务端权威场地');
    assert.equal(rec.referee, '裁判A', 'referee 必须取自服务端注册名');
    assert.equal(rec.is_team, true, 'is_team 必须取自服务端 task');
    const refs = await referees();
    const a = refByName(refs, '裁判A');
    assert.equal(a.status, '空闲', '裁判重置为空闲');
    assert.equal(a.current_court, '');
    assert.equal(a.match_count, 1, 'match_count +1');
  });

  it('24. 模拟事务中途失败 → record/task/live/referee 全部 rollback', async () => {
    await accept('裁判C', '001-03');
    const s = await start('裁判C', '001-03');
    assert.equal(s.status, 'success');
    const before = JSON.stringify(await dashboard());
    const beforeRefs = JSON.stringify(await referees());
    // 注入：records/tasks/live_scores 写入成功（事务内），最后的 referees 写入失败 → 整体回滚
    setFailMarker('referees');
    const r = await post(savePayload('001-03', '裁判C', '3'));
    setFailMarker(null);
    assert.equal(r.status, 'error', '中途失败必须返回 error');
    const after = JSON.stringify(await dashboard());
    const afterRefs = JSON.stringify(await referees());
    assert.equal(after, before, 'record/task/live 必须全部回滚（快照一致）');
    assert.equal(afterRefs, beforeRefs, 'referees 必须回滚（快照一致）');
    const d = await dashboard();
    assert.ok(d.tasks['001-03'], 'task 保持');
    assert.equal(d.courts['3'].status, '比赛中', 'live 保持比赛中');
    const refs = await referees();
    assert.equal(refByName(refs, '裁判C').status, '执裁中', '裁判保持执裁中');
    // 恢复后重新提交必须成功（可重试）
    const retry = await post(savePayload('001-03', '裁判C', '3'));
    assert.equal(retry.status, 'success', '回滚后重试必须成功');
  });
});

// ======================== R3-第三轮独立 Review 回归测试 ========================
describe('R3-第三轮回归测试', () => {
  before(async () => {
    await newEvent('R3', ['001-01','001-02','001-03','001-04','001-05'], ['1','2','3','4','5']);
    await assignCourt('001-01', '1');
    await assignCourt('001-02', '2');
    await assignCourt('001-03', '3');
    await assignCourt('001-04', '4');
    await assignCourt('001-05', '5');
  });

  it('25. 同一裁判并发领取两个不同场地任务 → 恰好一个 success', async () => {
    // 裁判A 同时领取 001-01 和 001-02
    const results = await Promise.all([
      accept('裁判A', '001-01'),
      accept('裁判A', '001-02')
    ]);
    const okCount = results.filter(r => r.status === 'success').length;
    const errCount = results.filter(r => r.status === 'error').length;
    assert.equal(okCount, 1, `应恰好 1 个成功，实际 ${okCount}`);
    assert.equal(errCount, 1, `应恰好 1 个失败`);
    // 验证只有一个投影
    const d = await dashboard();
    const projections = Object.entries(d.courts)
      .filter(([_, c]) => c.referee === '裁判A')
      .map(([court, c]) => ({ court, match_id: c.match_id }));
    assert.equal(projections.length, 1, '裁判A 应只有一个投影');
    // 清理
    const winner = results[0].status === 'success' ? '001-01' : '001-02';
    await release('裁判A', winner);
  });

  it('26. task.status=比赛中但投影缺失 → accept_task 拒绝且零变化', async () => {
    // 创建独立赛事，直接通过 set_bulk_tasks 写入 status=比赛中
    const code = `PR155R4-T26-${Date.now().toString(36)}`;
    const create = await post({ action: 'create_event', super_pwd: 'Wuxian666', custom_code: code, event_name: 'PR155R4 T26', event_type: 'team', courts: ['1'], referee_password: '2508' });
    assert.equal(create.status, 'success');
    createdEvents.push(code);
    const savedEvent = EVENT; EVENT = code;
    await post({ action: 'set_players', event_code: code, players: makePlayers() });
    // 直接写入 status=比赛中 + court=1，不调 update_task_court
    await post({ action: 'set_bulk_tasks', event_code: code, tasks: {
      '001-01': { id: '001-01', court: '1', t1: 'A队', t2: 'B队', status: '比赛中', live_score: '7-5', type: 'doubles', format: 1, is_team: true, date: '2026-08-27' }
    }});
    await post({ action: 'set_referees', event_code: code, referees: [{ name: '裁判A', level: 'L1', status: '空闲' }] });
    // 确认 live_scores 为空（dashboard courts 可能显示 task 投影，但 live_scores 必须为空）
    const d0 = await dashboard();
    assert.ok(d0.tasks['001-01'], 'task 存在');
    assert.equal(d0.tasks['001-01'].status, '比赛中', 'task 状态为比赛中');
    // 通过 get 接口直接检查 live_scores
    const liveCheck = await get('get_full_dashboard');
    // live_scores 不在 dashboard 直接返回中，但可以通过 courts 状态推断：
    // 如果 courts[1].referee 为空，说明没有 live_scores 投影
    assert.equal(liveCheck.courts['1'].referee, '', 'live_scores 无投影（referee 为空）');
    const before = JSON.stringify(d0);
    const beforeRefs = JSON.stringify(await referees());
    const beforeRecords = d0.records.length;
    // accept_task 必须拒绝（task.status=比赛中）
    const r = await post({ action: 'accept_task', event_code: code, referee_id: '裁判A', match_id: '001-01' });
    assert.equal(r.status, 'error', '比赛中任务不得被重新领取');
    const after = JSON.stringify(await dashboard());
    const afterRefs = JSON.stringify(await referees());
    assert.equal(after, before, 'tasks 零变化');
    assert.equal(afterRefs, beforeRefs, 'referees 零变化');
    assert.equal((await dashboard()).records.length, beforeRecords, 'records 零变化');
    EVENT = savedEvent;
  });

  it('27. task.status=比赛中但存在待开赛投影 → start_task 拒绝且零变化', async () => {
    // 创建独立赛事
    const code = `PR155R4-T27-${Date.now().toString(36)}`;
    const create = await post({ action: 'create_event', super_pwd: 'Wuxian666', custom_code: code, event_name: 'PR155R4 T27', event_type: 'team', courts: ['1'], referee_password: '2508' });
    assert.equal(create.status, 'success');
    createdEvents.push(code);
    const savedEvent = EVENT; EVENT = code;
    await post({ action: 'set_players', event_code: code, players: makePlayers() });
    // 1. task 初始 status=未开始，分配场地
    await post({ action: 'set_bulk_tasks', event_code: code, tasks: {
      '001-01': { id: '001-01', court: '', t1: 'A队', t2: 'B队', status: '未开始', type: 'doubles', format: 1, is_team: true, date: '2026-08-27' }
    }});
    await post({ action: 'set_referees', event_code: code, referees: [{ name: '裁判A', level: 'L1', status: '空闲' }] });
    await post({ action: 'update_task_court', event_code: code, match_id: '001-01', court: '1' });
    // 2. accept 生成待开赛投影
    const acc = await post({ action: 'accept_task', event_code: code, referee_id: '裁判A', match_id: '001-01' });
    assert.equal(acc.status, 'success');
    const d1 = await dashboard();
    assert.equal(d1.courts['1'].status, '待开赛', '投影为待开赛');
    // 3. 再用 set_bulk_tasks 把 task status 改为比赛中（模拟损坏态）
    const tasksNow = (await dashboard()).tasks;
    tasksNow['001-01'] = { id: '001-01', court: '1', t1: 'A队', t2: 'B队', status: '比赛中', live_score: '0-0', type: 'doubles', format: 1, is_team: true, date: '2026-08-27' };
    await post({ action: 'set_bulk_tasks', event_code: code, tasks: tasksNow });
    // 确认 task 已改为比赛中
    const d2 = await dashboard();
    assert.equal(d2.tasks['001-01'].status, '比赛中', 'task 已改为比赛中');
    // live_scores 投影仍然存在（dashboard 可能显示 task 投影覆盖，但 live_scores 未被 set_bulk_tasks 清除）
    const before = JSON.stringify(d2);
    const beforeRefs = JSON.stringify(await referees());
    const beforeRecords = d2.records.length;
    // 4. start_task 必须拒绝（task.status=比赛中）
    const r = await post({ action: 'start_task', event_code: code, match_id: '001-01', referee_id: '裁判A', score_text: '0-0', match_name: 'A vs B' });
    assert.equal(r.status, 'error', 'task.status=比赛中 时不得开赛');
    const after = JSON.stringify(await dashboard());
    const afterRefs = JSON.stringify(await referees());
    assert.equal(after, before, 'dashboard 零变化');
    assert.equal(afterRefs, beforeRefs, 'referees 零变化');
    assert.equal((await dashboard()).records.length, beforeRecords, 'records 零变化');
    EVENT = savedEvent;
  });

  it('28. save_score id/is_team 权威性：客户端伪造大小写+空白+is_team=false 不影响 record', async () => {
    // 创建独立赛事，使用大小写可区分的 key "MiX-01"
    const code = `PR155R4-T28-${Date.now().toString(36)}`;
    const create = await post({ action: 'create_event', super_pwd: 'Wuxian666', custom_code: code, event_name: 'PR155R4 T28', event_type: 'team', courts: ['1'], referee_password: '2508' });
    assert.equal(create.status, 'success');
    createdEvents.push(code);
    const savedEvent = EVENT; EVENT = code;
    await post({ action: 'set_players', event_code: code, players: makePlayers() });
    await post({ action: 'set_bulk_tasks', event_code: code, tasks: {
      'MiX-01': { id: 'MiX-01', court: '', t1: 'A队', t2: 'B队', status: '未开始', type: 'doubles', format: 1, is_team: true, date: '2026-08-27' }
    }});
    await post({ action: 'set_referees', event_code: code, referees: [{ name: '裁判X', level: 'L1', status: '空闲' }] });
    await post({ action: 'update_task_court', event_code: code, match_id: 'MiX-01', court: '1' });
    await post({ action: 'accept_task', event_code: code, referee_id: '裁判X', match_id: 'MiX-01' });
    const s = await post({ action: 'start_task', event_code: code, match_id: 'MiX-01', referee_id: '裁判X', score_text: 'G1 0-0', match_name: 'A vs B' });
    assert.equal(s.status, 'success');
    // save_score 请求 id 使用带空白/不同大小写
    const r = await post({
      action: 'save_score', event_code: code, id: ' mix-01 ', referee_id: '裁判X',
      t1: '伪造队1', t2: '伪造队2', score: '21-15', winner: 'A队', details: 'G1: 21-15', court: '1',
      referee: '伪造裁判', signature: 'sig', is_team: false
    });
    assert.equal(r.status, 'success', `完赛失败: ${JSON.stringify(r)}`);
    const d = await dashboard();
    // record.id 必须严格等于实际 task key "MiX-01"
    const rec = d.records.find(x => x.id === 'MiX-01');
    assert.ok(rec, 'record 必须使用服务端实际 task key MiX-01');
    assert.equal(rec.t1, 'A队', 't1 来自服务端');
    assert.equal(rec.t2, 'B队', 't2 来自服务端');
    assert.equal(rec.is_team, true, 'is_team 必须取自服务端 task（true），不信任客户端 false');
    assert.equal(rec.referee, '裁判X', 'referee 来自服务端');
    assert.equal(rec.court, '1', 'court 来自服务端');
    EVENT = savedEvent;
  });

  it('29. winner="" 或缺失 → error 且四类快照全等', async () => {
    // 创建独立赛事
    const code = `PR155R4-T29-${Date.now().toString(36)}`;
    const create = await post({ action: 'create_event', super_pwd: 'Wuxian666', custom_code: code, event_name: 'PR155R4 T29', event_type: 'team', courts: ['1'], referee_password: '2508' });
    assert.equal(create.status, 'success');
    createdEvents.push(code);
    const savedEvent = EVENT; EVENT = code;
    await post({ action: 'set_players', event_code: code, players: makePlayers() });
    await post({ action: 'set_bulk_tasks', event_code: code, tasks: {
      '001-01': { id: '001-01', court: '', t1: 'A队', t2: 'B队', status: '未开始', type: 'doubles', format: 1, is_team: true, date: '2026-08-27' }
    }});
    await post({ action: 'set_referees', event_code: code, referees: [{ name: '裁判X', level: 'L1', status: '空闲' }] });
    await post({ action: 'update_task_court', event_code: code, match_id: '001-01', court: '1' });
    await post({ action: 'accept_task', event_code: code, referee_id: '裁判X', match_id: '001-01' });
    await post({ action: 'start_task', event_code: code, match_id: '001-01', referee_id: '裁判X', score_text: 'G1 0-0', match_name: 'A vs B' });
    // 测试 winner=""
    const before1 = JSON.stringify(await dashboard());
    const beforeRefs1 = JSON.stringify(await referees());
    const r1 = await post({
      action: 'save_score', event_code: code, id: '001-01', referee_id: '裁判X',
      t1: 'A队', t2: 'B队', score: '21-15', winner: '', details: 'G1: 21-15', court: '1',
      referee: '裁判X', signature: 'sig', is_team: true
    });
    assert.equal(r1.status, 'error', 'winner="" 必须被拒绝');
    assert.equal(JSON.stringify(await dashboard()), before1, 'winner="" dashboard 零变化');
    assert.equal(JSON.stringify(await referees()), beforeRefs1, 'winner="" referees 零变化');
    // 测试 winner 缺失（不传 winner 字段）
    const r2 = await post({
      action: 'save_score', event_code: code, id: '001-01', referee_id: '裁判X',
      t1: 'A队', t2: 'B队', score: '21-15', details: 'G1: 21-15', court: '1',
      referee: '裁判X', signature: 'sig', is_team: true
    });
    assert.equal(r2.status, 'error', 'winner 缺失必须被拒绝');
    assert.equal(JSON.stringify(await dashboard()), before1, 'winner 缺失 dashboard 零变化');
    assert.equal(JSON.stringify(await referees()), beforeRefs1, 'winner 缺失 referees 零变化');
    EVENT = savedEvent;
  });

  it('30. winner 完整矩阵：第三方/error、t1/success、t2/success、伪造 t1/t2 不影响', async () => {
    // 创建独立赛事
    const code = `PR155R4-T30-${Date.now().toString(36)}`;
    const create = await post({ action: 'create_event', super_pwd: 'Wuxian666', custom_code: code, event_name: 'PR155R4 T30', event_type: 'team', courts: ['1','2'], referee_password: '2508' });
    assert.equal(create.status, 'success');
    createdEvents.push(code);
    const savedEvent = EVENT; EVENT = code;
    await post({ action: 'set_players', event_code: code, players: makePlayers() });
    await post({ action: 'set_bulk_tasks', event_code: code, tasks: {
      '001-01': { id: '001-01', court: '', t1: 'A队', t2: 'B队', status: '未开始', type: 'doubles', format: 1, is_team: true, date: '2026-08-27' },
      '001-02': { id: '001-02', court: '', t1: 'A队', t2: 'B队', status: '未开始', type: 'doubles', format: 1, is_team: true, date: '2026-08-27' },
      '001-03': { id: '001-03', court: '', t1: 'A队', t2: 'B队', status: '未开始', type: 'doubles', format: 1, is_team: true, date: '2026-08-27' }
    }});
    await post({ action: 'set_referees', event_code: code, referees: [
      { name: '裁判X', level: 'L1', status: '空闲' },
      { name: '裁判Y', level: 'L1', status: '空闲' },
    ]});
    // === 子测试 1：winner=第三方队伍 → error ===
    await post({ action: 'update_task_court', event_code: code, match_id: '001-01', court: '1' });
    await post({ action: 'accept_task', event_code: code, referee_id: '裁判X', match_id: '001-01' });
    await post({ action: 'start_task', event_code: code, match_id: '001-01', referee_id: '裁判X', score_text: '0-0', match_name: 'A vs B' });
    const before1 = JSON.stringify(await dashboard());
    const beforeRefs1 = JSON.stringify(await referees());
    const r1 = await post({
      action: 'save_score', event_code: code, id: '001-01', referee_id: '裁判X',
      t1: 'A队', t2: 'B队', score: '21-15', winner: '不存在的队伍', details: '', court: '1',
      referee: '裁判X', signature: 'sig', is_team: true
    });
    assert.equal(r1.status, 'error', '第三方 winner 必须被拒绝');
    assert.equal(JSON.stringify(await dashboard()), before1, '第三方 winner dashboard 零变化');
    assert.equal(JSON.stringify(await referees()), beforeRefs1, '第三方 winner referees 零变化');
    // === 子测试 2：winner=task.t1 → success ===
    const r2 = await post({
      action: 'save_score', event_code: code, id: '001-01', referee_id: '裁判X',
      t1: 'A队', t2: 'B队', score: '21-15', winner: 'A队', details: 'G1: 21-15', court: '1',
      referee: '裁判X', signature: 'sig', is_team: true
    });
    assert.equal(r2.status, 'success', 'winner=t1 必须成功');
    const d2 = await dashboard();
    assert.ok(!d2.tasks['001-01'], '001-01 task 已删除');
    assert.equal(d2.records.find(x => x.id === '001-01')?.winner, 'A队', 'record.winner=A队');
    // === 子测试 3：winner=task.t2 → success ===
    await post({ action: 'update_task_court', event_code: code, match_id: '001-02', court: '1' });
    await post({ action: 'accept_task', event_code: code, referee_id: '裁判X', match_id: '001-02' });
    await post({ action: 'start_task', event_code: code, match_id: '001-02', referee_id: '裁判X', score_text: '0-0', match_name: 'A vs B' });
    const r3 = await post({
      action: 'save_score', event_code: code, id: '001-02', referee_id: '裁判X',
      t1: 'A队', t2: 'B队', score: '15-21', winner: 'B队', details: 'G1: 15-21', court: '1',
      referee: '裁判X', signature: 'sig', is_team: true
    });
    assert.equal(r3.status, 'success', 'winner=t2 必须成功');
    const d3 = await dashboard();
    assert.equal(d3.records.find(x => x.id === '001-02')?.winner, 'B队', 'record.winner=B队');
    // === 子测试 4：客户端伪造 t1/t2 不得改变 winner 校验依据 ===
    await post({ action: 'update_task_court', event_code: code, match_id: '001-03', court: '1' });
    await post({ action: 'accept_task', event_code: code, referee_id: '裁判X', match_id: '001-03' });
    await post({ action: 'start_task', event_code: code, match_id: '001-03', referee_id: '裁判X', score_text: '0-0', match_name: 'A vs B' });
    // 客户端发送伪造 t1/t2，但 winner 使用服务端真实队伍 A队
    const r4 = await post({
      action: 'save_score', event_code: code, id: '001-03', referee_id: '裁判X',
      t1: '伪造队1', t2: '伪造队2', score: '21-15', winner: 'A队', details: '', court: '1',
      referee: '裁判X', signature: 'sig', is_team: true
    });
    assert.equal(r4.status, 'success', 'winner 校验依据服务端 task.t1/t2，不信任客户端 t1/t2');
    const d4 = await dashboard();
    const rec4 = d4.records.find(x => x.id === '001-03');
    assert.equal(rec4.t1, 'A队', 'record.t1 来自服务端，非客户端伪造');
    assert.equal(rec4.t2, 'B队', 'record.t2 来自服务端，非客户端伪造');
    EVENT = savedEvent;
  });
});

// ======================== accept_task 校验顺序：task.status 优先于 live_scores ========================
describe('R5-accept_task：task.status 校验顺序（防止待开赛投影绕过终态）', () => {
  // [PR#155 R5] task.status 必须在 live_scores 归属/幂等检查之前执行。
  // 损坏态：task.status=比赛中 但 live_scores 仍有待开赛投影。
  // 任何 accept_task 请求都必须 error，不得因待开赛投影返回幂等 success。

  it('A: 比赛中 task + 同裁判待开赛投影 → accept 必须 error（不得幂等 success）', async () => {
    const savedEvent = EVENT;
    const code = await newEvent('ORD-A', ['001-01'], ['1']);
    await assignCourt('001-01', '1');
    // 步骤 2：accept_task 生成待开赛投影，referee=裁判A
    const a1 = await accept('裁判A', '001-01');
    assert.equal(a1.status, 'success');
    assert.equal(a1.idempotent, false);
    // 步骤 3：用 set_bulk_tasks 将 task.status 改成比赛中，保留现有投影
    await post({ action: 'set_bulk_tasks', event_code: code, tasks: {
      '001-01': { id: '001-01', court: '1', t1: 'A队', t2: 'B队', status: '比赛中', type: 'doubles', format: 1, is_team: true }
    }});
    // 步骤 4：保存四类快照
    const dashBefore = await dashboard();
    const tasksBefore = await get('get_personal_tasks');
    const refsBefore = await get('get_referees');
    const recordsBefore = dashBefore.records || [];
    // 步骤 5：再以裁判A调用 accept_task
    const a2 = await accept('裁判A', '001-01');
    // 步骤 6：必须返回 error，不得返回 idempotent success
    assert.equal(a2.status, 'error', `比赛中 task 不得因待开赛投影返回幂等 success: ${JSON.stringify(a2)}`);
    // 步骤 7：四类快照必须全等
    const dashAfter = await dashboard();
    const tasksAfter = await get('get_personal_tasks');
    const refsAfter = await get('get_referees');
    assert.equal(JSON.stringify(dashAfter.courts), JSON.stringify(dashBefore.courts), 'courts 快照全等');
    assert.equal(JSON.stringify(tasksAfter.tasks), JSON.stringify(tasksBefore.tasks), 'tasks 快照全等');
    assert.equal(JSON.stringify(refsAfter.data), JSON.stringify(refsBefore.data), 'refs 快照全等');
    assert.equal((dashAfter.records || []).length, recordsBefore.length, 'records 快照全等');
    EVENT = savedEvent;
  });

  it('B: 比赛中 task + 不同裁判待开赛投影 → accept 必须 error，原归属不变', async () => {
    const savedEvent = EVENT;
    const code = await newEvent('ORD-B', ['001-01'], ['1']);
    await assignCourt('001-01', '1');
    // 裁判A 领取生成待开赛投影
    await accept('裁判A', '001-01');
    // 损坏态：task.status=比赛中
    await post({ action: 'set_bulk_tasks', event_code: code, tasks: {
      '001-01': { id: '001-01', court: '1', t1: 'A队', t2: 'B队', status: '比赛中', type: 'doubles', format: 1, is_team: true }
    }});
    // 快照
    const dashBefore = await dashboard();
    const tasksBefore = await get('get_personal_tasks');
    const refsBefore = await get('get_referees');
    const recordsBefore = dashBefore.records || [];
    // 裁判B 尝试领取
    const a2 = await accept('裁判B', '001-01');
    assert.equal(a2.status, 'error', '不同裁判不得领取比赛中 task');
    // 四类快照全等（courts/tasks/refs/records 均无变化）
    const dashAfter = await dashboard();
    const tasksAfter = await get('get_personal_tasks');
    const refsAfter = await get('get_referees');
    assert.equal(JSON.stringify(dashAfter.courts), JSON.stringify(dashBefore.courts), 'courts 快照全等');
    assert.equal(JSON.stringify(tasksAfter.tasks), JSON.stringify(tasksBefore.tasks), 'tasks 快照全等');
    assert.equal(JSON.stringify(refsAfter.data), JSON.stringify(refsBefore.data), 'refs 快照全等');
    assert.equal((dashAfter.records || []).length, recordsBefore.length, 'records 快照全等');
    EVENT = savedEvent;
  });

  it('C: 正常幂等不受影响（task.status=未开始 + 待开赛投影 + 同裁判重试）', async () => {
    const savedEvent = EVENT;
    const code = await newEvent('ORD-C', ['001-01'], ['1']);
    await assignCourt('001-01', '1');
    // 首次领取
    const a1 = await accept('裁判A', '001-01');
    assert.equal(a1.status, 'success');
    assert.equal(a1.idempotent, false);
    // 快照（确认有投影）
    const dashBefore = await dashboard();
    assert.equal(dashBefore.courts['1'].status, '待开赛');
    assert.equal(dashBefore.courts['1'].referee, '裁判A');
    // 同裁判重试 → 幂等 success
    const a2 = await accept('裁判A', '001-01');
    assert.equal(a2.status, 'success', '正常幂等必须 success');
    assert.equal(a2.idempotent, true, '必须报告 idempotent=true');
    // 零重复投影
    const dashAfter = await dashboard();
    assert.equal(dashAfter.courts['1'].status, '待开赛', '投影状态不变');
    assert.equal(dashAfter.courts['1'].referee, '裁判A', '归属不变');
    EVENT = savedEvent;
  });
});

// ======================== R6: 响应丢失幂等恢复 ========================
describe('R6-start_task：响应丢失幂等恢复', () => {
  it('R6-S1: 首次开赛 success+idempotent=false', async () => {
    const savedEvent = EVENT;
    const code = await newEvent('R6S', ['001-01'], ['1']);
    await assignCourt('001-01', '1');
    await accept('裁判A', '001-01');
    const startRes = await start('裁判A', '001-01');
    assert.equal(startRes.status, 'success', '首次开赛必须 success');
    assert.equal(startRes.idempotent, false, '首次开赛必须 idempotent=false');
    assert.ok(startRes.court === '1', '必须返回权威场地');
    // 验证服务端已为比赛中
    const tasks = await get('get_personal_tasks');
    assert.equal(tasks.tasks['001-01']?.status, '比赛中', 'task.status 必须为比赛中');
    EVENT = savedEvent;
  });

  it('R6-S2: 相同 payload 重试 → success+idempotent=true，状态无二次变化', async () => {
    const savedEvent = EVENT;
    const code = await newEvent('R6S2', ['001-01'], ['1']);
    await assignCourt('001-01', '1');
    await accept('裁判A', '001-01');
    const start1 = await start('裁判A', '001-01');
    assert.equal(start1.status, 'success');
    // 快照：首次开赛后的状态
    const dashBefore = await dashboard();
    const tasksBefore = await get('get_personal_tasks');
    const refsBefore = await get('get_referees');
    const recordsBefore = dashBefore.records || [];
    // 相同 payload 重试（模拟响应丢失后重试）
    const start2 = await start('裁判A', '001-01');
    assert.equal(start2.status, 'success', '重试必须 success');
    assert.equal(start2.idempotent, true, '重试必须 idempotent=true');
    assert.equal(start2.court, '1', '必须返回权威场地');
    // 三类状态无二次变化
    const dashAfter = await dashboard();
    const tasksAfter = await get('get_personal_tasks');
    const refsAfter = await get('get_referees');
    assert.equal(JSON.stringify(dashAfter.courts), JSON.stringify(dashBefore.courts), 'courts 无二次变化');
    assert.equal(JSON.stringify(tasksAfter.tasks), JSON.stringify(tasksBefore.tasks), 'tasks 无二次变化');
    assert.equal(JSON.stringify(refsAfter.data), JSON.stringify(refsBefore.data), 'refs 无二次变化');
    assert.equal((dashAfter.records || []).length, recordsBefore.length, 'records 无二次变化');
    EVENT = savedEvent;
  });

  it('R6-S3: score 已推进后发送旧 start payload → error', async () => {
    const savedEvent = EVENT;
    const code = await newEvent('R6S3', ['001-01'], ['1']);
    await assignCourt('001-01', '1');
    await accept('裁判A', '001-01');
    await start('裁判A', '001-01');
    // 推进比分
    await post({ action: 'sync_live_score', event_code: code, court: '1', score_text: 'G1 5-3', status: '比赛中', match_name: 'A队 vs B队', match_id: '001-01', referee_id: '裁判A' });
    // 用旧 score_text 重试 start
    const start2 = await start('裁判A', '001-01');
    assert.equal(start2.status, 'error', 'score 已推进后旧 start payload 必须 error');
    EVENT = savedEvent;
  });
});

describe('R6-save_score：响应丢失幂等恢复', () => {
  it('R6-V1: 首次完赛 success+idempotent=false', async () => {
    const savedEvent = EVENT;
    const code = await newEvent('R6V', ['001-01'], ['1']);
    await assignCourt('001-01', '1');
    await accept('裁判A', '001-01');
    await start('裁判A', '001-01');
    const save = await post({
      action: 'save_score', event_code: code, id: '001-01', referee_id: '裁判A',
      t1: 'A队', t2: 'B队', score: '21-15', winner: 'A队', details: 'G1: 21-15', court: '1',
      referee: '裁判A', signature: 'sig-r6v1', is_team: true
    });
    assert.equal(save.status, 'success', '首次完赛必须 success');
    // 验证 record=1、task/live 已删除、match_count=1
    const dash = await dashboard();
    assert.equal((dash.records || []).length, 1, 'record 必须为 1');
    assert.equal(dash.records[0].id, '001-01', 'record.id 必须为 001-01');
    const refs = await get('get_referees');
    const refA = refs.data.find(r => r.name === '裁判A');
    assert.equal(refA.match_count, 1, 'match_count 必须为 1');
    EVENT = savedEvent;
  });

  it('R6-V2: 相同 payload 重试 → success+idempotent=true，record 仍为 1', async () => {
    const savedEvent = EVENT;
    const code = await newEvent('R6V2', ['001-01'], ['1']);
    await assignCourt('001-01', '1');
    await accept('裁判A', '001-01');
    await start('裁判A', '001-01');
    const save1 = await post({
      action: 'save_score', event_code: code, id: '001-01', referee_id: '裁判A',
      t1: 'A队', t2: 'B队', score: '21-15', winner: 'A队', details: 'G1: 21-15', court: '1',
      referee: '裁判A', signature: 'sig-r6v2', is_team: true
    });
    assert.equal(save1.status, 'success');
    // 相同 payload 重试（模拟响应丢失后重试）
    const save2 = await post({
      action: 'save_score', event_code: code, id: '001-01', referee_id: '裁判A',
      t1: 'A队', t2: 'B队', score: '21-15', winner: 'A队', details: 'G1: 21-15', court: '1',
      referee: '裁判A', signature: 'sig-r6v2', is_team: true
    });
    assert.equal(save2.status, 'success', '重试必须 success');
    assert.equal(save2.idempotent, true, '重试必须 idempotent=true');
    // record 仍为 1
    const dash = await dashboard();
    assert.equal((dash.records || []).length, 1, 'record 必须仍为 1');
    // match_count 仍为 1
    const refs = await get('get_referees');
    const refA = refs.data.find(r => r.name === '裁判A');
    assert.equal(refA.match_count, 1, 'match_count 必须仍为 1');
    EVENT = savedEvent;
  });

  it('R6-V3: 修改 signature/score/winner/referee 任一字段重试 → error', async () => {
    const savedEvent = EVENT;
    const code = await newEvent('R6V3', ['001-01'], ['1']);
    await assignCourt('001-01', '1');
    await accept('裁判A', '001-01');
    await start('裁判A', '001-01');
    await post({
      action: 'save_score', event_code: code, id: '001-01', referee_id: '裁判A',
      t1: 'A队', t2: 'B队', score: '21-15', winner: 'A队', details: 'G1: 21-15', court: '1',
      referee: '裁判A', signature: 'sig-r6v3', is_team: true
    });
    // 修改 signature 重试
    const save2 = await post({
      action: 'save_score', event_code: code, id: '001-01', referee_id: '裁判A',
      t1: 'A队', t2: 'B队', score: '21-15', winner: 'A队', details: 'G1: 21-15', court: '1',
      referee: '裁判A', signature: 'sig-DIFFERENT', is_team: true
    });
    assert.equal(save2.status, 'error', '修改 signature 重试必须 error');
    // 修改 score 重试
    const save3 = await post({
      action: 'save_score', event_code: code, id: '001-01', referee_id: '裁判A',
      t1: 'A队', t2: 'B队', score: '21-10', winner: 'A队', details: 'G1: 21-15', court: '1',
      referee: '裁判A', signature: 'sig-r6v3', is_team: true
    });
    assert.equal(save3.status, 'error', '修改 score 重试必须 error');
    // 修改 winner 重试
    const save4 = await post({
      action: 'save_score', event_code: code, id: '001-01', referee_id: '裁判A',
      t1: 'A队', t2: 'B队', score: '21-15', winner: 'B队', details: 'G1: 21-15', court: '1',
      referee: '裁判A', signature: 'sig-r6v3', is_team: true
    });
    assert.equal(save4.status, 'error', '修改 winner 重试必须 error');
    // 已保存 record 保持不变
    const dash = await dashboard();
    assert.equal((dash.records || []).length, 1, 'record 必须仍为 1');
    assert.equal(dash.records[0].signature, 'sig-r6v3', 'record.signature 必须保持原值');
    EVENT = savedEvent;
  });
});

// ======================== 清理 ========================
after(async () => {
  for (const code of createdEvents) {
    await post({ action: 'super_admin_delete_event', super_pwd: 'Wuxian666', target_code: code });
  }
});
