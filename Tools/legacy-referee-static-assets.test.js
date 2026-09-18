const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const html = fs.readFileSync(new URL('../Legacy/referee.html', `file://${__filename}`), 'utf8');

test('Legacy referee has no external runtime assets', () => {
  const resourceAttributes = [...html.matchAll(/\b(?:src|href|poster|manifest)\s*=\s*(["'])(.*?)\1/gi)]
    .map(match => match[2]);
  const cssUrls = [...html.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)]
    .map(match => match[2]);
  const externalResources = [...resourceAttributes, ...cssUrls]
    .filter(value => /^https?:\/\//i.test(value));

  assert.deepEqual(externalResources, []);
  assert.doesNotMatch(html, /cdn\.tailwindcss\.com/i);
  assert.doesNotMatch(html, /fonts\.(?:googleapis|gstatic)\.com/i);
});

test('Legacy referee embeds generated visibility and layout utilities', () => {
  const start = html.indexOf('/* BEGIN GENERATED TAILWIND CSS - DO NOT EDIT */');
  const end = html.indexOf('/* END GENERATED TAILWIND CSS */');
  assert.ok(start >= 0 && end > start, 'generated CSS markers must be present');

  const css = html.slice(start, end);
  assert.match(css, /\.hidden\{display:none\}/);
  assert.match(css, /\.fixed\{position:fixed\}/);
  assert.match(css, /\.grid\{display:grid\}/);
  assert.match(css, /\.flex\{display:flex\}/);
  assert.match(css, /\.touch-none\{touch-action:none\}/);
});
