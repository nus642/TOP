const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const matchOperationsService = require("../services/match-operations.service");

function cloneState(state) {
  return {
    match: { ...state.match },
    officialRecords: state.officialRecords.map((record) => ({ ...record }))
  };
}

function transactionalHarness(initialState, { failMatchUpdate = false } = {}) {
  let committed = cloneState(initialState);

  return {
    state() { return cloneState(committed); },
    async withTransaction(work) {
      const pending = cloneState(committed);
      const connection = {
        async query(sql, values) {
          if (sql.startsWith("SELECT * FROM matches")) {
            const match = pending.match;
            return [[{
              id: match.id,
              tournament_id: match.tournamentId,
              referee_id: match.refereeId,
              status: match.status,
              score1: match.score1,
              score2: match.score2,
              result_confirmed_at: match.resultConfirmedAt,
              result_confirmed_by: match.resultConfirmedBy
            }]];
          }

          if (sql.includes("INSERT INTO match_official_records")) {
            const confirmedAt = values[6];
            assert.ok(confirmedAt instanceof Date, "mysql2 must receive a Date");
            const record = {
              id: pending.officialRecords.length + 1,
              tournament_id: values[0],
              match_id: values[1],
              referee_id: values[2],
              score1: values[3],
              score2: values[4],
              confirmed_by: values[5],
              confirmed_at: confirmedAt,
              confirmation_responsibility: values[7],
              evidence_reference: values[8],
              evidence_metadata: values[9],
              provenance: values[10]
            };
            pending.officialRecords.push(record);
            return [{ insertId: record.id }];
          }

          if (sql.startsWith("SELECT * FROM match_official_records WHERE id")) {
            return [[pending.officialRecords.find((record) => record.id === values[0])]];
          }

          if (sql.startsWith("UPDATE matches SET result_confirmed_at")) {
            if (failMatchUpdate) throw new Error("simulated match confirmation update failure");
            pending.match = {
              ...pending.match,
              status: "confirmed",
              resultConfirmedAt: new Date("2026-08-13T14:59:37.007Z"),
              resultConfirmedBy: values[0]
            };
            return [{ affectedRows: 1 }];
          }

          throw new Error(`Unexpected SQL in transaction harness: ${sql}`);
        }
      };

      const result = await work(connection);
      committed = pending;
      return result;
    }
  };
}

function scoredMatch() {
  return {
    match: {
      id: 1,
      tournamentId: 2,
      refereeId: "referee-1",
      status: "scored",
      score1: 11,
      score2: 7,
      resultConfirmedAt: null,
      resultConfirmedBy: null
    },
    officialRecords: []
  };
}

test("confirmResult atomically persists one official 11-7 record and confirms the match", async (t) => {
  const originalTransaction = db.withTransaction;
  const harness = transactionalHarness(scoredMatch());
  db.withTransaction = harness.withTransaction;
  t.after(() => { db.withTransaction = originalTransaction; });

  const result = await matchOperationsService.confirmResult(2, 1, {
    actorId: "master-1",
    actorType: "master"
  });

  const state = harness.state();
  assert.equal(result.match.status, "confirmed");
  assert.equal(state.match.status, "confirmed");
  assert.equal(state.match.resultConfirmedBy, "master-1");
  assert.equal(state.officialRecords.length, 1);
  assert.deepEqual(
    [state.officialRecords[0].score1, state.officialRecords[0].score2],
    [11, 7]
  );
  assert.equal(state.officialRecords[0].confirmed_by, "master-1");
  assert.ok(state.officialRecords[0].confirmed_at instanceof Date);

  await assert.rejects(
    matchOperationsService.confirmResult(2, 1, { actorId: "master-1", actorType: "master" }),
    /recorded result is required before confirmation/i
  );
  assert.equal(harness.state().officialRecords.length, 1);
});

test("confirmResult rolls back the official record when the match update fails", async (t) => {
  const originalTransaction = db.withTransaction;
  const harness = transactionalHarness(scoredMatch(), { failMatchUpdate: true });
  db.withTransaction = harness.withTransaction;
  t.after(() => { db.withTransaction = originalTransaction; });

  await assert.rejects(
    matchOperationsService.confirmResult(2, 1, { actorId: "master-1", actorType: "master" }),
    /simulated match confirmation update failure/
  );

  const state = harness.state();
  assert.equal(state.match.status, "scored");
  assert.equal(state.match.resultConfirmedBy, null);
  assert.equal(state.officialRecords.length, 0);
});
