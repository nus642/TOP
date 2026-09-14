"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const fieldTest = require("../rehearsal/field-test-fixture");
const { VERSION, COUNTS, COURTS, REFEREES, buildFixture } = require("../rehearsal/event-scale-fixture");
const { assertNoConcurrentResources, buildUsageEvidence } = require("../rehearsal/event-scale-accounting");
const { validateImportData } = require("../services/schedule-import.service");

test("event-scale fixture has exact deterministic full-event shape", () => {
  const first = buildFixture(); const second = buildFixture();
  assert.deepEqual(first, second);
  assert.equal(first.version, VERSION);
  assert.deepEqual(COUNTS, { competitions: 1, pairs: 40, players: 80, matches: 156, courts: 8, referees: 10, rounds: 20 });
  const matches = first.schedule.rounds.flatMap((round) => round.matches);
  assert.equal(matches.length, 156); assert.equal(first.schedule.players.length, 80); assert.equal(first.schedule.pairs.length, 40);
  assert.deepEqual([...new Set(matches.map((match) => match.court))], COURTS);
  assert.deepEqual(first.referees, REFEREES); assert.equal(new Set(matches.map((match) => match.fixtureKey)).size, 156);
  for (const round of first.schedule.rounds) {
    const courts = round.matches.map((match) => match.court);
    const pairs = round.matches.flatMap((match) => [match.team1, match.team2]);
    const players = round.matches.flatMap((match) => [match.p1, match.p2, match.p3, match.p4]);
    assert.equal(new Set(courts).size, courts.length, `round ${round.round} repeats a court`);
    assert.equal(new Set(pairs).size, pairs.length, `round ${round.round} repeats a pair`);
    assert.equal(new Set(players).size, players.length, `round ${round.round} repeats a player`);
    for (const match of round.matches) {
      assert.notEqual(match.team1, match.team2, `${match.fixtureKey} repeats an opponent`);
      assert.equal(new Set([match.p1, match.p2, match.p3, match.p4]).size, 4, `${match.fixtureKey} repeats a player`);
    }
  }
  assert.deepEqual(validateImportData(first.schedule), { errors: [] });
});

test("event-scale evidence accounting proves every resource participates and turns over", () => {
  const assignments = Array.from({ length: 156 }, (_, index) => ({ courtId: COURTS[index % 8], refereeId: REFEREES[index % 10] }));
  const evidence = buildUsageEvidence(assignments, COURTS, REFEREES);
  assert.equal(evidence.exercisedMatches, 156);
  assert.ok(evidence.allCourtsUsed && evidence.allRefereesUsed && evidence.courtsReused && evidence.refereesReused);
  assert.equal(Object.values(evidence.courtUsage).reduce((sum, count) => sum + count, 0), 156);
  assert.equal(Object.values(evidence.refereeUsage).reduce((sum, count) => sum + count, 0), 156);
});

test("concurrent-resource integrity check rejects duplicate courts and referees", () => {
  assert.doesNotThrow(() => assertNoConcurrentResources([
    { courtId: "C1", refereeId: "R1" }, { courtId: "C2", refereeId: "R2" }
  ]));
  assert.throws(() => assertNoConcurrentResources([
    { courtId: "C1", refereeId: "R1" }, { courtId: "C1", refereeId: "R2" }
  ]), /court has multiple concurrent/);
  assert.throws(() => assertNoConcurrentResources([
    { courtId: "C1", refereeId: "R1" }, { courtId: "C2", refereeId: "R1" }
  ]), /referee has multiple concurrent/);
});

test("event-scale remains separate and preserves integrity probes", () => {
  assert.deepEqual(fieldTest.COUNTS, { competitions: 1, pairs: 25, players: 50, matches: 60, courts: 6, referees: 6, rounds: 10 });
  const runner = fs.readFileSync(path.join(__dirname, "../rehearsal/event-scale-rehearsal.js"), "utf8");
  assert.match(runner, /sameCourtContention/); assert.match(runner, /STALE_DISPATCH_VERSION/);
  assert.match(runner, /assertNoConcurrentResources\(dispatched\.map/);
  assert.match(runner, /confirmed, COUNTS\.matches/);
});
