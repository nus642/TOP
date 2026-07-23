const express = require("express");
const router = express.Router();

const competitionService = require("../services/competition.service");

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
        const result = await competitionService.saveSchedule(req.body);

        res.json(result);
    } catch (err) {
        sendServerError(res, "保存赛程失败", err);
    }
});

router.put("/match/:id", async (req, res) => {
    try {
        const result = await competitionService.updateMatch(
            req.params.id,
            req.body.score1,
            req.body.score2,
            req.body.status
        );

        res.json(result);
    } catch (err) {
        sendServerError(res, "更新失败", err);
    }
});

router.delete("/reset", async (req, res) => {
    try {
        const result = await competitionService.resetCompetition();

        res.json(result);
    } catch (err) {
        sendServerError(res, "重置失败", err);
    }
});

router.post("/generate", async (req, res) => {
    try {
        const result = await competitionService.generateCompetition(
            req.body
        );

        res.json(result);
    } catch (err) {
        sendServerError(res, "生成失败", err);
    }
});

module.exports = router;
