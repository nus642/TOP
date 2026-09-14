"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { CLAIM, SINGLE_WRITER_ACK } = require("../rehearsal/db-recovery-rehearsal");

test("recovery evidence retains the approved scoped claim and acknowledgement", () => {
  assert.equal(CLAIM, "Recovery point bound to backup under the controlled single-writer synthetic rehearsal assumption.");
  assert.equal(SINGLE_WRITER_ACK, "CONTROLLED-SINGLE-WRITER-MODERN-FIELD-TEST-V1");
});

test("operator flow reuses backup/restore and preserves the run-specific restore gate", () => {
  const source = fs.readFileSync(path.join(__dirname, "../deploy/field-test/field-test"), "utf8");
  assert.match(source, /backup_output=\$\(\$0 backup\)/);
  assert.match(source, /"\$0" restore "\$backup_file"/);
  assert.match(source, /db-recovery-resume RUN_ID/);
  assert.match(source, /DESTROY-MODERN-FIELD-TEST-V1-DATA/);
  assert.doesNotMatch(source.match(/db-recovery-start\)[\s\S]*?;;/)[0], /\$0 reset/);
});

test("DB recovery evidence schema is committed JSON with all review phases", () => {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "../deploy/field-test/evidence/db-recovery-manifest.schema.json"), "utf8"));
  for (const phase of ["recoveryPoint", "postBackupDelta", "failureObserved", "restoreCompleted", "recoveredState", "expectedRpoLoss", "operationalContinuation", "finalIntegrity"]) {
    assert.ok(schema.required.includes(phase));
  }
});
