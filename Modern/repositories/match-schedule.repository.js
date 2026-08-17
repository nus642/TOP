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

// Lock the match_schedules row for UPDATE to maintain the global lock order:
// tournaments → match_schedules → matches → reservations → referees
async function findByMatchForUpdate(competitionId, matchId, connection = db) {
    const [rows] = await connection.query(
        `SELECT * FROM match_schedules WHERE tournament_id = ? AND match_id = ? FOR UPDATE`,
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

async function updateByMatch(schedule, connection = db) {
    const [result] = await connection.query(
        `UPDATE match_schedules SET scheduled_at = ?, court_id = ?
         WHERE tournament_id = ? AND match_id = ?`,
        [new Date(schedule.scheduledAt), schedule.courtId, schedule.competitionId, schedule.matchId]
    );
    return result.affectedRows;
}

async function deleteByMatch(competitionId, matchId, connection = db) {
    await connection.query(
        `DELETE FROM match_schedules WHERE tournament_id = ? AND match_id = ?`,
        [competitionId, matchId]
    );
}

async function findCourtTimeConflict(competitionId, courtId, scheduledAt, excludeMatchId, connection = db) {
    const [rows] = await connection.query(
        `SELECT match_id FROM match_schedules
         WHERE tournament_id = ? AND court_id = ? AND scheduled_at = ? AND match_id <> ?
         LIMIT 1`,
        [competitionId, courtId, new Date(scheduledAt), excludeMatchId || 0]
    );
    return rows[0] || null;
}

module.exports = { findMatch, findByMatch, findByMatchForUpdate, create, deleteByTournament, updateByMatch, deleteByMatch, findCourtTimeConflict };
