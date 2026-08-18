const assert = require("node:assert/strict");
const test = require("node:test");
const { createRallyScoring, createBackup } = require("../operator/referee-scoring");

// M2 Referee Match Operation Experience (ED-05): client-side rally scoring
// state machine behavior, mirrored from Legacy referee.html award() L988-1070.

function doublesScoring(format = {}) {
  return createRallyScoring({
    format: { scoreRule: "rally", gameFormat: 1, ...format },
    teams: { team1Left: "A", team1Right: "B", team2Left: "C", team2Right: "D" },
    doubles: true
  });
}

test("rally doubles: serving side winning swaps partner positions", () => {
  const scoring = doublesScoring({ targetScore: 11, capScore: 0 });
  assert.equal(scoring.servingInfo().player, "B"); // score 0 -> right court serves
  scoring.award(1);
  const state = scoring.state();
  assert.deepEqual(state.teams.t1, { l: "B", r: "A" });
  assert.equal(state.t1Score, 1);
  assert.equal(state.servTeam, 1);
});

test("rally doubles: receiving side winning does not swap positions", () => {
  const scoring = doublesScoring({ targetScore: 11, capScore: 0 });
  scoring.award(2);
  const state = scoring.state();
  assert.deepEqual(state.teams.t1, { l: "A", r: "B" });
  assert.equal(state.t2Score, 1);
  assert.equal(state.servTeam, 2);
});

test("rally: next server follows serving team score parity", () => {
  const scoring = doublesScoring({ targetScore: 11, capScore: 0 });
  scoring.award(1); // t1 1-0, odd -> left court player serves
  assert.equal(scoring.servingInfo().player, "B"); // after swap, B sits left
  assert.equal(scoring.servingInfo().court, "left");
  scoring.award(1); // t1 2-0, even -> right court player serves
  assert.equal(scoring.servingInfo().court, "right");
});

test("win condition requires target score plus two-point lead", () => {
  const scoring = doublesScoring({ targetScore: 5, capScore: 0 });
  for (let i = 0; i < 4; i++) scoring.award(1); // 4-0
  scoring.award(2); // 4-1
  let events = scoring.award(1); // 5-1, lead 4
  assert.equal(events.gameWon, true);
});

test("win condition: no win at target without two-point lead", () => {
  const scoring = doublesScoring({ targetScore: 3, capScore: 0 });
  scoring.award(1); scoring.award(2); scoring.award(1); scoring.award(2); // 2-2
  const events = scoring.award(1); // 3-2: target reached but lead is only 1
  assert.equal(events.gameWon, undefined);
  assert.equal(scoring.isGameEnded(), false);
});

test("win condition: cap score forces game end", () => {
  const scoring = doublesScoring({ targetScore: 11, capScore: 3 });
  scoring.award(1); scoring.award(2); scoring.award(1); // alternating -> 2-1
  const events = scoring.award(1); // 3-1 max hits cap 3
  assert.equal(events.gameWon, true);
});

test("win condition: cap=0 means no forced cap end", () => {
  const scoring = doublesScoring({ targetScore: 2, capScore: 0 });
  scoring.award(1); scoring.award(2); scoring.award(1); scoring.award(2); // 2-2
  scoring.award(1); // 3-2: beyond target but diff 1 -> not won
  assert.equal(scoring.isGameEnded(), false);
  const events = scoring.award(1); // 4-2 diff 2 -> won
  assert.equal(events.gameWon, true);
});

test("game-over guard rejects further points after the game ends", () => {
  const scoring = doublesScoring({ targetScore: 2, capScore: 0 });
  scoring.award(1); scoring.award(1);
  assert.equal(scoring.isGameEnded(), true);
  const before = scoring.state();
  const result = scoring.award(2);
  assert.deepEqual(result, { rejected: "ended" });
  const after = scoring.state();
  assert.equal(after.t1Score, before.t1Score);
  assert.equal(after.t2Score, before.t2Score);
});

test("undo restores score, rotation, timeline, and ended state", () => {
  const scoring = doublesScoring({ targetScore: 11, capScore: 0 });
  scoring.award(1); // team1 serve win: positions swap to l=B, r=A
  scoring.award(2); // receiving side win: no swap
  scoring.award(2); // team2 wins again while serving
  assert.ok(scoring.undo());
  const state = scoring.state();
  assert.equal(state.t1Score, 1);
  assert.equal(state.t2Score, 1);
  assert.equal(state.timeline.length, 2);
  assert.equal(state.gameEnded, false);
  assert.deepEqual(state.teams.t1, { l: "B", r: "A" });
  assert.equal(state.servTeam, 2); // undo reverts to the state before the third rally
});

test("undo with no history reports false", () => {
  const scoring = doublesScoring({ targetScore: 11, capScore: 0 });
  assert.equal(scoring.undo(), false);
});

