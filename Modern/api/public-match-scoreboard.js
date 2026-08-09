const express = require("express");
const service = require("../services/public-match-scoreboard.service");

const router = express.Router();

router.get("/:competitionId/matches", async (req, res) => {
  try {
    res.json(await service.getPublicMatches(req.params.competitionId));
  } catch (error) {
    const status = error.code === "VALIDATION_ERROR" ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

module.exports = router;
