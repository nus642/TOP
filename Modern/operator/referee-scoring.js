(function expose(factory) {
  const scoring = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = scoring;
  if (typeof window !== "undefined") window.RefereeScoring = scoring;
})(function createModule() {
  // Point-by-point live scoring for the referee workbench.
  // The per-rally state lives on the referee terminal (mirrors the legacy
  // terminal behavior); only the final score is submitted to the backend.

  const DEFAULT_TARGET = 21;
  const DEFAULT_CAP = 21;
  const BACKUP_PREFIX = "top_referee_scoring_backup:";

  function createState({ target = DEFAULT_TARGET, cap = DEFAULT_CAP } = {}) {
    return {
      t1Score: 0,
      t2Score: 0,
      timeline: [],
      history: [],
      target: Number(target) || DEFAULT_TARGET,
      cap: Number(cap) || DEFAULT_CAP,
      over: false
    };
  }

  // Game point: reach target with 2-point lead, or hard cap reached.
  function isGameOver(state) {
    const max = Math.max(state.t1Score, state.t2Score);
    const diff = Math.abs(state.t1Score - state.t2Score);
    return (max >= state.target && diff >= 2) || (state.cap > 0 && max >= state.cap);
  }

  function award(state, winningTeam) {
    if (state.over || (winningTeam !== 1 && winningTeam !== 2)) return state;
    state.history.push({ t1Score: state.t1Score, t2Score: state.t2Score });
    state.timeline.push(winningTeam);
    if (winningTeam === 1) state.t1Score += 1; else state.t2Score += 1;
    state.over = isGameOver(state);
    return state;
  }

  function undo(state) {
    const last = state.history.pop();
    if (!last) return state;
    state.timeline.pop();
    state.t1Score = last.t1Score;
    state.t2Score = last.t2Score;
    state.over = false;
    return state;
  }

  function serialize(state) {
    return JSON.stringify({
      t1Score: state.t1Score, t2Score: state.t2Score, timeline: state.timeline,
      history: state.history, target: state.target, cap: state.cap, over: state.over
    });
  }

  function restore(raw) {
    try {
      const data = JSON.parse(raw);
      if (!data || typeof data.t1Score !== "number" || typeof data.t2Score !== "number") return null;
      const state = createState({ target: data.target, cap: data.cap });
      state.t1Score = data.t1Score;
      state.t2Score = data.t2Score;
      state.timeline = Array.isArray(data.timeline) ? data.timeline : [];
      state.history = Array.isArray(data.history) ? data.history : [];
      state.over = isGameOver(state);
      return state;
    } catch {
      return null;
    }
  }

  // ---- Panel controller -------------------------------------------------
  // Hydrates `.live-scoring` placeholders rendered by the referee app and
  // keeps per-match state in localStorage so an accidental refresh does not
  // lose an in-progress game.

  function backupKey(matchId) {
    return `${BACKUP_PREFIX}${matchId}`;
  }

  function panelHtml({ matchId, team1, team2 }) {
    return `<div class="live-scoring" data-match-id="${matchId}" data-team1="${team1}" data-team2="${team2}">
      <div class="scoreboard">
        <div class="scoring-team"><span class="team-name">${team1}</span><strong class="team-score">0</strong></div>
        <div class="scoring-vs">VS</div>
        <div class="scoring-team"><span class="team-name">${team2}</span><strong class="team-score">0</strong></div>
      </div>
      <div class="scoring-controls">
        <button type="button" class="point-btn t1" data-scoring="point" data-team="1">${team1} 得分 +1</button>
        <button type="button" class="point-btn t2" data-scoring="point" data-team="2">${team2} 得分 +1</button>
      </div>
      <div class="scoring-tools">
        <button type="button" class="undo-btn" data-scoring="undo" disabled>↩ 撤回上一回合</button>
        <span class="scoring-rally">共 0 球</span>
      </div>
      <details class="scoring-settings">
        <summary>对局设置</summary>
        <div class="settings-grid">
          <label>目标分 <input data-scoring-input="target" type="number" min="1" value="${DEFAULT_TARGET}"></label>
          <label>封顶分 <input data-scoring-input="cap" type="number" min="0" value="${DEFAULT_CAP}"></label>
        </div>
      </details>
      <div class="game-over" hidden>
        <p class="complete game-over-text"></p>
        <button type="button" class="confirm" data-scoring="submit">结算该局并提交赛果</button>
      </div>
    </div>`;
  }

  function mount(container, { storage, onSubmit }) {
    const store = storage || (typeof localStorage !== "undefined" ? localStorage : null);
    const panels = new Map();

    function persist(matchId, state) {
      if (!store) return;
      try { store.setItem(backupKey(matchId), serialize(state)); } catch { /* best effort */ }
    }

    function render(panel, state) {
      const teams = panel.querySelectorAll(".team-score");
      teams[0].textContent = state.t1Score;
      teams[1].textContent = state.t2Score;
      panel.querySelector(".scoring-rally").textContent = `共 ${state.timeline.length} 球`;
      panel.querySelector('[data-scoring="undo"]').disabled = state.history.length === 0;
      const gameOver = panel.querySelector(".game-over");
      gameOver.hidden = !state.over;
      if (state.over) {
        panel.querySelector(".game-over-text").textContent =
          `局点达成：${state.t1Score} - ${state.t2Score}，请确认后提交赛果`;
        panel.querySelectorAll(".point-btn").forEach((btn) => { btn.disabled = true; });
      } else {
        panel.querySelectorAll(".point-btn").forEach((btn) => { btn.disabled = false; });
      }
    }

    function loadState(matchId) {
      if (store) {
        const restored = restore(store.getItem(backupKey(matchId)));
        if (restored) return restored;
      }
      return createState();
    }

    container.querySelectorAll(".live-scoring").forEach((panel) => {
      const matchId = panel.dataset.matchId;
      const state = loadState(matchId);
      panels.set(matchId, { panel, state });

      const targetInput = panel.querySelector('[data-scoring-input="target"]');
      const capInput = panel.querySelector('[data-scoring-input="cap"]');
      targetInput.value = state.target;
      capInput.value = state.cap;
      targetInput.addEventListener("change", () => {
        state.target = Number(targetInput.value) || DEFAULT_TARGET;
        state.over = isGameOver(state);
        persist(matchId, state); render(panel, state);
      });
      capInput.addEventListener("change", () => {
        state.cap = Number(capInput.value) || 0;
        state.over = isGameOver(state);
        persist(matchId, state); render(panel, state);
      });

      panel.addEventListener("click", (event) => {
        const button = event.target.closest("[data-scoring]");
        if (!button) return;
        const action = button.dataset.scoring;
        if (action === "point") {
          award(state, Number(button.dataset.team));
          persist(matchId, state); render(panel, state);
        } else if (action === "undo") {
          undo(state);
          persist(matchId, state); render(panel, state);
        } else if (action === "submit") {
          button.disabled = true;
          Promise.resolve(onSubmit({
            matchId,
            score: { score1: state.t1Score, score2: state.t2Score }
          })).then((ok) => {
            if (ok === false) {
              button.disabled = false;
              return;
            }
            if (store) { try { store.removeItem(backupKey(matchId)); } catch { /* ignore */ } }
          }).catch(() => { button.disabled = false; });
        }
      });

      render(panel, state);
    });

    return panels;
  }

  return {
    DEFAULT_TARGET, DEFAULT_CAP, BACKUP_PREFIX,
    createState, isGameOver, award, undo, serialize, restore,
    panelHtml, mount, backupKey
  };
});
