const db = require("../database/db");

// Static match-format configuration (M2 Referee Match Operation Experience).
// Defaults match the declared database exception: single game / rally / 21 / 21.
function formatOf(row) {
  return {
    gameFormat: Number(row.game_format ?? 1),
    scoreRule: row.score_rule || "rally",
    targetScore: Number(row.target_score ?? 21),
    capScore: Number(row.cap_score ?? 21)
  };
}

function map(row) {
  return row && {
    id: row.id,
    tournamentId: row.tournament_id,
    refereeId: row.referee_id,
    status: row.status,
    score1: row.score1,
    score2: row.score2,
    assignedAt: row.assigned_at,
    dispatchId: row.dispatch_id || null,
    dispatchVersion: row.dispatch_version != null ? Number(row.dispatch_version) : null,
    responsibilityAcceptedAt: row.responsibility_accepted_at,
    resultConfirmedAt: row.result_confirmed_at,
    resultConfirmedBy: row.result_confirmed_by,
    participantIds: [row.player1_id, row.player2_id, row.player3_id, row.player4_id]
      .filter((id) => id !== null && id !== undefined),
    startedAt: row.started_at,
    format: formatOf(row)
  };
}

function mapRefereeWork(row) {
  return row && {
    id: row.id,
    tournamentId: row.tournament_id,
    refereeId: row.referee_id,
    status: row.status,
    roundNumber: row.round_num,
    court: row.court_id || row.court,
    scheduledAt: row.scheduled_at,
    team1: {
      name: row.team1_name,
      playerIds: [row.player1_id, row.player2_id].filter((id) => id != null),
      players: [
        row.player1_id != null ? { id: row.player1_id, name: row.player1_name || "" } : null,
        row.player2_id != null ? { id: row.player2_id, name: row.player2_name || "" } : null
      ].filter(Boolean)
    },
    team2: {
      name: row.team2_name,
      playerIds: [row.player3_id, row.player4_id].filter((id) => id != null),
      players: [
        row.player3_id != null ? { id: row.player3_id, name: row.player3_name || "" } : null,
        row.player4_id != null ? { id: row.player4_id, name: row.player4_name || "" } : null
      ].filter(Boolean)
    },
    score1: row.score1,
    score2: row.score2,
    assignedAt: row.assigned_at,
    responsibilityAcceptedAt: row.responsibility_accepted_at,
    dispatchVersion: row.dispatch_version != null ? Number(row.dispatch_version) : 0,
    resultConfirmedAt: row.result_confirmed_at,
    courtCondition: row.court_condition || (row.court_id ? "available" : null),
    courtVersion: Number(row.court_version || 0),
    disruption: row.disruption_id ? {
      id: row.disruption_id,
      disposition: row.disruption_disposition,
      version: Number(row.disruption_version)
    } : null,
    format: formatOf(row)
  };
}

function json(value) {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? JSON.parse(value) : value;
}

function mapOfficialRecord(row) {
  return row && {
    recordId: row.id,
    tournamentId: row.tournament_id,
    matchId: row.match_id,
    score: json(row.result_data),
    confirmedAt: row.confirmed_at,
    confirmedBy: row.confirmed_by,
    evidenceReference: row.evidence_reference,
    evidenceMetadata: json(row.evidence_metadata) || {},
    provenance: json(row.provenance) || {}
  };
}

async function findById(tournamentId, matchId, connection = db, lock = false) {
  const [rows] = await connection.query(
    `SELECT * FROM matches WHERE tournament_id = ? AND id = ?${lock ? " FOR UPDATE" : ""}`,
    [tournamentId, matchId]
  );
  return map(rows[0]);
}

async function findByReferee(tournamentId, refereeId, connection = db) {
  const [rows] = await connection.query(
    `SELECT m.*, ms.scheduled_at, ms.court_id,
       coc.condition_name AS court_condition, COALESCE(coc.version, 0) AS court_version,
       cd.id AS disruption_id, cd.disposition AS disruption_disposition, cd.version AS disruption_version,
       p1.name AS player1_name, p2.name AS player2_name,
       p3.name AS player3_name, p4.name AS player4_name
     FROM matches m
     LEFT JOIN match_schedules ms ON ms.match_id = m.id
     LEFT JOIN court_operating_conditions coc
       ON coc.tournament_id = ms.tournament_id AND coc.court_id = ms.court_id
     LEFT JOIN court_disruptions cd
       ON cd.tournament_id = ms.tournament_id AND cd.court_id = ms.court_id AND cd.disposition <> 'resolved'
     LEFT JOIN players p1 ON p1.id = m.player1_id
     LEFT JOIN players p2 ON p2.id = m.player2_id
     LEFT JOIN players p3 ON p3.id = m.player3_id
     LEFT JOIN players p4 ON p4.id = m.player4_id
     WHERE m.tournament_id = ? AND m.referee_id = ?
     ORDER BY ms.scheduled_at IS NULL, ms.scheduled_at, m.round_num, m.id`,
    [tournamentId, refereeId]
  );
  return rows.map(mapRefereeWork);
}

async function assign(tournamentId, matchId, refereeId, connection = db) {
  await connection.query(
    `UPDATE matches SET referee_id = ?, assigned_at = CURRENT_TIMESTAMP, status = 'assigned'
     WHERE tournament_id = ? AND id = ?`,
    [refereeId, tournamentId, matchId]
  );
  return findById(tournamentId, matchId, connection);
}

async function acceptResponsibility(tournamentId, matchId, connection = db) {
  const [result] = await connection.query(
    `UPDATE matches SET responsibility_accepted_at = CURRENT_TIMESTAMP, status = 'accepted'
     WHERE tournament_id = ? AND id = ? AND status = 'assigned'`, [tournamentId, matchId]
  );
  if (result.affectedRows === 0) {
    const error = new Error("Accept responsibility failed: match state changed");
    error.code = "CONFLICT";
    throw error;
  }
  return findById(tournamentId, matchId, connection);
}

