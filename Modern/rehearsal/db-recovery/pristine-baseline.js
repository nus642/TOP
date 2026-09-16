"use strict";
const assert = require("node:assert/strict");

function assertPristineBootstrap(competitionProjection, databaseSnapshot) {
  assert.deepEqual(competitionProjection?.tournament && {
    id: competitionProjection.tournament.id,
    name: competitionProjection.tournament.name,
    sport: competitionProjection.tournament.sport,
    status: competitionProjection.tournament.status
  }, { id: 1, name: "赛事活动", sport: "pickleball", status: "draft" }, "requires the canonical explicit-reset bootstrap tournament");
  assert.deepEqual(competitionProjection.players, [], "bootstrap tournament contains players");
  assert.deepEqual(competitionProjection.matches, [], "bootstrap tournament contains matches");
  assert.deepEqual(competitionProjection.pairings, [], "bootstrap tournament contains pairings");
  assert.equal(competitionProjection.mode, "round-robin", "bootstrap tournament mode is not pristine");
  assert.ok(databaseSnapshot?.tables, "canonical reset baseline snapshot is unavailable");
  for (const [table, state] of Object.entries(databaseSnapshot.tables)) {
    assert.equal(state.rowCount, table === "tournaments" ? "1" : "0", `canonical reset baseline contains state in ${table}`);
  }
  return true;
}
module.exports = { assertPristineBootstrap };
