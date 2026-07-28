const { OperationsError } = require("./operations-error");

class MatchResult {
  constructor(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new OperationsError("INVALID_MATCH_RESULT", "MatchResult options are required");
    }
    if (!options.matchId) {
      throw new OperationsError("INVALID_MATCH_RESULT", "Missing matchId");
    }
    if (options.score === undefined || options.score === null) {
      throw new OperationsError("INVALID_MATCH_RESULT", "Missing score");
    }

    this._matchId = options.matchId;
    this._score = (typeof options.score === "object")
      ? (Array.isArray(options.score) ? [...options.score] : { ...options.score })
      : options.score;
    this._details = options.details ? { ...options.details } : {};
    this._recordedAt = options.recordedAt || new Date().toISOString();

    Object.freeze(this);
  }

  get matchId() { return this._matchId; }
  get score() {
    return (typeof this._score === "object")
      ? (Array.isArray(this._score) ? [...this._score] : { ...this._score })
      : this._score;
  }
  get details() { return { ...this._details }; }
  get recordedAt() { return this._recordedAt; }
}

module.exports = { MatchResult };
