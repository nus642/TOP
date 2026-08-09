const db = require("../database/db");
const officialRecordRepository = require("../repositories/match-official-record.repository");
const standingRepository = require("../repositories/competition-standing.repository");
const { calculateRoundRobinStandings } = require("../engine/competition");

function competitionId(value) {
    const id = Number(value);
    if (!Number.isInteger(id) || id <= 0) {
        const error = new Error("Valid competition id is required");
        error.code = "VALIDATION_ERROR";
        throw error;
    }
    return id;
}

async function getStandings(value) {
    const id = competitionId(value);
    return db.withTransaction(async connection => {
        const confirmedResults = await officialRecordRepository.findLatestConfirmedResults(id, connection);
        const calculated = calculateRoundRobinStandings(confirmedResults);
        const standings = await standingRepository.replaceForCompetition(id, calculated, connection);
        return { competitionId: id, format: "round-robin", standings };
    });
}

module.exports = { getStandings };
