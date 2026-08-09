const matchRepository = require("../repositories/match.repository");
const playerRepository = require("../repositories/player.repository");
const pairingRepository = require("../repositories/pairing.repository");
const tournamentRepository = require("../repositories/tournament.repository");
const db = require("../database/db");
const { generateRoundRobinMatches } = require("../engine/competition");

const COMPETITION_STATUSES = Object.freeze({
    DRAFT: "draft",
    REGISTRATION_OPEN: "registration_open",
    REGISTRATION_CLOSED: "registration_closed",
    CHECK_IN_OPEN: "check_in_open",
    READY: "ready",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    CANCELLED: "cancelled"
});

const ALLOWED_TRANSITIONS = Object.freeze({
    [COMPETITION_STATUSES.DRAFT]: [
        COMPETITION_STATUSES.REGISTRATION_OPEN,
        COMPETITION_STATUSES.CANCELLED
    ],
    [COMPETITION_STATUSES.REGISTRATION_OPEN]: [
        COMPETITION_STATUSES.REGISTRATION_CLOSED,
        COMPETITION_STATUSES.CANCELLED
    ],
    [COMPETITION_STATUSES.REGISTRATION_CLOSED]: [
        COMPETITION_STATUSES.CHECK_IN_OPEN,
        COMPETITION_STATUSES.READY,
        COMPETITION_STATUSES.CANCELLED
    ],
    [COMPETITION_STATUSES.CHECK_IN_OPEN]: [
        COMPETITION_STATUSES.READY,
        COMPETITION_STATUSES.CANCELLED
    ],
    [COMPETITION_STATUSES.READY]: [
        COMPETITION_STATUSES.IN_PROGRESS,
        COMPETITION_STATUSES.CANCELLED
    ],
    [COMPETITION_STATUSES.IN_PROGRESS]: [
        COMPETITION_STATUSES.COMPLETED,
        COMPETITION_STATUSES.CANCELLED
    ],
    [COMPETITION_STATUSES.COMPLETED]: [],
    [COMPETITION_STATUSES.CANCELLED]: []
});

function isKnownCompetitionStatus(status) {
    return Object.prototype.hasOwnProperty.call(ALLOWED_TRANSITIONS, status);
}

function normalizeCompetitionStatus(status) {
    if (typeof status !== "string" || status.trim() === "") {
        throw makeValidationError("Competition status is required");
    }

    const normalizedStatus = status.trim();

    if (!isKnownCompetitionStatus(normalizedStatus)) {
        throw makeValidationError(`Unknown competition status: ${normalizedStatus}`);
    }

    return normalizedStatus;
}

function validateCompetitionTransition(currentStatus, nextStatus) {
    const normalizedCurrentStatus = normalizeCompetitionStatus(
        currentStatus || COMPETITION_STATUSES.DRAFT
    );
    const normalizedNextStatus = normalizeCompetitionStatus(nextStatus);
    const allowedStatuses = ALLOWED_TRANSITIONS[normalizedCurrentStatus];

    if (!allowedStatuses.includes(normalizedNextStatus)) {
        throw makeValidationError(
            `Cannot transition competition from ${normalizedCurrentStatus} to ${normalizedNextStatus}`
        );
    }

    return normalizedNextStatus;
}

function makeValidationError(message){

    const error = new Error(message);
    error.code = "VALIDATION_ERROR";

    return error;

}

function makeNotFoundError(message){

    const error = new Error(message);
    error.code = "NOT_FOUND";

    return error;

}


function parsePlayerId(id){

    const playerId = Number(id);

    if (!Number.isInteger(playerId) || playerId <= 0) {
        throw makeValidationError("Valid player id is required");
    }

    return playerId;

}

function normalizePlayerRegistration(data){

    if (!data || !data.name || typeof data.name !== "string" || data.name.trim() === "") {
        throw makeValidationError("Player name is required");
    }

    return {
        name: data.name.trim(),
        level: Number.isInteger(Number(data.level ?? data.lv))
            ? Number(data.level ?? data.lv)
            : 3,
        paired: Boolean(data.paired)
    };

}

