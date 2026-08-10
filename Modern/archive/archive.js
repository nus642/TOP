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

  function label(value, fallback = "Not available") {
    if (value === null || value === undefined || value === "") return fallback;
    return String(value).replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function renderStandings(standings) {
    if (!standings.length) return '<div class="empty">No final standings have been published.</div>';
    return `<div class="table-wrap"><table><thead><tr><th>Place</th><th>Participant</th><th>Wins</th><th>Losses</th><th>Difference</th></tr></thead><tbody>${standings.map((standing, index) => `<tr>
      <td><span class="place">${index + 1}</span></td>
      <td>Participant ${escapeHtml(standing.participantId)}</td>
      <td>${escapeHtml(standing.wins)}</td><td>${escapeHtml(standing.losses)}</td>
      <td>${Number(standing.scoreDifference) > 0 ? "+" : ""}${escapeHtml(standing.scoreDifference)}</td>
    </tr>`).join("")}</tbody></table></div>`;
  }

  function renderResults(matches) {
    if (!matches.length) return '<div class="empty">No official results have been published.</div>';
    return `<div class="results">${matches.map((match) => `<article class="result-card">
      <div><p>Round ${escapeHtml(match.roundNumber ?? "—")}</p><h3>Match ${escapeHtml(match.matchId)}</h3></div>
      <div class="final-score"><span>${escapeHtml(match.score?.sideOne ?? "—")}</span><small>–</small><span>${escapeHtml(match.score?.sideTwo ?? "—")}</span></div>
      <span class="result-state">${escapeHtml(label(match.status, "Official"))}</span>
    </article>`).join("")}</div>`;
  }

  function renderArchive(data) {
    const standings = Array.isArray(data.standings) ? data.standings : [];
    const matches = Array.isArray(data.matches) ? data.matches : [];
    return {
      summary: `<p class="archive-number">Competition ${escapeHtml(data.competitionId)}</p><span class="completion-state">${escapeHtml(label(data.competitionStatus, "Completed"))}</span>`,
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
