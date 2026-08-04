# COMP-004-A1 Scope Reassessment

**Task:** TASK-COMP-004-A1 — Contest Identity / Configuration Reference Policy

**Artifact type:** Business scope reassessment only

**Decision status:** This artifact does not answer or change ID-1, ID-2, or ID-3, remove any existing decision area, or establish a policy.

## 1. Purpose

This reassessment validates the responsibility boundary of COMP-004-A1 after confirmation of the real operating model: competition operations are managed outside TOP, while TOP is concerned with the trustworthiness of official competition records. It tests whether the current questions concern information TOP must understand for preservation or decisions already made within an external competition operation process.

The reassessment is analysis only. It preserves the existing decision areas and their definitions without resolving them. It does not define schemas, identifiers, APIs, workflows, approval processes, lifecycle mechanisms, implementation architecture, or any other implementation mechanism.

## 2. Confirmed Business Operation Model

### External operational responsibilities

The external Master / competition operation process manages the activities by which a competition is prepared, adjusted, and operated. These responsibilities include:

- match generation;
- scheduling;
- participant replacement;
- court or location changes;
- cancellation;
- regeneration; and
- other operational adjustments.

The external process determines and communicates the effective competition information resulting from those activities. The presence of an operational scenario in COMP-004-A1 does not assign the operation, its reasoning, or its intermediate history to TOP.

### TOP preservation responsibilities

TOP's responsibility is focused on preserving what is required for an official record to remain trustworthy:

- final effective competition facts;
- official results;
- referee confirmation;
- supporting evidence; and
- the historical trustworthiness of official records.

This distinction leaves open which particular final facts and evidence TOP requires. Preservation may require enough meaning to understand what an official result concerns, but that need does not by itself make TOP responsible for evaluating or reproducing the external operations that produced the final effective state.

## 3. Reassessment of ID-1

**Current intent:** “What business criteria make an authorized change concern the same contest rather than a distinct replacement?”

ID-1 can be tested against two possible business needs without selecting between them. The question may describe a decision required by an external operator when generation, replacement, cancellation, regeneration, or another authorized adjustment occurs. Alternatively, some bounded identity meaning may be relevant to TOP only insofar as an official result must be associated with the correct final effective contest facts and remain historically trustworthy.

The reassessment must therefore examine:

- whether TOP itself needs to determine same-contest versus distinct-replacement meaning, or merely needs an unambiguous final effective fact supplied by the responsible external process;
- whether Master already determines that meaning as part of operating the competition and declares the resulting competition information effective;
- whether TOP needs the external operator's reasoning about the change, or only the final effective contest fact, official result, referee confirmation, and required evidence; and
- whether any identity meaning retained by TOP is necessary for official-record trust rather than for managing the operational change.

This analysis does not decide which of those needs applies and does not answer ID-1.

## 4. Reassessment of ID-2

**Current intent:** “How continuity should be interpreted when permitted business changes occur.”

ID-2 can be reassessed by separating continuity evaluation during competition operation from preservation after the effective state has been declared. Evaluating whether a permitted change continues a contest may belong to the external process that performs participant, schedule, location, cancellation, regeneration, or other operational adjustments. TOP may instead need only to retain the final valid contest and result state, with sufficient confirmation and evidence for the official record.

The reassessment must therefore examine:

- whether TOP has a business need to evaluate continuity when an external permitted change occurs;
- whether the external operator's final and effective declaration makes a separate TOP continuity evaluation unnecessary;
- whether TOP's concern is limited to preserving the final valid contest/result state and its trustworthiness; and
- whether any continuity information is required to interpret an official record, rather than to retain the history of operational adjustments.

This analysis does not choose between continuity evaluation and final-state preservation and does not answer ID-2.

## 5. Reassessment of ID-3

**Current intent:** “Whether identity meaning applies across competition modes.”

ID-3 can be reassessed by distinguishing mode-specific operational rules from the competition facts that TOP preserves. Different competition modes may require the external operator to use different identity interpretations while generating and operating contests. That does not necessarily establish that TOP must own mode-specific identity rules; TOP's need may instead concern only the final competition facts, official result, confirmation, and evidence relevant within the applicable scope.

The reassessment must therefore examine:

- whether TOP requires mode-specific identity rules to fulfill its official-record responsibility;
- whether any mode-specific interpretation is already resolved by Master before information becomes final and effective for TOP;
- whether TOP only requires final competition facts within the relevant competition scope; and
- whether mode information is needed to preserve the meaning and trustworthiness of an official record without making TOP responsible for competition operation.

This analysis does not determine whether identity meaning is uniform or mode-specific and does not answer ID-3.

## 6. Potential Scope Alignment

The reassessment may lead to any of the following outcomes. Listing them neither recommends an outcome nor changes the current responsibility:

- **Keep current responsibility:** retain the current COMP-004-A1 responsibility if the existing questions are required within TOP's business boundary.
- **Narrow responsibility:** retain only the parts of the existing questions required to preserve final effective competition facts and trustworthy official records, while leaving operational reasoning outside TOP.
- **Move responsibility to external domain:** recognize the existing questions as decisions of the external competition operation process, with TOP receiving only the final effective facts and official-record information it requires.

Any outcome would require later business confirmation. This artifact does not select one, create a policy, or remove an existing decision area.

## 7. Open Business Questions

- What final facts must TOP retain?
- Who declares competition information final and effective for TOP?
- What evidence is required for official result trust?
- Which operational changes are irrelevant after completion?
- Which contest meaning, if any, must TOP retain to keep an official record historically trustworthy?
- Does Master already determine same-contest versus replacement meaning before supplying final effective facts to TOP?
- Does TOP need the reasoning behind an external change, or only its final effective consequence?
- Must TOP evaluate continuity, or can it rely on the externally declared final valid contest/result state?
- Are mode-specific identity rules needed by TOP, or only by the external competition operation process?
- Which referee confirmation facts must remain connected to the official result?
- Which externally managed changes can affect the trustworthiness of an official record?
- Who is authoritative when final effective competition facts, referee confirmation, supporting evidence, and an official result do not align?
