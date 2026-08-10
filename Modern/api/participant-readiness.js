const express = require("express");
const service = require("../services/participant-readiness.service");

const router = express.Router();

function handler(action, status = 200) {
  return async (req, res) => {
    try {
      const result = await service[action](
        req.params.competitionId,
        req.params.participantId ? (req.actor?.actorId ?? req.params.participantId) : undefined,
        req.body
      );
      res.status(status).json(result);
    } catch (error) {
      const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404 };
      res.status(statuses[error.code] || 500).json({ error: error.message });
    }
  };
}

router.get("/:competitionId/participants", handler("listReadiness"));
router.get("/:competitionId/participants/:participantId", handler("getReadiness"));
router.post("/:competitionId/participants/:participantId/check-in", handler("checkIn"));

module.exports = router;
