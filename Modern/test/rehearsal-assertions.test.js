/**
 * Automated tests for rehearsal assertion helpers.
 *
 * These tests validate the response parsing/structure assertions extracted
 * from the full-scale rehearsal script, preventing regressions like treating
 * an object response as an array.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { parsePublicScoreboard, assertPublicScoreboardMatches } = require("../rehearsal/assertions");

// ---------------------------------------------------------------- parsePublicScoreboard

test("parsePublicScoreboard rejects null response", () => {
  assert.throws(() => parsePublicScoreboard(null), { message: /must not be null/ });
});

test("parsePublicScoreboard rejects undefined response", () => {
  assert.throws(() => parsePublicScoreboard(undefined), { message: /must not be null/ });
});

test("parsePublicScoreboard rejects a bare array (the original bug)", () => {
  assert.throws(() => parsePublicScoreboard([{ matchId: 1 }]), { message: /must be an object/ });
});

test("parsePublicScoreboard rejects a string", () => {
  assert.throws(() => parsePublicScoreboard("string"), { message: /must be an object/ });
});

test("parsePublicScoreboard rejects object without matches array", () => {
  assert.throws(() => parsePublicScoreboard({ competitionId: 1 }), { message: /matches.*must be an array/ });
});

test("parsePublicScoreboard rejects object where matches is not an array", () => {
  assert.throws(() => parsePublicScoreboard({ competitionId: 1, matches: "nope" }), { message: /matches.*must be an array/ });
});

test("parsePublicScoreboard accepts valid response and returns matches array", () => {
  const json = { competitionId: 42, matches: [{ matchId: 101 }, { matchId: 102 }] };
  const matches = parsePublicScoreboard(json);
  assert.ok(Array.isArray(matches));
  assert.equal(matches.length, 2);
  assert.equal(matches[0].matchId, 101);
});

test("parsePublicScoreboard accepts empty matches array", () => {
  const json = { competitionId: 1, matches: [] };
  const matches = parsePublicScoreboard(json);
  assert.ok(Array.isArray(matches));
  assert.equal(matches.length, 0);
});

// ---------------------------------------------------------------- assertPublicScoreboardMatches

test("assertPublicScoreboardMatches passes when all expected matches are confirmed", () => {
  const json = {
    competitionId: 1,
    matches: [
      { matchId: 101, status: "confirmed", confirmed: true, score: { sideOne: 11, sideTwo: 7 } },
      { matchId: 102, status: "confirmed", confirmed: true, score: { sideOne: 11, sideTwo: 5 } },
      { matchId: 999, status: "playing", confirmed: false }
    ]
  };
  const result = assertPublicScoreboardMatches(json, [101, 102]);
  assert.equal(result.length, 2);
});

test("assertPublicScoreboardMatches rejects when a matchId is missing", () => {
  const json = {
    competitionId: 1,
    matches: [{ matchId: 101, status: "confirmed", confirmed: true }]
  };
  assert.throws(
    () => assertPublicScoreboardMatches(json, [101, 102]),
    { message: /matchId 102 not found/ }
  );
});

test("assertPublicScoreboardMatches rejects when status is not confirmed", () => {
  const json = {
    competitionId: 1,
    matches: [{ matchId: 101, status: "scored", confirmed: false }]
  };
  assert.throws(
    () => assertPublicScoreboardMatches(json, [101]),
    { message: /status should be "confirmed"/ }
  );
});

test("assertPublicScoreboardMatches rejects when confirmed is not true", () => {
  const json = {
    competitionId: 1,
    matches: [{ matchId: 101, status: "confirmed", confirmed: false }]
  };
  assert.throws(
    () => assertPublicScoreboardMatches(json, [101]),
    { message: /confirmed should be true/ }
  );
});

test("assertPublicScoreboardMatches rejects when confirmed is truthy but not boolean true", () => {
  const json = {
    competitionId: 1,
    matches: [{ matchId: 101, status: "confirmed", confirmed: 1 }]
  };
  assert.throws(
    () => assertPublicScoreboardMatches(json, [101]),
    { message: /confirmed should be true/ }
  );
});

test("assertPublicScoreboardMatches uses custom label in error messages", () => {
  const json = { competitionId: 1, matches: [] };
  assert.throws(
    () => assertPublicScoreboardMatches(json, [101], { label: "Wave 1 projection" }),
    { message: /Wave 1 projection.*matchId 101 not found/ }
  );
});

test("assertPublicScoreboardMatches handles 12 matches (two full waves)", () => {
  const matches = Array.from({ length: 12 }, (_, i) => ({
    matchId: i + 1,
    status: "confirmed",
    confirmed: true,
    score: { sideOne: 11, sideTwo: 7 }
  }));
  const json = { competitionId: 1, matches };
  const ids = matches.map((m) => m.matchId);
  const result = assertPublicScoreboardMatches(json, ids);
  assert.equal(result.length, 12);
});
