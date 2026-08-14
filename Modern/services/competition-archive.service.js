const repository = require("../repositories/competition-archive.repository");
const { assertCompetitionLifecycleEligible } = require("./competition-lifecycle-eligibility");

function validationError(message) {
  const error = new Error(message);
  error.code = "VALIDATION_ERROR";
  return error;
}

async function getCompetitionArchive(value) {
  const competitionId = Number(value);
  if (!Number.isInteger(competitionId) || competitionId <= 0) {
    throw validationError("Valid competition id is required");
  }

  const projection = await repository.findByCompetitionId(competitionId);
  if (!projection.competition) {
    const error = new Error("Competition not found");
    error.code = "NOT_FOUND";
    throw error;
  }
  assertCompetitionLifecycleEligible(
    projection.competition.competition_status,
    "competitionArchive",
    { notFound: true }
  );
  return {
    competitionId,
    competitionStatus: projection.competition?.competition_status ?? null,
    matches: projection.matches.map(row => ({
      matchId: row.match_id,
      roundNumber: row.round_number,
      status: row.match_status,
      score: { sideOne: row.score1, sideTwo: row.score2 },
      confirmed: true
    })),
    standings: projection.standings.map(row => ({
      participantId: row.participant_id,
      wins: row.wins,
      losses: row.losses,
      scoreDifference: row.score_difference
    }))
  };
}

module.exports = { getCompetitionArchive };
