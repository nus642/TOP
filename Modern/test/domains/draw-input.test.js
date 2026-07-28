"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const { DrawInput } = require("../../engine/operations/domain/draw-input");
const { OperationsError } = require("../../engine/operations/domain/operations-error");

const entry = { id: 1 };

test("creates DrawInput with its required draw data", () => {
  const before = Date.now();
  const input = new DrawInput({ entry, round: "QF", court: "A", sequence: 1 });

  assert.equal(input.entry, entry);
  assert.equal(input.round, "QF");
  assert.equal(input.court, "A");
  assert.equal(input.sequence, 1);
  assert.ok(input.receivedAt instanceof Date);
  assert.ok(input.receivedAt.getTime() >= before);
  assert.ok(input.receivedAt.getTime() <= Date.now());
});

test("rejects missing or invalid constructor options", () => {
  for (const options of [undefined, null, "string", []]) {
    assert.throws(
      () => new DrawInput(options),
      (error) => error instanceof OperationsError && error.code === "INVALID_OPTIONS"
    );
  }
});

test("rejects a missing entry", () => {
  assert.throws(
    () => new DrawInput({ round: "QF", court: "A", sequence: 1 }),
    { code: "MISSING_ENTRY" }
  );
});

test("rejects a missing round", () => {
  assert.throws(
    () => new DrawInput({ entry, court: "A", sequence: 1 }),
    { code: "MISSING_ROUND" }
  );
});

test("rejects a missing court", () => {
  assert.throws(
    () => new DrawInput({ entry, round: "QF", sequence: 1 }),
    { code: "MISSING_COURT" }
  );
});

test("rejects a missing sequence", () => {
  assert.throws(
    () => new DrawInput({ entry, round: "QF", court: "A" }),
    { code: "MISSING_SEQUENCE" }
  );
});

test("is immutable and returns copies of receivedAt", () => {
  const input = new DrawInput({ entry, round: "QF", court: "A", sequence: 1 });
  const firstReceivedAt = input.receivedAt;
  const secondReceivedAt = input.receivedAt;

  assert.ok(Object.isFrozen(input));
  assert.notEqual(firstReceivedAt, secondReceivedAt);
  assert.equal(firstReceivedAt.getTime(), secondReceivedAt.getTime());
  assert.throws(() => { input.round = "SF"; }, TypeError);
  assert.equal(input.round, "QF");
});

test("exposes no behavior methods beyond getters", () => {
  assert.deepEqual(Object.getOwnPropertyNames(DrawInput.prototype), [
    "constructor",
    "entry",
    "round",
    "court",
    "sequence",
    "receivedAt"
  ]);
});

test("exports DrawInput from both operations entry points", () => {
  assert.equal(require("../../engine/operations/domain").DrawInput, DrawInput);
  assert.equal(require("../../engine/operations").DrawInput, DrawInput);
});
