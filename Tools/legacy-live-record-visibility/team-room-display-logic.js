/**
 * team-room-display-logic.js — 团体房间卡队伍编号显示规则（P2 镜像）
 *
 * 与 Legacy/master.html 团队房间卡 displayCode 段保持一致
 * （分支 fix/legacy-team-live-record-visibility）。
 * 此文件可在 Node.js (require) 和浏览器 (<script>) 中加载。
 *
 * 规则：
 * - 房间卡只显示当前球员库中同队一致的 team_code。
 * - 建房时复制的 room-local team_code 不参与显示决策。
 * - 同名队伍找不到唯一非 TMP 编号时显示空，不做猜测。
 */
(function (root) {
  'use strict';

  /**
   * @param {object} team     team_event 房间中的队伍条目 { team_name, team_code, players }
   * @param {object[]} players  当前球员库
   * @returns {string} 显示用队伍编号
   */
  function teamCodeDisplay(team, players) {
    if (!team || !team.team_name || !Array.isArray(players)) return '';
    var codes = players
      .filter(function (player) {
        return player.team === team.team_name && (!team.group || player.group === team.group);
      })
      .map(function (player) { return String(player.team_code || '').trim(); })
      .filter(function (code) { return code && !/^TMP-/i.test(code); });
    var uniqueCodes = Array.from(new Set(codes));
    return uniqueCodes.length === 1 ? uniqueCodes[0] : '';
  }

  var api = { teamCodeDisplay: teamCodeDisplay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TeamRoomDisplayLogic = api;
})(typeof self !== 'undefined' ? self : this);
