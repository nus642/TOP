"use strict";
const assert = require("node:assert/strict");
const EXPECTED_POST_BACKUP_TABLES = Object.freeze([
  "court_operating_conditions",
  "match_official_records",
  "matches",
  "referee_dispatch_reservations",
  "tournament_coordination_chronology"
]);
function buildDeltaLedger(recoveryPoint, postDelta, outcomes, declaredFacts) {
  assert.notEqual(postDelta.aggregateDigest, recoveryPoint.aggregateDigest, "post-backup delta must be non-empty");
  const tableChanges = Object.keys(recoveryPoint.tables).filter((table) =>
    JSON.stringify(recoveryPoint.tables[table]) !== JSON.stringify(postDelta.tables[table])
  ).sort();
  assert.deepEqual(tableChanges, [...EXPECTED_POST_BACKUP_TABLES], "observed post-backup table changes differ from the declared scenario boundary");
  assert.ok(outcomes.length > 0, "post-backup mutation outcome ledger is empty");
  assert.ok(outcomes.every((outcome) => outcome.outcome === "completed"), "post-backup mutation outcome is not unambiguous");
  assert.ok(declaredFacts.length > 0, "declared post-backup facts are empty");
  return {
    classification: "expected future RPO loss",
    recoveryPointDigest: recoveryPoint.aggregateDigest,
    postDeltaDigest: postDelta.aggregateDigest,
    changedTables: tableChanges.map((table) => ({ table, before: recoveryPoint.tables[table], after: postDelta.tables[table] })),
    mutationOutcomes: outcomes,
    declaredFacts,
    allObservedDifferencesAccountedFor: true
  };
}
module.exports = { EXPECTED_POST_BACKUP_TABLES, buildDeltaLedger };
