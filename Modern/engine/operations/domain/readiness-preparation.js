const { MatchContext } = require("./match-context");
const { OperationsError } = require("./operations-error");

function hasAttachedContext(matchContext, property, missingCode) {
  try {
    return Boolean(matchContext[property]);
  } catch (error) {
    if (error instanceof OperationsError && error.code === missingCode) {
      return false;
    }

    throw error;
  }
}

function checkReadinessPreparation(matchContext) {
  if (!(matchContext instanceof MatchContext)) {
    throw new OperationsError(
      "INVALID_MATCH_CONTEXT",
      "checkReadinessPreparation requires a valid MatchContext instance"
    );
  }

  const missing = [];

  if (!hasAttachedContext(matchContext, "masterContext", "MASTER_CONTEXT_NOT_ATTACHED")) {
    missing.push("masterContext");
  }

  if (!hasAttachedContext(matchContext, "refereeContext", "REFEEE_CONTEXT_NOT_ATTACHED")) {
    missing.push("refereeContext");
  }

  return missing.length === 0
    ? { ready: true }
    : { ready: false, missing };
}

module.exports = { checkReadinessPreparation };
