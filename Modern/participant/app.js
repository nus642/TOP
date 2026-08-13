const api = ParticipantReadinessApi.createParticipantReadinessApi({ accountabilityContext: AccountabilityContext.browser });
const contextForm = document.querySelector("#context-form");
const readinessPanel = document.querySelector("#readiness");
const notice = document.querySelector("#notice");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

const view = {
  loading() {
    notice.textContent = "正在刷新准备状态…";
    notice.className = "notice";
  },
  busy() {
    notice.textContent = "正在为您签到…";
    notice.className = "notice";
  },
  error(message) {
    notice.textContent = UiText.userFacingError(message);
    notice.className = "notice error";
  },
  readiness(readiness) {
    const isReady = readiness.state === "ready";
    notice.textContent = "已从赛事系统获取准备状态。";
    notice.className = "notice";
    readinessPanel.innerHTML = `<article class="readiness-card ${isReady ? "ready" : "pending"}">
      <span class="status">${isReady ? "已准备" : "未签到"}</span>
      <h2>${isReady ? "您已做好参赛准备。" : "到场后请签到。"}</h2>
      <p>选手 ${escapeHtml(readiness.participantId)} · 比赛 ${escapeHtml(readiness.competitionId)}</p>
      ${readiness.checkedInAt ? `<p class="timestamp">签到时间：${escapeHtml(new Date(readiness.checkedInAt).toLocaleString("zh-CN"))}</p>` : ""}
      ${isReady ? '<p class="complete">赛事系统已确认您的签到。</p>' : '<button id="check-in" type="button">签到</button>'}
    </article>`;
  }
};

const workflow = ParticipantReadinessWorkflow.createParticipantReadinessWorkflow({ api, view, accountabilityFlow: WorkflowAccountability.browser });

contextForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await workflow.start(ResponsibilityContext.browser.current());
  } catch (error) { view.error(error.message); }
});

readinessPanel.addEventListener("click", (event) => {
  if (event.target.matches("#check-in")) workflow.checkIn();
});
