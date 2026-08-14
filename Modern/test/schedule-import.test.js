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
  const courts = ["Court 1", "Court 2", "Court 3", "Court 4", "Court 5", "Court 6"];
  const base = new Date("2026-09-12T08:00:00Z");
  const matches = [];
  for (let m = 0; m < 16; m++) {
    const ns1 = pairs[m * 2].name.split(" & ");
    const ns2 = pairs[m * 2 + 1].name.split(" & ");
    const t = new Date(base.getTime() + Math.floor(m / 6) * 30 * 60 * 1000);
    matches.push({
      court: courts[m % 6],
      scheduledAt: t.toISOString(),
      p1: ns1[0], p2: ns1[1], p3: ns2[0], p4: ns2[1],
      team1: pairs[m * 2].name, team2: pairs[m * 2 + 1].name
    });
  }
  return {
    tournamentName: "32-Draw Doubles — Round 1",
    mode: "fixed-pair",
    players, pairs,
    rounds: [{ round: 1, matches }]
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
  getActiveMatches: matchRepository.getActiveMatchesByTournament,
  createSchedule: scheduleRepository.create,
  deleteSchedules: scheduleRepository.deleteByTournament,
  bulkUpsert: checkinRepository.bulkUpsertReadiness,
  deleteCheckIns: checkinRepository.deleteCheckInsByTournament
};

function setupMocks(competitionStatus = "draft", activeMatchCount = 0) {
  let matchIdSeq = 100;
  const calls = {
    createPlayer: [], createPairing: [], createMatch: [], createSchedule: [],
    bulkUpsert: [], deleteSchedules: 0, deleteMatches: 0, deletePairings: 0,
    deletePlayers: 0, deletePartners: 0, deleteOpponents: 0, deleteCheckIns: 0,
    updateTournamentName: []
  };

  db.withTransaction = async (work) => work({ query: async () => [[]] });
  tournamentRepository.getTournamentByIdWithConnection = async () => ({ id: 1, status: competitionStatus });
  tournamentRepository.updateTournamentName = async (_id, name) => { calls.updateTournamentName.push(name); };
  matchRepository.getActiveMatchesByTournament = async () => activeMatchCount;

  playerRepository.createPlayer = async (p) => { calls.createPlayer.push(p); return { id: calls.createPlayer.length, ...p }; };
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
  matchRepository.createMatch = async (m) => { const id = matchIdSeq++; calls.createMatch.push({ id, ...m }); return { id, ...m }; };
  matchRepository.deleteMatchesByTournament = async () => { calls.deleteMatches++; };
  scheduleRepository.create = async (s) => { calls.createSchedule.push(s); return { id: calls.createSchedule.length, ...s }; };
  scheduleRepository.deleteByTournament = async () => { calls.deleteSchedules++; };
  checkinRepository.bulkUpsertReadiness = async (compId, pids, source) => { calls.bulkUpsert.push({ compId, pids, source }); };
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
  matchRepository.getActiveMatchesByTournament = original.getActiveMatches;
  scheduleRepository.create = original.createSchedule;
  scheduleRepository.deleteByTournament = original.deleteSchedules;
  checkinRepository.bulkUpsertReadiness = original.bulkUpsert;
  checkinRepository.deleteCheckInsByTournament = original.deleteCheckIns;
}

// ─── Validation tests ───────────────────────────────────────────────────────

test("validateImportData rejects null data", () => {
  const { errors } = validateImportData(null);
  assert.ok(errors.some((e) => e.message.includes("Import data is required")));
});

test("validateImportData rejects empty players", () => {
  const { errors } = validateImportData({ players: [], rounds: [{ matches: [] }] });
  assert.ok(errors.some((e) => e.message.includes("At least one player")));
});

test("validateImportData rejects empty rounds", () => {
  const { errors } = validateImportData({ players: [{ name: "A" }], rounds: [] });
  assert.ok(errors.some((e) => e.message.includes("At least one round")));
});

test("validateImportData detects duplicate player names", () => {
  const { errors } = validateImportData({ players: [{ name: "A" }, { name: "A" }], rounds: [{ matches: [] }] });
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
  assert.equal(validateImportData(makeMinimalImport()).errors.length, 0);
});

test("validateImportData passes for 32-draw import", () => {
  assert.equal(validateImportData(make32DrawImport()).errors.length, 0);
});

// ─── Enhanced validation tests (review fix #2) ─────────────────────────────

test("rejects duplicate participant within a single match", () => {
  const data = makeMinimalImport();
  data.rounds[0].matches[0].p3 = "Player 01"; // Player 01 appears twice
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("Duplicate participant")));
});

test("rejects court-time conflict", () => {
  const data = makeMinimalImport();
  data.rounds[0].matches.push({
    court: "Court 1", scheduledAt: "2026-09-12T08:00:00Z",
    p1: "Player 01", p2: "Player 02", p3: "Player 03", p4: "Player 04",
    team1: data.pairs[0].name, team2: data.pairs[1].name
  });
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("Court-time conflict")));
});

test("rejects player belonging to multiple pairs", () => {
  const data = makeMinimalImport();
  data.pairs.push({ name: "Player 01 & Player 03" }); // Player 01 already in pair 0
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("belongs to 2 pairs")));
});

test("rejects fixed-pair mode with missing pairs array", () => {
  const data = makeMinimalImport();
  data.mode = "fixed-pair";
  delete data.pairs;
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("requires a non-empty pairs")));
});

test("rejects team1 inconsistent with p1 & p2", () => {
  const data = makeMinimalImport();
  data.rounds[0].matches[0].team1 = "Player 03 & Player 04"; // swapped with team2
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("team1 does not match p1 & p2")));
});

