"use strict";

const VERSION = "modern-field-test-rehearsal-v1";
const COUNTS = Object.freeze({ competitions: 1, pairs: 25, players: 50, matches: 60, courts: 6, referees: 6, rounds: 10 });
const COURTS = Object.freeze(Array.from({ length: COUNTS.courts }, (_, index) => `C${index + 1}`));
const REFEREES = Object.freeze(Array.from({ length: COUNTS.referees }, (_, index) => `synthetic-referee-${String(index + 1).padStart(2, "0")}`));

function buildFixture() {
  const players = Array.from({ length: COUNTS.players }, (_, index) => ({
    name: `Synthetic Player ${String(index + 1).padStart(2, "0")}`
  }));
  const pairs = Array.from({ length: COUNTS.pairs }, (_, index) => ({
    name: `${players[index * 2].name} & ${players[index * 2 + 1].name}`
  }));
  let matchIndex = 0;
  const rounds = Array.from({ length: COUNTS.rounds }, (_, roundIndex) => ({
    round: roundIndex + 1,
    matches: COURTS.map((court, courtIndex) => {
      const home = (roundIndex * COUNTS.courts + courtIndex) % COUNTS.pairs;
      const away = (home + COUNTS.pairs - (roundIndex + 1)) % COUNTS.pairs;
      const minuteOffset = roundIndex * 30;
      matchIndex += 1;
      return {
        fixtureKey: `match-${String(matchIndex).padStart(3, "0")}`,
        court,
        scheduledAt: `2026-08-20T${String(8 + Math.floor(minuteOffset / 60)).padStart(2, "0")}:${String(minuteOffset % 60).padStart(2, "0")}:00+08:00`,
        p1: players[home * 2].name,
        p2: players[home * 2 + 1].name,
        p3: players[away * 2].name,
        p4: players[away * 2 + 1].name,
        team1: pairs[home].name,
        team2: pairs[away].name
      };
    })
  }));
  return { version: VERSION, competition: { name: "Modern Field Test Synthetic Event", sport: "pickleball" }, referees: [...REFEREES], schedule: { mode: "fixed-pair", players, pairs, rounds } };
}

module.exports = { VERSION, COUNTS, COURTS, REFEREES, buildFixture };
