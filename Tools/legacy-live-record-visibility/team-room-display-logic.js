/**
 * team-room-display-logic.js — 团体房间卡队伍编号显示规则（P2 镜像）
 *
 * 与 Legacy/master.html 团队房间卡 displayCode 段保持一致
 * （分支 fix/legacy-team-live-record-visibility）。
 * 此文件可在 Node.js (require) 和浏览器 (<script>) 中加载。
 *
 * 规则：
 * - 房间卡显示 team.team_code（T01/T02），直接取自建房时写入的字段。
 * - 禁止从第一名球员的 id_code 推导（旧实现的跨队宽松匹配曾导致错码）。
 * - team_code 缺失时显示空（不显示任何编号），不做猜测。
 */
(function (root) {
  'use strict';

  /**
   * @param {object} team     team_event 房间中的队伍条目 { team_name, team_code, players }
   * @param {object[]} _players 球员库（保留参数以对齐旧签名；新规则禁止使用）
   * @returns {string} 显示用队伍编号
   */
  function teamCodeDisplay(team, _players) {
    if (!team || typeof team.team_code !== 'string') return '';
    return team.team_code;
  }

  var api = { teamCodeDisplay: teamCodeDisplay };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TeamRoomDisplayLogic = api;
})(typeof self !== 'undefined' ? self : this);