function parseCompetitionId(id){

    const competitionId = Number(id);

    if (!Number.isInteger(competitionId) || competitionId <= 0) {
        throw makeValidationError("Valid competition id is required");
    }

    return competitionId;

}


async function requireCompetition(competitionId, connection){

    const competition = await tournamentRepository.getTournamentByIdWithConnection(
        competitionId,
        connection
    );

    if (!competition) {
        throw makeNotFoundError("Competition not found");
    }

    return competition;

}

async function createCompetition(data){

    if (!data || !data.name) {
        throw makeValidationError("Competition name is required");
    }

    if (!data.sport) {
        throw makeValidationError("Competition sport is required");
    }

    return db.withTransaction(async (connection) => {

        const competition = await tournamentRepository.createTournament({
            name: data.name,
            sport: data.sport,
            status: data.status
                ? normalizeCompetitionStatus(data.status)
                : COMPETITION_STATUSES.DRAFT
        }, connection);

        return {
            competition
        };

    });

}

async function transitionCompetition(id, nextStatusValue){

    const competitionId = parseCompetitionId(id);
    const nextStatus = normalizeCompetitionStatus(nextStatusValue);

    return db.withTransaction(async (connection) => {

        const existingCompetition = await tournamentRepository.getTournamentByIdWithConnection(
            competitionId,
            connection
        );

        if (!existingCompetition) {
            throw makeNotFoundError("Competition not found");
        }

        validateCompetitionTransition(
            existingCompetition.status,
            nextStatus
        );

        const competition = await tournamentRepository.updateTournament(
            competitionId,
            {
                status: nextStatus
            },
            connection
        );

        return {
            competition
        };

    });

}

async function updateCompetition(id, data){

    const competitionId = parseCompetitionId(id);
    const updates = {};

    for (const field of ["name", "sport", "status"]) {
        if (data && Object.prototype.hasOwnProperty.call(data, field) && data[field] !== undefined && data[field] !== null) {
            updates[field] = field === "status"
                ? normalizeCompetitionStatus(data[field])
                : data[field];
        }
    }

    return db.withTransaction(async (connection) => {

        const competition = await tournamentRepository.updateTournament(
            competitionId,
            updates,
            connection
        );

        if (!competition) {
            throw makeNotFoundError("Competition not found");
        }

        return {
            competition
        };

    });

}

async function deleteCompetition(id){

    const competitionId = parseCompetitionId(id);

    return db.withTransaction(async (connection) => {

        const deleted = await tournamentRepository.deleteTournament(
            competitionId,
            connection
        );

        if (!deleted) {
            throw makeNotFoundError("Competition not found");
        }

        return {
            success: true
        };

    });

}

async function registerPlayer(competitionIdValue, data){

    const competitionId = parseCompetitionId(competitionIdValue);
    const player = normalizePlayerRegistration(data);

    return db.withTransaction(async (connection) => {

        const competition = await tournamentRepository.getTournamentByIdWithConnection(
            competitionId,
            connection
        );

        if (!competition) {
            throw makeNotFoundError("Competition not found");
        }

        const createdPlayer = await playerRepository.createPlayer({
            tournament_id: competitionId,
            name: player.name,
            level: player.level,
            paired: player.paired
        }, connection);

        return {
            player: createdPlayer
        };

    });

}

async function withdrawPlayer(competitionIdValue, playerIdValue){

    const competitionId = parseCompetitionId(competitionIdValue);
    const playerId = parsePlayerId(playerIdValue);

    return db.withTransaction(async (connection) => {

        const competition = await tournamentRepository.getTournamentByIdWithConnection(
            competitionId,
            connection
        );

        if (!competition) {
            throw makeNotFoundError("Competition not found");
        }

        const player = await playerRepository.getPlayerByIdForTournament(
            competitionId,
            playerId,
            connection
        );

        if (!player) {
            throw makeNotFoundError("Player not found");
        }

        await pairingRepository.deletePairingsByPlayer(
            competitionId,
            playerId,
            connection
        );

        await playerRepository.deletePlayerRelations(
            competitionId,
            playerId,
            connection
        );

        await playerRepository.deletePlayerByTournament(
            competitionId,
            playerId,
            connection
        );

        return {
            success: true
        };

    });

}

