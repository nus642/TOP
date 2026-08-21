/**
 * Testable assertion helpers for rehearsal script response parsing.
 *
 * These functions validate API response structures to prevent bugs like
 * treating an object as an array (e.g., GET /api/public/competitions/:id/matches
 * returns { competitionId, matches: [...] }, not a bare array).
 */
"use strict";

const assert = require("node:assert/strict");

/**
 * Parse the public scoreboard response and extract the matches array.
 * Validates the response structure: must be an object with a matches array.
 *
 * @param {object} json - The raw JSON response from the API
 * @returns {Array} The matches array
 * @throws {AssertionError} If the response structure is invalid
 */
function parsePublicScoreboard(json) {
  assert.ok(json, "public scoreboard response must not be null");
  assert.ok(typeof json === "object" && !Array.isArray(json), "public scoreboard response must be an object");
  assert.ok(Array.isArray(json.matches), "public scoreboard response.matches must be an array");
  return json.matches;
}

/**
 * Validate that the public scoreboard contains all expected matches with
 * status === "confirmed" and confirmed === true.
 *
 * @param {object} json - The raw JSON response from the API
 * @param {Array<number>} expectedMatchIds - Array of matchIds that must be present
 * @param {object} [options]
 * @param {string} [options.label] - Label for error messages
 * @returns {Array} The filtered array of confirmed matches
 * @throws {AssertionError} If any expected match is missing or not confirmed
 */
function assertPublicScoreboardMatches(json, expectedMatchIds, { label = "public scoreboard" } = {}) {
  const matches = parsePublicScoreboard(json);

  // All expected matchIds must be present
  const foundIds = matches.map((m) => m.matchId);
  for (const id of expectedMatchIds) {
    assert.ok(foundIds.includes(id), `${label}: matchId ${id} not found in public scoreboard`);
  }

  // Filter to expected matches and validate count
  const expectedMatches = matches.filter((m) => expectedMatchIds.includes(m.matchId));
  assert.equal(expectedMatches.length, expectedMatchIds.length, `${label}: expected ${expectedMatchIds.length} matches, got ${expectedMatches.length}`);

  // Each expected match must have status === "confirmed" and confirmed === true
  for (const match of expectedMatches) {
    assert.equal(match.status, "confirmed", `${label}: match ${match.matchId} status should be "confirmed", got "${match.status}"`);
    assert.equal(match.confirmed, true, `${label}: match ${match.matchId} confirmed should be true, got ${match.confirmed}`);
  }

  return expectedMatches;
}

module.exports = { parsePublicScoreboard, assertPublicScoreboardMatches };
