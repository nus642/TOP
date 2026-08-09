const db = require("../database/db");

function timestamp(value) {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function map(row) {
  return {
    competitionId: row.competition_id,
    competitionStatus: row.competition_status,
    matchId: row.match_id,
    roundNumber: row.round_number,
    sides: {
      one: row.team1_name,
      two: row.team2_name
    },
    schedule: {
      scheduledAt: timestamp(row.scheduled_at),
      courtId: row.court_id
    },
    referee: {
      refereeId: row.referee_id,
      assignedAt: timestamp(row.assigned_at),
      responsibilityAcceptedAt: timestamp(row.responsibility_accepted_at)
    },
    operationStatus: row.operation_status,
    resultConfirmedAt: timestamp(row.result_confirmed_at)
  };
}

async function findMatchOverview(competitionId, filters = {}, connection = db) {
  const conditions = ["competition_id = ?"];
  const values = [competitionId];

  if (filters.courtId !== undefined) {
    conditions.push("court_id = ?");
    values.push(filters.courtId);
  }
  if (filters.refereeId !== undefined) {
    conditions.push("referee_id = ?");
    values.push(filters.refereeId);
  }
  if (filters.status !== undefined) {
    conditions.push("operation_status = ?");
    values.push(filters.status);
  }

  const [rows] = await connection.query(
    `SELECT * FROM master_operational_match_overview
     WHERE ${conditions.join(" AND ")}
     ORDER BY scheduled_at IS NULL, scheduled_at, round_number, match_id`,
    values
  );
  return rows.map(map);
}

module.exports = { findMatchOverview };
