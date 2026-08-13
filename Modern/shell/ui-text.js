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
    confirmed: "已确认"
  });

  function actorLabel(actorType) {
    return actorLabels[actorType] || actorType;
  }

  function statusLabel(status) {
    return statusLabels[status] || status;
  }

  const identityErrorPatterns = [
    /authenticated actor session required/i,
    /(?:master|referee|participant) identity context is required/i,
    /unsupported authenticated actor type/i,
    /accountability (?:context does not match|changed)/i
  ];

  function userFacingError(error) {
    const message = String(error?.message ?? error ?? "");
    return identityErrorPatterns.some((pattern) => pattern.test(message))
      ? "登录状态已失效，请重新进入赛事工作台。"
      : message;
  }

  return Object.freeze({ actorLabels, statusLabels, actorLabel, statusLabel, userFacingError });
});
