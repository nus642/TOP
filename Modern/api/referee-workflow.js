const express = require("express");
const service = require("../services/referee-workflow.service");

const router = express.Router();

// This module provides referee operational access while Match Operations
// remains the authority for match execution.
function handler(action, operationData = () => ({})) {
  return async (req, res) => {
    try {
      const result = await service[action](
        req.params.tournamentId,
        req.actor,
        req.params.matchId,
        operationData(req)
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
router.post("/:tournamentId/referees/:refereeId/matches/:matchId/interrupt", handler(
  "interruptMatch", (req) => ({ correlationId: req.body.correlationId })
));
router.post("/:tournamentId/referees/:refereeId/matches/:matchId/resume", handler(
  "resumeMatch", (req) => ({ correlationId: req.body.correlationId })
));
router.post("/:tournamentId/referees/:refereeId/matches/:matchId/score", handler(
  "recordScore",
  (req) => ({ score1: req.body.score1, score2: req.body.score2 })
));

module.exports = router;
