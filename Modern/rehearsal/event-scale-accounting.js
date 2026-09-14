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

function assertNoConcurrentResources(assignments) {
  const courts = assignments.map(({ courtId }) => courtId);
  const referees = assignments.map(({ refereeId }) => refereeId);
  if (new Set(courts).size !== courts.length) throw new Error("a court has multiple concurrent active matches");
  if (new Set(referees).size !== referees.length) throw new Error("a referee has multiple concurrent active matches");
}

function waveEntryName(waveNumber, entryIndex, matchId) {
  return `wave${waveNumber}:entry${entryIndex}:match${matchId}`;
}

module.exports = { assertNoConcurrentResources, buildUsageEvidence, waveEntryName };
