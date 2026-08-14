const db = require("../database/db");

function mapCondition(row) {
  return row && { tournamentId: row.tournament_id, courtId: row.court_id,
    condition: row.condition_name, sourceType: row.source_type,
    sourceReference: row.source_reference, actorId: row.actor_id,
    effectiveAt: row.effective_at, version: Number(row.version),
    lastChronologyId: row.last_chronology_id };
}

function mapDisruption(row) {
  return row && { id: row.id, tournamentId: row.tournament_id, courtId: row.court_id,
    affectedMatchId: row.affected_match_id, openingCondition: row.opening_condition,
    disposition: row.disposition, openedBy: row.opened_by, openedAt: row.opened_at,
    deferredBy: row.deferred_by, deferredAt: row.deferred_at,
    recoveredBy: row.recovered_by, recoveredAt: row.recovered_at,
    resolvedAt: row.resolved_at, version: Number(row.version) };
}

async function findScheduledCourt(tournamentId, matchId, connection = db) {
  const [rows] = await connection.query(
    `SELECT court_id FROM match_schedules WHERE tournament_id = ? AND match_id = ?`,
    [tournamentId, matchId]);
  return rows[0]?.court_id || null;
}

async function isKnownCourt(tournamentId, courtId, connection = db) {
  const [rows] = await connection.query(
    `SELECT 1 FROM match_schedules WHERE tournament_id = ? AND court_id = ? LIMIT 1`,
    [tournamentId, courtId]);
  return rows.length > 0;
}

async function lockCondition(tournamentId, courtId, connection = db) {
  await connection.query(
    `INSERT IGNORE INTO court_operating_conditions
       (tournament_id, court_id, condition_name, source_type, source_reference, version)
     VALUES (?, ?, 'available', 'initial_baseline', 'schedule_baseline', 0)`,
    [tournamentId, courtId]);
  const [rows] = await connection.query(
    `SELECT * FROM court_operating_conditions WHERE tournament_id = ? AND court_id = ? FOR UPDATE`,
    [tournamentId, courtId]);
  return mapCondition(rows[0]);
}

async function updateCondition(data, connection = db) {
  await connection.query(
    `UPDATE court_operating_conditions SET condition_name = ?, source_type = ?,
       source_reference = ?, actor_id = ?, effective_at = CURRENT_TIMESTAMP(6), version = version + 1
     WHERE tournament_id = ? AND court_id = ?`,
    [data.condition, data.sourceType, data.sourceReference, data.actorId || null,
      data.tournamentId, data.courtId]);
  const [rows] = await connection.query(
    `SELECT * FROM court_operating_conditions WHERE tournament_id = ? AND court_id = ?`,
    [data.tournamentId, data.courtId]);
  return mapCondition(rows[0]);
}

async function findPlayingMatch(tournamentId, courtId, connection = db) {
  const [rows] = await connection.query(
    `SELECT m.id FROM matches m JOIN match_schedules ms ON ms.match_id = m.id
     AND ms.tournament_id = m.tournament_id
     WHERE m.tournament_id = ? AND ms.court_id = ? AND m.status = 'playing' LIMIT 1`,
    [tournamentId, courtId]);
  return rows[0]?.id || null;
}

async function lockOpenDisruption(tournamentId, courtId, connection = db) {
  const [rows] = await connection.query(
    `SELECT * FROM court_disruptions WHERE tournament_id = ? AND court_id = ?
     AND disposition <> 'resolved' ORDER BY id DESC LIMIT 1 FOR UPDATE`, [tournamentId, courtId]);
  return mapDisruption(rows[0]);
}

async function createDisruption(data, connection = db) {
  const [result] = await connection.query(
    `INSERT INTO court_disruptions
       (tournament_id, court_id, affected_match_id, opening_condition, opened_by)
     VALUES (?, ?, ?, ?, ?)`,
    [data.tournamentId, data.courtId, data.affectedMatchId || null, data.condition, data.actorId]);
  const [rows] = await connection.query(`SELECT * FROM court_disruptions WHERE id = ?`, [result.insertId]);
  return mapDisruption(rows[0]);
}

async function updateDisruption(id, disposition, actorId, connection = db) {
  if (disposition !== "deferred") throw new TypeError("updateDisruption supports deferment only");
  const fields = "disposition = 'deferred', deferred_by = ?, deferred_at = CURRENT_TIMESTAMP(6), version = version + 1";
  await connection.query(`UPDATE court_disruptions SET ${fields} WHERE id = ?`, [actorId, id]);
  const [rows] = await connection.query(`SELECT * FROM court_disruptions WHERE id = ?`, [id]);
  return mapDisruption(rows[0]);
}

async function resolveDisruption(id, connection = db) {
  await connection.query(
    `UPDATE court_disruptions SET disposition = 'resolved', resolved_at = CURRENT_TIMESTAMP(6),
       version = version + 1 WHERE id = ?`, [id]);
  const [rows] = await connection.query(`SELECT * FROM court_disruptions WHERE id = ?`, [id]);
  return mapDisruption(rows[0]);
}

async function recoverDisruption(id, actorId, connection = db) {
  await connection.query(
    `UPDATE court_disruptions SET recovered_by = ?, recovered_at = CURRENT_TIMESTAMP(6), version = version + 1 WHERE id = ?`,
    [actorId, id]);
  const [rows] = await connection.query(`SELECT * FROM court_disruptions WHERE id = ?`, [id]);
  return mapDisruption(rows[0]);
}

async function appendEvent(data, connection = db) {
  const [result] = await connection.query(
    `INSERT INTO tournament_coordination_chronology
       (tournament_id, court_id, match_id, event_type, source_type, actor_id,
        correlation_id, court_version, disruption_version, details)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.tournamentId, data.courtId, data.matchId || null, data.eventType, data.sourceType,
      data.actorId || null, data.correlationId, data.courtVersion ?? null,
      data.disruptionVersion ?? null, JSON.stringify(data.details || {})]);
  await connection.query(
    `UPDATE court_operating_conditions SET last_chronology_id = ? WHERE tournament_id = ? AND court_id = ?`,
    [result.insertId, data.tournamentId, data.courtId]);
  return result.insertId;
}

module.exports = { findScheduledCourt, isKnownCourt, lockCondition, updateCondition,
  findPlayingMatch, lockOpenDisruption, createDisruption, updateDisruption,
  recoverDisruption, resolveDisruption, appendEvent };
