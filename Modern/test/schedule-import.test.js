const assert = require("node:assert/strict");
const test = require("node:test");

const db = require("../database/db");
const tournamentRepository = require("../repositories/tournament.repository");
const playerRepository = require("../repositories/player.repository");
const pairingRepository = require("../repositories/pairing.repository");
const matchRepository = require("../repositories/match.repository");
const scheduleRepository = require("../repositories/match-schedule.repository");
const checkinRepository = require("../repositories/checkin.repository");

const { importSchedule, validateImportData } = require("../services/schedule-import.service");

// ─── Helpers ────────────────────────────────────────────────────────────────

function makePlayers(count) {
  const players = [];
  for (let i = 1; i <= count; i++) {
    const n = String(i).padStart(2, "0");
    players.push({ name: `Player ${n}`, lv: 3, paired: true });
  }
  return players;
}

function makePairs(players) {
  const pairs = [];
  for (let i = 0; i < players.length; i += 2) {
    pairs.push({ name: `${players[i].name} & ${players[i + 1].name}` });
  }
  return pairs;
}

function makeRounds(pairs, roundCount, courts) {
  const rounds = [];
  const base = new Date("2026-09-12T08:00:00Z");
  for (let r = 0; r < roundCount; r++) {
    const matches = [];
    for (let m = 0; m < pairs.length; m++) {
      const p1Idx = m * 2;
      const p2Idx = m * 2 + 2;
      if (p2Idx + 1 >= pairs.length * 2) break;
      const t = new Date(base.getTime() + (r * pairs.length + m) * 30 * 60 * 1000);
      matches.push({
        court: courts[m % courts.length],
        scheduledAt: t.toISOString(),
        p1: `Player ${String(p1Idx + 1).padStart(2, "0")}`,
        p2: `Player ${String(p1Idx + 2).padStart(2, "0")}`,
        p3: `Player ${String(p2Idx + 1).padStart(2, "0")}`,
        p4: `Player ${String(p2Idx + 2).padStart(2, "0")}`,
        team1: pairs[m].name,
        team2: pairs[Math.min(m + 1, pairs.length - 1)].name
      });
    }
    rounds.push({ round: r + 1, matches });
  }
  return rounds;
}

function makeMinimalImport() {
  const players = makePlayers(4);
  const pairs = makePairs(players);
  return {
    tournamentName: "Test Import",
    mode: "fixed-pair",
    players,
    pairs,
    rounds: [{
      round: 1,
      matches: [{
        court: "Court 1",
        scheduledAt: "2026-09-12T08:00:00Z",
        p1: "Player 01", p2: "Player 02",
        p3: "Player 03", p4: "Player 04",
        team1: pairs[0].name, team2: pairs[1].name
      }]
    }]
  };
}

function make32DrawImport() {
  const players = makePlayers(64);
  const pairs = makePairs(players);
  return {
    tournamentName: "32-Draw Doubles Sample",
    mode: "fixed-pair",
    players,
    pairs,
    rounds: makeRounds(pairs, 4, ["Court 1", "Court 2", "Court 3", "Court 4", "Court 5", "Court 6"])
  };
}

// ─── Mock infrastructure ────────────────────────────────────────────────────

const original = {
  withTransaction: db.withTransaction,
  getCompetition: tournamentRepository.getTournamentByIdWithConnection,
  updateTournamentName: tournamentRepository.updateTournamentName,
  createPlayer: playerRepository.createPlayer,
  getPlayerMap: playerRepository.getPlayerMap,
  deletePlayers: playerRepository.deletePlayersByTournament,
  deletePartners: playerRepository.deletePlayerPartnersByTournament,
  deleteOpponents: playerRepository.deletePlayerOpponentsByTournament,
  createPairing: pairingRepository.createPairing,
  deletePairings: pairingRepository.deletePairingsByTournament,
  createMatch: matchRepository.createMatch,
  deleteMatches: matchRepository.deleteMatchesByTournament,
  createSchedule: scheduleRepository.create,
  deleteSchedules: scheduleRepository.deleteByTournament,
  bulkUpsert: checkinRepository.bulkUpsertReadiness,
  deleteCheckIns: checkinRepository.deleteCheckInsByTournament
};

