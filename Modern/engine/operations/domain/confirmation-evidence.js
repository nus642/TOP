const { OperationsError } = require("./operations-error");

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function copyValue(value) {
  if (Array.isArray(value)) return value.map(copyValue);
  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copyValue(item)]));
  }
  return value;
}

function freezeValue(value) {
  if (Array.isArray(value)) value.forEach(freezeValue);
  if (isObject(value)) Object.values(value).forEach(freezeValue);
  return Object.freeze(value);
}

class ConfirmationEvidence {
  constructor(options) {
    if (!isObject(options)) {
      throw new OperationsError("INVALID_CONFIRMATION_EVIDENCE", "ConfirmationEvidence options are required");
    }
    if (typeof options.reference !== "string" || options.reference.trim() === "") {
      throw new OperationsError("INVALID_CONFIRMATION_EVIDENCE", "Missing or invalid evidence reference");
    }
    if (options.captureMetadata !== undefined && !isObject(options.captureMetadata)) {
      throw new OperationsError("INVALID_CONFIRMATION_EVIDENCE", "captureMetadata must be an object");
    }

    this._reference = options.reference;
    this._captureMetadata = freezeValue(copyValue(options.captureMetadata || {}));

    Object.freeze(this);
  }

  get reference() { return this._reference; }
  get captureMetadata() { return copyValue(this._captureMetadata); }
}

module.exports = { ConfirmationEvidence };
