(function expose(factory) {
  const archive = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = archive;
  if (typeof window !== "undefined") window.CompetitionArchive = archive;
})(function createModule() {
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    })[character]);
  }

  const statusLabels = Object.freeze({ completed: "已结束", confirmed: "已确认" });

  function label(value, fallback = "暂无信息") {
    if (value === null || value === undefined || value === "") return fallback;
    return statusLabels[value] || String(value);
  }

  function renderStandings(standings) {
    if (!standings.length) return '<div class="empty">尚未发布最终排名。</div>';
    return `<div class="table-wrap"><table><thead><tr><th>名次</th><th>选手</th><th>胜</th><th>负</th><th>净胜分</th></tr></thead><tbody>${standings.map((standing, index) => `<tr>
      <td><span class="place">${index + 1}</span></td>
      <td>选手 ${escapeHtml(standing.participantId)}</td>
      <td>${escapeHtml(standing.wins)}</td><td>${escapeHtml(standing.losses)}</td>
      <td>${Number(standing.scoreDifference) > 0 ? "+" : ""}${escapeHtml(standing.scoreDifference)}</td>
    </tr>`).join("")}</tbody></table></div>`;
  }

  function renderResults(matches) {
    if (!matches.length) return '<div class="empty">尚未发布官方赛果。</div>';
    return `<div class="results">${matches.map((match) => `<article class="result-card">
      <div><p>第 ${escapeHtml(match.roundNumber ?? "—")} 轮</p><h3>比赛 ${escapeHtml(match.matchId)}</h3></div>
      <div class="final-score"><span>${escapeHtml(match.score?.sideOne ?? "—")}</span><small>–</small><span>${escapeHtml(match.score?.sideTwo ?? "—")}</span></div>
      <span class="result-state">${escapeHtml(label(match.status, "正式记录"))}</span>
    </article>`).join("")}</div>`;
  }

  function renderArchive(data) {
    const standings = Array.isArray(data.standings) ? data.standings : [];
    const matches = Array.isArray(data.matches) ? data.matches : [];
    return {
      summary: `<p class="archive-number">比赛 ${escapeHtml(data.competitionId)}</p><span class="completion-state">${escapeHtml(label(data.competitionStatus, "已结束"))}</span>`,
      standings: renderStandings(standings),
      results: renderResults(matches)
    };
  }

  function createArchiveWorkflow({ api, view }) {
    return {
      async load(competitionId) {
        view.loading(competitionId);
        try {
          view.archive(await api.archive(competitionId));
        } catch (error) {
          view.error(error.message);
        }
      }
    };
  }

  return { createArchiveWorkflow, renderArchive };
});
