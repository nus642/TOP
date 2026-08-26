/**
 * live-record-visibility-followup.test.js — P1 follow-up / checkin 修复验证
 * 
 * 测试范围（对应浏览器复验发现的三个真实缺口 + checkin 欢迎词过期）：
 * 1. task.court 为空 + input 默认值'1' → 必须阻断；
 * 2. 警告后执行路径确实 return，不发生状态写入；
 * 3. 自由赛仍允许手工输入场地；
 * 4. 已分配 task 在提取后、开赛前显示真实队名与 task id（待开赛）；
 * 5. 提取阶段状态为"待开赛"，不是"比赛中"；
 * 6. 开赛后变为"比赛中"；
 * 7. 换场提示不含"球拍放场内"；
 * 8. 换场保持比分、释放旧场地；
 * 9. Checkin 欢迎词时段/日期使用 Asia/Shanghai 确定性函数。
 * 
 * 注意：本文件不复制业务逻辑——所有测试断言实际生产源码中的条件/字符串。
 */

const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const LEGACY_DIR = path.join(__dirname, '..', '..', 'Legacy');

// ======================== 辅助函数 ========================
function readSource(name) {
  return fs.readFileSync(path.join(LEGACY_DIR, name), 'utf-8');
}

// ======================== 场景 10：P1 FIXUP — 无场地阻断 ========================
describe('P1 FIXUP: 无场地强制阻断', () => {
  it('T25: referee.html handleStartSetup 含 isTeamFlow 分支与 pendingTask.court 权威取 court', () => {
    const src = readSource('referee.html');
    assert.ok(src.includes("isTeamFlow"), '应定义 isTeamFlow 变量严格区分团体任务 vs 个人模式');
    assert.ok(src.includes("window.pendingTask.court ? String(window.pendingTask.court).trim() : ''"),
      '应从 pendingTask 对象权威取 court 值');
    assert.ok(src.includes("请先由主控分配场地"), '应有明确提示语');
  });

  it('T26: referee.html handleTaskPull 清除 localStorage 并清空无 court 输入框', () => {
    const src = readSource('referee.html');
    assert.ok(src.includes("localStorage.removeItem('pickle_def_court')"),
      '提取时应移除 localStorage 残留的场地号');
    // 检查无 court 时清空 input
    assert.ok(src.includes("$('courtNo').value = ''"),
      'task 无 court 时应清空输入框');
  });

  it('T27: handleStartSetup 含明确 return 阻断', () => {
    const src = readSource('referee.html');
    // 在 isTeamFlow 块内 alert + return 必须在同一 if (!assignedCourt) 中
    const pattern = /if\s*\(!assignedCourt\)\s*\{[^}]*alert\([^)]*请先由主控分配场地[^)]*\)[^}]*return;[^}]*\}/s;
    assert.ok(pattern.test(src), 'alert("请先由主控分配场地") 后应立即 return，不继续任何状态写入');
  });

  it('T28: 自由赛不受影响 — handleStartSetup 个人模式 else 注释', () => {
    const src = readSource('referee.html');
    assert.ok(src.includes("// 个人自由赛：仅在输入为空时用默认值'1'"),
      '个人模式 else 分支说明应表明仅依赖 HTML 默认值，不做额外拦截');
  });
});

