# TOP Legacy Capability Mapping

## 1. Purpose

This document defines how the business capabilities validated by TOP Legacy relate to the TOP Modern business domains. It treats Legacy as evidence of useful tournament practices rather than as a model to reproduce unchanged.

This is a business architecture mapping only. It does not redefine the mission established by `TOP-Mission-Alignment.md` or the responsibilities established by `TOP-Business-Domain-Boundary.md`. Those documents remain authoritative for platform purpose and domain boundaries.

## 2. Mapping Principles

- **Preserve validated business value, not Legacy structure.** Modern should retain the operational outcomes proven in real competition use without carrying forward accidental overlaps in responsibility.
- **Assign responsibility by business meaning.** A Legacy capability may contribute to more than one Modern domain when its workflow creates both an operational outcome and an authoritative record.
- **Distinguish action from evidence.** The domain that performs or coordinates an activity is not necessarily the domain that preserves the trusted account of that activity.
- **Keep external authority explicit.** Referencing information from another business does not transfer ownership of that information or business responsibility to TOP.

## 3. Legacy Capability Evolution

Legacy capabilities evolved from a focused match tool into a broader tournament operations capability:

```text
Single Match Scoring
        ↓
Referee Workflow
        ↓
Master Operation
        ↓
Team Lineup and Check-in
        ↓
Trusted Competition Record
```

This sequence expresses cumulative business learning, not a set of replacement stages. Each step broadened the operational context in which the earlier capabilities created value.

### 3.1 Single Match Scoring

Single Match Scoring established the ability to follow a match as it was played, capture its score, and confirm its outcome. It validated the match as a unit of live competition work rather than merely a planned item.

### 3.2 Referee Workflow

Referee Workflow placed scoring within an accountable officiating process. It connected the referee's assignment, readiness, match execution, and confirmation, showing that a trustworthy result depends on a clear official responsibility chain.

### 3.3 Master Operation

Master Operation expanded the view from one match to the coordination of the tournament floor. It validated the need for a responsible operator to understand match, court, referee, participant, timing, and exception conditions together and to direct the next operational action.

### 3.4 Team Lineup

Team Lineup connected the team expected by the competition context with the people expected to participate in a particular competitive activity. It validated lineup confirmation as an operational readiness fact, while leaving team eligibility and competition rules with their appropriate business authority.

### 3.5 Check-in

Check-in added explicit evidence that a participant had arrived, acknowledged applicable participation expectations, and was available for competition activity. It moved participant presence from assumption to a visible readiness condition for tournament operation.

### 3.6 Trusted Competition Record

Trusted Competition Record is the business outcome created when competition context, participant readiness, official responsibility, match execution, result confirmation, and important events can be understood as a coherent account. It extends beyond the final score by preserving why the competition outcome can be relied upon.

## 4. Capability-to-Domain Mapping

The following table identifies the primary Modern business home for each validated capability and any domain that contributes necessary context or preserves resulting evidence.

| Legacy capability | Primary Modern business domain | Supporting Modern business domain(s) | Business relationship |
|---|---|---|---|
| Single Match Scoring | Tournament Operations | Competition Context; Trusted Competition Record | Tournament Operations owns live match execution and result confirmation. Competition Context supplies the match and rules frame; Trusted Competition Record preserves the authoritative account. |
| Referee Workflow | Tournament Operations | Platform Governance; Trusted Competition Record | Tournament Operations coordinates assignment, readiness, execution, and handoff. Platform Governance establishes authorized authority where applicable; Trusted Competition Record preserves official responsibility and confirmation. |
| Master Operation | Tournament Operations | Platform Governance; Competition Context; Trusted Competition Record | Tournament Operations owns overall live coordination and exception decisions. Platform Governance authorizes the responsible operator, Competition Context supplies the competition frame, and Trusted Competition Record preserves significant operational facts. |
| Team Lineup | Participant Readiness | Competition Context; Trusted Competition Record | Participant Readiness owns confirmation of who is expected to compete. Competition Context supplies the relevant event, match, team, and rule context; Trusted Competition Record preserves the confirmed readiness fact. |
| Check-in | Participant Readiness | Tournament Operations; Trusted Competition Record | Participant Readiness owns arrival, acknowledgement, and availability confirmation. Tournament Operations uses readiness in live coordination; Trusted Competition Record preserves participant-protection evidence. |
| Trusted Competition Record | Trusted Competition Record | Competition Context; Tournament Operations; Participant Readiness; Platform Governance | The record domain preserves the authoritative business account assembled from contextual, operational, readiness, and authority facts without taking over the responsibilities that create those facts. |

### 4.1 Domain View of the Mapping

