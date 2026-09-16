# Evidence Record: Reviewed operational scope boundary

| Field | Value |
|---|---|
| Evidence Record ID | `ER-806546e0e9e5-02-01` |
| Subject | Candidate operational scope boundary |
| Review question | What operational scope is explicitly included and excluded for this candidate? |
| Status | **PROVEN** |

## Candidate full SHA

`806546e0e9e5c7bd22826294ef657746ce32f5c0`

## Evidence

| Artifact reference | Precise locator | Finding |
|---|---|---|
| `Modern/deploy/field-test/README.md` | Opening boundary and `Safety boundary`, lines 1–11 | The operational environment is the isolated Modern Field Test v1 Compose project: one application container, one dedicated database container, loopback-only application access, no database host port, synthetic records only, and dedicated database identity, credentials, and volume. The artifact explicitly says the project is not production-eligible and excludes Legacy credentials or data, real participant data, PM2, host Node/MySQL, and Kubernetes. |
| `Modern/deploy/field-test/README.md` | `DB failure / restore continuity (source-review commands)`, lines 98–108 and 139–146 | The candidate's included recovery course is the run-specific, two-command database failure/restore rehearsal. It establishes a five-match Recovery Point, accounts for a post-backup delta, performs a bounded exact-container pause/unpause, restores the exact recorded artifact after an explicit destructive gate, proves exact snapshot recovery, and resumes with fresh sessions. It never resets automatically or selects a backup by `latest` or wildcard. |
| `Modern/deploy/field-test/README.md` | Manual prerequisite and JSON-stability boundaries, lines 110–137 | The watchdog proof is a separate, manual, two-session Lighthouse prerequisite and is limited to exact-container unpause; it creates no backup, restores no data, and performs no competition mutation. The JSON-stability proof is disposable and isolated from both the Field Test stack and Legacy. |
| `Modern/deploy/field-test/README.md` | Deferred operational claims, lines 88–96 | Source-level tests are not real Lighthouse or real-MySQL recovery evidence. Real-device/browser evidence, Lighthouse/Nginx/HTTPS deployment, UI watermarking, real participant data, production cutover, and production eligibility are explicitly deferred. |
| `Docs/01_Architecture/D-03-DR-Runtime-Ownership-Decision.md` | `Decision` D3–D4, lines 39–43; `Team-event Exception` T1, T3, and T5, lines 313–331 | Modern cannot run a real event before G1–G6 close with committed evidence; individual-event and team-event readiness are separate. Team-event migration remains a separately scoped program, team-event runtime remains on Legacy until its cutover condition, and team-event cutover requires a distinct team-scale rehearsal. The candidate's Field Test recovery course therefore does not expand Team Event scope. |

## Determination

**PROVEN.** The authoritative deployment artifact explicitly bounds this
candidate to an isolated, synthetic-data Modern Field Test v1 database
failure/restore continuity rehearsal and its narrowly defined prerequisites.
The included course covers creation and verification of a recovery point,
bounded database interruption, exact-artifact restore, exact snapshot
comparison, and post-restore continuation with fresh sessions.

The same artifact explicitly excludes production eligibility and cutover,
real participant data, real-device/browser validation, Lighthouse/Nginx/HTTPS
deployment evidence, and infrastructure outside the dedicated Compose
boundary. D-03 independently keeps real-event use behind G1–G6 and keeps Team
Event migration and rehearsal in a separate scope. Nothing in this candidate
changes those boundaries.

## Limitations

This record proves only that the included and excluded operational scope is
explicitly documented. It does not prove that a Lighthouse rehearsal was run,
that recovery evidence was produced or accepted, that any D-03 gate is closed,
or that the candidate has individual-event or Team Event eligibility. It makes
no production-readiness or release claim.
