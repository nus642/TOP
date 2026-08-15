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

const MASTER_ACTOR = Object.freeze({ actorId: "master-1", actorType: "master" });
const REFEREE_ACTOR = Object.freeze({ actorId: "referee-1", actorType: "referee" });
const PARTICIPANT_ACTOR = Object.freeze({ actorId: "participant-1", actorType: "participant" });

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
  getCompetitionForUpdate: tournamentRepository.getTournamentByIdForUpdate,
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
    updateTournamentName: [], forUpdateCalled: false
  };

  db.withTransaction = async (work) => work({ query: async () => [[]] });
  const tournamentRow = { id: 1, status: competitionStatus };
  tournamentRepository.getTournamentByIdForUpdate = async () => { calls.forUpdateCalled = true; return tournamentRow; };
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
  tournamentRepository.getTournamentByIdForUpdate = original.getCompetitionForUpdate;
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

// ─── Enhanced validation tests ──────────────────────────────────────────────

test("rejects duplicate participant within a single match", () => {
  const data = makeMinimalImport();
  data.rounds[0].matches[0].p3 = "Player 01";
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
  data.pairs.push({ name: "Player 01 & Player 03" });
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
  data.rounds[0].matches[0].team1 = "Player 03 & Player 04";
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("team1 does not match p1 & p2")));
});

test("rejects empty round with no matches", () => {
  const data = makeMinimalImport();
  data.rounds.push({ round: 2, matches: [] });
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("Round must not be empty")));
});

// ─── Null-row safety: must produce row-level errors, not TypeError ──────────

test("validateImportData reports row error for null player row", () => {
  const data = makeMinimalImport();
  data.players.splice(1, 0, null);
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.row === "players[1]" && e.message.includes("object")),
    `Expected row-level error, got: ${JSON.stringify(errors)}`);
});

test("validateImportData reports row error for null pair row", () => {
  const data = makeMinimalImport();
  data.pairs.splice(0, 0, null);
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.row === "pairs[0]" && e.message.includes("object")),
    `Expected row-level error, got: ${JSON.stringify(errors)}`);
});

test("validateImportData reports row error for null round row", () => {
  const data = makeMinimalImport();
  data.rounds.splice(0, 0, null);
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.row === "rounds[0]" && e.message.includes("object")),
    `Expected row-level error, got: ${JSON.stringify(errors)}`);
});

test("validateImportData reports row error for null match row", () => {
  const data = makeMinimalImport();
  data.rounds[0].matches.splice(0, 0, null);
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.row === "rounds[0].matches[0]" && e.message.includes("object")),
    `Expected row-level error, got: ${JSON.stringify(errors)}`);
});

test("validateImportData skips null pair in pairLookup without crashing", () => {
  const data = makeMinimalImport();
  data.pairs.push(null);
  // Should not throw — null pair is reported as error, pairLookup skips it
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.row === "pairs[2]" && e.message.includes("object")));
  // Other valid pairs should still be checked normally
  assert.ok(!errors.some((e) => e.message.includes("does not match any declared pair")));
});

test("importSchedule returns VALIDATION_ERROR (not 500) for null match row", async () => {
  setupMocks();
  try {
    const data = makeMinimalImport();
    data.rounds[0].matches.splice(0, 0, null);
    await assert.rejects(
      () => importSchedule(1, data, MASTER_ACTOR),
      (err) => err.code === "VALIDATION_ERROR"
    );
  } finally { restoreMocks(); }
});

// ─── Blocking review fix #3: strict fixed-pair validation ──────────────────

test("rejects player not belonging to any pair in fixed-pair mode", () => {
  const data = makeMinimalImport();
  // Remove Player 04 from all pairs by replacing pairs with only Player 01-03
  data.pairs = [{ name: "Player 01 & Player 02" }];
  data.players = [
    { name: "Player 01", lv: 3, paired: true },
    { name: "Player 02", lv: 3, paired: true },
    { name: "Player 03", lv: 3, paired: true },
    { name: "Player 04", lv: 3, paired: true }
  ];
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("does not belong to any pair")));
});

test("rejects missing team1 in fixed-pair mode", () => {
  const data = makeMinimalImport();
  delete data.rounds[0].matches[0].team1;
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("team1 is required")));
});

test("rejects missing team2 in fixed-pair mode", () => {
  const data = makeMinimalImport();
  delete data.rounds[0].matches[0].team2;
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("team2 is required")));
});