async function saveSchedule(competitionIdValue, data){

        const tournamentId = parseCompetitionId(competitionIdValue);

       return db.withTransaction(async (connection)=>{

    await requireCompetition(tournamentId, connection);

    // 更新赛事名称
    if(data.tournamentName){

        await tournamentRepository.updateTournamentName(
            tournamentId,
            data.tournamentName,
            connection
        );

    }

    // 删除旧数据（顺序与 resetCompetition/generateCompetition 一致）
    await matchRepository.deleteMatchesByTournament(
        tournamentId,
        connection
    );

    await pairingRepository.deletePairingsByTournament(
        tournamentId,
        connection
    );

    await playerRepository.deletePlayersByTournament(
        tournamentId,
        connection
    );

    await playerRepository.deletePlayerPartnersByTournament(
        tournamentId,
        connection
    );

    await playerRepository.deletePlayerOpponentsByTournament(
        tournamentId,
        connection
    );

    // 保存新球员
    if(data.players){

        for(const p of data.players){

            await playerRepository.createPlayer({

                tournament_id: tournamentId,

                name: p.name,

                level: p.lv || 3,

                paired: p.paired

             },
             connection
        );

         }

        }    

    // 建立 Player Map
    const playerMap =
        await playerRepository.getPlayerMap(
            tournamentId,
            connection
        );

    // 保存固定组对
    if(data.mode === "fixed-pair" && data.pairs){

        for(const pair of data.pairs){

            const names = pair.name.split(" & ");

            const player1Id = playerMap[names[0]];
            const player2Id = playerMap[names[1]];

            if(player1Id && player2Id){

                await pairingRepository.createPairing({
                    tournament_id:tournamentId,
                    player1_id:player1Id,
                    player2_id:player2Id
                 },
                connection
            );

            }
        }
    } 

    // 保存比赛
        for(let r = 0; r < data.rounds.length; r++){

        const roundMatches = data.rounds[r];


    console.log(
        "Round:",
        r + 1,
        "Count:",
        roundMatches.length
    );


    for(const m of roundMatches){

        await matchRepository.createMatch({
    tournament_id: tournamentId,

    round_num: r + 1,

    court: m.court,

    player1_id: playerMap[m.p1],

    player2_id: playerMap[m.p2],

    player3_id: playerMap[m.p3],

    player4_id: playerMap[m.p4],

    team1_name: data.mode === "fixed-pair" ? m.team1 : null,

    team2_name: data.mode === "fixed-pair" ? m.team2 : null,

    score1: m.s1 ?? null,
    
    score2: m.s2 ?? null,

    status: m.status || "idle"
},
connection
);
    }

}

    return{

        success:true,

        message:"Players migrated",

        playerMap

    };

});

}

async function updateMatch(tournamentIdValue,matchId,score1,score2,status){

const tournamentId = parseCompetitionId(tournamentIdValue);

return db.withTransaction(async (connection) => {

const result = await matchRepository.updateMatchScore(
    tournamentId,
    matchId,
    score1,
    score2,
    status,
    connection
);

if(result.affectedRows === 0){
    throw makeNotFoundError("Match not found for competition");
}

await playerRepository.resetPlayerRuntimeStatsByTournament(
    tournamentId,
    connection
);

return {
    success: true
};

});
}

async function getCompetition(tournamentId){

    const [
        tournament,
        players,
        matches,
        pairings
    ] = await Promise.all([
        tournamentRepository.getTournamentById(tournamentId),
        playerRepository.getPlayersByTournament(tournamentId),
        matchRepository.getMatchesByTournament(tournamentId),
        pairingRepository.getPairingsByTournament(tournamentId)
    ]);

    return {
        tournament,
        players,
        matches,
        pairings,
        mode: pairings.length > 0 ? "fixed-pair" : "round-robin"
    };

}

async function getSchedule(tournamentId){

    return getCompetition(tournamentId);

}

async function getPlayers(tournamentId){

    return {
        players: await playerRepository.getPlayersByTournament(tournamentId)
    };

}

async function getMatches(tournamentId){

    return {
        matches: await matchRepository.getMatchesByTournament(tournamentId)
    };

}

