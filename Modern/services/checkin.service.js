const db = require("../database/db");
const checkinRepository = require("../repositories/checkin.repository");
const playerRepository = require("../repositories/player.repository");
const tournamentRepository = require("../repositories/tournament.repository");
const waiverRepository = require("../repositories/waiver.repository");

const DEFAULT_WAIVER_VERSION = "v1";

function makeValidationError(message) {
    const error = new Error(message);
    error.code = "VALIDATION_ERROR";
    return error;
}

function makeNotFoundError(message) {
    const error = new Error(message);
    error.code = "NOT_FOUND";
    return error;
}

function parsePositiveId(value, label) {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        throw makeValidationError(`Valid ${label} id is required`);
    }

    return id;
}

async function requireCompetitionAndPlayer(competitionId, playerId, connection) {
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

    return { competition, player };
}

function normalizeWaiver(data, player) {
    if (!data || data.acceptWaiver !== true) {
        throw makeValidationError("Waiver acceptance is required");
    }

    return {
        waiverVersion: typeof data.waiverVersion === "string" && data.waiverVersion.trim()
            ? data.waiverVersion.trim()
            : DEFAULT_WAIVER_VERSION,
        acceptedBy: typeof data.acceptedBy === "string" && data.acceptedBy.trim()
            ? data.acceptedBy.trim()
            : player.name
    };
}

async function acceptWaiver(competitionIdValue, playerIdValue, data) {
    const competitionId = parsePositiveId(competitionIdValue, "competition");
    const playerId = parsePositiveId(playerIdValue, "player");

    return db.withTransaction(async (connection) => {
        const { player } = await requireCompetitionAndPlayer(
            competitionId,
            playerId,
            connection
        );
        const waiver = normalizeWaiver(data, player);
        const acceptedAt = new Date();

        return {
            waiver: await waiverRepository.createWaiver({
                competitionId,
                playerId,
                waiverVersion: waiver.waiverVersion,
                acceptedBy: waiver.acceptedBy,
                acceptedAt
            }, connection)
        };
    });
}

async function checkInPlayer(competitionIdValue, playerIdValue, data = {}) {
    const competitionId = parsePositiveId(competitionIdValue, "competition");
    const playerId = parsePositiveId(playerIdValue, "player");

    return db.withTransaction(async (connection) => {
        const { player } = await requireCompetitionAndPlayer(
            competitionId,
            playerId,
            connection
        );
        let waiver = await waiverRepository.getLatestWaiver(
            competitionId,
            playerId,
            connection
        );

        if (!waiver && data.acceptWaiver === true) {
            const normalizedWaiver = normalizeWaiver(data, player);
            waiver = await waiverRepository.createWaiver({
                competitionId,
                playerId,
                waiverVersion: normalizedWaiver.waiverVersion,
                acceptedBy: normalizedWaiver.acceptedBy,
                acceptedAt: new Date()
            }, connection);
        }

        if (!waiver) {
            throw makeValidationError("Accepted waiver is required before check-in");
        }

        const checkedInAt = new Date();
        const checkIn = await checkinRepository.upsertCheckInState({
            competitionId,
            playerId,
            checkedIn: true,
            checkedInAt
        }, connection);

        return {
            player,
            waiver,
            checkIn
        };
    });
}

async function getCheckInStatus(competitionIdValue, playerIdValue) {
    const competitionId = parsePositiveId(competitionIdValue, "competition");
    const playerId = parsePositiveId(playerIdValue, "player");

    return db.withTransaction(async (connection) => {
        const { player } = await requireCompetitionAndPlayer(
            competitionId,
            playerId,
            connection
        );
        const [checkIn, waiver] = await Promise.all([
            checkinRepository.getCheckInState(competitionId, playerId, connection),
            waiverRepository.getLatestWaiver(competitionId, playerId, connection)
        ]);

        return {
            player,
            checkedIn: Boolean(checkIn && checkIn.checked_in),
            checkIn,
            waiver
        };
    });
}

module.exports = {
    acceptWaiver,
    checkInPlayer,
    getCheckInStatus
};
