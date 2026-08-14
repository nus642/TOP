const assert = require("node:assert/strict");
const test = require("node:test");
const {
    COMPETITION_LIFECYCLE_STATUS_LABELS,
    competitionLifecycleStatusLabel
} = require("../presentation/competition-lifecycle-status");

test("competition lifecycle statuses have Simplified Chinese labels", () => {
    assert.deepEqual(COMPETITION_LIFECYCLE_STATUS_LABELS, {
        draft: "草稿",
        registration_open: "报名开放",
        ready: "准备就绪",
        running: "进行中",
        completed: "已结束",
        archived: "已归档"
    });
});

test("unknown competition lifecycle statuses use a Chinese fallback", () => {
    assert.equal(competitionLifecycleStatusLabel("cancelled"), "未知状态");
    assert.equal(competitionLifecycleStatusLabel("toString"), "未知状态");
    assert.equal(competitionLifecycleStatusLabel(undefined), "未知状态");
});
