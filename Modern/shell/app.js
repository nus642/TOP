const actorId = document.querySelector("#actor-id");
const actorType = document.querySelector("#actor-type");
const competition = document.querySelector("#competition-id");
const landing = document.querySelector("#workspace-link");
const status = document.querySelector("#status");
const content = document.querySelector("#authenticated-content");

const view = {
  loading() { status.textContent = "Confirming your authenticated session…"; },
  ready(context) {
    actorId.textContent = context.actor.actorId;
    actorType.textContent = context.actor.actorType;
    competition.value = context.competitionId;
    landing.href = context.landing;
    landing.textContent = `Open ${context.actor.actorType} workspace`;
    status.textContent = "Authenticated session ready";
    content.hidden = false;
  },
  error(message) {
    status.textContent = message;
    status.classList.add("error");
    content.hidden = true;
  }
};

const shell = OperatorShell.createOperatorShell({ fetchImpl: fetch, storage: localStorage, view });
competition.addEventListener("input", () => shell.selectCompetition(competition.value));
shell.hydrate().catch(() => {});
