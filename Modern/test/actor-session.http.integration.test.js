const assert = require("node:assert/strict");
const test = require("node:test");

const matchOperations = require("../services/match-operations.service");
const { createApp } = require("../server");

async function withServer(run) {
  const server = createApp().listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("foundation establishment, session/me, and a protected workflow share minimal identity", async (t) => {
  const original = matchOperations.getRefereeWorkflow;
  t.after(() => { matchOperations.getRefereeWorkflow = original; });
  matchOperations.getRefereeWorkflow = async (tournamentId, refereeId) => ({ tournamentId, refereeId, matches: [] });

  await withServer(async (baseUrl) => {
    const established = await fetch(`${baseUrl}/api/session/foundation-establish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actorId: "referee-7", actorType: "referee", permissions: ["ignored"] })
    });
    assert.equal(established.status, 201);
    const cookie = established.headers.get("set-cookie").split(";")[0];

    const me = await fetch(`${baseUrl}/api/session/me`, { headers: { cookie } });
    assert.equal(me.status, 200);
    assert.deepEqual(await me.json(), { actorId: "referee-7", actorType: "referee" });

    const workflow = await fetch(`${baseUrl}/api/match-operations/3/referees/referee-7/matches`, { headers: { cookie } });
    assert.equal(workflow.status, 200);
    assert.deepEqual(await workflow.json(), { tournamentId: "3", refereeId: "referee-7", matches: [] });

    const mismatch = await fetch(`${baseUrl}/api/match-operations/3/referees/referee-8/matches`, { headers: { cookie } });
    assert.equal(mismatch.status, 401);
  });
});

test("session/me and protected workflows reject missing or invalid sessions", async () => {
  await withServer(async (baseUrl) => {
    for (const path of ["/api/session/me", "/api/match-operations/3/referees/referee-7/matches"]) {
      assert.equal((await fetch(`${baseUrl}${path}`)).status, 401);
      assert.equal((await fetch(`${baseUrl}${path}`, {
        headers: { cookie: `top_actor_session=${"a".repeat(43)}` }
      })).status, 401);
    }
  });
});
