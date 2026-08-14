const api = MasterApi.createMasterApi({ accountabilityContext: AccountabilityContext.browser });
const list = document.querySelector("#matches");
const notice = document.querySelector("#notice");
const contextForm = document.querySelector("#context-form");
const courtList = document.querySelector("#courts");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function matchCard(match) {
  const schedule = match.schedule || {};
  const referee = match.referee || {};
  const team1 = escapeHtml(match.sides?.one || "一方");
  const team2 = escapeHtml(match.sides?.two || "另一方");
  const action = match.operationStatus === "scored"
    ? `<button type="button" data-action="confirm-result">确认已提交赛果</button>`
    : `<form class="assignment-form"><label>裁判 ID<input name="refereeId" value="${escapeHtml(referee.refereeId || "")}" required></label><button>分配裁判</button></form>`;

  return `<article class="match" data-match-id="${escapeHtml(match.matchId)}">
    <header><div><span class="eyebrow">第 ${escapeHtml(match.roundNumber || "—")} 轮</span><h2>${team1} <span>对</span> ${team2}</h2></div><span class="status">${escapeHtml(UiText.statusLabel(match.operationStatus))}</span></header>
    <div class="meta"><span>⌖ ${escapeHtml(schedule.courtId || "场地待定")}</span><span>◷ ${schedule.scheduledAt ? escapeHtml(new Date(schedule.scheduledAt).toLocaleString("zh-CN")) : "时间待定"}</span></div>
    <p class="assignment">已分配裁判： <strong>${escapeHtml(referee.refereeId || "未分配")}</strong></p>
    ${action}
  </article>`;
}

const conditionLabels = { available: "空闲", occupied: "在赛", constrained: "受限", uncertain: "待确认" };
function courtCard(court) {
  const disruption = court.disruption;
  const recovery = ["constrained", "uncertain"].includes(court.condition);
  return `<article class="match court" data-court-id="${escapeHtml(court.courtId)}" data-version="${escapeHtml(court.version)}">
    <header><div><span class="eyebrow">场地</span><h2>${escapeHtml(court.courtId)}</h2></div><span class="status">${escapeHtml(conditionLabels[court.condition] || court.condition)}</span></header>
    <p class="assignment">关联比赛：<strong>${escapeHtml(court.matchId || "无")}</strong> · 下一责任：<strong>${court.nextResponsibleActor === "referee" ? "裁判" : court.nextResponsibleActor === "master" ? "主控" : "无"}</strong></p>
    ${court.attentionReason ? `<p class="notice error">场地受限但比赛仍在进行，等待裁判明确中断。</p>` : ""}
    ${disruption ? `<p class="muted">协调状态：${escapeHtml(disruption.disposition)} · 版本 ${escapeHtml(disruption.version)}</p>` : ""}
    <form class="court-report-form"><label>场地状态<select name="condition"><option value="constrained">受限</option><option value="uncertain">待确认</option>${recovery ? '<option value="available">恢复空闲</option>' : ""}</select></label><button>提交可追溯报告</button></form>
    ${disruption && disruption.disposition === "attention_required" ? `<button type="button" data-action="defer-court" data-disruption-version="${escapeHtml(disruption.version)}">记录延后协调</button>` : ""}
  </article>`;
}

const view = {
  loading() {
    notice.textContent = "正在刷新运行状态…";
    notice.className = "notice";
  },
  busy(matchId) {
    notice.textContent = `正在更新比赛 ${matchId}…`;
    notice.className = "notice";
  },
  error(message) {
    notice.textContent = UiText.userFacingError(message);
    notice.className = "notice error";
  },
  matches(matches) {
    notice.textContent = `运行视图中共有 ${matches.length} 场比赛`;
    notice.className = "notice";
    list.innerHTML = matches.length
      ? matches.map(matchCard).join("")
      : `<div class="empty"><strong>未找到比赛。</strong><p>比赛操作中没有该比赛的对局。</p></div>`;
  },
  courts(courts) {
    courtList.innerHTML = courts.length ? courts.map(courtCard).join("") : `<div class="empty"><strong>没有已知场地。</strong><p>场地来自赛事赛程。</p></div>`;
  }
};

const workflow = MasterWorkflow.createMasterWorkflow({ api, view, accountabilityFlow: WorkflowAccountability.browser });
contextForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await workflow.start(ResponsibilityContext.browser.current());
  } catch (error) { view.error(error.message); }
});
list.addEventListener("submit", (event) => {
  if (!event.target.matches(".assignment-form")) return;
  event.preventDefault();
  workflow.assign({
    matchId: event.target.closest(".match").dataset.matchId,
    refereeId: new FormData(event.target).get("refereeId")
  });
});
list.addEventListener("click", (event) => {
  const button = event.target.closest('button[data-action="confirm-result"]');
  if (button) workflow.confirm(button.closest(".match").dataset.matchId);
});
courtList.addEventListener("submit", (event) => {
  if (!event.target.matches(".court-report-form")) return;
  event.preventDefault();
  const card = event.target.closest(".court");
  workflow.reportCourt({ courtId: card.dataset.courtId, condition: new FormData(event.target).get("condition"),
    expectedVersion: Number(card.dataset.version) });
});
courtList.addEventListener("click", (event) => {
  const button = event.target.closest('button[data-action="defer-court"]');
  if (!button) return;
  workflow.deferCourt({ courtId: button.closest(".court").dataset.courtId,
    expectedVersion: Number(button.dataset.disruptionVersion) });
});
