# TASK-COMP-004-A1 Decision Classification

**Status:** Decision process prepared — business decisions remain unanswered

**Scope:** Classification and sequencing only

---

## Purpose and Classification Rules

This document prepares the TASK-COMP-004-A1 policy decision process. It does **not** select a policy outcome.

The source documents sometimes combine a policy question with a possible technical mechanism. Those parts are separated below so that confirming a required business outcome as a domain rule does not accidentally select an identifier, schema, snapshot, versioning, or storage design.

| Class | Meaning in this document | Decision owner / timing |
|---|---|---|
| **A — Business policy decision required** | Defines sporting or operational meaning, permitted change, continuity, correction, supersession, or the historical guarantee the business requires. | Authorized business stakeholders must decide before affected implementation proceeds. |
| **B — Architecture invariant that can be defined now** | Restates an already established ownership or cross-boundary constraint without choosing a new business rule. | Architecture may record now; implementation must preserve it. |
| **C — Implementation decision (must defer)** | Chooses how confirmed domain rules are represented, persisted, addressed, resolved, or enforced. | Defer until the domain rules are confirmed and implementation planning begins. |
| **D — Requires stakeholder clarification** | The question cannot yet be put to a decision authority cleanly because scope, terminology, actor, scenario, or required implementation slice is unspecified. | Clarify first, then reclassify the resulting bounded question as A, B, or C. |

“Blocker” below means a blocker for the implementation slice that encounters the question. It does not mean every unresolved question blocks every possible piece of work.

---

## 1. Decision Classification Table

### 1.1 Contest identity and continuity

| ID | Normalized decision question | Class | Implementation effect | Rationale / clarification needed |
|---|---|---|---|---|
| ID-1 | What business criteria make an authorized change concern the same contest rather than a distinct replacement? | **A** | **Blocks** contest identity and mutation design. | This is the central continuity policy; a technical key must not answer it. |
| ID-2 | Is contest identity determined by structural position, configured sides, temporal context, or some business-defined combination? | **A** | **Blocks** identity and regeneration matching behavior. | These are candidate business meanings, not identifier fields. |
| ID-3 | Does contest identity meaning differ among round-robin, explicit-pairing, and team-encounter modes? | **D** | **Blocks only modes included in the first implementation scope.** | Stakeholders must first confirm the supported modes and whether one rule or mode-specific rules are required. |
| ID-4 | What stable technical identities, formats, and keys represent a contest, side, encounter, structural position, configuration revision, or generation action? | **C** | Does **not** belong in this policy decision. | Stable business meaning must be confirmed as domain rules first; identifier format and key selection are implementation choices. |
| CT-1 | Which configuration changes affect already generated contests, future contests, or both before scheduling? | **A** | **Blocks** post-generation configuration changes. | This determines effective scope of change. |
| CT-2 | Which configuration changes affect already generated contests, future contests, or both after scheduling? | **A** | **Blocks** configuration changes involving assignments. | The answer must not be inferred from mutable legacy records. |
| CT-3 | Which configuration changes affect already generated contests, future contests, or both after execution or official recording? | **A** | **Blocks** changes involving execution or official history. | This is historical continuity policy. |
| CT-4 | At what business point, if any, must a proposed change create a distinct contest instead of changing the existing contest? | **A** | **Blocks** mutation, replacement, and lifecycle behavior. | The relevant threshold may depend on the policy outcomes for assignment, execution, and official recording. |
| CT-5 | Which kinds of configuration change count as a correction, a prospective change, or a replacement? | **A** | **Blocks** change classification and downstream handling. | The categories must be defined from intent and business effect, not storage behavior. |
| CT-6 | When does a configuration revision become effective, and what changes are permitted after generation, assignment, start, completion, or official recording? | **A** | **Blocks** version-effective behavior. | “Revision” describes policy-level governing context here, not a versioning mechanism. |
| CT-7 | Are team-template and lineup changes governed independently, and which governing context applies when constituent contests are generated? | **D** | **Blocks** team-encounter generation if it is in scope. | Stakeholders must clarify template versus Registration-owned lineup terminology, authority, and first-scope need before deciding policy. |

### 1.2 Governing context and historical interpretation

