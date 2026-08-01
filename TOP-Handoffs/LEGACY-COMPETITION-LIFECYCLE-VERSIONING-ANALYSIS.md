# Legacy Competition Lifecycle and Versioning Analysis

**Purpose:** Extract legacy evidence and identify unresolved business decisions around configuration change, generated-contest stability, supersession, regeneration, and historical traceability. This document defines boundaries and questions only; it does not design a replacement.

**Analysis date:** 2026-08-01

**Scope:** Competition Configuration, Contest Generation, Scheduling, Match Operations, Competition Result Recording, and the application-layer coordination needed when facts across those boundaries refer to the same contest.

---

## 1. Review basis and evidence limits

The requested review names `TASK-COMP-002-A1/` and `TASK-COMP-001/`, but neither directory exists in the current repository. This analysis therefore uses the repository's corresponding available evidence:

- `LEGACY-COMPETITION-CONFIGURATION-ANALYSIS.md` for the Competition Configuration analysis identified elsewhere as the available substitute for `TASK-COMP-002-A1`;
- `TASK-COMP-001-A1/`, `TASK-COMP-001-A2/`, `TASK-COMP-001-A3/`, and `TASK-COMP-001-FINAL-REVIEW/` for the `TASK-COMP-001` result-recording series;
- `TASK-COMP-003-A1/` for Contest Generation;
- `TASK-SCHED-001-A1/` for Scheduling;
- `TASK-OPS-001-A5/` for the Match Outcome Fact Boundary;
- `LEGACY-MATCH-GENERATION-ANALYSIS.md` for direct legacy generation evidence; and
- `CHECKPOINT.md` for the accepted project-level boundary summary.

The legacy analyses trace their observations primarily to `Legacy/master.html`, `Legacy/data.php`, and `Legacy/team_lineup.html`. This document does not reinterpret storage buckets, pages, buttons, status strings, or call order as future domain concepts.

### Interpretation rules

1. **Evidence before assumption.** A destructive legacy write proves that destruction was technically possible; it does not prove that destruction is the desired correction policy.
2. **A configuration fact and a contest generated from it are distinct facts.** Later configuration change does not silently rewrite an already-established contest.
3. **A shared legacy object does not imply shared ownership.** The legacy `tasks` bucket mixed contest, assignment, and execution data.
4. **Stable historical meaning is unresolved unless explicitly evidenced.** Technical IDs and current-value references are not automatically version identities.
5. **TOP is a domain fact system, not a workflow engine.** The analysis identifies coordination decisions without defining automated transitions or cascading updates.

---

## 2. Executive conclusions

1. The legacy application permits operators to change competition-relevant inputs: event mode, imported group/pairing material, the team template, prospective lineup selections, and manually entered contests. It does not preserve a coherent version identity for those inputs.
2. The strongest post-generation legacy behavior is destructive rather than historical. Associative writes can replace a task at the same normalized ID; rooms/tasks can be deleted; task buckets can be cleared. No preserved generation provenance, configuration version, cancellation fact, replacement link, or supersession chain is evidenced.
3. Regeneration is not a separately recorded domain action in legacy. Re-running generation or re-importing can add, collide with, replace, or duplicate technical records depending on IDs and paths, but the system cannot reliably say that one contest is a regeneration of another.
4. Scheduling references the contest represented by the mixed legacy task and adds or changes placement fields. Modern boundary work establishes that Scheduling should reference the generated contest without changing which contest exists and should preserve assignment/reassignment/unassignment history.
5. Match Operations consumes configured contest context but owns actual participants and execution facts. Configured sides or prospective player slots must not be overwritten to conceal a difference from what actually happened.
6. Official Competition Result Records reference the match/outcome, preserve their creation source, and are stable: corrections are additive rather than in-place. However, the reviewed material does not resolve how an official record retains the historical meaning of the exact contest/configuration version when upstream contest facts are later changed or superseded.
7. Versioning, cancellation, correction, regeneration, supersession, and traceability are business-governance gaps. The legacy mechanics must not be promoted into policy.

---

## 3. Configuration changes after contest generation

### 3.1 What legacy operators can change

