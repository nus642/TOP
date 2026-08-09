const db = require("../database/db");

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

module.exports = { listForCompetition };
