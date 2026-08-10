const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { EXPERIENCES, forActor } = require("../shell/operator-experience");

test("each established actor receives a distinct responsibility-led experience", () => {
  assert.equal(forActor({ actorId: "master-1", actorType: "master" }).workspace, "master");
  assert.equal(forActor({ actorId: "referee-1", actorType: "referee" }).workspace, "referee");
  assert.equal(forActor({ actorId: "participant-1", actorType: "participant" }).workspace, "participant");
  assert.equal(new Set(Object.values(EXPERIENCES).map(profile => profile.responsibility)).size, 3);
  assert.equal(Object.values(EXPERIENCES).every(Object.isFrozen), true);
});

test("experience selection is presentation metadata rather than authorization", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "shell", "operator-experience.js"), "utf8");
  assert.doesNotMatch(source, /fetch|session|storage|permission|authori[sz]|allow|deny/i);
  assert.deepEqual(Object.keys(forActor({ actorType: "referee" })).sort(), ["actorType", "responsibility", "summary", "title", "workspace"]);
});

test("unknown actor types cannot be presented as an established experience", () => {
  assert.throws(() => forActor({ actorType: "spectator" }), /Unsupported authenticated actor type: spectator/);
});
