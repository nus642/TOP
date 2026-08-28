/**
 * court-projection-logic.js — Master 场地卡片 task 投影核心逻辑（P1-2 镜像）
 *
 * 与 Legacy/data.php get_full_dashboard 的 task 投影段保持一致
 * （data.php L391-403，分支 fix/legacy-team-live-record-visibility）。
 * 此文件可在 Node.js (require) 和浏览器 (<script>) 中加载。
 *
 * 规则：
 * - 场地初始为空闲；裁判执裁状态只做兜底展示（遗留行为）。
 * - 以 task id/court 为唯一关联：状态为「比赛中」且有有效 court 的 task
 *   投影到对应场地卡片（真实队伍、task id、实时比分）；先到先得，不覆盖。
 * - 游离卡片仅收纳「比赛中且无 court」的 task，保证同一 task 不同现两处。
 * - 完赛后 task 被 save_score 删除、裁判回空闲 → 场地自然恢复空闲，不残留。
 */
(function (root) {
  'use strict';

  /**
   * @param {object} input
   * @param {string[]} input.courts       场地列表（来自 config.courts）
   * @param {object[]} input.referees     裁判列表 {name, status, current_court}
   * @param {object}   input.tasks        任务表 { id: {id, court, status, t1, t2, live_score} }
   * @returns {{ courts: object, strays: object[] }}
   */
  function projectCourts(input) {
    var courtList = input.courts || [];
    var referees = input.referees || [];
    var tasks = input.tasks || {};

    var courts = {};
    courtList.forEach(function (c) {
      courts[c] = { status: '空闲', referee: '', score: '', match_name: '', match_id: '' };
    });

    // 裁判执裁兜底（与 data.php 裁判循环一致）
    referees.forEach(function (r) {
      if (r.status === '执裁中' && r.current_court && courts[r.current_court]) {
        courts[r.current_court].status = '比赛中';
        courts[r.current_court].referee = r.name;
      }
    });

    // task 投影：比赛中 + 有效 court + 该场地尚无 task 认领
    Object.keys(tasks).forEach(function (key) {
      var t = tasks[key];
      var tc = String(t.court == null ? '' : t.court).trim();
      if (t.status === '比赛中' && tc !== '' && courts[tc] && courts[tc].match_id === '') {
        courts[tc].status = '比赛中';
        courts[tc].match_id = t.id != null ? t.id : key;
        courts[tc].match_name = ((t.t1 || '') + ' vs ' + (t.t2 || '')).trim();
        courts[tc].score = t.live_score || '';
      }
    });

    // 游离：比赛中且无 court（与 master.html 游离卡条件一致）
    var strays = [];
    Object.keys(tasks).forEach(function (key) {
      var t = tasks[key];
      var tc = String(t.court == null ? '' : t.court).trim();
      if (t.status === '比赛中' && tc === '') strays.push(t);
    });

    return { courts: courts, strays: strays };
  }

  var api = { projectCourts: projectCourts };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CourtProjectionLogic = api;
})(typeof self !== 'undefined' ? self : this);
