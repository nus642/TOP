const matchRepository = require("../repositories/match.repository");
const playerRepository = require("../repositories/player.repository");
const pairingRepository = require("../repositories/pairing.repository");
const tournamentRepository = require("../repositories/tournament.repository");


async function saveSchedule(data){

    const tournamentId = 1;

    // 更新赛事名称
    if(data.tournamentName){

        await tournamentRepository.updateTournamentName(
            tournamentId,
            data.tournamentName
        );

    }

    // 删除旧球员
    await playerRepository.deletePlayersByTournament(
        tournamentId
    );

    // 保存新球员
    if(data.players){

        for(const p of data.players){

            await playerRepository.createPlayer({

                tournament_id: tournamentId,

                name: p.name,

                level: p.lv || 3,

                paired: p.paired

            });

        }

    }

    // 建立 Player Map
    const playerMap =
        await playerRepository.getPlayerMap(
            tournamentId
        );

    // 删除旧比赛
    await matchRepository.deleteMatchesByTournament(
        tournamentId
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

    team1_name: null,

    team2_name: null,

    score1: m.s1 || 0,

    score2: m.s2 || 0,

    status: m.status || "idle"
});

    }

}

    return{

        success:true,

        message:"Players migrated",

        playerMap

    };


}

async function updateMatch(matchId,score1,score2,status){

const tournamentId = 1;

await matchRepository.updateMatchScore(
    matchId,
    score1,
    score2,
    status
);

await playerRepository.resetPlayerRuntimeStatsByTournament(
    tournamentId
);

return {
    success: true
};

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

    await matchRepository.deleteMatchesByTournament(
        tournamentId
    );

    await pairingRepository.deletePairingsByTournament(
        tournamentId
    );

    await playerRepository.deletePlayersByTournament(
        tournamentId
    );

    await playerRepository.deletePlayerPartnersByTournament(
        tournamentId
    );

    await playerRepository.deletePlayerOpponentsByTournament(
        tournamentId
    );

    await tournamentRepository.updateTournamentName(
        tournamentId,
        "赛事活动"
    );

    return {
        success: true
    };
}

async function generateCompetition(data){

    const tournamentId = 1;

    await matchRepository.deleteMatchesByTournament(
        tournamentId
    );

    await pairingRepository.deletePairingsByTournament(
        tournamentId
    );

    await playerRepository.deletePlayersByTournament(
        tournamentId
    );

    await playerRepository.deletePlayerPartnersByTournament(
        tournamentId
    );

    await playerRepository.deletePlayerOpponentsByTournament(
        tournamentId
    );

    if(data.tournamentName){

        await tournamentRepository.updateTournamentName(
            tournamentId,
            data.tournamentName
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

            });

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

                });

            }

        }

    }

    return {
        success:true,
        message:"球员已保存，请调用 /api/save 保存赛程"
    };

}

module.exports = {

    saveSchedule,
    getSchedule,
    updateMatch,
    resetCompetition,
    generateCompetition
};

