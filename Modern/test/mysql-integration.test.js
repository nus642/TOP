/**
 * Real MySQL Integration Test for PR #144 — Atomic Dispatch (v2)
 *
 * Every test creates its OWN isolated competition with dedicated courts, referees,
 * and matches so that no state leaks between tests.
 *
 * Coverage:
 *  1. Court contention: two concurrent dispatches for same court → exactly one succeeds
 *  2. Referee contention: two concurrent dispatches for same referee → exactly one succeeds
 *  3. Stale expectedVersion → zero partial writes (409 CONFLICT)
 *  4. Duplicate correlationId → idempotent return, no duplicate reservation/chronology
 *  5. dispatch → accept: both succeed with independent chronology rows
 *  6. Resource retention: after accept, court/referee blocked until scored
 *  7. dispatch → withdraw: both succeed with independent chronology rows
 *  8. Migration re-run: execute migration SQL twice, verify idempotency
 *
 * Usage:
 *   node test/mysql-integration.test.js
 *
 * Environment variables:
 *   MYSQL_HOST (default: localhost)
 *   MYSQL_PORT (default: 3306)
 *   MYSQL_USER (default: root)
 *   MYSQL_PASS (default: 123456)
 *   MYSQL_DB   (default: nhpa_test — uses a dedicated test DB to avoid polluting production)
 *   MYSQL_FORCE (set to "true" to allow running against non-test databases — USE WITH CAUTION)
 */

const { test } = require("node:test");
const assert = require("node:assert");
const mysql = require("mysql2/promise");
const fs = require("node:fs");
const path = require("node:path");

const TARGET_DB = process.env.MYSQL_DB || "nhpa_test";

// Safety guard: refuse to run against non-test databases unless explicitly forced
const TEST_DB_PATTERNS = ["test", "sandbox", "dev", "staging", "tmp"];
const isTestDb = TEST_DB_PATTERNS.some(p => TARGET_DB.toLowerCase().includes(p));
const forceRun = process.env.MYSQL_FORCE === "true";

if (!isTestDb && !forceRun) {
  console.error(`\nERROR: Refusing to run integration tests against database "${TARGET_DB}".`);
  console.error(`The database name must contain one of: ${TEST_DB_PATTERNS.join(", ")}`);
  console.error(`Set MYSQL_DB=nhpa_test or set MYSQL_FORCE=true to override.\n`);
  process.exit(1);
}

const DB_CONFIG = {
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || "root",
  password: process.env.MYSQL_PASS || "123456",
  database: TARGET_DB,
  multipleStatements: true
};

let pool;
let mysqlAvailable = false;

// --- MySQL availability check ---
async function checkMySQL() {
  try {
    const conn = await mysql.createConnection({ ...DB_CONFIG, multipleStatements: false });
    await conn.query("SELECT 1");
    await conn.end();
    return true;
  } catch (e) {
    return false;
  }
}

// --- Isolated test environment ---
// Each test creates its own competition, matches, schedules, and referees.
// Returns helpers for dispatch/accept/withdraw calls.
async function createTestEnv(label, opts = {}) {
  const courtCount = opts.courts || 2;
  const matchCount = opts.matches || 4;
  const refereeIds = opts.referees || ["referee-a", "referee-b", "referee-c"];

  const [compResult] = await pool.query(
    "INSERT INTO tournaments (name, status) VALUES (?, 'running')",
    [`Integration-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`]
  );
  const competitionId = compResult.insertId;

  const matchIds = [];
  const courts = [];
  for (let c = 1; c <= courtCount; c++) courts.push(`court-${label}-${c}`);

  for (let i = 0; i < matchCount; i++) {
    const courtId = courts[i % courtCount];
    const [m] = await pool.query(
      "INSERT INTO matches (tournament_id, round_num, court, status) VALUES (?, ?, ?, 'idle')",
      [competitionId, i + 1, courtId]
    );
    matchIds.push(m.insertId);
    await pool.query(
      "INSERT INTO match_schedules (tournament_id, match_id, scheduled_at, court_id) VALUES (?, ?, NOW() + INTERVAL ? HOUR, ?)",
      [competitionId, m.insertId, i + 1, courtId]
    );
  }

  for (const refId of refereeIds) {
    await pool.query(
      "INSERT IGNORE INTO competition_referees (competition_id, referee_id, active, eligible) VALUES (?, ?, TRUE, TRUE)",
      [competitionId, refId]
    );
  }

  return {
    competitionId, matchIds, courts, refereeIds,
    cleanup: async () => {
      try {
        await pool.query("DELETE FROM tournament_coordination_chronology WHERE tournament_id = ?", [competitionId]);
        await pool.query("DELETE FROM referee_dispatch_reservations WHERE competition_id = ?", [competitionId]);
        await pool.query("DELETE FROM competition_referees WHERE competition_id = ?", [competitionId]);
        await pool.query("DELETE FROM match_schedules WHERE tournament_id = ?", [competitionId]);
        await pool.query("DELETE FROM matches WHERE tournament_id = ?", [competitionId]);
        await pool.query("DELETE FROM tournaments WHERE id = ?", [competitionId]);
      } catch (e) { /* best effort */ }
    }
  };
}

