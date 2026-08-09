const { Standing } = require("./standing");

function participantId(value) {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
        throw new TypeError("Confirmed results require valid participant ids");
    }
    return id;
}

function score(value) {
    const result = Number(value);
    if (!Number.isInteger(result) || result < 0) {
        throw new TypeError("Confirmed results require non-negative integer scores");
    }
    return result;
}

/** Pure calculation: no repository, workflow, or scheduling concerns. */
function calculateRoundRobinStandings(results) {
    if (!Array.isArray(results)) throw new TypeError("Results must be an array");

    const totals = new Map();
    const get = (id) => {
        if (!totals.has(id)) totals.set(id, { participantId: id, played: 0, wins: 0, losses: 0, scoreFor: 0, scoreAgainst: 0 });
        return totals.get(id);
    };

    for (const result of results) {
        // The engine accepts mixed feeds defensively, but unfinished facts never contribute.
        if (!result || result.confirmed !== true) continue;

        const sideOneId = participantId(result.sideOneId);
        const sideTwoId = participantId(result.sideTwoId);
        if (sideOneId === sideTwoId) throw new TypeError("A participant cannot play itself");
        const sideOneScore = score(result.sideOneScore);
        const sideTwoScore = score(result.sideTwoScore);
        const sideOne = get(sideOneId);
        const sideTwo = get(sideTwoId);

        sideOne.played += 1;
        sideTwo.played += 1;
        sideOne.scoreFor += sideOneScore;
        sideOne.scoreAgainst += sideTwoScore;
        sideTwo.scoreFor += sideTwoScore;
        sideTwo.scoreAgainst += sideOneScore;

        if (sideOneScore > sideTwoScore) {
            sideOne.wins += 1;
            sideTwo.losses += 1;
        } else if (sideTwoScore > sideOneScore) {
            sideTwo.wins += 1;
            sideOne.losses += 1;
        }
    }

    return [...totals.values()]
        .map(total => new Standing(total))
        // Existing documented behavior: wins, then score difference. Id only makes output deterministic.
        .sort((a, b) => b.wins - a.wins || b.scoreDifference - a.scoreDifference || a.participantId - b.participantId);
}

module.exports = { calculateRoundRobinStandings };
