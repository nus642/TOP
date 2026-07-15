const db = require("../database/db");

async function deletePairingsByTournament(tournamentId){
    const [result] = await db.query(
        `
        DELETE FROM pairings
        WHERE tournament_id = ?
        `,
        [tournamentId]
    );

    return result;
}

async function createPairing(pairing){

    const [result] = await db.query(
        `
        INSERT INTO pairings
        (
            tournament_id,
            player1_id,
            player2_id
        )
        VALUES (?, ?, ?)
        `,
        [
            pairing.tournament_id,
            pairing.player1_id,
            pairing.player2_id
        ]
    );

    return {
        id:result.insertId,
        ...pairing
    };

}

async function getPairingsByTournament(tournamentId){

    const [rows] = await db.query(
        `
        SELECT *
        FROM pairings
        WHERE tournament_id = ?
        ORDER BY id
        `,
        [tournamentId]
    );

    return rows;

}

module.exports = {
        deletePairingsByTournament,
        createPairing,
        getPairingsByTournament
};
