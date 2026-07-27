const { OperationsError } = require("./operations-error");

class RefereeOperationalContext {
  constructor(options) {
    if (!options || !options.matchContext) {
      throw new OperationsError('INVALID_CONSTRUCTOR_OPTIONS', 'Missing matchContext in options');
    }
    if (!(options.matchContext instanceof require("./match-context").MatchContext)) {
      throw new OperationsError('INVALID_MATCH_CONTEXT_TYPE', 'Invalid MatchContext type');
    }
    this.matchContext = options.matchContext;
  }

  validateOperation(operation) {
    const allowedOperations = ["participant_verification", "result_recording", "readiness_confirmation", "match_execution", "issue_reporting"];
    if (!allowedOperations.includes(operation)) {
      throw new OperationsError('OPERATION_NOT_ALLOWED', `Operation '${operation}' not allowed for Referee`);
    }
    return true;
  }
}

module.exports = { RefereeOperationalContext };