const db = require("../database/db");
const repository = require("../repositories/match-operation.repository");
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

function recordScore(tournamentId, matchId, data = {}) {
  return mutate(tournamentId, matchId,
    (match) => match.recordScore(data.refereeId, data.score1, data.score2),
    (connection, tid, mid, match) => repository.recordScore(tid, mid, match.score1, match.score2, connection));
}

function confirmResult(tournamentId, matchId, data = {}) {
  return mutate(tournamentId, matchId, (match) => match.confirm(data.refereeId),
    (connection, tid, mid, match) => {
      const confirmedAt = new Date().toISOString();
      const evidence = data.evidenceReference
        ? new ConfirmationEvidence({
          reference: data.evidenceReference,
          captureMetadata: data.evidenceMetadata || {}
        })
        : null;
      const matchResult = new MatchResult({
        matchId: mid,
        score: { score1: match.score1, score2: match.score2 },
        details: { tournamentId: tid }
      });
      const officialConfirmation = new Confirmation({
        responsibility: "assigned-referee",
        confirmedBy: match.refereeId,
        confirmedAt,
        evidenceReferences: evidence ? [evidence] : []
      });
      const outcome = new ConfirmedMatchOutcome({
        matchResult,
        officialConfirmation,
        evidenceReferences: evidence ? [evidence] : [],
        confirmedAt
      });
      const officialRecord = new MatchOfficialRecord({
        outcome,
        provenance: {
          workflow: "match-operations",
          operation: "official-confirmation",
          tournamentId: tid,
          matchId: mid
        }
      });
      return repository.confirm(tid, mid, match.refereeId, officialRecord, connection);
    });
}

module.exports = { assignMatch, acceptRefereeResponsibility, recordScore, confirmResult };
