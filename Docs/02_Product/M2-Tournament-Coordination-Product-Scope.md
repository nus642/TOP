# M2 Tournament Coordination Product Scope

| Field | Value |
|---|---|
| Scope ID | PS-M2-TC-001 |
| Title | M2 Tournament Coordination Product Scope |
| Version | 1.0 |
| Status | Approved |
| Owner | TOP Product Team |
| Decision authority | TOP Product Team |
| Created | 2026-08-14 |
| Last reviewed | 2026-08-14 |

## 1. Purpose and decision context

This record decides the product-outcome boundary for the minimum M2 live-tournament
coordination loop after completion of the M1 Match Operation Loop. It selects only
the already-governed outcomes required for a Master to understand multiple Match and
Court conditions, coordinate one temporarily constrained Court exception, and reach
an attributable recovered or explicitly deferred disposition.

This record narrows the Canon-approved
`M2-Tournament-Coordination-Loop-Boundary.md` into independently reviewable Product
Scope decisions. It does not add a feature, UI, technical contract, delivery phase,
milestone, or implementation authorization.

## 2. Input baseline

| Authoritative input | Baseline |
|---|---|
| `M2-Tournament-Coordination-Loop-Boundary.md` | Canon Review Passed, merged by #124 at `500e0b8a4b172889ed308a9c5a510335b00b7974`, 2026-08-14 |
| `TOP-Product-Layer-Definition.md` | Version 1.1, Active, 2026-08-06; commit `500e0b8a…` |
| `TOP-Product-Actor-and-Goal-Model.md` | Version 1.1, Active, 2026-08-06; commit `500e0b8a…` |
| `TOP-Product-Story-Definition-Rules.md` | Version 1.1, Active, 2026-08-06; commit `500e0b8a…` |
| `TOP-Product-Story-Map-Structure.md` | Version 1.1, Active, 2026-08-07; commit `500e0b8a…` |
| `TOP-Initial-Product-Story-Map.md` | Version 1.0, Active, 2026-08-07; Approved stories; commit `500e0b8a…` |
| `TOP-Operational-Workflow-Definition-Rules.md` | Version 1.0, Active, 2026-08-07; commit `500e0b8a…` |
| `TOP-Operational-Workflow-Structure.md` | Version 1.2, Active, 2026-08-07; commit `500e0b8a…` |
| `TOP-Initial-Operational-Workflows.md` | Version 1.0, Approved, 2026-08-07; commit `500e0b8a…` |
| `TOP-Product-Scope-Definition-Rules.md` | Version 1.0, Active, 2026-08-07; commit `500e0b8a…` |
| `TOP-Business-Domain-Boundary.md` | Business Architecture baseline at commit `500e0b8a…` |
| `TOP-Operational-Capability-Model.md` | Business Architecture baseline at commit `500e0b8a…` |
| `TOP-Core-Business-Object-Model.md` | Business Architecture baseline at commit `500e0b8a…` |

## 3. Outcome boundary

Within one active Tournament, TOP enables a Master to maintain an attributable
multi-Match and multi-Court operating understanding, recognize one Court constraint
affecting expected or active Match work, coordinate explicit deferment, and observe
explicit recovery or an explicit remaining deferred condition. The assigned Referee
retains Match-execution responsibility, the attributable Court-condition authority
establishes Court truth, Scheduling retains TOP-managed placement authority, and
significant chronology remains reconstructable.

The minimum approved course is:

> Court constrained → affected Match explicitly interrupted or waiting → Master
> coordinates deferment → Court becomes available → Referee explicitly resumes Match
> execution → significant chronology remains attributable

## 4. Applicable actors, domains, capabilities, and objects

| Concern | Governed references |
|---|---|
| Primary actor | Master — M-G1, M-G2, M-G3, M-G4, M-G6 |
| Contextual actor | Referee — assigned Match execution responsibility; R-G3 context interpretation |
| Business domains | Tournament Operations; Trusted Competition Record; referenced Competition Context |
| Primary capabilities | Master Control; Court Management; Match Operations; Exception Handling; Event Timeline |
| Supporting capabilities | Archive; Result Record; Match Structure Reference; Competition Context Consumption |
| Core Business Objects | Tournament; Match; Court; Official Assignment; Competition Record; Competition Context |

