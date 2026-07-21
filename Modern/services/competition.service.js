const matchRepository = require("../repositories/match.repository");
const playerRepository = require("../repositories/player.repository");
const pairingRepository = require("../repositories/pairing.repository");
const tournamentRepository = require("../repositories/tournament.repository");
const db = require("../database/db");

async function saveSchedule(data){

        const tournamentId = 1;

       return db.withTransaction(async (connection)=>{

    // 更新赛事名称
    if(data.tournamentName){

        await tournamentRepository.updateTournamentName(
            tournamentId,
            data.tournamentName,
            connection
        );

    }

    // 删除旧球员
    await playerRepository.deletePlayersByTournament(
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

        await pairingRepository.deletePairingsByTournament(
            tournamentId,
            connection
        );

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
        

    // 删除旧比赛
    await matchRepository.deleteMatchesByTournament(
        tournamentId,
        connection
        );
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

async function updateMatch(matchId,score1,score2,status){

const tournamentId = 1;

return db.withTransaction(async (connection) => {

await matchRepository.updateMatchScore(
    matchId,
    score1,
    score2,
    status,
    connection
);

await playerRepository.resetPlayerRuntimeStatsByTournament(
    tournamentId,
    connection
);

return {
    success: true
};

});
}

async function getSchedule(tournamentId){

    const tournament =
        await tournamentRepository.getTournamentById(
            tournamentId
        );

    const players =
        await playerRepository.getPlayersByTournament(
            tournamentId
        );

    const matches =
        await matchRepository.getMatchesByTournament(
            tournamentId
        );

    const pairings =
        await pairingRepository.getPairingsByTournament(
            tournamentId
        );

    return {
        tournament,
        players,
        matches,
        pairings,
        mode: pairings.length > 0 ? "fixed-pair" : "round-robin"
    };

}    

async function resetCompetition(){

    const tournamentId = 1;

    return db.withTransaction(async (connection) => {

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

async function generateCompetition(data){

    const tournamentId = 1;

     return db.withTransaction (async (connection) => {


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

module.exports = {

    saveSchedule,
    getSchedule,
    updateMatch,
    resetCompetition,
    generateCompetition
};

