const db = require("../database/db");

async function getTournamentById(tournamentId){

    const [rows] = await db.query(
        `
        SELECT *
        FROM tournaments
        WHERE id = ?
        `,
        [tournamentId]
    );

    return rows[0] || null;

}

async function createTournament(
    data,
    connection = db
){

    const [result] = await connection.query(
        `
        INSERT INTO tournaments (name, sport, status)
        VALUES (?, ?, ?)
        `,
        [
            data.name,
            data.sport,
            data.status
        ]
    );

    return getTournamentByIdWithConnection(
        result.insertId,
        connection
    );

}

async function updateTournament(
    id,
    data,
    connection = db
){

    const fields = [];
    const values = [];

    for (const field of ["name", "sport", "status"]) {
        if (Object.prototype.hasOwnProperty.call(data, field) && data[field] !== undefined && data[field] !== null) {
            fields.push(`${field} = ?`);
            values.push(data[field]);
        }
    }

    if (fields.length === 0) {
        return getTournamentByIdWithConnection(
            id,
            connection
        );
    }

    values.push(id);

    await connection.query(
        `
        UPDATE tournaments
        SET ${fields.join(", ")}
        WHERE id = ?
        `,
        values
    );

    return getTournamentByIdWithConnection(
        id,
        connection
    );

}

async function deleteTournament(
    id,
    connection = db
){

    const [result] = await connection.query(
        `
        DELETE FROM tournaments
        WHERE id = ?
        `,
        [id]
    );

    return result.affectedRows > 0;

}

async function getTournamentByIdWithConnection(
    tournamentId,
    connection
){

    const [rows] = await connection.query(
        `
        SELECT *
        FROM tournaments
        WHERE id = ?
        `,
        [tournamentId]
    );

    return rows[0] || null;

}

async function updateTournamentName(
    id,
    name,
    connection = db
){

    const [result] = await connection.query(
        `
        UPDATE tournaments
        SET name = ?
        WHERE id = ?
        `,
        [
            name,
            id
        ]
    );

    return result;

}

module.exports = {

    getTournamentById,
    createTournament,
    updateTournament,
    deleteTournament,
    updateTournamentName

};
