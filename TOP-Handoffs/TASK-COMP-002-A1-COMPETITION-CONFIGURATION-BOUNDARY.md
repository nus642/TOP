# TASK-COMP-002-A1 Handoff Package

## Competition Configuration Boundary

**Task:** TASK-COMP-002-A1  
**Deliverable:** Domain-boundary handoff; documentation only  
**Evidence base:** `TOP-Handoffs/LEGACY-COMPETITION-CONFIGURATION-ANALYSIS.md`  
**Status:** Ready for boundary review; not an implementation specification

---

## 1. Purpose and governing principle

This handoff defines ownership around configured competition structure and its relationships with Registration, Scheduling, Match Operations, and Competition Result Recording.

> **TOP is a domain fact system, not a workflow engine.**

TOP records authoritative facts and the provenance needed to interpret them. It does not own a tournament operator's sequence of screens, approval queues, dispatch choreography, polling loops, or status-driven process. A command may create or supersede a fact, but the command sequence is not itself the domain model.

This package draws a modern boundary from the legacy evidence. It does not promote legacy JSON buckets, page behavior, status labels, or permissive fallbacks into domain concepts, and it does not invent rules where the evidence is silent.

---

## 2. Boundary decision

### 2.1 Competition Configuration owns

Competition Configuration is the authoritative owner of facts that answer:

> **What contests and competitive structures have been configured, between which eligible entrants, and under which declared competition rules?**

It owns:

- competition identity within an event and its entrant kind: individual/pair or team;
- configured categories, divisions, pools, or groups, once their meanings are explicitly distinguished;
- accepted entrant placement in a configured group or competition position;
- configured contest identity and the opposing entrant sides;
- the structural relationship of a contest to a group, stage, round, or team encounter, where those concepts are explicitly configured;
- match discipline/kind such as singles or doubles;
- configured match rules supplied for the contest, including games format, scoring method, target, and cap where applicable;
- configured team encounter identity, opposing teams, ordered rubber template, and each rubber's intended discipline and rules;
- the resolved competitive composition of a team encounter, including which declared lineup positions form each configured rubber;
- explicit pairing-generation policy and the resulting pairings, when TOP is authorized to apply such a policy;
- provenance for configuration facts, such as authoritative import, operator command, or accepted external allocation;
- replacement or supersession relationships when configured facts change. Historical truth should not be represented solely by destructive overwrite.

The legacy evidence supports individual/team mode, intra-group all-play-all pairing, match/rubber structure, and limited scoring configuration. It does **not** support assuming a general bracket, round, draw, seeding, standings, advancement, or team-victory model.

### 2.2 Competition Configuration does not own

It does not own:

- person identity, team registration, accepted entry, roster membership, check-in, or eligibility determinations;
- court, referee, date/time, availability, dispatch, or reassignment facts;
- actual participants who took the court when they differ from configured/declarative inputs;
- live points, service, games, completion, or the played outcome;
- the official competition result record, its source evidence, or correction history;
- standings, ranking, qualification, or advancement unless a later boundary explicitly assigns those facts;
- actor permissions or the application workflow by which facts are entered;
- UI statuses such as `team_confirming` or `completed`;
- spreadsheet parsing heuristics, generated identifier formats, JSON storage layout, or hard-coded legacy defaults.

### 2.3 Ownership test

Use this test when a field appears ambiguous:

| Question answered by the fact | Owner |
|---|---|
| Who/what is registered, accepted, rostered, checked in, or eligible? | **Registration** |
| Who is configured to contest whom, in what structural slot, under what declared rules? | **Competition Configuration** |
| When and where will it occur, and which resource is assigned? | **Scheduling** |
| What actually happened while the match was played? | **Match Operations** |
| What is the durable official competition result and its recording history? | **Competition Result Recording** |

The screen, actor, API request, or legacy object containing the field does not change the answer.

---

## 3. Core fact vocabulary

The following is a conceptual vocabulary, not a required class or database design.