## 5. Included outcome decisions

### M2-PSI-001 — Multi-Match and multi-Court operating understanding

| Required field | Scope decision |
|---|---|
| Scope decision | **Included.** Enable the Master to maintain one attributable operating understanding across multiple Matches and Courts and distinguish ordinary, attention-requiring, unknown, and conflicting conditions. |
| Business responsibility | Master coordinates the overall Tournament picture; originating actors and authorities retain responsibility for their facts. |
| Observable outcome | Relevant Match, Court, Referee-responsibility, and readiness context is coherent after refresh or reopening without experience-owned workflow truth. |
| Evidence references | M2 Boundary §§1–4, §7 steps 1–2, M2-AC-01–03; OW-M-001; PS-M-001/002; M-G1. |
| Boundary rationale | Master Control relates authoritative facts but does not acquire Court, Match, readiness, Scheduling, or external competition authority. |
| Explicit exclusions | Inventing absent facts; collapsing unknown or conflicting conditions; client-authored state progression. |
| Governed trace | **M2-PSI-001 → OW-M-001 → PS-M-001/002 → M-G1 → Master → Master Control (supported by Court Management, Match Operations, Exception Handling) → Tournament, Match, Court, Official Assignment.** |

### M2-PSI-002 — Attributable Court-condition coordination

| Required field | Scope decision |
|---|---|
| Scope decision | **Included.** Enable one temporarily constrained Court condition to become attributable, visible, and related to expected or active Match work for bounded coordination. |
| Business responsibility | The attributable Court-condition authority establishes and restores the Court fact; Master coordinates its Tournament effect through Court Management. |
| Observable outcome | Court identity, condition, provenance, time, affected Match context, and responsible next actor remain explicit. |
| Evidence references | M2 Boundary §§5–7, M2-AC-04–06; OW-M-002; PS-M-003/004; M-G2. |
| Boundary rationale | Court Management coordinates operating use without allowing Master observation or UI action to create Court truth. |
| Explicit exclusions | Facility, safety, legal, medical, or competition-rule determination; silent Match-state or schedule mutation. |
| Governed trace | **M2-PSI-002 → OW-M-002 → PS-M-003/004 → M-G2 → Master → Court Management (supported by Master Control and Match Operations) → Court, Match, Tournament.** |

### M2-PSI-003 — Explicit Match interruption, waiting, and resumption handoff

| Required field | Scope decision |
|---|---|
| Scope decision | **Included.** Preserve an explicit affected Match condition and enable the assigned Referee to supply attributable interruption and resumption facts needed by Match Operations. |
| Business responsibility | Referee retains assigned Match-execution responsibility; Master coordinates the surrounding Tournament effect and cannot fabricate execution truth. |
| Observable outcome | An affected Match is explicitly waiting or interrupted, and resumption is explicit, attributable, and dependent on current Court, Match, and Referee facts. |
| Evidence references | M2 Boundary §§5–7, M2-AC-06, M2-AC-10–11; OW-M-003; PS-M-005/006; M-G3; OW-R-003 and PS-R-004 for assigned-Match contextual interpretation. |
| Boundary rationale | Match Operations owns execution condition; coordination and shared context do not transfer Referee responsibility to Master. |
| Explicit exclusions | Automatic recovery; time- or refresh-inferred resumption; Master-authored Referee execution facts. |
| Governed trace | **M2-PSI-003 → OW-M-003 + OW-R-003 → PS-M-005/006 + PS-R-004 → M-G3 + R-G3 → Master/Referee → Match Operations + Match Structure Reference → Match, Court, Official Assignment.** |

### M2-PSI-004 — Bounded deferment and recovery coordination