function masterActor() {
  return { actorId: "master-int", actorType: "master" };
}
function refereeActor(id) {
  return { actorId: id, actorType: "referee" };
}

const dispatchService = require("../services/dispatch.service");

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("MySQL: connectivity", async (t) => {
  mysqlAvailable = await checkMySQL();
  if (!mysqlAvailable) {
    t.skip("MySQL not available — set MYSQL_HOST/PORT/USER/PASS/DB to run");
    return;
  }
  pool = mysql.createPool(DB_CONFIG);
  const [rows] = await pool.query("SELECT 1 AS ok");
  assert.equal(rows[0].ok, 1);
});

// --- Test 1: Court contention ---
test("MySQL: two concurrent dispatches same court → one succeeds", async (t) => {
  if (!mysqlAvailable) { t.skip("MySQL not available"); return; }
  const env = await createTestEnv("court");
  try {
    const [m1, m2] = env.matchIds;
    const results = await Promise.allSettled([
      dispatchService.dispatch(env.competitionId, m1, {
        courtId: env.courts[0], refereeId: env.refereeIds[0],
        correlationId: `court-corr-1`, expectedVersion: 0
      }, masterActor()),
      dispatchService.dispatch(env.competitionId, m2, {
        courtId: env.courts[0], refereeId: env.refereeIds[1],
        correlationId: `court-corr-2`, expectedVersion: 0
      }, masterActor())
    ]);
    const ok = results.filter(r => r.status === "fulfilled");
    const fail = results.filter(r => r.status === "rejected");
    assert.equal(ok.length, 1, "Exactly one dispatch succeeds");
    assert.equal(fail.length, 1, "Exactly one dispatch fails");
    assert.match(fail[0].reason.message, /COURT_CONFLICT/);
  } finally { await env.cleanup(); }
});

// --- Test 2: Referee contention ---
test("MySQL: two concurrent dispatches same referee → one succeeds", async (t) => {
  if (!mysqlAvailable) { t.skip("MySQL not available"); return; }
  const env = await createTestEnv("ref");
  try {
    const [m1, m2] = env.matchIds;
    // Use different courts to isolate referee conflict
    const results = await Promise.allSettled([
      dispatchService.dispatch(env.competitionId, m1, {
        courtId: env.courts[0], refereeId: env.refereeIds[0],
        correlationId: `ref-corr-1`, expectedVersion: 0
      }, masterActor()),
      dispatchService.dispatch(env.competitionId, m2, {
        courtId: env.courts[1], refereeId: env.refereeIds[0],
        correlationId: `ref-corr-2`, expectedVersion: 0
      }, masterActor())
    ]);
    const ok = results.filter(r => r.status === "fulfilled");
    const fail = results.filter(r => r.status === "rejected");
    assert.equal(ok.length, 1, "Exactly one dispatch succeeds");
    assert.equal(fail.length, 1, "Exactly one dispatch fails");
    assert.match(fail[0].reason.message, /REFEREE_CONFLICT/);
  } finally { await env.cleanup(); }
});

