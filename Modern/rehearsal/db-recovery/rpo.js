"use strict";
const assert = require("node:assert/strict");
function classify({ recoveryPoint, recovered, deltaLedger }) {
  const exact = JSON.stringify(recoveryPoint) === JSON.stringify(recovered);
  const computedLedger = deltaLedger?.allObservedDifferencesAccountedFor === true &&
    Array.isArray(deltaLedger.changedTables) && deltaLedger.changedTables.length > 0 &&
    deltaLedger.recoveryPointDigest === recoveryPoint.aggregateDigest &&
    deltaLedger.postDeltaDigest !== recoveryPoint.aggregateDigest &&
    Array.isArray(deltaLedger.mutationOutcomes) && deltaLedger.mutationOutcomes.length > 0 &&
    deltaLedger.mutationOutcomes.every((outcome) => outcome.outcome === "completed");
  if (exact && computedLedger) return { classification: "expected RPO loss", corruption: false, declaredPostBackupFactsAbsent: true };
  return { classification: "corruption", corruption: true, declaredPostBackupFactsAbsent: false };
}
function requireExpectedRpo(input) { const result = classify(input); assert.equal(result.corruption, false, "restore outcome is corruption, not expected RPO loss"); return result; }
module.exports = { classify, requireExpectedRpo };
