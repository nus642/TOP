const db = require("../database/db");

async function find(competitionId, participantId, connection = db) {
  const [rows] = await connection.query(
    `SELECT tournament_id, player_id, checked_in, checked_in_at, updated_at
       FROM player_check_ins
      WHERE tournament_id = ? AND player_id = ?`,
    [competitionId, participantId]
  );

  return rows[0] || null;
}

async function markCheckedIn(competitionId, participantId, checkedInAt, connection = db) {
  await connection.query(
    `INSERT INTO player_check_ins
       (tournament_id, player_id, checked_in, checked_in_at)
     VALUES (?, ?, TRUE, ?)
     ON DUPLICATE KEY UPDATE
       checked_in = TRUE,
       checked_in_at = COALESCE(player_check_ins.checked_in_at, VALUES(checked_in_at))`,
    [competitionId, participantId, checkedInAt]
  );

  return find(competitionId, participantId, connection);
}

async function listForCompetition(competitionId, connection = db) {
  const [rows] = await connection.query(
    `SELECT p.id AS participant_id,
            pci.checked_in,
            pci.checked_in_at,
            pci.updated_at
       FROM players p
       LEFT JOIN player_check_ins pci
         ON pci.tournament_id = p.tournament_id AND pci.player_id = p.id
      WHERE p.tournament_id = ?
      ORDER BY p.id`,
    [competitionId]
  );

  return rows;
}

module.exports = { find, markCheckedIn, listForCompetition };