| Fact concept | Meaning | Evidence status |
|---|---|---|
| Competition | The configured competitive context within an event | Supported, though thin in legacy |
| Entrant reference | Reference to a Registration-owned accepted individual, pair, or team entry | Boundary decision |
| Group membership | Placement of an entrant in a configured group/pool | Supported |
| Configured contest | Stable fact that two sides are intended opponents under stated match rules | Supported |
| Pairing policy | Rule used to derive pairings, such as one meeting for every unordered pair within a group | Only legacy all-play-all is supported |
| Team encounter | Configured contest between two team entrants | Supported |
| Rubber template | Ordered intended disciplines/slots within a team encounter | Supported but weakly enforced in legacy |
| Declared lineup | A Registration-owned declaration of players for encounter slots | Ownership clarified below |
| Resolved rubber composition | Competition Configuration's mapping of corresponding valid lineup slots into a configured contest | Supported conceptually; legacy index reconciliation must not be copied blindly |
| Configuration provenance | Source and actor/reference explaining how a fact entered TOP | Required fact-system concern |
| Supersession | Relationship stating that a newer configuration fact replaces an earlier one | Boundary decision; policy remains open |

Names such as “group,” “category,” and “division” must not remain interchangeable merely because legacy used one `group` string for several meanings.

---

## 4. Relationship with Registration

### 4.1 Ownership split

Registration owns the existence and standing of competition subjects:

- player/person registration identity;
- team entry and roster membership;
- accepted competition entry;
- eligibility and check-in facts;
- a team's declared lineup and declaration evidence, including declarer, signature/evidence reference, and declaration time.

Competition Configuration references Registration facts; it does not copy them into a second source of truth. It owns how an accepted entrant is placed into competition structure and how eligible declarations are resolved into contests.

The lineup distinction is deliberate:

- **Registration owns:** “Team T declared players P1/P2 for encounter slot 1.”
- **Competition Configuration owns:** “Configured rubber R1 of encounter E uses the accepted declarations for the two opposing slot-1 sides.”
- **Match Operations owns:** “These participants actually contested R1.”

### 4.2 Facts consumed from Registration

Competition Configuration may consume stable references to:

- accepted entrant identity and entrant kind;
- team identity and current roster facts;
- eligibility facts applicable at configuration time;
- declared lineup slots and their evidence;
- withdrawal or ineligibility facts that may justify a new configuration decision.

Consumption does not transfer ownership. A later Registration change does not silently rewrite an already recorded configuration fact. Whether it requires a new or superseding configuration is an explicit application command and policy decision.

### 4.3 Facts exposed to Registration

Registration may use configured competition/encounter identifiers and lineup requirements so it can accept a declaration against the correct context. Competition Configuration does not orchestrate declaration reminders, submission screens, or “waiting for both teams” states.

### 4.4 Prohibited coupling

- Do not treat a player row carrying a group label as Registration owning group structure.
- Do not embed mutable roster snapshots as the identity of a configured entrant.
- Do not infer eligibility merely because a name appears in an imported pairing.
- Do not make Competition Configuration responsible for check-in.
- Do not turn lineup collection into a competition workflow state machine.

---

## 5. Relationship with Scheduling

### 5.1 Ownership split

Competition Configuration creates or records a schedulable contest. Scheduling decides its placement and resource assignments.

- **Competition Configuration owns:** contest identity, opposing sides, structural context, discipline, and configured rules.
- **Scheduling owns:** scheduled date/time, court, referee assignment, dispatch/readiness assignment, rescheduling, and assignment history.

A configured contest can exist without a schedule. A scheduling assignment cannot redefine the contest's opponents or rules; such a change requires a new or superseding Competition Configuration fact.

### 5.2 Facts exposed to Scheduling

Scheduling may consume a schedulable-contest reference plus constraints that genuinely arise from competition structure, for example:

- contest identity and sides;
- group/stage/round reference when explicitly configured;
- discipline and format needed to select appropriate resources or duration assumptions;
- dependency facts, but only if a future competition model explicitly supports them.

Scheduling owns its derived planning decisions. Competition Configuration does not own a court merely because a legacy task stores court and pairing together.

### 5.3 Facts consumed from Scheduling

Competition views may read scheduling assignments to present a combined operational view. Those are Scheduling-owned facts joined by contest identity, not duplicated competition facts.

### 5.4 Prohibited coupling

- Do not require a date, court, or referee to create a configured contest.
- Do not call bulk task dispatch “match generation” when it is assignment/dispatch behavior.
- Do not use task queue presence or court state as the lifecycle of competition configuration.
- Do not let rescheduling mutate opponents, group membership, or match rules.
- Do not infer tournament rounds from generated counters or schedule order.

---

## 6. Relationship with Match Operations

### 6.1 Ownership split

Competition Configuration declares the contest that may be played. Match Operations records the facts of execution.

