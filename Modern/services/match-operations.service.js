const db = require("../database/db");
const repository = require("../repositories/match-operation.repository");
const officialRecordRepository = require("../repositories/match-official-record.repository");
const readinessRepository = require("../repositories/participant-readiness.repository");
const tournamentRepository = require("../repositories/tournament.repository");
const courtRepository = require("../repositories/court-coordination.repository");
const { randomUUID } = require("node:crypto");
const { assertCompetitionLifecycleEligible } = require("./competition-lifecycle-eligibility");
const {
  MatchOperation,
  MatchResult,
  Confirmation,
  ConfirmationEvidence,
  ConfirmedMatchOutcome,
  MatchOfficialRecord,
  OperationsError
} = require("../engine/operations/domain");

function positiveId(value, name) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error(`Valid ${name} is required`);
    error.code = "VALIDATION_ERROR";
    throw error;
  }
  return id;
}

function requiredRefereeId(value) {
  if (value === undefined || value === null || String(value).trim() === "") {
    const error = new Error("Valid referee id is required");
    error.code = "VALIDATION_ERROR";
    throw error;
  }
  return String(value).trim();
}

function translate(error) {
  if (!(error instanceof OperationsError)) throw error;
  const translated = new Error(error.message);
  translated.code = "VALIDATION_ERROR";
  throw translated;
}

async function authoritativeTournament(tournamentId, connection) {
  const tournament = await tournamentRepository.getTournamentByIdForUpdate(tournamentId, connection);
  if (!tournament) {
    const error = new Error("Competition not found");
    error.code = "NOT_FOUND";
    throw error;
  }
  return tournament;
}

async function mutate(tournamentValue, matchValue, capability, operation, persist) {
  const tournamentId = positiveId(tournamentValue, "tournament id");
  const matchId = positiveId(matchValue, "match id");
  return db.withTransaction(async (connection) => {
    const tournament = await authoritativeTournament(tournamentId, connection);
    assertCompetitionLifecycleEligible(tournament.status, capability);
    const record = await repository.findById(tournamentId, matchId, connection, true);
    if (!record) {
      const error = new Error("Match not found");
      error.code = "NOT_FOUND";
      throw error;
    }
    try {
      const match = new MatchOperation(record);
      operation(match);
      return { match: await persist(connection, tournamentId, matchId, match) };
    } catch (error) {
      return translate(error);
    }
  });
}

function assignMatch(tournamentId, matchId, data = {}) {
  return mutate(tournamentId, matchId, "refereeAssignment", (match) => match.assign(data.refereeId),
    (connection, tid, mid, match) => repository.assign(tid, mid, match.refereeId, connection));
}

function acceptRefereeResponsibility(tournamentId, matchId, data = {}) {
  return mutate(tournamentId, matchId, "responsibilityAcceptance", (match) => match.acceptResponsibility(data.refereeId),
    (connection, tid, mid) => repository.acceptResponsibility(tid, mid, connection));
}

function readinessForMatch(record, rows) {
  const byParticipant = new Map(rows.map((row) => [Number(row.participant_id), row]));
  return record.participantIds.map((participantId) => ({
    participantId,
    state: byParticipant.get(Number(participantId))?.checked_in ? "ready" : "not_ready"
  }));
}

function startMatch(tournamentValue, matchValue, data = {}) {
  const tournamentId = positiveId(tournamentValue, "tournament id");
  const matchId = positiveId(matchValue, "match id");
  return db.withTransaction(async (connection) => {
    const tournament = await authoritativeTournament(tournamentId, connection);
    assertCompetitionLifecycleEligible(tournament.status, "matchStart");
    const courtId = await courtRepository.findScheduledCourt(tournamentId, matchId, connection);
    let court = courtId ? await courtRepository.lockCondition(tournamentId, courtId, connection) : null;
    const record = await repository.findById(tournamentId, matchId, connection, true);
    if (!record) {
      const error = new Error("Match not found");
      error.code = "NOT_FOUND";
      throw error;
    }
    const readiness = readinessForMatch(
      record,
      await readinessRepository.listForCompetition(tournamentId, connection)
    );
    try {
      const match = new MatchOperation(record);
      match.start(data.refereeId, readiness);
      if (court && court.condition !== "available") throw new OperationsError("COURT_NOT_AVAILABLE", "Assigned Court is not available");
      if (court && await courtRepository.findPlayingMatch(tournamentId, courtId, connection)) {
        throw new OperationsError("COURT_ALREADY_OCCUPIED", "Another Match is already playing on the assigned Court");
      }
      const updatedMatch = await repository.start(tournamentId, matchId, connection);
      if (court) court = await courtRepository.updateCondition({ tournamentId, courtId, condition: "occupied",
        sourceType: "match_execution", sourceReference: `match:${matchId}:start`, actorId: data.refereeId }, connection);
      if (court) await courtRepository.appendEvent({ tournamentId, courtId, matchId, eventType: "match_started_court_occupied",
        sourceType: "match_execution", actorId: data.refereeId, correlationId: data.correlationId || randomUUID(),
        courtVersion: court.version }, connection);
      return { match: updatedMatch, courtCondition: court, participantReadiness: readiness };
    } catch (error) {
      return translate(error);
    }
  });
}

