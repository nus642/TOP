const db = require("../database/db");

async function deletePairingsByTournament(
    tournamentId,
    connection = db
){
    const [result] = await connection.query(
        `
        DELETE FROM pairings
        WHERE tournament_id = ?
        `,
        [tournamentId]
    );

    return result;
}

async function deletePairingsByPlayer(
    tournamentId,
    playerId,
    connection = db
){

    const [result] = await connection.query(
        `
        DELETE FROM pairings
        WHERE tournament_id = ? AND (player1_id = ? OR player2_id = ?)
        `,
        [
            tournamentId,
            playerId,
            playerId
        ]
    );

    return result;

}

async function createPairing(
    pairing,
    connection = db
){

    const [result] = await connection.query(
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
        deletePairingsByPlayer,
        createPairing,
        getPairingsByTournament
};
