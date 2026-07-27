const { Entry } = require("../../competition/domain");
const { OperationsError } = require("./operations-error");

class MatchContext {
  constructor(options) {
    if (!options) {
      throw new OperationsError('INVALID_CONSTRUCTOR_OPTIONS', 'Missing constructor options');
    }
    if (!options.entry || !(options.entry instanceof Entry)) {
      throw new OperationsError('INVALID_ENTRY', 'Missing or invalid Entry');
    }
    if (!options.drawPosition) {
      throw new OperationsError('INVALID_DRAW_POSITION', 'Missing draw position');
    }
    this.entry = options.entry; // Read-only
    this.drawPosition = options.drawPosition;
    this._masterContext = null;
    this._refereeContext = null;
  }

  get masterContext() {
    if (!this._masterContext) {
      throw new OperationsError('MASTER_CONTEXT_NOT_ATTACHED', 'Master context not attached');
    }
    return this._masterContext;
  }

  get refereeContext() {
    if (!this._refereeContext) {
      throw new OperationsError('REFEEE_CONTEXT_NOT_ATTACHED', 'Referee context not attached');
    }
    return this._refereeContext;
  }

  attachMasterContext(masterCtx) {
    const { MasterOperationalContext } = require("./master-operational-context");

    if (this._masterContext) {
      throw new OperationsError('DUPLICATE_MASTER_CONTEXT', 'Master context already attached');
    }
    if (!(masterCtx instanceof MasterOperationalContext)) {
      throw new OperationsError('INVALID_MASTER_CONTEXT_TYPE', 'Invalid MasterOperationalContext type');
    }
    if (masterCtx.matchContext !== this) {
      throw new OperationsError('WRONG_MATCH_CONTEXT', 'Master context not attached to this MatchContext');
    }
    this._masterContext = masterCtx;
  }

  attachRefereeContext(refereeCtx) {
    const { RefereeOperationalContext } = require("./referee-operational-context");

    if (this._refereeContext) {
      throw new OperationsError('DUPLICATE_REFEEE_CONTEXT', 'Referee context already attached');
    }
    if (!(refereeCtx instanceof RefereeOperationalContext)) {
      throw new OperationsError('INVALID_REFEEE_CONTEXT_TYPE', 'Invalid RefereeOperationalContext type');
    }
    if (refereeCtx.matchContext !== this) {
      throw new OperationsError('WRONG_MATCH_CONTEXT', 'Referee context not attached to this MatchContext');
    }
    this._refereeContext = refereeCtx;
  }
}

module.exports = { MatchContext };