// --- Test 3: Stale expectedVersion → zero writes ---
test("MySQL: stale expectedVersion → zero partial writes", async (t) => {
  if (!mysqlAvailable) { t.skip("MySQL not available"); return; }
  const env = await createTestEnv("stale");
  try {
    const [m1, m2] = env.matchIds;
    // First dispatch succeeds
    await dispatchService.dispatch(env.competitionId, m1, {
      courtId: env.courts[0], refereeId: env.refereeIds[0],
      correlationId: `stale-ok`, expectedVersion: 0
    }, masterActor());

    // Second dispatch on different match with stale version (different court to avoid COURT_CONFLICT)
    try {
      await dispatchService.dispatch(env.competitionId, m2, {
        courtId: env.courts[1], refereeId: env.refereeIds[1],
        correlationId: `stale-fail`, expectedVersion: 99
      }, masterActor());
      assert.fail("Should have thrown");
    } catch (error) {
      assert.equal(error.code, "CONFLICT");
      assert.match(error.message, /STALE_DISPATCH_VERSION/);
    }

    // Verify m2 untouched
    const [rows] = await pool.query("SELECT * FROM matches WHERE id = ?", [m2]);
    assert.equal(rows[0].status, "idle");
    assert.equal(rows[0].dispatch_id, null);

    // Verify no reservation for m2
    const [res] = await pool.query(
      "SELECT * FROM referee_dispatch_reservations WHERE match_id = ?", [m2]);
    assert.equal(res.length, 0);
  } finally { await env.cleanup(); }
});

// --- Test 4: Duplicate correlationId → idempotent ---
test("MySQL: duplicate correlationId → idempotent return", async (t) => {
  if (!mysqlAvailable) { t.skip("MySQL not available"); return; }
  const env = await createTestEnv("idem");
  try {
    const [m1] = env.matchIds;
    const r1 = await dispatchService.dispatch(env.competitionId, m1, {
      courtId: env.courts[0], refereeId: env.refereeIds[0],
      correlationId: `idem-corr`, expectedVersion: 0
    }, masterActor());
    assert.equal(r1.idempotent, false);

    const [resBefore] = await pool.query(
      "SELECT * FROM referee_dispatch_reservations WHERE competition_id = ? AND correlation_id = ?",
      [env.competitionId, "idem-corr"]);
    const [chrBefore] = await pool.query(
      "SELECT * FROM tournament_coordination_chronology WHERE tournament_id = ? AND correlation_id = ?",
      [env.competitionId, "idem-corr"]);

    const r2 = await dispatchService.dispatch(env.competitionId, m1, {
      courtId: env.courts[0], refereeId: env.refereeIds[0],
      correlationId: `idem-corr`, expectedVersion: 0
    }, masterActor());
    assert.equal(r2.idempotent, true);

    const [resAfter] = await pool.query(
      "SELECT * FROM referee_dispatch_reservations WHERE competition_id = ? AND correlation_id = ?",
      [env.competitionId, "idem-corr"]);
    const [chrAfter] = await pool.query(
      "SELECT * FROM tournament_coordination_chronology WHERE tournament_id = ? AND correlation_id = ?",
      [env.competitionId, "idem-corr"]);
    assert.equal(resAfter.length, resBefore.length, "No duplicate reservation");
    assert.equal(chrAfter.length, chrBefore.length, "No duplicate chronology");
  } finally { await env.cleanup(); }
});

