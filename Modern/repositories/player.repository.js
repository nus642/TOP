const db = require("../database/db");


// Get all players in a tournament
async function getPlayersByTournament(tournamentId, connection = db) {

    const [rows] = await connection.query(
        `
        SELECT *
        FROM players
        WHERE tournament_id = ?
        ORDER BY id
        `,
        [tournamentId]
    );

    return rows;
}


// Create player (future implementation)
async function createPlayer(player, connection = db){

    const [result] = await connection.query(
        `
        INSERT INTO players
        (
            tournament_id,
            name,
            level,
            paired
        )
        VALUES (?, ?, ?, ?)
        `,
        [
            player.tournament_id,
            player.name,
            player.level || 3,
            player.paired ? 1 : 0
        ]
    );


    return {
        id: result.insertId,
        ...player
    };

}


// Update tournament runtime statistics (future implementation)
async function updatePlayerRuntimeStats(
    playerId,
    stats
) {

}


async function resetPlayerRuntimeStatsByTournament(
    tournamentId,
    connection = db
){

const [result] = await connection.query(
    `
    UPDATE players
    SET wins = 0, losses = 0, net = 0, curP = 0
    WHERE tournament_id = ?
    `,
    [
        tournamentId
    ]
);

    return result;

}

async function deletePlayersByTournament(
    tournamentId,
    connection = db
){

const [result] = await connection.query(
    `
    DELETE FROM players
    WHERE tournament_id = ?
    `,
    [
        tournamentId
    ]
);

return result;

}

async function deletePlayerPartnersByTournament(
    tournamentId, 
    connection = db){

    const [result] = await connection.query(
        `
        DELETE FROM player_partners
        WHERE tournament_id = ?
        `,
        [
            tournamentId
        ]
    );

    return result;

}


async function deletePlayerOpponentsByTournament( 
    tournamentId,
    connection = db){
    const [result] = await connection.query(
        `
        DELETE FROM player_opponents
        WHERE tournament_id = ?
        `,
        [
            tournamentId
        ]
    );

    return result;

}

async function getPlayerMap(
    tournamentId,
    connection = db){

    const [rows] = await connection.query(
        `
        SELECT id, name
        FROM players
        WHERE tournament_id = ?
        `,
        [
            tournamentId
        ]
    );


    const map = {};

    rows.forEach(player=>{

        map[player.name] = player.id;

    });


    return map;

}

async function getPlayerByIdForTournament(
    tournamentId,
    playerId,
    connection = db
){

    const [rows] = await connection.query(
        `
        SELECT *
        FROM players
        WHERE tournament_id = ? AND id = ?
        `,
        [
            tournamentId,
            playerId
        ]
    );

    return rows[0] || null;

}

async function deletePlayerByTournament(
    tournamentId,
    playerId,
    connection = db
){

    const [result] = await connection.query(
        `
        DELETE FROM players
        WHERE tournament_id = ? AND id = ?
        `,
        [
            tournamentId,
            playerId
        ]
    );

    return result.affectedRows > 0;

}

async function deletePlayerRelations(
    tournamentId,
    playerId,
    connection = db
){

    await connection.query(
        `
        DELETE FROM player_partners
        WHERE tournament_id = ? AND (player_id = ? OR partner_id = ?)
        `,
        [
            tournamentId,
            playerId,
            playerId
        ]
    );

    await connection.query(
        `
        DELETE FROM player_opponents
        WHERE tournament_id = ? AND (player_id = ? OR opponent_id = ?)
        `,
        [
            tournamentId,
            playerId,
            playerId
        ]
    );

}


module.exports = {

    getPlayersByTournament,
    getPlayerByIdForTournament,
    createPlayer,
    deletePlayerByTournament,
    deletePlayerRelations,
    updatePlayerRuntimeStats,
    resetPlayerRuntimeStatsByTournament,
    deletePlayersByTournament,
    deletePlayerPartnersByTournament,
    deletePlayerOpponentsByTournament,
    getPlayerMap

};