| ID | Normalized decision question | Class | Implementation effect | Rationale / clarification needed |
|---|---|---|---|---|
| GC-1 | Must Competition Configuration preserve the authoritative meaning and provenance of the configuration facts it owns? | **B** | **Blocks** any design that would lose owned authoritative meaning. | Fact ownership is already established; a reference does not move this responsibility. The required retention extent remains a policy question. |
| GC-2 | Must Contest Generation preserve that a contest was established and its relationship to the governing configuration context? | **B** | **Blocks** contest persistence/reference design. | The source configuration and generated contest are distinct facts; preserving their meaningful relationship follows from the established boundary. |
| GC-3 | Which governing categories must remain interpretable: sides, structural position, group/stage, discipline, format, scoring, template position, parent encounter, and provenance? | **A** | **Blocks** the minimum historical-context contract. | Stakeholders must confirm required meaning category by category; the list must not imply a storage layout. |
| GC-4 | May a later configuration edit change how an earlier contest is interpreted? | **A** | **Blocks** current-value lookup and mutation behavior. | This defines the historical guarantee rather than the mechanism that satisfies it. |
| HI-1 | Must an authorized reader be able to explain why a contest had its configured sides and structural context? | **A** | **Blocks** historical-context requirements. | This is an audit/reconstructability outcome. |
| HI-2 | Must an authorized reader be able to explain which discipline, format, scoring rules, or template position governed at execution time? | **A** | **Blocks** execution-context requirements. | This decides required historical meaning, not whether data is copied or referenced. |
| HI-3 | Must Scheduling history remain interpretable against the contest to which each assignment actually applied? | **B** | **Blocks** destructive reassignment or reference rewriting. | Scheduling owns assignment history and references the contest; later changes cannot transfer or rewrite that ownership. |
| HI-4 | Must Match Operations history remain interpretable against its contest context without treating configured sides as proof of actual participation? | **B** | **Blocks** designs that overwrite execution or actual-participation facts. | Match Operations owns execution and actual participation; configured context is only referenced. |
| HI-5 | Must an official record retain a historically meaningful relationship to the contest and confirmed outcome it records? | **B** | **Blocks** official-record references that resolve only to mutable current meaning. | Competition Result Recording owns the stable official record; upstream changes cannot silently rewrite it. |
| HI-6 | What minimum provenance must explain why a contest existed and which rules, sides, or template governed it? | **A** | **Blocks** the provenance requirement. | The outcome and required evidence are policy; fields and storage are deferred. |
| HI-7 | How long must cancelled, superseded, deleted, or erroneous facts remain visible to authorized users? | **D** | Can remain open unless retention is part of the first slice or legal/audit obligations apply. | A named retention authority, record classes, jurisdictions, and visibility meanings are needed before a policy decision can be framed. |
| HI-8 | Which values are copied, referenced, snapshotted, or stored on a contest or official record, and how are historical links persisted? | **C** | Must remain open until historical guarantees are confirmed as domain rules. | These are representation and persistence mechanisms, including the legacy analysis's “minimal snapshot” question. |

### 1.3 Correction, cancellation, supersession, and regeneration

| ID | Normalized decision question | Class | Implementation effect | Rationale / clarification needed |
|---|---|---|---|---|
| CS-1 | What is the business distinction among correction, change, cancellation, voiding, replacement, and supersession? | **A** | **Blocks** all affected lifecycle behavior. | Legacy overwrite/delete behavior does not define these meanings. |
| CS-2 | Does a correction preserve the same contest, create a distinct contest, or depend on a business-defined class of correction? | **A** | **Blocks** correction identity semantics. | This is a policy outcome; no option is selected here. |
| CS-3 | Must cancellation preserve downstream references as historical, or may any references be invalidated, and under what business conditions? | **A** | **Blocks** cancellation where downstream facts exist. | The answer must distinguish historical preservation from operational validity. |
| CS-4 | Does replacement or supersession create a distinct contest that coexists historically with the original? | **A** | **Blocks** replacement and supersession design. | This decides historical identity, not how an active replacement is technically found. |
| CS-5 | What should happen, at the policy level, to Scheduling, Match Operations, and official-record references when a contest is superseded? | **A** | **Blocks** supersession with downstream history. | Each owner must retain its facts; policy must decide their relationship and operational treatment. |
| CS-6 | Is destructive overwrite or deletion of original facts ever acceptable, and under what business conditions? | **A** | **Blocks** destructive mutation/deletion. | Legacy technical capability is not confirmation of a domain rule; any exception requires explicit policy. |
| CS-7 | What provenance must a correction or supersession preserve, such as actor, authority, reason, evidence, time, prior meaning, and affected references? | **A** | **Blocks** minimum correction/supersession audit requirements. | Policy selects required evidence; schema and fields are deferred. |
| CS-8 | Who may authorize correction, cancellation, voiding, replacement, or supersession, and when is escalation required? | **D** | **Blocks** exposing these operations. | Stakeholders must identify the business authorities and governance scope before detailed authorization policy is decided. Role-model implementation remains out of scope. |
| CS-9 | May a contest be superseded after assignment, start, outcome confirmation, or official result creation? | **A** | **Blocks** supersession at each included milestone. | This is a permission/prohibition policy. |
| CS-10 | How are partial effects handled when only some contests from a changed group or template are affected? | **A** | **Blocks** partial regeneration/change behavior if in first scope. | The business must decide affected-contest semantics before matching algorithms are designed. |
| RG-1 | Is regeneration a new generation action, a correction of a prior generation, or dependent on intent? | **A** | **Blocks** regeneration semantics. | Re-running legacy generation does not answer this question. |
| RG-2 | Must regeneration retain a meaningful relationship to prior generation and a reason for occurring? | **A** | **Blocks** regeneration provenance requirements. | This chooses the guarantee, not its representation. |
| RG-3 | Can regeneration occur after Scheduling, Match Operations, or Result Recording facts exist? | **A** | **Blocks** regeneration at those milestones. | Cross-domain facts cannot be cascaded or erased implicitly. |
| RG-4 | Are placeholder team contests the same contests later completed with prospective detail, or distinct contests replaced by resolved constituent contests? | **D** | **Blocks** placeholder behavior if that legacy concept is retained in the first scope. | Stakeholders must first clarify whether placeholders are a future business concept or only a legacy implementation artifact. |
| RG-5 | How are unchanged, removed, added, and materially changed contests matched during regeneration? | **C** | Must defer until ID-1, ID-2, and RG-1 are confirmed as domain rules. | Recognition and matching are algorithms that implement identity policy. |