test("rejects team1 that does not match any declared pair", () => {
  const data = makeMinimalImport();
  data.rounds[0].matches[0].team1 = "Player 01 & Player 03"; // not a declared pair
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("does not match any declared pair")));
});

// ─── Blocking review fix #4: normalization ──────────────────────────────────

test("court-time conflict detected despite whitespace variation", () => {
  const data = makeMinimalImport();
  data.rounds[0].matches.push({
    court: "  Court   1  ", scheduledAt: "2026-09-12T08:00:00.000Z",
    p1: "Player 01", p2: "Player 02", p3: "Player 03", p4: "Player 04",
    team1: data.pairs[0].name, team2: data.pairs[1].name
  });
  const { errors } = validateImportData(data);
  assert.ok(errors.some((e) => e.message.includes("Court-time conflict")),
    `Expected conflict but got: ${JSON.stringify(errors)}`);
});

test("normalized court and time are stored consistently", async () => {
  const calls = setupMocks();
  try {
    const data = makeMinimalImport();
    data.rounds[0].matches[0].court = "  Court   1  ";
    data.rounds[0].matches[0].scheduledAt = "2026-09-12T08:00:00.000Z";
    await importSchedule(1, data, MASTER_ACTOR);
    assert.equal(calls.createSchedule[0].courtId, "Court 1");
    assert.equal(calls.createSchedule[0].scheduledAt, "2026-09-12T08:00:00Z");
    assert.equal(calls.createMatch[0].court, "Court 1");
  } finally { restoreMocks(); }
});

// ─── Blocking review fix #1: Master-only authorization ──────────────────────

test("importSchedule rejects non-master actor (referee)", async () => {
  setupMocks();
  try {
    await assert.rejects(
      () => importSchedule(1, makeMinimalImport(), REFEREE_ACTOR),
      (err) => err.code === "FORBIDDEN" && err.message.includes("master")
    );
  } finally { restoreMocks(); }
});

test("importSchedule rejects non-master actor (participant)", async () => {
  setupMocks();
  try {
    await assert.rejects(
      () => importSchedule(1, makeMinimalImport(), PARTICIPANT_ACTOR),
      (err) => err.code === "FORBIDDEN" && err.message.includes("master")
    );
  } finally { restoreMocks(); }
});

test("importSchedule rejects missing actor", async () => {
  setupMocks();
  try {
    await assert.rejects(
      () => importSchedule(1, makeMinimalImport()),
      (err) => err.code === "FORBIDDEN"
    );
  } finally { restoreMocks(); }
});

// ─── Blocking review fix #2: tournament row lock ────────────────────────────

test("importSchedule uses FOR UPDATE lock on tournament row", async () => {
  const calls = setupMocks();
  try {
    await importSchedule(1, makeMinimalImport(), MASTER_ACTOR);
    assert.equal(calls.forUpdateCalled, true);
  } finally { restoreMocks(); }
});

// ─── Lifecycle guard tests ──────────────────────────────────────────────────

test("importSchedule rejects non-draft competition without any deletes", async () => {
  const calls = setupMocks("running");
  try {
    await assert.rejects(
      () => importSchedule(1, makeMinimalImport(), MASTER_ACTOR),
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
      () => importSchedule(1, makeMinimalImport(), MASTER_ACTOR),
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
    const result = await importSchedule(1, makeMinimalImport(), MASTER_ACTOR);
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
    await importSchedule(1, data, MASTER_ACTOR);
    assert.deepEqual(calls.updateTournamentName, ["Updated Name"]);
  } finally { restoreMocks(); }
});

test("importSchedule rejects unknown competition", async () => {
  setupMocks();
  tournamentRepository.getTournamentByIdForUpdate = async () => null;
  try {
    await assert.rejects(
      () => importSchedule(999, makeMinimalImport(), MASTER_ACTOR),
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
      () => importSchedule(1, data, MASTER_ACTOR),
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
    const r1 = await importSchedule(1, data, MASTER_ACTOR);
    const r2 = await importSchedule(1, data, MASTER_ACTOR);
    assert.equal(r1.summary.players, r2.summary.players);
    assert.equal(calls.deletePlayers, 2);
  } finally { restoreMocks(); }
});

// ─── 32-draw realistic scale test ───────────────────────────────────────────

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
    const result = await importSchedule(1, make32DrawImport(), MASTER_ACTOR);
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
    await importSchedule(1, makeMinimalImport(), MASTER_ACTOR);
    assert.equal(calls.bulkUpsert[0].source, "event_import");
  } finally { restoreMocks(); }
});
