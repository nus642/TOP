class OperationsError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "OperationsError";
    this.code = code;
  }
}

module.exports = { OperationsError };