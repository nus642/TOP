const assert = require("node:assert/strict");
const test = require("node:test");
const UiText = require("../shell/ui-text");
const { renderArchive } = require("../archive/archive");

test("shared presentation text localizes every competition lifecycle status", () => {
  assert.deepEqual(
    ["draft", "registration_open", "ready", "running", "completed", "archived"]
      .map(UiText.competitionLifecycleLabel),
    ["草稿", "报名开放", "准备就绪", "进行中", "已结束", "已归档"]
  );
});

test("competition lifecycle localization accepts uppercase projection values", () => {
  assert.equal(UiText.competitionLifecycleLabel("DRAFT"), "草稿");
  assert.equal(UiText.competitionLifecycleLabel("REGISTRATION_OPEN"), "报名开放");
});

test("unknown lifecycle values use Chinese fallback without exposing raw tokens", () => {
  assert.equal(UiText.competitionLifecycleLabel("INTERNAL_PENDING"), "状态待定");
  const summary = renderArchive({ competitionId: 7, competitionStatus: "INTERNAL_PENDING" }).summary;
  assert.match(summary, /状态待定/);
  assert.doesNotMatch(summary, /INTERNAL_PENDING/);
});

test("Archive renders lifecycle values through the shared Chinese mapping", () => {
  for (const [status, expected] of Object.entries(UiText.competitionLifecycleLabels)) {
    const summary = renderArchive({ competitionId: 7, competitionStatus: status }).summary;
    assert.match(summary, new RegExp(expected));
    assert.doesNotMatch(summary, new RegExp(`>${status}<`, "i"));
  }
});
