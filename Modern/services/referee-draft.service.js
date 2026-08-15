const competitionRefereeRepository = require("../repositories/competition-referee.repository");
const matchOperationRepository = require("../repositories/match-operation.repository");
const courtRepository = require("../repositories/court-coordination.repository");

function validationError(message) {
  const error = new Error(message);
  error.code = "VALIDATION_ERROR";
  return error;
}

function positiveId(value, name) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw validationError(`Valid ${name} is required`);
  }
  return id;
}

function requireReferee(actor) {
  if (actor?.actorType !== "referee") {
    throw validationError("Only a referee may query draft assignments");
  }
  return actor.actorId;
}

// Referee Draft Service
// Provides referee view of assigned (awaiting acceptance) dispatch assignments.
// This is a projection service that reads from the repository layer.

async function getDraftAssignments(competitionValue, actor) {
  const competitionId = positiveId(competitionValue, "competition id");
  const refereeId = requireReferee(actor);
  
  // Get all assigned dispatch reservations awaiting acceptance for this referee
  const reservations = await competitionRefereeRepository.findReservationByReferee(refereeId, "waiting");
  
  // Filter by competition
  const competitionReservations = reservations.filter(r => r.tournamentId === competitionId);
  
  // Enrich with match and court information
  const assignments = await Promise.all(
    competitionReservations.map(async (reservation) => {
      const match = await matchOperationRepository.findById(competitionId, reservation.matchId);
      const courtCondition = await courtRepository.lockCondition(competitionId, reservation.courtId);
      
      return {
        matchId: reservation.matchId,
        courtId: reservation.courtId,
        dispatchId: reservation.dispatchId,
        expectedVersion: reservation.expectedVersion,
        dispatchedAt: reservation.createdAt,
        match: match ? {
          status: match.status,
          refereeId: match.refereeId,
          roundNumber: match.roundNum,
          team1: match.team1Name,
          team2: match.team2Name
        } : null,
        court: {
          condition: courtCondition?.condition || "available",
          version: courtCondition?.version || 0
        }
      };
    })
  );
  
  return {
    competitionId,
    refereeId,
    assignments
  };
}

module.exports = {
  getDraftAssignments
};