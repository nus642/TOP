# COMP-004-A1 Core Fact Ownership Check

**Task:** TASK-COMP-004-A1 — Contest Identity / Configuration Reference Policy

**Artifact type:** Business analysis only

**Decision status:** This analysis does not confirm ID-1, ID-2, or ID-3, introduce a policy, or define an implementation mechanism.

## 1. Purpose

This artifact validates the facts TOP actually needs to preserve and identifies the business actor or established boundary that establishes each fact. It applies the confirmed operating model in which the External Master / event operation handles competition operations, the referee executes the match and confirms the valid result, and TOP receives final effective competition information for trustworthy preservation.

The analysis distinguishes **establishing a fact** from **preserving a fact**. TOP's need to preserve final information does not make TOP the originator of that information, transfer ownership from an established boundary, or require TOP to retain the operational history that led to the final information.

This is a scope check, not a redesign of COMP-004-A1. It leaves all source-of-truth and disagreement questions stated below open.

## 2. Actual Operating Model

### Master responsibilities

The External Master / event operation operates the competition. It handles:

- match generation;
- scheduling;
- participant replacement;
- court and location changes;
- cancellation;
- regeneration; and
- other operational adjustments.

Through those responsibilities, the external operation establishes and communicates the competition information that is final and effective for use by the referee and receipt by TOP. This operational role does not make the Master the owner of facts that the established TOP business boundaries assign elsewhere.

### Referee responsibilities

The referee:

- executes the match using the effective competition information supplied through event operation; and
- confirms the valid result.

The referee therefore establishes the confirmation that the match was executed and that the reported result is valid. This responsibility is distinct from the External Master's operation of competition changes and from TOP's preservation of the resulting official information.

### TOP responsibilities

TOP:

- receives final effective competition information;
- preserves the final valid official result;
- preserves referee confirmation and supporting evidence; and
- supports future trust and verification of the preserved official record.

TOP does not establish operational adjustments merely because it receives their final effect. It does not recreate the external operation, and it does not need a complete history of how the external operation reached the final effective information.

## 3. Facts TOP Must Preserve

The categories below state the business information TOP must preserve without prescribing its form, representation, or handling mechanism.

### Final effective contest information

TOP must preserve the contest information that was final and effective for the match represented by the official result. The External Master / event operation supplies that effective information after handling generation and any operational adjustments. The required business outcome is that the preserved result can be understood against the contest information that actually applied, rather than against a superseded instruction or a later unrelated state.

This requirement concerns the final effective facts only. It does not require TOP to preserve earlier participant selections, schedule assignments, court assignments, regenerated versions, or other intermediate operational information.

### Final valid official result

TOP must preserve the result that is final and valid. The referee confirms the valid result; TOP preserves it as the official competition result under the established Competition Result Recording boundary.

When a result is corrected, TOP needs the corrected final valid result. TOP does not need the previous incorrect result or the process by which the correction was performed.

### Referee confirmation

TOP must preserve the referee confirmation associated with the final valid result. The referee establishes that confirmation through execution of the match and confirmation of its valid result. TOP's responsibility is to retain the confirmation so the official result does not stand as an unsupported assertion by TOP.

This requirement does not decide what form confirmation takes or what details it contains.

### Evidence supporting the result

TOP must preserve the supporting evidence required for the final valid result, including the evidence supporting a corrected final valid result. The evidence supports the result and its referee confirmation; it does not transfer authority to TOP to create, approve, or alter the underlying match facts.

What evidence is sufficient remains an open business question. Competition-wide risk acknowledgement documents are not evidence for an individual contest or result: they belong to registration/check-in for the competition as a whole.

### Information needed for future verification

TOP must preserve enough final information to allow a future authorized reader to determine what official result is valid, what final effective contest information it concerns, that the referee confirmed it, and what supporting evidence substantiates it.

Future verification requires a trustworthy relationship among those final facts. It does not, by itself, require reconstruction of operational changes, retention of intermediate versions, or preservation of an incorrect result and its correction process. The precise minimum information needed remains open and must be derived from verification needs, not from an assumption that all external activity must be copied into TOP.

## 4. Facts TOP Does Not Need to Preserve

Within the confirmed current scope, TOP does not need to preserve:

- **participant replacement history:** prior participants, replacement sequences, or the reasons and operation behind a replacement;
- **schedule-change history:** prior or provisional dates and times, or the sequence by which the final schedule was reached;
- **court-change history:** prior courts or locations, or the sequence by which the final placement was reached;
- **regeneration history:** prior generation runs, regeneration steps, or relationships among operational generation attempts;
- **intermediate contest versions:** provisional, superseded, or otherwise non-final operational descriptions of a contest;
- **cancellation history and reasons:** TOP currently does not need to record a cancellation or its reason;
- **previous incorrect results and the correction process:** TOP needs only the corrected final valid result and its supporting evidence; and
- **competition-wide risk acknowledgement as contest evidence:** risk acknowledgement belongs to registration/check-in for the whole competition and is not evidence supporting an individual contest or result.

Excluding these facts does not decide how the External Master / event operation handles them. It means only that they are not currently required for TOP's official-result preservation responsibility.

## 5. Source-of-Truth Questions

The operating model identifies fact-establishing roles but does not yet answer all authority and conflict questions. The following remain open:

