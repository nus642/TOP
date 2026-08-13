const assert = require("node:assert/strict");
const test = require("node:test");

const officialRecordRepository = require("../repositories/match-official-record.repository");
const matchOperationRepository = require("../repositories/match-operation.repository");

test("official record persistence converts an ISO confirmation timestamp to Date", async () => {
  const isoTimestamp = "2026-08-13T14:59:37.007Z";
  const queries = [];
  const connection = {
    async query(sql, values) {
      queries.push({ sql, values });
      if (sql.includes("INSERT INTO match_official_records")) return [{ insertId: 41 }];
      return [[{
        id: 41,
        tournament_id: 2,
        match_id: 1,
        referee_id: "referee-1",
        score1: 11,
        score2: 7,
        confirmed_by: "master-1",
        confirmed_at: new Date(isoTimestamp)
      }]];
    }
  };

  const record = await officialRecordRepository.create({
    tournamentId: 2,
    matchId: 1,
    refereeId: "referee-1",
    score1: 11,
    score2: 7,
    confirmedBy: "master-1",
    confirmedAt: isoTimestamp
  }, connection);

  const persistedTimestamp = queries[0].values[6];
  assert.ok(persistedTimestamp instanceof Date);
  assert.equal(persistedTimestamp.toISOString(), isoTimestamp);
  assert.deepEqual([record.score1, record.score2], [11, 7]);
  assert.equal(record.confirmedBy, "master-1");
});

test("match confirmation updates only the match confirmation fields", async () => {
  const queries = [];
  const connection = {
    async query(sql, values) {
      queries.push({ sql, values });
      if (sql.startsWith("SELECT")) {
        return [[{
          id: 1,
          tournament_id: 2,
          status: "confirmed",
          score1: 11,
          score2: 7,
          result_confirmed_by: "master-1",
          result_confirmed_at: new Date("2026-08-13T14:59:37.007Z")
        }]];
      }
      return [{ affectedRows: 1 }];
    }
  };

  const match = await matchOperationRepository.confirm(2, 1, "master-1", connection);

  assert.equal(queries.length, 2);
  assert.match(queries[0].sql, /^UPDATE matches SET result_confirmed_at/);
  assert.doesNotMatch(queries[0].sql, /match_official_records|INSERT/i);
  assert.deepEqual(queries[0].values, ["master-1", 2, 1]);
  assert.equal(match.status, "confirmed");
  assert.equal(match.resultConfirmedBy, "master-1");
});
