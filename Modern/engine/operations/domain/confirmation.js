const { OperationsError } = require("./operations-error");

class Confirmation {
  constructor(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new OperationsError("INVALID_CONFIRMATION", "Confirmation options are required");
    }
    if (!options.responsibility || typeof options.responsibility !== "string") {
      throw new OperationsError("INVALID_CONFIRMATION", "Missing or invalid responsibility");
    }
    if (!options.confirmedBy) {
      throw new OperationsError("INVALID_CONFIRMATION", "Missing confirmedBy");
    }

    this._responsibility = options.responsibility;
    this._confirmedBy = options.confirmedBy;
    this._details = options.details ? { ...options.details } : {};
    this._confirmedAt = options.confirmedAt || new Date().toISOString();

    Object.freeze(this);
  }

  get responsibility() { return this._responsibility; }
  get confirmedBy() { return this._confirmedBy; }
  get details() { return { ...this._details }; }
  get confirmedAt() { return this._confirmedAt; }
}

module.exports = { Confirmation };
