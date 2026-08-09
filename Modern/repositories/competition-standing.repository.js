const db = require("../database/db");

function map(row) {
    return {
        competitionId: row.competition_id,
        participantId: row.participant_id,
        played: row.played,
        wins: row.wins,
        losses: row.losses,
        scoreFor: row.score_for,
        scoreAgainst: row.score_against,
        scoreDifference: row.score_difference,
        updatedAt: row.updated_at
    };
}

async function replaceForCompetition(competitionId, standings, connection = db) {
    await connection.query("DELETE FROM competition_standings WHERE competition_id = ?", [competitionId]);
    for (const standing of standings) {
        await connection.query(
            `INSERT INTO competition_standings
             (competition_id, participant_id, played, wins, losses, score_for, score_against, score_difference)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [competitionId, standing.participantId, standing.played, standing.wins, standing.losses,
                standing.scoreFor, standing.scoreAgainst, standing.scoreDifference]
        );
    }
    return findByCompetition(competitionId, connection);
}

async function findByCompetition(competitionId, connection = db) {
    const [rows] = await connection.query(
        `SELECT * FROM competition_standings WHERE competition_id = ?
         ORDER BY wins DESC, score_difference DESC, participant_id ASC`,
        [competitionId]
    );
    return rows.map(map);
}

module.exports = { replaceForCompetition, findByCompetition };