async function getMatchOperationContext(tournamentValue, matchValue) {
  const tournamentId = positiveId(tournamentValue, "tournament id");
  const matchId = positiveId(matchValue, "match id");
  const match = await repository.findById(tournamentId, matchId);
  if (!match) {
    const error = new Error("Match not found");
    error.code = "NOT_FOUND";
    throw error;
  }
  const participantReadiness = readinessForMatch(
    match,
    await readinessRepository.listForCompetition(tournamentId)
  );
  return {
    match,
    participantReadiness,
    allParticipantsReady: participantReadiness.length > 0 &&
      participantReadiness.every((participant) => participant.state === "ready")
  };
}

function recordScore(tournamentId, matchId, data = {}) {
  return mutate(tournamentId, matchId, "scoreSubmission",
    (match) => match.recordScore(data.refereeId, data.score1, data.score2),
    (connection, tid, mid, match) => repository.recordScore(tid, mid, match.score1, match.score2, connection));
}

function submitResult(tournamentId, matchId, actor, data = {}) {
  const tid = positiveId(tournamentId, "tournament id"); const mid = positiveId(matchId, "match id");
  return db.withTransaction(async (connection) => {
    const tournament = await authoritativeTournament(tid, connection);
    assertCompetitionLifecycleEligible(tournament.status, "scoreSubmission");
    const courtId = await courtRepository.findScheduledCourt(tid, mid, connection);
    let court = courtId ? await courtRepository.lockCondition(tid, courtId, connection) : null;
    const record = await repository.findById(tid, mid, connection, true);
    let disruption = court ? await courtRepository.lockOpenDisruption(tid, courtId, connection) : null;
    if (!record) { const e = new Error("Match not found"); e.code = "NOT_FOUND"; throw e; }
    try {
      const match = new MatchOperation(record); match.submitResult(actor, data.score1, data.score2);
      const updatedMatch = await repository.recordScore(tid, mid, match.score1, match.score2, connection);
      if (court) court = await courtRepository.updateCondition({ tournamentId: tid, courtId, condition: "available",
        sourceType: "match_execution", sourceReference: `match:${mid}:end`, actorId: actor.actorId }, connection);
      if (disruption && (!disruption.affectedMatchId || Number(disruption.affectedMatchId) === mid)) {
        disruption = await courtRepository.resolveDisruption(disruption.id, connection);
      }
      if (court) await courtRepository.appendEvent({ tournamentId: tid, courtId, matchId: mid,
        eventType: "match_ended_court_released", sourceType: "match_execution", actorId: actor.actorId,
        correlationId: data.correlationId || randomUUID(), courtVersion: court.version,
        disruptionVersion: disruption?.version }, connection);
      return { match: updatedMatch, courtCondition: court, disruption };
    } catch (error) { return translate(error); }
  });
}

function interruptMatch(tournamentId, matchId, actor, data = {}) {
  return executionChange(tournamentId, matchId, actor, data, "interrupt");
}

function resumeMatch(tournamentId, matchId, actor, data = {}) {
  return executionChange(tournamentId, matchId, actor, data, "resume");
}

function executionChange(tournamentValue, matchValue, actor, data, action) {
  const tournamentId = positiveId(tournamentValue, "tournament id"); const matchId = positiveId(matchValue, "match id");
  return db.withTransaction(async (connection) => {
    const tournament = await authoritativeTournament(tournamentId, connection);
    assertCompetitionLifecycleEligible(tournament.status, "matchStart");
    const courtId = await courtRepository.findScheduledCourt(tournamentId, matchId, connection);
    if (!courtId) { const e = new Error("Match requires a known assigned Court"); e.code = "VALIDATION_ERROR"; throw e; }
    let court = await courtRepository.lockCondition(tournamentId, courtId, connection);
    const record = await repository.findById(tournamentId, matchId, connection, true);
    if (!record) { const e = new Error("Match not found"); e.code = "NOT_FOUND"; throw e; }
    let disruption = await courtRepository.lockOpenDisruption(tournamentId, courtId, connection);
    try {
      const match = new MatchOperation(record); match[action](actor);
      if (action === "interrupt" && !["constrained", "uncertain"].includes(court.condition)) {
        throw new OperationsError("COURT_NOT_BLOCKED", "Match interruption requires a constrained or uncertain Court");
      }
      if (action === "resume" && court.condition !== "available") {
        throw new OperationsError("COURT_NOT_AVAILABLE", "Match resume requires an available Court");
      }
      const updatedMatch = await repository[action](tournamentId, matchId, connection);
      if (action === "resume") court = await courtRepository.updateCondition({ tournamentId, courtId,
        condition: "occupied", sourceType: "match_execution", sourceReference: `match:${matchId}:resume`, actorId: actor.actorId }, connection);
      if (action === "resume" && disruption &&
          (!disruption.affectedMatchId || Number(disruption.affectedMatchId) === matchId)) {
        disruption = await courtRepository.resolveDisruption(disruption.id, connection);
      }
      await courtRepository.appendEvent({ tournamentId, courtId, matchId,
        eventType: action === "resume" ? "match_resumed_court_occupied" : "match_interrupted",
        sourceType: "match_execution", actorId: actor.actorId, correlationId: data.correlationId || randomUUID(),
        courtVersion: court.version, disruptionVersion: disruption?.version }, connection);
      return { match: updatedMatch, courtCondition: court, disruption };
    } catch (error) { return translate(error); }
  });
}

