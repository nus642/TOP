const assert = require("node:assert/strict");
const test = require("node:test");

process.env.MYSQL_HOST = process.env.MYSQL_HOST || "localhost";

const competitionService = require("../services/competition.service");
const router = require("../api/competition");

const original = {
    createCompetition: competitionService.createCompetition,
    getCompetition: competitionService.getCompetition,
    saveSchedule: competitionService.saveSchedule,
    transitionCompetition: competitionService.transitionCompetition,
    updateMatch: competitionService.updateMatch
};

test.afterEach(() => {
    competitionService.createCompetition = original.createCompetition;
    competitionService.getCompetition = original.getCompetition;
    competitionService.saveSchedule = original.saveSchedule;
    competitionService.transitionCompetition = original.transitionCompetition;
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

function createResponse() {
    return {
        payload: undefined,
        statusCode: 200,
        json(payload) {
            this.payload = payload;
            return this;
        },
        status(statusCode) {
            this.statusCode = statusCode;
            return this;
        }
    };
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
    const res = createResponse();

    await handler(req, res);

    assert.deepEqual(calls, [[7, "42", 11, 9, "finished"]]);
    assert.deepEqual(res.payload, { success: true });
});

test("PUT /match/:id uses the legacy default tournament context", async () => {
    const handler = findRoute("/match/:id", "put");
    let receivedTournamentId;

    competitionService.updateMatch = async (tournamentId) => {
        receivedTournamentId = tournamentId;
        return { success: true };
    };

    const res = createResponse();
    await handler({ params: { id: "42" }, query: {}, body: {} }, res);

    assert.equal(receivedTournamentId, 1);
    assert.equal(res.statusCode, 200);
});

test("GET / passes numeric tournament context to the read service", async () => {
    const handler = findRoute("/", "get");
    let receivedTournamentId;

    competitionService.getCompetition = async (tournamentId) => {
        receivedTournamentId = tournamentId;
        return { tournament: { id: tournamentId } };
    };

    const res = createResponse();
    await handler({ query: { tournamentId: "19" } }, res);

    assert.equal(receivedTournamentId, 19);
    assert.deepEqual(res.payload, { tournament: { id: 19 } });
});

test("POST / returns 201 with the created competition", async () => {
    const handler = findRoute("/", "post");
    const body = { name: "Summer Open", sport: "pickleball" };

    competitionService.createCompetition = async (data) => ({
        competition: { id: 21, ...data }
    });

    const res = createResponse();
    await handler({ body }, res);

    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.payload, {
        competition: { id: 21, name: "Summer Open", sport: "pickleball" }
    });
});

test("POST /:id/transition maps validation errors to HTTP 400", async () => {
    const handler = findRoute("/:id/transition", "post");
    const error = new Error("Invalid lifecycle transition");
    error.code = "VALIDATION_ERROR";
    competitionService.transitionCompetition = async () => {
        throw error;
    };

    const res = createResponse();
    await handler({ params: { id: "7" }, body: { status: "completed" } }, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.payload, { error: "Invalid lifecycle transition" });
});

test("PUT /match/:id maps missing scoped matches to HTTP 404", async () => {
    const handler = findRoute("/match/:id", "put");
    const error = new Error("Match not found");
    error.code = "NOT_FOUND";
    competitionService.updateMatch = async () => {
        throw error;
    };

    const res = createResponse();
    await handler({ params: { id: "404" }, query: { tournamentId: "7" }, body: {} }, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.payload, { error: "Match not found" });
});

test("POST /save preserves explicit tournament context", async () => {
    const handler = findRoute("/save", "post");
    const body = { rounds: [] };
    const calls = [];

    competitionService.saveSchedule = async (...args) => {
        calls.push(args);
        return { success: true };
    };

    const res = createResponse();
    await handler({ query: { tournamentId: "23" }, body }, res);

    assert.deepEqual(calls, [[23, body]]);
    assert.deepEqual(res.payload, { success: true });
});

test("POST /:competitionId/schedule passes scoped competition context to the schedule service", async () => {
    const handler = findRoute("/:competitionId/schedule", "post");
    const body = { tournamentId: 99, rounds: [] };
    const calls = [];

    competitionService.saveSchedule = async (...args) => {
        calls.push(args);
        return { success: true };
    };

    const res = createResponse();
    await handler({ params: { competitionId: "23" }, body }, res);

    assert.deepEqual(calls, [[23, body]]);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload, { success: true });
});

for (const invalidCompetitionId of ["abc", "0", "-1", "1.5"]) {
    test(`POST /:competitionId/schedule rejects invalid competition id ${invalidCompetitionId}`, async () => {
        const handler = findRoute("/:competitionId/schedule", "post");
        let serviceCalled = false;

        competitionService.saveSchedule = async () => {
            serviceCalled = true;
        };

        const res = createResponse();
        await handler({ params: { competitionId: invalidCompetitionId }, body: {} }, res);

        assert.equal(serviceCalled, false);
        assert.equal(res.statusCode, 400);
        assert.deepEqual(res.payload, { error: "Valid competition id is required" });
    });
}

test("POST /:competitionId/schedule maps an unknown competition to HTTP 404", async () => {
    const handler = findRoute("/:competitionId/schedule", "post");
    const error = new Error("Competition not found");
    error.code = "NOT_FOUND";
    competitionService.saveSchedule = async () => {
        throw error;
    };

    const res = createResponse();
    await handler({ params: { competitionId: "404" }, body: { rounds: [] } }, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.payload, { error: "Competition not found" });
});
