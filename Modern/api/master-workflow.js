const express = require("express");
const service = require("../services/master-workflow.service");
const liveMatchStatusService = require("../services/live-match-status.service");

const router = express.Router();

router.get("/:competitionId/live-status", async (req, res) => {
  try {
    res.json(await liveMatchStatusService.getLiveMatchStatus(req.params.competitionId));
  } catch (error) {
    const status = error.code === "VALIDATION_ERROR" ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

router.post("/:competitionId/matches/:matchId/assign", async (req, res) => {
  try {
    const result = await service.assignReferee(
      req.params.competitionId,
      req.params.matchId,
      { refereeId: req.body.refereeId }
    );
    res.json(result);
  } catch (error) {
    const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404 };
    res.status(statuses[error.code] || 500).json({ error: error.message });
  }
});

router.post("/:competitionId/matches/:matchId/confirm-result", async (req, res) => {
  try {
    res.json(await service.confirmResult(
      req.params.competitionId,
      req.params.matchId,
      req.actor
    ));
  } catch (error) {
    const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404 };
    res.status(statuses[error.code] || 500).json({ error: error.message });
  }
});

module.exports = router;