| Required field | Scope decision |
|---|---|
| Scope decision | **Included.** Enable the Master to coordinate one explicit deferment and reach an attributable recovered or remaining-deferred disposition. |
| Business responsibility | Master coordinates the exception within established authority; each owning domain validates its fact or action. |
| Observable outcome | A valid deferment is recorded; stale, conflicting, premature, or unauthorized attempts fail without partial advancement; the remaining blocker and responsible actor are visible. |
| Evidence references | M2 Boundary §7 steps 4–9, M2-AC-07, M2-AC-09–11; OW-M-004; PS-M-007; M-G4. |
| Boundary rationale | Exception Handling coordinates effects but does not absorb Court, Match, Referee, Scheduling, or external authority. |
| Explicit exclusions | Generic workflow/case platform; silent conflict resolution; reassignment as a required recovery path. |
| Governed trace | **M2-PSI-004 → OW-M-004 → PS-M-007 → M-G4 → Master → Exception Handling (supported by Master Control, Court Management, Match Operations, Event Timeline) → Tournament, Match, Court, Official Assignment, Competition Record.** |

### M2-PSI-005 — Significant exception chronology

| Required field | Scope decision |
|---|---|
| Scope decision | **Included.** Preserve significant Court constraint, affected Match context, Master response, and recovery or defer disposition as attributable chronology when expected or active Match work is affected. |
| Business responsibility | Originating actors retain attribution; Trusted Competition Record capabilities preserve the operational account. |
| Observable outcome | Refresh, reopening, or restart can reconstruct the significant chronology without changing Official Result trust or external Competition Context ownership. |
| Evidence references | M2 Boundary §10 M2-AC-12–16 and §11; OW-M-006; PS-M-009/010; M-G6. |
| Boundary rationale | Event Timeline and Archive preserve TOP-managed significant facts without converting external meaning or unofficial Match conditions into official results. |
| Explicit exclusions | Recording every transient observation; altering M1 Official Records; downstream publishing or distribution authority. |
| Governed trace | **M2-PSI-005 → OW-M-006 → PS-M-009/010 → M-G6 → Master → Event Timeline + Archive (supported by Result Record) → Competition Record, Match, Court, Competition Context.** |

## 6. Explicit scope exclusions

| Exclusion ID | Classification | Excluded outcome | Rationale and evidence | Reconsideration condition | Related inclusions |
|---|---|---|---|---|---|
| M2-PSE-001 | Context exclusion | Alternative-Court reassignment as a required M2 completion path. | M2 Boundary §§5, 8, M2-AC-08 and real-DB item 6 make original-Court recovery sufficient. | A later approved Product Scope version may include it only after authoritative Scheduling meaning and history are governed. | M2-PSI-004 remains complete without it. |
| M2-PSE-002 | Boundary exclusion | Master or experience authority to create Court condition, Match execution, Referee responsibility, or Scheduling facts. | M2 Boundary §§3, 6–7; Actor/Goal Model; Domain Boundary; Capability Model. | Requires upstream actor, capability, and domain authority change plus full revalidation. | All inclusions. |
| M2-PSE-003 | Boundary exclusion | TOP authority over external competition definitions, draw, rules, or externally governed schedule-plan meaning. | M2 Boundary §§3, 6, 9; Competition Context boundary. | Requires upstream Business Architecture authority change. | M2-PSI-001, M2-PSI-003. |
| M2-PSE-004 | Context exclusion | Full schedule management, automatic optimization, generic court booking, or facility management. | M2 Boundary §9 limits the decision to one constrained-Court coordination loop. | Separate approved product evidence and Product Scope decision. | M2-PSI-002, M2-PSI-004. |
| M2-PSE-005 | Context exclusion | Result dispute/correction, cancellation, no-show, medical/safety/legal adjudication, referee workforce management, or sport-specific scoring variation. | M2 Boundary §9; these outcomes are unnecessary to the selected exception. | Separate approved stories, workflows, and scope review. | None automatically. |
| M2-PSE-006 | Boundary exclusion | New identity, authorization, workflow, platform, database, service, event-bus, infrastructure, roadmap, release, or implementation decision. | Product Scope is solution-neutral; M2 Boundary §§1 and 9 prohibit premature solution authority. | May be considered only by the appropriate later governance layer after readiness. | All inclusions. |

## 7. Coverage reconciliation

