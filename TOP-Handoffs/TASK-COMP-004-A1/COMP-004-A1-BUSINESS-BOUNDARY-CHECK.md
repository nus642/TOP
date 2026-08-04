# COMP-004-A1 Business Boundary Check

**Task:** TASK-COMP-004-A1 — Contest Identity / Configuration Reference Policy

**Artifact type:** Business boundary analysis only

**Review assumption:** Competition operations are managed externally by the Master / event operation process. TOP receives the final effective competition facts and preserves the information required for official records and historical reference.

**Decision status:** This analysis does not confirm or alter ID-1, ID-2, or ID-3. It introduces no policy decision.

---

## 1. Current COMP-004-A1 Understanding

The current COMP-004-A1 material focuses on three related concerns:

- **Contest identity:** the business meaning by which a contest is understood as the same contest rather than a distinct contest.
- **Continuity:** the interpretation of that meaning when a permitted business change has occurred.
- **Historical interpretation:** the ability to understand contest, assignment, execution, participation, and official-result facts in the context to which they applied.

These concerns were framed to prevent technical choices from silently deciding business meaning. They remain unconfirmed decision topics: ID-1 addresses contest identity meaning, ID-2 applies that meaning to permitted changes, and ID-3 bounds the competition modes or contexts in which the confirmed meaning applies.

The stated operating assumption requires a boundary validation before those concepts are used to shape TOP's responsibility. In particular, a need to interpret final official information must not be treated as a need for TOP to own the operational history that produced it. Contest identity and continuity may still matter to the trustworthiness of an official record, but they should not, merely by being discussed in COMP-004-A1, expand TOP into the operator of competition changes.

This check therefore separates two questions that can otherwise be conflated:

1. What the external Master / event operation process changes or decides while operating the competition.
2. What final effective facts, confirmation, evidence, and historical meaning TOP needs for an official record.

The check does not answer ID-1, ID-2, or ID-3. It identifies that their relevance and required depth must be validated against this separation of responsibilities.

## 2. External Competition Operation Boundary

Under the review assumption, the Master / event operation process manages the competition as an external operational responsibility.

- **Master creates and updates competition information.** This includes match generation, scheduling, participant replacement, court or location changes, cancellation, regeneration of match information, and operational corrections.
- **Referee receives operational instructions and executes matches.** The referee acts on the effective instructions supplied through competition operations and provides the confirmation associated with the match and its result.
- **Temporary operational changes are handled outside TOP.** Intermediate instructions, provisional arrangements, replaced plans, and other transient states remain matters for the external operation process unless a separate business requirement establishes that a particular item is part of the official record.

Accordingly, TOP does not:

- manage operational changes;
- decide whether a proposed operational change is allowed;
- control competition workflows;
- generate or regenerate operational match information;
- direct participant replacement, scheduling, court/location movement, or cancellation; or
- replace the Master system.

Receiving a final effective fact does not transfer ownership of the preceding operation to TOP. Likewise, preserving an official record does not make TOP responsible for reconstructing every instruction, tentative value, or intermediate step through which the external operator arrived at that fact.

This boundary also narrows how change scenarios should be read in COMP-004-A1. Participant changes, schedule changes, cancellations, regeneration, and operational corrections are external occurrences supplied to the analysis; they are not TOP capabilities to be governed or designed by this task.

## 3. TOP Responsibility Boundary

TOP's responsibility begins with the effective competition information supplied for official recording and historical reference. The relevant business concern is whether the information retained by TOP remains trustworthy as an account of the official contest and result, not whether TOP can reproduce the external operational lifecycle.

Within that boundary, the information potentially relevant to preservation is:

- **Final effective contest information:** the competition facts that were effective for the contest represented by the official record.
- **Official competition result:** the result that has official standing, including the final valid result when an official result is corrected.
- **Referee confirmation:** the confirmation that connects the executed match and reported result to the responsible referee.
- **Supporting evidence:** the evidence required to substantiate the official result and any final valid correction, to the extent the business requires it.
- **Historical trustworthiness:** sufficient retained meaning to support later reading, verification, or dispute examination of the official record without silently substituting later or unrelated information.

This is a preservation boundary, not an operational one. It may require TOP to retain the effective facts on which an official record depends, but it does not by itself require retention of every prior operational value. The minimum final facts, evidence, and historical visibility required have not been confirmed by this analysis.

Contest identity and continuity are relevant only to the extent necessary to avoid ambiguity about what contest an official result describes, which final facts were effective for that result, and whether a later official correction changes the valid result associated with that record. Their presence in the current task must not be read as assigning TOP responsibility for deciding identity during day-to-day operational change.

## 4. Business Scenario Review

### Participant replacement

**External operation:** Master updates participant information and supplies the effective participant information to be used for the match.

