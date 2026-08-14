const {
  CompetitionLifecycleState,
  COMPETITION_LIFECYCLE_STATES: STATES
} = require("../engine/competition");

const ELIGIBLE_STATES = Object.freeze({
  refereeAssignment: Object.freeze([STATES.READY, STATES.RUNNING]),
  responsibilityAcceptance: Object.freeze([STATES.READY, STATES.RUNNING]),
  matchStart: Object.freeze([STATES.RUNNING]),
  scoreSubmission: Object.freeze([STATES.RUNNING]),
  resultConfirmation: Object.freeze([STATES.RUNNING]),
  publicScoreboard: Object.freeze([STATES.READY, STATES.RUNNING, STATES.COMPLETED, STATES.ARCHIVED]),
  competitionArchive: Object.freeze([STATES.COMPLETED, STATES.ARCHIVED])
});

function assertCompetitionLifecycleEligible(status, capability, options = {}) {
  const lifecycle = CompetitionLifecycleState.from(status).value;
  const eligible = ELIGIBLE_STATES[capability];
  if (!eligible) throw new TypeError(`Unknown lifecycle capability: ${capability}`);
  if (eligible.includes(lifecycle)) return lifecycle;

  const error = new Error(`Competition is not available for ${capability} while ${lifecycle}`);
  error.code = options.notFound ? "NOT_FOUND" : "VALIDATION_ERROR";
  throw error;
}

module.exports = { ELIGIBLE_STATES, assertCompetitionLifecycleEligible };
