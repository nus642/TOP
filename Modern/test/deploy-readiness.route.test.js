const assert = require("node:assert/strict");
const test = require("node:test");

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

async function establishSession(baseUrl, actorId, actorType) {
  const response = await fetch(`${baseUrl}/api/session/foundation-establish`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ actorId, actorType })
  });
  return response.headers.get("set-cookie").split(";")[0];
}

// Audit Minor #4-1: check-in-all endpoint rejects unauthenticated requests
test("check-in-all endpoint returns 401 without a session", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/master-workflow/1/check-in-all`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    });
    assert.equal(response.status, 401);
  });
});

// Audit Minor #4-2: schedule CRUD endpoints reject non-master actors with 403
test("schedule CRUD endpoints return 403 for a referee session", async () => {
  await withServer(async (baseUrl) => {
    const cookie = await establishSession(baseUrl, "referee-1", "referee");

    const post = await fetch(`${baseUrl}/api/competition/1/schedule/matches`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ roundNum: 1, court: "A1", scheduledAt: "2026-08-20T10:00:00Z", p1: "A", p2: "B", p3: "C", p4: "D" })
    });
    assert.equal(post.status, 403);

    const put = await fetch(`${baseUrl}/api/competition/1/schedule/matches/5`, {
      method: "PUT",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify({ roundNum: 1, court: "A1", scheduledAt: "2026-08-20T10:00:00Z", p1: "A", p2: "B", p3: "C", p4: "D" })
    });
    assert.equal(put.status, 403);

    const del = await fetch(`${baseUrl}/api/competition/1/schedule/matches/5`, {
      method: "DELETE",
      headers: { cookie }
    });
    assert.equal(del.status, 403);
  });
});

// Audit Minor #4-3: schedule CRUD endpoints reject unauthenticated requests
test("schedule CRUD endpoints return 401 without a session", async () => {
  await withServer(async (baseUrl) => {
    const post = await fetch(`${baseUrl}/api/competition/1/schedule/matches`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roundNum: 1 })
    });
    assert.equal(post.status, 401);

    const put = await fetch(`${baseUrl}/api/competition/1/schedule/matches/5`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roundNum: 1 })
    });
    assert.equal(put.status, 401);

    const del = await fetch(`${baseUrl}/api/competition/1/schedule/matches/5`, {
      method: "DELETE"
    });
    assert.equal(del.status, 401);
  });
});