// --- Test 5: dispatch → accept with independent chronology ---
test("MySQL: dispatch → accept succeeds with independent chronology", async (t) => {
  if (!mysqlAvailable) { t.skip("MySQL not available"); return; }
  const env = await createTestEnv("accept");
  try {
    const [m1] = env.matchIds;

    // Dispatch
    const dispatchResult = await dispatchService.dispatch(env.competitionId, m1, {
      courtId: env.courts[0], refereeId: env.refereeIds[0],
      correlationId: `accept-dispatch`, expectedVersion: 0
    }, masterActor());
    assert.equal(dispatchResult.idempotent, false);

    // Verify dispatch chronology
    const [dispatchChron] = await pool.query(
      "SELECT * FROM tournament_coordination_chronology WHERE tournament_id = ? AND correlation_id = ?",
      [env.competitionId, "accept-dispatch"]);
    assert.equal(dispatchChron.length, 1);
    assert.equal(dispatchChron[0].event_type, "referee_dispatch");

    // Get dispatch version for accept
    const [matchRows] = await pool.query("SELECT * FROM matches WHERE id = ?", [m1]);
    assert.equal(matchRows[0].status, "assigned");
    const currentVersion = matchRows[0].dispatch_version;

    // Accept (uses a NEW correlationId for its chronology)
    const acceptResult = await dispatchService.acceptDispatch(env.competitionId, m1,
      refereeActor(env.refereeIds[0]),
      { expectedVersion: currentVersion, correlationId: "accept-event" }
    );
    assert.equal(acceptResult.match.status, "accepted");

    // Verify accept chronology is a SEPARATE row
    const [acceptChron] = await pool.query(
      "SELECT * FROM tournament_coordination_chronology WHERE tournament_id = ? AND correlation_id = ?",
      [env.competitionId, "accept-event"]);
    assert.equal(acceptChron.length, 1);
    assert.equal(acceptChron[0].event_type, "referee_acceptance");

    // Verify both chronology rows exist with different correlationIds
    const [allChron] = await pool.query(
      "SELECT * FROM tournament_coordination_chronology WHERE tournament_id = ? ORDER BY id",
      [env.competitionId]);
    assert.ok(allChron.length >= 2, "At least 2 chronology rows (dispatch + accept)");
  } finally { await env.cleanup(); }
});

// --- Test 6: Resource retention after accept ---
test("MySQL: after accept, court/referee blocked until scored", async (t) => {
  if (!mysqlAvailable) { t.skip("MySQL not available"); return; }
  const env = await createTestEnv("retain", { courts: 2, matches: 4 });
  try {
    const [m1, m2, m3] = env.matchIds;

    // Dispatch m1
    await dispatchService.dispatch(env.competitionId, m1, {
      courtId: env.courts[0], refereeId: env.refereeIds[0],
      correlationId: `retain-dispatch`, expectedVersion: 0
    }, masterActor());

    // Accept m1
    const [matchAfterDispatch] = await pool.query("SELECT * FROM matches WHERE id = ?", [m1]);
    await dispatchService.acceptDispatch(env.competitionId, m1,
      refereeActor(env.refereeIds[0]),
      { expectedVersion: matchAfterDispatch[0].dispatch_version, correlationId: "retain-accept" }
    );

    // Verify m1 is accepted
    const [m1Row] = await pool.query("SELECT * FROM matches WHERE id = ?", [m1]);
    assert.equal(m1Row[0].status, "accepted");

    // Try to dispatch m2 to SAME court → must fail (court still occupied)
    try {
      await dispatchService.dispatch(env.competitionId, m2, {
        courtId: env.courts[0], refereeId: env.refereeIds[1],
        correlationId: `retain-court-block`, expectedVersion: 0
      }, masterActor());
      assert.fail("Court should be blocked after accept");
    } catch (error) {
      assert.match(error.message, /COURT_CONFLICT/);
    }

    // Try to dispatch m3 to SAME referee on different court → must fail
    try {
      await dispatchService.dispatch(env.competitionId, m3, {
        courtId: env.courts[1], refereeId: env.refereeIds[0],
        correlationId: `retain-ref-block`, expectedVersion: 0
      }, masterActor());
      assert.fail("Referee should be blocked after accept");
    } catch (error) {
      assert.match(error.message, /REFEREE_CONFLICT/);
    }

    // Start match (accepted → playing)
    await pool.query("UPDATE matches SET status = 'playing', started_at = NOW() WHERE id = ?", [m1]);

    // Court/referee STILL blocked during playing
    try {
      await dispatchService.dispatch(env.competitionId, m2, {
        courtId: env.courts[0], refereeId: env.refereeIds[1],
        correlationId: `retain-playing-block`, expectedVersion: 0
      }, masterActor());
      assert.fail("Court should be blocked during playing");
    } catch (error) {
      assert.match(error.message, /COURT_CONFLICT/);
    }

    // Score match (playing → scored) — this releases resources
    await pool.query("UPDATE matches SET score1 = 11, score2 = 8, status = 'scored' WHERE id = ?", [m1]);

    // Now court should be available — dispatch m2 to same court should succeed
    const result = await dispatchService.dispatch(env.competitionId, m2, {
      courtId: env.courts[0], refereeId: env.refereeIds[1],
      correlationId: `retain-after-score`, expectedVersion: 0
    }, masterActor());
    assert.equal(result.idempotent, false, "Court available after scored");
  } finally { await env.cleanup(); }
});

