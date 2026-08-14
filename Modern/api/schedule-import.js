const express = require("express");
const scheduleImportService = require("../services/schedule-import.service");

function createImportRouter() {
  const router = express.Router();

  router.post("/:competitionId/schedule/import", async (req, res) => {
    try {
      const competitionId = Number(req.params.competitionId);
      if (!Number.isInteger(competitionId) || competitionId <= 0) {
        return res.status(400).json({ error: "Valid competition id is required" });
      }
      const result = await scheduleImportService.importSchedule(competitionId, req.body);
      res.status(201).json(result);
    } catch (err) {
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

  return router;
}

module.exports = createImportRouter();