function confirmResult(tournamentId, matchId, actor = {}) {
  const data = actor;
  const tournamentIdValue = positiveId(tournamentId, "tournament id");
  const matchIdValue = positiveId(matchId, "match id");

  return db.withTransaction(async (connection) => {
    const tournament = await authoritativeTournament(tournamentIdValue, connection);
    assertCompetitionLifecycleEligible(tournament.status, "resultConfirmation");
    const record = await repository.findById(tournamentIdValue, matchIdValue, connection, true);
    if (!record) {
      const error = new Error("Match not found");
      error.code = "NOT_FOUND";
      throw error;
    }

    try {
      const match = new MatchOperation(record);
      match.confirmResult(actor);

      const matchResult = new MatchResult({
        matchId: String(match.id),
        score: [match.score1, match.score2],
        details: {
          tournamentId: match.tournamentId,
          refereeId: match.refereeId
        }
      });

      const evidenceReferences = [];
      let evidenceReference = null;
      let evidenceMetadata = null;

      if (data.evidenceReference) {
        const evidence = new ConfirmationEvidence({
          reference: data.evidenceReference,
          captureMetadata: data.evidenceMetadata || {}
        });
        evidenceReferences.push(evidence);
        evidenceReference = evidence.reference;
        evidenceMetadata = evidence.captureMetadata;
      }

      const confirmation = new Confirmation({
        responsibility: "referee_result_confirmation",
        confirmedBy: actor.actorId,
        details: {
          matchId: match.id,
          tournamentId: match.tournamentId
        },
        evidenceReferences
      });

      const outcome = new ConfirmedMatchOutcome({
        matchResult,
        officialConfirmation: confirmation,
        evidenceReferences: evidenceReferences.map(e => ({
          reference: e.reference,
          captureMetadata: e.captureMetadata
        }))
      });

      // Keep this guard adjacent to the irreversible trusted-record write as well
      // as at the mutation boundary. The tournament row remains locked throughout.
      assertCompetitionLifecycleEligible(tournament.status, "resultConfirmation");
      const officialRecord = await officialRecordRepository.create({
        tournamentId: match.tournamentId,
        matchId: match.id,
        refereeId: match.refereeId,
        score1: match.score1,
        score2: match.score2,
        confirmedBy: actor.actorId,
        confirmedAt: confirmation.confirmedAt,
        confirmationResponsibility: confirmation.responsibility,
        evidenceReference: evidenceReference,
        evidenceMetadata: evidenceMetadata,
        provenance: {
          source: "match_operations_workflow",
          workflowVersion: "1.0",
          matchOperationState: "confirmed"
        }
      }, connection);

      const updatedMatch = await repository.confirm(
        tournamentIdValue,
        matchIdValue,
        actor.actorId,
        connection
      );

      return {
        match: updatedMatch,
        officialRecord: officialRecord,
        trustedCompetitionRecord: {
          matchResult: {
            matchId: matchResult.matchId,
            score: matchResult.score,
            recordedAt: matchResult.recordedAt
          },
          officialConfirmation: {
            responsibility: confirmation.responsibility,
            confirmedBy: confirmation.confirmedBy,
            confirmedAt: confirmation.confirmedAt
          },
          evidenceReferences: outcome.evidenceReferences,
          createdAt: outcome.createdAt
        }
      };
    } catch (error) {
      return translate(error);
    }
  });
}

async function getOfficialRecord(tournamentValue, matchValue) {
  const tournamentId = positiveId(tournamentValue, "tournament id");
  const matchId = positiveId(matchValue, "match id");

  const records = await officialRecordRepository.findByMatch(tournamentId, matchId);
  const match = await repository.findById(tournamentId, matchId);

  if (!match) {
    const error = new Error("Match not found");
    error.code = "NOT_FOUND";
    throw error;
  }

  return {
    match,
    officialRecords: records,
    hasTrustedRecord: records.length > 0
  };
}

async function getRefereeWorkflow(tournamentValue, refereeValue) {
  const tournamentId = positiveId(tournamentValue, "tournament id");
  const refereeId = requiredRefereeId(refereeValue);
  const matches = await repository.findByReferee(tournamentId, refereeId);

  return {
    tournamentId,
    refereeId,
    matches
  };
}

module.exports = {
  assignMatch,
  acceptRefereeResponsibility,
  startMatch,
  getMatchOperationContext,
  recordScore,
  submitResult,
  interruptMatch,
  resumeMatch,
  confirmResult,
  getOfficialRecord,
  getRefereeWorkflow
};
