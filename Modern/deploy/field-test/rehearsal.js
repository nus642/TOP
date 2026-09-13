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
try { validateDataSafety(environment); } catch (error) { console.error(`field-test rehearsal rejected: ${error.message}`); process.exit(1); }
if (process.argv.includes("--prepare-only")) { console.log(`rehearsal preparation allowed for ${environment.TOP_ENVIRONMENT_ID}`); process.exit(0); }
fs.mkdirSync(path.join(directory, "evidence"), { recursive: true });
fs.chmodSync(path.join(directory, "evidence"), 0o777); // app runs as the non-root `node` user; manifest itself is mode 0600
const args = ["compose", "--project-directory", directory, "--env-file", envPath, "-f", path.join(directory, "compose.yaml"), "exec", "-T", "app", "node", "rehearsal/full-scale-rehearsal.js"];
// BUILD_ID is deliberately not passed with `exec -e`: the rehearsal reads
// the identity embedded in the running image at /app/.build-id.
const result = spawnSync("docker", args, { cwd: directory, stdio: "inherit", env: environment });
if (result.error || result.status !== 0) { console.error("field-test rehearsal failed; inspect the sanitized evidence manifest"); process.exit(result.status || 1); }
