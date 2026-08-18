const api = RefereeApi.createRefereeApi({ accountabilityContext: AccountabilityContext.browser });
const list = document.querySelector("#matches");
const notice = document.querySelector("#notice");
const form = document.querySelector("#context-form");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

// M2 Referee Match Operation Experience (ED-05/ED-06): client-side rally
// scoring sessions. State lives here (plus a localStorage backup); only score
// snapshots travel to the backend.
const scoringSessions = new Map();
let currentMatches = [];
// Dedicated full-screen match view state (Legacy-style three-step flow).
let engagedMatchId = null;
let switchCountdown = null;

function scoringSession(match) {
  const key = String(match.id);
  let session = scoringSessions.get(key);
  if (session) return session;
  const backup = RefereeScoring.createBackup({
    storage: window.localStorage,
    key: `top-referee-scoring:${key}`
  });
  const restored = backup.load();
  const t1Players = match.team1?.players || [];
  const t2Players = match.team2?.players || [];
  const scoring = RefereeScoring.createRallyScoring({
    restore: restored,
    format: match.format,
    teams: {
      team1: match.team1?.name,
      team2: match.team2?.name,
      // players[0] starts in the right court (initial server at score 0).
      team1Right: t1Players[0]?.name,
      team1Left: t1Players[1]?.name || t1Players[0]?.name,
      team2Right: t2Players[0]?.name,
      team2Left: t2Players[1]?.name || t2Players[0]?.name
    },
    doubles: t1Players.length > 1 || t2Players.length > 1
  });
  session = { scoring, backup, sideSwitchNotice: false };
  scoringSessions.set(key, session);
  return session;
}

function releaseSession(matchId) {
  const session = scoringSessions.get(String(matchId));
  if (session) session.backup.clear();
  scoringSessions.delete(String(matchId));
}

function persistAndSnapshot(match, session) {
  session.backup.save(session.scoring.state());
  const context = workflow.getContext();
  if (!context) return;
  const state = session.scoring.state();
  api.scoreSnapshot(context.tournamentId, context.refereeId, match.id, {
    score1: state.t1Score, score2: state.t2Score
  }).catch(() => { /* snapshots are best-effort; local state stays authoritative */ });
}

function timelineDots(timeline) {
  const recent = timeline.slice(-40);
  if (!recent.length) return `<span class="muted">尚未开始计分</span>`;
  return recent.map((team) => `<span class="dot dot-t${team}"></span>`).join("");
}

