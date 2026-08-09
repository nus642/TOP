const api = RefereeApi.createRefereeApi();
const list = document.querySelector("#matches");
const notice = document.querySelector("#notice");
const form = document.querySelector("#context-form");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function matchCard(match) {
  const team1 = escapeHtml(match.team1?.name || "Side one");
  const team2 = escapeHtml(match.team2?.name || "Side two");
  const score1 = match.score1 ?? "–";
  const score2 = match.score2 ?? "–";
  const actions = {
    assigned: `<button data-action="accept">Accept responsibility</button>`,
    playing: `<form class="score-form"><label>${team1}<input name="score1" type="number" min="0" required></label><label>${team2}<input name="score2" type="number" min="0" required></label><button>Record score</button></form>`,
    scored: `<button data-action="confirm" class="confirm">Confirm result</button>`,
    confirmed: `<p class="complete">Result confirmed with Match Operations</p>`
  }[match.status] || `<p class="muted">Awaiting Match Operations</p>`;

  return `<article class="match" data-match-id="${escapeHtml(match.id)}">
    <header><div><span class="eyebrow">Round ${escapeHtml(match.roundNum || "—")}</span><h2>${team1} <span>vs</span> ${team2}</h2></div><span class="status">${escapeHtml(match.status)}</span></header>
    <div class="meta"><span>⌖ ${escapeHtml(match.court || "Court pending")}</span><span>◷ ${match.scheduledAt ? escapeHtml(new Date(match.scheduledAt).toLocaleString()) : "Time pending"}</span></div>
    <div class="score"><strong>${score1}</strong><span>official score</span><strong>${score2}</strong></div>
    <div class="action">${actions}</div>
  </article>`;
}

const view = {
  loading() { notice.textContent = "Loading assignments…"; notice.className = "notice"; },
  busy(matchId) { notice.textContent = `Updating match ${matchId}…`; notice.className = "notice"; },
  error(message) { notice.textContent = message; notice.className = "notice error"; },
  matches(matches) {
    notice.textContent = `${matches.length} assigned match${matches.length === 1 ? "" : "es"}`;
    notice.className = "notice";
    list.innerHTML = matches.length ? matches.map(matchCard).join("") : `<div class="empty"><strong>You're all caught up.</strong><p>No matches are currently assigned.</p></div>`;
  }
};

const workflow = RefereeWorkflow.createRefereeWorkflow({ api, view });
form.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = new FormData(form);
  workflow.start({ tournamentId: values.get("tournamentId"), refereeId: values.get("refereeId") });
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
