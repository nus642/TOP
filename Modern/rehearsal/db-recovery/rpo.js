"use strict";
const assert = require("node:assert/strict");
function classify({ recoveryPoint, recovered, declaredFactsAbsent, observedDelta, declaredDelta }) {
  const exact = JSON.stringify(recoveryPoint) === JSON.stringify(recovered);
  const accounted = JSON.stringify(observedDelta) === JSON.stringify(declaredDelta);
  if (exact && declaredFactsAbsent === true && accounted) return { classification: "expected RPO loss", corruption: false };
  return { classification: "corruption", corruption: true };
}
function requireExpectedRpo(input) { const result = classify(input); assert.equal(result.corruption, false, "restore outcome is corruption, not expected RPO loss"); return result; }
module.exports = { classify, requireExpectedRpo };
