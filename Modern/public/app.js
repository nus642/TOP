const api = PublicScoreboardApi.createPublicScoreboardApi();
const form = document.querySelector("#competition-form");
const competitionInput = document.querySelector("#competition-id");
const competitionLabel = document.querySelector("#competition-label");
const notice = document.querySelector("#notice");
const matches = document.querySelector("#matches");

const view = {
  loading(competitionId) {
    competitionLabel.textContent = `比赛 ${competitionId}`;
    notice.textContent = "正在加载最新比赛信息…";
    notice.className = "notice";
    matches.setAttribute("aria-busy", "true");
  },
  error(message) {
    notice.textContent = message;
    notice.className = "notice error";
    matches.removeAttribute("aria-busy");
  },
  scoreboard(data) {
    competitionLabel.textContent = `比赛 ${data.competitionId}`;
    notice.textContent = `共 ${data.matches.length} 场比赛 · 刚刚更新`;
    notice.className = "notice";
    matches.innerHTML = PublicScoreboard.renderScoreboard(data);
    matches.removeAttribute("aria-busy");
  }
};

const workflow = PublicScoreboard.createScoreboardWorkflow({ api, view });

function load(competitionId) {
  if (!competitionId) return;
  competitionInput.value = competitionId;
  const url = new URL(window.location.href);
  url.searchParams.set("competitionId", competitionId);
  history.replaceState(null, "", url);
  workflow.load(competitionId);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  load(new FormData(form).get("competitionId"));
});

document.querySelector("#refresh").addEventListener("click", () => load(competitionInput.value));
load(new URLSearchParams(window.location.search).get("competitionId"));