### 1.4 Cross-domain responsibilities, disputes, and scope

| ID | Normalized decision question | Class | Implementation effect | Rationale / clarification needed |
|---|---|---|---|---|
| XR-1 | Does referencing an entrant, roster, eligibility, or prospective lineup fact transfer ownership from Registration to Competition? | **B** | **Blocks** any ownership transfer or duplicated authority. | Registration remains authoritative; a reference never transfers ownership. |
| XR-2 | May a configuration or contest change silently rewrite a fact owned by Scheduling, Match Operations, Competition Result Recording, or Registration? | **B** | **Blocks** silent cascading mutation. | Changing one boundary's fact does not itself rewrite another boundary's fact. |
| XR-3 | Must the application layer coordinate authorized intents without becoming a fact owner, lifecycle domain, or workflow engine? | **B** | **Blocks** creation of a coordination owner or implicit workflow domain. | Coordination does not confer ownership. |
| XR-4 | What behavioral guarantees must a consumer honor when resolving a contest reference? | **A** | **Blocks** cross-domain reference contracts. | Established ownership supplies constraints, but stakeholders must decide the required historical behavior and permitted outcomes. |
| XR-5 | Which boundary owns each correction fact, and which actor merely requests the correction? | **B** for fact ownership; **D** for the actor/request authority | **Blocks** correction boundary and authorization design. | Existing fact ownership must remain unchanged; stakeholders must clarify actors and authority before authorization rules are framed. |
| XR-6 | What validation or business approval is required when a correction conflicts with assignment, execution, confirmed outcome, or official record facts? | **A** | **Blocks** conflicting corrections. | This is governance policy across independently owned facts. |
| XR-7 | How should disputes among configured context, generated-contest context, actual execution, and the official record be resolved? | **D** | Can remain open only if disputes are excluded from the first scope and conflicting facts are preserved rather than guessed away. | A decision authority, dispute types, and desired outcomes must be named before a bounded business decision can be made. |
| SC-1 | Which competition modes, milestones, change types, and seven policy scenarios are required for the first implementation scope? | **D** | **Blocks** determination of the minimum policy exit condition. | The task permits bounded deferral, but stakeholders must explicitly bound the first slice. |

---

## 2. Recommended Order of Decisions

The order below minimizes circular decisions and prevents implementation mechanisms from becoming accidental policy.

1. **Clarify the decision frame (D):** identify the authorized business decision-makers; define the first implementation scope by competition mode and scenario; clarify whether placeholders are future concepts; and identify any legal, audit, or retention authority.
2. **Confirm established invariants (B):** confirm unchanged fact ownership, non-transfer of ownership through references, no silent cross-boundary rewriting, and application-layer coordination without a new lifecycle owner. These are constraints on all later options, not choices among policy outcomes.
3. **Decide contest identity meaning (A):** answer ID-1 and ID-2, then the bounded mode-specific form of ID-3. A shared meaning of “same contest” is prerequisite to correction, replacement, and regeneration decisions.
4. **Decide continuity and effective-change policy (A):** answer CT-1 through CT-6 for the milestones and modes in scope, including the distinction among correction, prospective change, and replacement.
5. **Decide required governing context and historical guarantees (A):** confirm the categories and provenance as domain rules that must remain interpretable (GC-3, GC-4, HI-1, HI-2, and HI-6). Apply the already established Scheduling, Match Operations, and official-record invariants.
6. **Decide correction, cancellation, supersession, and regeneration semantics (A):** answer CS-1 through CS-7, CS-9, CS-10, and RG-1 through RG-3 for the scoped scenarios. Clarify authorization and dispute questions before exposing those capabilities.
7. **Decide cross-domain consumer behavior (A):** specify XR-4 and XR-6 without changing ownership, and test the results against every in-scope scenario from `01-TASK.md`.
8. **Record bounded deferrals:** name excluded modes and scenarios, the condition that reopens each question, and the responsible stakeholder. An unbounded “later” is not a decision.
9. **Only then begin implementation planning (C):** select identifiers, schemas, snapshot/reference strategies, persistence, APIs, matching algorithms, and enforcement mechanisms that satisfy the confirmed domain rules and invariants.

