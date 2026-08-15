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
            checked_in_at,
            source
        )
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            checked_in = VALUES(checked_in),
            checked_in_at = COALESCE(player_check_ins.checked_in_at, VALUES(checked_in_at)),
            source = VALUES(source)
        `,
        [
            data.competitionId,
            data.playerId,
            data.checkedIn ? 1 : 0,
            data.checkedInAt,
            data.source || null
        ]
    );

    return getCheckInState(data.competitionId, data.playerId, connection);
}

async function bulkUpsertReadiness(competitionId, playerIds, source, connection) {
    if (!playerIds || playerIds.length === 0) return;
    const now = new Date();
    const placeholders = playerIds.map(() => "(?, ?, TRUE, ?, ?)").join(", ");
    const values = [];
    for (const pid of playerIds) {
        values.push(competitionId, pid, now, source);
    }
    await connection.query(
        `INSERT INTO player_check_ins (tournament_id, player_id, checked_in, checked_in_at, source)
         VALUES ${placeholders}
         ON DUPLICATE KEY UPDATE checked_in = TRUE, checked_in_at = VALUES(checked_in_at), source = VALUES(source)`,
        values
    );
}

async function deleteCheckInsByTournament(tournamentId, connection) {
    await connection.query(
        `DELETE FROM player_check_ins WHERE tournament_id = ?`,
        [tournamentId]
    );
}

module.exports = {
    getCheckInState,
    upsertCheckInState,
    bulkUpsertReadiness,
    deleteCheckInsByTournament
};
