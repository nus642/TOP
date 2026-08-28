/**
 * live-record-visibility.test.js — P1/P2 热修自动化测试
 *
 * 运行：node --test Tools/legacy-live-record-visibility/live-record-visibility.test.js
 *
 * 覆盖：
 *   P1-1 场地传递（court-handoff-logic.js）      T01-T05
 *   P1-2 Master 实时投影（court-projection-logic.js） T06-T11
 *   P1-3 签名赛果单安全规则（record-detail-logic.js） T12-T14
 *   P2   房间卡 team_code 显示（team-room-display-logic.js） T15-T16
 *   源码锚定：Legacy 内联修复与镜像模块一致（T17-T19）
 *
 * 所有测试使用内存数据，不写入仓库，不触碰任何真实赛事数据。
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { resolveStartCourt } = require('./court-handoff-logic');
const { projectCourts } = require('./court-projection-logic');
const { isSafeSignatureUrl, buildRecordFields, SAFE_SIGNATURE_REGEX } = require('./record-detail-logic');
const { teamCodeDisplay } = require('./team-room-display-logic');

const LEGACY_DIR = path.join(__dirname, '..', '..', 'Legacy');
const readLegacy = (f) => fs.readFileSync(path.join(LEGACY_DIR, f), 'utf-8');

// ======================== P1-1 场地传递 ========================

describe('P1-1 场地传递（裁判开赛场地必须来自主控分配）', () => {
  it('T01: task 有 court → 自动带出该 court，忽略裁判手工输入', () => {
    const r = resolveStartCourt({ id: '001-01', court: '2' }, '5', 'team');
    assert.equal(r.blocked, false);
    assert.equal(r.court, '2', '必须使用 task.court 而非手工输入的 5');
  });

  it('T02: task 无 court 且输入为空 → 阻断并提示主控分配', () => {
    const r = resolveStartCourt({ id: '001-02', court: '' }, '', 'team');
    assert.equal(r.blocked, true);
    assert.match(r.reason, /请先由主控分配场地/);
  });

  it('T03: task 无 court 但裁判凭记忆填了场地 → 仍阻断（不得采信）', () => {
    const r = resolveStartCourt({ id: '001-03', court: '' }, '3', 'team');
    assert.equal(r.blocked, true);
    assert.match(r.reason, /请先由主控分配场地/);
  });

  it('T04: 无网络任务（手动开局）→ 沿用手工输入', () => {
    const r = resolveStartCourt(null, '4', 'ind');
    assert.equal(r.blocked, false);
    assert.equal(r.court, '4');
  });

  it('T05: local 模式 → 沿用手工输入，缺省回退 1', () => {
    const r = resolveStartCourt({ id: 'X', court: '9' }, '', 'local');
    assert.equal(r.blocked, false);
    assert.equal(r.court, '1');
  });
});

// ======================== P1-2 Master 实时投影 ========================

const baseInput = () => ({
  courts: ['1', '2'],
  referees: [],
  tasks: {}
});

describe('P1-2 Master 实时投影（以 task id/court 为唯一关联）', () => {
  it('T06: 有 court 的比赛中 task → 投影到对应场地卡（真实队伍/task id/实时比分）', () => {
    const input = baseInput();
    input.tasks = { '001-01': { id: '001-01', court: '1', status: '比赛中', t1: '先锋预备队', t2: '铁壁预备队', live_score: 'G1 11-8' } };
    const { courts } = projectCourts(input);
    assert.equal(courts['1'].status, '比赛中');
    assert.equal(courts['1'].match_id, '001-01');
    assert.equal(courts['1'].match_name, '先锋预备队 vs 铁壁预备队');
    assert.equal(courts['1'].score, 'G1 11-8');
  });

  it('T07: 无 court 的比赛中 task → 仅进游离卡，不占用场地卡', () => {
    const input = baseInput();
    input.tasks = { '001-02': { id: '001-02', court: '', status: '比赛中', t1: 'A', t2: 'B', live_score: 'G1 3-2' } };
    const { courts, strays } = projectCourts(input);
    assert.equal(strays.length, 1);
    assert.equal(strays[0].id, '001-02');
    assert.equal(courts['1'].status, '空闲');
    assert.equal(courts['2'].status, '空闲');
  });

  it('T08: 同一 task 不得同时出现在场地卡与游离卡', () => {
    const input = baseInput();
    input.tasks = {
      '001-01': { id: '001-01', court: '2', status: '比赛中', t1: 'A', t2: 'B' },
      '001-02': { id: '001-02', court: '', status: '比赛中', t1: 'C', t2: 'D' }
    };
    const { courts, strays } = projectCourts(input);
    const onCourts = Object.values(courts).map(c => c.match_id).filter(id => id);
    const onStrays = strays.map(t => t.id);
    assert.deepEqual(onCourts, ['001-01']);
    assert.deepEqual(onStrays, ['001-02']);
    assert.equal(onCourts.filter(id => onStrays.includes(id)).length, 0, '不允许交集');
  });

  it('T09: 完赛后（task 删除 + 裁判回空闲）→ 场地恢复空闲，不残留比分/裁判', () => {
    const during = projectCourts({
      courts: ['1'],
      referees: [{ name: '裁判甲', status: '执裁中', current_court: '1' }],
      tasks: { '001-01': { id: '001-01', court: '1', status: '比赛中', t1: 'A', t2: 'B', live_score: 'G1 21-19' } }
    });
    assert.equal(during.courts['1'].status, '比赛中');
    // save_score 删除 task；referee_update_status 将裁判置空闲
    const after = projectCourts({
      courts: ['1'],
      referees: [{ name: '裁判甲', status: '空闲', current_court: '' }],
      tasks: {}
    });
    assert.equal(after.courts['1'].status, '空闲');
    assert.equal(after.courts['1'].score, '');
    assert.equal(after.courts['1'].referee, '');
    assert.equal(after.courts['1'].match_id, '');
  });

  it('T10: 两个 task 抢同一场地 → 先到先得，不覆盖', () => {
    const input = baseInput();
    input.tasks = {
      '001-01': { id: '001-01', court: '1', status: '比赛中', t1: 'A', t2: 'B' },
      '001-02': { id: '001-02', court: '1', status: '比赛中', t1: 'C', t2: 'D' }
    };
    const { courts } = projectCourts(input);
    assert.equal(courts['1'].match_id, '001-01');
  });

  it('T11: task 投影与执裁裁判共存 → 场地卡同时有队伍/比分与裁判名', () => {
    const input = baseInput();
    input.referees = [{ name: '裁判乙', status: '执裁中', current_court: '2' }];
    input.tasks = { '001-01': { id: '001-01', court: '2', status: '比赛中', t1: 'A', t2: 'B', live_score: 'G1 5-5' } };
    const { courts } = projectCourts(input);
    assert.equal(courts['2'].referee, '裁判乙');
    assert.equal(courts['2'].match_id, '001-01');
    assert.equal(courts['2'].score, 'G1 5-5');
  });
});

// ======================== P1-3 签名赛果单 ========================

describe('P1-3 签名赛果单安全规则', () => {
  const GOOD_JPEG = 'data:image/jpeg;base64,' + Buffer.from('fake-jpeg-bytes').toString('base64');
  const GOOD_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';

  it('T12: 画布导出的 data:image URL 通过白名单', () => {
    assert.equal(isSafeSignatureUrl(GOOD_JPEG), true);
    assert.equal(isSafeSignatureUrl(GOOD_PNG), true);
    assert.equal(isSafeSignatureUrl('data:image/webp;base64,UklGRg=='), true);
  });

  it('T13: 伪协议 / HTML / 非图片 data URL 一律拒绝', () => {
    assert.equal(isSafeSignatureUrl('javascript:alert(1)'), false);
    assert.equal(isSafeSignatureUrl('data:text/html;base64,PHNjcmlwdD4='), false);
    assert.equal(isSafeSignatureUrl('<img src=x onerror=alert(1)>'), false);
    assert.equal(isSafeSignatureUrl('http://evil.example/sig.jpg'), false);
    assert.equal(isSafeSignatureUrl(''), false);
    assert.equal(isSafeSignatureUrl(null), false);
    assert.equal(isSafeSignatureUrl('data:image/svg+xml;base64,PHN2Zz4='), false, 'svg 可携带脚本，不放行');
  });

  it('T14: buildRecordFields 完整映射 records 字段，缺省占位不报错', () => {
    const r = { id: '001-01', court: '1', t1: '先锋预备队', t2: '铁壁预备队', score: '21-15', details: 'G1: 21 - 15', winner: '先锋预备队', referee: '[省级] 裁判甲', signature: GOOD_JPEG, time: '2026-08-26 10:00:00' };
    const f = buildRecordFields(r);
    assert.equal(f.id, '001-01');
    assert.equal(f.court, '#1 场');
    assert.equal(f.teams, '先锋预备队 vs 铁壁预备队');
    assert.equal(f.score, '21-15');
    assert.equal(f.details, 'G1: 21 - 15');
    assert.equal(f.winner, '先锋预备队');
    assert.equal(f.referee, '[省级] 裁判甲');
    assert.equal(f.time, '2026-08-26 10:00:00');
    assert.equal(f.hasSignature, true);
    // 无签名 → hasSignature=false（前端显示占位，不报错）
    assert.equal(buildRecordFields({ id: 'X', signature: '' }).hasSignature, false);
    assert.equal(buildRecordFields({}).id, '—');
  });
});

// ======================== P2 房间卡显示 ========================

describe('P2 团体房间卡显示 team_code', () => {
  it('T15: 显示 team.team_code，不从第一名球员 id_code 推导', () => {
    const team = { team_name: '先锋预备队', team_code: 'T01', players: [] };
    // 故意给出会误导旧实现的球员库（id_code 前缀不同）
    const players = [{ name: '甲一', team: '先锋预备队', id_code: 'T09-01' }];
    assert.equal(teamCodeDisplay(team, players), 'T01');
  });

  it('T16: team_code 缺失 → 显示空，不猜测', () => {
    assert.equal(teamCodeDisplay({ team_name: 'X' }, []), '');
    assert.equal(teamCodeDisplay(null, []), '');
  });
});

// ======================== 源码锚定（Legacy 内联修复在位） ========================

describe('源码锚定：Legacy 内联修复与镜像模块一致', () => {
  it('T17: referee.html 含场地阻断逻辑与提示语', () => {
    const src = readLegacy('referee.html');
    assert.ok(src.includes('[P1-1]'), '缺少 P1-1 标记');
    assert.ok(src.includes('请先由主控分配场地'), '缺少阻断提示语');
    assert.ok(src.includes('window.pendingTask.court'), '缺少 task.court 强制继承');
  });

  it('T18: data.php 含 task 投影；master.html 含场地卡 task id 与赛果单弹窗', () => {
    const php = readLegacy('data.php');
    assert.ok(php.includes("($t['status'] ?? '') === '比赛中'"), '缺少 task 投影条件');
    assert.ok(php.includes("$res['courts'][$tc]['match_id']"), '缺少场地卡 match_id 写入');
    const master = readLegacy('master.html');
    assert.ok(master.includes('recordDetailModal'), '缺少赛果单弹窗');
    assert.ok(master.includes('showRecordDetail'), '缺少赛果单入口函数');
    assert.ok(master.includes(String(SAFE_SIGNATURE_REGEX.source).replace(/\//g, '\\/')) || master.includes('SAFE_SIGNATURE_REGEX'), '缺少签名白名单');
    assert.ok(master.includes('info.match_id'), '场地卡未显示 task id');
  });

  it('T19: master.html 已改名裁判员档案，且移除 id_code 推导回退', () => {
    const master = readLegacy('master.html');
    assert.ok(master.includes('裁判员档案'), '按钮未改名为裁判员档案');
    assert.ok(!master.includes('裁判数据库'), '旧名称「裁判数据库」仍残留');
    assert.ok(!master.includes('获取完整队伍编号（宽松匹配）'), 'id_code 推导回退未移除');
  });
});
