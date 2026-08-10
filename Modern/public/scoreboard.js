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

  function label(value, fallback) {
    if (value === null || value === undefined || value === "") return fallback;
    return String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function scheduledTime(value) {
    if (!value) return "Time TBA";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString([], {
      weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
    });
  }

  function scoreValue(value) {
    return value === null || value === undefined ? "–" : escapeHtml(value);
  }

  function renderMatch(match) {
    return `<article class="match-card">
      <header class="match-header">
        <div><span class="eyebrow">Round ${escapeHtml(match.roundNumber ?? "—")}</span><h2>Match ${escapeHtml(match.matchId)}</h2></div>
        <span class="status status-${escapeHtml(match.status || "unknown")}">${escapeHtml(label(match.status, "Status pending"))}</span>
      </header>
      <dl class="match-details">
        <div><dt>Court</dt><dd>${escapeHtml(label(match.courtId, "TBA"))}</dd></div>
        <div><dt>Scheduled</dt><dd>${escapeHtml(scheduledTime(match.scheduledAt))}</dd></div>
      </dl>
      <div class="score" aria-label="Score ${escapeHtml(match.score?.sideOne)} to ${escapeHtml(match.score?.sideTwo)}">
        <span>${scoreValue(match.score?.sideOne)}</span><small>—</small><span>${scoreValue(match.score?.sideTwo)}</span>
      </div>
      <p class="confirmation ${match.confirmed ? "confirmed" : "pending"}">
        <span aria-hidden="true">${match.confirmed ? "✓" : "○"}</span>
        ${match.confirmed ? "Result confirmed" : "Awaiting confirmation"}
      </p>
    </article>`;
  }

  function renderScoreboard(scoreboard) {
    const matches = Array.isArray(scoreboard.matches) ? scoreboard.matches : [];
    if (!matches.length) return '<div class="empty"><strong>No matches to show yet.</strong><p>Check back when the schedule is ready.</p></div>';
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
