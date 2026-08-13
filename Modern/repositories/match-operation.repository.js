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
    court: row.court,
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
    resultConfirmedAt: row.result_confirmed_at
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
    `SELECT m.*, ms.scheduled_at
     FROM matches m
     LEFT JOIN match_schedules ms ON ms.match_id = m.id
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
  await connection.query(
    `UPDATE matches SET responsibility_accepted_at = CURRENT_TIMESTAMP, status = 'accepted'
     WHERE tournament_id = ? AND id = ?`, [tournamentId, matchId]
  );
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
  start,
  recordScore,
  confirm,
  findOfficialRecords
};