function setupMocks() {
  let matchIdSeq = 100;
  const calls = {
    createPlayer: [],
    createPairing: [],
    createMatch: [],
    createSchedule: [],
    bulkUpsert: [],
    deleteSchedules: 0,
    deleteMatches: 0,
    deletePairings: 0,
    deletePlayers: 0,
    deletePartners: 0,
    deleteOpponents: 0,
    deleteCheckIns: 0,
    updateTournamentName: []
  };

  db.withTransaction = async (work) => work({ query: async () => [[]] });
  tournamentRepository.getTournamentByIdWithConnection = async () => ({ id: 1, status: "draft" });
  tournamentRepository.updateTournamentName = async (_id, name) => { calls.updateTournamentName.push(name); };

  playerRepository.createPlayer = async (p) => {
    calls.createPlayer.push(p);
    return { id: calls.createPlayer.length, ...p };
  };
  playerRepository.getPlayerMap = async () => {
    const map = {};
    calls.createPlayer.forEach((p, i) => { map[p.name] = i + 1; });
    return map;
  };
  playerRepository.deletePlayersByTournament = async () => { calls.deletePlayers++; };
  playerRepository.deletePlayerPartnersByTournament = async () => { calls.deletePartners++; };
  playerRepository.deletePlayerOpponentsByTournament = async () => { calls.deleteOpponents++; };

  pairingRepository.createPairing = async (p) => { calls.createPairing.push(p); return { id: calls.createPairing.length, ...p }; };
  pairingRepository.deletePairingsByTournament = async () => { calls.deletePairings++; };

  matchRepository.createMatch = async (m) => {
    const id = matchIdSeq++;
    calls.createMatch.push({ id, ...m });
    return { id, ...m };
  };
  matchRepository.deleteMatchesByTournament = async () => { calls.deleteMatches++; };

  scheduleRepository.create = async (s) => { calls.createSchedule.push(s); return { id: calls.createSchedule.length, ...s }; };
  scheduleRepository.deleteByTournament = async () => { calls.deleteSchedules++; };

  checkinRepository.bulkUpsertReadiness = async (compId, pids, source) => {
    calls.bulkUpsert.push({ compId, pids, source });
  };
  checkinRepository.deleteCheckInsByTournament = async () => { calls.deleteCheckIns++; };

  return calls;
}

function restoreMocks() {
  db.withTransaction = original.withTransaction;
  tournamentRepository.getTournamentByIdWithConnection = original.getCompetition;
  tournamentRepository.updateTournamentName = original.updateTournamentName;
  playerRepository.createPlayer = original.createPlayer;
  playerRepository.getPlayerMap = original.getPlayerMap;
  playerRepository.deletePlayersByTournament = original.deletePlayers;
  playerRepository.deletePlayerPartnersByTournament = original.deletePartners;
  playerRepository.deletePlayerOpponentsByTournament = original.deleteOpponents;
  pairingRepository.createPairing = original.createPairing;
  pairingRepository.deletePairingsByTournament = original.deletePairings;
  matchRepository.createMatch = original.createMatch;
  matchRepository.deleteMatchesByTournament = original.deleteMatches;
  scheduleRepository.create = original.createSchedule;
  scheduleRepository.deleteByTournament = original.deleteSchedules;
  checkinRepository.bulkUpsertReadiness = original.bulkUpsert;
  checkinRepository.deleteCheckInsByTournament = original.deleteCheckIns;
}

// ─── Validation tests ───────────────────────────────────────────────────────

test("validateImportData rejects null data", () => {
  const { errors } = validateImportData(null);
  assert.ok(errors.length > 0);
  assert.ok(errors.some((e) => e.message.includes("Import data is required")));
});

test("validateImportData rejects empty players", () => {
  const { errors } = validateImportData({ players: [], rounds: [{ matches: [] }] });
  assert.ok(errors.some((e) => e.message.includes("At least one player")));
});

test("validateImportData rejects empty rounds", () => {
  const { errors } = validateImportData({
    players: [{ name: "A" }],
    rounds: []
  });
  assert.ok(errors.some((e) => e.message.includes("At least one round")));
});

test("validateImportData detects duplicate player names", () => {
  const { errors } = validateImportData({
    players: [{ name: "A" }, { name: "A" }],
    rounds: [{ matches: [] }]
  });
  assert.ok(errors.some((e) => e.message.includes("Duplicate player name")));
});