| Actor / goal | Approved workflow | Approved stories | Scope disposition |
|---|---|---|---|
| Master / M-G1 | OW-M-001 | PS-M-001/002 | M2-PSI-001 |
| Master / M-G2 | OW-M-002 | PS-M-003/004 | M2-PSI-002 |
| Master / M-G3 | OW-M-003 | PS-M-005/006 | M2-PSI-003 |
| Master / M-G4 | OW-M-004 | PS-M-007 | M2-PSI-004 |
| Master / M-G6 | OW-M-006 | PS-M-009/010 | M2-PSI-005 |
| Referee / R-G3 | OW-R-003 | PS-R-004 | Contextual support for M2-PSI-003; no transfer of Master coordination |
| Master / M-G5 | OW-M-005 | PS-M-008 | Existing referenced Competition Context remains applicable but no new M2 outcome is added |
| Referee / R-G1, R-G2 | OW-R-001/002 | PS-R-001/002/003 | Existing M1 responsibility and result trust retained; not reopened |
| Participant goals | OW-P-001–003 | PS-P-001–004 | Existing readiness facts may be viewed; no new Participant outcome is added |

## 8. Boundary constraints

1. Master coordination never grants domain authority.
2. Court condition and Match execution remain separate authoritative facts.
3. Referee interruption/resumption facts require assigned responsibility.
4. Scheduling owns TOP-managed placement; external authority retains external schedule meaning.
5. Unknown, stale, conflicting, and deferred conditions remain explicit.
6. Official Result and public/archive result trust remain governed by M1.
7. Significant chronology begins when the Court condition affects expected or active Match work.
8. No client-owned workflow state may become operational truth.

## 9. Boundary validation record

Review date: 2026-08-14

Reviewing and decision authority: TOP Product Team

| Validation gate | Result |
|---|---|
| Context | Pass — one constrained-Court coordination loop is bounded without roadmap or release semantics. |
| Inputs | Pass — exact Canon boundary and active upstream baselines are identified. |
| Actor and goal | Pass — every inclusion retains established Master and Referee responsibilities. |
| Story | Pass — only Approved existing stories are referenced without changing their value. |
| Workflow | Pass — only Approved workflows are used; handoffs and bounded exits remain intact. |
| Capability | Pass — established capabilities contribute without being redefined or mapped to components. |
| Domain | Pass — Tournament Operations, Trusted Competition Record, and referenced Competition Context boundaries remain intact. |
| Ownership and provenance | Pass — Court, Match, Scheduling, Referee, Master, and chronology responsibilities remain distinct. |
| External authority | Pass — TOP does not assume competition-definition, rule, draw, or external schedule authority. |
| Inclusion and exclusion | Pass — five inclusions and six exclusions are independent and reconciled. |
| Neutrality | Pass — no feature, UI, API, schema, service, infrastructure, milestone, estimate, or delivery decision is made. |
| Approval | Pass — TOP Product Team approved version 1.0 after all material findings were resolved. |

## 10. Assumptions and unresolved findings

None. Alternative-Court reassignment is an explicit context exclusion, not an
unresolved dependency of the minimum M2 loop.

## 11. Decision log

| Date | Decision | Authority | Rationale |
|---|---|---|---|
| 2026-08-14 | Submit M2-PSI-001–005 and M2-PSE-001–006 for Product Scope Review. | TOP Product Team | The decisions restate the Canon-approved M2 boundary as independently governed scope entries without adding product meaning. |
| 2026-08-14 | Approve version 1.0, including M2-PSI-001–005 and M2-PSE-001–006. | TOP Product Team | All twelve validation gates passed. Approved workflows explicitly support constrained/deferred Court conditions, interrupted or awaiting Match state, Referee-owned execution, bounded recovery, and attributable chronology; the scope neither expands authority nor prescribes a solution. |

## 12. Change history

| Version | Date | Change | Impact analysis | Authority |
|---|---|---|---|---|
| 1.0 | 2026-08-14 | Initial approved M2 Tournament Coordination Product Scope. | Establishes the authoritative product boundary for the stated baselines; does not authorize design, milestone, implementation, or delivery. | TOP Product Team |

## 13. Non-product decisions

This record makes no decision about features, screens, interactions, APIs, data
structures, services, architecture, implementation, tests, roadmap, milestone,
release, estimate, staffing, or delivery sequence.
