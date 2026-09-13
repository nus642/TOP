"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { VERSION, COUNTS, COURTS, REFEREES, buildFixture } = require("../rehearsal/field-test-fixture");

test("canonical rehearsal fixture is deterministic, synthetic, and has the promised relationships", () => {
  const first = buildFixture(); const second = buildFixture(); assert.deepEqual(first, second);
  assert.equal(first.version, VERSION); assert.deepEqual(COUNTS, { competitions: 1, pairs: 25, players: 50, matches: 60, courts: 6, referees: 6, rounds: 10 });
  assert.equal(first.schedule.players.length, 50); assert.equal(first.schedule.pairs.length, 25); assert.equal(first.schedule.rounds.length, 10);
  const matches = first.schedule.rounds.flatMap((round) => round.matches); assert.equal(matches.length, 60);
  assert.deepEqual([...new Set(matches.map((match) => match.court))], COURTS); assert.equal(new Set(matches.map((match) => match.fixtureKey)).size, 60);
  assert.deepEqual(first.referees, REFEREES); assert.ok(first.schedule.players.every((player) => /^Synthetic Player \d{2}$/.test(player.name)));
  for (const match of matches) for (const participant of [match.p1, match.p2, match.p3, match.p4]) assert.ok(first.schedule.players.some((player) => player.name === participant));
});

test("evidence schema is committed while generated evidence is ignored", () => {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "../deploy/field-test/evidence/manifest.schema.json"), "utf8"));
  assert.equal(schema.properties.environment.properties.database.const, "modern_field_test_v1"); assert.ok(schema.required.includes("probes")); assert.ok(schema.required.includes("secondWave"));
});

test("stale-version runtime probe is isolated and requires its exact rejection reason", () => {
  const runner = fs.readFileSync(path.join(__dirname, "../rehearsal/full-scale-rehearsal.js"), "utf8");
  assert.match(runner, /const staleTarget = matches\[7\].*REFEREES\[2\]/);
  assert.match(runner, /assert\.equal\(stale\.status, 409\)/);
  assert.match(runner, /assert\.match\(stale\.json\.error.*\^STALE_DISPATCH_VERSION:/);
  assert.match(runner, /assert\.deepEqual\(courtAfterStale, courtBeforeStale\)/);
  assert.match(runner, /controlDispatchSucceeded: true/);
});
