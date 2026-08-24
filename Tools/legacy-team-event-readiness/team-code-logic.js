/**
 * team-code-logic.js — 团体赛 CSV 导入 team_code 生成核心逻辑
 *
 * 修复前：id_code = "完整队名-01", "完整队名-02" … 每人都不同
 * 修复后：team_code 同队共享（T01, T02…），id_code = "T01-01", "T01-02" …
 *
 * 此文件可在 Node.js (require) 和浏览器 (<script>) 中加载。
 */
(function (root) {
  'use strict';

  // 与 Legacy master.html L443-445 保持一致
  var NAME_REGEX  = /姓名|名单|参赛搭档|选手|运动员/i;
  var TEAM_REGEX  = /队名|单位|学校|队伍/;
  var GROUP_REGEX = /项目名称|组别|所在小组|项目/i;
  var SPLIT_REGEX = /[\+＋\/／、＆&\|]/;

  /**
   * 解析 CSV 文本，返回 { headers, rows }
   * - headers: 表头数组
   * - rows: 数据行数组（与 headers 等长，不足补 ''）
   */
  function parseCSV(text) {
    // 去除 UTF-8 BOM
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (lines.length === 0) return { headers: [], rows: [], nameIdx: -1, teamIdx: -1, groupIdx: -1 };

    var headers = lines[0].split(',').map(function (h) { return h.trim(); });
    var nameIdx  = headers.findIndex(function (h) { return NAME_REGEX.test(h); });
    var teamIdx  = headers.findIndex(function (h) { return TEAM_REGEX.test(h); });
    var groupIdx = headers.findIndex(function (h) { return GROUP_REGEX.test(h); });

    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      var cols = lines[i].split(',').map(function (c) { return c.trim(); });
      // 补齐列数
      while (cols.length < headers.length) cols.push('');
      rows.push(cols);
    }
    return { headers: headers, rows: rows, nameIdx: nameIdx, teamIdx: teamIdx, groupIdx: groupIdx };
  }

  /**
   * 核心导入逻辑
   *
   * @param {Object[]}  csvRows     - parseCSV().rows
   * @param {number}    nameIdx     - 姓名列索引
   * @param {number}    teamIdx     - 队名列索引（-1 表示无此列）
   * @param {number}    groupIdx    - 组别列索引（-1 表示无此列）
   * @param {Object[]}  dbPlayers   - 现有球员数组（会被就地修改）
   * @param {Object}    [state]     - 可选：{ teamCodeMap, teamPlayerCounters, globalTeamCounter }
   * @returns {{ added: number, teamCodeMap: Object, teamPlayerCounters: Object, globalTeamCounter: number }}
   */
  function processImport(csvRows, nameIdx, teamIdx, groupIdx, dbPlayers, state) {
    state = state || {};
    var teamCodeMap        = state.teamCodeMap        || {};
    var teamPlayerCounters = state.teamPlayerCounters || {};
    var globalTeamCounter  = state.globalTeamCounter  || 0;

    var currentTeamName  = '未知队伍';
    var currentGroupName = '系统池';
    var added = 0;

    // 预填：从已有球员继承 team_code 和序号
    for (var k = 0; k < dbPlayers.length; k++) {
      var ep = dbPlayers[k];
      if (ep.team_code && ep.team && !teamCodeMap[ep.team]) {
        teamCodeMap[ep.team] = ep.team_code;
        var tn = parseInt(ep.team_code.replace(/^T/, ''), 10);
        if (!isNaN(tn) && tn > globalTeamCounter) globalTeamCounter = tn;
      }
      if (ep.id_code && ep.team) {
        var parts = ep.id_code.split('-');
        if (parts.length >= 2) {
          var seq = parseInt(parts[parts.length - 1], 10);
          if (!isNaN(seq) && seq > (teamPlayerCounters[ep.team] || 0)) {
            teamPlayerCounters[ep.team] = seq;
          }
        }
      }
    }

    for (var i = 0; i < csvRows.length; i++) {
      var row = csvRows[i];
      var name = String(row[nameIdx] || '').trim();
      if (!name) continue;
      // 去除行首序号（与 Legacy 一致）
      name = name.replace(/^\d+[.、\s]+|^\d+号\s*/, '').trim();

      var rowTeam  = teamIdx  !== -1 ? String(row[teamIdx]  || '').trim() : '';
      var rowGroup = groupIdx !== -1 ? String(row[groupIdx] || '').trim() : '';
      if (rowTeam)  currentTeamName  = rowTeam.replace(/[\r\n]+/g, '');
      if (rowGroup) currentGroupName = rowGroup.replace(/[\r\n]+/g, '');

      // ★ 关键修复：同队共享 team_code ★
      if (!teamCodeMap[currentTeamName]) {
        globalTeamCounter++;
        teamCodeMap[currentTeamName] = 'T' + String(globalTeamCounter).padStart(2, '0');
      }
      var teamCode = teamCodeMap[currentTeamName];

      if (!teamPlayerCounters[currentTeamName]) teamPlayerCounters[currentTeamName] = 0;

      var names = name.split(SPLIT_REGEX).map(function (s) { return s.trim(); }).filter(Boolean);
      for (var j = 0; j < names.length; j++) {
        var n = names[j];
        var exists = dbPlayers.find(function (p) { return p.name === n && p.team === currentTeamName; });
        if (!exists) {
          teamPlayerCounters[currentTeamName]++;
          var id_code = teamCode + '-' + String(teamPlayerCounters[currentTeamName]).padStart(2, '0');
          dbPlayers.push({
            id_code:   id_code,
            team_code: teamCode,
            group:     currentGroupName,
            position:  dbPlayers.length + 1,
            name:      n,
            team:      currentTeamName,
            checked_in: false
          });
          added++;
        }
      }
    }

    return {
      added: added,
      teamCodeMap: teamCodeMap,
      teamPlayerCounters: teamPlayerCounters,
      globalTeamCounter: globalTeamCounter
    };
  }

  /**
   * 队伍编号显示选择逻辑（与 players.html renderTable 一致）
   * 优先使用 team_code，旧数据缺 team_code 时回退到 id_code 前缀
   */
  function resolveTeamPrefix(player) {
    if (!player) return '—';
    if (player.team_code) return player.team_code;
    if (player.id_code && player.id_code.includes('-')) {
      var parts = player.id_code.split('-');
      if (parts.length >= 2) return parts.slice(0, 2).join('-');
    }
    return '—';
  }

  // 导出（兼容 Node.js 和浏览器）
  var exported = {
    parseCSV: parseCSV,
    processImport: processImport,
    resolveTeamPrefix: resolveTeamPrefix,
    NAME_REGEX: NAME_REGEX,
    TEAM_REGEX: TEAM_REGEX,
    GROUP_REGEX: GROUP_REGEX,
    SPLIT_REGEX: SPLIT_REGEX
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  } else {
    root.TeamCodeLogic = exported;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this));
