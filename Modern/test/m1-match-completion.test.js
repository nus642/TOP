const assert = require("node:assert/strict");
const test = require("node:test");

const { MatchOperation } = require("../engine/operations/domain");

const playing = () => new MatchOperation({
  id: 9, tournamentId: 3, refereeId: "referee-7", status: "playing"
});

test("assigned referee submits and master confirms the result", () => {
  const match = playing();
  match.submitResult({ actorId: "referee-7", actorType: "referee" }, 11, 8);
  assert.equal(match.status, "scored");
  match.confirmResult({ actorId: "master-1", actorType: "master" });
  assert.equal(match.status, "confirmed");
});

test("match completion rejects actors outside each operation responsibility", () => {
  assert.throws(
    () => playing().submitResult({ actorId: "master-1", actorType: "master" }, 11, 8),
    (error) => error.code === "INVALID_OPERATION_ACTOR"
  );
  const scored = playing().submitResult({ actorId: "referee-7", actorType: "referee" }, 11, 8);
  assert.throws(
    () => scored.confirmResult({ actorId: "referee-7", actorType: "referee" }),
    (error) => error.code === "INVALID_OPERATION_ACTOR"
  );
});

test("match completion rejects skipped and repeated transitions", () => {
  assert.throws(
    () => playing().confirmResult({ actorId: "master-1", actorType: "master" }),
    (error) => error.code === "INVALID_OPERATION_STATE"
  );
  const scored = playing().submitResult({ actorId: "referee-7", actorType: "referee" }, 11, 8);
  assert.throws(
    () => scored.submitResult({ actorId: "referee-7", actorType: "referee" }, 11, 8),
    (error) => error.code === "INVALID_OPERATION_STATE"
  );
});
