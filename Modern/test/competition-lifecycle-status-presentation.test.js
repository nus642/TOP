const assert = require("node:assert/strict");
const test = require("node:test");
const {
    COMPETITION_LIFECYCLE_STATUS_LABELS,
    competitionLifecycleStatusLabel
} = require("../presentation/competition-lifecycle-status");

test("competition lifecycle statuses have Simplified Chinese labels", () => {
    const lifecycleStatuses = [
        ["draft", "草稿"],
        ["configured", "已配置"],
        ["scheduled", "已排期"],
        ["running", "进行中"],
        ["completed", "已结束"],
        ["archived", "已归档"]
    ];

    assert.deepEqual(Object.entries(COMPETITION_LIFECYCLE_STATUS_LABELS), lifecycleStatuses);
    for (const [status, expectedLabel] of lifecycleStatuses) {
        assert.equal(competitionLifecycleStatusLabel(status), expectedLabel, status);
    }
});

test("unknown competition lifecycle statuses use a Chinese fallback", () => {
    assert.equal(competitionLifecycleStatusLabel("cancelled"), "未知状态");
    assert.equal(competitionLifecycleStatusLabel("toString"), "未知状态");
    assert.equal(competitionLifecycleStatusLabel(undefined), "未知状态");
});
