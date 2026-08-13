(function expose(factory) {
  const scoreboard = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = scoreboard;
  if (typeof window !== "undefined") window.PublicScoreboard = scoreboard;
})(function createModule() {
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[character]);
  }

  const statusLabels = Object.freeze({ idle: "等待中", upcoming: "即将开始", assigned: "已分配", accepted: "已接受", playing: "比赛中", scored: "已录入比分", confirmed: "已确认" });

  function label(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback;
    return statusLabels[value] || fallback;
  }

  function scheduledTime(value) {
    if (!value) return "时间待定";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("zh-CN", {
      weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    });
  }

  function courtLabel(value) {
    if (value === null || value === undefined || value === "") return "待定";
    const match = String(value).match(/^court[-_ ](.+)$/i);
    return match ? `场地 ${match[1]}` : String(value);
  }

  function scoreValue(value) {
    return value === null || value === undefined ? "–" : escapeHtml(value);
  }

  function renderMatch(match) {
    const status = Object.hasOwn(statusLabels, match.status) ? match.status : "unknown";
    return `<article class="match-card">
      <header class="match-header">
        <div><span class="eyebrow">第 ${escapeHtml(match.roundNumber ?? "—")} 轮</span><h2>比赛 ${escapeHtml(match.matchId)}</h2></div>
        <span class="status status-${status}">${escapeHtml(label(match.status, "状态待定"))}</span>
      </header>
      <dl class="match-details">
        <div><dt>场地</dt><dd>${escapeHtml(courtLabel(match.courtId))}</dd></div>
        <div><dt>计划时间</dt><dd>${escapeHtml(scheduledTime(match.scheduledAt))}</dd></div>
      </dl>
      <div class="score" aria-label="比分 ${escapeHtml(match.score?.sideOne)} 比 ${escapeHtml(match.score?.sideTwo)}">
        <span>${scoreValue(match.score?.sideOne)}</span><small>—</small><span>${scoreValue(match.score?.sideTwo)}</span>
      </div>
      <p class="confirmation ${match.confirmed ? "confirmed" : "pending"}">
        <span aria-hidden="true">${match.confirmed ? "✓" : "○"}</span>
        ${match.confirmed ? "赛果已确认" : "等待确认"}
      </p>
    </article>`;
  }

  function renderScoreboard(scoreboard) {
    const matches = Array.isArray(scoreboard.matches) ? scoreboard.matches : [];
    if (!matches.length) return '<div class="empty"><strong>暂无比赛。</strong><p>赛程发布后请再来查看。</p></div>';
    return matches.map(renderMatch).join("");
  }

  function createScoreboardWorkflow({ api, view }) {
    return {
      async load(competitionId) {
        view.loading(competitionId);
        try {
          view.scoreboard(await api.matches(competitionId));
        } catch (error) {
          view.error(error.message);
        }
      }
    };
  }

  return { createScoreboardWorkflow, renderScoreboard };
});
