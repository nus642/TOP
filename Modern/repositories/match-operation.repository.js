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
    responsibilityAcceptedAt: row.responsibility_accepted_at,
    resultConfirmedAt: row.result_confirmed_at,
    resultConfirmedBy: row.result_confirmed_by
  };
}

async function findById(tournamentId, matchId, connection = db, lock = false) {
  const [rows] = await connection.query(
    `SELECT * FROM matches WHERE tournament_id = ? AND id = ?${lock ? " FOR UPDATE" : ""}`,
    [tournamentId, matchId]
  );
  return map(rows[0]);
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
  await connection.query(
    `UPDATE matches SET responsibility_accepted_at = CURRENT_TIMESTAMP, status = 'playing'
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

async function confirm(tournamentId, matchId, refereeId, connection = db) {
  await connection.query(
    `UPDATE matches SET result_confirmed_at = CURRENT_TIMESTAMP, result_confirmed_by = ?, status = 'confirmed'
     WHERE tournament_id = ? AND id = ?`, [refereeId, tournamentId, matchId]
  );
  return findById(tournamentId, matchId, connection);
}

module.exports = { findById, assign, acceptResponsibility, recordScore, confirm };
