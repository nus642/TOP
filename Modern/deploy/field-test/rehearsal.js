#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const path = require("node:path");

const composeFile = path.join(__dirname, "compose.yaml");
const args = ["compose", "-f", composeFile, "exec", "-T", "app", "node", "rehearsal/full-scale-rehearsal.js"];
if (process.argv.includes("--verify")) args.push("--verify");

// Deliberately do not derive BUILD_ID from the checkout and do not pass an
// environment override to `compose exec`. The rehearsal reads /app/.build-id,
// which was created in the image build layer.
execFileSync("docker", args, { stdio: "inherit" });
