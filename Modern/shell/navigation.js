(function mountOperatorNavigation() {
  const host = document.querySelector("#operator-navigation");
  if (!host) return;
  const page = document.querySelector("[data-authenticated-workspace]");
  const params = new URLSearchParams(window.location.search);
  const queryCompetition = params.get("competitionId");
  if (queryCompetition !== null) localStorage.setItem(OperatorShell.COMPETITION_KEY, queryCompetition);

  const view = {
    loading() {
      host.innerHTML = '<span class="operator-nav-status">正在确认登录身份…</span>';
      if (page) page.hidden = true;
    },
    ready(context) {
      const accountability = AccountabilityVisibility.browser.current();
      host.innerHTML = `<a class="operator-nav-brand" href="/shell/">TOP</a>
        <div class="operator-nav-links">${context.workspaces.map(({ workspace, label, href }) =>
          `<a data-workspace="${workspace}"${workspace === context.experience.workspace ? ' class="recommended"' : ""} href="${href}">${label}</a>`).join("")}</div>
        ${AccountabilityVisibility.render(accountability)}`;
      if (page) page.hidden = false;
      const competitionInput = document.querySelector('[name="competitionId"], [name="tournamentId"]');
      if (competitionInput && context.competitionId) competitionInput.value = context.competitionId;
    },
    error(message) {
      host.innerHTML = `<span class="operator-nav-error">${escapeText(message)}</span>`;
      if (page) page.hidden = true;
    }
  };

  function escapeText(value) {
    return String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  }

  const shell = OperatorShell.createOperatorShell({ fetchImpl: fetch, storage: localStorage, view });
  document.addEventListener("input", event => {
    if (event.target.matches('[name="competitionId"], [name="tournamentId"]')) shell.selectCompetition(event.target.value);
  });
  shell.hydrate().catch(() => {});
})();