test("validateImportData detects missing court", () => {
  const data = makeMinimalImport();
  delete data.rounds[0].matches[0].court;
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("Court is required")));
});

test("validateImportData detects missing scheduledAt", () => {
  const data = makeMinimalImport();
  delete data.rounds[0].matches[0].scheduledAt;
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("Scheduled time is required")));
});

test("validateImportData detects unknown player reference", () => {
  const data = makeMinimalImport();
  data.rounds[0].matches[0].p1 = "NonExistent";
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("Unknown player reference")));
});

test("validateImportData detects pair referencing unknown player", () => {
  const data = makeMinimalImport();
  data.pairs.push({ name: "Player 01 & Ghost" });
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("unknown player")));
});

test("validateImportData passes for valid minimal import", () => {
  const { errors } = validateImportData(makeMinimalImport());
  assert.equal(errors.length, 0);
});

test("validateImportData passes for 32-draw import", () => {
  const { errors } = validateImportData(make32DrawImport());
  assert.equal(errors.length, 0);
});

// ─── Import orchestration tests ─────────────────────────────────────────────

test("importSchedule writes players, matches, schedules, and readiness in one transaction", async () => {
  const calls = setupMocks();
  try {
    const data = makeMinimalImport();
    const result = await importSchedule(1, data);

    assert.equal(result.success, true);
    assert.equal(result.summary.players, 4);
    assert.equal(result.summary.pairs, 2);
    assert.equal(result.summary.matches, 1);
    assert.equal(result.summary.rounds, 1);
    assert.equal(result.summary.readyParticipants, 4);

    // Verify cleanup happened
    assert.equal(calls.deleteSchedules, 1);
    assert.equal(calls.deleteMatches, 1);
    assert.equal(calls.deletePairings, 1);
    assert.equal(calls.deletePlayers, 1);
    assert.equal(calls.deleteCheckIns, 1);

    // Verify players created
    assert.equal(calls.createPlayer.length, 4);

    // Verify pairs created
    assert.equal(calls.createPairing.length, 2);

    // Verify match created with correct data
    assert.equal(calls.createMatch.length, 1);
    assert.equal(calls.createMatch[0].court, "Court 1");
    assert.equal(calls.createMatch[0].status, "idle");

    // Verify authoritative match_schedules written
    assert.equal(calls.createSchedule.length, 1);
    assert.equal(calls.createSchedule[0].courtId, "Court 1");
    assert.equal(calls.createSchedule[0].scheduledAt, "2026-09-12T08:00:00.000Z");

    // Verify participant readiness recorded with source=event_import
    assert.equal(calls.bulkUpsert.length, 1);
    assert.equal(calls.bulkUpsert[0].source, "event_import");
    assert.equal(calls.bulkUpsert[0].pids.length, 4);
  } finally {
    restoreMocks();
  }
});

test("importSchedule updates tournament name when provided", async () => {
  const calls = setupMocks();
  try {
    const data = makeMinimalImport();
    data.tournamentName = "Updated Name";
    await importSchedule(1, data);
    assert.deepEqual(calls.updateTournamentName, ["Updated Name"]);
  } finally {
    restoreMocks();
  }
});

test("importSchedule rejects unknown competition", async () => {
  setupMocks();
  tournamentRepository.getTournamentByIdWithConnection = async () => null;
  try {
    await assert.rejects(
      () => importSchedule(999, makeMinimalImport()),
      (err) => err.code === "NOT_FOUND" && err.message === "Competition not found"
    );
  } finally {
    restoreMocks();
  }
});

test("importSchedule returns validation errors without writing anything", async () => {
  const calls = setupMocks();
  try {
    const data = makeMinimalImport();
    data.rounds[0].matches[0].p1 = "Ghost";

    await assert.rejects(
      () => importSchedule(1, data),
      (err) => err.code === "VALIDATION_ERROR" && err.details && err.details.errors.length > 0
    );

    // No writes should have happened
    assert.equal(calls.createPlayer.length, 0);
    assert.equal(calls.createMatch.length, 0);
    assert.equal(calls.createSchedule.length, 0);
    assert.equal(calls.bulkUpsert.length, 0);
    assert.equal(calls.deleteSchedules, 0);
  } finally {
    restoreMocks();
  }
});

