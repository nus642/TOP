# TOP 9.12 Production Trial & Field Validation Review

**Date:** 2026-09-12  
**Status:** Evidence Freeze / Review Required  
**Nature:** Production Trial + Field Validation + Strategic Review

> **Governance statement**
>
> This review records field evidence, operational observations, and hypotheses. It does **not** authorize architecture changes. Existing TOP Canon, domain model, implemented capabilities, and prior Engineering Design must be reviewed before deriving Product, Architecture, or Engineering changes.
>
> Preferred sequence: **Field Evidence → TOP Review → Architecture Impact Assessment → Derived Issues → Canon / Knowledge / Product / Engineering**.

## 1. Why this review exists

The 2026-09-12 Guangzhou Power Supply Bureau pickleball team competition was TOP's first sufficiently demanding real-world production trial to expose the interaction among people, courts, referees, lineup handling, dispatch, live state, Master operations, external result systems, and production infrastructure.

The purpose of this document is not to turn every observation into a feature request. It is to freeze the evidence before it is lost, distinguish facts from hypotheses, and provide a parent review from which later focused issues can be derived.

## 2. Competition context

- 20 teams.
- 8 courts.
- Approximately 156 games/sets across the competition.
- 10 referees: 8 primarily attached to courts plus 2 mobile substitutes.
- 40 group-stage lineup rooms before knockout-stage operations.
- More than 160 participants checked in; the live Master view later showed 167/167 checked in and 20/20 teams complete.
- The competition depended on multiple human roles: Master, referee chief, referees, team captains/leaders, assistants, and players.

## 3. Operational outcome

TOP Online was used in the live competition but eventually became too unreliable/slow to remain the sole operational system. The competition operation therefore switched to a fallback combination of:

1. the existing local/single-machine version,
2. paper-based operation where appropriate, and
3. 网球记 for result aggregation / competition-result handling.

The competition continued. This fallback path is itself an important validated field result.

This production trial therefore did **not** validate TOP Online as a sufficiently reliable sole live runtime for this competition scale. It did, however, produce unusually valuable evidence about runtime behaviour, operational complexity, product boundaries, continuity, and future validation requirements.

## 4. Production incident evidence

### 4.1 Strongest browser evidence

The Master browser repeatedly failed while requesting:

`data.php?action=get_full_dashboard&event_code=0912`

Observed browser errors included:

- `net::ERR_INCOMPLETE_CHUNKED_ENCODING`
- `net::ERR_CONNECTION_RESET`

The requests were repeatedly made with cache-busting parameters, indicating polling/repeated dashboard refresh behaviour.

This localizes an important failure symptom to the Master full-dashboard request path. It does **not** yet establish the root cause.

### 4.2 Runtime observations

Observed symptoms included:

- Master remained slow even after TOP stopped being actively used for roughly an hour.
- lineup review / roster scanning was slow;
- closing/dissolving earlier completed rooms was slow;
- some court-number changes were visible to the Referee side but were not reflected correctly in the Master view;
- a production application-container restart did not materially solve the operational slowness.

### 4.3 Evidence that must not be over-interpreted

Post-incident host/container measurements showed low CPU and moderate memory use, and a later MySQL `SHOW PROCESSLIST` showed no active blocking query. These observations were taken after live TOP usage had largely stopped and therefore **cannot exclude** transient resource pressure, SQL contention, slow queries, proxy failures, or other conditions during the incident itself.

### 4.4 Root cause status

**Root cause remains unresolved.**

Post-event RCA should examine at minimum:

- host HTTPS/reverse-proxy configuration and logs;
- request timing and response headers for `get_full_dashboard`;
- endpoint execution time, query count/time, response size and PHP memory;
- polling frequency and overlapping requests;
- historical infrastructure metrics around incident time;
- MySQL slow-query/performance evidence;
- controlled reproduction using event 0912 data.

Architectural solutions such as endpoint splitting, delta polling, event-driven updates, caching, active/history separation, or query optimization must remain hypotheses until the failing layer is identified.

## 5. Field observations — operational capability

### 5.1 Batch dispatch fits real competition rhythm

For this competition, manually collecting a whole round's lineups, entering them centrally, and dispatching them together was operationally preferable to allowing many captains to independently submit at arbitrary times.

Reason: participant digital capability varies, independent submissions introduce learning/support cost, early rooms can pollute the Master's operational view, and the competition itself advances in coordinated waves.

**Hypothesis for review:** submission/readiness and live release may need clearer separation. Master-controlled release may be an important operational capability.

### 5.2 Post-dispatch adjustment is necessary

During a batch-dispatched set, some court assignments could be changed while another could not.

Field requirement: dispatch cannot automatically mean that all operational assignments are forever final. Master needs controlled post-dispatch adjustment where the lifecycle permits it.

This may relate to a broader distinction between **planned assignment** and **actual operational assignment**, but that distinction must first be checked against the existing TOP model.

### 5.3 Correction and recovery are first-class operations

Incorrectly dispatched items need a safe correction path.

Potential lifecycle distinction to review:

- dispatched but not started → undo/delete/re-dispatch may be possible;
- started/completed → correction must preserve history and may require cancel/void/rearrange semantics.

The principle is more important than the exact mechanism: **live operations must be recoverable without corrupting history.**

### 5.4 External-result transfer creates another operational closure state

A completed match may still require its result to be transferred into another platform such as 网球记. Operators need to know whether this handoff has occurred.

Observed need: a simple indication such as “已转记到其它平台”.

This suggests that `Match Finished` and `Operationally Closed` may not always be identical. Exact lifecycle modelling requires review.

### 5.5 Master must be a trustworthy operational projection

Cases where the Referee side obtained an updated court assignment while Master did not display it indicate a serious operational consistency concern.

Even if the underlying write succeeds, Master cannot function as a control centre if its projection is stale or unreliable.

## 6. Opening Phase: highest-risk operating window

A major field insight from this competition is that complexity is strongly phase-dependent.

The opening/startup phase concentrates the largest number of simultaneously interacting resources and transitions:

- teams and players arriving/checking in;
- lineup collection and review;
- courts becoming operational;
- referees being allocated;
- rooms/matches being prepared and dispatched;
- captains learning the workflow;
- assistants chasing missing information;
- Master resolving exceptions;
- many objects changing state in a short time window.

By the knockout stage, the competition became dramatically easier: fewer teams, fewer matches, more stable assignments, and participants already understood the operating rhythm.

### Review principle

> **The opening phase is the peak-risk and peak-complexity window of a competition. TOP must be engineered and operationally prepared for that peak rather than designing all competition phases as if they carried equal risk.**

This has implications for readiness, UX, performance validation, staffing assumptions, fallback planning, and simulation.

## 7. Competition Readiness and pre-start capability

The Master experienced significant uncertainty immediately before the start. This suggests a future need for a higher-level pre-start readiness capability.

Potential areas:

- environment/runtime readiness;
- competition data readiness;
- team/check-in readiness;
- first-round lineup readiness;
- court readiness;
- referee readiness;
- fallback/DR readiness;
- known exception review.

Do not yet introduce a new domain object. First determine whether this is best represented as a checklist, assessment, projection, operational procedure, or extension of existing TOP concepts.

## 8. Simulation must become part of engineering validation

Real people should not be required to reproduce competition-scale pressure.

TOP should be able to simulate a realistic competition scenario using automated actors and lifecycle actions rather than only generic request-volume load testing.

### Initial reference scenario

**Scenario: 9.12 Opening Chaos**

- 20 teams;
- 8 courts;
- 10 referees;
- 40 group-stage rooms;
- 160+ participants;
- concentrated check-in / lineup / review / dispatch activity;
- Master dashboard polling;
- referee actions;
- court assignment changes;
- result submissions;
- room completion/closure;
- selected abnormal/recovery paths.

The goal is not merely “N requests per second”. It is to reproduce **competition-state pressure and opening-phase concurrency**.

Metrics should eventually include latency percentiles, failed requests, endpoint timing, query timing, response size, state consistency, recovery correctness, and lifecycle integrity.

## 9. Attention is an operational resource

Existing Master → Referee information capability proved less valuable in practice because referees actively officiating matches are unlikely to monitor another information channel continuously.

A more valuable observed requirement is a lightweight one-to-one **Attention Signal + Acknowledgement** capability between Chief Referee and individual referees.

Examples of intent may be as simple as:

- call me;
- urgent;
- check WeChat;
- acknowledged.

TOP does not necessarily need to replace WeChat or another rich messaging system. It may only need to guarantee that an operational attention request is seen and acknowledged.

Review principle:

> **Attention itself is a constrained competition resource. Features and information that do not deserve attention should not occupy the live workspace.**

## 10. Capability/module exposure must follow competition need

Some competitions need waiver handling; this internal corporate competition did not. Similar variation exists across many competition capabilities.

Field principle:

> When a capability is needed it should be direct and visible; when it is not needed it should get out of the way.

This supports further review of TOP's modular/configurable direction, but does not itself authorize a new architecture.

## 11. Governance Before Management

A deeper product principle emerged from the field work:

> **TOP should first govern resources, needs, rules, capabilities and boundaries; only then manage workflows inside those boundaries.**

Examples of resources include courts, referees, players, time, staff and devices. Examples of capabilities include lineup, waiver, referee assignment, court operation, ranking, payment, partner rotation, broadcast, etc.

This principle should be tested against existing TOP Canon before promotion to a formal Product/Architecture principle.

## 12. Large-screen and projection insight

The client wanted more than live court status. Useful public/operational display may include:

- current court/match state;
- competition schedule/order;
- next teams preparing;
- updated results/standings;
- knockout bracket/progress;
- eventually broadcast/video integration.

The stronger architectural hypothesis is not “build a bigger big-screen page”, but:

> Different audiences may need different projections of the same authoritative Competition State.

Potential projections include Live Court Board, Schedule Board, Standings, Bracket and Broadcast Data/Overlay. This requires review against existing projection/read-model design.

## 13. Local runtime as both continuity layer and product asset

