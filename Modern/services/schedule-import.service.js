const db = require("../database/db");
const tournamentRepository = require("../repositories/tournament.repository");
const playerRepository = require("../repositories/player.repository");
const pairingRepository = require("../repositories/pairing.repository");
const matchRepository = require("../repositories/match.repository");
const scheduleRepository = require("../repositories/match-schedule.repository");
const checkinRepository = require("../repositories/checkin.repository");

function makeValidationError(message) {
  const err = new Error(message);
  err.code = "VALIDATION_ERROR";
  return err;
}

function makeNotFoundError(message) {
  const err = new Error(message);
  err.code = "NOT_FOUND";
  return err;
}

function parsePositiveId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw makeValidationError(`Valid ${label} id is required`);
  }
  return id;
}

// Match statuses that indicate active execution — import must be rejected.
const ACTIVE_MATCH_STATUSES = new Set([
  "assigned", "accepted", "playing", "interrupted", "scored",
  "awaiting_confirmation", "confirmed", "finished"
]);

/**
 * Validate the entire import template before any writes.
 * Returns { errors: [] } — empty means valid.
 */
function validateImportData(data) {
  const errors = [];

  if (!data || typeof data !== "object") {
    errors.push({ row: null, message: "Import data is required" });
    return { errors };
  }

  if (!Array.isArray(data.players) || data.players.length === 0) {
    errors.push({ row: null, message: "At least one player is required" });
  }

  if (!Array.isArray(data.rounds) || data.rounds.length === 0) {
    errors.push({ row: null, message: "At least one round is required" });
  }

  if (errors.length > 0) return { errors };

  // Validate players
  const playerNames = new Set();
  for (let i = 0; i < data.players.length; i++) {
    const p = data.players[i];
    const row = `players[${i}]`;
    if (!p.name || typeof p.name !== "string" || !p.name.trim()) {
      errors.push({ row, message: "Player name is required" });
      continue;
    }
    const name = p.name.trim();
    if (playerNames.has(name)) {
      errors.push({ row, message: `Duplicate player name: ${name}` });
    }
    playerNames.add(name);
  }

  // Validate pairs
  if (data.mode === "fixed-pair") {
    if (!Array.isArray(data.pairs) || data.pairs.length === 0) {
      errors.push({ row: "pairs", message: "Fixed-pair mode requires a non-empty pairs array" });
    }
  }

  const pairPlayerCounts = {};
  if (Array.isArray(data.pairs)) {
    for (let i = 0; i < data.pairs.length; i++) {
      const pair = data.pairs[i];
      const row = `pairs[${i}]`;
      if (!pair.name || typeof pair.name !== "string" || !pair.name.trim()) {
        errors.push({ row, message: "Pair name is required" });
        continue;
      }
      const names = pair.name.split(" & ").map((s) => s.trim());
      if (names.length !== 2) {
        errors.push({ row, message: "Pair name must contain exactly two player names separated by ' & '" });
        continue;
      }
      for (const n of names) {
        if (!playerNames.has(n)) {
          errors.push({ row, message: `Pair references unknown player: ${n}` });
        }
        pairPlayerCounts[n] = (pairPlayerCounts[n] || 0) + 1;
      }
    }

    // Players in multiple pairs
    for (const [name, count] of Object.entries(pairPlayerCounts)) {
      if (count > 1) {
        errors.push({ row: "pairs", message: `Player '${name}' belongs to ${count} pairs` });
      }
    }
  }

  // Build pair lookup for team consistency check
  const pairLookup = new Set();
  if (Array.isArray(data.pairs)) {
    for (const pair of data.pairs) {
      const names = pair.name.split(" & ").map((s) => s.trim()).sort();
      pairLookup.add(names.join(" & "));
    }
  }

  // Validate rounds and matches
  const courtTimeSlots = new Set();
  let totalMatches = 0;

  for (let r = 0; r < data.rounds.length; r++) {
    const round = data.rounds[r];
    const roundLabel = `rounds[${r}]`;

    if (!Array.isArray(round.matches)) {
      errors.push({ row: roundLabel, message: "Round must contain a matches array" });
      continue;
    }
    if (round.matches.length === 0) {
      errors.push({ row: roundLabel, message: "Round must not be empty" });
      continue;
    }

    for (let m = 0; m < round.matches.length; m++) {
      const match = round.matches[m];
      const row = `${roundLabel}.matches[${m}]`;
      totalMatches++;

      if (!match.court || typeof match.court !== "string" || !match.court.trim()) {
        errors.push({ row, message: "Court is required" });
      }
      if (!match.scheduledAt) {
        errors.push({ row, message: "Scheduled time is required" });
      } else {
        const d = new Date(match.scheduledAt);
        if (Number.isNaN(d.getTime())) {
          errors.push({ row, message: "Invalid scheduled time" });
        }
      }

      const matchPlayers = [];
      for (const field of ["p1", "p2", "p3", "p4"]) {
        if (!match[field] || typeof match[field] !== "string" || !match[field].trim()) {
          errors.push({ row, message: `${field} is required` });
        } else if (!playerNames.has(match[field].trim())) {
          errors.push({ row, message: `Unknown player reference: ${match[field]}` });
        } else {
          matchPlayers.push(match[field].trim());
        }
      }

      // Duplicate participants within a single match
      if (matchPlayers.length === 4) {
        const unique = new Set(matchPlayers);
        if (unique.size !== 4) {
          errors.push({ row, message: "Duplicate participant within a single match" });
        }
      }

      // Court-time conflict
      if (match.court && match.scheduledAt) {
        const slotKey = `${match.court.trim()}|${match.scheduledAt}`;
        if (courtTimeSlots.has(slotKey)) {
          errors.push({ row, message: `Court-time conflict: ${match.court} at ${match.scheduledAt}` });
        }
        courtTimeSlots.add(slotKey);
      }

      // Team name consistency with p1–p4
      if (data.mode === "fixed-pair" && match.team1 && matchPlayers.length === 4) {
        const team1Names = match.team1.split(" & ").map((s) => s.trim()).sort();
        const side1 = [matchPlayers[0], matchPlayers[1]].sort();
        if (team1Names[0] !== side1[0] || team1Names[1] !== side1[1]) {
          errors.push({ row, message: "team1 does not match p1 & p2" });
        }
        if (match.team2) {
          const team2Names = match.team2.split(" & ").map((s) => s.trim()).sort();
          const side2 = [matchPlayers[2], matchPlayers[3]].sort();
          if (team2Names[0] !== side2[0] || team2Names[1] !== side2[1]) {
            errors.push({ row, message: "team2 does not match p3 & p4" });
          }
        }
      }
    }
  }

  return { errors };
}

