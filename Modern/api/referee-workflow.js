const express = require("express");
const service = require("../services/referee-workflow.service");
const refereeDraftService = require("../services/referee-draft.service");

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
      const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404, FORBIDDEN: 403, CONFLICT: 409 };
      res.status(statuses[error.code] || 500).json({ error: error.message });
    }
  };
}

router.post("/:tournamentId/referees/:refereeId/matches/:matchId/accept", handler("acceptMatch",
  (req) => ({ expectedVersion: req.body.expectedVersion, correlationId: req.body.correlationId })
));
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
// Live score snapshot (M2 ED-04): per-point score write without state transition.
router.put("/:tournamentId/referees/:refereeId/matches/:matchId/score-snapshot", handler(
  "writeScoreSnapshot",
  (req) => ({ score1: req.body.score1, score2: req.body.score2 })
));

// Referee can view their own assigned (awaiting acceptance) dispatch assignments
router.get("/:tournamentId/referees/:refereeId/draft-assignments", async (req, res) => {
  try {
    const result = await refereeDraftService.getDraftAssignments(req.params.tournamentId, req.actor);
    res.json(result);
  } catch (error) {
    const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404, FORBIDDEN: 403 };
    res.status(statuses[error.code] || 500).json({ error: error.message });
  }
});

module.exports = router;
