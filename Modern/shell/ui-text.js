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

  return Object.freeze({ actorLabels, statusLabels, actorLabel, statusLabel });
});