async function dispatch(tournamentId, matchId, data, connection = db) {
  const { dispatchId, dispatchVersion, refereeId } = data;
  const [result] = await connection.query(
    `UPDATE matches SET referee_id = ?, assigned_at = CURRENT_TIMESTAMP, 
       dispatch_id = ?, dispatch_version = ?, status = 'assigned'
     WHERE tournament_id = ? AND id = ? AND status IN ('idle', 'upcoming')`,
    [refereeId, dispatchId, dispatchVersion, tournamentId, matchId]
  );
  if (result.affectedRows === 0) {
    const error = new Error("Dispatch failed: match state changed");
    error.code = "CONFLICT";
    throw error;
  }
  return findById(tournamentId, matchId, connection);
}

async function acceptDispatch(tournamentId, matchId, dispatchId, connection = db) {
  const [result] = await connection.query(
    `UPDATE matches SET dispatch_version = dispatch_version + 1,
       responsibility_accepted_at = CURRENT_TIMESTAMP, status = 'accepted'
     WHERE tournament_id = ? AND id = ? AND dispatch_id = ? AND status = 'assigned'`,
    [tournamentId, matchId, dispatchId]
  );
  if (result.affectedRows === 0) {
    const error = new Error("Dispatch acceptance failed: match state changed");
    error.code = "CONFLICT";
    throw error;
  }
  return findById(tournamentId, matchId, connection);
}

async function withdrawDispatch(tournamentId, matchId, connection = db) {
  const [result] = await connection.query(
    `UPDATE matches SET dispatch_id = NULL, dispatch_version = NULL,
       referee_id = NULL, assigned_at = NULL, status = 'upcoming'
     WHERE tournament_id = ? AND id = ? AND status = 'assigned' AND dispatch_id IS NOT NULL`,
    [tournamentId, matchId]
  );
  if (result.affectedRows === 0) {
    const error = new Error("Withdraw failed: match state changed");
    error.code = "CONFLICT";
    throw error;
  }
  return findById(tournamentId, matchId, connection);
}

async function reassignDispatch(tournamentId, matchId, newRefereeId, newDispatchId, connection = db) {
  const [result] = await connection.query(
    `UPDATE matches SET referee_id = ?, dispatch_id = ?, dispatch_version = dispatch_version + 1
     WHERE tournament_id = ? AND id = ? AND status = 'assigned' AND dispatch_id IS NOT NULL`,
    [newRefereeId, newDispatchId, tournamentId, matchId]
  );
  if (result.affectedRows === 0) {
    const error = new Error("Reassign failed: match state changed");
    error.code = "CONFLICT";
    throw error;
  }
  return findById(tournamentId, matchId, connection);
}

async function start(tournamentId, matchId, connection = db) {
  await connection.query(
    `UPDATE matches SET started_at = CURRENT_TIMESTAMP, status = 'playing'
     WHERE tournament_id = ? AND id = ?`, [tournamentId, matchId]
  );
  return findById(tournamentId, matchId, connection);
}

async function recordScore(tournamentId, matchId, score1, score2, connection = db) {
  await connection.query(
    `UPDATE matches SET score1 = ?, score2 = ?, status = 'scored'
     WHERE tournament_id = ? AND id = ?`, [score1, score2, tournamentId, matchId]
  );
  return findById(tournamentId, matchId, connection);
}

// Lightweight live-score snapshot write (M2 ED-04). Deliberately bypasses the
// domain state machine and writes score1/score2 only; status stays 'playing'.
// No transaction, no FOR UPDATE lock - safe for per-point high-frequency calls.
// Returns affected row count: 0 means the match is not in 'playing' state.
async function writeScoreSnapshot(tournamentId, matchId, score1, score2, connection = db) {
  const [result] = await connection.query(
    `UPDATE matches SET score1 = ?, score2 = ?
     WHERE tournament_id = ? AND id = ? AND status = 'playing'`,
    [score1, score2, tournamentId, matchId]
  );
  return result.affectedRows;
}

async function interrupt(tournamentId, matchId, connection = db) {
  await connection.query(
    `UPDATE matches SET status = 'interrupted' WHERE tournament_id = ? AND id = ?`,
    [tournamentId, matchId]);
  return findById(tournamentId, matchId, connection);
}

async function resume(tournamentId, matchId, connection = db) {
  await connection.query(
    `UPDATE matches SET status = 'playing' WHERE tournament_id = ? AND id = ?`,
    [tournamentId, matchId]);
  return findById(tournamentId, matchId, connection);
}

async function confirm(tournamentId, matchId, confirmedBy, connection = db) {
  await connection.query(
    `UPDATE matches SET result_confirmed_at = CURRENT_TIMESTAMP, result_confirmed_by = ?, status = 'confirmed'
     WHERE tournament_id = ? AND id = ?`, [confirmedBy, tournamentId, matchId]
  );
  return findById(tournamentId, matchId, connection);
}

async function findOfficialRecords(tournamentId, matchId, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM match_official_records
     WHERE tournament_id = ? AND match_id = ? ORDER BY confirmed_at, id`,
    [tournamentId, matchId]
  );
  return rows.map(mapOfficialRecord);
}

module.exports = {
  findById,
  findByReferee,
  assign,
  acceptResponsibility,
  dispatch,
  acceptDispatch,
  withdrawDispatch,
  reassignDispatch,
  start,
  recordScore,
  writeScoreSnapshot,
  interrupt,
  resume,
  confirm,
  findOfficialRecords
};
