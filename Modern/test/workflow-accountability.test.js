"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { createWorkflowAccountability } = require("../shell/workflow-accountability");

test("an operator action remains attributed to the workflow context that was opened", () => {
  let current = { actorId: "referee-7", actorType: "referee", competitionId: "competition-3" };
  const flows = createWorkflowAccountability({ current: () => current });
  const workflow = flows.begin({ actorType: "referee", competitionId: "competition-3" });
  assert.deepEqual(flows.verify(workflow), current);
  assert.equal(Object.isFrozen(workflow), true);
  current = { ...current, actorId: "referee-8" };
  assert.throws(() => flows.verify(workflow), /Accountability changed/);
});

test("competition or responsibility changes require the workflow to be reopened", () => {
  let current = { actorId: "master-2", actorType: "master", competitionId: "competition-3" };
  const flows = createWorkflowAccountability({ current: () => current });
  const workflow = flows.begin({ actorType: "master", competitionId: "competition-3" });
  current = { ...current, competitionId: "competition-4" };
  assert.throws(() => flows.verify(workflow), /reopen this workflow/);
  assert.throws(() => flows.begin({ actorType: "referee", competitionId: "competition-4" }), /does not match current accountability/);
});

test("workflow accountability coordinates UI actions without gaining backend authority", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "shell", "workflow-accountability.js"), "utf8");
  assert.doesNotMatch(source, /services|repositories|engine|database|fetch|permission|rbac/i);
  for (const relative of ["operator/referee-workflow.js", "operator/master-workflow.js", "participant/readiness-workflow.js"]) {
    const workflow = fs.readFileSync(path.join(__dirname, "..", relative), "utf8");
    assert.match(workflow, /accountabilityFlow\.verify\(accountability\)/);
  }
});
