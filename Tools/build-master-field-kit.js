#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const repositoryRoot = path.resolve(__dirname, '..');
const authoritativeReferee = path.join(repositoryRoot, 'Legacy', 'referee.html');

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  if (!process.argv[index + 1]) throw new Error(`${name} requires a value`);
  return process.argv[index + 1];
}

function generationDate() {
  const sourceDateEpoch = process.env.SOURCE_DATE_EPOCH;
  const date = sourceDateEpoch === undefined
    ? new Date()
    : new Date(Number(sourceDateEpoch) * 1000);
  if (Number.isNaN(date.getTime())) throw new Error('SOURCE_DATE_EPOCH must be a Unix timestamp');
  return date.toISOString().slice(0, 10);
}

const outputRoot = path.resolve(
  repositoryRoot,
  argumentValue('--output') || 'dist/master-field-kit',
);
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
}).trim();

const offlineDirectory = path.join(outputRoot, '01_Offline-Referee');
const emergencyDirectory = path.join(outputRoot, '02_Emergency-Web');
const recoveryDirectory = path.join(outputRoot, '03_Recovery');

fs.rmSync(outputRoot, { recursive: true, force: true });
for (const directory of [offlineDirectory, emergencyDirectory, recoveryDirectory]) {
  fs.mkdirSync(directory, { recursive: true });
}

// This must remain a direct byte copy: Legacy/referee.html is the only implementation.
fs.copyFileSync(authoritativeReferee, path.join(offlineDirectory, 'index.html'));

fs.writeFileSync(path.join(outputRoot, 'VERSION.txt'), `TOP Master Field Kit
version: v0.1
source Git commit: ${sourceCommit}
build/generated date: ${generationDate()}
Offline Referee authoritative source: Legacy/referee.html
field-verified baseline: 84d5353 / 2026-09-18
status: Stage B Self-contained Offline Referee — FIELD VERIFIED PASS
`, 'utf8');

fs.writeFileSync(path.join(offlineDirectory, 'README.txt'), `TOP 离线裁判（v0.1）

用途：生产系统和互联网都不可用时，用本机浏览器完成现场比赛执裁。
无需互联网连接。

赛前启动：
1. 打开命令提示符，进入 Field Kit 的 01_Offline-Referee 文件夹：
   cd 01_Offline-Referee
2. 启动 localhost：
   python -m http.server 8088
3. 在同一台电脑的浏览器打开：
   http://localhost:8088/
4. 明确选择“离线应急模式”，填写本地赛事标识和裁判姓名，然后启动本地执裁。
5. 确认页面显示 OFFLINE 本地会话编号后再开始比赛。

裁判程序权威来源：Legacy/referee.html。本目录 index.html 由打包工具逐字节复制，不是另一套程序。

已知限制：这是 Stage B 离线执行基线，尚未完成 Stage C 灾难／恢复加固。
`, 'utf8');

fs.writeFileSync(path.join(emergencyDirectory, 'README.txt'), `TOP Emergency Web（v0.1）

适用条件：生产系统不可用，但互联网仍可用。
此时使用独立的 Emergency Web；访问地址由赛事负责人提供并确认。

Emergency Web 需要互联网，不是真正的 Offline Referee。
如果互联网不可用，请改用 01_Offline-Referee。
`, 'utf8');

fs.writeFileSync(path.join(recoveryDirectory, 'README.txt'), `TOP 现场选择（v0.1）

生产系统可用
→ 使用 Production

生产系统不可用，但互联网可用
→ 使用 Emergency Web

互联网不可用
→ 使用 Offline Referee
`, 'utf8');

process.stdout.write(`Master Field Kit v0.1 generated at ${outputRoot}\nSource Git commit: ${sourceCommit}\n`);
