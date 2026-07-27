const { OperationsError } = require("./operations-error");

class MasterOperationalContext {
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
    const allowedOperations = ["calling_control", "result_confirmation", "exception_handling", "operational_override", "match_cancellation"];
    if (!allowedOperations.includes(operation)) {
      throw new OperationsError('OPERATION_NOT_ALLOWED', `Operation '${operation}' not allowed for Master`);
    }
    return true;
  }
}

module.exports = { MasterOperationalContext };