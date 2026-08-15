const db = require("../database/db");

function map(row) {
  return row && {
    id: row.id,
    competitionId: row.competition_id,
    refereeId: row.referee_id,
    active: !!row.active,
    eligible: !!row.eligible,
    createdAt: row.created_at
  };
}

function mapReservation(row) {
  return row && {
    id: row.id,
    dispatchId: row.dispatch_id,
    matchId: row.match_id,
    courtId: row.court_id,
    refereeId: row.referee_id,
    expectedVersion: Number(row.expected_version),
    correlationId: row.correlation_id,
    acceptedAt: row.accepted_at,
    rejectedAt: row.rejected_at,
    rejectedReason: row.rejected_reason,
    createdAt: row.created_at
  };
}

// --- Competition Referee Roster ---

async function createRoster(competitionId, refereeIds, connection = db) {
  if (!Array.isArray(refereeIds) || refereeIds.length === 0) {
    throw new Error("refereeIds must be a non-empty array");
  }
  
  const values = refereeIds.map(id => [competitionId, id]);
  const placeholders = values.map(() => "(?, ?)").join(", ");
  const flatValues = values.flat();
  
  await connection.query(
    `INSERT IGNORE INTO competition_referees (competition_id, referee_id) VALUES ${placeholders}`,
    flatValues
  );
  
  return listRoster(competitionId, connection);
}

async function listRoster(competitionId, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM competition_referees WHERE competition_id = ? ORDER BY created_at, id`,
    [competitionId]
  );
  return rows.map(map);
}

async function listEligibleReferees(competitionId, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM competition_referees 
     WHERE competition_id = ? AND active = TRUE AND eligible = TRUE
     ORDER BY created_at, id`,
    [competitionId]
  );
  return rows.map(map);
}

async function findByReferee(competitionId, refereeId, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM competition_referees 
     WHERE competition_id = ? AND referee_id = ?`,
    [competitionId, refereeId]
  );
  return map(rows[0]);
}

async function updateRefereeStatus(competitionId, refereeId, updates, connection = db) {
  const sets = [];
  const values = [competitionId, refereeId];
  
  if (updates.active !== undefined) {
    sets.push("active = ?");
    values.push(updates.active ? 1 : 0);
  }
  if (updates.eligible !== undefined) {
    sets.push("eligible = ?");
    values.push(updates.eligible ? 1 : 0);
  }
  
  if (sets.length === 0) return findByReferee(competitionId, refereeId, connection);
  
  await connection.query(
    `UPDATE competition_referees SET ${sets.join(", ")} 
     WHERE competition_id = ? AND referee_id = ?`,
    values
  );
  return findByReferee(competitionId, refereeId, connection);
}

// --- Referee Dispatch Reservations ---

async function createReservation(dispatchId, data, connection = db) {
  const { matchId, courtId, refereeId, expectedVersion, correlationId } = data;
  
  try {
    await connection.query(
      `INSERT INTO referee_dispatch_reservations 
         (dispatch_id, match_id, court_id, referee_id, expected_version, correlation_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [dispatchId, matchId, courtId, refereeId, expectedVersion, correlationId]
    );
    return findByDispatchId(dispatchId, connection);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const conflict = new Error("Dispatch correlation identity has already been used");
      conflict.code = "VALIDATION_ERROR";
      throw conflict;
    }
    throw error;
  }
}

async function findByDispatchId(dispatchId, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM referee_dispatch_reservations WHERE dispatch_id = ?`,
    [dispatchId]
  );
  return mapReservation(rows[0]);
}

async function findByMatch(matchId, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM referee_dispatch_reservations WHERE match_id = ? ORDER BY created_at DESC LIMIT 1`,
    [matchId]
  );
  return mapReservation(rows[0]);
}

async function findByReferee(refereeId, status, connection = db) {
  const conditions = ["r.referee_id = ?"];
  const values = [refereeId];
  
  if (status === "waiting") {
    conditions.push("m.status = 'waiting_acceptance'");
  } else if (status === "accepted") {
    conditions.push("m.status = 'accepted'");
  }
  
  const [rows] = await connection.query(
    `SELECT r.*, m.tournament_id, m.status AS match_status
     FROM referee_dispatch_reservations r
     JOIN matches m ON r.match_id = m.id
     WHERE ${conditions.join(" AND ")}
     ORDER BY r.created_at DESC`,
    values
  );
  return rows.map((row) => ({
    ...mapReservation(row),
    tournamentId: row.tournament_id,
    matchStatus: row.match_status
  }));
}

async function markAccepted(dispatchId, refereeId, connection = db) {
  await connection.query(
    `UPDATE referee_dispatch_reservations 
     SET accepted_at = CURRENT_TIMESTAMP(6)
     WHERE dispatch_id = ? AND referee_id = ? AND accepted_at IS NULL`,
    [dispatchId, refereeId]
  );
  return findByDispatchId(dispatchId, connection);
}

async function markRejected(dispatchId, refereeId, reason, connection = db) {
  await connection.query(
    `UPDATE referee_dispatch_reservations 
     SET rejected_at = CURRENT_TIMESTAMP(6), rejected_reason = ?
     WHERE dispatch_id = ? AND referee_id = ? AND rejected_at IS NULL`,
    [reason, dispatchId, refereeId]
  );
  return findByDispatchId(dispatchId, connection);
}

async function findByCorrelationId(correlationId, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM referee_dispatch_reservations WHERE correlation_id = ?`,
    [correlationId]
  );
  return mapReservation(rows[0]);
}

async function deleteReservation(dispatchId, connection = db) {
  await connection.query(
    `DELETE FROM referee_dispatch_reservations WHERE dispatch_id = ?`,
    [dispatchId]
  );
}

module.exports = {
  // Competition Referee Roster
  createRoster,
  listRoster,
  listEligibleReferees,
  findByReferee,
  updateRefereeStatus,
  // Referee Dispatch Reservations
  createReservation,
  findByDispatchId,
  findByMatch,
  findByReferee,
  markAccepted,
  markRejected,
  findByCorrelationId,
  deleteReservation
};