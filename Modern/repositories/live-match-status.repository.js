const db = require("../database/db");

function timestamp(value) {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function map(row) {
  return {
    matchId: row.match_id,
    roundNumber: row.round_number,
    courtId: row.court_id,
    scheduledAt: timestamp(row.scheduled_at),
    status: row.match_status,
    refereeId: row.referee_id,
    refereeAccepted: row.responsibility_accepted_at !== null,
    score: {
      sideOne: row.score1,
      sideTwo: row.score2
    },
    confirmed: Boolean(row.has_official_record)
  };
}

async function findByCompetitionId(competitionId, connection = db) {
  const [rows] = await connection.query(
    `SELECT
       t.status AS competition_status,
       m.id AS match_id,
       m.round_num AS round_number,
       ms.court_id,
       ms.scheduled_at,
       m.status AS match_status,
       m.referee_id,
       m.assigned_at,
       m.responsibility_accepted_at,
       m.score1,
       m.score2,
       m.result_confirmed_at,
       EXISTS (
         SELECT 1
         FROM match_official_records mor
         WHERE mor.tournament_id = m.tournament_id
           AND mor.match_id = m.id
       ) AS has_official_record
     FROM matches m
     JOIN tournaments t ON t.id = m.tournament_id
     LEFT JOIN match_schedules ms
       ON ms.tournament_id = m.tournament_id AND ms.match_id = m.id
     WHERE m.tournament_id = ?
     ORDER BY ms.scheduled_at IS NULL, ms.scheduled_at, m.round_num, m.id`,
    [competitionId]
  );
  return {
    competitionStatus: rows.length === 0 ? null : rows[0].competition_status,
    matches: rows.map(map)
  };
}

module.exports = { findByCompetitionId };
