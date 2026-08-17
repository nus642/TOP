"use strict";
const assert = require("node:assert/strict");
const test = require("node:test");
const scoring = require("../operator/referee-scoring");

test("award increments the winning team score and records timeline", () => {
  const state = scoring.createState();
  scoring.award(state, 1);
  scoring.award(state, 2);
  scoring.award(state, 1);
  assert.equal(state.t1Score, 2);
  assert.equal(state.t2Score, 1);
  assert.deepEqual(state.timeline, [1, 2, 1]);
  assert.equal(state.over, false);
});

test("award is ignored after game over and for invalid team", () => {
  const state = scoring.createState({ target: 3, cap: 0 });
  scoring.award(state, 1);
  scoring.award(state, 1);
  scoring.award(state, 1);
  assert.equal(state.over, true);
  scoring.award(state, 2);
  assert.equal(state.t2Score, 0);
  assert.equal(state.timeline.length, 3);
});

test("game over requires 2-point lead at target score", () => {
  const state = scoring.createState({ target: 5, cap: 0 });
  state.t1Score = 5;
  state.t2Score = 4;
  assert.equal(scoring.isGameOver(state), false);
  state.t1Score = 6;
  assert.equal(scoring.isGameOver(state), true);
});

test("hard cap ends the game without 2-point lead", () => {
  const state = scoring.createState({ target: 21, cap: 15 });
  state.t1Score = 15;
  state.t2Score = 14;
  assert.equal(scoring.isGameOver(state), true);
});

test("undo restores the previous score and clears game over", () => {
  const state = scoring.createState({ target: 3, cap: 0 });
  scoring.award(state, 1);
  scoring.award(state, 1);
  scoring.award(state, 1);
  assert.equal(state.over, true);
  scoring.undo(state);
  assert.equal(state.over, false);
  assert.equal(state.t1Score, 2);
  assert.deepEqual(state.timeline, [1, 1]);
  scoring.undo(state);
  scoring.undo(state);
  scoring.undo(state); // no history left, stays at zero
  assert.equal(state.t1Score, 0);
  assert.equal(state.t2Score, 0);
});

test("serialize/restore round-trips state including settings", () => {
  const state = scoring.createState({ target: 11, cap: 15 });
  scoring.award(state, 2);
  scoring.award(state, 2);
  const restored = scoring.restore(scoring.serialize(state));
  assert.equal(restored.t1Score, 0);
  assert.equal(restored.t2Score, 2);
  assert.equal(restored.target, 11);
  assert.equal(restored.cap, 15);
  assert.deepEqual(restored.timeline, [2, 2]);
  scoring.undo(restored);
  assert.equal(restored.t2Score, 1);
});

test("restore rejects malformed backup payloads", () => {
  assert.equal(scoring.restore("not json"), null);
  assert.equal(scoring.restore("{}"), null);
  assert.equal(scoring.restore('{"t1Score":"x"}'), null);
});

test("restore recomputes game over flag from scores", () => {
  const state = scoring.createState({ target: 3, cap: 0 });
  state.t1Score = 3;
  state.t2Score = 0;
  state.over = true;
  const restored = scoring.restore(scoring.serialize(state));
  assert.equal(restored.over, true);
});
