#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const dotenv = require("dotenv");
const { validateDataSafety } = require("./data-safety");

const directory = __dirname;
const envPath = path.join(directory, ".env");
const environment = { ...(fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {}), ...process.env };
if (!environment.BUILD_ID || environment.BUILD_ID === "local-field-test") {
  const git = spawnSync("git", ["rev-parse", "HEAD"], { cwd: path.resolve(directory, "../../.."), encoding: "utf8" });
  if (git.status !== 0 || !/^[0-9a-f]{40}\n?$/.test(git.stdout || "")) { console.error("field-test rehearsal rejected: a build/commit identity is required"); process.exit(1); }
  environment.BUILD_ID = git.stdout.trim();
}
try { validateDataSafety(environment); } catch (error) { console.error(`field-test rehearsal rejected: ${error.message}`); process.exit(1); }
if (process.argv.includes("--prepare-only")) { console.log(`rehearsal preparation allowed for ${environment.TOP_ENVIRONMENT_ID}`); process.exit(0); }
fs.mkdirSync(path.join(directory, "evidence"), { recursive: true });
fs.chmodSync(path.join(directory, "evidence"), 0o777); // app runs as the non-root `node` user; manifest itself is mode 0600
const args = ["compose", "--project-directory", directory, "--env-file", envPath, "-f", path.join(directory, "compose.yaml"), "exec", "-T", "app", "node", "rehearsal/full-scale-rehearsal.js"];
const result = spawnSync("docker", args, { cwd: directory, stdio: "inherit", env: environment });
if (result.error || result.status !== 0) { console.error("field-test rehearsal failed; inspect the sanitized evidence manifest"); process.exit(result.status || 1); }
