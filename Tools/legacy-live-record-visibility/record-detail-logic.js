/**
 * record-detail-logic.js — 赛果单详情安全规则（P1-3 镜像）
 *
 * 与 Legacy/master.html 的 SAFE_SIGNATURE_REGEX / showRecordDetail 保持一致
 * （分支 fix/legacy-team-live-record-visibility）。
 * 此文件可在 Node.js (require) 和浏览器 (<script>) 中加载。
 *
 * 规则：
 * - 签名仅接受画布导出的 data:image base64 URL（png/jpeg/jpg/gif/webp），
 *   拒绝任意 HTML 片段、javascript:/data:text/html 等伪协议注入。
 * - 无签名或签名不合法 → 显示占位（前端渲染「（无签名图）」），不报错。
 * - 赛果单字段直接取自 records 已有字段，不改 schema。
 */
(function (root) {
  'use strict';

  // 与 master.html SAFE_SIGNATURE_REGEX 完全一致
  var SAFE_SIGNATURE_REGEX = /^data:image\/(?:png|jpe?g|gif|webp);base64,[A-Za-z0-9+\/=]+$/;

  /** 判断签名 URL 是否可安全渲染为 <img> */
  function isSafeSignatureUrl(signature) {
    if (typeof signature !== 'string' || signature === '') return false;
    return SAFE_SIGNATURE_REGEX.test(signature);
  }

  /**
   * 从 records 记录构建赛果单展示字段（缺省一律 '—'，与前端 fill 行为一致）。
   * @param {object} r records 条目（save_score 归档字段）
   */
  function buildRecordFields(r) {
    r = r || {};
    var dash = function (v) { return (v === undefined || v === null || v === '') ? '—' : String(v); };
    return {
      id: dash(r.id),
      court: r.court ? '#' + r.court + ' 场' : '—',
      teams: dash(r.t1) + ' vs ' + dash(r.t2),
      score: dash(r.score),
      details: dash(r.details),
      winner: dash(r.winner),
      referee: dash(r.referee),
      time: dash(r.time),
      hasSignature: isSafeSignatureUrl(r.signature)
    };
  }

  var api = {
    SAFE_SIGNATURE_REGEX: SAFE_SIGNATURE_REGEX,
    isSafeSignatureUrl: isSafeSignatureUrl,
    buildRecordFields: buildRecordFields
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.RecordDetailLogic = api;
})(typeof self !== 'undefined' ? self : this);
