const db = require("../database/db");

async function createTeam(data, connection = db) {
    const [result] = await connection.query(
        `
        INSERT INTO teams (tournament_id, name, status)
        VALUES (?, ?, ?)
        `,
        [data.tournament_id, data.name, data.status]
    );

    return getTeamByIdForTournament(
        data.tournament_id,
        result.insertId,
        connection
    );
}

async function getTeamByIdForTournament(tournamentId, teamId, connection = db) {
    const [rows] = await connection.query(
        `
        SELECT *
        FROM teams
        WHERE tournament_id = ? AND id = ?
        `,
        [tournamentId, teamId]
    );

    return rows[0] || null;
}

async function listTeams(tournamentId, connection = db) {
    const [rows] = await connection.query(
        `
        SELECT *
        FROM teams
        WHERE tournament_id = ?
        ORDER BY id
        `,
        [tournamentId]
    );

    return rows;
}

async function updateTeam(tournamentId, teamId, data, connection = db) {
    const fields = [];
    const values = [];

    for (const field of ["name", "status"]) {
        if (Object.prototype.hasOwnProperty.call(data, field) && data[field] !== undefined && data[field] !== null) {
            fields.push(`${field} = ?`);
            values.push(data[field]);
        }
    }

    if (fields.length > 0) {
        values.push(tournamentId, teamId);
        await connection.query(
            `
            UPDATE teams
            SET ${fields.join(", ")}
            WHERE tournament_id = ? AND id = ?
            `,
            values
        );
    }

    return getTeamByIdForTournament(tournamentId, teamId, connection);
}

async function deleteTeam(tournamentId, teamId, connection = db) {
    const [result] = await connection.query(
        `
        DELETE FROM teams
        WHERE tournament_id = ? AND id = ?
        `,
        [tournamentId, teamId]
    );

    return result.affectedRows > 0;
}

async function addMember(teamId, playerId, role = "member", connection = db) {
    await connection.query(
        `
        INSERT INTO team_members (team_id, player_id, role)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE role = VALUES(role)
        `,
        [teamId, playerId, role]
    );

    return getMember(teamId, playerId, connection);
}

async function getMember(teamId, playerId, connection = db) {
    const [rows] = await connection.query(
        `
        SELECT tm.*, p.name AS player_name
        FROM team_members tm
        JOIN players p ON p.id = tm.player_id
        WHERE tm.team_id = ? AND tm.player_id = ?
        `,
        [teamId, playerId]
    );

    return rows[0] || null;
}

async function removeMember(teamId, playerId, connection = db) {
    const [result] = await connection.query(
        `
        DELETE FROM team_members
        WHERE team_id = ? AND player_id = ?
        `,
        [teamId, playerId]
    );

    return result.affectedRows > 0;
}

async function listMembers(teamId, connection = db) {
    const [rows] = await connection.query(
        `
        SELECT tm.*, p.name AS player_name
        FROM team_members tm
        JOIN players p ON p.id = tm.player_id
        WHERE tm.team_id = ?
        ORDER BY tm.id
        `,
        [teamId]
    );

    return rows;
}

async function createTeamRoom(data, connection = db) {
    const [result] = await connection.query(
        `
        INSERT INTO team_rooms (tournament_id, code, name, status)
        VALUES (?, ?, ?, ?)
        `,
        [data.tournament_id, data.code || null, data.name || null, data.status]
    );

    return getTeamRoomByIdForTournament(data.tournament_id, result.insertId, connection);
}

async function getTeamRoomByIdForTournament(tournamentId, roomId, connection = db) {
    const [rows] = await connection.query(
        `
        SELECT *
        FROM team_rooms
        WHERE tournament_id = ? AND id = ?
        `,
        [tournamentId, roomId]
    );

    return rows[0] || null;
}

async function listTeamRooms(tournamentId, connection = db) {
    const [rows] = await connection.query(
        `
        SELECT *
        FROM team_rooms
        WHERE tournament_id = ?
        ORDER BY id
        `,
        [tournamentId]
    );

    return rows;
}

module.exports = {
    createTeam,
    getTeamByIdForTournament,
    listTeams,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
    listMembers,
    createTeamRoom,
    getTeamRoomByIdForTournament,
    listTeamRooms
};
