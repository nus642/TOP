const assert = require("node:assert/strict");
const test = require("node:test");

process.env.MYSQL_HOST = process.env.MYSQL_HOST || "localhost";

const competitionService = require("../services/competition.service");
const router = require("../api/competition");

const original = {
    updateMatch: competitionService.updateMatch
};

test.afterEach(() => {
    competitionService.updateMatch = original.updateMatch;
});

function findRoute(path, method) {
    const layer = router.stack.find((candidate) => (
        candidate.route
        && candidate.route.path === path
        && candidate.route.methods[method]
    ));

    return layer.route.stack[0].handle;
}

test("PUT /match/:id passes tournament context to service", async () => {
    const calls = [];
    const handler = findRoute("/match/:id", "put");

    competitionService.updateMatch = async (...args) => {
        calls.push(args);
        return { success: true };
    };

    const req = {
        params: { id: "42" },
        query: { tournamentId: "7" },
        body: { score1: 11, score2: 9, status: "finished" }
    };
    const res = {
        payload: undefined,
        json(payload) {
            this.payload = payload;
        },
        status() {
            return this;
        }
    };

    await handler(req, res);

    assert.deepEqual(calls, [[7, "42", 11, 9, "finished"]]);
    assert.deepEqual(res.payload, { success: true });
});