**TOP responsibility:** TOP preserves the final effective participant information relevant to the official result, together with the result, referee confirmation, and required supporting evidence. This does not require TOP to authorize the replacement, conduct the replacement, or retain every superseded participant instruction.

**Boundary implication:** Treating replacement as an input fact avoids turning the scenario into a TOP-managed contest-continuity workflow. Whether any earlier participant information must remain visible for future verification is an open business requirement, not an assumption made here.

### Schedule or court change

**External operation:** Master changes execution information such as date, time, court, or location and communicates the effective instruction to the referee and other operational actors.

**TOP responsibility:** TOP preserves the final effective schedule, court, or location information only if it is required to make the official record complete, interpretable, or verifiable.

**Boundary implication:** TOP does not need to manage the move or keep a complete sequence of provisional assignments merely because a change occurred. The business must identify which execution facts, if any, form part of the official record and which remain external operational detail.

### Contest cancellation

**External operation:** Master cancels the contest and handles the operational consequences outside TOP.

**TOP responsibility analysis:** The current operating assumption does not establish that TOP must preserve cancellation history. A cancelled contest may never produce an official competition result, referee confirmation, or evidence requiring an official TOP record. On that basis, cancellation history cannot be presumed to fall within TOP's preservation responsibility.

If cancellation affects an already existing official result or another record that TOP must retain, the historical consequence would require a specific business requirement. This analysis neither supplies that requirement nor decides how the consequence should be represented. Cancellation therefore exposes a boundary question rather than a presumed TOP recordkeeping duty.

### Result correction

**External operation:** The authorized external process identifies and communicates a correction to an official result. The operation, permission to correct, and operational handling remain outside TOP.

**Why this differs:** Unlike a temporary participant, schedule, or court change, a result correction changes information for which TOP has an official-record preservation responsibility. It can affect which result is the final valid result and what an authorized reader should rely on later.

**TOP responsibility:** TOP needs to preserve the final valid official result, the associated referee confirmation, and the supporting evidence required to substantiate that result. Historical trustworthiness may also require the record to remain understandable after the correction, but the extent of prior-result visibility and evidence retention remains a business question.

**Boundary implication:** The need to preserve a corrected official result does not make TOP the authority that permits, approves, or conducts the correction. It distinguishes result-record integrity from general competition operation without defining an approval process, workflow, or implementation mechanism.

## 5. Risk of Scope Expansion

Without an explicit separation between external operations and TOP record preservation, COMP-004-A1 could accidentally broaden TOP's role in several ways.

- **Managing the contest lifecycle:** Describing every operational event as something TOP must govern could make TOP responsible for generation, scheduling, replacement, cancellation, and regeneration rather than a recipient of effective facts.
- **Deciding contest identity during operational changes:** Applying ID-1 and ID-2 to each external adjustment as a TOP decision could turn historical interpretation questions into operational control. This would exceed the assumption that Master operates the competition.
- **Tracking all intermediate changes:** Equating historical trustworthiness with a complete operational event history could require TOP to store provisional or transient instructions even when they have no established official-record value.
- **Becoming a competition management system:** Combining change permissions, workflow control, lifecycle status, identity decisions, and operational history would cause TOP to duplicate or replace Master.

Scope expansion is also possible through terminology. References to “continuity,” “correction,” “cancellation,” “replacement,” or “regeneration” can sound like proposed TOP capabilities even when they are intended only as external scenarios. Each use should therefore be tested against the narrower question: what final effective fact or official-record meaning must TOP preserve?

The boundary check suggests that COMP-004-A1 should not assume that every externally meaningful contest change creates a TOP historical requirement. Conversely, narrowing the boundary does not justify losing the official result, referee confirmation, required evidence, or the meaning needed to trust that official record. The exact dividing line remains subject to the open business questions below.

This analysis does not define identifiers, database structures, schemas, APIs, workflows, approval processes, implementation architecture, or any other technical mechanism. It does not revise existing COMP-004-A1 decisions, confirm the open decision questions, or introduce a new policy.

## 6. Open Business Questions

- Which final competition facts must TOP retain?
- Which evidence is required to support official results?
- Which referee confirmation information must remain associated with an official result?
- Which changes must remain visible after completion?
- Which historical information is required for future verification?
- Which participant facts are part of the official record rather than temporary operational information?
- Which schedule, court, or location facts are required to interpret or verify an official record?
- Does TOP require any record of a contest that is cancelled before an official result exists?
- When cancellation affects an existing official record, what historical information must remain available?
- When an official result is corrected, must the previously official result remain visible?
- What supporting evidence must be retained for the final valid corrected result?
- What minimum contest meaning must remain available to connect the final effective facts, referee confirmation, evidence, and official result?
- Which externally supplied corrections affect an official TOP record, and which remain operational corrections outside TOP?
- At what point is information final and effective for TOP's official-record responsibility?
- Who is the authoritative source that declares competition information final and effective for TOP?