test("importSchedule is idempotent — re-import produces same result without duplicates", async () => {
  const calls = setupMocks();
  try {
    const data = makeMinimalImport();

    // First import
    const r1 = await importSchedule(1, data);
    assert.equal(r1.success, true);
    assert.equal(r1.summary.players, 4);

    // Second import (re-import)
    const r2 = await importSchedule(1, data);
    assert.equal(r2.success, true);
    assert.equal(r2.summary.players, 4);

    // Cleanup should have been called each time
    assert.equal(calls.deletePlayers, 2);
    assert.equal(calls.deleteSchedules, 2);
    assert.equal(calls.deleteCheckIns, 2);
  } finally {
    restoreMocks();
  }
});

test("importSchedule writes match_schedules with correct court and time for every match", async () => {
  const calls = setupMocks();
  try {
    const data = makeMinimalImport();
    // Add a second match in a different round
    data.rounds.push({
      round: 2,
      matches: [{
        court: "Court 3",
        scheduledAt: "2026-09-12T09:30:00Z",
        p1: "Player 01", p2: "Player 03",
        p3: "Player 02", p4: "Player 04",
        team1: "Player 01 & Player 03",
        team2: "Player 02 & Player 04"
      }]
    });

    const result = await importSchedule(1, data);
    assert.equal(result.summary.matches, 2);
    assert.equal(calls.createSchedule.length, 2);

    // Verify first schedule
    assert.equal(calls.createSchedule[0].courtId, "Court 1");
    assert.equal(calls.createSchedule[0].scheduledAt, "2026-09-12T08:00:00.000Z");

    // Verify second schedule
    assert.equal(calls.createSchedule[1].courtId, "Court 3");
    assert.equal(calls.createSchedule[1].scheduledAt, "2026-09-12T09:30:00.000Z");
  } finally {
    restoreMocks();
  }
});

// ─── 32-draw realistic scale test ───────────────────────────────────────────

test("32-draw doubles import creates 64 players, 32 pairs, and authoritative schedules for all matches", async () => {
  const calls = setupMocks();
  try {
    const data = make32DrawImport();
    const result = await importSchedule(1, data);

    assert.equal(result.success, true);
    assert.equal(result.summary.players, 64);
    assert.equal(result.summary.pairs, 32);
    assert.equal(result.summary.readyParticipants, 64);

    // All matches should have schedules
    const totalMatches = data.rounds.reduce((s, r) => s + r.matches.length, 0);
    assert.equal(result.summary.matches, totalMatches);
    assert.equal(calls.createSchedule.length, totalMatches);

    // Every schedule has a court and a valid time
    for (const sched of calls.createSchedule) {
      assert.ok(sched.courtId.startsWith("Court "), "Schedule must have a court");
      assert.ok(sched.scheduledAt, "Schedule must have a time");
      assert.ok(!Number.isNaN(new Date(sched.scheduledAt).getTime()), "Time must be valid ISO");
    }

    // Readiness recorded for all 64 players
    assert.equal(calls.bulkUpsert.length, 1);
    assert.equal(calls.bulkUpsert[0].pids.length, 64);
    assert.equal(calls.bulkUpsert[0].source, "event_import");
  } finally {
    restoreMocks();
  }
});

// ─── Template file validation ───────────────────────────────────────────────

test("32-draw sample template file is valid for import", async () => {
  const fs = require("fs");
  const path = require("path");
  const templatePath = path.join(__dirname, "..", "templates", "32-draw-doubles-sample.json");

  assert.ok(fs.existsSync(templatePath), "Template file must exist");

  const data = JSON.parse(fs.readFileSync(templatePath, "utf-8"));
  const { errors } = validateImportData(data);
  assert.equal(errors.length, 0, `Template must pass validation, but got: ${JSON.stringify(errors)}`);

  assert.equal(data.players.length, 64);
  assert.equal(data.pairs.length, 32);
  assert.equal(data.mode, "fixed-pair");
  assert.ok(data.rounds.length >= 1);
});

// ─── Readiness source field ─────────────────────────────────────────────────

test("imported readiness carries source event_import", async () => {
  const calls = setupMocks();
  try {
    await importSchedule(1, makeMinimalImport());
    assert.equal(calls.bulkUpsert[0].source, "event_import");
  } finally {
    restoreMocks();
  }
});