| Configuration-relevant subject | Legacy evidence | Effect on generated contests | What is not evidenced |
|---|---|---|---|
| Competition mode | Master can change event `type` between individual and team; the value selects a different import/generation path. | A later mode change could make existing individual tasks or team rooms inconsistent with the current mode, but no reconciliation behavior is recorded. | Effective time, publication, approval, version identity, or automatic invalidation. |
| Groups and sides | Group membership and explicit `VS` pairings are imported; preview paths permit removal/editing before creation; manual paths can assert sides. | All-pairs generation depends on the group contents at the time it runs. Generated tasks retain side text/slots, not a durable reference to a versioned group definition. | Whether group or side edits are allowed after generation as a business rule; how affected contests are identified. |
| Match format | Generated tasks carry singles/doubles and game/scoring values, but many values are inferred or defaulted. Team lineup entries may supply per-rubber format, with the first side's value winning in the observed resolver. | The emitted task contains a value, but legacy evidence cannot always distinguish authoritative configuration from parser/default behavior. | Whether later format edits alter existing contests; whether a contest snapshots or references format. |
| Team template | Master can edit a shared ordered template of rubber disciplines/remarks. Lineup screens initialize from it, but generated tasks do not consistently retain its richer labels. | A constituent contest may reflect lineup array position and inferred type rather than the template that existed when the lineup began or generation occurred. | Template version, effective date, publication state, or a link from a generated rubber to the exact template revision. |
| Team lineups | Each team submits an ordered prospective lineup and per-rubber format; resolution pairs equal indexes and truncates to the shorter list. | Lineups can become generation inputs for constituent contests, but are not proof of actual participation. | Amendment rules, mutual compatibility rules, withdrawal/correction history, or whether a later submission replaces an earlier declaration. |
| Team rooms and manual contests | Master can create/delete rooms and manually create contests; a forced path creates placeholder rubbers. | These actions add or physically remove legacy containers/tasks. | Domain cancellation, voiding, replacement reason, approval, or preservation of the removed fact. |

### 3.2 Are formats, groups, sides, and templates editable?

The precise answer must distinguish **technical capability** from **approved business behavior**:

- **Formats:** technically supplied or inferred on generated tasks and editable through some input screens. No general post-generation edit rule or history is evidenced.
- **Groups:** imported group material can change before another generation/import. The reviewed evidence does not establish an authoritative post-generation group-amendment policy.
- **Sides:** preview/manual paths can change or assert pairings, and technical task records can be overwritten or deleted. This is not evidence that silently changing the identity of an existing contest is valid.
- **Templates:** the shared team template is editable, but generated constituent tasks do not retain a template-version identity. It is unknown whether edits are prospective only or should affect unresolved/existing encounters.

Accordingly, legacy proves edit surfaces and mutable storage, but not the business rule for when an edit takes effect.

### 3.3 Version identity and provenance

No coherent configuration version is preserved. The legacy record may contain current values, generated IDs, timestamps, group labels, room-code prefixes, or copied format fields, but none reliably identifies:

- the exact configuration revision applied;
- the authoritative source and actor behind that revision;
- when the revision became effective;
- whether a contest copied or dynamically referenced a configuration value;
- whether two superficially identical generations came from the same configuration; or
- whether later edits were intended as corrections, prospective changes, or replacements.

Generated IDs are especially weak evidence: they can depend on group labels, input order, counters, room codes, abbreviations, or timestamps. They provide addressability in a legacy path, not a stable sporting or version identity.

---

## 4. Generated contest stability

### 4.1 What generation establishes

Contest Generation establishes the prospective fact that a particular contest exists in a competition context, with configured sides and, when authoritative, composition/format. It does not establish scheduling, actual participation, execution, outcome, or official result.

Evidenced creation paths are:

1. deterministic all-pairs expansion within an already populated group;
2. import of an explicitly expressed individual or team `VS` pairing;
3. authorized manual contest creation;
4. team-encounter room creation;
5. resolution of prospective team lineups into constituent contests; and
6. forced placeholder constituent tasks as a permissive operator override.

These paths can produce similar technical task records without reliable provenance that distinguishes them.

### 4.2 Can generated contests be overwritten?

**Technically, yes. Semantically, legacy does not define what that means.** Tasks are stored under normalized associative keys, so a later write using the same key replaces the stored value. Bulk insertion merges task arrays. Rooms and tasks can also be deleted, and the task bucket can be cleared.

This behavior can erase or replace a mixed record containing contest, assignment, or execution context. It does not record whether the operator intended to:

- correct an erroneous field on the same contest;
- cancel a contest;
- withdraw a duplicate;
- replace one contest with another;
- regenerate from changed configuration; or
- discard operational test/data-entry material.

Therefore, overwrite and deletion are legacy persistence behavior, not an acceptable definition of contest lifecycle.

### 4.3 Cancellation, supersession, and regeneration

