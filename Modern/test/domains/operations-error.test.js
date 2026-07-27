const test = require("node:test");
const assert = require("node:assert/strict");

const { OperationsError } = require("../../engine/operations/domain/operations-error");

test("OperationsError constructs with code and message", () => {
    const error = new OperationsError("TEST_ERROR", "Test error message");
    assert.ok(error instanceof Error);
    assert.equal(error.name, "OperationsError");
    assert.equal(error.code, "TEST_ERROR");
    assert.equal(error.message, "Test error message");
});

test("OperationsError is instanceof Error", () => {
    const error = new OperationsError("SOME_CODE", "Some message");
    assert.ok(error instanceof Error);
});

test("OperationsError has correct name property", () => {
    const error = new OperationsError("SOME_CODE", "Some message");
    assert.equal(error.name, "OperationsError");
});