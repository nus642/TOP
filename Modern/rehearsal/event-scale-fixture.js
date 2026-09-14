"use strict";

const VERSION = "modern-event-scale-rehearsal-2026-09-12-v1";
const COUNTS = Object.freeze({ competitions: 1, pairs: 40, players: 80, matches: 156, courts: 8, referees: 10, rounds: 20 });
const COURTS = Object.freeze(Array.from({ length: COUNTS.courts }, (_, index) => `C${index + 1}`));
const REFEREES = Object.freeze(Array.from({ length: COUNTS.referees }, (_, index) => `synthetic-referee-${String(index + 1).padStart(2, "0")}`));

function buildFixture() {
  const players = Array.from({ length: COUNTS.players }, (_, index) => ({ name: `Event Scale Player ${String(index + 1).padStart(2, "0")}` }));
  const pairs = Array.from({ length: COUNTS.pairs }, (_, index) => ({ name: `${players[index * 2].name} & ${players[index * 2 + 1].name}` }));
  let sequence = 0;
  const rounds = Array.from({ length: COUNTS.rounds }, (_, roundIndex) => {
    const matchesThisRound = Math.min(COUNTS.courts, COUNTS.matches - sequence);
    const matches = COURTS.slice(0, matchesThisRound).map((court, courtIndex) => {
      // Draw each round from two disjoint eight-pair blocks so a pair (and
      // therefore either of its players) can never occupy two courts at once.
      const home = (roundIndex * 16 + courtIndex) % COUNTS.pairs;
      const away = (roundIndex * 16 + COUNTS.courts + courtIndex) % COUNTS.pairs;
      const minuteOffset = roundIndex * 30;
      sequence += 1;
      return {
        fixtureKey: `event-match-${String(sequence).padStart(3, "0")}`,
        court,
        scheduledAt: `2026-09-12T${String(8 + Math.floor(minuteOffset / 60)).padStart(2, "0")}:${String(minuteOffset % 60).padStart(2, "0")}:00+08:00`,
        p1: players[home * 2].name, p2: players[home * 2 + 1].name,
        p3: players[away * 2].name, p4: players[away * 2 + 1].name,
        team1: pairs[home].name, team2: pairs[away].name
      };
    });
    return { round: roundIndex + 1, matches };
  });
  return { version: VERSION, competition: { name: "Modern Event Scale Synthetic Rehearsal", sport: "pickleball" }, referees: [...REFEREES], schedule: { mode: "fixed-pair", players, pairs, rounds } };
}

module.exports = { VERSION, COUNTS, COURTS, REFEREES, buildFixture };
