const express = require("express");
const service = require("../services/referee-workflow.service");

const router = express.Router();

// This module provides referee operational access while Match Operations
// remains the authority for match execution.
function handler(action) {
  return async (req, res) => {
    try {
      const result = await service[action](
        req.params.tournamentId,
        req.actor.actorId,
        req.params.matchId,
        req.body
      );
      res.json(result);
    } catch (error) {
      const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404 };
      res.status(statuses[error.code] || 500).json({ error: error.message });
    }
  };
}

router.post("/:tournamentId/referees/:refereeId/matches/:matchId/accept", handler("acceptMatch"));
router.post("/:tournamentId/referees/:refereeId/matches/:matchId/start", handler("startMatch"));
router.post("/:tournamentId/referees/:refereeId/matches/:matchId/score", handler("recordScore"));
router.post("/:tournamentId/referees/:refereeId/matches/:matchId/confirm", handler("confirmResult"));

module.exports = router;
