const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { createAccountabilityVisibility, render } = require("../shell/accountability-visibility");
const OperatorExperience = require("../shell/operator-experience");

function visibility(state) {
  const responsibilityContext = { current: () => state.responsibility };
  const accountabilityContext = { current: () => state.accountability };
  return createAccountabilityVisibility(responsibilityContext, accountabilityContext, OperatorExperience);
}

test("accountability display derives identity and context from established contexts", () => {
  const state = {
    responsibility: { actor: { actorId: "referee-7", actorType: "referee" }, competitionId: "competition-3" },
    accountability: { actorId: "referee-7", actorType: "referee", competitionId: "competition-3" }
  };
  assert.deepEqual(visibility(state).current(), {
    actorId: "referee-7",
    actorType: "referee",
    competitionId: "competition-3",
    responsibility: "Assigned match execution and confirmation"
  });
});

test("presentation has no actor input and rejects overwritten accountability identity", () => {
  const state = {
    responsibility: { actor: { actorId: "master-2", actorType: "master" }, competitionId: "competition-3" },
    accountability: { actorId: "impostor", actorType: "master", competitionId: "competition-3" }
  };
  const presentation = visibility(state);
  assert.deepEqual(Object.keys(presentation), ["current"]);
  assert.throws(() => presentation.current(), /does not match authenticated responsibility context/);
});

test("competition context can change while authenticated identity remains visible", () => {
  const actor = { actorId: "participant-8", actorType: "participant" };
  const state = {
    responsibility: { actor, competitionId: "competition-3" },
    accountability: { actorId: actor.actorId, actorType: actor.actorType, competitionId: "competition-3" }
  };
  const presentation = visibility(state);
  state.responsibility = { actor, competitionId: "competition-4" };
  state.accountability = { actorId: actor.actorId, actorType: actor.actorType, competitionId: "competition-4" };
  assert.deepEqual(presentation.current(), {
    actorId: "participant-8",
    actorType: "participant",
    competitionId: "competition-4",
    responsibility: "Participant-supplied readiness facts"
  });
});

test("accountability presentation introduces no operation or permission authority", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "shell", "accountability-visibility.js"), "utf8");
  assert.doesNotMatch(source, /\b(?:permissions?|RBAC|ACL|authorize|policy|can)\b/i);
  assert.doesNotMatch(source, /services|repositories|engine|\/api\//i);
});

test("all authenticated workflow pages load accountability visibility", () => {
  for (const file of ["operator/index.html", "operator/master.html", "participant/index.html"]) {
    const html = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    assert.match(html, /accountability-visibility\.js/);
    assert.equal(html.indexOf("accountability-context.js") < html.indexOf("accountability-visibility.js"), true);
  }
});

test("shell landing page renders the shared accountability visibility presentation", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "shell", "index.html"), "utf8");
  const app = fs.readFileSync(path.join(__dirname, "..", "shell", "app.js"), "utf8");
  assert.match(html, /id="accountability"/);
  assert.equal(html.indexOf("responsibility-context.js") < html.indexOf("accountability-context.js"), true);
  assert.equal(html.indexOf("accountability-context.js") < html.indexOf("accountability-visibility.js"), true);
  assert.match(app, /AccountabilityVisibility\.browser\.current\(\)/);
  assert.match(app, /AccountabilityVisibility\.render/);
});

test("shared renderer displays every accountability field and escapes identity text", () => {
  const markup = render({ actorId: "<actor>", actorType: "master", competitionId: "competition-4", responsibility: "Tournament oversight" });
  assert.match(markup, /&lt;actor&gt;/);
  for (const label of ["Operating as", "Actor type", "Competition", "Responsibility"]) assert.match(markup, new RegExp(label));
  assert.doesNotMatch(markup, /<actor>/);
});
