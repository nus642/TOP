const db = require("../database/db");
const tournamentRepository = require("../repositories/tournament.repository");
const playerRepository = require("../repositories/player.repository");
const teamRepository = require("../repositories/team.repository");

function makeValidationError(message) {
    const err = new Error(message);
    err.code = "VALIDATION_ERROR";
    return err;
}

function makeNotFoundError(message) {
    const err = new Error(message);
    err.code = "NOT_FOUND";
    return err;
}

function parsePositiveId(value, label) {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        throw makeValidationError(`Valid ${label} id is required`);
    }

    return id;
}

function normalizeTeamInput(data = {}, partial = false) {
    const team = {};

    if (Object.prototype.hasOwnProperty.call(data, "name")) {
        team.name = String(data.name || "").trim();
    }

    if (Object.prototype.hasOwnProperty.call(data, "status")) {
        team.status = String(data.status || "").trim();
    }

    if (!partial || Object.prototype.hasOwnProperty.call(data, "name")) {
        if (!team.name) {
            throw makeValidationError("Team name is required");
        }
    }

    if (!partial && !team.status) {
        team.status = "active";
    }

    return team;
}

function normalizeRole(value) {
    const role = String(value || "member").trim();

    if (!role) {
        throw makeValidationError("Team member role is required");
    }

    return role;
}

async function requireCompetition(tournamentId, connection) {
    const competition = await tournamentRepository.getTournamentByIdWithConnection(
        tournamentId,
        connection
    );

    if (!competition) {
        throw makeNotFoundError("Competition not found");
    }

    return competition;
}

async function requireTeam(tournamentId, teamId, connection) {
    const team = await teamRepository.getTeamByIdForTournament(
        tournamentId,
        teamId,
        connection
    );

    if (!team) {
        throw makeNotFoundError("Team not found");
    }

    return team;
}

async function requirePlayer(tournamentId, playerId, connection) {
    const player = await playerRepository.getPlayerByIdForTournament(
        tournamentId,
        playerId,
        connection
    );

    if (!player) {
        throw makeNotFoundError("Player not found");
    }

    return player;
}

async function createTeam(competitionIdValue, data) {
    const tournamentId = parsePositiveId(competitionIdValue, "competition");
    const team = normalizeTeamInput(data);

    return db.withTransaction(async (connection) => {
        await requireCompetition(tournamentId, connection);

        const createdTeam = await teamRepository.createTeam({
            tournament_id: tournamentId,
            ...team
        }, connection);

        return { team: createdTeam };
    });
}

async function getTeams(competitionIdValue) {
    const tournamentId = parsePositiveId(competitionIdValue, "competition");

    return db.withTransaction(async (connection) => {
        await requireCompetition(tournamentId, connection);

        const teams = await teamRepository.listTeams(tournamentId, connection);

        return { teams };
    });
}

async function updateTeam(competitionIdValue, teamIdValue, data) {
    const tournamentId = parsePositiveId(competitionIdValue, "competition");
    const teamId = parsePositiveId(teamIdValue, "team");
    const team = normalizeTeamInput(data, true);

    return db.withTransaction(async (connection) => {
        await requireCompetition(tournamentId, connection);
        await requireTeam(tournamentId, teamId, connection);

        const updatedTeam = await teamRepository.updateTeam(
            tournamentId,
            teamId,
            team,
            connection
        );

        return { team: updatedTeam };
    });
}

async function deleteTeam(competitionIdValue, teamIdValue) {
    const tournamentId = parsePositiveId(competitionIdValue, "competition");
    const teamId = parsePositiveId(teamIdValue, "team");

    return db.withTransaction(async (connection) => {
        await requireCompetition(tournamentId, connection);
        await requireTeam(tournamentId, teamId, connection);

        await teamRepository.deleteTeam(tournamentId, teamId, connection);
    });
}

async function addTeamMember(competitionIdValue, teamIdValue, data = {}) {
    const tournamentId = parsePositiveId(competitionIdValue, "competition");
    const teamId = parsePositiveId(teamIdValue, "team");
    const playerId = parsePositiveId(data.playerId, "player");
    const role = normalizeRole(data.role);

    return db.withTransaction(async (connection) => {
        await requireCompetition(tournamentId, connection);
        await requireTeam(tournamentId, teamId, connection);
        await requirePlayer(tournamentId, playerId, connection);

        const member = await teamRepository.addMember(teamId, playerId, role, connection);

        return { member };
    });
}

async function removeTeamMember(competitionIdValue, teamIdValue, playerIdValue) {
    const tournamentId = parsePositiveId(competitionIdValue, "competition");
    const teamId = parsePositiveId(teamIdValue, "team");
    const playerId = parsePositiveId(playerIdValue, "player");

    return db.withTransaction(async (connection) => {
        await requireCompetition(tournamentId, connection);
        await requireTeam(tournamentId, teamId, connection);
        await requirePlayer(tournamentId, playerId, connection);

        await teamRepository.removeMember(teamId, playerId, connection);
    });
}

async function getTeamMembers(competitionIdValue, teamIdValue) {
    const tournamentId = parsePositiveId(competitionIdValue, "competition");
    const teamId = parsePositiveId(teamIdValue, "team");

    return db.withTransaction(async (connection) => {
        await requireCompetition(tournamentId, connection);
        await requireTeam(tournamentId, teamId, connection);

        const members = await teamRepository.listMembers(teamId, connection);

        return { members };
    });
}

module.exports = {
    createTeam,
    getTeams,
    updateTeam,
    deleteTeam,
    addTeamMember,
    removeTeamMember,
    getTeamMembers
};
