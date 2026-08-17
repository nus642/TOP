const express = require("express");
const refereeCoordinationService = require("../services/referee-coordination.service");

const router = express.Router();

// Match-day identity entry: a referee selects their own name from the roster
// before any session exists, then establishes one via the development-only
// foundation-establish boundary. Exposes referee names only — accepted risk
// for the first event's trusted-network scenario (see docs/README.md).
router.get("/:competitionId/referee-roster", async (req, res) => {
  try {
    const roster = await refereeCoordinationService.listRoster(req.params.competitionId);
    const referees = roster.filter((entry) => entry.active).map((entry) => entry.refereeId);
    res.json({ competitionId: req.params.competitionId, referees });
  } catch (error) {
    const status = error.code === "VALIDATION_ERROR" ? 400 : 500;
    res.status(status).json({ error: error.message });
  }
});

module.exports = router;
