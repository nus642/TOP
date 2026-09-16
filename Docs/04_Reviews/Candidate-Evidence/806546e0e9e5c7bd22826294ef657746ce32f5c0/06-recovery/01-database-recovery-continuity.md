# Evidence Record: Database recovery continuity

| Field | Value |
|---|---|
| Evidence Record ID | `ER-806546e0e9e5-06-01` |
| Subject | Database recovery-point restoration and operational continuation |
| Review question | Within the Modern Field Test v1 candidate boundary, did the database recovery rehearsal restore the declared recovery point and demonstrate operational continuation? |
| Status | **PROVEN** |

## Candidate full SHA

`806546e0e9e5c7bd22826294ef657746ce32f5c0`

## Claim

Within the reviewed Modern Field Test v1 rehearsal, run `db-recovery-010`
restored the declared recovery point exactly and then demonstrated operational
continuation through fresh authenticated sessions, completion of the in-flight
match, release and reuse of its resources, and completion of the next match.

## Boundary

- Modern Online individual round-robin Field Test v1 lineage.

## Artifact references

| Artifact name | Locator | What claim it supports |
|---|---|---|
| `db-recovery-010` manifest | Rehearsal host checkout: `Modern/deploy/field-test/evidence/db-recovery/db-recovery-010/manifest.json`; identity and completion fields at JSON members `run`, `environment`, `artifactIdentity`, `databaseIdentity`, `restoreCompleted`, `finalIntegrity`, and `summary` | Identifies the run, Modern Field Test v1 environment, candidate artifact, and database container; records use of the existing restore path; and records a completed, passing run after final integrity verification. |
| Watchdog evidence | Rehearsal host checkout: `Modern/deploy/field-test/evidence/db-recovery/db-recovery-010/watchdog.jsonl` | Supports that the exact recorded database container was protected by the bounded watchdog during the failure observation and was explicitly returned to a healthy state. The manifest's `failureObserved` and `watchdog` members bind those observations to this run. |
| Backup identity information | `Modern/deploy/field-test/evidence/db-recovery/db-recovery-010/manifest.json`, JSON member `backupIdentity` (`path`, `sha256`, `size`, and `marker`) | Binds the restore input to the exact backup path and recorded artifact identity used by `db-recovery-010`; the artifact content is not duplicated here. |
| Recovery point binding information | `Modern/deploy/field-test/evidence/db-recovery/db-recovery-010/manifest.json`, JSON members `recoveryPoint`, `recoveryPointBinding`, `postBackupDelta`, `recoveredState`, and `expectedRpoLoss`; post-unpause snapshot at `Modern/deploy/field-test/evidence/db-recovery/db-recovery-010/post-unpause.json` | Supports that the declared recovery point was bound before the accounted post-backup mutation epoch, remained stable through the bounded interruption, and matched the recovered authoritative snapshot exactly. It also supports classification of the accounted post-backup facts as expected RPO loss rather than corruption. |
| Continuation validation evidence | `Modern/deploy/field-test/evidence/db-recovery/db-recovery-010/manifest.json`, JSON members `operationalContinuation`, `finalIntegrity`, and `summary` | Supports that fresh sessions completed the recovery-point in-flight match, released and reused its resources, completed the next match, and passed final integrity verification. |

## Runtime evidence retention

The artifacts above are runtime rehearsal evidence retained outside source
control in the rehearsal host checkout under
`Modern/deploy/field-test/evidence/db-recovery/db-recovery-010/`. This is the
run-specific private evidence directory and is the location at which the
artifacts were reviewed. This Evidence Record references those authoritative
artifacts and does not reproduce their contents or raw recovery logs.

No separately governed external archive location for `db-recovery-010` is
identified by the reviewed repository documentation. Consequently, this
record does not establish retention or availability after the rehearsal host
checkout is removed.

## Verification method

1. Confirm the manifest identifies run `db-recovery-010`, the Modern Field Test
   v1 scope, the candidate artifact, the database identity, and a completed run
   with a passing summary.
2. Verify that the recorded backup path and digest are bound to this run and
   that restore completion records use of the existing restore path.
3. Compare the canonical `recoveryPoint` and `recoveredState.snapshot` values
   and require the manifest's exact-recovery assertion. Review the run-bound
   post-backup delta ledger to confirm that every observed difference is
   accounted for and classified as expected RPO loss, not corruption.
4. Inspect `operationalContinuation` for fresh sessions, completion of the
   in-flight recovery-point match, resource release and reuse, and completion
   of the next match; then require the final integrity check and passing run
   summary.
5. Cross-check the concrete run-directory artifacts and manifest members listed
   above for consistent database, container, artifact, and run identity. Raw
   recovery logs are not reproduced in this record.

## Determination

**PROVEN.** The authoritative `db-recovery-010` manifest and its related,
run-bound recovery evidence show an exact restoration of the declared recovery
point. They also show successful continuation after restore through fresh
sessions and further competition operations, followed by a passing final
integrity check. This answers the review question affirmatively within the
stated boundary.

## Limitations

This is rehearsal scope only. It does not prove production deployment
readiness. It does not close D-03 gates. Runtime evidence is not committed to
Git, and no separately governed external archive was identified; continued
artifact availability therefore depends on retention of the rehearsal host
checkout described above.
