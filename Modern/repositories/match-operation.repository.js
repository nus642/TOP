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

async function confirm(tournamentId, matchId, refereeId, officialRecord, connection = db) {
  const outcome = officialRecord.outcome;
  const evidence = outcome.officialConfirmation.evidenceReferences[0] || null;
  const [result] = await connection.query(
    `INSERT INTO match_official_records
       (tournament_id, match_id, result_data, confirmed_at, confirmed_by,
        evidence_reference, evidence_metadata, provenance)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tournamentId,
      matchId,
      JSON.stringify(outcome.matchResult.score),
      new Date(outcome.confirmedAt),
      refereeId,
      evidence?.reference || null,
      JSON.stringify(evidence?.captureMetadata || {}),
      JSON.stringify(officialRecord.provenance)
    ]
  );
  await connection.query(
    `UPDATE matches SET result_confirmed_at = CURRENT_TIMESTAMP, result_confirmed_by = ?, status = 'confirmed'
     WHERE tournament_id = ? AND id = ?`, [refereeId, tournamentId, matchId]
  );
  return {
    ...(await findById(tournamentId, matchId, connection)),
    officialRecord: {
      recordId: result.insertId,
      tournamentId,
      matchId,
      score: outcome.matchResult.score,
      confirmedAt: outcome.confirmedAt,
      confirmedBy: refereeId,
      evidenceReference: evidence?.reference || null,
      evidenceMetadata: evidence?.captureMetadata || {},
      provenance: officialRecord.provenance
    }
  };
}

async function findOfficialRecords(tournamentId, matchId, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM match_official_records
     WHERE tournament_id = ? AND match_id = ? ORDER BY confirmed_at, id`,
    [tournamentId, matchId]
  );
  return rows.map(mapOfficialRecord);
}

module.exports = { findById, assign, acceptResponsibility, recordScore, confirm, findOfficialRecords };