test("rejects empty round with no matches", () => {
  const data = makeMinimalImport();
  data.rounds.push({ round: 2, matches: [] });
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("Round must not be empty")));
});

// ─── Lifecycle guard tests (review fix #1) ─────────────────────────────────

test("importSchedule rejects non-draft competition without any deletes", async () => {
  const calls = setupMocks("running");
  try {
    await assert.rejects(
      () => importSchedule(1, makeMinimalImport()),
      (err) => err.code === "LIFECYCLE_BLOCKED" && err.message.includes("draft")
    );
    assert.equal(calls.deleteSchedules, 0);
    assert.equal(calls.deleteMatches, 0);
    assert.equal(calls.deletePlayers, 0);
  } finally { restoreMocks(); }
});

test("importSchedule rejects when active matches exist without any deletes", async () => {
  const calls = setupMocks("draft", 3);
  try {
    await assert.rejects(
      () => importSchedule(1, makeMinimalImport()),
      (err) => err.code === "LIFECYCLE_BLOCKED" && err.message.includes("3 match(es)")
    );
    assert.equal(calls.deleteSchedules, 0);
    assert.equal(calls.createPlayer.length, 0);
  } finally { restoreMocks(); }
});

// ─── Import orchestration tests ─────────────────────────────────────────────

test("importSchedule writes players, matches, schedules, and readiness in one transaction", async () => {
  const calls = setupMocks();
  try {
    const result = await importSchedule(1, makeMinimalImport());
    assert.equal(result.success, true);
    assert.equal(result.summary.players, 4);
    assert.equal(result.summary.pairs, 2);
    assert.equal(result.summary.matches, 1);
    assert.equal(result.summary.readyParticipants, 4);
    assert.equal(calls.deleteSchedules, 1);
    assert.equal(calls.createSchedule.length, 1);
    assert.equal(calls.createSchedule[0].courtId, "Court 1");
    assert.equal(calls.bulkUpsert[0].source, "event_import");
  } finally { restoreMocks(); }
});

test("importSchedule updates tournament name when provided", async () => {
  const calls = setupMocks();
  try {
    const data = makeMinimalImport();
    data.tournamentName = "Updated Name";
    await importSchedule(1, data);
    assert.deepEqual(calls.updateTournamentName, ["Updated Name"]);
  } finally { restoreMocks(); }
});

test("importSchedule rejects unknown competition", async () => {
  setupMocks();
  tournamentRepository.getTournamentByIdWithConnection = async () => null;
  try {
    await assert.rejects(
      () => importSchedule(999, makeMinimalImport()),
      (err) => err.code === "NOT_FOUND"
    );
  } finally { restoreMocks(); }
});

test("validation errors prevent any writes", async () => {
  const calls = setupMocks();
  try {
    const data = makeMinimalImport();
    data.rounds[0].matches[0].p1 = "Ghost";
    await assert.rejects(
      () => importSchedule(1, data),
      (err) => err.code === "VALIDATION_ERROR"
    );
    assert.equal(calls.createPlayer.length, 0);
    assert.equal(calls.deleteSchedules, 0);
  } finally { restoreMocks(); }
});

test("importSchedule is idempotent — re-import produces same result", async () => {
  const calls = setupMocks();
  try {
    const data = makeMinimalImport();
    const r1 = await importSchedule(1, data);
    const r2 = await importSchedule(1, data);
    assert.equal(r1.summary.players, r2.summary.players);
    assert.equal(calls.deletePlayers, 2);
  } finally { restoreMocks(); }
});

// ─── 32-draw realistic scale test (review fix #3) ──────────────────────────

test("32-draw template has 16 first-round matches, consistent names, no conflicts", async () => {
  const data = make32DrawImport();
  const { errors } = validateImportData(data);
  assert.equal(errors.length, 0, `Validation errors: ${JSON.stringify(errors)}`);
  assert.equal(data.pairs.length, 32);
  assert.equal(data.rounds[0].matches.length, 16);
});

test("32-draw import creates 64 players, 32 pairs, and 16 authoritative schedules", async () => {
  const calls = setupMocks();
  try {
    const result = await importSchedule(1, make32DrawImport());
    assert.equal(result.summary.players, 64);
    assert.equal(result.summary.pairs, 32);
    assert.equal(result.summary.matches, 16);
    assert.equal(calls.createSchedule.length, 16);
    for (const s of calls.createSchedule) {
      assert.ok(s.courtId.startsWith("Court "));
      assert.ok(!Number.isNaN(new Date(s.scheduledAt).getTime()));
    }
    assert.equal(calls.bulkUpsert[0].pids.length, 64);
    assert.equal(calls.bulkUpsert[0].source, "event_import");
  } finally { restoreMocks(); }
});

// ─── Template file validation ───────────────────────────────────────────────

test("32-draw sample template file is valid for import", () => {
  const fs = require("fs");
  const path = require("path");
  const templatePath = path.join(__dirname, "..", "templates", "32-draw-doubles-sample.json");
  assert.ok(fs.existsSync(templatePath), "Template file must exist");
  const data = JSON.parse(fs.readFileSync(templatePath, "utf-8"));
  const { errors } = validateImportData(data);
  assert.equal(errors.length, 0, `Template validation errors: ${JSON.stringify(errors)}`);
  assert.equal(data.players.length, 64);
  assert.equal(data.pairs.length, 32);
  assert.equal(data.rounds[0].matches.length, 16);
  assert.equal(data.mode, "fixed-pair");
});

test("imported readiness carries source event_import", async () => {
  const calls = setupMocks();
  try {
    await importSchedule(1, makeMinimalImport());
    assert.equal(calls.bulkUpsert[0].source, "event_import");
  } finally { restoreMocks(); }
});
