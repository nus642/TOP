# Acceptance Paths Specification

**Purpose:** Define how Competition Result Recording accepts official records
**Date:** 2026-07-30
**Depends On:** TASK-COMP-001-A1, TASK-COMP-001-A2, 03-RECORD-CREATION-BOUNDARY.md

---

## 1. Overview

Competition Result Recording accepts official records through two distinct paths:

| Path | Trigger | Actor | Evidence |
|------|---------|-------|----------|
| Referee-Confirmed | Match completion + signature | Referee | Signature reference |
| Master-Entered | Manual entry action | Master | Actor identity + reason |

Both paths produce identical record structures with different source metadata.

---

## 2. Path 1: Referee-Confirmed Result

### 2.1 Preconditions

Before this path can produce a record:

| Precondition | Owner | Description |
|--------------|-------|-------------|
| Match scheduled | Scheduling domain | Match exists in system |
| Referee assigned | Resource domain | Referee linked to match |
| Match played | Match Operations | Live scoring completed |
| Match completed | Match Operations | Completion condition met |
| Signature collected | Match Operations | Referee signed confirmation |

### 2.2 Accepted Input (Confirmed Match Outcome)

The boundary accepts a Confirmed Match Outcome from Match Operations:

```
ConfirmedMatchOutcome {
  // Match Identity
  match_id: string              // Which match
  competition_id: string        // Which competition
  
  // Result Data
  participant_1: string         // Team/player 1
  participant_2: string         // Team/player 2
  score: string                 // Final score
  winner: string                // Determined winner
  game_details: string | null   // Game-by-game breakdown
  
  // Confirmation Data
  referee_id: string            // Referee identifier
  referee_name: string          // Referee display name
  referee_level: string         // Certification level
  signature_ref: string         // Reference to signature evidence
  confirmed_at: timestamp       // When referee confirmed
}
```

### 2.3 Acceptance Process

```
┌─────────────────────────────────────────────────────────────┐
│              REFEREE-CONFIRMED ACCEPTANCE                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Match Operations                                            │
│       │                                                      │
│       │  Confirmed Match Outcome                             │
│       ▼                                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  1. VALIDATE INPUT                                   │    │
│  │     - All required fields present                    │    │
│  │     - Match exists and belongs to competition        │    │
│  │     - Referee was assigned to this match             │    │
│  │     - Signature reference is valid                   │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  2. CHECK DUPLICATE                                  │    │
│  │     - No existing record for this match              │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  3. CREATE RECORD                                    │    │
│  │     - Generate record ID                             │    │
│  │     - Set source = "referee_confirmed"               │    │
│  │     - Capture source metadata                        │    │
│  │     - Set status = "official"                        │    │
│  │     - Set created_at = now                           │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  4. PERSIST                                          │    │
│  │     - Store record (stable, not modified in place)   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Source Metadata Captured

```
source_metadata: {
  referee_id: string
  referee_name: string
  referee_level: string
  signature_ref: string
  confirmed_at: timestamp
}
```

### 2.5 Rejection Conditions

| Condition | Error |
|-----------|-------|
| Missing required fields | `INVALID_INPUT` |
| Match not found | `MATCH_NOT_FOUND` |
| Competition not found | `COMPETITION_NOT_FOUND` |
| Referee not assigned | `UNAUTHORIZED_REFEREE` |
| Invalid signature reference | `INVALID_SIGNATURE` |
| Record already exists | `DUPLICATE_RECORD` |

---

## 3. Path 2: Master-Entered Result

### 3.1 Preconditions

Before this path can produce a record:

| Precondition | Owner | Description |
|--------------|-------|-------------|
| Match scheduled | Scheduling domain | Match exists in system |
| Master role assigned | System administration | Actor has Master role |
| No existing record | Competition Result Recording | Match not already recorded |

### 3.2 Accepted Input (Manual Entry)

The boundary accepts a manual entry request from Master:

```
MasterEntryRequest {
  // Match Identity
  match_id: string              // Which match
  competition_id: string        // Which competition
  
  // Result Data
  participant_1: string         // Team/player 1
  participant_2: string         // Team/player 2
  score: string                 // Final score
  winner: string                // Determined winner
  game_details: string | null   // Game-by-game breakdown (optional)
  
  // Entry Context
  entry_reason: string          // Why manual entry is needed
}
```

### 3.3 Acceptance Process

```
┌─────────────────────────────────────────────────────────────┐
│              MASTER-ENTERED ACCEPTANCE                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Master (Actor)                                              │
│       │                                                      │
│       │  Manual Entry Request                                │
│       ▼                                                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  1. VALIDATE AUTHORITY                               │    │
│  │     - Actor has Master role                          │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  2. VALIDATE INPUT                                   │    │
│  │     - All required fields present                    │    │
│  │     - Match exists and belongs to competition        │    │
│  │     - Entry reason provided                          │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  3. CHECK DUPLICATE                                  │    │
│  │     - No existing record for this match              │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  4. CREATE RECORD                                    │    │
│  │     - Generate record ID                             │    │
│  │     - Set source = "master_entered"                  │    │
│  │     - Capture source metadata                        │    │
│  │     - Set status = "official"                        │    │
│  │     - Set created_at = now                           │    │
│  └──────────────────────┬──────────────────────────────┘    │
│                         │                                    │
│                         ▼                                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  5. PERSIST                                          │    │
│  │     - Store record (stable, not modified in place)   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Source Metadata Captured

```
source_metadata: {
  entered_by: string            // Master identifier
  entered_by_name: string       // Master display name
  entry_reason: string          // Reason for manual entry
  entered_at: timestamp         // When entry was made
}
```