async function getPairings(tournamentId){

    return {
        pairings: await pairingRepository.getPairingsByTournament(tournamentId)
    };

}

async function resetCompetition(competitionIdValue){

    const tournamentId = parseCompetitionId(competitionIdValue);

    return db.withTransaction(async (connection) => {

    await requireCompetition(tournamentId, connection);

    await matchRepository.deleteMatchesByTournament(
        tournamentId,
        connection
    );

    await pairingRepository.deletePairingsByTournament(
        tournamentId,
        connection
    );

    await playerRepository.deletePlayersByTournament(
        tournamentId,
        connection
    );

    await playerRepository.deletePlayerPartnersByTournament(
        tournamentId,
        connection
    );

    await playerRepository.deletePlayerOpponentsByTournament(
        tournamentId,
        connection
    );

    await tournamentRepository.updateTournamentName(
        tournamentId,
        "赛事活动",
        connection
    );

    return {
        success: true
    };
        });
}

async function generateCompetition(competitionIdValue, data){

    const tournamentId = parseCompetitionId(competitionIdValue);

     return db.withTransaction (async (connection) => {

    await requireCompetition(tournamentId, connection);

    await matchRepository.deleteMatchesByTournament(
        tournamentId,
        connection
    );

    await pairingRepository.deletePairingsByTournament(
        tournamentId,
        connection  
    );

    await playerRepository.deletePlayersByTournament(
        tournamentId,
        connection
    );

    await playerRepository.deletePlayerPartnersByTournament(
        tournamentId,
        connection
    );

    await playerRepository.deletePlayerOpponentsByTournament(
        tournamentId,
        connection
    );

    if(data.tournamentName){

        await tournamentRepository.updateTournamentName(
            tournamentId,
            data.tournamentName,
            connection  
        );

    }

    const playerMap = {};

    for(const player of data.players){

        const createdPlayer =
            await playerRepository.createPlayer({

                tournament_id:tournamentId,

                name:player.name,

                level:player.lv || 3,

                paired:player.paired || false

            },
            connection
        );

        playerMap[player.name] = createdPlayer.id;

    }



    if(data.mode === "fixed-pair" && data.pairs){

        for(const pair of data.pairs){

            const names =
                pair.name.split(" & ");

            const player1Id =
                playerMap[names[0]];

            const player2Id =
                playerMap[names[1]];

            if(player1Id && player2Id){

                await pairingRepository.createPairing({

                    tournament_id:tournamentId,

                    player1_id:player1Id,

                    player2_id:player2Id
                },
                connection
            );

            }

        }

    }

    return {
        success:true,
        message:"球员已保存，请调用 /api/save 保存赛程"
    };

    });
}

async function generateRoundRobin(competitionIdValue){
    const tournamentId = parseCompetitionId(competitionIdValue);

    return db.withTransaction(async (connection) => {
        await requireCompetition(tournamentId, connection);

        const participants = await playerRepository.getPlayersByTournament(
            tournamentId,
            connection
        );

        let generated;
        try {
            generated = generateRoundRobinMatches(participants);
        } catch (error) {
            throw makeValidationError(error.message);
        }

        const matches = [];
        for (const match of generated) {
            matches.push(await matchRepository.createMatch({
                tournament_id: tournamentId,
                round_num: match.roundNumber,
                court: null,
                player1_id: match.sideOneId,
                player2_id: null,
                player3_id: match.sideTwoId,
                player4_id: null,
                team1_name: null,
                team2_name: null,
                score1: null,
                score2: null,
                status: "idle"
            }, connection));
        }

        return {
            competitionId: tournamentId,
            format: "round-robin",
            matches
        };
    });
}

module.exports = {

    createCompetition,
    updateCompetition,
    transitionCompetition,
    registerPlayer,
    withdrawPlayer,
    deleteCompetition,
    saveSchedule,
    getCompetition,
    getSchedule,
    getPlayers,
    getMatches,
    getPairings,
    updateMatch,
    resetCompetition,
    generateCompetition,
    generateRoundRobin,
    COMPETITION_STATUSES,
    ALLOWED_TRANSITIONS
};
