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
shell.hydrate().catch(() => {});
