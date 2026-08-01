# Next Domain Planning Recommendation

**Date:** 2026-08-01

**Scope:** Architectural sequencing only; no APIs, schemas, implementation design, or new business rules

---

## Recommendation

Choose **A. Define Contest Identity / Configuration Reference Policy** as the next architectural step.

This should be a documentation-only decision task that obtains and records explicit business decisions. It must not derive policy from legacy identifiers, overwrite behavior, parser conventions, or implementation convenience.

The other choices should be sequenced as follows:

| Choice | Recommendation | Reason |
|---|---|---|
| **A. Contest Identity / Configuration Reference Policy** | **Next** | It closes the specific cross-boundary ambiguity now blocking safe historical references and later implementation planning. |
| **B. Another legacy analysis** | Not now | The lifecycle/versioning analysis already identifies both the evidence and its limits. More legacy inspection is justified only if the policy task exposes a narrow unanswered evidence question. |
| **C. Implementation planning** | After A | Current boundaries say what each domain owns, but not how a contest and its governing configuration remain historically identifiable across downstream facts. |
| **D. Another domain boundary** | Not now | The unresolved issue is a reference policy among established owners, not evidence of a missing domain. Creating another boundary risks turning coordination into a lifecycle or workflow domain. |

## Why A Is the Correct Next Step

The completed work has already established the relevant ownership chain:

- Competition Configuration defines competition rules and structure.
- Contest Generation establishes prospective contest facts.
- Registration supplies accepted entrant, roster, constraint-satisfaction, and prospective lineup facts without owning contest execution.
- Scheduling owns placement and resource-assignment relationships.
- Match Operations owns actual participation, execution, confirmation, and outcome facts.
- Competition Result Recording owns stable official result records and additive correction history.

Those boundaries are sufficient to locate ownership. The remaining architectural gap is how facts owned by those boundaries refer to the same historically meaningful contest without silently following mutable current configuration or treating a technical legacy ID as business identity.

The lifecycle/versioning analysis makes that gap explicit: legacy IDs provide addressability but not trustworthy sporting identity; generated contests do not retain coherent configuration-version provenance; and Scheduling, Match Operations, and official records require an unresolved historical reference policy. It also concludes that explicit business governance is required before lifecycle behavior can be modeled.

Therefore, the next task is not another ownership exercise. It is a constrained policy decision at the seam between already-defined boundaries.

## Required Scope of the Next Task

The task should define policy-level answers only for:

1. **Contest continuity:** what business meaning allows stakeholders to say that a reference still concerns the same contest, and when it instead concerns a replacement or superseding contest.
2. **Configuration reference:** whether downstream historical facts refer to an identified configuration revision, preserve selected context, or use another business-approved approach.
3. **Reference stability:** which references must remain historically resolvable after authorized configuration correction, contest cancellation, replacement, or supersession.
4. **Cross-boundary meaning:** what Scheduling, Match Operations, and Competition Result Recording are entitled to rely on when referring to a generated contest.
5. **Decision authority and unresolved cases:** which answers require business-owner approval and which questions remain explicitly deferred.

This is a policy scope, not a request to choose identifiers, field sets, storage techniques, payloads, endpoints, or algorithms. The task should present unresolved alternatives to business owners and record approved decisions; it must not fill evidence gaps with invented rules.

## Dependencies

### Completed architectural inputs

- Competition Result Recording, including stable official records and additive correction direction.
- Competition Configuration and Contest Generation boundary conclusions.
- Registration, Scheduling, and Match Outcome fact boundaries.
- Legacy Competition Lifecycle and Versioning Analysis.

### Required decision input

Business owners must decide the intended semantics of contest continuity, configuration change, correction, cancellation, replacement, supersession, and historical interpretation. The existing legacy system cannot supply those decisions reliably.

### Not a prerequisite

No new API, database schema, service contract, event model, status lifecycle, or workflow design is needed to complete the policy task.

## Risks

### If implementation planning starts first

- Technical keys may accidentally become permanent business identity.
- Downstream records may point to mutable current configuration and change historical meaning retrospectively.
- Excessive snapshots may duplicate facts without establishing their authority or provenance.
- Regeneration or correction may be implemented as destructive overwrite, orphaning Scheduling, execution, or official-result history.
- Implementation choices may silently decide unresolved business policy and become expensive to reverse.

### If another legacy analysis is started first

- Work may repeat evidence already captured while still being unable to establish desired future governance.
- Destructive legacy mechanics may be mistaken for approved correction or supersession rules.
- Architectural progress may be delayed without reducing the actual decision risk.

### If another domain boundary is created

- A new “lifecycle,” “identity,” or “coordination” domain may improperly acquire facts already owned by Competition, Scheduling, Match Operations, or Competition Result Recording.
- Cross-boundary references may be mistaken for ownership transfer.
- TOP may drift toward a workflow engine rather than remain a domain fact system.

### Risks within the recommended task

- The task could drift into logical/physical schema design by enumerating fields or identifier formats.
- It could invent versioning, cancellation, or supersession rules when stakeholders have not decided them.
- It could broaden into complete correction governance, retention policy, ranking, advancement, or orchestration.

These risks should be controlled with explicit non-goals, decision logs, evidence citations, and clearly labeled unresolved questions.

## Recommended Next Task

### TASK-COMP-004-A1: Contest Identity and Configuration Reference Policy

**Purpose:** Obtain and document the minimum business-approved policy needed for a generated contest and its governing Competition Configuration to remain unambiguous and historically referenceable across Scheduling, Match Operations, and Competition Result Recording.

**Scope:** Documentation and business-decision capture only.

**Expected deliverables:**

1. A concise policy decision record covering contest continuity, configuration-reference semantics, and downstream historical-reference expectations.
2. A cross-boundary reference responsibility matrix that preserves existing fact ownership.
3. A list of approved decisions, explicitly deferred decisions, and decision owners.
4. Non-goals prohibiting APIs, schemas, identifier formats, persistence choices, algorithms, automatic cascading updates, lifecycle engines, and invented business rules.
5. Acceptance criteria confirming that later implementation planning can proceed without silently choosing identity or historical-reference policy.

**Exit condition:** The relevant business owners have approved enough policy to determine whether historical references remain attached to an existing contest or to a distinct replacement, and how the governing configuration context remains interpretable. Any unresolved case is explicitly documented as a blocker or deferral rather than guessed.

## Sequencing After the Recommended Task

If the policy task reaches its exit condition, move to **C. implementation planning** for the already-defined boundaries. Implementation planning should then translate approved policy without redesigning ownership or introducing workflow behavior.

Choose **B** only for a narrowly scoped evidence question discovered during the policy task. Choose **D** only if new evidence demonstrates a genuinely unowned business fact; the current record does not demonstrate one.

---

*End of Recommendation*
