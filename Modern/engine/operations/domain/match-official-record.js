const { OperationsError } = require("./operations-error");
const { ConfirmedMatchOutcome } = require("./confirmed-match-outcome");

function copy(value) {
  if (Array.isArray(value)) return value.map(copy);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, copy(item)]));
  }
  return value;
}

class MatchOfficialRecord {
  constructor(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new OperationsError("INVALID_MATCH_OFFICIAL_RECORD", "MatchOfficialRecord options are required");
    }
    if (!(options.outcome instanceof ConfirmedMatchOutcome)) {
      throw new OperationsError("INVALID_MATCH_OFFICIAL_RECORD", "A confirmed match outcome is required");
    }
    if (!options.provenance || typeof options.provenance !== "object" || Array.isArray(options.provenance)) {
      throw new OperationsError("INVALID_MATCH_OFFICIAL_RECORD", "Record provenance is required");
    }

    this._recordId = options.recordId || null;
    this._outcome = options.outcome;
    this._provenance = copy(options.provenance);
    Object.freeze(this._provenance);
    Object.freeze(this);
  }

  get recordId() { return this._recordId; }
  get outcome() { return this._outcome; }
  get provenance() { return copy(this._provenance); }
}

module.exports = { MatchOfficialRecord };
