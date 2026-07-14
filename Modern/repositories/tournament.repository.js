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

async function updateTournamentName(id, name){

    const [result] = await db.query(
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
    updateTournamentName

};