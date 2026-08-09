const db = require("../database/db");

// This repository is a read-only projection over the existing lifecycle,
// match, official-record, and standings authorities. It owns no archive data.
async function findByCompetitionId(competitionId, connection = db) {
  const [competitions] = await connection.query(
    `SELECT id AS competition_id, status AS competition_status
     FROM tournaments
     WHERE id = ?`,
    [competitionId]
  );

  const [matches] = await connection.query(
    `SELECT
       m.id AS match_id,
       m.round_num AS round_number,
       m.status AS match_status,
       m.score1,
       m.score2
     FROM matches m
     JOIN (
       SELECT match_id, MAX(id) AS record_id
       FROM match_official_records
       WHERE tournament_id = ?
       GROUP BY match_id
     ) latest ON latest.match_id = m.id
     JOIN match_official_records mor
       ON mor.id = latest.record_id
      AND mor.tournament_id = m.tournament_id
     WHERE m.tournament_id = ?
       AND m.status IN ('confirmed', 'finished')
     ORDER BY m.round_num, m.id`,
    [competitionId, competitionId]
  );

  const [standings] = await connection.query(
    `SELECT participant_id, wins, losses, score_difference
     FROM competition_standings
     WHERE competition_id = ?
     ORDER BY wins DESC, score_difference DESC, participant_id ASC`,
    [competitionId]
  );

  return { competition: competitions[0] || null, matches, standings };
}

module.exports = { findByCompetitionId };
