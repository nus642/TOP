const api = ParticipantReadinessApi.createParticipantReadinessApi();
const contextForm = document.querySelector("#context-form");
const readinessPanel = document.querySelector("#readiness");
const notice = document.querySelector("#notice");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
}

const view = {
  loading() {
    notice.textContent = "Refreshing your readiness…";
    notice.className = "notice";
  },
  busy() {
    notice.textContent = "Checking you in…";
    notice.className = "notice";
  },
  error(message) {
    notice.textContent = message;
    notice.className = "notice error";
  },
  readiness(readiness) {
    const isReady = readiness.state === "ready";
    notice.textContent = "Readiness status received from tournament operations.";
    notice.className = "notice";
    readinessPanel.innerHTML = `<article class="readiness-card ${isReady ? "ready" : "pending"}">
      <span class="status">${isReady ? "Ready" : "Not checked in"}</span>
      <h2>${isReady ? "You're ready to play." : "Check in when you arrive."}</h2>
      <p>Participant ${escapeHtml(readiness.participantId)} · Competition ${escapeHtml(readiness.competitionId)}</p>
      ${readiness.checkedInAt ? `<p class="timestamp">Checked in ${escapeHtml(new Date(readiness.checkedInAt).toLocaleString())}</p>` : ""}
      ${isReady ? '<p class="complete">Your check-in is confirmed by tournament operations.</p>' : '<button id="check-in" type="button">Check in</button>'}
    </article>`;
  }
};

const workflow = ParticipantReadinessWorkflow.createParticipantReadinessWorkflow({ api, view, identityContext: IdentityContext });

contextForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(contextForm);
  try {
    IdentityContext.setCurrentIdentityContext({
      actorId: form.get("participantId"),
      actorType: "participant",
      competitionId: form.get("competitionId")
    });
    workflow.start();
  } catch (error) { view.error(error.message); }
});

readinessPanel.addEventListener("click", (event) => {
  if (event.target.matches("#check-in")) workflow.checkIn();
});