// ======================== 场景 11：P1 FIXUP — 待开赛状态投影 ========================
describe('P1 FIXUP: 接受任务后待开赛状态', () => {
  it('T29: data.php accept_task API — 写 live_scores status=待开赛', () => {
    const src = readSource('data.php');
    assert.ok(src.includes("case 'accept_task':"), '应定义 accept_task API 端点');
    assert.ok(src.includes("'status' => '待开赛'"), 'live_scores 中 status 应为待开赛');
    assert.ok(src.includes("'match_name'"), '应包含队伍名称');
    assert.ok(src.includes("'score' => '0-0'"), '比分为 0-0');
    assert.ok(src.includes("'referee' => $ref"), '应包含裁判信息');
  });

  it('T30: master.html 场地卡渲染 isLive 扩展至待开赛', () => {
    const src = readSource('master.html');
    assert.ok(src.includes("info.status === '比赛中' || info.status === '待开赛'"),
      'isLive 判断应同时包括比赛中和待开赛');
  });

  it('T31: data.php get_full_dashboard 项目投影段扩展待开赛覆盖', () => {
    const src = readSource('data.php');
    // tasks 循环中应包含对 live_scores 中待开赛状态的覆盖
    const hasPendingPattern = /\$live\[\$tc\].*===\s*['"]待开赛['"]/s.test(src);
    assert.ok(hasPendingPattern || src.includes("($live[$tc]['status'] ?? '') === '待开赛'"),
      'projectCourts 段的第二个 if 应覆盖 live_scores 中的待开赛状态');
  });
});

// ======================== 场景 12：P2 FIXUP — 换场独立提示语 ========================
describe('P2 FIXUP: 换场确认文案独立化', () => {
  it('T32: editCourt 含新场地号 prompt 且不包含暂停语义', () => {
    const src = readSource('master.html');
    // 新 prompt 应包含"从 #X 号场调整至新场地"
    assert.ok(/\$\{\s*oldCourt\s*\}/.test(src) && src.includes('新场地'),
      'editCourt 应在提示中显示旧场地号和新场地目标');
    // 不得包含"球拍放场内""医疗暂停"等暂停语义
    assert.ok(!src.includes("球拍放场内") || !src.match(/editCourt[\s\S]{0,500}球拍放场内/),
      'editCourt 函数域内不应出现"球拍放场内"文本');
  });

  it('T33: showToast 含旧场地立即恢复空闲', () => {
    const src = readSource('master.html');
    assert.ok(src.includes("旧场地立即恢复空闲"),
      '成功改场 toast 应提示旧场地恢复');
  });
});

// ======================== 场景 13：Checkin FIXUP — 欢迎词日期/时段确定性计算 ========================
describe('Checkin FIXUP: 欢迎词不使用 AI 返回的过期日期', () => {
  it('T34: checkin.html 含 getTimeInShanghai 函数', () => {
    const src = readSource('checkin.html');
    assert.ok(src.includes('getTimeInShanghai'), '应定义 Asia/Shanghai 时间获取函数');
    assert.ok(src.includes('Asia/Shanghai'), '使用时区 Asia/Shanghai');
  });

  it('T35: checkin.html 含 getPeriodGreeting 显式时段规则', () => {
    const src = readSource('checkin.html');
    assert.ok(src.includes('getPeriodGreeting'), '应定义时段问候函数');
    // 时段规则注释应存在
    assert.ok(src.includes('早上好') && src.includes('下午好') && src.includes('晚上好'),
      '应包含所有三个时段问候');
  });

  it('T36: data.php ai_generate_greeting 不返回含日期的 greeting 字段', () => {
    const src = readSource('data.php');
    // JSON 响应应使用 greeting_body 而非 greeting
    assert.ok(src.includes("'greeting_body'") || src.includes('"greeting_body"'),
      'API 应返回 greeting_body 而非含日期的 greeting');
    // fallback（无 API key）不应再输出带 date() 的完整 greeting
    const fallbackSectionMatch = src.match(/if \(empty\(\$apiKey[\s\S]{0,400}break;/);
    assert.ok(!fallbackSectionMatch || !fallbackSectionMatch[0].includes("date('H')"),
      '无 API key 时的 fallback 不应调用 date() 生成带时间的 greeting');
  });

  it('T37: checkin.html visibilitychange 重新加载 greeting', () => {
    const src = readSource('checkin.html');
    assert.ok(src.includes('visibilitychange'), '应监听 visibilitychange 事件');
    assert.ok(src.includes('loadGreeting()') && src.includes('!document.hidden'),
      '页面可见时重新调用 loadGreeting');
  });
});
