const express = require("express");
const scheduleImportService = require("../services/schedule-import.service");
const scheduleEditService = require("../services/schedule-edit.service");

function sendArrangementError(res, err) {
  if (err.code === "FORBIDDEN") return res.status(403).json({ error: err.message });
  if (err.code === "VALIDATION_ERROR") return res.status(400).json({ error: err.message });
  if (err.code === "NOT_FOUND") return res.status(404).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Arrangement change failed" });
}

function createImportRouter() {
  const router = express.Router();

  router.post("/:competitionId/schedule/import", async (req, res) => {
    try {
      const competitionId = Number(req.params.competitionId);
      if (!Number.isInteger(competitionId) || competitionId <= 0) {
        return res.status(400).json({ error: "Valid competition id is required" });
      }
      const result = await scheduleImportService.importSchedule(competitionId, req.body, req.actor);
      res.status(201).json(result);
    } catch (err) {
      if (err.code === "FORBIDDEN") {
        return res.status(403).json({ error: err.message });
      }
      if (err.code === "VALIDATION_ERROR") {
        return res.status(400).json({ error: err.message, details: err.details || null });
      }
      if (err.code === "LIFECYCLE_BLOCKED") {
        return res.status(409).json({ error: err.message });
      }
      if (err.code === "NOT_FOUND") {
        return res.status(404).json({ error: err.message });
      }
      console.error(err);
      res.status(500).json({ error: "Import failed" });
    }
  });

  router.post("/:competitionId/schedule/matches", async (req, res) => {
    try {
      const result = await scheduleEditService.addMatch(req.params.competitionId, req.body, req.actor);
      res.status(201).json(result);
    } catch (err) {
      sendArrangementError(res, err);
    }
  });

  router.put("/:competitionId/schedule/matches/:matchId", async (req, res) => {
    try {
      const result = await scheduleEditService.editMatch(req.params.competitionId, req.params.matchId, req.body, req.actor);
      res.json(result);
    } catch (err) {
      sendArrangementError(res, err);
    }
  });

  router.delete("/:competitionId/schedule/matches/:matchId", async (req, res) => {
    try {
      const result = await scheduleEditService.deleteMatch(req.params.competitionId, req.params.matchId, req.actor);
      res.json(result);
    } catch (err) {
      sendArrangementError(res, err);
    }
  });

  return router;
}

module.exports = createImportRouter();
