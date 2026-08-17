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
  const playingAction = ["constrained", "uncertain"].includes(match.courtCondition)
    ? `<p class="notice error">场地${match.courtCondition === "constrained" ? "受限" : "状态待确认"}，请明确中断比赛。</p><button data-action="interrupt">中断比赛</button>`
    : RefereeScoring.panelHtml({ matchId: escapeHtml(match.id), team1, team2 });
  const interruptedAction = match.courtCondition === "available"
    ? `<p class="complete">场地已由主控报告恢复，请明确恢复比赛。</p><button data-action="resume">恢复比赛</button>`
    : `<p class="muted">比赛已中断，等待主控报告场地恢复。</p>`;
  const actions = {
    assigned: `<button data-action="accept">接受执裁任务</button>`,
    accepted: `<button data-action="start">开始比赛</button>`,
    playing: playingAction,
    interrupted: interruptedAction,
    scored: `<p class="muted">赛果已提交，等待主控确认</p>`,
    confirmed: `<p class="complete">赛果已由比赛操作确认</p>`
  }[match.status] || `<p class="muted">等待比赛操作</p>`;

  return `<article class="match" data-match-id="${escapeHtml(match.id)}" data-dispatch-version="${match.dispatchVersion ?? 0}">
    <header><div><span class="eyebrow">第 ${escapeHtml(match.roundNum || "—")} 轮</span><h2>${team1} <span>对</span> ${team2}</h2></div><span class="status">${escapeHtml(UiText.statusLabel(match.status))}</span></header>
    <div class="meta"><span>⌖ ${escapeHtml(match.court || "场地待定")}</span><span>◷ ${match.scheduledAt ? escapeHtml(new Date(match.scheduledAt).toLocaleString("zh-CN")) : "时间待定"}</span></div>
    <div class="score"><strong>${score1}</strong><span>正式比分</span><strong>${score2}</strong></div>
    <div class="action">${actions}</div>
  </article>`;
}

const view = {
  loading() { notice.textContent = "正在加载比赛任务…"; notice.className = "notice"; },
  busy(matchId) { notice.textContent = `正在更新比赛 ${matchId}…`; notice.className = "notice"; },
  error(message) { notice.textContent = UiText.userFacingError(message); notice.className = "notice error"; },
  matches(matches) {
    notice.textContent = `已加载 ${matches.length} 场已分配比赛。`;
    notice.className = "notice";
    list.innerHTML = matches.length ? matches.map(matchCard).join("") : `<div class="empty"><strong>当前任务已全部处理。</strong><p>目前没有已分配的比赛。</p></div>`;
    RefereeScoring.mount(list, {
      onSubmit({ matchId, score }) {
        return workflow.run({ type: "score", matchId, score });
      }
    });
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
  if (button) {
    const matchEl = button.closest(".match");
    workflow.run({
      type: button.dataset.action,
      matchId: matchEl.dataset.matchId,
      dispatchVersion: Number(matchEl.dataset.dispatchVersion || 0)
    });
  }
});

// Referee identity entry: pick a name from the roster, then establish a session
// via the development-only foundation-establish boundary (accepted risk for the
// first event's trusted-network scenario; no password authentication yet).
(function mountIdentityEntry() {
  const entry = document.querySelector("#identity-entry");
  if (!entry) return;
  const identityForm = document.querySelector("#identity-form");
  const competitionInput = identityForm.elements.competitionId;
  const refereeSelect = identityForm.elements.refereeId;
  const submitButton = identityForm.querySelector('button[type="submit"]');
  const status = document.querySelector("#identity-status");

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.className = isError ? "notice error" : "notice";
  }

  async function loadRoster() {
    const competitionId = competitionInput.value.trim();
    if (!competitionId) return;
    refereeSelect.disabled = true;
    submitButton.disabled = true;
    refereeSelect.innerHTML = `<option value="">正在加载花名册…</option>`;
    setStatus("正在加载裁判花名册…");
    try {
      const response = await fetch(`/api/public/competitions/${encodeURIComponent(competitionId)}/referee-roster`);
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "花名册加载失败");
      const referees = body.referees || [];
      if (referees.length === 0) {
        refereeSelect.innerHTML = `<option value="">该赛事暂无裁判花名册</option>`;
        setStatus("该赛事尚未登记裁判花名册，请联系主控。", true);
        return;
      }
      refereeSelect.innerHTML = `<option value="">请选择您的名字</option>${referees.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("")}`;
      refereeSelect.disabled = false;
      setStatus(`已加载 ${referees.length} 位裁判，请选择您的名字。`);
    } catch (error) {
      refereeSelect.innerHTML = `<option value="">花名册加载失败</option>`;
      setStatus(UiText.userFacingError(error), true);
    }
  }

  competitionInput.addEventListener("change", loadRoster);
  refereeSelect.addEventListener("change", () => {
    submitButton.disabled = !refereeSelect.value;
  });

  identityForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const competitionId = competitionInput.value.trim();
    const refereeId = refereeSelect.value;
    if (!competitionId || !refereeId) return;
    submitButton.disabled = true;
    setStatus("正在建立身份…");
    try {
      const response = await fetch("/api/session/foundation-establish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: refereeId, actorType: "referee" })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "身份建立失败");
      localStorage.setItem(ResponsibilityContext.COMPETITION_KEY, competitionId);
      window.location.href = `/operator/?competitionId=${encodeURIComponent(competitionId)}`;
    } catch (error) {
      setStatus(UiText.userFacingError(error), true);
      submitButton.disabled = false;
    }
  });

  // Show the entry card only when no authenticated session exists.
  fetch("/api/session/me").then((response) => {
    if (!response.ok) {
      entry.hidden = false;
      const stored = localStorage.getItem(ResponsibilityContext.COMPETITION_KEY);
      const query = new URLSearchParams(window.location.search).get("competitionId");
      const preset = query || stored;
      if (preset) {
        competitionInput.value = preset;
        loadRoster();
      }
    }
  }).catch(() => { entry.hidden = false; });
})();
