/**
 * runtime-behavior.test.js — 运行时行为验证（真实执行生产源码片段）
 *
 * 与源码锚定测试不同：本文件把生产源码中的关键函数/代码块提取出来，
 * 在 node:vm 沙箱中以桩环境【实际执行】，验证运行时行为：
 *
 * A. 交换场区（referee.html award 内 halfSwitch 块）：
 *    - 60 秒倒计时（Legacy 默认行为）、文案不含“官方暂停 60 秒”
 *    - 不扣球队暂停、不改变比分/发球队员/发球顺序
 *    - 不改变 task/court/referee
 *    - 不出现“携带球拍”“球拍留在场内”
 *    - halfSwitched 置位、viewBa 翻转、只触发一次
 *    - 常规球队暂停“球拍请放在场内”提示保留（源码锚定）
 *
 * B. Checkin 欢迎词（checkin.html 确定性渲染链路）：
 *    - 初次加载 AI 请求最多一次；visibilitychange 不再请求
 *    - 日期/时段按 Asia/Shanghai 本地重算
 *    - 04:59/05:00、11:59/12:00、17:59/18:00 边界
 *    - 跨日更新日期
 *    - "比赛日、今日、年轻、岁月"不误杀；具体日期/早午晚问候被过滤
 *    - AI 失败仍显示正确本地日期及时段
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('node:vm');

const LEGACY_DIR = path.join(__dirname, '..', '..', 'Legacy');

function readSource(name) {
  return fs.readFileSync(path.join(LEGACY_DIR, name), 'utf-8');
}

// 提取 [start, end) 之间的源码（start 包含，end 不包含）
function extractBetween(src, start, end, label) {
  const i = src.indexOf(start);
  assert.ok(i >= 0, `${label}: 未找到起始标记 "${start}"`);
  const j = src.indexOf(end, i);
  assert.ok(j > i, `${label}: 未找到结束标记 "${end}"`);
  return src.slice(i, j);
}

// ======================== A. 交换场区运行时验证 ========================
describe('交换场区：运行时行为（真实执行 award 内 halfSwitch 块）', () => {
  const src = readSource('referee.html');
  const blockStart = 'let maxScore = Math.max(matchState.t1Score, matchState.t2Score);';
  const blockEnd = 'let diff = Math.abs';
  assert.equal(src.split(blockStart).length - 1, 1, 'halfSwitch 块起始标记必须唯一');
  const block = extractBetween(src, blockStart, blockEnd, 'halfSwitch 块');

  function makeSandbox(overrides = {}) {
    const calls = { alerts: [], timers: [], renders: 0, backups: 0 };
    const matchState = { t1Score: 6, t2Score: 3, halfSwitched: false, over: false, ...overrides.matchState };
    const gameState = {
      viewBa: false, servTeam: 1, servNum: 2, servingPlayer: '张三',
      t1: { r: '张三', l: '李四' }, t2: { r: '王五', l: '赵六' },
      ...overrides.gameState
    };
    const timeoutUsed = { t1: false, t2: false, medicalT1: false, medicalT2: false };
    const currentMatch = { id: 'HT-001', court: '2', ref: '测试裁判', target: 11, cap: 15, meth: 'sideout', type: 'doubles' };
    const sandbox = {
      matchState, gameState, timeoutUsed, currentMatch,
      alert: (m) => calls.alerts.push(m),
      renderGame: () => { calls.renders++; },
      backupState: () => { calls.backups++; },
      startTimer: (sec, msg) => calls.timers.push({ sec, msg }),
      setTimeout: (fn) => { fn(); return 0; }, // 立即执行，模拟 300ms 后触发
      Math, console, JSON,
    };
    vm.createContext(sandbox);
    return { sandbox, calls, matchState, gameState, timeoutUsed, currentMatch };
  }

  it('R1: 达到换场分 → 60 秒倒计时且文案不含“官方暂停 60 秒”', () => {
    const { sandbox, calls } = makeSandbox();
    vm.runInContext(block, sandbox);
    assert.equal(calls.timers.length, 1, '应恰好启动一个倒计时');
    assert.equal(calls.timers[0].sec, 60, '倒计时必须为 60 秒');
    assert.ok(calls.timers[0].msg.includes('交换场区'), '倒计时文案应含“交换场区”');
    assert.ok(!calls.timers[0].msg.includes('官方暂停 60 秒'), '倒计时文案不得宣称“官方暂停 60 秒”');
    assert.ok(!calls.timers[0].msg.includes('携带球拍'), '倒计时文案不得要求“携带球拍”');
    assert.ok(calls.timers[0].msg.includes('如使用球队暂停，球拍请放在场内'), '倒计时文案应含球队暂停提示');
  });

  it('R2: alert 提示文案正确且不含“官方固定 60 秒”', () => {
    const { sandbox, calls } = makeSandbox();
    vm.runInContext(block, sandbox);
    assert.equal(calls.alerts.length, 1);
    assert.ok(calls.alerts[0].includes('交换场地'), 'alert 应提示交换场地');
    assert.ok(!calls.alerts[0].includes('携带球拍'), 'alert 不得要求“携带球拍”');
    assert.ok(!calls.alerts[0].includes('60 秒'), 'alert 不得宣称固定 60 秒休整');
    assert.ok(calls.alerts[0].includes('如使用球队暂停，球拍请放在场内'), 'alert 应含球队暂停提示');
  });

  it('R3: 不扣球队暂停、不改变比分/发球队员/发球顺序', () => {
    const { sandbox, matchState, gameState, timeoutUsed } = makeSandbox();
    vm.runInContext(block, sandbox);
    assert.equal(matchState.t1Score, 6, '比分不得改变（t1）');
    assert.equal(matchState.t2Score, 3, '比分不得改变（t2）');
    assert.equal(gameState.servTeam, 1, '发球队不得改变');
    assert.equal(gameState.servNum, 2, '发球序号不得改变');
    assert.equal(gameState.servingPlayer, '张三', '发球队员不得改变');
    assert.deepEqual(gameState.t1, { r: '张三', l: '李四' }, 't1 站位不得改变');
    assert.deepEqual(gameState.t2, { r: '王五', l: '赵六' }, 't2 站位不得改变');
    assert.equal(timeoutUsed.t1, false, '不得消耗左队暂停');
    assert.equal(timeoutUsed.t2, false, '不得消耗右队暂停');
  });

  it('R4: 不改变 task/court/referee；视图翻转且 halfSwitched 置位', () => {
    const { sandbox, matchState, gameState, currentMatch } = makeSandbox();
    vm.runInContext(block, sandbox);
    assert.equal(currentMatch.id, 'HT-001');
    assert.equal(currentMatch.court, '2');
    assert.equal(currentMatch.ref, '测试裁判');
    assert.equal(gameState.viewBa, true, 'viewBa 应翻转');
    assert.equal(matchState.halfSwitched, true, 'halfSwitched 应置位');
    assert.equal(matchState.over, false, '比赛不得被结束（暂停结束继续原比赛）');
  });

  it('R5: halfSwitched 已置位时不再重复触发（幂等）', () => {
    const { sandbox, calls } = makeSandbox({ matchState: { halfSwitched: true } });
    vm.runInContext(block, sandbox);
    assert.equal(calls.timers.length, 0, '不得重复启动倒计时');
    assert.equal(calls.alerts.length, 0, '不得重复弹窗');
  });

  it('R6: 未到换场分不触发', () => {
    const { sandbox, calls } = makeSandbox({ matchState: { t1Score: 5, t2Score: 3 } });
    vm.runInContext(block, sandbox);
    assert.equal(calls.timers.length, 0);
    assert.equal(calls.alerts.length, 0);
  });

  it('R7: 暂停结束路径（stopTimerManually）不触碰比赛状态（源码锚定）', () => {
    const stopFn = extractBetween(src, 'window.stopTimerManually = function', 'window.triggerManualCancel', 'stopTimerManually');
    assert.ok(!stopFn.includes('matchState'), 'stopTimerManually 不得修改 matchState');
    assert.ok(!stopFn.includes('gameState'), 'stopTimerManually 不得修改 gameState');
    assert.ok(stopFn.includes('clearInterval'), '应清除定时器');
    assert.ok(stopFn.includes("disabled = false"), '应恢复得分按钮');
  });

  it('R8: 常规球队暂停"球拍请放在场内"提示保留（不得误改）', () => {
    assert.ok(src.includes("startTimer(60, '⏸️ 左队暂停：球拍请放在场内')"), '左队暂停文案必须保留');
    assert.ok(src.includes("startTimer(60, '⏸️ 右队暂停：球拍请放在场内')"), '右队暂停文案必须保留');
    // 交换场区倒计时文案只应出现一次
    assert.equal(src.split('交换场区：请双方选手交换场区').length - 1, 1, '交换场区倒计时文案应唯一');
  });
});

// ======================== B. Checkin 欢迎词运行时验证 ========================
describe('Checkin 欢迎词：运行时行为（真实执行确定性渲染链路）', () => {
  const src = readSource('checkin.html');
  const codeStart = 'function getTimeInShanghai() {';
  const codeEnd = '// [Checkin FIXUP] visibilitychange';
  const code = extractBetween(src, codeStart, codeEnd, 'checkin greeting 链路');
  assert.ok(src.includes("loadGreeting(false)"), 'visibilitychange 必须调用 loadGreeting(false)（不强制重取）');

  // 可注入时钟的 FakeDate：new Date() 返回 holder.ms；new Date(str) 走真实解析
  function makeFakeDate(holder) {
    return class FakeDate extends Date {
      constructor(...args) {
        if (args.length === 0) super(holder.ms);
        else super(...args);
      }
    };
  }

  // 运行一次完整场景：返回元素、fetch 计数、时间控制句柄
  async function runScenario({ greetingBody = null, failFetch = false, initialUtcMs } = {}) {
    const clock = { ms: initialUtcMs };
    const fetchCalls = [];
    const el = { innerHTML: '' };
    const sandbox = {
      Date: makeFakeDate(clock),
      console: { warn: () => {} },
      Promise, JSON,
      eventCode: 'RUNTIME-TEST',
      API: '/data.php',
      document: { getElementById: () => el },
      fetch: async (url) => {
        fetchCalls.push(url);
        if (failFetch) throw new Error('network down');
        return { json: async () => ({ status: 'success', greeting_body: greetingBody }) };
      },
    };
    vm.createContext(sandbox);
    vm.runInContext(code + '\n;globalThis.__getState = () => ({ cachedGreetingBody, hasFetchedOnce });', sandbox);
    const loadGreeting = (force) => vm.runInContext(`loadGreeting(${force})`, sandbox);
    return { el, fetchCalls, clock, loadGreeting, getState: () => sandbox.__getState() };
  }

  // UTC 时刻 → 上海墙钟对照（Asia/Shanghai = UTC+8）
  const BOUNDARIES = [
    // [UTC ISO, 期望时段, 期望日期文案]
    ['2026-08-25T20:59:00Z', '晚上好', '8月26日'], // 上海 04:59（时段属前夜的晚上，日期已是 26 日）
    ['2026-08-25T21:00:00Z', '早上好', '8月26日'], // 上海 05:00
    ['2026-08-26T03:59:00Z', '早上好', '8月26日'], // 上海 11:59
    ['2026-08-26T04:00:00Z', '下午好', '8月26日'], // 上海 12:00
    ['2026-08-26T09:59:00Z', '下午好', '8月26日'], // 上海 17:59
    ['2026-08-26T10:00:00Z', '晚上好', '8月26日'], // 上海 18:00
  ];

  it('R9: 初次加载 AI 请求最多一次；可见性恢复（visibilitychange 等价路径）不再请求', async () => {
    const { el, fetchCalls, loadGreeting } = await runScenario({ greetingBody: '欢迎参加比赛日，今日赛场见！', initialUtcMs: Date.UTC(2026, 7, 26, 4, 0, 0) });
    await loadGreeting(false);
    assert.equal(fetchCalls.length, 1, '初次加载应恰好请求一次 AI');
    // 模拟 visibilitychange → loadGreeting(false)
    await loadGreeting(false);
    await loadGreeting(false);
    assert.equal(fetchCalls.length, 1, '后续可见性恢复不得再次请求 AI');
    assert.equal(el.innerHTML, '欢迎参加比赛日，今日赛场见！', '应渲染缓存的 AI 正文');
  });

  for (const [iso, period, dateStr] of BOUNDARIES) {
    it(`R10: 边界 ${iso} → ${period} ${dateStr}（AI 失败降级路径）`, async () => {
      const { el, fetchCalls, loadGreeting } = await runScenario({ failFetch: true, initialUtcMs: new Date(iso).getTime() });
      await loadGreeting(false);
      assert.equal(fetchCalls.length, 1, '尝试过一次 AI 请求');
      assert.ok(el.innerHTML.includes(period), `降级文案应含时段"${period}"，实际：${el.innerHTML}`);
      assert.ok(el.innerHTML.includes(dateStr), `降级文案应含日期"${dateStr}"，实际：${el.innerHTML}`);
    });
  }

  it('R11: 跨日更新日期（同一会话内可见性恢复后日期前进一天）', async () => {
    const { el, fetchCalls, clock, loadGreeting } = await runScenario({ failFetch: true, initialUtcMs: Date.UTC(2026, 7, 26, 15, 30, 0) });
    await loadGreeting(false);
    assert.ok(el.innerHTML.includes('8月26日'), `首次应为 8月26日，实际：${el.innerHTML}`);
    // 时间前进至上海次日 00:30（UTC 2026-08-26T16:30）
    clock.ms = Date.UTC(2026, 7, 26, 16, 30, 0);
    await loadGreeting(false); // 等价 visibilitychange
    assert.ok(el.innerHTML.includes('8月27日'), `跨日后应更新为 8月27日，实际：${el.innerHTML}`);
    assert.equal(fetchCalls.length, 1, '跨日重算不得再次请求 AI');
  });

  it('R12: "比赛日、今日、年轻、岁月"等正常表达不被误杀', async () => {
    const body = '比赛日开启，今日登场即是主角；愿年轻与岁月都被这赛场记住。';
    const { el, loadGreeting, getState } = await runScenario({ greetingBody: body, initialUtcMs: Date.UTC(2026, 7, 26, 4, 0, 0) });
    await loadGreeting(false);
    assert.equal(getState().cachedGreetingBody, body, '正常表达应被缓存');
    assert.equal(el.innerHTML, body, '应原样渲染');
  });

  it('R13: AI 正文含具体日期被过滤并降级', async () => {
    const { el, loadGreeting, getState } = await runScenario({ greetingBody: '今天是8月25日，大家加油！', initialUtcMs: Date.UTC(2026, 7, 26, 4, 0, 0) });
    await loadGreeting(false);
    assert.equal(getState().cachedGreetingBody, null, '含具体日期的正文应被拒绝');
    assert.ok(!el.innerHTML.includes('8月25日'), '不得渲染被拒正文');
    assert.ok(el.innerHTML.includes('8月26日'), '降级文案应使用正确的本地日期');
    assert.ok(el.innerHTML.includes('下午好'), '降级文案应使用正确时段（上海 12:00）');
  });

  it('R14: AI 正文含时段问候词被过滤并降级', async () => {
    const { el, loadGreeting, getState } = await runScenario({ greetingBody: '早上好，选手们！', initialUtcMs: Date.UTC(2026, 7, 26, 10, 0, 0) });
    await loadGreeting(false);
    assert.equal(getState().cachedGreetingBody, null, '含时段问候词的正文应被拒绝');
    // 上海 18:00 → 晚上好
    assert.ok(el.innerHTML.includes('晚上好'), `降级应为晚上好，实际：${el.innerHTML}`);
  });

  it('R15: AI 请求失败仍显示正确本地日期及时段', async () => {
    const { el, loadGreeting } = await runScenario({ failFetch: true, initialUtcMs: Date.UTC(2026, 7, 26, 3, 59, 0) });
    await loadGreeting(false);
    assert.ok(el.innerHTML.includes('早上好'), '上海 11:59 应显示早上好');
    assert.ok(el.innerHTML.includes('8月26日'), '日期应为上海本地日期');
  });

  it('R16: getPeriodGreeting 全边界值直接验证', async () => {
    const { } = await runScenario({ failFetch: true, initialUtcMs: Date.UTC(2026, 7, 26, 4, 0, 0) });
    // 直接对提取出的真实函数做纯函数验证
    const sandbox = { console };
    vm.createContext(sandbox);
    vm.runInContext(extractBetween(src, 'function getPeriodGreeting(', '// [Checkin FIXUP] fetchGreetingBodyOnlyFirst', 'getPeriodGreeting') + '\n;globalThis.g = getPeriodGreeting;', sandbox);
    const g = sandbox.g;
    assert.equal(g(4), '晚上好');
    assert.equal(g(5), '早上好');
    assert.equal(g(11), '早上好');
    assert.equal(g(12), '下午好');
    assert.equal(g(17), '下午好');
    assert.equal(g(18), '晚上好');
    assert.equal(g(23), '晚上好');
    assert.equal(g(0), '晚上好');
  });
});

// ======================== C. 进行中比赛返回流程运行时验证 ========================
describe('进行中比赛返回流程：运行时行为（真实执行 resumeActiveMatch + confirmAndStart + backupState）', () => {
  const refSrc = readSource('referee.html');

  // 提取 normalizeMatchId
  const normalizeMatchIdSrc = extractBetween(refSrc, 'const normalizeMatchId = id =>', ';', 'normalizeMatchId');

  // 提取 resumeActiveMatch 函数
  const resumeStart = 'async function resumeActiveMatch() {';
  const resumeEnd = '\n        }\n\n        function renderGame()';
  const resumeSrc = extractBetween(refSrc, resumeStart, resumeEnd, 'resumeActiveMatch');

  // 提取 confirmAndStart 函数
  const confirmStart = 'window.confirmAndStart = async () => {';
  const confirmEnd = '\n        };\n\n        function showDndReminder';
  const confirmSrc = extractBetween(refSrc, confirmStart, confirmEnd, 'confirmAndStart');

  // 提取 backupState 函数
  const backupStart = 'function backupState() {';
  const backupEnd = '\n        }\n        function clearBackup';
  const backupSrc = extractBetween(refSrc, backupStart, backupEnd, 'backupState');

  function makeSandbox(overrides = {}) {
    const calls = { apiCalls: [], renders: 0, shows: [], toasts: [], backups: [] };
    const matchState = { t1Score: 10, t2Score: 8, t1Wins: 1, t2Wins: 0, currentGame: 1, history: [], timeline: [], halfSwitched: false, over: false, ...overrides.matchState };
    const gameState = { viewBa: false, servTeam: 1, initServTeam: 1, servNum: 2, court: 'Right', t1: { r: 'A', l: 'B' }, t2: { r: 'C', l: 'D' }, initRightP1: '', initRightP2: '', servingPlayer: '', ...overrides.gameState };
    const timeoutUsed = { t1: false, t2: false, medicalT1: false, medicalT2: false, ...overrides.timeoutUsed };
    const currentMatch = { id: '001-01', court: '1', t1Name: '队A', t2Name: '队B', ref: '[L1] 裁判A', ...overrides.currentMatch };
    let matchPhase = overrides.matchPhase ?? 'not_started';
    let sysMode = overrides.sysMode ?? 'network';
    let currentStep = overrides.currentStep ?? 1;
    const localStorage = overrides.localStorage ?? {};

    const sandbox = {
      matchState, gameState, timeoutUsed, currentMatch,
      get matchPhase() { return matchPhase; },
      set matchPhase(v) { matchPhase = v; },
      get sysMode() { return sysMode; },
      set sysMode(v) { sysMode = v; },
      apiCall: async (action, params) => {
        calls.apiCalls.push({ action, params });
        if (overrides.apiResponses && overrides.apiResponses[action]) return overrides.apiResponses[action];
        return { status: 'success' };
      },
      renderGame: () => { calls.renders++; },
      showStep: (step) => { currentStep = step; calls.shows.push(step); },
      showToast: (msg, isError) => { calls.toasts.push({ msg, isError }); },
      backupState: null, // will be injected
      clearBackup: () => {},
      syncLiveScore: () => {},
      updateRefereeStatus: async () => {},
      console,
      Promise,
      Object,
      String,
      JSON,
      Array,
    };
    // Inject real backupState
    sandbox.backupState = function() {
      calls.backups.push({ step: currentStep, matchPhase });
      localStorage['pickle_referee_backup_v5'] = JSON.stringify({ step: currentStep, matchPhase, currentMatch, matchState, gameState, timeoutUsed });
    };
    vm.createContext(sandbox);
    return { sandbox, calls, matchState, gameState, timeoutUsed, currentMatch, get matchPhase() { return matchPhase; }, get currentStep() { return currentStep; }, localStorage };
  }

  it('C1: 进行中比赛返回设置后不会再次 start_task', async () => {
    const { sandbox, calls, matchState: beforeMatchState, gameState: beforeGameState, timeoutUsed: beforeTimeoutUsed, currentMatch: beforeCurrentMatch } = makeSandbox({
      matchPhase: 'in_progress',
      currentStep: 3,
      apiResponses: {
        get_full_dashboard: {
          status: 'success',
          tasks: { '001-01': { id: '001-01', status: '比赛中', court: '1' } },
          courts: { '1': { status: '比赛中', match_id: '001-01' } }
        }
      }
    });

    // 执行 normalizeMatchId + resumeActiveMatch + confirmAndStart
    vm.runInContext(normalizeMatchIdSrc + '\n;' + resumeSrc + '\n;' + confirmSrc, sandbox);

    // 模拟用户点击“返回进行中比赛”
    await sandbox.confirmAndStart();

    // 断言：没有调用 start_task
    assert.equal(calls.apiCalls.filter(x => x.action === 'start_task').length, 0, '不得调用 start_task');
    // 断言：调用了 get_full_dashboard
    assert.ok(calls.apiCalls.some(x => x.action === 'get_full_dashboard'), '必须调用 get_full_dashboard');
    // 断言：回到了 step 3
    assert.ok(calls.shows.includes(3), '必须回到 step 3');
  });

  it('C2: 本地模式可从设置页返回进行中比赛', async () => {
    const { sandbox, calls } = makeSandbox({
      matchPhase: 'in_progress',
      sysMode: 'local',
      currentStep: 2
    });

    vm.runInContext(normalizeMatchIdSrc + '\n;' + resumeSrc + '\n;globalThis.resumeActiveMatch = resumeActiveMatch;', sandbox);
    await sandbox.resumeActiveMatch();

    // 断言：没有 API 调用
    assert.equal(calls.apiCalls.length, 0, '本地模式不得调用 API');
    // 断言：回到了 step 3
    assert.ok(calls.shows.includes(3), '必须回到 step 3');
  });

  it('C3: 设置页备份仍保存进行中生命周期和 step 3', () => {
    const ls = {};
    const { sandbox } = makeSandbox({
      matchPhase: 'in_progress',
      currentStep: 2,
      localStorage: ls
    });

    vm.runInContext(backupSrc + '\n;globalThis.backupState = backupState;', sandbox);
    sandbox.backupState();

    // 断言：备份中 matchPhase 为 in_progress
    const backup = JSON.parse(ls['pickle_referee_backup_v5']);
    assert.equal(backup.matchPhase, 'in_progress', '备份必须保存 matchPhase=in_progress');
    assert.equal(backup.step, 3, '进行中比赛备份 step 必须为 3');
  });

  it('C4: 服务端不可达时 fail closed，留在设置页', async () => {
    const { sandbox, calls } = makeSandbox({
      matchPhase: 'in_progress',
      sysMode: 'network',
      currentStep: 2,
      apiResponses: {
        get_full_dashboard: { status: 'error', message: '网络错误' }
      }
    });

    vm.runInContext(normalizeMatchIdSrc + '\n;' + resumeSrc + '\n;globalThis.resumeActiveMatch = resumeActiveMatch;', sandbox);
    await sandbox.resumeActiveMatch();

    // 断言：没有回到 step 3
    assert.ok(!calls.shows.includes(3), 'fail closed 不得回到 step 3');
    // 断言：显示了错误提示
    assert.ok(calls.toasts.some(t => t.isError), '必须显示错误提示');
  });

  it('C5: 服务端状态不一致时 fail closed', async () => {
    const { sandbox, calls } = makeSandbox({
      matchPhase: 'in_progress',
      sysMode: 'network',
      currentStep: 2,
      apiResponses: {
        get_full_dashboard: {
          status: 'success',
          tasks: { '001-01': { id: '001-01', status: '未开始', court: '1' } },
          courts: { '1': { status: '空闲', match_id: '' } }
        }
      }
    });

    vm.runInContext(normalizeMatchIdSrc + '\n;' + resumeSrc + '\n;globalThis.resumeActiveMatch = resumeActiveMatch;', sandbox);
    await sandbox.resumeActiveMatch();

    assert.ok(!calls.shows.includes(3), '状态不一致不得回到 step 3');
    assert.ok(calls.toasts.some(t => t.msg.includes('已非比赛中')), '必须提示状态不一致');
  });
});

// ======================== D. editCourt 前端运行时验证 ========================
describe('editCourt：前端运行时行为（真实执行 master.html editCourt 函数）', () => {
  const masterSrc = readSource('master.html');

  // 提取 normalizeId
  const normalizeIdSrc = extractBetween(masterSrc, 'const normalizeId = id =>', ';', 'normalizeId');

  // 提取 editCourt 函数
  const editCourtStart = 'window.editCourt = async (taskId) => {';
  const editCourtEnd = '\n        };\n\n        window.handleSendBroadcast';
  const editCourtSrc = extractBetween(masterSrc, editCourtStart, editCourtEnd, 'editCourt');

  function makeMasterSandbox(overrides = {}) {
    const calls = { prompts: [], apiPosts: [], loadDashboards: 0, toasts: [] };
    const sandbox = {
      globalDashboardData: overrides.dashboardData ?? { tasks: { '001-01': { id: '001-01', court: '1' } } },
      prompt: (msg, def) => { calls.prompts.push({ msg, def }); return overrides.promptResult ?? null; },
      apiPost: async (action, params) => { calls.apiPosts.push({ action, params }); return overrides.apiPostResult ?? { status: 'success' }; },
      loadDashboard: () => { calls.loadDashboards++; },
      showToast: (msg, isError) => { calls.toasts.push({ msg, isError }); },
      normalizeId: null,
      console,
      String,
      Promise,
      Object,
    };
    vm.createContext(sandbox);
    return { sandbox, calls };
  }

  it('D1: editCourt 取消时零请求', async () => {
    const { sandbox, calls } = makeMasterSandbox({ promptResult: null });
    vm.runInContext(normalizeIdSrc + '\n;' + editCourtSrc + '\n;globalThis.editCourt = editCourt;', sandbox);
    await sandbox.editCourt('001-01');
    assert.equal(calls.prompts.length, 1, '必须调用 prompt');
    assert.equal(calls.apiPosts.length, 0, '取消时不得发送 API 请求');
    assert.equal(calls.loadDashboards, 0, '取消时不得刷新 Dashboard');
  });

  it('D2: editCourt 输入新场地后发送 update_task_court', async () => {
    const { sandbox, calls } = makeMasterSandbox({ promptResult: '3', apiPostResult: { status: 'success' } });
    vm.runInContext(normalizeIdSrc + '\n;' + editCourtSrc + '\n;globalThis.editCourt = editCourt;', sandbox);
    await sandbox.editCourt('001-01');
    assert.equal(calls.apiPosts.length, 1, '必须发送一次 API 请求');
    assert.equal(calls.apiPosts[0].action, 'update_task_court', '必须调用 update_task_court');
    assert.equal(calls.apiPosts[0].params.match_id, '001-01', 'match_id 必须正确');
    assert.equal(calls.apiPosts[0].params.court, '3', 'court 必须为新场地');
  });

  it('D3: editCourt 成功后刷新 Dashboard', async () => {
    const { sandbox, calls } = makeMasterSandbox({ promptResult: '2', apiPostResult: { status: 'success' } });
    vm.runInContext(normalizeIdSrc + '\n;' + editCourtSrc + '\n;globalThis.editCourt = editCourt;', sandbox);
    await sandbox.editCourt('001-01');
    assert.equal(calls.loadDashboards, 1, '成功后必须刷新 Dashboard');
  });

  it('D4: editCourt 空场地号显示错误', async () => {
    const { sandbox, calls } = makeMasterSandbox({ promptResult: '' });
    vm.runInContext(normalizeIdSrc + '\n;' + editCourtSrc + '\n;globalThis.editCourt = editCourt;', sandbox);
    await sandbox.editCourt('001-01');
    assert.equal(calls.apiPosts.length, 0, '空场地不得发送请求');
    assert.ok(calls.toasts.some(t => t.isError && t.msg.includes('不能为空')), '必须显示错误提示');
  });

  it('D5: editCourt 失败时不刷新 Dashboard', async () => {
    const { sandbox, calls } = makeMasterSandbox({ promptResult: '5', apiPostResult: { status: 'error', message: '场地被占用' } });
    vm.runInContext(normalizeIdSrc + '\n;' + editCourtSrc + '\n;globalThis.editCourt = editCourt;', sandbox);
    await sandbox.editCourt('001-01');
    assert.equal(calls.loadDashboards, 0, '失败时不得刷新 Dashboard');
    assert.ok(calls.toasts.some(t => t.isError), '必须显示错误提示');
  });
});
