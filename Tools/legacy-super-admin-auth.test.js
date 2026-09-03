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

function authFunction(file) {
  const match = source(file).match(/function is_super_admin_authorized\(\$provided\) \{[\s\S]*?\n\}/);
  assert.ok(match, `${file} must define the super-admin authorization helper`);
  return match[0];
}

function authorize(file, configured, provided) {
  const script = `${authFunction(file)}\necho is_super_admin_authorized($argv[1]) ? 'authorized' : 'denied';`;
  const env = { ...process.env };
  if (configured === undefined) delete env.SUPER_ADMIN_PWD;
  else env.SUPER_ADMIN_PWD = configured;
  return execFileSync('php', ['-r', script, provided], { env, encoding: 'utf8' });
}

describe('Legacy super-admin credential configuration', () => {
  for (const file of SOURCES) {
    it(`${file}: reads the credential only from the environment`, () => {
      const php = source(file);
      assert.match(php, /getenv\('SUPER_ADMIN_PWD'\)/);
      assert.doesNotMatch(php, /\$SUPER_ADMIN_PWD\s*=\s*['"][^'"]+['"]/);
    });

    it(`${file}: correct credential succeeds and incorrect credential fails`, () => {
      assert.equal(authorize(file, 'test-secret-value', 'test-secret-value'), 'authorized');
      assert.equal(authorize(file, 'test-secret-value', 'incorrect-value'), 'denied');
    });

    it(`${file}: missing or empty environment credential fails closed`, () => {
      assert.equal(authorize(file, undefined, ''), 'denied');
      assert.equal(authorize(file, '', ''), 'denied');
    });

    it(`${file}: preserves super_pwd for protected action requests`, () => {
      const php = source(file);
      for (const action of ['create_event', 'super_admin_get_events', 'super_admin_delete_event']) {
        const start = php.indexOf(`$action === '${action}'`);
        assert.notEqual(start, -1, `${action} must remain implemented`);
        assert.match(php.slice(start, start + 500), /is_super_admin_authorized\(\$req\['super_pwd'\]/);
      }
    });
  }
});
