const { OperationsError } = require("./operations-error");

class CompetitionUpdateIntent {
  constructor(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new OperationsError("INVALID_COMPETITION_UPDATE_INTENT", "CompetitionUpdateIntent options are required");
    }
    if (!options.matchId) {
      throw new OperationsError("INVALID_COMPETITION_UPDATE_INTENT", "Missing matchId");
    }

    this._matchId = options.matchId;
    this._details = options.details ? { ...options.details } : {};
    this._createdAt = options.createdAt || new Date().toISOString();

    Object.freeze(this);
  }

  get matchId() { return this._matchId; }
  get details() { return { ...this._details }; }
  get createdAt() { return this._createdAt; }
}

module.exports = { CompetitionUpdateIntent };