// --- Test 7: dispatch → withdraw with independent chronology ---
test("MySQL: dispatch → withdraw succeeds with independent chronology", async (t) => {
  if (!mysqlAvailable) { t.skip("MySQL not available"); return; }
  const env = await createTestEnv("withdraw");
  try {
    const [m1] = env.matchIds;

    // Dispatch
    await dispatchService.dispatch(env.competitionId, m1, {
      courtId: env.courts[0], refereeId: env.refereeIds[0],
      correlationId: `wd-dispatch`, expectedVersion: 0
    }, masterActor());

    const [matchRows] = await pool.query("SELECT * FROM matches WHERE id = ?", [m1]);
    assert.equal(matchRows[0].status, "assigned");
    const currentVersion = matchRows[0].dispatch_version;

    // Withdraw (uses a NEW correlationId)
    const wdResult = await dispatchService.withdrawDispatch(env.competitionId, m1, masterActor(), {
      reason: "integration test", expectedVersion: currentVersion, correlationId: "wd-event"
    });
    assert.equal(wdResult.match.status, "upcoming");

    // Verify withdraw chronology is separate
    const [wdChron] = await pool.query(
      "SELECT * FROM tournament_coordination_chronology WHERE tournament_id = ? AND correlation_id = ?",
      [env.competitionId, "wd-event"]);
    assert.equal(wdChron.length, 1);
    assert.equal(wdChron[0].event_type, "referee_withdraw");

    // Verify match is reset
    const [afterRows] = await pool.query("SELECT * FROM matches WHERE id = ?", [m1]);
    assert.equal(afterRows[0].status, "upcoming");
    assert.equal(afterRows[0].dispatch_id, null);

    // After withdraw, court and referee should be available for re-dispatch
    const redispatch = await dispatchService.dispatch(env.competitionId, m1, {
      courtId: env.courts[0], refereeId: env.refereeIds[1],
      correlationId: `wd-redispatch`, expectedVersion: 0
    }, masterActor());
    assert.equal(redispatch.idempotent, false, "Resources available after withdraw");
  } finally { await env.cleanup(); }
});

