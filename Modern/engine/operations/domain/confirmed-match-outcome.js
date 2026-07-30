const { OperationsError } = require("./operations-error");
const { MatchResult } = require("./match-result");
const { Confirmation } = require("./confirmation");

function copyReference(reference) {
  if (!reference || typeof reference !== "object") return reference;
  return Array.isArray(reference) ? [...reference] : { ...reference };
}

class ConfirmedMatchOutcome {
  constructor(options) {
    if (!options || typeof options !== "object" || Array.isArray(options)) {
      throw new OperationsError("INVALID_CONFIRMED_MATCH_OUTCOME", "ConfirmedMatchOutcome options are required");
    }
    if (!(options.matchResult instanceof MatchResult)) {
      throw new OperationsError("INVALID_CONFIRMED_MATCH_OUTCOME", "Missing or invalid matchResult");
    }
    if (!(options.officialConfirmation instanceof Confirmation)) {
      throw new OperationsError("OFFICIAL_CONFIRMATION_REQUIRED", "Official confirmation is required");
    }
    if (options.participantConfirmations !== undefined && !Array.isArray(options.participantConfirmations)) {
      throw new OperationsError("INVALID_CONFIRMED_MATCH_OUTCOME", "participantConfirmations must be an array");
    }
    if ((options.participantConfirmations || []).some((confirmation) => !(confirmation instanceof Confirmation))) {
      throw new OperationsError("INVALID_CONFIRMED_MATCH_OUTCOME", "Invalid participant confirmation");
    }
    if (options.evidenceReferences !== undefined && !Array.isArray(options.evidenceReferences)) {
      throw new OperationsError("INVALID_CONFIRMED_MATCH_OUTCOME", "evidenceReferences must be an array");
    }

    this._matchResult = options.matchResult;
    this._officialConfirmation = options.officialConfirmation;
    this._participantConfirmations = [...(options.participantConfirmations || [])];
    this._evidenceReferences = (options.evidenceReferences || []).map(copyReference);
    this._createdAt = options.createdAt || new Date().toISOString();
    this._confirmedAt = options.confirmedAt || options.officialConfirmation.confirmedAt;

    Object.freeze(this._participantConfirmations);
    Object.freeze(this._evidenceReferences);
    Object.freeze(this);
  }

  get matchResult() { return this._matchResult; }
  get officialConfirmation() { return this._officialConfirmation; }
  get participantConfirmations() { return [...this._participantConfirmations]; }
  get evidenceReferences() { return this._evidenceReferences.map(copyReference); }
  get createdAt() { return this._createdAt; }
  get confirmedAt() { return this._confirmedAt; }
}

module.exports = { ConfirmedMatchOutcome };