The successful fallback demonstrated that the single-machine/local version should **not** be treated as obsolete when TOP Online matures.

It has at least three strategic roles:

### 13.1 Local Runtime

For physically compact competitions where courts, Master and referees are close together, local operation can be simple and effective.

### 13.2 Disaster Recovery / Competition Continuity

Validated fallback path:

**TOP Online → improved TOP Local → paper where necessary → 网球记 result handling**

The continuity objective is not merely server recovery. It is:

> **Competition Continuity — the competition must be able to continue even when the primary digital runtime fails.**

A future DR drill should test whether the event can switch from Online to Local within a defined operational window while preserving enough current state to continue safely.

The DR runtime should deliberately remain low-dependency, simple and reliable rather than duplicating all Online complexity.

### 13.3 Market Hook

TOP Local may also be the lowest-friction market entry point.

An organizer can first use a useful local tool without replacing its existing registration/result platform. As operational complexity grows, natural needs appear for referee self-service, captain submission, multi-device collaboration, live dashboards, broadcast, analytics, AI, etc.

Potential product path:

**TOP Local → trusted real competition usage → need for collaboration → TOP Online → optional capability modules → Live / AI / Broadcast / Analytics**

Important constraint: Local should not be intentionally crippled to force Online adoption. It must remain a genuinely useful and trustworthy product in the class of competitions it serves.

## 14. Coexistence with external competition systems

The 9.12 fallback also suggests that TOP does not always need to replace an incumbent competition platform end-to-end.

A potentially powerful adoption model is:

> Keep the organizer's familiar registration/bracket/result system where it works; let TOP initially solve the live operational layer.

The exact integration/product boundary requires strategic review.

## 15. Knockout-stage planning/import observation

The attempted knockout import exposed friction between planned knockout slots/placeholders and actual matches determined by prior results. External templates should not be invented without understanding existing TOP schema and generation dependencies.

Review questions:

- Does TOP already model planned match slots separately from actual matches?
- Is the current problem import UX, generation logic, or a domain-model gap?
- How should knockout operations inherit court/referee plans without prematurely creating incorrect actual matches?

## 16. Human factors and lineup UX

Captain/leader digital ability varies substantially. For some competitions, forcing every captain to learn system terminology and workflows can cost more operational attention than it saves.

A useful design direction is to make captain interaction feel like simple confirmation rather than “learning a tournament system”. However, competition-specific workflow exposure should remain configurable; centralized Master-assisted lineup entry may be the better operating mode for some events.

## 17. Capability validation classification for post-event review

Each observed capability should be reviewed rather than automatically expanded. A useful classification is:

1. required and effective;
2. required but operationally/UX insufficient;
3. conditionally required depending on competition configuration;
4. currently redundant in the live workspace;
5. should leave the current workspace / be deprecated or repositioned.

This is particularly important because feature count is not the same as operational value.

## 18. Architecture hypothesis — configurable Competition Operating System

Today's evidence strengthens, but does not yet approve, a possible long-term structure such as:

**Core + Capability Modules + Competition Configuration + Operational Workspaces**

AI could eventually assist with understanding competition context, selecting/configuring validated capabilities, identifying readiness gaps, generating workspaces, and supporting live decisions.

The competitive advantage would then be not merely feature count, but a library of validated competition capabilities plus reliable orchestration.

This remains an **architecture/product hypothesis** pending Canon review.

## 19. Required follow-up reviews

This parent review should eventually derive focused work in several streams:

### Production RCA

Determine the exact cause of the `get_full_dashboard` connection resets/incomplete responses and any associated runtime degradation.

### Competition Simulation / Stress Validation

Create a reproducible 9.12-scale opening-phase simulation before another comparable production trial.

### Operational Product Review

Review batch dispatch, post-dispatch adjustment, correction/recovery, external-result transfer closure, Master consistency, lineup UX, readiness, and attention signalling.

### Architecture Impact Assessment

For every proposed concept, determine whether it is:

1. already implemented;
2. an Operational View/projection gap;
3. an extension of an existing model;
4. genuinely a new domain concept;
5. an architecture change.

Priority remains:

**Existing Model Extension > New Concept Introduction > Architecture Change.**

### Local / DR / Go-to-Market Review

Define the long-term role of TOP Local as a useful standalone runtime, emergency continuity path, and market hook, including coexistence with external systems such as 网球记.

## 20. Questions for TOP Canon Review

For each observation in this document:

1. What capability already exists in TOP?
2. What is implemented but was not operationally usable?
3. What is only missing from the appropriate Operational View?
4. What can be expressed by extending an existing model?
5. What genuinely requires a new concept?
6. Does any proposal conflict with current Canon or Engineering Design?
7. What should become Product backlog, Engineering work, Knowledge, Canon, or no action?

## 21. Review discipline

Do **not** convert this document wholesale into implementation work.

The value of 9.12 is that it provides real field evidence. The next responsibility is to preserve that evidence while preventing local observations from accidentally distorting TOP's existing architecture.

This review is therefore the evidence anchor for the next stage of TOP evolution.