1. **Who declares contest information final and effective for TOP?** The External Master / event operation supplies final effective information, but the precise business authority for the declaration has not been confirmed here.
2. **What makes a result valid for TOP?** The referee confirms the valid result, but the complete business conditions under which TOP may rely on that confirmation remain open.
3. **What evidence is sufficient?** The required evidence must support the final valid result, but its required sufficiency has not been established.
4. **What happens when final contest information, referee confirmation, evidence, and result disagree?** This artifact does not select which fact prevails, resolve the disagreement, or define any response.

These questions must not be answered implicitly by treating receipt, preservation, or an existing artifact as proof of authority.

## 6. Relationship to Existing Boundaries

This fact check preserves the established boundaries. Describing the real actors who supply or confirm information does not transfer ownership among those boundaries.

| Boundary | Responsibility preserved by this analysis |
|---|---|
| Competition Configuration | Defines competition rules, structure, templates, constraints, and configured context. |
| Contest Generation | Establishes generated contest facts by applying authoritative Competition Configuration to valid inputs. External operation of generation does not move these facts into TOP's result-preservation responsibility. |
| Registration | Owns entrant, roster, eligibility, lineup, and competition-wide registration/check-in facts, including competition-wide risk acknowledgement. |
| Scheduling | Owns assignment of contests to dates, times, courts, and locations. TOP's receipt of final effective contest information does not transfer assignment ownership. |
| Match Operations | Owns match execution, actual participation, outcome, and referee-confirmation facts. The referee's role in execution and confirmation operates within, rather than replaces, this boundary. |
| Competition Result Recording | Owns preservation of the official competition result and its trustworthy relationship to the final effective contest information, referee confirmation, and supporting evidence. |

No reference to, receipt of, or preservation of another boundary's fact makes Competition Result Recording—or TOP generally—the owner that established that fact. Likewise, the External Master's operational role does not silently rewrite the fact ownership already established for TOP's business boundaries.

## 7. Impact on ID-1 / ID-2 / ID-3

This reassessment tests the continued need and proper breadth of each question. It does not decide whether any question is retained, revised, deferred, or removed.

### ID-1 — Contest identity meaning

- **Whether it remains necessary for TOP:** A bounded question may remain necessary only if TOP cannot unambiguously associate the final valid result, referee confirmation, and evidence with the final effective contest information without some business meaning of the contest.
- **Whether it should be narrowed:** For TOP, ID-1 should be tested as a final-record interpretation question, not as a requirement to distinguish every operational change from every replacement or to preserve their histories.
- **Whether it belongs to external operation:** Determining same-contest versus replacement meaning while performing generation, participant replacement, cancellation, regeneration, or other operational adjustments may belong to the External Master / event operation. Whether TOP needs any resulting final declaration remains open.

### ID-2 — Continuity through change

- **Whether it remains necessary for TOP:** ID-2 may be unnecessary for TOP if receipt of unambiguous final effective contest information is sufficient for trustworthy result preservation. A narrower continuity question may remain only where the final official record cannot otherwise be verified.
- **Whether it should be narrowed:** TOP's possible need should be limited to understanding the final valid contest/result relationship. It should not presume a need for participant, schedule, court, regeneration, cancellation, intermediate-version, or correction-process history.
- **Whether it belongs to external operation:** Interpreting continuity while operational changes occur is principally a concern of the External Master / event operation. This analysis does not decide whether any bounded continuity fact must also be communicated to TOP.

### ID-3 — Applicability across competition modes

- **Whether it remains necessary for TOP:** ID-3 remains potentially relevant only if a contest meaning retained for final-record trust differs in its required applicability across competition modes. If TOP's preservation need is fully expressed by final effective facts, valid result, confirmation, and evidence, a separate TOP mode-scope question may not be needed.
- **Whether it should be narrowed:** Any TOP question should address only the modes in which additional meaning is necessary to interpret or verify the final official record, not the modes across which external operations must use a common operational rule.
- **Whether it belongs to external operation:** Mode-specific rules used to generate, schedule, adjust, or regenerate contests belong to the External Master / event operation and the established fact-owning boundaries. Whether the final information supplied to TOP must state any mode-dependent meaning remains open.

No statement above confirms an ID-1 meaning, an ID-2 continuity interpretation, an ID-3 scope, or the disposition of any of those questions.

## 8. Open Business Questions

- Which parts of final effective contest information are necessary to understand and verify an official result?
- Who has the business authority to declare that contest information is final and effective for TOP?
- What complete business conditions make the referee-confirmed result valid for TOP?
- Which referee-confirmation information is necessary for future trust and verification?
- What evidence is sufficient to substantiate an original or corrected final valid result?
- What minimum relationship among final contest information, result, referee confirmation, and evidence must remain understandable in the future?
- Does TOP require a supplied final contest meaning beyond the final effective facts, and if so, for which verification need?
- Are any mode-specific facts necessary to interpret the final official record, rather than to operate the competition?
- Which established boundary is authoritative for each fact when the received final information is inconsistent?
- What business outcome is required when final contest information, referee confirmation, evidence, and result disagree?

These questions do not reopen the confirmed exclusions from operational history. Any future requirement to retain an excluded fact would require separate business confirmation and is not introduced by this artifact.

## 9. Explicit Exclusions

This analysis does not define or propose:

- identifiers;
- schemas;
- databases;
- APIs;
- workflows;
- approval processes;
- lifecycle engines; or
- implementation architecture.

It also does not confirm ID-1, ID-2, or ID-3; redesign COMP-004-A1; introduce policy; change an existing fact owner; specify how disagreements are resolved; or modify the responsibilities of External Master / event operation, the referee, TOP, or any established business boundary.
