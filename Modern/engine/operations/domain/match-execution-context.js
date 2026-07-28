const { OperationsError } = require("./operations-error");
const { MatchResult } = require("./match-result");
const { MasterConfirmation } = require("./master-confirmation");
const { CompetitionUpdateIntent } = require("./competition-update-intent");

class MatchExecutionContext {
  constructor(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new OperationsError("INVALID_CONSTRUCTOR_OPTIONS", "MatchExecutionContext options are required");
    }
    if (!options.matchContext) {
      throw new OperationsError("INVALID_CONSTRUCTOR_OPTIONS", "Missing matchContext");
    }

    this._matchContext = options.matchContext;
    this._result = null;
    this._confirmation = null;
  }

  get matchContext() { return this._matchContext; }
  get result() { return this._result; }
  get confirmation() { return this._confirmation; }

  setResult(matchResult) {
    if (!(matchResult instanceof MatchResult)) {
      throw new OperationsError("INVALID_MATCH_RESULT_TYPE", "Invalid MatchResult type");
    }
    this._result = matchResult;
  }

  setConfirmation(masterConfirmation) {
    if (!(masterConfirmation instanceof MasterConfirmation)) {
      throw new OperationsError("INVALID_MASTER_CONFIRMATION_TYPE", "Invalid MasterConfirmation type");
    }
    this._confirmation = masterConfirmation;
  }

  createCompetitionUpdateIntent(details) {
    if (!this._result) {
      throw new OperationsError("INCOMPLETE_EXECUTION", "MatchResult required before creating intent");
    }
    if (!this._confirmation) {
      throw new OperationsError("INCOMPLETE_EXECUTION", "MasterConfirmation required before creating intent");
    }
    return new CompetitionUpdateIntent({
      matchId: this._result.matchId,
      details: details || {}
    });
  }
}

module.exports = { MatchExecutionContext };