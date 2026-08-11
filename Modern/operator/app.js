const api = RefereeApi.createRefereeApi({ accountabilityContext: AccountabilityContext.browser });
const list = document.querySelector("#matches");
const notice = document.querySelector("#notice");
const form = document.querySelector("#context-form");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function matchCard(match) {
  const team1 = escapeHtml(match.team1?.name || "一方");
  const team2 = escapeHtml(match.team2?.name || "另一方");
  const score1 = match.score1 ?? "–";
  const score2 = match.score2 ?? "–";
  const actions = {
    assigned: `<button data-action="accept">接受执裁任务</button>`,
    playing: `<form class="score-form"><label>${team1}<input name="score1" type="number" min="0" required></label><label>${team2}<input name="score2" type="number" min="0" required></label><button>录入比分</button></form>`,
    scored: `<p class="muted">赛果已提交，等待主控确认</p>`,
    confirmed: `<p class="complete">赛果已由比赛操作确认</p>`
  }[match.status] || `<p class="muted">等待比赛操作</p>`;

  return `<article class="match" data-match-id="${escapeHtml(match.id)}">
    <header><div><span class="eyebrow">第 ${escapeHtml(match.roundNum || "—")} 轮</span><h2>${team1} <span>对</span> ${team2}</h2></div><span class="status">${escapeHtml(UiText.statusLabel(match.status))}</span></header>
    <div class="meta"><span>⌖ ${escapeHtml(match.court || "场地待定")}</span><span>◷ ${match.scheduledAt ? escapeHtml(new Date(match.scheduledAt).toLocaleString("zh-CN")) : "时间待定"}</span></div>
    <div class="score"><strong>${score1}</strong><span>正式比分</span><strong>${score2}</strong></div>
    <div class="action">${actions}</div>
  </article>`;
}

const view = {
  loading() { notice.textContent = "正在加载比赛任务…"; notice.className = "notice"; },
  busy(matchId) { notice.textContent = `正在更新比赛 ${matchId}…`; notice.className = "notice"; },
  error(message) { notice.textContent = message; notice.className = "notice error"; },
  matches(matches) {
    notice.textContent = `已加载 ${matches.length} 场已分配比赛。`;
    notice.className = "notice";
    list.innerHTML = matches.length ? matches.map(matchCard).join("") : `<div class="empty"><strong>当前任务已全部处理。</strong><p>目前没有已分配的比赛。</p></div>`;
  }
};

const workflow = RefereeWorkflow.createRefereeWorkflow({ api, view, accountabilityFlow: WorkflowAccountability.browser });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await workflow.start(ResponsibilityContext.browser.current());
  } catch (error) { view.error(error.message); }
});
list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button) workflow.run({ type: button.dataset.action, matchId: button.closest(".match").dataset.matchId });
});
list.addEventListener("submit", (event) => {
  if (!event.target.matches(".score-form")) return;
  event.preventDefault();
  const values = new FormData(event.target);
  workflow.run({ type: "score", matchId: event.target.closest(".match").dataset.matchId,
    score: { score1: Number(values.get("score1")), score2: Number(values.get("score2")) } });
});
