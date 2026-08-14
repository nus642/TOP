(function expose(factory) {
    const lifecycleStatus = factory();
    if (typeof module !== "undefined" && module.exports) module.exports = lifecycleStatus;
    if (typeof window !== "undefined") window.CompetitionLifecycleStatus = lifecycleStatus;
})(function createModule() {
    const COMPETITION_LIFECYCLE_STATUS_LABELS = Object.freeze({
        draft: "草稿",
        registration_open: "报名开放",
        ready: "准备就绪",
        running: "进行中",
        completed: "已结束",
        archived: "已归档"
    });

    const UNKNOWN_COMPETITION_LIFECYCLE_STATUS_LABEL = "未知状态";

    function competitionLifecycleStatusLabel(status) {
        return Object.hasOwn(COMPETITION_LIFECYCLE_STATUS_LABELS, status)
            ? COMPETITION_LIFECYCLE_STATUS_LABELS[status]
            : UNKNOWN_COMPETITION_LIFECYCLE_STATUS_LABEL;
    }

    return Object.freeze({
        COMPETITION_LIFECYCLE_STATUS_LABELS,
        UNKNOWN_COMPETITION_LIFECYCLE_STATUS_LABEL,
        competitionLifecycleStatusLabel
    });
});