| Lifecycle concept | Legacy evidence | Boundary conclusion |
|---|---|---|
| Cancellation | A task/room can be physically deleted or all tasks cleared. No cancellation fact, reason, authority, or timestamp is preserved. | Cancellation governance is unresolved; deletion must not be treated as its definition. |
| Supersession | No explicit old-to-new relationship or current/superseded designation was found. | Supersession is not evidenced and requires a business decision. |
| Regeneration | Generation/import can be run again, but no generation run identity or relationship to prior output is preserved. | Legacy cannot reliably distinguish regeneration from new creation, duplication, collision, or overwrite. |
| Correction | Mutable storage and preview edits exist, but no contest correction fact/history exists. | Correction governance is unresolved; silent mutation loses meaning. |
| Stable contest identity | IDs exist but are path-dependent and can be collision/overwrite keys. | A business identity and reference policy remain unresolved. |

### 4.4 Lifecycle boundary

A generated contest should be treated as a fact separate from both its source configuration and any later replacement. This is a boundary conclusion, not a lifecycle design. The reviewed handoffs explicitly warn against destructive regeneration or deletion without correction, provenance, or supersession semantics, while deferring the policy itself.

No evidence supports turning `team_confirming`, room `completed`, pool visibility, scheduling, match start, or result recording into universal contest states. In particular, legacy room `completed` means lineup resolution/dispatch in the observed UI, not completion of sporting play.

---

## 5. Downstream references and historical meaning

### 5.1 Scheduling

Scheduling owns scheduled date/time, court assignment, referee assignment, queue/board placement when authoritative, and assignment history. It references the generated contest as the subject of those facts.

The legacy task object commonly colocates the pairing with date/court/referee values. The boundary analyses separate those meanings:

- changing a court, referee, date, or time does not change which contest exists;
- reassignment/unassignment should preserve Scheduling history rather than overwrite the earlier relationship;
- an operational pool is a projection of contests available for human planning, not a contest lifecycle state; and
- a later contest cancellation or supersession cannot be interpreted merely by deleting its schedule, because unassignment and nonexistence are different facts.

**Unresolved reference issue:** if a contest is replaced, Scheduling needs a business decision on whether earlier assignments remain attached to the historical contest, whether the replacement receives new assignments, and how operators distinguish the two. This analysis does not define cascading behavior.

### 5.2 Match Operations

Match Operations consumes contest configuration as context and owns:

- actual participants;
- start/execution timestamps and live state;
- scoring, games/sets, interruption, abandonment, walkover, and completion;
- outcome and confirmation facts; and
- signatures/evidence metadata.

Generated sides and prospective lineup player slots do not prove actual participation. If configured sides, lineup selections, discipline, or format differ from execution, the discrepancy must not be concealed by overwriting the generated input. The facts require explicit governance about correction and authority.

**Unresolved reference issue:** the reviewed handoffs do not say whether an execution context references a stable contest identity plus a configuration revision, snapshots selected contest configuration, or uses some other preservation rule. They establish the ownership distinction but not the historical reference policy.

### 5.3 Official Competition Result Records

Competition Result Recording owns the official record. The reviewed `TASK-COMP-001` series establishes that:

- a record references the match/outcome rather than recreating it;
- referee-confirmed and Master-entered paths both create official records;
- source type, actor/evidence, and creation time are preserved;
- records are stable and are not modified in place; and
- a future correction is additive and may reference/supersede a prior record.

The chosen result-recording direction is “reference with minimal snapshot,” but the reviewed material does not fully define the snapshot contents or resolve upstream contest versioning.

**Historical-meaning risk:** if a result references only a mutable contest or current configuration, a later side, group, template, or format change could alter how the historical result is interpreted. If it snapshots too much without provenance, it may preserve values but not explain their authority. The required relationship among official record, outcome, generated contest, and configuration revision remains a business decision.

---

## 6. Ownership classification

| Boundary | Facts owned | Does not own in this analysis |
|---|---|---|
| **Competition Configuration** | Competition mode; groups/divisions/categories and structural definitions; pairing rules; encounter/rubber templates and order; configured disciplines and formats; Competition-defined participation constraints. | Generated contest existence; schedule assignments; actual participation/execution; official results; cross-domain coordination. |
| **Contest Generation** (within Competition) | The fact that a particular prospective contest exists; its configured sides and competition context; parent encounter/structural position; authoritative contest composition/format when established; generation provenance if the business requires it. | Editing the rule while applying it; scheduling; actual participants; outcomes; official records; an automatic lifecycle. |
| **Scheduling** | Date/time placement; court/referee assignment; authoritative queue/board placement; assignment, reassignment, and unassignment history. | Contest identity/structure; resource identity/lifecycle; execution; outcomes; official records. |
| **Match Operations** | Actual participants and all execution, scoring, completion/outcome, confirmation, signature, and evidence facts. | Rewriting contest configuration; Scheduling updates; official competition records; lifecycle orchestration. |
| **Competition Result Recording** | Official result record; creation source and recording metadata; stable/additive correction history. | Contest generation/configuration; match execution; scheduling; ranking/advancement. |
| **Application layer** | Coordinates authorized operator intent across owners; resolves references; enforces whatever version/correction/supersession policy the business later approves; presents projections without transferring fact ownership. | A new “lifecycle” domain; ownership of the coordinated facts; silent cascading mutation; a workflow engine. |

