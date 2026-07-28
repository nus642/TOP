const test = require("node:test");
const assert = require("node:assert/strict");

const { Competition, Group, Event, Entry } = require("../../engine/competition/domain");
const {
  DrawInput,
  DrawInputValidator,
  MatchContext,
  OperationsError
} = require("../../engine/operations/domain");

function buildEntry() {
  const competition = new Competition({ id: "competition-1", name: "Open" });
  const group = new Group({ id: "group-1", name: "Adult", competition });
  const event = new Event({ id: "event-1", name: "Doubles", format: "round-robin", group });
  return new Entry({ id: "entry-1", name: "Team One", event });
}

function buildDrawInput(overrides = {}) {
  return new DrawInput({
    entry: buildEntry(),
    round: 1,
    court: "Centre Court",
    sequence: 1,
    ...overrides
  });
}

function drawInputWith(field, value) {
  const drawInput = Object.create(DrawInput.prototype);
  Object.assign(drawInput, {
    _entry: buildEntry(),
    _round: 1,
    _court: "Centre Court",
    _sequence: 1,
    [`_${field}`]: value
  });
  return drawInput;
}

function hasCode(code) {
  return (error) => error instanceof OperationsError && error.code === code;
}

test("validates a complete DrawInput", () => {
  assert.equal(new DrawInputValidator().validate(buildDrawInput()), true);
});

test("rejects values that are not DrawInput instances", () => {
  const validator = new DrawInputValidator();
  for (const value of [null, {}, "draw input"]) {
    assert.throws(() => validator.validate(value), hasCode("INVALID_DRAW_INPUT"));
  }
});

test("rejects an invalid Entry reference", () => {
  const validator = new DrawInputValidator();
  assert.throws(
    () => validator.validate(buildDrawInput({ entry: {} })),
    hasCode("INVALID_ENTRY")
  );
});

test("rejects invalid round values", () => {
  const validator = new DrawInputValidator();
  for (const value of [0, -1, "", "   ", 1.5, {}]) {
    assert.throws(() => validator.validate(drawInputWith("round", value)), hasCode("INVALID_ROUND"));
  }
});

test("rejects invalid court values", () => {
  const validator = new DrawInputValidator();
  for (const value of [0, -1, "", "   ", null, 1.5, {}]) {
    assert.throws(() => validator.validate(drawInputWith("court", value)), hasCode("INVALID_COURT"));
  }
});

test("rejects invalid sequence values", () => {
  const validator = new DrawInputValidator();
  for (const value of [0, -1, "abc", 1.5, {}]) {
    assert.throws(
      () => validator.validate(drawInputWith("sequence", value)),
      hasCode("INVALID_SEQUENCE")
    );
  }
});

test("returns plain MatchContext options without constructing MatchContext", () => {
  const drawInput = buildDrawInput({ round: "quarterfinal", court: 2, sequence: 3 });
  const options = new DrawInputValidator().toMatchContextOptions(drawInput);

  assert.deepEqual(options, {
    entry: drawInput.entry,
    drawPosition: { round: "quarterfinal", court: 2, sequence: 3 }
  });
  assert.equal(Object.getPrototypeOf(options), Object.prototype);
  assert.equal(Object.getPrototypeOf(options.drawPosition), Object.prototype);
  assert.equal(options instanceof MatchContext, false);
});

test("validation and conversion do not mutate DrawInput or its Entry", () => {
  const drawInput = buildDrawInput();
  const before = {
    entry: drawInput.entry,
    round: drawInput.round,
    court: drawInput.court,
    sequence: drawInput.sequence,
    receivedAt: drawInput.receivedAt.getTime()
  };
  const validator = new DrawInputValidator();

  validator.validate(drawInput);
  validator.toMatchContextOptions(drawInput);

  assert.deepEqual(
    {
      entry: drawInput.entry,
      round: drawInput.round,
      court: drawInput.court,
      sequence: drawInput.sequence,
      receivedAt: drawInput.receivedAt.getTime()
    },
    before
  );
});

test("exports DrawInputValidator through the operations public entry point", () => {
  const operations = require("../../engine/operations");
  assert.equal(operations.DrawInputValidator, DrawInputValidator);
});
