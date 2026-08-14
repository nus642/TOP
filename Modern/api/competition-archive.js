const express = require("express");
const service = require("../services/competition-archive.service");

const router = express.Router();

router.get("/:competitionId/archive", async (req, res) => {
  try {
    res.json(await service.getCompetitionArchive(req.params.competitionId));
  } catch (error) {
    const status = error.code === "VALIDATION_ERROR" ? 400 : error.code === "NOT_FOUND" ? 404 : 500;
    res.status(status).json({ error: error.message });
  }
});

module.exports = router;