/**
 * Import a fixed-template schedule into a competition.
 *
 * One transaction:
 *   1. Clean previous import data
 *   2. Create players
 *   3. Create pairings (if mode=fixed-pair)
 *   4. Create matches (with match.id assigned by DB)
 *   5. Write authoritative match_schedules
 *   6. Record participant readiness (source=event_import)
 *
 * Any row failure rolls back the whole import.
 * Retry is safe: DELETE+INSERT guarantees no duplicates.
 */
async function importSchedule(competitionIdValue, data) {
  const tournamentId = parsePositiveId(competitionIdValue, "competition");

  // Phase 1: Validate entire file before any writes
  const { errors } = validateImportData(data);
  if (errors.length > 0) {
    const err = new Error("Import validation failed");
    err.code = "VALIDATION_ERROR";
    err.details = { errors };
    throw err;
  }

  // Phase 2: Single transaction for all writes
  return db.withTransaction(async (connection) => {
    const competition = await tournamentRepository.getTournamentByIdWithConnection(
      tournamentId, connection
    );
    if (!competition) throw makeNotFoundError("Competition not found");

    // Lifecycle guard: only allow import during the import window (default: draft)
    if (competition.status !== "draft") {
      const err = new Error(
        `Import is only allowed in draft status (current: ${competition.status})`
      );
      err.code = "LIFECYCLE_BLOCKED";
      throw err;
    }

    // Active-match guard: reject if any match has execution evidence
    const activeMatches = await matchRepository.getActiveMatchesByTournament(tournamentId, connection);
    if (activeMatches > 0) {
      const err = new Error(
        `Import rejected: ${activeMatches} match(es) have active or confirmed status`
      );
      err.code = "LIFECYCLE_BLOCKED";
      throw err;
    }

    // Update tournament name if provided
    if (data.tournamentName) {
      await tournamentRepository.updateTournamentName(tournamentId, data.tournamentName, connection);
    }

    // Clean previous data (order matters for FK constraints)
    await scheduleRepository.deleteByTournament(tournamentId, connection);
    await matchRepository.deleteMatchesByTournament(tournamentId, connection);
    await pairingRepository.deletePairingsByTournament(tournamentId, connection);
    await playerRepository.deletePlayersByTournament(tournamentId, connection);
    await playerRepository.deletePlayerPartnersByTournament(tournamentId, connection);
    await playerRepository.deletePlayerOpponentsByTournament(tournamentId, connection);
    await checkinRepository.deleteCheckInsByTournament(tournamentId, connection);

    // Create players
    for (const p of data.players) {
      await playerRepository.createPlayer({
        tournament_id: tournamentId,
        name: p.name.trim(),
        level: p.lv || 3,
        paired: p.paired !== undefined ? p.paired : true
      }, connection);
    }

    // Build name → id map
    const playerMap = await playerRepository.getPlayerMap(tournamentId, connection);

    // Create pairings (fixed-pair mode)
    if (data.mode === "fixed-pair" && Array.isArray(data.pairs)) {
      for (const pair of data.pairs) {
        const names = pair.name.split(" & ").map((s) => s.trim());
        const player1Id = playerMap[names[0]];
        const player2Id = playerMap[names[1]];
        if (player1Id && player2Id) {
          await pairingRepository.createPairing({
            tournament_id: tournamentId,
            player1_id: player1Id,
            player2_id: player2Id
          }, connection);
        }
      }
    }

    // Create matches and authoritative schedules
    const createdMatchIds = [];
    for (let r = 0; r < data.rounds.length; r++) {
      const round = data.rounds[r];
      const roundNum = round.round || (r + 1);

      for (const m of round.matches) {
        const createdMatch = await matchRepository.createMatch({
          tournament_id: tournamentId,
          round_num: roundNum,
          court: m.court.trim(),
          player1_id: playerMap[m.p1.trim()],
          player2_id: playerMap[m.p2.trim()],
          player3_id: playerMap[m.p3.trim()],
          player4_id: playerMap[m.p4.trim()],
          team1_name: data.mode === "fixed-pair" && m.team1 ? m.team1 : null,
          team2_name: data.mode === "fixed-pair" && m.team2 ? m.team2 : null,
          score1: null,
          score2: null,
          status: "idle"
        }, connection);

        await scheduleRepository.create({
          competitionId: tournamentId,
          matchId: createdMatch.id,
          scheduledAt: new Date(m.scheduledAt).toISOString(),
          courtId: m.court.trim()
        }, connection);

        createdMatchIds.push(createdMatch.id);
      }
    }

    // Record participant readiness (source=event_import)
    const playerIds = Object.values(playerMap);
    await checkinRepository.bulkUpsertReadiness(tournamentId, playerIds, "event_import", connection);

    return {
      success: true,
      summary: {
        players: data.players.length,
        pairs: data.pairs ? data.pairs.length : 0,
        matches: createdMatchIds.length,
        rounds: data.rounds.length,
        readyParticipants: playerIds.length
      }
    };
  });
}

module.exports = { importSchedule, validateImportData };
