/**
 * corrective-fix-status-transition.test.js — 待开赛状态提前升级缺陷回归测试
 *
 * 验证 handleStartSetup 不再过早调用 updateRefereeStatus('执裁中')，
 * 以及 confirmAndStart/executeStartMatch 在正式开赛后正确设置裁判状态。
 *
 * 测试方法：提取生产源码中的关键函数，在 node:vm 沙箱中以桩环境实际执行，
 * 验证状态转换的正确性。
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

// ======================== 设置阶段状态转换 ========================
describe('设置阶段：handleStartSetup 不提前升级裁判状态', () => {
  const src = readSource('referee.html');

  it('handleStartSetup 函数体不包含 updateRefereeStatus("执裁中")', () => {
    // 提取 handleStartSetup 函数
    const funcStart = 'window.handleStartSetup = async (event) => {';
    const funcEnd = '\n        };';
    const i = src.indexOf(funcStart);
    assert.ok(i >= 0, 'handleStartSetup 函数必须存在');
    const j = src.indexOf(funcEnd, i);
    assert.ok(j > i, 'handleStartSetup 函数结束标记必须存在');
    const funcBody = src.slice(i, j + funcEnd.length);

    // 验证不包含 updateRefereeStatus('执裁中')
    assert.ok(
      !funcBody.includes("updateRefereeStatus('执裁中'"),
      'handleStartSetup 不得调用 updateRefereeStatus("执裁中") — 进入设置页不等于正式开赛'
    );
    assert.ok(
      !funcBody.includes('updateRefereeStatus("执裁中"'),
      'handleStartSetup 不得调用 updateRefereeStatus("执裁中") — 进入设置页不等于正式开赛'
    );
  });

  it('handleStartSetup 以 showStep(2) 结束，不修改裁判状态', () => {
    const funcStart = 'window.handleStartSetup = async (event) => {';
    const funcEnd = '\n        };';
    const i = src.indexOf(funcStart);
    const j = src.indexOf(funcEnd, i);
    const funcBody = src.slice(i, j + funcEnd.length);

    // 验证以 showStep(2) 结束
    assert.ok(
      funcBody.includes('showStep(2)'),
      'handleStartSetup 必须调用 showStep(2) 进入比赛设置页'
    );

    // 验证不包含任何 updateRefereeStatus 调用
    assert.ok(
      !funcBody.includes('updateRefereeStatus'),
      'handleStartSetup 不得调用 updateRefereeStatus — 裁判状态应在正式开赛后更新'
    );
  });

  it('executeStartMatch 包含 updateRefereeStatus("执裁中") — 正式开赛后更新', () => {
    const funcStart = 'async function executeStartMatch() {';
    const funcEnd = '\n        }';
    const i = src.indexOf(funcStart);
    assert.ok(i >= 0, 'executeStartMatch 函数必须存在');
    const j = src.indexOf(funcEnd, i);
    assert.ok(j > i, 'executeStartMatch 函数结束标记必须存在');
    const funcBody = src.slice(i, j + funcEnd.length);

    // 验证包含 updateRefereeStatus('执裁中')
    assert.ok(
      funcBody.includes("updateRefereeStatus('执裁中'") || funcBody.includes('updateRefereeStatus("执裁中"'),
      'executeStartMatch 必须调用 updateRefereeStatus("执裁中") — 正式开赛后更新裁判状态'
    );
  });

  it('executeStartMatch 中 updateRefereeStatus 在 syncLiveScore 之前调用', () => {
    const funcStart = 'async function executeStartMatch() {';
    const funcEnd = '\n        }';
    const i = src.indexOf(funcStart);
    const j = src.indexOf(funcEnd, i);
    const funcBody = src.slice(i, j + funcEnd.length);

    const statusIdx = funcBody.indexOf("updateRefereeStatus('执裁中'");
    const syncIdx = funcBody.indexOf('syncLiveScore()');

    assert.ok(statusIdx >= 0, 'executeStartMatch 必须包含 updateRefereeStatus("执裁中")');
    assert.ok(syncIdx >= 0, 'executeStartMatch 必须包含 syncLiveScore()');
    assert.ok(statusIdx < syncIdx, 'updateRefereeStatus 必须在 syncLiveScore 之前调用');
  });
});

// ======================== 正式开赛状态转换 ========================
describe('正式开赛：executeStartMatch 正确设置裁判状态', () => {
  const src = readSource('referee.html');

  it('executeStartMatch 调用顺序：stopPrepCounting → 初始化状态 → updateRefereeStatus → syncLiveScore → showStep(3)', () => {
    const funcStart = 'async function executeStartMatch() {';
    const funcEnd = '\n        }';
    const i = src.indexOf(funcStart);
    const j = src.indexOf(funcEnd, i);
    const funcBody = src.slice(i, j + funcEnd.length);

    const stopIdx = funcBody.indexOf('stopPrepCounting()');
    const statusIdx = funcBody.indexOf("updateRefereeStatus('执裁中'");
    const syncIdx = funcBody.indexOf('syncLiveScore()');
    const showIdx = funcBody.indexOf('showStep(3)');

    assert.ok(stopIdx >= 0, '必须调用 stopPrepCounting()');
    assert.ok(statusIdx >= 0, '必须调用 updateRefereeStatus("执裁中")');
    assert.ok(syncIdx >= 0, '必须调用 syncLiveScore()');
    assert.ok(showIdx >= 0, '必须调用 showStep(3)');

    assert.ok(stopIdx < statusIdx, 'stopPrepCounting 必须在 updateRefereeStatus 之前');
    assert.ok(statusIdx < syncIdx, 'updateRefereeStatus 必须在 syncLiveScore 之前');
    assert.ok(syncIdx < showIdx, 'syncLiveScore 必须在 showStep(3) 之前');
  });

  it('syncLiveScore 调用 sync_live_score API 并传递 status="比赛中"', () => {
    const funcStart = 'function syncLiveScore()';
    const altStart = 'async function syncLiveScore()';
    let i = src.indexOf(funcStart);
    if (i < 0) i = src.indexOf(altStart);
    assert.ok(i >= 0, 'syncLiveScore 函数必须存在');

    // 找到函数结束（下一个 function 或 window. 定义）
    const funcBodyStart = src.indexOf('{', i);
    let j = funcBodyStart;
    let braceCount = 0;
    for (; j < src.length; j++) {
      if (src[j] === '{') braceCount++;
      else if (src[j] === '}') {
        braceCount--;
        if (braceCount === 0) break;
      }
    }
    const funcBody = src.slice(i, j + 1);

    assert.ok(
      funcBody.includes("status: '比赛中'") || funcBody.includes('status: "比赛中"'),
      'syncLiveScore 必须传递 status="比赛中" 给 sync_live_score API'
    );
    assert.ok(
      funcBody.includes("apiCall('sync_live_score'") || funcBody.includes('apiCall("sync_live_score"'),
      'syncLiveScore 必须调用 sync_live_score API'
    );
  });
});

// ======================== backToStep1 状态检查 ========================
describe('backToStep1：根据 dashboard 投影状态决定释放或阻断', () => {
  const src = readSource('referee.html');

  it('backToStep1 检查 courtStatus === "比赛中" 时阻断', () => {
    const funcStart = 'window.backToStep1 = async () => {';
    const funcEnd = '\n        };';
    const i = src.indexOf(funcStart);
    assert.ok(i >= 0, 'backToStep1 函数必须存在');
    const j = src.indexOf(funcEnd, i);
    const funcBody = src.slice(i, j + funcEnd.length);

    assert.ok(
      funcBody.includes("courtStatus === '比赛中'") || funcBody.includes('courtStatus === "比赛中"'),
      'backToStep1 必须检查 courtStatus === "比赛中" 并阻断'
    );
    assert.ok(
      funcBody.includes('规则阻断拦截') || funcBody.includes('比赛已在进行中'),
      'backToStep1 阻断时必须显示正式中断/完赛提示'
    );
  });

  it('backToStep1 在"待开赛"阶段调用 release_task_acceptance', () => {
    const funcStart = 'window.backToStep1 = async () => {';
    const funcEnd = '\n        };';
    const i = src.indexOf(funcStart);
    const j = src.indexOf(funcEnd, i);
    const funcBody = src.slice(i, j + funcEnd.length);

    assert.ok(
      funcBody.includes("apiCall('release_task_acceptance'") || funcBody.includes('apiCall("release_task_acceptance"'),
      'backToStep1 在"待开赛"阶段必须调用 release_task_acceptance'
    );
  });

  it('backToStep1 release 成功后才清理 pendingTask 和裁判状态', () => {
    const funcStart = 'window.backToStep1 = async () => {';
    const funcEnd = '\n        };';
    const i = src.indexOf(funcStart);
    const j = src.indexOf(funcEnd, i);
    const funcBody = src.slice(i, j + funcEnd.length);

    // 验证包含 release_task_acceptance 调用
    assert.ok(
      funcBody.includes("'release_task_acceptance'"),
      '必须调用 release_task_acceptance'
    );
    // 验证包含清理 pendingTask
    assert.ok(
      funcBody.includes('window.pendingTask = null'),
      '必须清理 pendingTask'
    );
    // 验证包含 updateRefereeStatus('空闲')
    assert.ok(
      funcBody.includes("'空闲'") && funcBody.includes('updateRefereeStatus'),
      '必须调用 updateRefereeStatus("空闲")'
    );
    // 验证 release 在 pendingTask 清理之前（fail-closed 顺序）
    const releaseIdx = funcBody.indexOf("'release_task_acceptance'");
    const clearPendingIdx = funcBody.indexOf('window.pendingTask = null');
    assert.ok(releaseIdx < clearPendingIdx, 'release_task_acceptance 必须在清理 pendingTask 之前');
  });
});

// ======================== Dashboard 投影优先级 ========================
describe('Dashboard 投影：referees/live_scores 优先级正确', () => {
  const src = readSource('data.php');

  it('get_full_dashboard 先检查 referees KV（执裁中→比赛中），再检查 live_scores（待开赛覆盖）', () => {
    const caseStart = "case 'get_full_dashboard':";
    const caseEnd = 'echo json_encode($res); break;';
    const i = src.indexOf(caseStart);
    assert.ok(i >= 0, 'get_full_dashboard case 必须存在');
    const j = src.indexOf(caseEnd, i);
    const caseBody = src.slice(i, j + caseEnd.length);

    // 验证 referees 循环在 tasks 循环之前
    const refsLoopIdx = caseBody.indexOf('foreach ($refs as $r)');
    const tasksLoopIdx = caseBody.indexOf("foreach ($res['tasks'] as $t)");

    assert.ok(refsLoopIdx >= 0, '必须有 referees 循环');
    assert.ok(tasksLoopIdx >= 0, '必须有 tasks 循环');
    assert.ok(refsLoopIdx < tasksLoopIdx, 'referees 循环必须在 tasks 循环之前');
  });

  it('referees 循环：status="执裁中" 且 current_court 非空时设 court status="比赛中"', () => {
    const caseStart = "case 'get_full_dashboard':";
    const caseEnd = 'echo json_encode($res); break;';
    const i = src.indexOf(caseStart);
    const j = src.indexOf(caseEnd, i);
    const caseBody = src.slice(i, j + caseEnd.length);

    assert.ok(
      caseBody.includes("$r['status'] === '执裁中'") && caseBody.includes("$r['current_court']"),
      'referees 循环必须检查 status="执裁中" 和 current_court'
    );
    assert.ok(
      caseBody.includes("['status'] = '比赛中'"),
      'referees 循环必须设 court status="比赛中"'
    );
  });

  it('tasks 循环：live_scores status="待开赛" 且 match_id 为空时覆盖 court status', () => {
    const caseStart = "case 'get_full_dashboard':";
    const caseEnd = 'echo json_encode($res); break;';
    const i = src.indexOf(caseStart);
    const j = src.indexOf(caseEnd, i);
    const caseBody = src.slice(i, j + caseEnd.length);

    assert.ok(
      caseBody.includes("$live[$tc]['status']") && caseBody.includes("'待开赛'"),
      'tasks 循环必须检查 live_scores status="待开赛"'
    );
    assert.ok(
      caseBody.includes("['match_id'] === ''"),
      'tasks 循环必须检查 match_id 为空（避免覆盖 referees 已设置的投影）'
    );
  });
});

// ======================== accept_task 不修改 referee 状态 ========================
describe('accept_task API：不修改 referee 状态', () => {
  const src = readSource('data.php');

  it('accept_task 只写入 live_scores 和 tasks，不修改 referees KV', () => {
    const caseStart = "case 'accept_task':";
    const nextCase = "case 'release_task_acceptance':";
    const i = src.indexOf(caseStart);
    assert.ok(i >= 0, 'accept_task case 必须存在');
    const j = src.indexOf(nextCase, i);
    const caseBody = src.slice(i, j);

    // 验证写入 live_scores
    assert.ok(
      caseBody.includes("kv_set($event_code, 'live_scores'"),
      'accept_task 必须写入 live_scores'
    );

    // 验证不修改 referees
    assert.ok(
      !caseBody.includes("kv_set($event_code, 'referees'"),
      'accept_task 不得修改 referees KV — 裁判状态由 referee_update_status API 单独管理'
    );
  });
});

// ======================== release_task_acceptance 清理投影 ========================
describe('release_task_acceptance API：清理投影并恢复状态', () => {
  const src = readSource('data.php');

  it('release_task_acceptance 删除 live_scores 投影', () => {
    const caseStart = "case 'release_task_acceptance':";
    const nextCase = "case 'clear_all_tasks':";
    const i = src.indexOf(caseStart);
    assert.ok(i >= 0, 'release_task_acceptance case 必须存在');
    const j = src.indexOf(nextCase, i);
    const caseBody = src.slice(i, j);

    assert.ok(
      caseBody.includes('unset($live['),
      'release_task_acceptance 必须删除 live_scores 投影'
    );
  });

  it('release_task_acceptance 比赛中禁止释放', () => {
    const caseStart = "case 'release_task_acceptance':";
    const nextCase = "case 'clear_all_tasks':";
    const i = src.indexOf(caseStart);
    const j = src.indexOf(nextCase, i);
    const caseBody = src.slice(i, j);

    assert.ok(
      caseBody.includes('比赛已开始') || caseBody.includes('禁止普通释放'),
      'release_task_acceptance 必须在比赛中禁止释放'
    );
  });
});

// ======================== 备份恢复路径 ========================
describe('备份恢复：checkAndRestoreBackup 不提前升级设置阶段裁判状态', () => {
  const src = readSource('referee.html');

  it('checkAndRestoreBackup 中 updateRefereeStatus("执裁中") 仅在 data.step >= 3 时调用', () => {
    const funcStart = 'function checkAndRestoreBackup()';
    const i = src.indexOf(funcStart);
    assert.ok(i >= 0, 'checkAndRestoreBackup 函数必须存在');

    const funcBodyStart = src.indexOf('{', i);
    let j = funcBodyStart;
    let braceCount = 0;
    for (; j < src.length; j++) {
      if (src[j] === '{') braceCount++;
      else if (src[j] === '}') {
        braceCount--;
        if (braceCount === 0) break;
      }
    }
    const funcBody = src.slice(i, j + 1);

    assert.ok(
      funcBody.includes('data.step >= 3') || funcBody.includes('data.step >=3'),
      'checkAndRestoreBackup 必须检查 data.step >= 3 才设置裁判为"执裁中"'
    );
    assert.ok(
      funcBody.includes("data.step >= 3) { updateRefereeStatus('执裁中'") ||
      funcBody.includes('data.step >= 3) {updateRefereeStatus'),
      'updateRefereeStatus("执裁中") 必须在 data.step >= 3 条件内'
    );
  });

  it('backupState 保存当前 step 信息', () => {
    const funcStart = 'function backupState()';
    const i = src.indexOf(funcStart);
    assert.ok(i >= 0, 'backupState 函数必须存在');

    const funcBodyStart = src.indexOf('{', i);
    let j = funcBodyStart;
    let braceCount = 0;
    for (; j < src.length; j++) {
      if (src[j] === '{') braceCount++;
      else if (src[j] === '}') {
        braceCount--;
        if (braceCount === 0) break;
      }
    }
    const funcBody = src.slice(i, j + 1);

    assert.ok(
      funcBody.includes('getCurrentStep()') || funcBody.includes('step:'),
      'backupState 必须保存当前 step 信息'
    );
  });
});