// --- Test 8: dispatch → reassign → accept (new referee can accept) ---
test("MySQL: dispatch A → reassign B → B accepts successfully", async (t) => {
  if (!mysqlAvailable) { t.skip("MySQL not available"); return; }
  const env = await createTestEnv("reassign");
  try {
    const [m1] = env.matchIds;

    // Dispatch to referee A
    await dispatchService.dispatch(env.competitionId, m1, {
      courtId: env.courts[0], refereeId: env.refereeIds[0],
      correlationId: `ra-dispatch-a`, expectedVersion: 0
    }, masterActor());

    const [afterDispatch] = await pool.query("SELECT * FROM matches WHERE id = ?", [m1]);
    assert.equal(afterDispatch[0].status, "assigned");
    assert.equal(afterDispatch[0].referee_id, env.refereeIds[0]);
    const versionAfterDispatch = afterDispatch[0].dispatch_version;

    // Reassign to referee B
    const reassignResult = await dispatchService.reassignDispatch(env.competitionId, m1,
      env.refereeIds[1], masterActor(), {
        reason: "reassign test", expectedVersion: versionAfterDispatch, correlationId: "ra-reassign"
      });
    assert.equal(reassignResult.match.refereeId, env.refereeIds[1]);

    // Verify match.dispatch_id now matches the NEW reservation's dispatch_id
    const [afterReassign] = await pool.query("SELECT * FROM matches WHERE id = ?", [m1]);
    const newDispatchId = afterReassign[0].dispatch_id;
    const versionAfterReassign = afterReassign[0].dispatch_version;
    assert.ok(newDispatchId, "match must have a dispatch_id after reassign");

    // Verify the new reservation's dispatch_id matches the match's dispatch_id
    const [newRes] = await pool.query(
      "SELECT * FROM referee_dispatch_reservations WHERE match_id = ? AND rejected_at IS NULL",
      [m1]);
    assert.equal(newRes.length, 1, "One active reservation after reassign");
    assert.equal(newRes[0].dispatch_id, newDispatchId,
      "match.dispatch_id must match the new reservation's dispatch_id");
    assert.equal(newRes[0].referee_id, env.refereeIds[1],
      "New reservation must be for referee B");

    // Referee B accepts — this MUST succeed
    const acceptResult = await dispatchService.acceptDispatch(env.competitionId, m1,
      refereeActor(env.refereeIds[1]),
      { expectedVersion: versionAfterReassign, correlationId: "ra-accept-b" }
    );
    assert.equal(acceptResult.match.status, "accepted",
      "Referee B must be able to accept after reassign");

    // Verify independent chronology rows exist for all 3 actions
    const [allChron] = await pool.query(
      "SELECT event_type, correlation_id FROM tournament_coordination_chronology WHERE tournament_id = ? ORDER BY id",
      [env.competitionId]);
    const eventTypes = allChron.map(c => c.event_type);
    assert.ok(eventTypes.includes("referee_dispatch"), "Must have dispatch chronology");
    assert.ok(eventTypes.includes("referee_reassign"), "Must have reassign chronology");
    assert.ok(eventTypes.includes("referee_acceptance"), "Must have accept chronology");
    // All must have unique correlation_ids
    const corrIds = allChron.map(c => c.correlation_id);
    assert.equal(new Set(corrIds).size, corrIds.length, "All chronology correlationIds must be unique");
  } finally { await env.cleanup(); }
});

// --- Test 9: Migration re-run safety ---
test("MySQL: migration SQL executes twice without error", async (t) => {
  if (!mysqlAvailable) { t.skip("MySQL not available"); return; }

  // Read the actual db.sql file
  const dbSqlPath = path.join(__dirname, "..", "db.sql");
  const dbSql = fs.readFileSync(dbSqlPath, "utf8");

  // Extract INFORMATION_SCHEMA-based migration blocks for referee_dispatch_reservations
  // These are the conditional migration statements that should be idempotent
  const migrationStatements = [];

  // competition_id column migration
  migrationStatements.push(
    `SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='referee_dispatch_reservations' AND COLUMN_NAME='competition_id')`
  );
  migrationStatements.push(
    `SET @sql = IF(@col_exists = 0, 'ALTER TABLE referee_dispatch_reservations ADD COLUMN competition_id INT NOT NULL DEFAULT 0 AFTER correlation_id', 'SELECT 1')`
  );

  // Create a temporary connection with multipleStatements to run SET + PREPARE patterns
  const conn = await mysql.createConnection({
    ...DB_CONFIG, multipleStatements: true
  });

  try {
    // Run the full db.sql once
    await conn.query(dbSql);
    // Run it again — must not error
    await conn.query(dbSql);

    // Verify schema is correct after double run
    const [colRows] = await conn.query(
      "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='referee_dispatch_reservations' AND COLUMN_NAME='competition_id'"
    );
    assert.equal(colRows[0].cnt, 1, "competition_id column exists");

    const [idxRows] = await conn.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='referee_dispatch_reservations' AND INDEX_NAME='uq_dispatch_correlation' ORDER BY SEQ_IN_INDEX"
    );
    assert.ok(idxRows.length >= 2, "Unique key has at least 2 columns");
    assert.equal(idxRows[0].COLUMN_NAME, "competition_id");
    assert.equal(idxRows[1].COLUMN_NAME, "correlation_id");
  } finally {
    await conn.end();
  }
});

// --- Cleanup ---
test("MySQL: cleanup pool", async (t) => {
  if (!mysqlAvailable) { t.skip("MySQL not available"); return; }
  await pool.end();
  try {
    await pool.query("SELECT 1");
    assert.fail("Pool should be closed");
  } catch (e) {
    assert.ok(e.message.includes("closed") || e.message.includes("Pool") || e.message.includes("quit"));
  }
});
