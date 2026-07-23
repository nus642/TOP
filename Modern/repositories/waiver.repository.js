const db = require("../database/db");

async function createWaiver(data, connection = db) {
    const [result] = await connection.query(
        `
        INSERT INTO waivers
        (
            tournament_id,
            player_id,
            waiver_version,
            accepted_by,
            accepted_at
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
            data.competitionId,
            data.playerId,
            data.waiverVersion,
            data.acceptedBy,
            data.acceptedAt
        ]
    );

    return getWaiverById(result.insertId, connection);
}

async function getWaiverById(id, connection = db) {
    const [rows] = await connection.query(
        `
        SELECT *
        FROM waivers
        WHERE id = ?
        `,
        [id]
    );

    return rows[0] || null;
}

async function getLatestWaiver(competitionId, playerId, connection = db) {
    const [rows] = await connection.query(
        `
        SELECT *
        FROM waivers
        WHERE tournament_id = ? AND player_id = ?
        ORDER BY accepted_at DESC, id DESC
        LIMIT 1
        `,
        [competitionId, playerId]
    );

    return rows[0] || null;
}

module.exports = {
    createWaiver,
    getLatestWaiver
};
