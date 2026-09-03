const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SOURCES = [
  'Legacy/data.php',
  'Deploy-WechatCloud/Dockerfile-0703/data.php',
];

function source(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function parserFunction(file) {
  const match = source(file).match(/function parse_live_score\(\$score\) \{[\s\S]*?\n\}/);
  assert.ok(match, `${file} must define the live-score parser`);
  return match[0];
}

function parse(file, score) {
  const script = `${parserFunction(file)}\necho json_encode(parse_live_score($argv[1]));`;
  return JSON.parse(execFileSync('php', ['-r', script, score], { encoding: 'utf8' }));
}

describe('Legacy live scoreboard score parsing', () => {
  for (const file of SOURCES) {
    it(`${file}: parses game-prefixed scores without merging the game number`, () => {
      assert.deepEqual(parse(file, 'G1 5-3'), [5, 3]);
      assert.deepEqual(parse(file, 'G2 11-8'), [11, 8]);
    });

    it(`${file}: preserves unprefixed score parsing`, () => {
      assert.deepEqual(parse(file, '21-15'), [21, 15]);
      assert.deepEqual(parse(file, '0-0'), [0, 0]);
    });

    it(`${file}: parses the full score text emitted by referee.html`, () => {
      assert.deepEqual(parse(file, '局分 1:0 | G2 11-8 [发球: t1 第2发]'), [11, 8]);
    });

    it(`${file}: keeps the get_live_scoreboard response contract`, () => {
      const scoreboard = source(file).match(/case 'get_live_scoreboard':[\s\S]*?case 'referee_login':/);
      assert.ok(scoreboard, `${file} must implement get_live_scoreboard`);
      for (const field of ['t1_score', 't2_score', 't1_games', 't2_games', 't1_sets', 't2_sets']) {
        assert.match(scoreboard[0], new RegExp(`'${field}'\\s*=>`));
      }
    });
  }
});
