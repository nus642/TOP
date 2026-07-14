const db = require("../database/db");


// Get all players in a tournament
async function getPlayersByTournament(tournamentId) {

    const [rows] = await db.query(
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
async function createPlayer(player){

    const [result] = await db.query(
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


async function resetPlayerRuntimeStatsByTournament(tournamentId){

const [result] = await db.query(
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

async function deletePlayersByTournament(tournamentId){

const [result] = await db.query(
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

async function deletePlayerPartnersByTournament(tournamentId){

    const [result] = await db.query(
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


async function deletePlayerOpponentsByTournament(tournamentId){

    const [result] = await db.query(
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

async function getPlayerMap(tournamentId){

    const [rows] = await db.query(
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


module.exports = {

    getPlayersByTournament,
    createPlayer,
    updatePlayerRuntimeStats,
    resetPlayerRuntimeStatsByTournament,
    deletePlayersByTournament,
    deletePlayerPartnersByTournament,
    deletePlayerOpponentsByTournament,
    getPlayerMap

};