### 3.5 Rejection Conditions

| Condition | Error |
|-----------|-------|
| Actor not Master | `UNAUTHORIZED_ACTOR` |
| Missing required fields | `INVALID_INPUT` |
| Match not found | `MATCH_NOT_FOUND` |
| Competition not found | `COMPETITION_NOT_FOUND` |
| Missing entry reason | `MISSING_REASON` |
| Record already exists | `DUPLICATE_RECORD` |

### 3.6 Master Entry Use Cases

Manual entry is intended for operational edge cases:

| Use Case | Description |
|----------|-------------|
| Equipment failure | Referee device failed during match |
| System outage | Match completed but system unavailable |
| Data recovery | Recreating records after data loss |
| External result | Result from external system needing official record |
| Correction workaround | Interim solution until correction feature exists |

---

## 4. Path Comparison

### 4.1 Similarities

Both paths:

- Produce identical record structures
- Create stable official records (not modified in place)
- Require valid match and competition context
- Check for duplicate records
- Preserve source information
- Have the same authoritative status

### 4.2 Differences

| Aspect | Referee-Confirmed | Master-Entered |
|--------|-------------------|----------------|
| Trigger | Match completion | Manual action |
| Actor | Referee | Master |
| Evidence | Signature reference | Actor identity + reason |
| Source type | `referee_confirmed` | `master_entered` |
| Typical usage | Normal operations | Edge cases |
| Signature | Required | Not required |
| Reason | Not required | Required |

### 4.3 Authority Equivalence

**Both paths produce records with equal authority.**

A master-entered record is not "less official" than a referee-confirmed record. The source distinction is for transparency, not hierarchy.

---

## 5. Boundary Responsibilities

### 5.1 What This Boundary Does

| Responsibility | Description |
|----------------|-------------|
| Accept confirmed outcomes | Receive and validate Confirmed Match Outcome |
| Accept manual entries | Receive and validate Master Entry Request |
| Validate inputs | Ensure all required data is present and valid |
| Check authorization | Verify actor has authority for this action |
| Prevent duplicates | Ensure one record per match |
| Create records | Produce official Competition Result Records |
| Preserve source | Capture and store origin information |

### 5.2 What This Boundary Does NOT Do

| Excluded | Reason |
|----------|--------|
| Create signatures | Match Operations responsibility |
| Assign referees | Resource domain |
| Schedule matches | Scheduling domain |
| Calculate rankings | External process |
| Manage corrections | Deferred scope |
| Query records | API design (future) |

---

## 6. Integration Points

### 6.1 Upstream: Match Operations

```
Match Operations ──[Confirmed Match Outcome]──> Competition Result Recording
```

**Contract:** Match Operations provides a complete Confirmed Match Outcome with all required fields.

### 6.2 Upstream: Master Interface

```
Master Interface ──[Manual Entry Request]──> Competition Result Recording
```

**Contract:** Master interface provides a complete Manual Entry Request with all required fields.

### 6.3 Downstream: Record Storage

```
Competition Result Recording ──[Competition Result Record]──> Storage
```

**Contract:** Records are stored with all source metadata preserved; records are not modified in place.

---

## 7. Sequence Diagrams

### 7.1 Referee-Confirmed Sequence

```
Referee    Match Ops    Result Recording    Storage
   │            │               │               │
   │──sign──────>│               │               │
   │            │               │               │
   │            │──outcome──────>│               │
   │            │               │               │
   │            │               │──validate─────│
   │            │               │               │
   │            │               │──check dup────│
   │            │               │               │
   │            │               │──create───────>│
   │            │               │               │
   │            │               │<──persisted───│
   │            │               │               │
   │            │<──success─────│               │
   │            │               │               │
```

### 7.2 Master-Entered Sequence

```
Master    Master UI    Result Recording    Storage
   │            │               │               │
   │──enter────>│               │               │
   │            │               │               │
   │            │──request──────>│               │
   │            │               │               │
   │            │               │──validate─────│
   │            │               │               │
   │            │               │──check auth───│
   │            │               │               │
   │            │               │──check dup────│
   │            │               │               │
   │            │               │──create───────>│
   │            │               │               │
   │            │               │<──persisted───│
   │            │               │               │
   │            │<──success─────│               │
   │            │               │               │
```

---

## 8. Error Handling Summary

### 8.1 Common Errors

| Error Code | Meaning | Resolution |
|------------|---------|------------|
| `INVALID_INPUT` | Missing or invalid fields | Correct input and retry |
| `MATCH_NOT_FOUND` | Match ID not valid | Verify match exists |
| `COMPETITION_NOT_FOUND` | Competition ID not valid | Verify competition exists |
| `DUPLICATE_RECORD` | Record already exists | Cannot create another |

### 8.2 Path-Specific Errors

| Error Code | Path | Meaning |
|------------|------|---------|
| `UNAUTHORIZED_REFEREE` | Referee | Referee not assigned to match |
| `INVALID_SIGNATURE` | Referee | Signature reference invalid |
| `UNAUTHORIZED_ACTOR` | Master | Actor does not have Master role |
| `MISSING_REASON` | Master | Entry reason not provided |

### 8.3 Error Response Format

```
Error {
  code: string              // Error code
  message: string           // Human-readable message
  details: object | null    // Additional context
}
```

---

## 9. Explicit Non-Goals

This specification does NOT define:

| Excluded | Reason |
|----------|--------|
| API endpoint design | Implementation detail |
| Database schema | Implementation detail |
| UI/UX for entry | Separate concern |
| Notification on creation | Separate concern |
| Audit logging beyond source | Separate concern |
| Batch operations | Not in initial scope |

---

*End of Acceptance Paths Specification*