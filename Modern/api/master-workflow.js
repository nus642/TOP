const express = require("express");
const service = require("../services/master-workflow.service");

const router = express.Router();

router.post("/:competitionId/matches/:matchId/assign", async (req, res) => {
  try {
    const result = await service.assignReferee(
      req.params.competitionId,
      req.params.matchId,
      req.body
    );
    res.json(result);
  } catch (error) {
    const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404 };
    res.status(statuses[error.code] || 500).json({ error: error.message });
  }
});

module.exports = router;
