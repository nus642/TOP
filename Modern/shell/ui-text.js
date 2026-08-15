(function (factory) {
  const text = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = text;
  if (typeof window !== "undefined") window.UiText = text;
})(function () {
  const actorLabels = Object.freeze({
    referee: "裁判 • 比赛操作",
    master: "主控 • 赛事管理",
    participant: "选手 • 签到准备"
  });

  const statusLabels = Object.freeze({
    idle: "等待中",
    upcoming: "即将开始",
    assigned: "已分配",
    accepted: "已接受",
    playing: "比赛中",
    scored: "已录入比分",
    awaiting_confirmation: "待确认",
    confirmed: "已确认",
    finished: "已结束"
  });

  const dispatchStatusLabels = Object.freeze({
    not_dispatched: "未派单",
    waiting_acceptance: "等待裁判接收",
    referee_accepted: "裁判已接收",
    playing: "比赛中",
    scored: "比分已提交",
    confirmed: "已确认"
  });

  const errorCodeMessages = Object.freeze({
    STALE_DISPATCH_VERSION: "赛事状态已变化，请刷新后重试",
    COURT_CONFLICT: "场地冲突，该场地已被其他比赛占用",
    REFEREE_CONFLICT: "裁判冲突，该裁判已被其他比赛分配",
    IDEMPOTENCY_FINGERPRINT_MISMATCH: "重复请求参数不一致，请刷新后重试",
    FORBIDDEN: "无权执行此操作",
    NOT_FOUND: "比赛或赛事不存在",
    VALIDATION_ERROR: "操作参数无效"
  });

  function actorLabel(actorType) {
    return actorLabels[actorType] || actorType;
  }

  function statusLabel(status) {
    return statusLabels[status] || status;
  }

  function dispatchStatusLabel(status) {
    return dispatchStatusLabels[status] || status;
  }

  const identityErrorPatterns = [
    /authenticated actor session required/i,
    /(?:master|referee|participant) identity context is required/i,
    /unsupported authenticated actor type/i,
    /accountability (?:context does not match|changed)/i
  ];

  function extractErrorCode(message) {
    const match = message.match(/^([A-Z][A-Z_]+):/);
    return match ? match[1] : null;
  }

  function userFacingError(error) {
    const message = String(error?.message ?? error ?? "");
    if (identityErrorPatterns.some((pattern) => pattern.test(message))) {
      return "登录状态已失效，请重新进入赛事工作台。";
    }
    const code = error?.errorCode || extractErrorCode(message);
    if (code && errorCodeMessages[code]) return errorCodeMessages[code];
    if (error?.statusCode === 409) return "赛事状态已变化，请刷新后重试";
    if (error?.statusCode === 403) return errorCodeMessages.FORBIDDEN;
    if (error?.statusCode === 404) return errorCodeMessages.NOT_FOUND;
    return message || "操作失败，请稍后重试";
  }

  function deriveDispatchStatus(match) {
    const op = match.operationStatus;
    if (op === "confirmed" || op === "finished") return "confirmed";
    if (op === "scored" || op === "awaiting_confirmation") return "scored";
    if (op === "playing" || op === "interrupted") return "playing";
    if (op === "accepted") return "referee_accepted";
    if (match.referee?.dispatchId && !match.referee?.responsibilityAcceptedAt) return "waiting_acceptance";
    return "not_dispatched";
  }

  function nextActionLabel(dispatchStatus) {
    switch (dispatchStatus) {
      case "not_dispatched": return "待主控派单";
      case "waiting_acceptance": return "等待裁判操作";
      case "referee_accepted": return "等待裁判开赛";
      case "playing": return "裁判操作中";
      case "scored": return "主控确认赛果";
      case "confirmed": return "已完成";
      default: return "";
    }
  }

  return Object.freeze({ actorLabels, statusLabels, dispatchStatusLabels, errorCodeMessages, actorLabel, statusLabel, dispatchStatusLabel, userFacingError, deriveDispatchStatus, nextActionLabel });
});
