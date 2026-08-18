(function expose(factory) {
  const scoring = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = scoring;
  if (typeof window !== "undefined") window.RefereeScoring = scoring;
})(function createModule() {
  // M2 Referee Match Operation Experience (ED-05). Client-side rally scoring
  // state machine: per-point history, serve rotation, win conditions, undo,
  // side switch, timeouts, and multi-game tracking. All state stays client-side;
  // only score snapshots are pushed to the backend.

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function teamPositions(teams = {}) {
    const t1 = teams.team1 || "一方";
    const t2 = teams.team2 || "另一方";
    return {
      t1: { l: teams.team1Left || t1, r: teams.team1Right || t1 },
      t2: { l: teams.team2Left || t2, r: teams.team2Right || t2 }
    };
  }

  function initialState({ format = {}, teams, doubles = false, servTeam = 1 } = {}) {
    return {
      match: {
        scoreRule: format.scoreRule || "rally",
        targetScore: Number(format.targetScore ?? 21),
        capScore: Number(format.capScore ?? 21),
        gameFormat: Number(format.gameFormat ?? 1),
        doubles: Boolean(doubles)
      },
      teams: teamPositions(teams),
      t1Score: 0,
      t2Score: 0,
      servTeam,
      timeline: [],
      history: [],
      halfSwitched: false,
      viewSwapped: false,
      gameEnded: false,
      matchEnded: false,
      currentGame: 1,
      t1Wins: 0,
      t2Wins: 0,
      results: [],
      timeouts: { t1: 0, t2: 0, medicalT1: 0, medicalT2: 0 }
    };
  }

  function createRallyScoring(options = {}) {
    let state = options.restore && options.restore.match
      ? clone(options.restore)
      : initialState(options);

    function swapPositions(team) {
      const key = team === 1 ? "t1" : "t2";
      const positions = state.teams[key];
      const tmp = positions.r;
      positions.r = positions.l;
      positions.l = tmp;
    }

    // Rally rule: next server is located by the serving team's own score parity
    // (even -> right court, odd -> left court). Mirrors Legacy award() L1039-1041.
    function servingInfo() {
      const key = state.servTeam === 1 ? "t1" : "t2";
      const score = state.servTeam === 1 ? state.t1Score : state.t2Score;
      const player = state.match.doubles
        ? (score % 2 === 0 ? state.teams[key].r : state.teams[key].l)
        : state.teams[key].r;
      return {
        team: state.servTeam,
        player,
        court: score % 2 === 0 ? "right" : "left",
        score
      };
    }

    function isGameWon() {
      const maxScore = Math.max(state.t1Score, state.t2Score);
      const diff = Math.abs(state.t1Score - state.t2Score);
      return (maxScore >= state.match.targetScore && diff >= 2)
        || (state.match.capScore > 0 && maxScore >= state.match.capScore);
    }

    function pushHistory() {
      const snapshot = clone(state);
      delete snapshot.history;
      state.history.push(snapshot);
    }

    function award(winTeam) {
      // Game-over guard: once the game has ended, further points are rejected.
      if (state.gameEnded || state.matchEnded) return { rejected: "ended" };
      if (winTeam !== 1 && winTeam !== 2) return { rejected: "invalid" };

      pushHistory();
      if (winTeam === 1) state.t1Score += 1; else state.t2Score += 1;
      state.timeline.push(winTeam);

      const serverWon = winTeam === state.servTeam;
      // Doubles rally rule: serving-side partners swap courts only when the
      // serving side wins the rally.
      if (serverWon && state.match.doubles) swapPositions(winTeam);
      state.servTeam = winTeam;

      const events = { scored: true };
      const maxScore = Math.max(state.t1Score, state.t2Score);
      const switchPoint = Math.ceil(state.match.targetScore / 2);
      if (maxScore === switchPoint && !state.halfSwitched) {
        state.halfSwitched = true;
        // Mirror Legacy L1051: switching ends flips the referee's on-screen view
        // so the team that walked to the opposite end renders on the other side.
        state.viewSwapped = !state.viewSwapped;
        events.sideSwitch = true;
      }
      if (isGameWon()) {
        state.gameEnded = true;
        events.gameWon = true;
      }
      return events;
    }

    // Read-only layout for the on-court position view. Returns each team's
    // left/right court player names plus the current serving player, so the UI
    // can render the four court slots and highlight the server.
    function courtLayout() {
      const serving = servingInfo();
      return {
        t1: { left: state.teams.t1.l, right: state.teams.t1.r },
        t2: { left: state.teams.t2.l, right: state.teams.t2.r },
        servingTeam: serving.team,
        servingPlayer: serving.player,
        servingCourt: serving.court,
        viewSwapped: state.viewSwapped
      };
    }

    function toggleView() {
      state.viewSwapped = !state.viewSwapped;
      return state.viewSwapped;
    }

    function undo() {
      const last = state.history.pop();
      if (!last) return false;
      const history = state.history;
      state = clone(last);
      state.history = history;
      return true;
    }

    function requestTimeout(team) {
      if (state.gameEnded || state.matchEnded) return { ok: false, reason: "ended" };
      if (team !== 1 && team !== 2) return { ok: false, reason: "invalid" };
      const key = team === 1 ? "t1" : "t2";
      if (state.timeouts[key] >= 1) return { ok: false, reason: "quota" };
      pushHistory();
      state.timeouts[key] += 1;
      return { ok: true };
    }

    // Medical timeout quota is per match (design ED-05), not per game.
    function requestMedical(team) {
      if (state.matchEnded) return { ok: false, reason: "ended" };
      if (team !== 1 && team !== 2) return { ok: false, reason: "invalid" };
      const key = team === 1 ? "medicalT1" : "medicalT2";
      if (state.timeouts[key] >= 1) return { ok: false, reason: "quota" };
      pushHistory();
      state.timeouts[key] += 1;
      return { ok: true };
    }

    function finalScore() {
      return state.match.gameFormat === 1
        ? { score1: state.t1Score, score2: state.t2Score }
        : { score1: state.t1Wins, score2: state.t2Wins };
    }

    function endGame() {
      if (!state.gameEnded || state.matchEnded) return { ended: false };
      if (state.t1Score > state.t2Score) state.t1Wins += 1; else state.t2Wins += 1;
      state.results.push(`G${state.currentGame}: ${state.t1Score} - ${state.t2Score}`);
      state.history = [];

      const bestOfThree = state.match.gameFormat !== 1;
      if (!bestOfThree || state.t1Wins === 2 || state.t2Wins === 2) {
        state.matchEnded = true;
        return { ended: true, matchEnded: true, finalScore: finalScore() };
      }

      // Next game: reset per-game state; timeout quotas reset per game while
      // medical quotas persist for the whole match.
      state.currentGame += 1;
      state.t1Score = 0;
      state.t2Score = 0;
      state.timeline = [];
      state.halfSwitched = false;
      state.gameEnded = false;
      state.timeouts = {
        t1: 0, t2: 0,
        medicalT1: state.timeouts.medicalT1,
        medicalT2: state.timeouts.medicalT2
      };
      return { ended: true, matchEnded: false };
    }

    return {
      award,
      undo,
      requestTimeout,
      requestMedical,
      endGame,
      finalScore,
      servingInfo,
      courtLayout,
      toggleView,
      isGameEnded: () => state.gameEnded,
      isMatchEnded: () => state.matchEnded,
      winner: () => (state.t1Wins > state.t2Wins ? 1 : state.t2Wins > state.t1Wins ? 2 : 0),
      state: () => clone(state)
    };
  }

  function createBackup({ storage, key }) {
    return {
      save(state) {
        try { storage.setItem(key, JSON.stringify(state)); } catch { /* storage full or unavailable */ }
      },
      load() {
        try {
          const raw = storage.getItem(key);
          return raw ? JSON.parse(raw) : null;
        } catch { return null; }
      },
      clear() {
        try { storage.removeItem(key); } catch { /* ignore */ }
      }
    };
  }

  return { createRallyScoring, createBackup };
});