test("side switch triggers once at half of target score", () => {
  const scoring = doublesScoring({ targetScore: 11, capScore: 0 });
  let switchEvents = 0;
  for (let i = 0; i < 6; i++) {
    const events = scoring.award(1);
    if (events.sideSwitch) switchEvents += 1;
  }
  assert.equal(switchEvents, 1); // reached 6 = ceil(11/2)
  const events = scoring.award(1);
  assert.equal(events.sideSwitch, undefined); // no repeat
});

test("undo restores the side-switch flag", () => {
  const scoring = doublesScoring({ targetScore: 11, capScore: 0 });
  for (let i = 0; i < 6; i++) scoring.award(1);
  assert.equal(scoring.state().halfSwitched, true);
  scoring.undo();
  assert.equal(scoring.state().halfSwitched, false);
  const events = scoring.award(1);
  assert.equal(events.sideSwitch, true); // fires again after rollback
});

test("best-of-three tracks game wins and ends match at two wins", () => {
  const scoring = createRallyScoring({
    format: { scoreRule: "rally", gameFormat: 3, targetScore: 2, capScore: 0 },
    teams: { team1: "X", team2: "Y" },
    doubles: false
  });
  scoring.award(1); scoring.award(1); // game 1: X wins 2-0
  let outcome = scoring.endGame();
  assert.deepEqual(outcome, { ended: true, matchEnded: false });
  let state = scoring.state();
  assert.equal(state.t1Wins, 1);
  assert.equal(state.currentGame, 2);
  assert.equal(state.t1Score, 0);
  assert.equal(state.gameEnded, false);

  scoring.award(2); scoring.award(2); // game 2: Y wins
  scoring.endGame();
  scoring.award(1); scoring.award(1); // game 3: X wins
  outcome = scoring.endGame();
  assert.equal(outcome.matchEnded, true);
  assert.deepEqual(outcome.finalScore, { score1: 2, score2: 1 });
  state = scoring.state();
  assert.equal(state.matchEnded, true);
  assert.equal(scoring.winner(), 1);
});

test("timeout quota resets per game", () => {
  const scoring = createRallyScoring({
    format: { scoreRule: "rally", gameFormat: 3, targetScore: 2, capScore: 0 },
    teams: { team1: "X", team2: "Y" }, doubles: false
  });
  assert.deepEqual(scoring.requestTimeout(1), { ok: true });
  assert.equal(scoring.requestTimeout(1).reason, "quota");
  scoring.award(1); scoring.award(1);
  scoring.endGame();
  assert.deepEqual(scoring.requestTimeout(1), { ok: true });
});

test("medical timeout quota persists across games", () => {
  const scoring = createRallyScoring({
    format: { scoreRule: "rally", gameFormat: 3, targetScore: 2, capScore: 0 },
    teams: { team1: "X", team2: "Y" }, doubles: false
  });
  assert.deepEqual(scoring.requestMedical(2), { ok: true });
  scoring.award(1); scoring.award(1);
  scoring.endGame();
  assert.equal(scoring.requestMedical(2).reason, "quota");
});

test("backup saves, loads, and clears serialized state", () => {
  const store = new Map();
  const storage = {
    setItem: (key, value) => store.set(key, value),
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    removeItem: (key) => store.delete(key)
  };
  const backup = createBackup({ storage, key: "top-referee-scoring:9" });
  const scoring = doublesScoring({ targetScore: 11, capScore: 0 });
  scoring.award(1);
  backup.save(scoring.state());

  const restored = createRallyScoring({ restore: backup.load() });
  assert.equal(restored.state().t1Score, 1);
  assert.equal(restored.servingInfo().team, 1);

  backup.clear();
  assert.equal(backup.load(), null);
});

test("side switch at half score flips viewSwapped and undo restores it", () => {
  const scoring = doublesScoring({ targetScore: 11, capScore: 0 });
  assert.equal(scoring.state().viewSwapped, false);
  for (let i = 0; i < 6; i++) scoring.award(1); // reaches ceil(11/2)
  assert.equal(scoring.state().viewSwapped, true);
  scoring.undo();
  assert.equal(scoring.state().viewSwapped, false);
});

test("toggleView flips viewSwapped manually", () => {
  const scoring = doublesScoring({ targetScore: 11, capScore: 0 });
  assert.equal(scoring.toggleView(), true);
  assert.equal(scoring.state().viewSwapped, true);
  assert.equal(scoring.toggleView(), false);
});

test("courtLayout reports left/right players, server, and view flag", () => {
  const scoring = doublesScoring({ targetScore: 11, capScore: 0 });
  let layout = scoring.courtLayout();
  assert.deepEqual(layout.t1, { left: "A", right: "B" });
  assert.deepEqual(layout.t2, { left: "C", right: "D" });
  assert.equal(layout.servingTeam, 1);
  assert.equal(layout.servingPlayer, "B"); // score 0 -> right court serves
  assert.equal(layout.viewSwapped, false);

  scoring.award(1); // serving side wins: positions swap to l=B, r=A
  layout = scoring.courtLayout();
  assert.deepEqual(layout.t1, { left: "B", right: "A" });
  assert.equal(layout.servingPlayer, "B"); // t1 score 1 (odd) -> left court serves
  assert.equal(layout.servingCourt, "left");
});
