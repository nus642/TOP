const { OperationsError } = require("./operations-error");

class DrawInput {
  constructor(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new OperationsError("INVALID_OPTIONS", "DrawInput requires an options object");
    }
    if (!options.entry) {
      throw new OperationsError("MISSING_ENTRY", "DrawInput requires an entry reference");
    }
    if (!options.round) {
      throw new OperationsError("MISSING_ROUND", "DrawInput requires a round");
    }
    if (!options.court) {
      throw new OperationsError("MISSING_COURT", "DrawInput requires a court");
    }
    if (!options.sequence) {
      throw new OperationsError("MISSING_SEQUENCE", "DrawInput requires a sequence");
    }

    this._entry = options.entry;
    this._round = options.round;
    this._court = options.court;
    this._sequence = options.sequence;
    this._receivedAt = new Date();

    Object.freeze(this);
  }

  get entry() { return this._entry; }
  get round() { return this._round; }
  get court() { return this._court; }
  get sequence() { return this._sequence; }
  get receivedAt() { return new Date(this._receivedAt.getTime()); }
}

module.exports = { DrawInput };
