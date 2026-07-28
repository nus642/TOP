const { OperationsError } = require("./operations-error");

class MasterConfirmation {
  constructor(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new OperationsError("INVALID_MASTER_CONFIRMATION", "MasterConfirmation options are required");
    }
    if (!options.matchId) {
      throw new OperationsError("INVALID_MASTER_CONFIRMATION", "Missing matchId");
    }
    if (!options.confirmationType || typeof options.confirmationType !== "string") {
      throw new OperationsError("INVALID_MASTER_CONFIRMATION", "Missing or invalid confirmationType");
    }

    this._matchId = options.matchId;
    this._confirmationType = options.confirmationType;
    this._details = options.details ? { ...options.details } : {};
    this._confirmedAt = options.confirmedAt || new Date().toISOString();

    Object.freeze(this);
  }

  get matchId() { return this._matchId; }
  get confirmationType() { return this._confirmationType; }
  get details() { return { ...this._details }; }
  get confirmedAt() { return this._confirmedAt; }
}

module.exports = { MasterConfirmation };