- **Competition Configuration owns:** intended opposing sides, configured discipline/format/rules, encounter/rubber relationship, and configured participant declarations by reference.
- **Match Operations owns:** operational match context, actual participants, start and completion, service and scoring progression, games, confirmed match outcome, and confirmation evidence.

Match Operations consumes an immutable or version-addressable configuration reference so execution can be interpreted against the rules that applied. It must not rely on a mutable “current configuration” that can retroactively change a played match.

### 6.2 Facts exposed to Match Operations

The minimum boundary handoff is conceptually:

```text
ConfiguredContestReference
- contest identity
- configuration version/reference
- opposing entrant-side references
- discipline/kind
- applicable game and scoring configuration
- structural context (optional group/encounter/rubber references)
```

This is not an execution command or a queue item. Scheduling separately provides placement/assignment facts. The application layer may assemble both sets of facts when preparing operations.

### 6.3 Facts consumed from Match Operations

Competition Configuration may reference execution facts for audit or to determine whether a proposed reconfiguration is permissible under future policy. It does not own the confirmed outcome and does not automatically advance, generate, or schedule another contest merely because an outcome arrived.

If future advancement exists, an authorized decision may consume official results and create new configuration facts. That is fact derivation under explicit competition policy, not a result-triggered workflow engine.

### 6.4 Prohibited coupling

- Do not put live score or completion status on the configured contest aggregate.
- Do not equate configured sides with actual match participants.
- Do not have Competition Configuration confirm winners.
- Do not model “ready → playing → completed” as configuration states.
- Do not mutate rules or participants retroactively after execution; create traceable superseding facts where policy permits.

---

## 7. Relationship with Competition Result Recording

### 7.1 Ownership split

Competition Result Recording is the authoritative owner of the durable official competition record. Competition Configuration supplies the structural meaning of the contest to which the record refers.

- **Competition Configuration owns:** what was configured to be contested and its versioned structural/rule context.
- **Match Operations produces:** confirmed outcome and evidence from execution.
- **Competition Result Recording owns:** the official record, source preservation, manual-entry provenance, and additive correction history.

The official record references a configured contest. It must remain interpretable even if later configuration is superseded.

### 7.2 Fact flow

```text
Registration facts
      │ references
      ▼
Competition Configuration facts ─────► Scheduling assignments
      │ configuration reference                 │
      └──────────────────┬──────────────────────┘
                         ▼
                  Match Operations
                         │ confirmed outcome + evidence
                         ▼
             Competition Result Recording
```

For an authorized master-entered result without a Match Operations outcome, Competition Result Recording still references the configured contest and records the manual source. Competition Configuration does not fabricate an execution record to complete the chain.

### 7.3 Results do not silently reconfigure competition

An official result does not by itself:

- change group membership;
- create standings or rankings;
- advance an entrant;
- create a semifinal/final;
- schedule a successor contest;
- mark configuration “completed.”

Those effects require separately owned facts and explicit policies. Legacy absence of advancement behavior must be preserved as an evidence gap rather than filled with an implicit workflow.

### 7.4 Prohibited coupling

- Do not store the official score or winner as Competition Configuration facts.
- Do not make result correction rewrite the historical contest configuration.
- Do not have configuration deletion erase official result context.
- Do not infer team encounter outcome aggregation from `is_team` or the default three-rubber UI.

---

## 8. Commands, facts, and actors

Master and team leader are actors, not domain owners. Authorization belongs to the application layer; successful commands produce facts in their owning boundaries.

| Actor action | Resulting fact owner |
|---|---|
| Master selects individual/team mode | Competition Configuration |
| Master imports or generates group pairings | Competition Configuration for accepted facts; parser behavior remains application/integration detail |
| Master assigns court/date/referee | Scheduling |
| Team leader declares a lineup | Registration |
| Competition authority resolves declarations into rubbers | Competition Configuration |
| Referee records execution and confirms outcome | Match Operations |
| Master manually records an official result | Competition Result Recording |

Buttons such as “parse and dispatch,” forced placeholder tasks, modal confirmations, and page order are not cross-domain contracts.

---

## 9. Fact-oriented integration rules

