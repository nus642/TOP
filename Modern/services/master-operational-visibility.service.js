const repository = require("../repositories/master-operational-visibility.repository");

const MATCH_OPERATION_STATUSES = new Set([
  "idle", "upcoming", "assigned", "playing", "scored",
  "awaiting_confirmation", "confirmed", "finished"
]);

function validationError(message) {
  const error = new Error(message);
  error.code = "VALIDATION_ERROR";
  return error;
}

function requiredId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw validationError("Valid competition id is required");
  }
  return id;
}

function optionalText(value, name) {
  if (value === undefined) return undefined;
  const text = String(value).trim();
  if (!text) throw validationError(`${name} cannot be empty`);
  return text;
}

async function getMatchOperationalOverview(competitionValue, query = {}) {
  const competitionId = requiredId(competitionValue);
  const filters = {
    courtId: optionalText(query.courtId, "courtId"),
    refereeId: optionalText(query.refereeId, "refereeId"),
    status: optionalText(query.status, "status")
  };
  if (filters.status !== undefined && !MATCH_OPERATION_STATUSES.has(filters.status)) {
    throw validationError("Invalid match operation status");
  }

  const matches = await repository.findMatchOverview(competitionId, filters);
  return { competitionId, matches };
}

module.exports = { getMatchOperationalOverview };
