#!/usr/bin/env node

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const TAILWIND_VERSION = '3.4.17';
const START = '/* BEGIN GENERATED TAILWIND CSS - DO NOT EDIT */';
const END = '/* END GENERATED TAILWIND CSS */';
const repositoryRoot = path.resolve(__dirname, '..');
const refereePath = path.join(repositoryRoot, 'Legacy', 'referee.html');
const checkOnly = process.argv.includes('--check');

function replaceGeneratedCss(html, css) {
  const start = html.indexOf(START);
  const end = html.indexOf(END);
  if (start < 0 || end < start) throw new Error('Generated Tailwind CSS markers are missing');
  return `${html.slice(0, start + START.length)}\n${css.trim()}\n    ${html.slice(end)}`;
}

const original = fs.readFileSync(refereePath, 'utf8');
const contentHtml = replaceGeneratedCss(original, '');
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-referee-css-'));

try {
  const inputPath = path.join(temporaryDirectory, 'tailwind.css');
  const contentPath = path.join(temporaryDirectory, 'referee.html');
  const outputPath = path.join(temporaryDirectory, 'tailwind.min.css');
  fs.writeFileSync(inputPath, '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
  fs.writeFileSync(contentPath, contentHtml);

  const executable = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execFileSync(executable, [
    '--yes', `tailwindcss@${TAILWIND_VERSION}`,
    '--input', inputPath,
    '--output', outputPath,
    '--content', contentPath,
    '--minify',
  ], { cwd: repositoryRoot, stdio: 'inherit' });

  const generated = fs.readFileSync(outputPath, 'utf8')
    .replace(/\/\*! tailwindcss v[^*]+\*\//, '');
  const updated = replaceGeneratedCss(original, generated);
  if (checkOnly) {
    if (updated !== original) {
      console.error('Legacy/referee.html has stale generated Tailwind CSS.');
      process.exitCode = 1;
    }
  } else {
    fs.writeFileSync(refereePath, updated);
    console.log(`Embedded Tailwind CSS ${TAILWIND_VERSION} in Legacy/referee.html`);
  }
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
