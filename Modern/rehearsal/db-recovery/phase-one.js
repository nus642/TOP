"use strict";
const assert = require("node:assert/strict");
function assertRestoreGateEvidence(evidence) {
  assert.equal(evidence?.run?.phase, "restore-gate", "run has not completed the Phase 1 failure proof");
  assert.equal(evidence?.postBackupDelta?.allObservedDifferencesAccountedFor, true, "run lacks computed post-backup delta accounting");
  const failure = evidence?.failureObserved;
  assert.ok(failure, "failure observation evidence is missing");
  assert.equal(failure.pausedExactId, true);
  assert.equal(failure.verifyFailedOrTimedOut, true);
  assert.equal(failure.authenticatedDbReadSucceededBeforePause, true);
  assert.equal(failure.dbBackedReadFailedOrTimedOut, true);
  assert.equal(failure.writesIssued, false);
  assert.equal(failure.postDeltaReverifiedAfterUnpause, true);
  const watchdog = evidence?.watchdog;
  assert.ok(watchdog, "watchdog evidence is missing");
  assert.equal(watchdog.armed, true);
  assert.equal(watchdog.explicitUnpauseHealthy, true);
  assert.equal(watchdog.normalPathDisarmed, true);
  assert.equal(watchdog.containerId, evidence.databaseIdentity.containerId);
  assert.equal(watchdog.dockerAccessMode, evidence.environment.dockerAccessMode);
  return true;
}
module.exports = { assertRestoreGateEvidence };
