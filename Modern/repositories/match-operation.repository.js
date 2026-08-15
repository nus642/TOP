const db = require("../database/db");

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
    startedAt: row.started_at
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
      playerIds: [row.player1_id, row.player2_id].filter((id) => id !== null)
    },
    team2: {
      name: row.team2_name,
      playerIds: [row.player3_id, row.player4_id].filter((id) => id !== null)
    },
    score1: row.score1,
    score2: row.score2,
    assignedAt: row.assigned_at,
    responsibilityAcceptedAt: row.responsibility_accepted_at,
    resultConfirmedAt: row.result_confirmed_at,
    courtCondition: row.court_condition || (row.court_id ? "available" : null),
    courtVersion: Number(row.court_version || 0),
    disruption: row.disruption_id ? {
      id: row.disruption_id,
      disposition: row.disruption_disposition,
      version: Number(row.disruption_version)
    } : null
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
       cd.id AS disruption_id, cd.disposition AS disruption_disposition, cd.version AS disruption_version
     FROM matches m
     LEFT JOIN match_schedules ms ON ms.match_id = m.id
     LEFT JOIN court_operating_conditions coc
       ON coc.tournament_id = ms.tournament_id AND coc.court_id = ms.court_id
     LEFT JOIN court_disruptions cd
       ON cd.tournament_id = ms.tournament_id AND cd.court_id = ms.court_id AND cd.disposition <> 'resolved'
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

async function reassignDispatch(tournamentId, matchId, newRefereeId, connection = db) {
  const [result] = await connection.query(
    `UPDATE matches SET referee_id = ?, dispatch_version = dispatch_version + 1
     WHERE tournament_id = ? AND id = ? AND status = 'assigned' AND dispatch_id IS NOT NULL`,
    [newRefereeId, tournamentId, matchId]
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
  interrupt,
  resume,
  confirm,
  findOfficialRecords
};
