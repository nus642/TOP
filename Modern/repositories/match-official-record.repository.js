const db = require("../database/db");

function map(row) {
  return row && {
    id: row.id,
    tournamentId: row.tournament_id,
    matchId: row.match_id,
    refereeId: row.referee_id,
    score1: row.score1,
    score2: row.score2,
    confirmedBy: row.confirmed_by,
    confirmedAt: row.confirmed_at,
    confirmationResponsibility: row.confirmation_responsibility,
    evidenceReference: row.evidence_reference,
    evidenceMetadata: row.evidence_metadata ? safeJsonParse(row.evidence_metadata) : null,
    provenance: row.provenance ? safeJsonParse(row.provenance) : null,
    createdAt: row.created_at
  };
}

function safeJsonParse(value) {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return null; }
  }
  return value;
}

async function create(record, connection = db) {
  const [result] = await connection.query(
    `INSERT INTO match_official_records
     (tournament_id, match_id, referee_id, score1, score2,
      confirmed_by, confirmed_at, confirmation_responsibility,
      evidence_reference, evidence_metadata, provenance)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.tournamentId,
      record.matchId,
      record.refereeId,
      record.score1,
      record.score2,
      record.confirmedBy,
      record.confirmedAt,
      record.confirmationResponsibility || "referee_result_confirmation",
      record.evidenceReference || null,
      record.evidenceMetadata ? JSON.stringify(record.evidenceMetadata) : null,
      record.provenance ? JSON.stringify(record.provenance) : null
    ]
  );
  return findById(result.insertId, connection);
}

async function findById(id, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM match_official_records WHERE id = ?`,
    [id]
  );
  return map(rows[0]);
}

async function findByMatch(tournamentId, matchId, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM match_official_records
     WHERE tournament_id = ? AND match_id = ?
     ORDER BY confirmed_at DESC`,
    [tournamentId, matchId]
  );
  return rows.map(map);
}

async function findLatestByMatch(tournamentId, matchId, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM match_official_records
     WHERE tournament_id = ? AND match_id = ?
     ORDER BY confirmed_at DESC
     LIMIT 1`,
    [tournamentId, matchId]
  );
  return map(rows[0]);
}

// Official records are the confirmation boundary. Mutable match status and scores
// are deliberately not read; the match join supplies participant identity only.
async function findLatestConfirmedResults(tournamentId, connection = db) {
  const [rows] = await connection.query(
    `SELECT r.match_id, r.score1, r.score2, m.player1_id, m.player2_id
     FROM match_official_records r
     JOIN matches m ON m.id = r.match_id AND m.tournament_id = r.tournament_id
     JOIN (
       SELECT match_id, MAX(id) AS record_id
       FROM match_official_records
       WHERE tournament_id = ?
       GROUP BY match_id
     ) latest ON latest.record_id = r.id
     WHERE r.tournament_id = ?
       AND m.player1_id IS NOT NULL AND m.player2_id IS NOT NULL
     ORDER BY r.match_id`,
    [tournamentId, tournamentId]
  );
  return rows.map(row => ({
    matchId: row.match_id,
    sideOneId: row.player1_id,
    sideTwoId: row.player2_id,
    sideOneScore: row.score1,
    sideTwoScore: row.score2,
    confirmed: true
  }));
}

module.exports = { create, findById, findByMatch, findLatestByMatch, findLatestConfirmedResults };
