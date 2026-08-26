/**
 * court-handoff-logic.js — 裁判开赛场地传递规则（P1-1 镜像）
 *
 * 与 Legacy/referee.html handleStartSetup 的场地校验段保持一致
 * （referee.html [P1-1] 段，分支 fix/legacy-team-live-record-visibility）。
 * 此文件可在 Node.js (require) 和浏览器 (<script>) 中加载。
 *
 * 规则：
 * - 存在网络任务（pendingTask）时，场地必须继承 task.court（主控分配），
 *   裁判不得凭记忆手工填写；输入值被强制覆盖。
 * - task 无 court 时，阻断开赛，提示「请先由主控分配场地」。
 * - 无网络任务（本地自由赛 / local 模式）时，沿用手工输入的场地。
 */
(function (root) {
  'use strict';

  /**
   * @param {object|null} pendingTask  裁判提取的网络任务（可为 null）
   * @param {string} inputCourt        裁判端场地输入框当前值
   * @param {string} sysMode           'team' | 'ind' | 'local'
   * @returns {{ blocked: boolean, court: string, reason: string }}
   */
  function resolveStartCourt(pendingTask, inputCourt, sysMode) {
    var court = String(inputCourt == null ? '' : inputCourt);
    if (sysMode === 'local' || !pendingTask) {
      return { blocked: false, court: court.trim() || '1', reason: '' };
    }
    if (pendingTask.court) {
      return { blocked: false, court: String(pendingTask.court), reason: '' };
    }
    if (court.trim() === '') {
      return { blocked: true, court: '', reason: '请先由主控分配场地' };
    }
    // 有网络任务但任务本身无 court：即便输入框有值也不得采信（防止凭记忆手工填写）
    return { blocked: true, court: '', reason: '请先由主控分配场地' };
  }

  var api = { resolveStartCourt: resolveStartCourt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CourtHandoffLogic = api;
})(typeof self !== 'undefined' ? self : this);
