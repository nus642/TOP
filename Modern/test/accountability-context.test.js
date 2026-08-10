"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { createAccountabilityContext, HEADER_NAMES } = require("../shell/accountability-context");
const { createRefereeApi } = require("../operator/api-client");
const { createMasterApi } = require("../operator/master-api-client");
const { createParticipantReadinessApi } = require("../participant/api-client");

function context(value) {
  return createAccountabilityContext({ current: () => value });
}

const response = () => ({ ok: true, json: async () => ({ matches: [] }) });

test("authenticated actor and active competition flow through accountability metadata", () => {
  const accountability = context({
    actor: Object.freeze({ actorId: "referee-7", actorType: "referee" }),
    competitionId: "competition-3"
  });
  assert.deepEqual(accountability.current(), {
    actorId: "referee-7", actorType: "referee", competitionId: "competition-3"
  });
  assert.deepEqual(accountability.headers(), {
    [HEADER_NAMES.actorId]: "referee-7",
    [HEADER_NAMES.actorType]: "referee",
    [HEADER_NAMES.competitionId]: "competition-3"
  });
  assert.equal(Object.isFrozen(accountability.current()), true);
});

test("accountability metadata cannot replace authenticated actor identity", () => {
  const actor = Object.freeze({ actorId: "master-2", actorType: "master" });
  const accountability = context({ actor, competitionId: "competition-3" });
  const metadata = accountability.current();
  assert.throws(() => { metadata.actorId = "spoofed"; }, TypeError);
  assert.equal(accountability.current().actorId, "master-2");
});

test("operator clients preserve existing API delegation and add request metadata", async () => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => { calls.push([url, options]); return response(); };
  const accountabilityContext = context({
    actor: { actorId: "operator-1", actorType: "master" }, competitionId: "competition-3"
  });
  await createRefereeApi({ fetchImpl, accountabilityContext }).accept("competition-3", "referee-7", "match-9");
  await createMasterApi({ fetchImpl, accountabilityContext }).assignReferee("competition-3", "match-9", "referee-7");
  await createParticipantReadinessApi({ fetchImpl, accountabilityContext }).checkIn("competition-3", "participant-8");
  assert.deepEqual(calls.map(([url]) => url), [
    "/api/referee-workflow/competition-3/referees/referee-7/matches/match-9/accept",
    "/api/master-workflow/competition-3/matches/match-9/assign",
    "/api/participant-readiness/competition-3/participants/participant-8/check-in"
  ]);
  for (const [, options] of calls) {
    assert.equal(options.method, "POST");
    assert.equal(options.headers[HEADER_NAMES.actorId], "operator-1");
    assert.equal(options.headers[HEADER_NAMES.competitionId], "competition-3");
  }
  assert.equal(JSON.parse(calls[1][1].body).refereeId, "referee-7");
});

test("accountability foundation contains metadata only and no domain authority", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "shell", "accountability-context.js"), "utf8");
  assert.doesNotMatch(source, /services|repositories|engine|database|authori[sz]|permission|rbac|transition|allow|deny/i);
  assert.match(source, /ResponsibilityContext|responsibilityContext/);
});
