const express = require("express");
const service = require("../services/master-operational-visibility.service");

const router = express.Router();

router.get("/:competitionId/matches", async (req, res) => {
  try {
    res.json(await service.getMatchOperationalOverview(
      req.params.competitionId,
      req.query
    ));
  } catch (error) {
    const status = error.code === "VALIDATION_ERROR" ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

module.exports = router;
