const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const UiText = require("../shell/ui-text");

const guidance = "登录状态已失效，请重新进入赛事工作台。";

test("known session and identity failures become concise Chinese guidance", () => {
  [
    "Authenticated actor session required",
    "A master identity context is required",
    "A referee identity context is required",
    "A participant identity context is required"
  ].forEach((message) => assert.equal(UiText.userFacingError(message), guidance));
});

test("Shell, Master, Referee, and Participant use the presentation error boundary", () => {
  const files = ["shell/app.js", "shell/navigation.js", "operator/master-app.js", "operator/app.js", "participant/app.js"];
  for (const file of files) {
    const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    assert.match(source, /UiText\.userFacingError\(message\)/, `${file} must map errors before display`);
  }
});
