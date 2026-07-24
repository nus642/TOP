const assert = require("node:assert/strict");
const test = require("node:test");

process.env.MYSQL_HOST = process.env.MYSQL_HOST || "localhost";

const db = require("../database/db");
const matchRepository = require("../repositories/match.repository");

const original = {
    query: db.query
};

test.afterEach(() => {
    db.query = original.query;
});

test("updateMatchScore scopes update by match id and tournament id", async () => {
    let capturedSql;
    let capturedParams;

    db.query = async (sql, params) => {
        capturedSql = sql;
        capturedParams = params;
        return [{ affectedRows: 1 }];
    };

    const result = await matchRepository.updateMatchScore(7, 42, 11, 9, "finished");

    assert.equal(result.affectedRows, 1);
    assert.match(capturedSql, /WHERE id = \?/);
    assert.match(capturedSql, /AND tournament_id = \?/);
    assert.deepEqual(capturedParams, [11, 9, "finished", 42, 7]);
});
