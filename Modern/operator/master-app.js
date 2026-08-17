const api = MasterApi.createMasterApi({ accountabilityContext: AccountabilityContext.browser });
const list = document.querySelector("#matches");
const notice = document.querySelector("#notice");
const contextForm = document.querySelector("#context-form");
const courtList = document.querySelector("#courts");
const checkInAllButton = document.querySelector("#check-in-all");
const importData = document.querySelector("#import-data");
const importSubmit = document.querySelector("#import-submit");
const importResult = document.querySelector("#import-result");
const addMatchForm = document.querySelector("#add-match-form");

let activeCompetitionId = null;

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
    actionHtml = `<div class="dispatch-actions">
      <button type="button" class="btn-dispatch" data-action="dispatch" data-match-id="${escapeHtml(match.matchId)}" data-version="${escapeHtml(version)}" data-court="${escapeHtml(schedule.courtId || "")}">派单</button>
      <button type="button" data-action="edit-match" data-match-id="${escapeHtml(match.matchId)}">编辑</button>
      <button type="button" data-action="delete-match" data-match-id="${escapeHtml(match.matchId)}">删除</button>
    </div>`;
  } else if (dispatchStatus === "waiting_acceptance") {
    actionHtml = `<div class="dispatch-actions">
      <button type="button" class="btn-withdraw" data-action="withdraw" data-match-id="${escapeHtml(match.matchId)}" data-version="${escapeHtml(version)}">撤回</button>
      <button type="button" class="btn-reassign" data-action="reassign" data-match-id="${escapeHtml(match.matchId)}" data-version="${escapeHtml(version)}">换派</button>
    </div>`;
  } else if (dispatchStatus === "scored") {
    actionHtml = `<button type="button" data-action="confirm-result" data-match-id="${escapeHtml(match.matchId)}">确认已提交赛果</button>`;
  }

  return `<article class="match" data-match-id="${escapeHtml(match.matchId)}" data-dispatch-status="${escapeHtml(dispatchStatus)}" data-round="${escapeHtml(match.roundNumber || "")}" data-court="${escapeHtml(schedule.courtId || "")}" data-scheduled-at="${escapeHtml(schedule.scheduledAt || "")}" data-side-one="${escapeHtml(match.sides?.one || "")}" data-side-two="${escapeHtml(match.sides?.two || "")}">
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
  info(message) {
    notice.textContent = message;
    notice.className = "notice";
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
    const context = ResponsibilityContext.browser.current();
    activeCompetitionId = context?.competitionId || null;
    await workflow.start(context);
    checkInAllButton.disabled = false;
    importSubmit.disabled = false;
    addMatchForm.querySelector('button[type="submit"]').disabled = false;
  } catch (error) { view.error(error); }
});

// Bulk check-in: Master marks every registered player as checked in
checkInAllButton.addEventListener("click", async () => {
  if (!confirm("确认将全部选手标记为已签到？")) return;
  checkInAllButton.disabled = true;
  try {
    await workflow.checkInAll();
  } finally {
    checkInAllButton.disabled = false;
  }
});

// Convert an ISO timestamp to a datetime-local input value,
// pinned to Asia/Shanghai to avoid local timezone drift on operator devices.
function toLocalInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false
  }).formatToParts(d);
  const get = (type) => (parts.find((p) => p.type === type) || {}).value || "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

// Schedule import: paste external arrangement JSON, whole-table replace
importSubmit.addEventListener("click", async () => {
  importResult.innerHTML = "";
  let data;
  try {
    data = JSON.parse(importData.value);
  } catch {
    importResult.innerHTML = `<p class="notice error">JSON 格式不正确，无法解析。</p>`;
    return;
  }
  importSubmit.disabled = true;
  try {
    const result = await api.scheduleImport(activeCompetitionId, data);
    const summary = result.summary || {};
    importResult.innerHTML = `<p class="notice">导入成功：${escapeHtml(summary.players ?? 0)} 名选手、${escapeHtml(summary.pairs ?? 0)} 对组合、${escapeHtml(summary.matches ?? 0)} 场比赛、${escapeHtml(summary.rounds ?? 0)} 轮。</p>`;
    importData.value = "";
    await workflow.refresh();
  } catch (error) {
    const rows = Array.isArray(error.details?.errors) ? error.details.errors : [];
    importResult.innerHTML = rows.length
      ? `<p class="notice error">导入校验失败（${rows.length} 项）：</p><ul class="import-errors">${rows.map((row) => `<li>${escapeHtml(row.row || "全局")}：${escapeHtml(row.message)}</li>`).join("")}</ul>`
      : `<p class="notice error">${escapeHtml(UiText.userFacingError(error))}</p>`;
  } finally {
    importSubmit.disabled = false;
  }
});

// Add one match to the arrangement
addMatchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(addMatchForm);
  const rawTime = formData.get("scheduledAt");
  try {
    const result = await api.addMatchArrangement(activeCompetitionId, {
      roundNum: Number(formData.get("roundNum")),
      court: formData.get("court"),
      scheduledAt: rawTime ? new Date(rawTime).toISOString() : "",
      p1: formData.get("p1"),
      p2: formData.get("p2"),
      p3: formData.get("p3"),
      p4: formData.get("p4")
    });
    view.info(`已新增比赛 ${result.matchId}`);
    addMatchForm.reset();
    await workflow.refresh();
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

  // Edit single match arrangement (only offered for undispatched matches)
  const editBtn = event.target.closest('button[data-action="edit-match"]');
  if (editBtn) {
    const article = editBtn.closest(".match");
    const matchId = editBtn.dataset.matchId;
    const [p1 = "", p2 = ""] = (article.dataset.sideOne || "").split(" & ");
    const [p3 = "", p4 = ""] = (article.dataset.sideTwo || "").split(" & ");
    const existing = article.querySelector(".dispatch-form");
    if (existing) existing.remove();
    const form = document.createElement("div");
    form.className = "dispatch-form";
    form.innerHTML = `<form class="inline-edit-form arrangement-form" data-match-id="${escapeHtml(matchId)}">
      <label>轮次 <input name="roundNum" inputmode="numeric" value="${escapeHtml(article.dataset.round)}" required></label>
      <label>场地 <input name="court" value="${escapeHtml(article.dataset.court)}" required></label>
      <label>时间 <input name="scheduledAt" type="datetime-local" value="${escapeHtml(toLocalInputValue(article.dataset.scheduledAt))}" required></label>
      <label>P1 <input name="p1" value="${escapeHtml(p1)}" required></label>
      <label>P2 <input name="p2" value="${escapeHtml(p2)}" required></label>
      <label>P3 <input name="p3" value="${escapeHtml(p3)}" required></label>
      <label>P4 <input name="p4" value="${escapeHtml(p4)}" required></label>
      <div><button type="submit">保存修改</button> <button type="button" data-action="cancel-dispatch">取消</button></div>
    </form>`;
    article.appendChild(form);
    return;
  }

  // Delete single match arrangement
  const deleteBtn = event.target.closest('button[data-action="delete-match"]');
  if (deleteBtn) {
    if (!confirm("确认删除该场比赛？删除后无法恢复。")) return;
    deleteBtn.disabled = true;
    try {
      await api.deleteMatchArrangement(activeCompetitionId, deleteBtn.dataset.matchId);
      await workflow.refresh();
    } catch (error) {
      view.error(error);
      deleteBtn.disabled = false;
    }
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
      let referees = candidates.eligibleReferees || [];
      // 过滤掉当前裁判（换派时当前裁判已被占用，不应出现在候选列表中）
      const currentArticle = reassignBtn.closest(".match");
      const currentMatchId = currentArticle?.dataset.matchId;
      // 从 list 中查找对应比赛的裁判ID（通过 data-match-id 属性匹配）
      const currentMatchEl = list.querySelector(`.match[data-match-id="${currentMatchId}"]`);
      const assignmentPara = currentMatchEl?.querySelector(".assignment");
      // 解析 "裁判：XXX · 派单版本" 格式中的裁判ID
      const currentRefereeId = assignmentPara
        ? assignmentPara.textContent.replace("裁判：", "").split(" · ")[0].trim()
        : null;
      if (currentRefereeId) {
        referees = referees.filter(r => r.refereeId !== currentRefereeId);
      }
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
  if (event.target.matches(".inline-edit-form")) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const rawTime = formData.get("scheduledAt");
    api.editMatchArrangement(activeCompetitionId, event.target.dataset.matchId, {
      roundNum: Number(formData.get("roundNum")),
      court: formData.get("court"),
      scheduledAt: rawTime ? new Date(rawTime).toISOString() : "",
      p1: formData.get("p1"),
      p2: formData.get("p2"),
      p3: formData.get("p3"),
      p4: formData.get("p4")
    }).then(() => workflow.refresh()).catch((error) => view.error(error));
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
