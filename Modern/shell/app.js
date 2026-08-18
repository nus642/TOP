const accountability = document.querySelector("#accountability");
const competition = document.querySelector("#competition-id");
const workspaceLinks = document.querySelector("#workspace-links");
const status = document.querySelector("#status");
const content = document.querySelector("#authenticated-content");
const experienceTitle = document.querySelector("#experience-title");
const experienceSummary = document.querySelector("#experience-summary");

const view = {
  loading() { status.textContent = "正在确认登录身份…"; },
  ready(context) {
    accountability.innerHTML = AccountabilityVisibility.render(AccountabilityVisibility.browser.current());
    experienceTitle.textContent = context.experience.title;
    experienceSummary.textContent = context.experience.summary;
    competition.value = context.competitionId;
    workspaceLinks.innerHTML = context.workspaces.map(({ workspace, label, href }) =>
      `<a class="action${workspace === context.experience.workspace ? " current" : ""}" href="${href}">${label}${workspace === context.experience.workspace ? "<small>根据您的职责推荐</small>" : ""}</a>`
    ).join("");
    status.textContent = "已登录，身份确认完成";
    content.hidden = false;
  },
  error(message) {
    status.textContent = UiText.userFacingError(message);
    status.classList.add("error");
    content.hidden = true;
  }
};

const shell = OperatorShell.createOperatorShell({ fetchImpl: fetch, storage: localStorage, view });
competition.addEventListener("input", () => shell.selectCompetition(competition.value));

// Development bootstrap login entry: shown only when no authenticated session
// exists. Referees are routed to the roster-based identity entry on the
// referee workspace; master and participant identities are established
// directly via the development-only foundation-establish boundary.
const loginEntry = (() => {
  const entry = document.querySelector("#login-entry");
  const form = document.querySelector("#login-form");
  const loginStatus = document.querySelector("#login-status");
  const actorTypeSelect = form.elements.actorType;
  const actorInput = form.elements.actorId;
  const competitionInput = form.elements.competitionId;

  function presetCompetition() {
    const query = new URLSearchParams(window.location.search).get("competitionId");
    return query || localStorage.getItem(ResponsibilityContext.COMPETITION_KEY) || "";
  }

  function setLoginStatus(message, isError = false) {
    loginStatus.textContent = message;
    loginStatus.className = isError ? "status error" : "hint";
  }

  function syncActorField() {
    const isReferee = actorTypeSelect.value === "referee";
    actorInput.required = !isReferee;
    actorInput.disabled = isReferee;
    actorInput.value = "";
    actorInput.placeholder = isReferee ? "裁判员在裁判工作台从花名册选择本人姓名" : "例如：master-1";
  }

  actorTypeSelect.addEventListener("change", syncActorField);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const actorType = actorTypeSelect.value;
    const competitionId = competitionInput.value.trim();
    if (actorType === "referee") {
      window.location.href = competitionId
        ? `/operator/?competitionId=${encodeURIComponent(competitionId)}`
        : "/operator/";
      return;
    }
    const actorId = actorInput.value.trim();
    if (!actorId) { setLoginStatus("请输入姓名 / 编号。", true); return; }
    setLoginStatus("正在建立登录身份…");
    try {
      const response = await fetch("/api/session/foundation-establish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorType, actorId })
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "身份建立失败");
      if (competitionId) localStorage.setItem(ResponsibilityContext.COMPETITION_KEY, competitionId);
      window.location.reload();
    } catch (error) {
      setLoginStatus(UiText.userFacingError(error), true);
    }
  });

  return {
    show() {
      competitionInput.value = presetCompetition();
      syncActorField();
      entry.hidden = false;
    }
  };
})();

shell.hydrate().catch(() => loginEntry.show());
