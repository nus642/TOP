const db = require("../database/db");

async function getCheckInState(competitionId, playerId, connection = db) {
    const [rows] = await connection.query(
        `
        SELECT *
        FROM player_check_ins
        WHERE tournament_id = ? AND player_id = ?
        `,
        [competitionId, playerId]
    );

    return rows[0] || null;
}

async function upsertCheckInState(data, connection = db) {
    await connection.query(
        `
        INSERT INTO player_check_ins
        (
            tournament_id,
            player_id,
            checked_in,
            checked_in_at
        )
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            checked_in = VALUES(checked_in),
            checked_in_at = COALESCE(player_check_ins.checked_in_at, VALUES(checked_in_at))
        `,
        [
            data.competitionId,
            data.playerId,
            data.checkedIn ? 1 : 0,
            data.checkedInAt
        ]
    );

    return getCheckInState(data.competitionId, data.playerId, connection);
}

module.exports = {
    getCheckInState,
    upsertCheckInState
};
