const db = require("../database/db");

// This repository is deliberately a projection: all selected values remain
// owned by the operational, scheduling, official-record, or tournament tables.
async function findByCompetitionId(competitionId, connection = db) {
  const [rows] = await connection.query(
    `SELECT
       t.id AS competition_id,
       t.status AS competition_status,
       m.id AS match_id,
       m.round_num AS round_number,
       ms.court_id,
       ms.scheduled_at,
       m.status AS match_status,
       m.score1,
       m.score2,
       m.result_confirmed_at,
       EXISTS (
         SELECT 1
         FROM match_official_records mor
         WHERE mor.tournament_id = m.tournament_id
           AND mor.match_id = m.id
       ) AS has_official_record
     FROM tournaments t
     JOIN matches m ON m.tournament_id = t.id
     LEFT JOIN match_schedules ms
       ON ms.tournament_id = m.tournament_id AND ms.match_id = m.id
     WHERE t.id = ?
     ORDER BY ms.scheduled_at IS NULL, ms.scheduled_at, m.round_num, m.id`,
    [competitionId]
  );

  return rows;
}

module.exports = { findByCompetitionId };
