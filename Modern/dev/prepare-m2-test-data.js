// Development-only test data for the M2 referee three-step flow manual test.
// Idempotent: safe to run repeatedly on any fresh database. Prepares:
//   1. tournament 1 (created if missing)
//   2. at least four players (created if missing)
//   3. referee roster entry referee-test-1
//   4. check-ins for the four players
//   5. one accepted doubles match assigned to referee-test-1
// Usage: node dev/prepare-m2-test-data.js
const mysql = require('mysql2/promise');

const REFEREE_ID = 'referee-test-1';
const PLAYER_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana'];

async function main() {
  const c = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '123456',
    database: process.env.MYSQL_DB || 'nhpa'
  });

  // 1. Tournament
  let [rows] = await c.query('SELECT id FROM tournaments ORDER BY id LIMIT 1');
  let tournamentId;
  if (rows.length) {
    tournamentId = rows[0].id;
  } else {
    await c.query("INSERT INTO tournaments (name, sport, status) VALUES ('测试赛事', 'pickleball', 'active')");
    [rows] = await c.query('SELECT LAST_INSERT_ID() AS id');
    tournamentId = rows[0].id;
    console.log('Created tournament', tournamentId);
  }

  // 1b. Ensure tournament status is 'running' (required for match start)
  await c.query("UPDATE tournaments SET status = 'running' WHERE id = ? AND status != 'running'", [tournamentId]);
  console.log('Ensured tournament status is running');

  // 2. Players (use existing ones when available)
  [rows] = await c.query('SELECT id, name FROM players WHERE tournament_id = ? ORDER BY id LIMIT 4', [tournamentId]);
  for (let i = rows.length; i < 4; i++) {
    await c.query('INSERT INTO players (tournament_id, name) VALUES (?, ?)', [tournamentId, PLAYER_NAMES[i]]);
    console.log('Created player', PLAYER_NAMES[i]);
  }
  [rows] = await c.query('SELECT id FROM players WHERE tournament_id = ? ORDER BY id LIMIT 4', [tournamentId]);
  const playerIds = rows.map((r) => r.id);

  // 3. Referee roster entry
  await c.query(
    'INSERT INTO competition_referees (competition_id, referee_id, active, eligible) VALUES (?, ?, 1, 1) ON DUPLICATE KEY UPDATE active = 1, eligible = 1',
    [tournamentId, REFEREE_ID]
  );

  // 4. Player check-ins (required by match start)
  for (const playerId of playerIds) {
    await c.query(
      'INSERT INTO player_check_ins (tournament_id, player_id, checked_in, checked_in_at, source) VALUES (?, ?, 1, NOW(), \'test-script\') ON DUPLICATE KEY UPDATE checked_in = 1, checked_in_at = NOW()',
      [tournamentId, playerId]
    );
  }

  // 5. One accepted doubles match (skip when a test match already exists)
  const [existing] = await c.query(
    'SELECT id, status FROM matches WHERE tournament_id = ? AND referee_id = ? ORDER BY id DESC LIMIT 1',
    [tournamentId, REFEREE_ID]
  );
  let matchId;
  if (existing.length) {
    matchId = existing[0].id;
    // Reset to accepted with responsibility_accepted_at set (required for start)
    await c.query(
      "UPDATE matches SET status = 'accepted', responsibility_accepted_at = NOW(), score1 = NULL, score2 = NULL, started_at = NULL, result_confirmed_at = NULL, result_confirmed_by = NULL WHERE id = ?",
      [matchId]
    );
    console.log(`Reset test match: id ${matchId} to accepted`);
  } else {
    await c.query(`
      INSERT INTO matches
      (tournament_id, round_num, court, player1_id, player2_id, player3_id, player4_id,
       team1_name, team2_name, score1, score2, game_format, score_rule, target_score, cap_score,
       status, referee_id, dispatch_id, dispatch_version, responsibility_accepted_at)
      VALUES (?, 1, 'Court A', ?, ?, ?, ?, 'Team Alpha', 'Team Beta', NULL, NULL, 1, 'rally', 11, 0,
              'accepted', ?, NULL, 0, NOW())
    `, [tournamentId, ...playerIds, REFEREE_ID]);
    [rows] = await c.query('SELECT LAST_INSERT_ID() AS id');
    matchId = rows[0].id;
    console.log('Created accepted match', matchId);
  }

  // 6. Ensure match_schedules row exists (required for court availability check)
  const [schedRows] = await c.query(
    'SELECT id FROM match_schedules WHERE tournament_id = ? AND match_id = ?',
    [tournamentId, matchId]
  );
  if (!schedRows.length) {
    await c.query(
      'INSERT INTO match_schedules (tournament_id, match_id, court_id, scheduled_at) VALUES (?, ?, ?, NOW())',
      [tournamentId, matchId, 'Court A']
    );
    console.log('Created match_schedules row for match', matchId);
  }

  // 7. Reset court_operating_conditions to 'available' (fixes leftover 'occupied' state)
  await c.query(
    "UPDATE court_operating_conditions SET condition_name = 'available', source_type = 'initial_baseline', source_reference = 'test-reset', actor_id = 'system', version = version + 1, last_chronology_id = last_chronology_id + 1 WHERE tournament_id = ? AND court_id = 'Court A'",
    [tournamentId]
  );
  console.log('Reset Court A to available');

  console.log(`\nReady. Log in via /dev/dev-login.html as "${REFEREE_ID}" (Referee), competition ${tournamentId}.`);
  await c.end();
}

main().catch((e) => { console.log('ERR:', e.message); process.exitCode = 1; });
