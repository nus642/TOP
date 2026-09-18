const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repositoryRoot = path.resolve(__dirname, '..');
const expectedFiles = [
  'VERSION.txt',
  '01_Offline-Referee/index.html',
  '01_Offline-Referee/README.txt',
  '02_Emergency-Web/README.txt',
  '03_Recovery/README.txt',
];

const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'top-master-field-kit-'));
const kitRoot = path.join(temporaryRoot, 'master-field-kit');

test.before(() => {
  execFileSync(process.execPath, ['Tools/build-master-field-kit.js', '--output', kitRoot], {
    cwd: repositoryRoot,
    env: { ...process.env, SOURCE_DATE_EPOCH: '1789689600' },
  });
});

test.after(() => fs.rmSync(temporaryRoot, { recursive: true, force: true }));

test('generates exactly the expected operational files', () => {
  const files = [];
  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else files.push(path.relative(kitRoot, absolute).split(path.sep).join('/'));
    }
  }
  visit(kitRoot);
  assert.deepEqual(files.sort(), expectedFiles.slice().sort());
});

test('copies the authoritative referee byte for byte without a second implementation', () => {
  const source = fs.readFileSync(path.join(repositoryRoot, 'Legacy/referee.html'));
  const packaged = fs.readFileSync(path.join(kitRoot, '01_Offline-Referee/index.html'));
  assert.deepEqual(packaged, source);
  assert.equal(expectedFiles.filter(file => file.endsWith('.html')).length, 1);
});

test('records Git source traceability and the field-verified baseline', () => {
  const version = fs.readFileSync(path.join(kitRoot, 'VERSION.txt'), 'utf8');
  const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repositoryRoot, encoding: 'utf8' }).trim();
  assert.match(version, new RegExp(`source Git commit: ${commit}`));
  assert.match(version, /Offline Referee authoritative source: Legacy\/referee\.html/);
  assert.match(version, /field-verified baseline: 84d5353 \/ 2026-09-18/);
});

test('documents the field-verified Windows localhost procedure', () => {
  const readme = fs.readFileSync(path.join(kitRoot, '01_Offline-Referee/README.txt'), 'utf8');
  assert.match(readme, /cd 01_Offline-Referee/);
  assert.match(readme, /python -m http\.server 8088/);
  assert.match(readme, /http:\/\/localhost:8088\//);
  assert.match(readme, /明确选择“离线应急模式”/);
});

test('packaged referee has no external HTTP(S) runtime resources', () => {
  const html = fs.readFileSync(path.join(kitRoot, '01_Offline-Referee/index.html'), 'utf8');
  const attributes = [...html.matchAll(/\b(?:src|href|poster|manifest)\s*=\s*(["'])(.*?)\1/gi)]
    .map(match => match[2]);
  const cssUrls = [...html.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)]
    .map(match => match[2]);
  assert.deepEqual([...attributes, ...cssUrls].filter(value => /^https?:\/\//i.test(value)), []);
});
