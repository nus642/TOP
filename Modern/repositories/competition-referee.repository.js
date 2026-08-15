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
    competitionId: row.competition_id,
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

async function findByRefereeInRoster(competitionId, refereeId, connection = db) {
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
  
  if (sets.length === 0) return findByRefereeInRoster(competitionId, refereeId, connection);
  
  await connection.query(
    `UPDATE competition_referees SET ${sets.join(", ")} 
     WHERE competition_id = ? AND referee_id = ?`,
    values
  );
  return findByRefereeInRoster(competitionId, refereeId, connection);
}

// --- Referee Dispatch Reservations ---

async function createReservation(dispatchId, data, connection = db) {
  const { matchId, courtId, refereeId, expectedVersion, correlationId, competitionId } = data;
  
  try {
    await connection.query(
      `INSERT INTO referee_dispatch_reservations 
         (dispatch_id, match_id, court_id, referee_id, expected_version, correlation_id, competition_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [dispatchId, matchId, courtId, refereeId, expectedVersion, correlationId, competitionId]
    );
    return findByDispatchId(dispatchId, connection);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const conflict = new Error("Dispatch correlation identity has already been used");
      conflict.code = "FORBIDDEN";
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

async function findReservationByReferee(refereeId, status, connection = db) {
  const conditions = ["r.referee_id = ?"];
  const values = [refereeId];
  
  if (status === "waiting") {
    conditions.push("m.status = 'assigned'");
    conditions.push("r.dispatch_id IS NOT NULL");
    conditions.push("r.accepted_at IS NULL");
    conditions.push("r.rejected_at IS NULL");
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
  const [result] = await connection.query(
    `UPDATE referee_dispatch_reservations 
     SET accepted_at = CURRENT_TIMESTAMP(6)
     WHERE dispatch_id = ? AND referee_id = ? AND accepted_at IS NULL`,
    [dispatchId, refereeId]
  );
  if (result.affectedRows === 0) {
    const error = new Error("Reservation acceptance failed: already resolved");
    error.code = "CONFLICT";
    throw error;
  }
  return findByDispatchId(dispatchId, connection);
}

async function markRejected(dispatchId, refereeId, reason, connection = db) {
  const [result] = await connection.query(
    `UPDATE referee_dispatch_reservations 
     SET rejected_at = CURRENT_TIMESTAMP(6), rejected_reason = ?
     WHERE dispatch_id = ? AND referee_id = ? AND rejected_at IS NULL`,
    [reason, dispatchId, refereeId]
  );
  if (result.affectedRows === 0) {
    const error = new Error("Reservation rejection failed: already resolved");
    error.code = "CONFLICT";
    throw error;
  }
  return findByDispatchId(dispatchId, connection);
}

async function findByCorrelationId(competitionId, correlationId, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM referee_dispatch_reservations WHERE competition_id = ? AND correlation_id = ?`,
    [competitionId, correlationId]
  );
  return mapReservation(rows[0]);
}

async function deleteReservation(dispatchId, connection = db) {
  await connection.query(
    `DELETE FROM referee_dispatch_reservations WHERE dispatch_id = ?`,
    [dispatchId]
  );
}

// Active reservation conflict checks (FOR UPDATE within transaction)
// Reservation is active until the match reaches a terminal state (scored/confirmed/finished)
// or the reservation is explicitly rejected. This ensures court/referee remain
// occupied from dispatch through accept, playing, and interruption.
async function findActiveReservationByCourt(courtId, competitionId, connection) {
  const [rows] = await connection.query(
    `SELECT r.* FROM referee_dispatch_reservations r
     JOIN matches m ON r.match_id = m.id
     WHERE r.court_id = ? AND r.competition_id = ?
       AND r.rejected_at IS NULL
       AND m.status NOT IN ('scored', 'awaiting_confirmation', 'confirmed', 'finished')
     LIMIT 1 FOR UPDATE`,
    [courtId, competitionId]
  );
  return mapReservation(rows[0]);
}

async function findActiveReservationByReferee(refereeId, competitionId, connection) {
  const [rows] = await connection.query(
    `SELECT r.* FROM referee_dispatch_reservations r
     JOIN matches m ON r.match_id = m.id
     WHERE r.referee_id = ? AND r.competition_id = ?
       AND r.rejected_at IS NULL
       AND m.status NOT IN ('scored', 'awaiting_confirmation', 'confirmed', 'finished')
     LIMIT 1 FOR UPDATE`,
    [refereeId, competitionId]
  );
  return mapReservation(rows[0]);
}

// Read-only variant for candidate filtering (no FOR UPDATE).
// Excludes reservations for a specific match to support reassign scenarios.
async function findActiveReservationByRefereeExcluding(refereeId, competitionId, excludeMatchId, connection = db) {
  const conditions = [
    "r.referee_id = ?",
    "r.competition_id = ?",
    "r.rejected_at IS NULL",
    "m.status NOT IN ('scored', 'awaiting_confirmation', 'confirmed', 'finished')"
  ];
  const values = [refereeId, competitionId];
  if (excludeMatchId != null) {
    conditions.push("r.match_id != ?");
    values.push(excludeMatchId);
  }
  const [rows] = await connection.query(
    `SELECT r.* FROM referee_dispatch_reservations r
     JOIN matches m ON r.match_id = m.id
     WHERE ${conditions.join(" AND ")}
     LIMIT 1`,
    values
  );
  return mapReservation(rows[0]);
}

module.exports = {
  // Competition Referee Roster
  createRoster,
  listRoster,
  listEligibleReferees,
  findByRefereeInRoster,
  updateRefereeStatus,
  // Referee Dispatch Reservations
  createReservation,
  findByDispatchId,
  findByMatch,
  findReservationByReferee,
  markAccepted,
  markRejected,
  findByCorrelationId,
  deleteReservation,
  // Active reservation conflict checks
  findActiveReservationByCourt,
  findActiveReservationByReferee,
  findActiveReservationByRefereeExcluding
};