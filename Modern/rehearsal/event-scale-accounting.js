"use strict";

function buildUsageEvidence(assignments, courts, referees) {
  const courtUsage = Object.fromEntries(courts.map((id) => [id, 0]));
  const refereeUsage = Object.fromEntries(referees.map((id) => [id, 0]));
  for (const { courtId, refereeId } of assignments) {
    if (!(courtId in courtUsage) || !(refereeId in refereeUsage)) throw new Error("assignment contains an unknown rehearsal resource");
    courtUsage[courtId] += 1;
    refereeUsage[refereeId] += 1;
  }
  return {
    exercisedMatches: assignments.length,
    courtUsage,
    refereeUsage,
    allCourtsUsed: Object.values(courtUsage).every((count) => count > 0),
    allRefereesUsed: Object.values(refereeUsage).every((count) => count > 0),
    courtsReused: Object.values(courtUsage).every((count) => count > 1),
    refereesReused: Object.values(refereeUsage).every((count) => count > 1)
  };
}

module.exports = { buildUsageEvidence };
