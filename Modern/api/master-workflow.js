const express = require("express");
const service = require("../services/master-workflow.service");
const liveMatchStatusService = require("../services/live-match-status.service");
const dispatchService = require("../services/dispatch.service");

const router = express.Router();

router.get("/:competitionId/live-status", async (req, res) => {
  try {
    if (req.actor?.actorType !== "master") {
      const error = new Error("Only a master may read live Tournament coordination");
      error.code = "VALIDATION_ERROR";
      throw error;
    }
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

// Atomic dispatch: Master submits matchId + courtId + refereeId + expectedVersion + correlationId
router.post("/:competitionId/matches/:matchId/dispatch", async (req, res) => {
  try {
    const { courtId, refereeId, correlationId } = req.body;
    const result = await service.dispatchReferee(
      req.params.competitionId,
      req.params.matchId,
      { courtId, refereeId, correlationId },
      req.actor
    );
    res.json(result);
  } catch (error) {
    const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404 };
    res.status(statuses[error.code] || 500).json({ error: error.message });
  }
});

// Withdraw dispatch: Master can withdraw a waiting_acceptance dispatch
router.post("/:competitionId/matches/:matchId/withdraw", async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await service.withdrawDispatch(
      req.params.competitionId,
      req.params.matchId,
      req.actor,
      { reason }
    );
    res.json(result);
  } catch (error) {
    const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404 };
    res.status(statuses[error.code] || 500).json({ error: error.message });
  }
});

// Reassign dispatch: Master can reassign to a different referee while waiting
router.post("/:competitionId/matches/:matchId/reassign", async (req, res) => {
  try {
    const { newRefereeId, reason } = req.body;
    const result = await service.reassignDispatch(
      req.params.competitionId,
      req.params.matchId,
      newRefereeId,
      req.actor,
      { reason }
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

function courtHandler(action) {
  return async (req, res) => {
    try {
      res.json(await service[action](req.params.competitionId, req.params.courtId, req.actor, req.body));
    } catch (error) {
      const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404 };
      res.status(statuses[error.code] || 500).json({ error: error.message });
    }
  };
}

router.post("/:competitionId/courts/:courtId/condition", courtHandler("reportCourtCondition"));
router.post("/:competitionId/courts/:courtId/defer", courtHandler("deferCourtDisruption"));

module.exports = router;
