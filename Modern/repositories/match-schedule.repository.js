const db = require("../database/db");

function map(row) {
    return row && {
        id: row.id,
        competitionId: row.tournament_id,
        matchId: row.match_id,
        scheduledAt: row.scheduled_at instanceof Date
            ? row.scheduled_at.toISOString()
            : new Date(row.scheduled_at).toISOString(),
        courtId: row.court_id,
        createdAt: row.created_at
    };
}

async function findMatch(competitionId, matchId, connection = db, lock = false) {
    const [rows] = await connection.query(
        `SELECT id FROM matches WHERE tournament_id = ? AND id = ?${lock ? " FOR UPDATE" : ""}`,
        [competitionId, matchId]
    );
    return rows[0] || null;
}

async function findByMatch(competitionId, matchId, connection = db) {
    const [rows] = await connection.query(
        `SELECT * FROM match_schedules WHERE tournament_id = ? AND match_id = ?`,
        [competitionId, matchId]
    );
    return map(rows[0]);
}

async function create(schedule, connection = db) {
    const [result] = await connection.query(
        `INSERT INTO match_schedules (tournament_id, match_id, scheduled_at, court_id)
         VALUES (?, ?, ?, ?)`,
        [schedule.competitionId, schedule.matchId, new Date(schedule.scheduledAt), schedule.courtId]
    );
    return {
        id: result.insertId,
        ...schedule
    };
}

async function deleteByTournament(tournamentId, connection = db) {
    await connection.query(
        `DELETE FROM match_schedules WHERE tournament_id = ?`,
        [tournamentId]
    );
}

module.exports = { findMatch, findByMatch, create, deleteByTournament };