### Cross-boundary invariant

Changing a fact in one boundary does not, by itself, rewrite facts owned by another boundary. Whether a requested configuration change is rejected, prospective, corrective, or requires a new/superseding contest is application-coordinated business policy that remains unresolved.

---

## 7. Open business decisions

The following questions require explicit business answers. The legacy application does not answer them safely.

### 7.1 Versioning

1. Which Competition Configuration changes create a new version, and which are corrections to descriptive/non-competitive metadata?
2. When does a configuration version become effective, and may it be changed after contests have been generated, scheduled, started, completed, or officially recorded?
3. Must every generated contest identify the exact configuration version and generation source/actor that established it?
4. Which values are preserved on the contest and which are referenced from versioned configuration: sides, group, discipline, format, scoring rules, template slot, and parent encounter?
5. What stable identities are required for a contest, each side, parent encounter, structural position, configuration version, and generation action?
6. Are team-template and lineup changes versioned independently, and which revision governs constituent-contest generation?

### 7.2 Supersession and cancellation

1. What is the distinction among correcting the same contest, cancelling it, voiding it, and replacing/superseding it?
2. Who is authorized to make each decision, what reason/evidence is required, and when is the action prohibited or escalated?
3. Does supersession preserve the original contest as historically addressable, and how is the active replacement identified?
4. May a contest be superseded after assignment, start, outcome confirmation, or official result creation?
5. What happens when only some contests generated from a changed group/template are affected?

### 7.3 Regeneration

1. Is regeneration a new generation action against a configuration version, a correction of a prior generation, or both depending on intent?
2. How are unchanged, removed, added, and materially changed contests recognized without relying on legacy textual IDs or side order?
3. Must a regeneration retain a relationship to the prior generation and state why it occurred?
4. Can regeneration occur after downstream Scheduling, Match Operations, or Result Recording facts exist?
5. Are placeholder team contests replaceable by resolved constituent contests, or are they the same contest corrected with better prospective detail?

### 7.4 Historical traceability

1. What minimum provenance must allow an auditor to reconstruct why a contest existed and which rules/sides/template governed it at the relevant time?
2. Must historical Scheduling assignments remain attached to cancelled/superseded contests?
3. What contest/configuration context must Match Operations preserve to explain actual participation and applied format?
4. What minimal snapshot must an official result retain so later upstream changes cannot alter its meaning?
5. How are links preserved across official-result corrections and contest supersession without implying that correcting one silently corrects the other?
6. How long must deleted, cancelled, superseded, or erroneous facts remain visible to authorized users?

### 7.5 Correction governance

1. Which mistakes may be corrected in place, if any, and which require additive correction/supersession facts?
2. How are operator error, bad import data, organizer rule change, entrant withdrawal, lineup correction, and execution discrepancy distinguished?
3. Which boundary owns each correction fact, and which actor merely requests it?
4. What validation is required before a correction that would conflict with an assignment, execution, confirmed outcome, or official record?
5. Must the correction preserve actor, authority, reason, evidence, timestamp, prior value, and affected references?
6. How are disputes resolved when Competition Configuration, generated-contest context, actual execution, and the official record disagree?

---

## 8. Explicit non-decisions and non-goals

This analysis does **not** design or introduce:

- APIs, services, repositories, or integration contracts;
- database or event schemas;
- a status model, state machine, workflow engine, or orchestration platform;
- automatic cascading updates across domains;
- automatic scheduling, optimization, dispatch, or notifications;
- ranking, standings, advancement, bracket, draw, or qualification behavior;
- an algorithm for matching regenerated contests to old contests;
- a correction, cancellation, supersession, or retention implementation; or
- production-code changes.

It also does not endorse legacy destructive overwrite/delete behavior. That behavior is evidence of a traceability gap, not a future policy.

---

## 9. Final boundary statement

Competition Configuration defines the rules and structure from which Contest Generation establishes particular prospective contests. Once established, the source configuration and the contest are distinct facts. Scheduling places the contest, Match Operations records its execution, and Competition Result Recording preserves the official result. Application-layer coordination may apply authorized business decisions across those references, but it does not acquire ownership and must not silently mutate downstream history.

Legacy TOP does not preserve enough version, provenance, correction, regeneration, or supersession information to guarantee that a changed configuration and its downstream records retain stable historical meaning. Resolving that gap requires explicit business governance before lifecycle behavior can be modeled.
