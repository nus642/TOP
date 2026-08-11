(function expose(factory) {
  const experience = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = experience;
  if (typeof window !== "undefined") window.OperatorExperience = experience;
})(function createModule() {
  const EXPERIENCES = Object.freeze({
    master: Object.freeze({ actorType: "master", title: "管理赛事运行", summary: "查看赛事运行全局，推动比赛顺利进行。", responsibility: "赛事总协调", workspace: "master" }),
    referee: Object.freeze({ actorType: "referee", title: "执行已分配的比赛", summary: "查看比赛任务并记录可追溯的赛果。", responsibility: "已分配比赛的执行与确认", workspace: "referee" }),
    participant: Object.freeze({ actorType: "participant", title: "确认参赛准备状态", summary: "查看与参赛相关的准备信息。", responsibility: "选手提交的准备状态", workspace: "participant" })
  });

  function forActor(actor) {
    const profile = actor && EXPERIENCES[actor.actorType];
    if (!profile) throw new Error(`Unsupported authenticated actor type: ${actor?.actorType || "unknown"}`);
    return profile;
  }

  return Object.freeze({ EXPERIENCES, forActor });
});