function formatCountdown(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function clearSideSwitchCountdown(rerender = false) {
  if (switchCountdown?.interval) clearInterval(switchCountdown.interval);
  const matchId = switchCountdown?.matchId;
  switchCountdown = null;
  if (rerender && matchId != null && String(engagedMatchId) === String(matchId)) {
    const match = currentMatches.find((m) => String(m.id) === String(matchId));
    if (match) renderMatchView(match);
  }
}

// Legacy L1052 mirrors a 60s break while teams change ends at half score.
function startSideSwitchCountdown(matchId) {
  clearSideSwitchCountdown();
  let remaining = 60;
  switchCountdown = { matchId, remaining, interval: null };
  switchCountdown.interval = setInterval(() => {
    remaining -= 1;
    if (switchCountdown) switchCountdown.remaining = remaining;
    const badge = document.querySelector("#switch-countdown");
    if (badge) badge.textContent = formatCountdown(Math.max(remaining, 0));
    if (remaining <= 0) clearSideSwitchCountdown(true);
  }, 1000);
}

// Four-quadrant on-court position view (mirrors Legacy slotTL/BL/TR/BR). The
// screen side a team occupies flips with viewSwapped, and the serving player's
// slot is highlighted.
function courtQuadrant(match, session) {
  const layout = session.scoring.courtLayout();
  const leftTeam = layout.viewSwapped ? 2 : 1;
  const rightTeam = layout.viewSwapped ? 1 : 2;

  const sideHtml = (teamNum) => {
    const team = teamNum === 1 ? match.team1 : match.team2;
    const teamName = escapeHtml(team?.name || (teamNum === 1 ? "一方" : "另一方"));
    const players = team?.players || [];
    const isDoubles = players.length > 1;
    const side = teamNum === 1 ? layout.t1 : layout.t2;
    const isServingSide = layout.servingTeam === teamNum;
    const slot = (playerName, courtKey) => {
      const serving = isServingSide && layout.servingPlayer === playerName;
      return `<div class="court-slot${serving ? " slot-serving" : ""}"><span class="slot-player">${escapeHtml(playerName || "—")}</span><span class="slot-court">${courtKey === "right" ? "右区" : "左区"}</span></div>`;
    };
    return `<div class="court-side">
      <div class="court-team">${teamName}${isServingSide ? " · 发球" : ""}</div>
      <div class="court-slots">
        ${isDoubles ? slot(side.left, "left") + slot(side.right, "right") : slot(side.right, "right")}
      </div>
    </div>`;
  };

  return `<div class="court-board" aria-label="场地站位">
    ${sideHtml(leftTeam)}
    <div class="court-net"><span>球网</span></div>
    ${sideHtml(rightTeam)}
  </div>`;
}

function playersLine(team) {
  const names = (team?.players || []).map((p) => escapeHtml(p.name)).filter(Boolean);
  return names.length ? names.join("、") : escapeHtml(team?.name || "—");
}

// Step 1: pre-match confirmation (backend-authoritative format, read-only).
function renderSetupStep(match) {
  const format = match.format || {};
  const doubles = (match.team1?.players?.length || 0) > 1 || (match.team2?.players?.length || 0) > 1;
  const capLabel = format.capScore > 0 ? `封顶 ${format.capScore}` : "无封顶";
  return `<div class="setup-card">
    <span class="eyebrow">步骤 1 · 确认比赛信息</span>
    <dl class="setup-info">
      <div><dt>对阵</dt><dd>${escapeHtml(match.team1?.name || "一方")} 对 ${escapeHtml(match.team2?.name || "另一方")}</dd></div>
      <div><dt>${escapeHtml(match.team1?.name || "一方")}</dt><dd>${playersLine(match.team1)}</dd></div>
      <div><dt>${escapeHtml(match.team2?.name || "另一方")}</dt><dd>${playersLine(match.team2)}</dd></div>
      <div><dt>场地 / 轮次</dt><dd>${escapeHtml(match.court || "场地待定")} · 第 ${escapeHtml(match.roundNumber || "—")} 轮</dd></div>
      <div><dt>赛制</dt><dd>目标 ${format.targetScore ?? 21} 分 · ${capLabel} · ${doubles ? "双打" : "单打"}</dd></div>
    </dl>
    <p class="muted">赛制由主控下发，确认无误后开始比赛。</p>
    <button data-action="start" class="primary">开始比赛</button>
  </div>`;
}

// Step 3: final result confirmation and submission.
function renderConfirmStep(match, session) {
  const state = session.scoring.state();
  const final = session.scoring.finalScore();
  const team1 = escapeHtml(match.team1?.name || "一方");
  const team2 = escapeHtml(match.team2?.name || "另一方");
  return `<div class="confirm-card">
    <span class="eyebrow">步骤 3 · 确认比赛结果</span>
    <p class="complete">比赛结束，局分 ${state.t1Wins} - ${state.t2Wins}${state.results.length ? `（${state.results.map(escapeHtml).join("、")}）` : ""}</p>
    <form class="score-form"><label>${team1}<input name="score1" type="number" min="0" required value="${final.score1}"></label><label>${team2}<input name="score2" type="number" min="0" required value="${final.score2}"></label><button class="primary">录入比分并结束执行</button></form>
  </div>`;
}

// Step 2: live scoring with the four-quadrant court view.
function renderPlayingStep(match, session) {
  if (["constrained", "uncertain"].includes(match.courtCondition)) {
    return `<p class="notice error">场地${match.courtCondition === "constrained" ? "受限" : "状态待确认"}，请明确中断比赛。</p><button data-action="interrupt">中断比赛</button>`;
  }
  const scoring = session.scoring;
  const state = scoring.state();
  const team1 = escapeHtml(match.team1?.name || "一方");
  const team2 = escapeHtml(match.team2?.name || "另一方");
  const serving = scoring.servingInfo();
  const servingName = serving.team === 1 ? team1 : team2;
  const bestOfThree = state.match.gameFormat !== 1;
  const capLabel = state.match.capScore > 0 ? `封顶 ${state.match.capScore}` : "无封顶";
  const leftTeam = state.viewSwapped ? 2 : 1;
  const rightTeam = state.viewSwapped ? 1 : 2;

  const countdownBadge = switchCountdown && String(switchCountdown.matchId) === String(match.id)
    ? `<div class="switch-countdown">🔄 半场换边休整 <strong id="switch-countdown">${formatCountdown(switchCountdown.remaining)}</strong></div>` : "";
  const sideSwitchNotice = session.sideSwitchNotice
    ? `<p class="notice error" role="alert">🔄 换边提醒：一方已达 ${Math.ceil(state.match.targetScore / 2)} 分，请指挥双方交换场地。</p>` : "";

  const sideControls = (team) => {
    const name = team === 1 ? team1 : team2;
    const timeoutUsed = state.timeouts[team === 1 ? "t1" : "t2"] >= 1;
    const medicalUsed = state.timeouts[team === 1 ? "medicalT1" : "medicalT2"] >= 1;
    const disabled = state.gameEnded || state.matchEnded;
    return `<div class="scoring-side">
      <span class="side-name">${name}</span>
      <strong class="side-score">${team === 1 ? state.t1Score : state.t2Score}</strong>
      <button data-scoring-action="award" data-team="${team}" ${disabled ? "disabled" : ""}>+1 ${name}</button>
      <div class="side-tools">
        <button data-scoring-action="timeout" data-team="${team}" ${disabled || timeoutUsed ? "disabled" : ""}>${timeoutUsed ? "暂停已用" : "暂停"}</button>
        <button data-scoring-action="medical" data-team="${team}" ${disabled || medicalUsed ? "disabled" : ""}>${medicalUsed ? "伤停已用" : "医疗伤停"}</button>
      </div>
    </div>`;
  };

  let endControls = "";
  if (state.gameEnded && !state.matchEnded) {
    endControls = `<button data-scoring-action="end-game" class="primary">确认本局结果${bestOfThree ? "，进入下一局" : ""}</button>`;
  }

  return `<div class="scoring-panel">
    <div class="scoring-meta"><span>第 ${state.currentGame} 局${bestOfThree ? ` · 三局两胜 ${state.t1Wins}-${state.t2Wins}` : ""}</span><span>目标 ${state.match.targetScore} 分 · ${capLabel}</span></div>
    ${countdownBadge}
    ${sideSwitchNotice}
    <div class="scoring-board">
      ${sideControls(leftTeam)}
      <div class="serve-info"><span class="eyebrow">发球</span><strong>${servingName}</strong><span>${escapeHtml(serving.player)} · ${serving.court === "right" ? "右区" : "左区"}</span></div>
      ${sideControls(rightTeam)}
    </div>
    ${courtQuadrant(match, session)}
    <div class="timeline" aria-label="得分轨迹">${timelineDots(state.timeline)}</div>
    <div class="scoring-actions">
      <button data-scoring-action="undo">撤回上一分</button>
      <button data-scoring-action="toggle-view">🔄 视角互换</button>
      ${endControls}
    </div>
  </div>`;
}

// Dedicated full-screen match view: renders the step matching the match status.
function renderMatchView(match) {
  const viewEl = document.querySelector("#match-view");
  if (!viewEl) return;
  let body;
  let stepLabel;
  if (match.status === "accepted") {
    stepLabel = "确认信息";
    body = renderSetupStep(match);
  } else if (match.status === "playing") {
    const session = scoringSession(match);
    if (session.scoring.isMatchEnded()) {
      stepLabel = "确认结果";
      body = renderConfirmStep(match, session);
    } else {
      stepLabel = "执裁中";
      body = renderPlayingStep(match, session);
    }
  } else if (match.status === "interrupted") {
    stepLabel = "已中断";
    body = match.courtCondition === "available"
      ? `<p class="complete">场地已由主控报告恢复，请明确恢复比赛。</p><button data-action="resume">恢复比赛</button>`
      : `<p class="muted">比赛已中断，等待主控报告场地恢复。</p>`;
  } else {
    stepLabel = UiText.statusLabel(match.status);
    body = `<p class="muted">${escapeHtml(UiText.statusLabel(match.status))}</p>`;
  }
  const team1 = escapeHtml(match.team1?.name || "一方");
  const team2 = escapeHtml(match.team2?.name || "另一方");
  viewEl.innerHTML = `<div class="match-view-inner" data-match-id="${escapeHtml(match.id)}" data-dispatch-version="${match.dispatchVersion ?? 0}">
    <div class="match-view-header">
      <button data-action="close-view" class="back-btn">← 返回任务列表</button>
      <div class="match-view-title"><h2>${team1} <span>对</span> ${team2}</h2><span class="step-badge">${escapeHtml(stepLabel)}</span></div>
    </div>
    ${body}
  </div>`;
}

function renderList() {
  list.innerHTML = currentMatches.length
    ? currentMatches.map(matchCard).join("")
    : `<div class="empty"><strong>当前任务已全部处理。</strong><p>目前没有已分配的比赛。</p></div>`;
}

function openMatchView(matchId) {
  engagedMatchId = matchId;
  list.hidden = true;
  const viewEl = document.querySelector("#match-view");
  if (viewEl) viewEl.hidden = false;
  const match = currentMatches.find((m) => String(m.id) === String(matchId));
  if (match) renderMatchView(match);
}

function closeMatchView() {
  clearSideSwitchCountdown();
  engagedMatchId = null;
  const viewEl = document.querySelector("#match-view");
  if (viewEl) { viewEl.hidden = true; viewEl.innerHTML = ""; }
  list.hidden = false;
  renderList();
}

function matchCard(match) {
  const team1 = escapeHtml(match.team1?.name || "一方");
  const team2 = escapeHtml(match.team2?.name || "另一方");
  const score1 = match.score1 ?? "–";
  const score2 = match.score2 ?? "–";
  const playingAction = ["constrained", "uncertain"].includes(match.courtCondition)
    ? `<p class="notice error">场地${match.courtCondition === "constrained" ? "受限" : "状态待确认"}，请明确中断比赛。</p><button data-action="interrupt">中断比赛</button>`
    : `<button data-action="open-view">继续执裁</button>`;
  const interruptedAction = match.courtCondition === "available"
    ? `<p class="complete">场地已由主控报告恢复，请明确恢复比赛。</p><button data-action="resume">恢复比赛</button>`
    : `<p class="muted">比赛已中断，等待主控报告场地恢复。</p>`;
  const actions = {
    assigned: `<button data-action="accept">接受执裁任务</button>`,
    accepted: `<button data-action="open-view">进入执裁</button>`,
    playing: playingAction,
    interrupted: interruptedAction,
    scored: `<p class="muted">赛果已提交，等待主控确认</p>`,
    confirmed: `<p class="complete">赛果已由比赛操作确认</p>`
  }[match.status] || `<p class="muted">等待比赛操作</p>`;

  return `<article class="match" data-match-id="${escapeHtml(match.id)}" data-dispatch-version="${match.dispatchVersion ?? 0}">
    <header><div><span class="eyebrow">第 ${escapeHtml(match.roundNumber || "—")} 轮</span><h2>${team1} <span>对</span> ${team2}</h2></div><span class="status">${escapeHtml(UiText.statusLabel(match.status))}</span></header>
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
    currentMatches = matches;
    notice.textContent = `已加载 ${matches.length} 场已分配比赛。`;
    notice.className = "notice";
    // Matches that left play release their local scoring backup.
    for (const [matchId] of scoringSessions) {
      if (!matches.some((match) => String(match.id) === matchId && match.status === "playing")) releaseSession(matchId);
    }
    // If a dedicated match view is engaged, keep it in focus across refreshes.
    const engaged = engagedMatchId != null
      ? matches.find((match) => String(match.id) === String(engagedMatchId))
      : null;
    if (engaged && ["accepted", "playing", "interrupted"].includes(engaged.status)) {
      renderMatchView(engaged);
      return;
    }
    if (engagedMatchId != null) closeMatchView();
    renderList();
  }
};

const workflow = RefereeWorkflow.createRefereeWorkflow({ api, view, accountabilityFlow: WorkflowAccountability.browser });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await workflow.start(ResponsibilityContext.browser.current());
  } catch (error) { view.error(error.message); }
});
// Scoring interactions now live in the dedicated match view.
function runScoringAction(matchId, action, team) {
  const session = scoringSessions.get(matchId);
  if (!session) return;
  let result = null;
  if (action === "award") result = session.scoring.award(team);
  if (action === "undo") {
    if (!session.scoring.undo()) { view.error("没有可撤回的判罚记录"); return; }
    session.sideSwitchNotice = false;
  }
  if (action === "timeout") result = session.scoring.requestTimeout(team);
  if (action === "medical") result = session.scoring.requestMedical(team);
  if (action === "end-game") {
    session.scoring.endGame();
    session.sideSwitchNotice = false;
  }
  if (action === "toggle-view") session.scoring.toggleView();
  if (result?.rejected === "ended") { view.error("本局比赛已结束，无法继续计分"); return; }
  if (result && result.ok === false && result.reason === "quota") { view.error("该队额度已用尽"); return; }
  if (result?.sideSwitch) { session.sideSwitchNotice = true; startSideSwitchCountdown(matchId); }
  if (result?.gameWon) notice.textContent = "本局比赛已结束，请确认结果。", notice.className = "notice";
  const matchData = currentMatches.find((match) => String(match.id) === matchId);
  if (matchData) {
    renderMatchView(matchData);
    persistAndSnapshot(matchData, session);
  }
}

list.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const matchEl = button.closest(".match");
  const matchId = matchEl.dataset.matchId;
  if (button.dataset.action === "open-view") { openMatchView(matchId); return; }
  workflow.run({
    type: button.dataset.action,
    matchId,
    dispatchVersion: Number(matchEl.dataset.dispatchVersion || 0)
  });
});

const matchView = document.querySelector("#match-view");
matchView.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button) {
    const inner = button.closest(".match-view-inner");
    if (button.dataset.action === "close-view") { closeMatchView(); return; }
    workflow.run({
      type: button.dataset.action,
      matchId: inner?.dataset.matchId,
      dispatchVersion: Number(inner?.dataset.dispatchVersion || 0)
    });
    return;
  }
  const scoringButton = event.target.closest("button[data-scoring-action]");
  if (!scoringButton) return;
  const inner = scoringButton.closest(".match-view-inner");
  runScoringAction(inner?.dataset.matchId, scoringButton.dataset.scoringAction, Number(scoringButton.dataset.team));
});
matchView.addEventListener("submit", (event) => {
  if (!event.target.matches(".score-form")) return;
  event.preventDefault();
  const values = new FormData(event.target);
  const matchId = event.target.closest(".match-view-inner").dataset.matchId;
  releaseSession(matchId);
  workflow.run({ type: "score", matchId,
    score: { score1: Number(values.get("score1")), score2: Number(values.get("score2")) } });
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
