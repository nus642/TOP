const express = require("express");
const router = express.Router();

const competitionService = require("../services/competition.service");
const checkinService = require("../services/checkin.service");
const teamService = require("../services/team.service");

const DEFAULT_TOURNAMENT_ID = 1;

function sendServerError(res, errorMessage, err) {
    console.error(err);

    res.status(500).json({
        error: errorMessage
    });
}

function getTournamentId(req) {
    return Number(req.query.tournamentId) || DEFAULT_TOURNAMENT_ID;
}

function getScopedCompetitionId(req) {
    const competitionId = Number(req.params.competitionId);

    if (!Number.isInteger(competitionId) || competitionId <= 0) {
        const error = new Error("Valid competition id is required");
        error.code = "VALIDATION_ERROR";
        throw error;
    }

    return competitionId;
}

function sendWriteError(res, err) {
    if (err.code === "VALIDATION_ERROR") {
        res.status(400).json({
            error: err.message
        });
        return;
    }

    if (err.code === "NOT_FOUND") {
        res.status(404).json({
            error: err.message
        });
        return;
    }

    sendServerError(res, "保存赛事失败", err);
}

router.post("/", async (req, res) => {
    try {
        const result = await competitionService.createCompetition(req.body);

        res.status(201).json(result);
    } catch (err) {
        sendWriteError(res, err);
    }
});


router.post("/:id/players", async (req, res) => {
    try {
        const result = await competitionService.registerPlayer(
            req.params.id,
            req.body
        );

        res.status(201).json(result);
    } catch (err) {
        sendWriteError(res, err);
    }
});


router.post("/:id/players/:playerId/waiver", async (req, res) => {
    try {
        const result = await checkinService.acceptWaiver(
            req.params.id,
            req.params.playerId,
            req.body
        );

        res.status(201).json(result);
    } catch (err) {
        sendWriteError(res, err);
    }
});

router.post("/:id/players/:playerId/check-in", async (req, res) => {
    try {
        const result = await checkinService.checkInPlayer(
            req.params.id,
            req.params.playerId,
            req.body
        );

        res.json(result);
    } catch (err) {
        sendWriteError(res, err);
    }
});

router.get("/:id/players/:playerId/check-in", async (req, res) => {
    try {
        const result = await checkinService.getCheckInStatus(
            req.params.id,
            req.params.playerId
        );

        res.json(result);
    } catch (err) {
        sendWriteError(res, err);
    }
});

router.delete("/:id/players/:playerId", async (req, res) => {
    try {
        await competitionService.withdrawPlayer(
            req.params.id,
            req.params.playerId
        );

        res.status(204).send();
    } catch (err) {
        sendWriteError(res, err);
    }
});


router.get("/:id/teams", async (req, res) => {
    try {
        const result = await teamService.getTeams(req.params.id);

        res.json(result);
    } catch (err) {
        sendWriteError(res, err);
    }
});

router.post("/:id/teams", async (req, res) => {
    try {
        const result = await teamService.createTeam(req.params.id, req.body);

        res.status(201).json(result);
    } catch (err) {
        sendWriteError(res, err);
    }
});

router.put("/:id/teams/:teamId", async (req, res) => {
    try {
        const result = await teamService.updateTeam(
            req.params.id,
            req.params.teamId,
            req.body
        );

        res.json(result);
    } catch (err) {
        sendWriteError(res, err);
    }
});

router.delete("/:id/teams/:teamId", async (req, res) => {
    try {
        await teamService.deleteTeam(req.params.id, req.params.teamId);

        res.status(204).send();
    } catch (err) {
        sendWriteError(res, err);
    }
});

router.get("/:id/teams/:teamId/members", async (req, res) => {
    try {
        const result = await teamService.getTeamMembers(
            req.params.id,
            req.params.teamId
        );

        res.json(result);
    } catch (err) {
        sendWriteError(res, err);
    }
});

router.post("/:id/teams/:teamId/members", async (req, res) => {
    try {
        const result = await teamService.addTeamMember(
            req.params.id,
            req.params.teamId,
            req.body
        );

        res.status(201).json(result);
    } catch (err) {
        sendWriteError(res, err);
    }
});

router.delete("/:id/teams/:teamId/members/:playerId", async (req, res) => {
    try {
        await teamService.removeTeamMember(
            req.params.id,
            req.params.teamId,
            req.params.playerId
        );

        res.status(204).send();
    } catch (err) {
        sendWriteError(res, err);
    }
});

router.put("/:id", async (req, res) => {
    try {
        const result = await competitionService.updateCompetition(
            req.params.id,
            req.body
        );

        res.json(result);
    } catch (err) {
        sendWriteError(res, err);
    }
});

router.post("/:id/transition", async (req, res) => {
    try {
        const result = await competitionService.transitionCompetition(
            req.params.id,
            req.body.status
        );

        res.json(result);
    } catch (err) {
        sendWriteError(res, err);
    }
});

router.post("/:competitionId/schedule", async (req, res) => {
    try {
        const result = await competitionService.saveSchedule(
            getScopedCompetitionId(req),
            req.body
        );

        res.json(result);
    } catch (err) {
        sendWriteError(res, err);
    }
});


router.get("/", async (req, res) => {
    try {
        const result = await competitionService.getCompetition(
            getTournamentId(req)
        );

        res.json(result);
    } catch (err) {
        sendServerError(res, "获取赛事数据失败", err);
    }
});

router.get("/schedule", async (req, res) => {
    try {
        const result = await competitionService.getSchedule(
            getTournamentId(req)
        );

        res.json(result);
    } catch (err) {
        sendServerError(res, "获取赛程失败", err);
    }
});

router.get("/players", async (req, res) => {
    try {
        const result = await competitionService.getPlayers(
            getTournamentId(req)
        );

        res.json(result);
    } catch (err) {
        sendServerError(res, "获取选手失败", err);
    }
});

router.get("/matches", async (req, res) => {
    try {
        const result = await competitionService.getMatches(
            getTournamentId(req)
        );

        res.json(result);
    } catch (err) {
        sendServerError(res, "获取比赛失败", err);
    }
});

router.get("/pairings", async (req, res) => {
    try {
        const result = await competitionService.getPairings(
            getTournamentId(req)
        );

        res.json(result);
    } catch (err) {
        sendServerError(res, "获取组对失败", err);
    }
});

router.post("/save", async (req, res) => {
    try {
        const result = await competitionService.saveSchedule(
            getTournamentId(req),
            req.body
        );

        res.json(result);
    } catch (err) {
        sendServerError(res, "保存赛程失败", err);
    }
});

router.put("/match/:id", async (req, res) => {
    try {
        const result = await competitionService.updateMatch(
            getTournamentId(req),
            req.params.id,
            req.body.score1,
            req.body.score2,
            req.body.status
        );

        res.json(result);
    } catch (err) {
        sendWriteError(res, err);
    }
});

router.delete("/reset", async (req, res) => {
    try {
        const result = await competitionService.resetCompetition(
            getTournamentId(req)
        );

        res.json(result);
    } catch (err) {
        sendServerError(res, "重置失败", err);
    }
});

router.delete("/:id", async (req, res) => {
    try {
        await competitionService.deleteCompetition(req.params.id);

        res.status(204).send();
    } catch (err) {
        sendWriteError(res, err);
    }
});

router.post("/generate", async (req, res) => {
    try {
        const result = await competitionService.generateCompetition(
            getTournamentId(req),
            req.body
        );

        res.json(result);
    } catch (err) {
        sendServerError(res, "生成失败", err);
    }
});

module.exports = router;
