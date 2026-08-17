const assert = require("node:assert/strict");
const test = require("node:test");

const refereeCoordinationService = require("../services/referee-coordination.service");
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

test("public referee roster lists active referee names without a session", async (t) => {
  const original = refereeCoordinationService.listRoster;
  t.after(() => { refereeCoordinationService.listRoster = original; });
  refereeCoordinationService.listRoster = async (competitionId) => {
    assert.equal(competitionId, "7");
    return [
      { refereeId: "张三", active: true, eligible: true },
      { refereeId: "李四", active: false, eligible: true }
    ];
  };

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/public/competitions/7/referee-roster`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { competitionId: "7", referees: ["张三"] });
  });
});

test("public referee roster rejects invalid competition ids without a session", async () => {
  await withServer(async (baseUrl) => {
    for (const bad of ["abc", "0", "-1"]) {
      const response = await fetch(`${baseUrl}/api/public/competitions/${bad}/referee-roster`);
      assert.equal(response.status, 400);
    }
  });
});
