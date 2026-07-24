const assert = require("node:assert/strict");
const test = require("node:test");

process.env.MYSQL_HOST = process.env.MYSQL_HOST || "localhost";

const db = require("../database/db");
const tournamentRepository = require("../repositories/tournament.repository");
const playerRepository = require("../repositories/player.repository");
const teamRepository = require("../repositories/team.repository");
const teamService = require("../services/team.service");

const original = {
    withTransaction: db.withTransaction,
    getTournamentByIdWithConnection: tournamentRepository.getTournamentByIdWithConnection,
    getPlayerByIdForTournament: playerRepository.getPlayerByIdForTournament,
    createTeam: teamRepository.createTeam,
    getTeamByIdForTournament: teamRepository.getTeamByIdForTournament,
    listTeams: teamRepository.listTeams,
    updateTeam: teamRepository.updateTeam,
    deleteTeam: teamRepository.deleteTeam,
    addMember: teamRepository.addMember,
    removeMember: teamRepository.removeMember,
    listMembers: teamRepository.listMembers
};

test.beforeEach(() => {
    db.withTransaction = async (work) => work({});
    tournamentRepository.getTournamentByIdWithConnection = async (id) => ({ id });
    playerRepository.getPlayerByIdForTournament = async (competitionId, playerId) => ({
        id: playerId,
        tournament_id: competitionId,
        name: "Ada"
    });
    teamRepository.getTeamByIdForTournament = async (competitionId, teamId) => ({
        id: teamId,
        tournament_id: competitionId,
        name: "Aces",
        status: "active"
    });
});

test.afterEach(() => {
    db.withTransaction = original.withTransaction;
    tournamentRepository.getTournamentByIdWithConnection = original.getTournamentByIdWithConnection;
    playerRepository.getPlayerByIdForTournament = original.getPlayerByIdForTournament;
    teamRepository.createTeam = original.createTeam;
    teamRepository.getTeamByIdForTournament = original.getTeamByIdForTournament;
    teamRepository.listTeams = original.listTeams;
    teamRepository.updateTeam = original.updateTeam;
    teamRepository.deleteTeam = original.deleteTeam;
    teamRepository.addMember = original.addMember;
    teamRepository.removeMember = original.removeMember;
    teamRepository.listMembers = original.listMembers;
});

test("createTeam creates a team for an existing competition", async () => {
    teamRepository.createTeam = async (data) => ({
        id: 12,
        ...data
    });

    const result = await teamService.createTeam(7, {
        name: "Aces"
    });

    assert.deepEqual(result, {
        team: {
            id: 12,
            tournament_id: 7,
            name: "Aces",
            status: "active"
        }
    });
});

test("getTeams lists teams for a competition", async () => {
    teamRepository.listTeams = async (competitionId) => [
        { id: 1, tournament_id: competitionId, name: "Aces" },
        { id: 2, tournament_id: competitionId, name: "Bears" }
    ];

    const result = await teamService.getTeams(7);

    assert.deepEqual(result, {
        teams: [
            { id: 1, tournament_id: 7, name: "Aces" },
            { id: 2, tournament_id: 7, name: "Bears" }
        ]
    });
});

test("updateTeam updates allowed fields", async () => {
    teamRepository.updateTeam = async (competitionId, teamId, data) => ({
        id: teamId,
        tournament_id: competitionId,
        name: data.name,
        status: data.status
    });

    const result = await teamService.updateTeam(7, 8, {
        name: "Updated Aces",
        status: "inactive",
        ignored: "value"
    });

    assert.deepEqual(result, {
        team: {
            id: 8,
            tournament_id: 7,
            name: "Updated Aces",
            status: "inactive"
        }
    });
});

test("deleteTeam removes an existing team", async () => {
    let deleted = false;
    teamRepository.deleteTeam = async (competitionId, teamId) => {
        deleted = competitionId === 7 && teamId === 8;
        return deleted;
    };

    await teamService.deleteTeam(7, 8);

    assert.equal(deleted, true);
});

test("addTeamMember adds a player to a team", async () => {
    teamRepository.addMember = async (teamId, playerId, role) => ({
        id: 30,
        team_id: teamId,
        player_id: playerId,
        role
    });

    const result = await teamService.addTeamMember(7, 8, {
        playerId: 9,
        role: "captain"
    });

    assert.deepEqual(result, {
        member: {
            id: 30,
            team_id: 8,
            player_id: 9,
            role: "captain"
        }
    });
});

test("removeTeamMember removes a player from a team", async () => {
    let removed = false;
    teamRepository.removeMember = async (teamId, playerId) => {
        removed = teamId === 8 && playerId === 9;
        return removed;
    };

    await teamService.removeTeamMember(7, 8, 9);

    assert.equal(removed, true);
});

test("getTeamMembers lists team members", async () => {
    teamRepository.listMembers = async (teamId) => [
        { id: 30, team_id: teamId, player_id: 9, role: "member" }
    ];

    const result = await teamService.getTeamMembers(7, 8);

    assert.deepEqual(result, {
        members: [
            { id: 30, team_id: 8, player_id: 9, role: "member" }
        ]
    });
});

test("team operations reject unknown competition", async () => {
    tournamentRepository.getTournamentByIdWithConnection = async () => null;

    await assert.rejects(
        () => teamService.createTeam(404, { name: "Aces" }),
        { code: "NOT_FOUND" }
    );
});

test("addTeamMember rejects unknown player", async () => {
    playerRepository.getPlayerByIdForTournament = async () => null;

    await assert.rejects(
        () => teamService.addTeamMember(7, 8, { playerId: 999 }),
        { code: "NOT_FOUND" }
    );
});

test("duplicate membership updates role and returns the member", async () => {
    const calls = [];
    teamRepository.addMember = async (teamId, playerId, role) => {
        calls.push([teamId, playerId, role]);
        return {
            id: 30,
            team_id: teamId,
            player_id: playerId,
            role
        };
    };

    await teamService.addTeamMember(7, 8, { playerId: 9, role: "member" });
    const result = await teamService.addTeamMember(7, 8, { playerId: 9, role: "captain" });

    assert.deepEqual(calls, [
        [8, 9, "member"],
        [8, 9, "captain"]
    ]);
    assert.equal(result.member.role, "captain");
});
