const Entry = require("../../competition/domain/entry");
const { DrawInput } = require("./draw-input");
const { OperationsError } = require("./operations-error");

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

class DrawInputValidator {
  validate(drawInput) {
    if (!(drawInput instanceof DrawInput)) {
      throw new OperationsError("INVALID_DRAW_INPUT", "Expected a DrawInput instance");
    }
    if (!(drawInput.entry instanceof Entry)) {
      throw new OperationsError("INVALID_ENTRY", "DrawInput entry must be a valid Entry instance");
    }
    if (!isPositiveInteger(drawInput.round) && !isNonEmptyString(drawInput.round)) {
      throw new OperationsError(
        "INVALID_ROUND",
        "DrawInput round must be a positive integer or valid identifier"
      );
    }
    if (!isPositiveInteger(drawInput.court) && !isNonEmptyString(drawInput.court)) {
      throw new OperationsError("INVALID_COURT", "DrawInput court must be a valid identifier");
    }
    if (!isPositiveInteger(drawInput.sequence)) {
      throw new OperationsError("INVALID_SEQUENCE", "DrawInput sequence must be a positive integer");
    }

    return true;
  }

  toMatchContextOptions(drawInput) {
    this.validate(drawInput);

    return {
      entry: drawInput.entry,
      drawPosition: {
        round: drawInput.round,
        court: drawInput.court,
        sequence: drawInput.sequence
      }
    };
  }
}

module.exports = { DrawInputValidator };