- **Platform Governance** contributes organization ownership, administrative authority, and authorization of Master-level responsibility. It does not operate matches or determine participant readiness.
- **Competition Context** provides the identity, structure, match definition, rules, and schedule references needed to interpret Legacy operational activity. It does not own live execution.
- **Tournament Operations** is the primary home of Single Match Scoring, Referee Workflow, and Master Operation because these capabilities coordinate live competition activity.
- **Participant Readiness** is the primary home of Team Lineup and Check-in because these capabilities confirm who is prepared and available to participate.
- **Trusted Competition Record** preserves the authoritative evidence produced across the other domains. It owns the coherent record, not the underlying operational, readiness, contextual, or governance decisions.

## 5. Legacy Gaps Modern Must Address

The validated Legacy capabilities provide a foundation, but Modern must improve the following business outcomes.

### 5.1 Long-term Archive

Legacy demonstrated the value of retaining scores and operational facts, but Modern must treat post-event continuity as an intentional business responsibility. Competition records should remain understandable, attributable, reviewable, and durable after immediate tournament operations have ended. Long-term archive does not mean that TOP owns every upstream source document or every external historical record.

### 5.2 Participant Communication

Legacy workflows primarily made participant state visible to operators. Modern must establish clearer participant-facing communication outcomes for readiness requests, lineup confirmation, expected actions, schedule-related operational notices, and acknowledged changes. TOP owns communications that are necessary to coordinate TOP-managed tournament activity; general marketing, community engagement, and unrelated messaging remain outside its boundary.

### 5.3 Live Data Output

Legacy captured valuable live facts, but Modern must clearly distinguish operational data made available for authorized consumers from media production or distribution. TOP should provide dependable, timely business outputs about TOP-managed competition activity while retaining a clear boundary from websites, broadcast production, streaming, and other media-platform responsibilities.

### 5.4 Clear Business Boundaries

Legacy combined responsibilities around convenient workflows. Modern must make ownership explicit when a workflow crosses competition context, live operations, participant readiness, governance, and recordkeeping. Each fact should have a recognizable business authority; using a fact in another domain must not create duplicate ownership or silently expand TOP into registration, ranking, media, legal, insurance, or regulatory functions.

## 6. Record Ownership Principle

TOP's record responsibility is determined by business authority, not simply by whether information is visible during a TOP workflow.

### 6.1 What TOP Owns

TOP owns the authoritative records of business activity performed within its established boundary, including:

- Master and referee operational actions carried out through TOP-managed tournament workflows;
- live match status, score capture, result confirmation, and operational exceptions managed by TOP;
- check-in, availability, lineup confirmation, and participant acknowledgements captured as part of readiness;
- the responsibility chain and event timeline needed to explain how a TOP-managed competition activity unfolded; and
- the durable Trusted Competition Record assembled from those owned facts and the context needed to interpret them.

Ownership means TOP is accountable for the integrity, attribution, continuity, and appropriate stewardship of these records as business evidence.

### 6.2 What TOP References

TOP references information whose authority belongs elsewhere but is necessary to operate or interpret a tournament, including:

- participant entry information received from a registration authority;
- competition definitions, eligibility decisions, rules, schedule plans, or ranking information governed by another authorized source; and
- organization policies, acknowledgement wording, or other externally governed requirements used during readiness workflows.

A reference provides context for TOP's work. TOP may preserve which reference informed an owned action or record, but it does not become the authority for the referenced information merely by using or retaining it.

### 6.3 What Remains Outside the TOP Boundary

The following responsibilities remain outside TOP even when TOP exchanges or presents related information:

- participant recruitment, entry sales, payment, and the broader registration service;
- external ranking authority and ownership of ranking policy where that authority is assigned elsewhere;
- creation of legal, insurance, safeguarding, or regulatory policy and judgments about their legal sufficiency;
- media production, public websites, streaming, broadcast, and audience distribution; and
- the authoritative records of external organizations except for the references needed to support TOP-owned competition records.

External owners remain accountable for these responsibilities and their source records. TOP's responsibility is limited to using appropriate references and preserving the provenance needed to understand its own decisions and records.

## 7. Architecture Guardrails

Future business decisions involving Legacy capabilities should confirm that:

1. the validated operational outcome is preserved without treating Legacy structure as the target;
2. the primary domain remains accountable for the business action;
3. Trusted Competition Record preserves evidence without absorbing another domain's responsibility;
4. referenced information retains its external business authority; and
5. a proposed improvement does not expand TOP beyond the mission and domain boundaries already defined by the governing architecture documents.

## 8. Scope and Cross-References

This document contains no technical design and makes no decision about code, data storage, interfaces, or implementation. For governing context, read it with:

- `TOP-Mission-Alignment.md` for TOP's mission and platform position; and
- `TOP-Business-Domain-Boundary.md` for the authoritative definitions and boundaries of the Modern business domains.

---

**Status:** Business Architecture Reference Document
**Last Updated:** 2026-08-05
