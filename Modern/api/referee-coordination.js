const express = require("express");
const refereeCoordinationService = require("../services/referee-coordination.service");

const router = express.Router();

// Competition Referee Roster management
// Only Master can manage the roster.

// GET /:competitionId/referees/roster - List all referees in the roster
router.get("/:competitionId/referees/roster", async (req, res) => {
  try {
    if (req.actor?.actorType !== "master") {
      const error = new Error("Only a master may query the referee roster");
      error.code = "FORBIDDEN";
      throw error;
    }
    res.json(await refereeCoordinationService.listRoster(req.params.competitionId));
  } catch (error) {
    const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404, FORBIDDEN: 403 };
    res.status(statuses[error.code] || 500).json({ error: error.message });
  }
});

// POST /:competitionId/referees/roster - Create/update the referee roster
router.post("/:competitionId/referees/roster", async (req, res) => {
  try {
    if (req.actor?.actorType !== "master") {
      const error = new Error("Only a master may create the referee roster");
      error.code = "FORBIDDEN";
      throw error;
    }
    const { refereeIds } = req.body;
    if (!Array.isArray(refereeIds) || refereeIds.length === 0) {
      const error = new Error("refereeIds must be a non-empty array");
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    res.json(await refereeCoordinationService.createRoster(req.params.competitionId, refereeIds));
  } catch (error) {
    const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404, FORBIDDEN: 403 };
    res.status(statuses[error.code] || 500).json({ error: error.message });
  }
});

// GET /:competitionId/referees/eligible - List eligible referees
router.get("/:competitionId/referees/eligible", async (req, res) => {
  try {
    if (req.actor?.actorType !== "master") {
      const error = new Error("Only a master may query eligible referees");
      error.code = "FORBIDDEN";
      throw error;
    }
    res.json(await refereeCoordinationService.listEligibleReferees(req.params.competitionId));
  } catch (error) {
    const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404, FORBIDDEN: 403 };
    res.status(statuses[error.code] || 500).json({ error: error.message });
  }
});

// PATCH /:competitionId/referees/:refereeId - Update referee status
router.patch("/:competitionId/referees/:refereeId", async (req, res) => {
  try {
    if (req.actor?.actorType !== "master") {
      const error = new Error("Only a master may update referee status");
      error.code = "FORBIDDEN";
      throw error;
    }
    const updates = {};
    if (req.body.active !== undefined) updates.active = req.body.active;
    if (req.body.eligible !== undefined) updates.eligible = req.body.eligible;
    
    if (Object.keys(updates).length === 0) {
      const error = new Error("At least one of active or eligible must be specified");
      error.code = "VALIDATION_ERROR";
      throw error;
    }
    
    res.json(await refereeCoordinationService.updateRefereeStatus(
      req.params.competitionId,
      req.params.refereeId,
      updates
    ));
  } catch (error) {
    const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404, FORBIDDEN: 403 };
    res.status(statuses[error.code] || 500).json({ error: error.message });
  }
});

// GET /:competitionId/matches/:matchId/available-candidates
// Backend-authoritative candidates query for Master dispatch UI
router.get("/:competitionId/matches/:matchId/available-candidates", async (req, res) => {
  try {
    if (req.actor?.actorType !== "master") {
      const error = new Error("Only a master may query dispatch candidates");
      error.code = "FORBIDDEN";
      throw error;
    }
    res.json(await refereeCoordinationService.listAvailableCandidates(
      req.params.competitionId,
      req.params.matchId,
      req.actor
    ));
  } catch (error) {
    const statuses = { VALIDATION_ERROR: 400, NOT_FOUND: 404, FORBIDDEN: 403 };
    res.status(statuses[error.code] || 500).json({ error: error.message });
  }
});

module.exports = router;