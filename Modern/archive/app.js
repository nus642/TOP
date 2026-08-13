const api = CompetitionArchiveApi.createCompetitionArchiveApi();
const form = document.querySelector("#archive-form");
const input = document.querySelector("#competition-id");
const notice = document.querySelector("#notice");
const content = document.querySelector("#archive-content");

const view = {
  loading(competitionId) {
    notice.textContent = `正在打开比赛 ${competitionId}…`;
    notice.className = "notice";
    content.setAttribute("aria-busy", "true");
  },
  error(message) {
    notice.textContent = message;
    notice.className = "notice error";
    content.removeAttribute("aria-busy");
  },
  archive(data) {
    const rendered = CompetitionArchive.renderArchive(data);
    document.querySelector("#archive-summary").innerHTML = rendered.summary;
    document.querySelector("#standings").innerHTML = rendered.standings;
    document.querySelector("#results").innerHTML = rendered.results;
    notice.textContent = "官方赛事记录";
    notice.className = "notice";
    content.hidden = false;
    content.removeAttribute("aria-busy");
  }
};

const workflow = CompetitionArchive.createArchiveWorkflow({ api, view });

function load(competitionId) {
  if (!competitionId) return;
  input.value = competitionId;
  const url = new URL(window.location.href);
  url.searchParams.set("competitionId", competitionId);
  history.replaceState(null, "", url);
  workflow.load(competitionId);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  load(new FormData(form).get("competitionId"));
});

load(new URLSearchParams(window.location.search).get("competitionId"));
