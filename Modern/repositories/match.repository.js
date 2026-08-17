const db = require("../database/db");


async function getMatchesByTournament(tournamentId){

    const [rows] = await db.query(
        `
        SELECT *
        FROM matches
        WHERE tournament_id = ?
        ORDER BY round_num, id
        `,
        [tournamentId]
    );

    return rows;
}


async function createMatch(match, connection = db){

    const [result] = await connection.query(
        `
        INSERT INTO matches
        (
            tournament_id,
            round_num,
            court,
            player1_id,
            player2_id,
            player3_id,
            player4_id,
            team1_name,
            team2_name,
            score1,
            score2,
            status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            match.tournament_id,
            match.round_num,
            match.court,
            match.player1_id,
            match.player2_id,
            match.player3_id,
            match.player4_id,
            match.team1_name,
            match.team2_name,
            match.score1,
            match.score2,
            match.status || "idle"
        ]
    );



    return {
        id: result.insertId,
        ...match
    };

}

async function deleteMatchesByTournament(
    tournamentId,
    connection = db
){

    console.log(
        "Deleting matches for tournament:",
        tournamentId
    );


    const [result] = await connection.query(
        `
        DELETE FROM matches
        WHERE tournament_id = ?
        `,
        [
            tournamentId
        ]
    );


    console.log(
        "Deleted rows:",
        result.affectedRows
    );


    return result;

}

async function updateMatchScore(
    tournamentId,
    matchId,
    score1,
    score2,
    status,
    connection = db
) {
    const [result] = await connection.query(
        `
        UPDATE matches
        SET score1 = ?, score2 = ?, status = ?
        WHERE id = ?
        AND tournament_id = ?
        `,
        [
            score1,
            score2,
            status,
            matchId,
            tournamentId
        ]
    );

    return result;
}



async function getActiveMatchesByTournament(
    tournamentId,
    connection = db
) {
    const [rows] = await connection.query(
        `
        SELECT COUNT(*) AS cnt
        FROM matches
        WHERE tournament_id = ?
        AND status NOT IN ('idle', 'upcoming')
        `,
        [tournamentId]
    );
    return rows[0]?.cnt || 0;
}

async function findByIdForUpdate(
    tournamentId,
    matchId,
    connection = db
) {
    const [rows] = await connection.query(
        `
        SELECT *
        FROM matches
        WHERE tournament_id = ? AND id = ?
        FOR UPDATE
        `,
        [tournamentId, matchId]
    );
    return rows[0] || null;
}

async function updateMatchArrangement(
    tournamentId,
    matchId,
    data,
    connection = db
) {
    const [result] = await connection.query(
        `
        UPDATE matches
        SET round_num = ?, court = ?, player1_id = ?, player2_id = ?, player3_id = ?, player4_id = ?, team1_name = ?, team2_name = ?
        WHERE tournament_id = ? AND id = ?
        `,
        [
            data.roundNum,
            data.court,
            data.player1Id,
            data.player2Id,
            data.player3Id,
            data.player4Id,
            data.team1Name,
            data.team2Name,
            tournamentId,
            matchId
        ]
    );
    return result;
}

async function deleteMatchById(
    tournamentId,
    matchId,
    connection = db
) {
    const [result] = await connection.query(
        `
        DELETE FROM matches
        WHERE tournament_id = ? AND id = ?
        `,
        [tournamentId, matchId]
    );
    return result;
}

module.exports = {

    getMatchesByTournament,
    createMatch,
    deleteMatchesByTournament,
    updateMatchScore,
    getActiveMatchesByTournament,
    findByIdForUpdate,
    updateMatchArrangement,
    deleteMatchById
};