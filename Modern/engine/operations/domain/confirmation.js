const { OperationsError } = require("./operations-error");
const { ConfirmationEvidence } = require("./confirmation-evidence");

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
    if (options.evidenceReferences !== undefined && !Array.isArray(options.evidenceReferences)) {
      throw new OperationsError("INVALID_CONFIRMATION", "evidenceReferences must be an array");
    }
    if ((options.evidenceReferences || []).some((evidence) => !(evidence instanceof ConfirmationEvidence))) {
      throw new OperationsError("INVALID_CONFIRMATION", "Invalid confirmation evidence reference");
    }

    this._responsibility = options.responsibility;
    this._confirmedBy = options.confirmedBy;
    this._details = options.details ? { ...options.details } : {};
    this._confirmedAt = options.confirmedAt || new Date().toISOString();
    this._evidenceReferences = [...(options.evidenceReferences || [])];

    Object.freeze(this._evidenceReferences);
    Object.freeze(this);
  }

  get responsibility() { return this._responsibility; }
  get confirmedBy() { return this._confirmedBy; }
  get details() { return { ...this._details }; }
  get confirmedAt() { return this._confirmedAt; }
  get evidenceReferences() { return [...this._evidenceReferences]; }
}

module.exports = { Confirmation };
