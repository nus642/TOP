const express = require("express");
const service = require("../services/match-operations.service");
const router = express.Router();

function handler(action) {
  return async (req, res) => {
    try {
      const result = await service[action](req.params.tournamentId, req.params.matchId, req.body);
      res.json(result);
    } catch (error) {
      const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404 };
      res.status(statuses[error.code] || 500).json({ error: error.message });
    }
  };
}

function readHandler(action) {
  return async (req, res) => {
    try {
      const result = await service[action](req.params.tournamentId, req.params.matchId);
      res.json(result);
    } catch (error) {
      const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404 };
      res.status(statuses[error.code] || 500).json({ error: error.message });
    }
  };
}

async function refereeWorkflowHandler(req, res) {
  try {
    const result = await service.getRefereeWorkflow(req.params.tournamentId, req.actor.actorId);
    res.json(result);
  } catch (error) {
    const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404 };
    res.status(statuses[error.code] || 500).json({ error: error.message });
  }
}

router.get("/:tournamentId/referees/:refereeId/matches", refereeWorkflowHandler);
router.put("/:tournamentId/matches/:matchId/assignment", handler("assignMatch"));
router.post("/:tournamentId/matches/:matchId/referee-responsibility", handler("acceptRefereeResponsibility"));
router.post("/:tournamentId/matches/:matchId/start", handler("startMatch"));
router.get("/:tournamentId/matches/:matchId/context", readHandler("getMatchOperationContext"));
router.put("/:tournamentId/matches/:matchId/score", handler("recordScore"));
router.post("/:tournamentId/matches/:matchId/result-confirmation", handler("confirmResult"));
router.get("/:tournamentId/matches/:matchId/official-record", readHandler("getOfficialRecord"));

module.exports = router;
