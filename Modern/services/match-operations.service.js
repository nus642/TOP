const db = require("../database/db");
const repository = require("../repositories/match-operation.repository");
const officialRecordRepository = require("../repositories/match-official-record.repository");
const readinessRepository = require("../repositories/participant-readiness.repository");
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

async function mutate(tournamentValue, matchValue, operation, persist) {
  const tournamentId = positiveId(tournamentValue, "tournament id");
  const matchId = positiveId(matchValue, "match id");
  return db.withTransaction(async (connection) => {
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
  return mutate(tournamentId, matchId, (match) => match.assign(data.refereeId),
    (connection, tid, mid, match) => repository.assign(tid, mid, match.refereeId, connection));
}

function acceptRefereeResponsibility(tournamentId, matchId, data = {}) {
  return mutate(tournamentId, matchId, (match) => match.acceptResponsibility(data.refereeId),
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
      return { match: await repository.start(tournamentId, matchId, connection), participantReadiness: readiness };
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
  return mutate(tournamentId, matchId,
    (match) => match.recordScore(data.refereeId, data.score1, data.score2),
    (connection, tid, mid, match) => repository.recordScore(tid, mid, match.score1, match.score2, connection));
}

function submitResult(tournamentId, matchId, actor, data = {}) {
  return mutate(tournamentId, matchId,
    (match) => match.submitResult(actor, data.score1, data.score2),
    (connection, tid, mid, match) => repository.recordScore(tid, mid, match.score1, match.score2, connection));
}

function confirmResult(tournamentId, matchId, actor = {}) {
  const data = actor;
  const tournamentIdValue = positiveId(tournamentId, "tournament id");
  const matchIdValue = positiveId(matchId, "match id");

  return db.withTransaction(async (connection) => {
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
  confirmResult,
  getOfficialRecord,
  getRefereeWorkflow
};
