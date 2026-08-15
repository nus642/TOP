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
  const dispatchStatus = UiText.deriveDispatchStatus(match);
  const dispatchLabel = UiText.dispatchStatusLabel(dispatchStatus);
  const nextAction = UiText.nextActionLabel(dispatchStatus);
  const version = referee.dispatchVersion ?? 0;

  let actionHtml = "";

  if (dispatchStatus === "not_dispatched") {
    actionHtml = `<button type="button" class="btn-dispatch" data-action="dispatch" data-match-id="${escapeHtml(match.matchId)}" data-version="${escapeHtml(version)}" data-court="${escapeHtml(schedule.courtId || "")}">派单</button>`;
  } else if (dispatchStatus === "waiting_acceptance") {
    actionHtml = `<div class="dispatch-actions">
      <button type="button" class="btn-withdraw" data-action="withdraw" data-match-id="${escapeHtml(match.matchId)}" data-version="${escapeHtml(version)}">撤回</button>
      <button type="button" class="btn-reassign" data-action="reassign" data-match-id="${escapeHtml(match.matchId)}" data-version="${escapeHtml(version)}">换派</button>
    </div>`;
  } else if (dispatchStatus === "scored") {
    actionHtml = `<button type="button" data-action="confirm-result" data-match-id="${escapeHtml(match.matchId)}">确认已提交赛果</button>`;
  }

  return `<article class="match" data-match-id="${escapeHtml(match.matchId)}" data-dispatch-status="${escapeHtml(dispatchStatus)}">
    <header><div><span class="eyebrow">第 ${escapeHtml(match.roundNumber || "—")} 轮</span><h2>${team1} <span>对</span> ${team2}</h2></div><span class="status">${escapeHtml(dispatchLabel)}</span></header>
    <div class="meta"><span>⌖ ${escapeHtml(schedule.courtId || "场地待定")}</span><span>◷ ${schedule.scheduledAt ? escapeHtml(new Date(schedule.scheduledAt).toLocaleString("zh-CN")) : "时间待定"}</span></div>
    <p class="assignment">裁判：<strong>${escapeHtml(referee.refereeId || "未分配")}</strong> · 派单版本 ${escapeHtml(version)} · 下一步：${escapeHtml(nextAction)}</p>
    ${actionHtml}
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

// Context form: open master workspace
contextForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await workflow.start(ResponsibilityContext.browser.current());
  } catch (error) { view.error(error); }
});

// Dispatch button: load candidates and show dispatch form
list.addEventListener("click", async (event) => {
  const dispatchBtn = event.target.closest('button[data-action="dispatch"]');
  if (dispatchBtn) {
    const matchId = dispatchBtn.dataset.matchId;
    const courtId = dispatchBtn.dataset.court;
    const version = Number(dispatchBtn.dataset.version);
    dispatchBtn.disabled = true;
    dispatchBtn.textContent = "正在加载候选…";
    try {
      const candidates = await workflow.loadCandidates(matchId);
      const referees = candidates.eligibleReferees || [];
      const article = dispatchBtn.closest(".match");
      const form = document.createElement("div");
      form.className = "dispatch-form";
      form.innerHTML = `<form class="inline-dispatch-form" data-match-id="${escapeHtml(matchId)}">
        <p>授权场地：<strong>${escapeHtml(candidates.courtId || courtId || "未知")}</strong></p>
        <label>选择裁判 <select name="refereeId" required>
          <option value="">请选择裁判</option>
          ${referees.map(r => `<option value="${escapeHtml(r.refereeId)}">${escapeHtml(r.refereeId)}</option>`).join("")}
        </select></label>
        ${referees.length === 0 ? `<p class="notice error">当前无可用裁判候选。</p>` : ""}
        <input type="hidden" name="courtId" value="${escapeHtml(candidates.courtId || courtId || "")}">
        <input type="hidden" name="expectedVersion" value="${escapeHtml(version)}">
        <div><button type="submit" ${referees.length === 0 ? "disabled" : ""}>确认派单</button> <button type="button" data-action="cancel-dispatch">取消</button></div>
      </form>`;
      article.appendChild(form);
      dispatchBtn.remove();
    } catch (error) {
      view.error(error);
      dispatchBtn.disabled = false;
      dispatchBtn.textContent = "派单";
    }
    return;
  }

  // Cancel dispatch form
  const cancelBtn = event.target.closest('button[data-action="cancel-dispatch"]');
  if (cancelBtn) {
    const form = cancelBtn.closest(".dispatch-form");
    if (form) form.remove();
    return;
  }

  // Confirm result
  const confirmBtn = event.target.closest('button[data-action="confirm-result"]');
  if (confirmBtn) {
    workflow.confirm(confirmBtn.dataset.matchId);
    return;
  }

  // Withdraw
  const withdrawBtn = event.target.closest('button[data-action="withdraw"]');
  if (withdrawBtn) {
    if (confirm("确认撤回该派单？")) {
      workflow.withdraw({
        matchId: withdrawBtn.dataset.matchId,
        expectedVersion: Number(withdrawBtn.dataset.version)
      });
    }
    return;
  }

  // Reassign
  const reassignBtn = event.target.closest('button[data-action="reassign"]');
  if (reassignBtn) {
    const matchId = reassignBtn.dataset.matchId;
    const version = Number(reassignBtn.dataset.version);
    reassignBtn.disabled = true;
    reassignBtn.textContent = "正在加载候选…";
    try {
      const candidates = await workflow.loadCandidates(matchId, matchId);
      const referees = candidates.eligibleReferees || [];
      const article = reassignBtn.closest(".match");
      const form = document.createElement("div");
      form.className = "dispatch-form";
      form.innerHTML = `<form class="inline-reassign-form" data-match-id="${escapeHtml(matchId)}">
        <p>选择新裁判：</p>
        <label><select name="newRefereeId" required>
          <option value="">请选择裁判</option>
          ${referees.map(r => `<option value="${escapeHtml(r.refereeId)}">${escapeHtml(r.refereeId)}</option>`).join("")}
        </select></label>
        <input type="hidden" name="expectedVersion" value="${escapeHtml(version)}">
        <div><button type="submit">确认换派</button> <button type="button" data-action="cancel-dispatch">取消</button></div>
      </form>`;
      article.appendChild(form);
      reassignBtn.disabled = false;
      reassignBtn.textContent = "换派";
    } catch (error) {
      view.error(error);
      reassignBtn.disabled = false;
      reassignBtn.textContent = "换派";
    }
    return;
  }
});

// Submit dispatch form
list.addEventListener("submit", (event) => {
  if (event.target.matches(".inline-dispatch-form")) {
    event.preventDefault();
    const formData = new FormData(event.target);
    workflow.dispatchMatch({
      matchId: event.target.dataset.matchId,
      courtId: formData.get("courtId"),
      refereeId: formData.get("refereeId"),
      expectedVersion: Number(formData.get("expectedVersion"))
    });
    return;
  }
  if (event.target.matches(".inline-reassign-form")) {
    event.preventDefault();
    const formData = new FormData(event.target);
    workflow.reassign({
      matchId: event.target.dataset.matchId,
      newRefereeId: formData.get("newRefereeId"),
      expectedVersion: Number(formData.get("expectedVersion"))
    });
    return;
  }
  if (event.target.matches(".assignment-form")) {
    event.preventDefault();
    workflow.assign({
      matchId: event.target.closest(".match").dataset.matchId,
      refereeId: new FormData(event.target).get("refereeId")
    });
  }
});

// Court coordination
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
