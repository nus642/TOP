(function expose(factory) {
  const workflowAccountability = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = workflowAccountability;
  if (typeof window !== "undefined") {
    workflowAccountability.browser = workflowAccountability.createWorkflowAccountability(window.AccountabilityContext.browser);
    window.WorkflowAccountability = Object.freeze(workflowAccountability);
  }
})(function createModule() {
  function createWorkflowAccountability(accountabilityContext) {
    if (!accountabilityContext || typeof accountabilityContext.current !== "function") throw new TypeError("accountability context is required");

    function begin({ actorType, competitionId }) {
      const current = accountabilityContext.current();
      if (current.actorType !== actorType || current.competitionId !== competitionId) {
        throw new TypeError("Workflow context does not match current accountability");
      }
      return Object.freeze({ actorId: current.actorId, actorType: current.actorType, competitionId: current.competitionId });
    }

    function verify(workflow) {
      if (!workflow) throw new TypeError("workflow accountability is required");
      const current = accountabilityContext.current();
      if (current.actorId !== workflow.actorId || current.actorType !== workflow.actorType || current.competitionId !== workflow.competitionId) {
        throw new TypeError("Accountability changed; reopen this workflow before acting");
      }
      return workflow;
    }

    return Object.freeze({ begin, verify });
  }

  return { createWorkflowAccountability };
});