---

## 3. Questions That Should Block Implementation

### 3.1 Block all contest identity / historical-reference implementation planning

- **SC-1:** the first implementation slice must be bounded.
- **ID-1 and ID-2:** the business meaning of same contest versus distinct contest must be confirmed as domain rules.
- **GC-3 and GC-4:** required governing context and the effect of later edits on historical meaning must be confirmed as domain rules.
- **XR-4:** cross-domain reference consumers need a confirmed domain-rule contract for historical behavior.

Without these decisions, identifier, reference, schema, or mutation design would decide policy accidentally.

### 3.2 Block only capabilities included in the first implementation slice

- **Configuration mutation after generation:** CT-1 through CT-6.
- **Mode-specific/team behavior:** ID-3 and CT-7 after clarification.
- **Historical audit or reconstruction:** HI-1, HI-2, and HI-6.
- **Correction:** CS-1, CS-2, CS-6, CS-7, XR-5, and XR-6; CS-8 must be clarified before the operation is exposed.
- **Cancellation:** CS-1, CS-3, CS-6, CS-7, and CS-8.
- **Replacement/supersession:** CS-1, CS-4, CS-5, CS-7, CS-9, and any applicable CS-10.
- **Regeneration:** RG-1 through RG-3 and any applicable CS-10; RG-4 must be clarified if placeholders are in scope.
- **Dispute handling:** XR-7 must be clarified before implementing a dispute-resolution capability.
- **Retention/deletion:** HI-7 must be clarified before implementing destructive retention or purge behavior.

### 3.3 Invariants that immediately prohibit incompatible implementation

The B-class items do not await a new business answer, but they are hard constraints: GC-1, GC-2, HI-3, HI-4, HI-5, XR-1, XR-2, XR-3, and the ownership portion of XR-5. Any implementation that transfers ownership through a reference, overwrites another boundary's facts, or makes the application layer a new fact owner is blocked even while A-class policy remains open.

---

## 4. Questions That Can Remain Open

The following may remain open only under an explicit bounded deferral. The implementation slice must neither require an answer nor encode a default answer.

| Question(s) | May remain open when | Reopen when |
|---|---|---|
| ID-3, CT-7, RG-4 | The affected competition mode, team-template/lineup behavior, or placeholder concept is excluded from the first slice. | That mode or concept enters scope. |
| CT-2, CT-3, CS-3 through CS-5, CS-9, RG-3 | Post-assignment, post-execution, cancellation, or supersession operations are prohibited rather than guessed in the first slice. Existing facts must still be preserved. | Any such operation is enabled. |
| CS-8, XR-6, XR-7 | Correction/dispute capabilities are not exposed and conflicts are surfaced without automatic resolution. | A correction, approval, escalation, or dispute workflow is planned. |
| HI-7 | No purge, destructive deletion, or retention change is implemented and no known obligation requires a decision for the slice. | Retention, deletion, archival, visibility, audit, or jurisdictional requirements enter scope. |
| CS-10 | Partial group/template change is excluded and rejected explicitly. | Partial regeneration/change is supported. |
| **All C-class questions** (ID-4, HI-8, RG-5) | Policy work is still underway. | Implementation planning begins after the prerequisite A decisions and B invariants are recorded. |
| Out-of-scope policy scenarios | The deferral names the scenario, responsible authority, prohibition/default-safe behavior, and reopening condition. | The scenario becomes necessary for delivery. |

The central identity decision (ID-1/ID-2), minimum governing-context guarantee (GC-3/GC-4), and in-scope cross-domain behavior (XR-4) cannot be left open while implementing contest identity or historical references. Doing so would violate the task's exit condition.

---

## Decision-Session Output Template

For each A-class question taken to stakeholders, record only:

1. the confirmed domain-rule outcome or explicit prohibition;
2. the modes and scenarios to which it applies;
3. the historical facts that must remain interpretable;
4. the established fact owners that remain authoritative;
5. the named decision authority and confirmation date; and
6. any bounded deferral and its reopening condition.

Do not record an identifier format, schema, snapshot strategy, event model, API, workflow, or storage mechanism as part of the policy answer.

---

*End of Decision Classification*
