const db = require("../database/db");

function timestamp(value) {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function map(row) {
  return {
    matchId: row.match_id,
    roundNumber: row.round_number,
    courtId: row.court_id,
    scheduledAt: timestamp(row.scheduled_at),
    status: row.match_status,
    refereeId: row.referee_id,
    refereeAccepted: row.responsibility_accepted_at !== null,
    score: {
      sideOne: row.score1,
      sideTwo: row.score2
    },
    confirmed: Boolean(row.has_official_record)
  };
}

async function findByCompetitionId(competitionId, connection = db) {
  const [rows] = await connection.query(
    `SELECT
       t.status AS competition_status,
       m.id AS match_id,
       m.round_num AS round_number,
       ms.court_id,
       ms.scheduled_at,
       m.status AS match_status,
       m.referee_id,
       m.assigned_at,
       m.responsibility_accepted_at,
       m.score1,
       m.score2,
       m.result_confirmed_at,
       coc.condition_name AS court_condition,
       coc.source_type AS court_source_type,
       coc.source_reference AS court_source_reference,
       coc.actor_id AS court_actor_id,
       coc.effective_at AS court_effective_at,
       COALESCE(coc.version, 0) AS court_version,
       cd.id AS disruption_id,
       cd.affected_match_id AS disruption_match_id,
       cd.disposition AS disruption_disposition,
       cd.version AS disruption_version,
       EXISTS (
         SELECT 1
         FROM match_official_records mor
         WHERE mor.tournament_id = m.tournament_id
           AND mor.match_id = m.id
       ) AS has_official_record
     FROM matches m
     JOIN tournaments t ON t.id = m.tournament_id
     LEFT JOIN match_schedules ms
       ON ms.tournament_id = m.tournament_id AND ms.match_id = m.id
     LEFT JOIN court_operating_conditions coc
       ON coc.tournament_id = ms.tournament_id AND coc.court_id = ms.court_id
     LEFT JOIN court_disruptions cd
       ON cd.tournament_id = ms.tournament_id AND cd.court_id = ms.court_id
       AND cd.disposition <> 'resolved'
     WHERE m.tournament_id = ?
     ORDER BY ms.scheduled_at IS NULL, ms.scheduled_at, m.round_num, m.id`,
    [competitionId]
  );
  const courts = [];
  const seen = new Set();
  for (const row of rows) {
    if (!row.court_id || seen.has(row.court_id)) continue;
    seen.add(row.court_id);
    const condition = row.court_condition || "available";
    const playing = rows.find((item) => item.court_id === row.court_id && item.match_status === "playing");
    const interrupted = rows.find((item) => item.court_id === row.court_id && item.match_status === "interrupted");
    const attention = ["constrained", "uncertain"].includes(condition) && Boolean(playing);
    courts.push({
      courtId: row.court_id,
      condition,
      provenance: row.court_condition ? {
        sourceType: row.court_source_type, sourceReference: row.court_source_reference,
        actorId: row.court_actor_id, effectiveAt: timestamp(row.court_effective_at)
      } : { sourceType: "initial_baseline", sourceReference: "schedule_baseline", actorId: null, effectiveAt: null },
      version: Number(row.court_version || 0),
      matchId: playing?.match_id || interrupted?.match_id || row.disruption_match_id || row.match_id,
      matchStatus: playing?.match_status || interrupted?.match_status || row.match_status,
      operatingState: !playing && ["constrained", "uncertain"].includes(condition) ? "waiting" : row.match_status,
      disruption: row.disruption_id ? { id: row.disruption_id, affectedMatchId: row.disruption_match_id,
        disposition: row.disruption_disposition, version: Number(row.disruption_version) } : null,
      attentionRequired: attention,
      attentionReason: attention ? "playing_match_on_blocked_court" : null,
      nextResponsibleActor: attention ? "referee"
        : interrupted ? (["constrained", "uncertain"].includes(condition) ? "master" : "referee")
          : null
    });
  }
  return {
    competitionStatus: rows.length === 0 ? null : rows[0].competition_status,
    matches: rows.map(map),
    courts
  };
}

module.exports = { findByCompetitionId };
