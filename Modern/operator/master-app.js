const api = MasterApi.createMasterApi();
const list = document.querySelector("#matches");
const notice = document.querySelector("#notice");
const contextForm = document.querySelector("#context-form");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

function matchCard(match) {
  const schedule = match.schedule || {};
  const referee = match.referee || {};
  const team1 = escapeHtml(match.sides?.one || "Side one");
  const team2 = escapeHtml(match.sides?.two || "Side two");

  return `<article class="match" data-match-id="${escapeHtml(match.matchId)}">
    <header><div><span class="eyebrow">Round ${escapeHtml(match.roundNumber || "—")}</span><h2>${team1} <span>vs</span> ${team2}</h2></div><span class="status">${escapeHtml(match.operationStatus)}</span></header>
    <div class="meta"><span>⌖ ${escapeHtml(schedule.courtId || "Court pending")}</span><span>◷ ${schedule.scheduledAt ? escapeHtml(new Date(schedule.scheduledAt).toLocaleString()) : "Time pending"}</span></div>
    <p class="assignment">Assigned referee: <strong>${escapeHtml(referee.refereeId || "Unassigned")}</strong></p>
    <form class="assignment-form"><label>Referee ID<input name="refereeId" value="${escapeHtml(referee.refereeId || "")}" required></label><button>Assign referee</button></form>
  </article>`;
}

const view = {
  loading() {
    notice.textContent = "Refreshing operational state…";
    notice.className = "notice";
  },
  busy(matchId) {
    notice.textContent = `Assigning referee for match ${matchId}…`;
    notice.className = "notice";
  },
  error(message) {
    notice.textContent = message;
    notice.className = "notice error";
  },
  matches(matches) {
    notice.textContent = `${matches.length} operational match${matches.length === 1 ? "" : "es"}`;
    notice.className = "notice";
    list.innerHTML = matches.length
      ? matches.map(matchCard).join("")
      : `<div class="empty"><strong>No matches found.</strong><p>Match Operations has no matches in this competition.</p></div>`;
  }
};

const workflow = MasterWorkflow.createMasterWorkflow({ api, view, identityContext: IdentityContext });
contextForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const values = new FormData(contextForm);
  try {
    IdentityContext.setCurrentIdentityContext({
      actorId: values.get("masterId"),
      actorType: "master",
      competitionId: values.get("competitionId")
    });
    workflow.start();
  } catch (error) { view.error(error.message); }
});
list.addEventListener("submit", (event) => {
  if (!event.target.matches(".assignment-form")) return;
  event.preventDefault();
  workflow.assign({
    matchId: event.target.closest(".match").dataset.matchId,
    refereeId: new FormData(event.target).get("refereeId")
  });
});