1. **Reference facts by stable identity and version.** Cross-boundary consumers must not depend on a mutable legacy blob.
2. **Preserve provenance.** Record the authoritative source or actor reference without making the actor the owner.
3. **Do not duplicate ownership.** Read models may join facts, but each write has one authoritative boundary.
4. **Do not cascade silently.** A changed registration, schedule, outcome, or official record does not mutate configuration without an explicit authorized command.
5. **Prefer additive history.** Supersession and correction references preserve what was previously asserted.
6. **Separate validation from orchestration.** A boundary may reject inconsistent facts; it does not manage a multi-screen process.
7. **Treat missing legacy behavior as unknown.** Do not invent bracket, standings, advancement, or team aggregation rules.
8. **Keep application coordination outside the domain.** Waiting, retrying, polling, notification, and approval routing are not domain facts.

---

## 10. Example classifications

| Statement | Classification |
|---|---|
| Entrant A is accepted for competition C | Registration fact |
| Entrant A is placed in group G | Competition Configuration fact |
| Entrant A will contest entrant B in contest M | Competition Configuration fact |
| M is best-of-three games to the configured score | Competition Configuration fact |
| M is assigned to court 2 at 10:00 with referee R | Scheduling fact |
| Players P1 and P2 actually started M | Match Operations fact |
| P1 won M with the confirmed game scores | Match Operations outcome fact |
| Official record O records P1 as winner, sourced from that outcome | Competition Result Recording fact |
| O was corrected by record O2 | Competition Result Recording fact |
| The operator is waiting for the second lineup | Application observation, not a domain lifecycle fact |
| Room status is `completed` | Legacy coordination detail, ambiguous without a domain fact |

---

## 11. Explicit non-goals

TASK-COMP-002-A1 does not:

- define production types, persistence schemas, APIs, events, or services;
- introduce or modify production code;
- define a general competition lifecycle or workflow;
- design draws, seeding, knockout brackets, standings, ranking, advancement, or qualification;
- decide team encounter victory, early-stop, forfeiture, substitution, or incomplete-lineup policy;
- decide configuration publication, approval, locking, effective-time, or correction policy;
- redefine the already established ownership of Registration, Scheduling, Match Operations, or Competition Result Recording;
- treat Master as a domain.

---

## 12. Open business decisions before implementation design

The following require explicit decisions and must not be inferred from legacy behavior:

1. Exact distinctions among category, division, class, pool, and group.
2. Whether accepted entry placement is performed inside TOP or merely imported as an authoritative external fact.
3. Supported pairing policies beyond the evidenced single round-robin meeting.
4. Whether and how configured contests can be withdrawn, replaced, or corrected after scheduling or execution.
5. Configuration version, effective-time, publication, and authorization policy.
6. Lineup amendment and substitution rules, including their ownership timing relative to actual participation.
7. Validation rules for opposing team lineup slots and match formats.
8. Any stage, round, bracket, advancement, standings, or ranking model.
9. Team encounter aggregation and termination rules.
10. Handling of byes, withdrawals, walkovers, abandoned contests, and redraws.

These are future design inputs, not missing workflow states.

---

## 13. Acceptance checklist

The boundary is ready for later design only when reviewers agree that:

- [ ] Competition Configuration owns configured structure, pairings, contest rules, encounter/rubber composition, and configuration provenance.
- [ ] Registration remains authoritative for entrants, rosters, eligibility, check-in, and declared lineups.
- [ ] Scheduling remains authoritative for time, court, referee, dispatch, and assignment history.
- [ ] Match Operations remains authoritative for actual execution, participants, scoring, completion, confirmed outcomes, and evidence.
- [ ] Competition Result Recording remains authoritative for official records, sources, and additive correction history.
- [ ] Cross-boundary references do not transfer fact ownership.
- [ ] No legacy status, screen, parser, task bucket, or actor role has been promoted into a domain owner.
- [ ] No unsupported draw, stage, round, advancement, standings, or team-outcome rule has been inferred.
- [ ] The design principle remains explicit: **TOP is a domain fact system, not a workflow engine.**

---

## 14. Handoff conclusion

Competition Configuration is the source of truth for the declared competitive structure: which accepted entrants occupy which configured positions, which sides are paired, how contests relate to groups or team encounters, and which rules define those contests. It consumes Registration facts, exposes schedulable contests to Scheduling, supplies versioned contest context to Match Operations, and gives Competition Result Recording the stable structural reference needed for an official record.

Every neighboring boundary retains its own facts. Coordination among them belongs in application behavior and fact consumption—not in a cross-domain tournament workflow engine.
