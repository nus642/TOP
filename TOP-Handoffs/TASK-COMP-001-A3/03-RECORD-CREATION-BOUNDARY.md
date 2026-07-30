# Official Record Creation Boundary

**Purpose:** Define when and how Competition Result Records become official
**Date:** 2026-07-30
**Depends On:** TASK-COMP-001-A1, TASK-COMP-001-A2

---

## 1. Creation Boundary Definition

### 1.1 What is an Official Record

An Official Competition Record is the authoritative representation of a match result within a tournament. It is:

- **Stable** - Not modified in place; future corrections would create new records referencing prior records
- **Official** - Carries full authority as a tournament result
- **Traceable** - Preserves the origin and creation context
- **Referential** - Links to source facts, does not duplicate them

### 1.2 When a Record Becomes Official

A record becomes official **at the moment of successful creation**. There is no intermediate state.

```
Creation Request → Validation → Record Created (Official)
```

**No draft state. No pending state. No approval gate.**

### 1.3 Creation Conditions

For a record to be created, these conditions must be met:

| Condition | Referee Path | Master Path |
|-----------|--------------|-------------|
| Valid match identity | Required | Required |
| Valid competition context | Required | Required |
| Complete score data | Required | Required |
| Determined winner | Required | Required |
| Authorized actor | Referee with signature | Master role |
| Source evidence | Signature reference | Actor identity |

---

## 2. Recording Authority Model

### 2.1 Authority Principle

**Authority is granted by the system, not inherent.**

Actors do not "own" the ability to create records. The system grants authority based on:

1. Role assignment
2. Context (e.g., match assignment for referees)
3. Explicit permission

### 2.2 Authorized Actors

| Actor | Authority Scope | Granting Condition |
|-------|-----------------|-------------------|
| Referee | Create record for assigned match | Match assignment + signature |
| Master | Create record for any match in competition | Master role assignment |

### 2.3 Authority Boundaries

**Referee:**
- Can only create records for matches they are assigned to
- Must provide signature as confirmation
- Cannot create records for unassigned matches
- Cannot modify existing records

**Master:**
- Can create records for any match in the competition
- Does not require signature (role is sufficient)
- Actions are logged with actor identity
- Cannot modify existing records

### 2.4 What Authority Does NOT Include

| Not Included | Reason |
|--------------|--------|
| Modify existing records | Records are not modified in place; corrections are additive (future scope) |
| Delete records | Records are permanent in normal operation |
| Approve other's records | No approval workflow |
| Delegate authority | Authority is non-transferable |

---

## 3. Source Preservation

### 3.1 Source Types

Every record must capture its origin:

| Source Type | Code | Description |
|-------------|------|-------------|
| Referee Confirmed | `referee_confirmed` | Result from live match with referee signature |
| Master Entered | `master_entered` | Manual entry by Master |

### 3.2 Source Data Captured

#### For Referee Confirmed

| Field | Description | Example |
|-------|-------------|---------|
| source | Origin type | `referee_confirmed` |
| referee_id | Referee identifier | `ref_001` |
| referee_name | Referee display name | `王五` |
| referee_level | Certification level | `国家级` |
| signature_ref | Reference to signature evidence | `sig_abc123` |
| confirmed_at | Confirmation timestamp | `2026-07-30T14:30:00Z` |

#### For Master Entered

| Field | Description | Example |
|-------|-------------|---------|
| source | Origin type | `master_entered` |
| entered_by | Master identifier | `master_001` |
| entered_by_name | Master display name | `张三` |
| entry_reason | Reason for manual entry | `裁判设备故障` |
| entered_at | Entry timestamp | `2026-07-30T15:00:00Z` |

### 3.3 Source Immutability

Source information is captured at creation and cannot be modified:

- Source type is permanent
- Actor identity is permanent
- Timestamps are permanent
- Evidence references are permanent

---

## 4. Record Representation

### 4.1 Core Record Structure

```
CompetitionResultRecord {
  // Identity
  id: string                    // Unique record identifier
  competition_id: string        // Tournament/competition reference
  match_id: string              // Match reference (from scheduling)
  
  // Result Data
  participant_1: string         // Team/player 1 identifier
  participant_2: string         // Team/player 2 identifier
  score: string                 // Final score representation
  winner: string                // Winner identifier
  game_details: string | null   // Game-by-game breakdown
  
  // Source Preservation
  source: "referee_confirmed" | "master_entered"
  source_actor_id: string       // Who created this record
  source_actor_name: string     // Display name
  source_evidence_ref: string | null  // Signature reference (if applicable)
  source_metadata: object       // Additional source-specific data
  
  // Creation Context
  created_at: timestamp         // When record was created
  created_by: string            // System actor who created
  
  // Status
  status: "official"            // Always "official" - no other states
}
```

### 4.2 Reference vs Snapshot

**Decision: Reference with minimal snapshot**

| Data | Approach | Rationale |
|------|----------|-----------|
| Match identity | Reference | Single source of truth |
| Competition identity | Reference | Single source of truth |
| Participant identity | Reference | Single source of truth |
| Score data | Snapshot | Preserve result at confirmation time |
| Winner | Snapshot | Preserve outcome at confirmation time |
| Source evidence | Reference | Evidence stored separately |

**Rationale:** Result data is snapshotted to preserve the official outcome. Identity references maintain relationships without duplication.

### 4.3 Stability and History Guarantee

Once created, a record is not modified in place:

- Not modified
- Not deleted in normal operation
- Source not changed
- Status not changed

**Future correction capability:** A correction mechanism may create new records that reference and supersede prior records, preserving history rather than altering original records.

---

## 5. Creation Boundary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATION BOUNDARY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐         ┌─────────────────┐                │
│  │  Referee Path   │         │   Master Path   │                │
│  │                 │         │                 │                │
│  │  - Match assigned│        │  - Master role  │                │
│  │  - Match played │         │  - Manual entry │                │
│  │  - Score recorded│        │  - Score entered│                │
│  │  - Signature    │         │  - Reason given │                │
│  └────────┬────────┘         └────────┬────────┘                │
│           │                           │                          │
│           ▼                           ▼                          │
│  ┌─────────────────────────────────────────────┐                │
│  │           VALIDATION GATE                    │                │
│  │                                              │                │
│  │  - Valid match identity                      │                │
│  │  - Valid competition context                 │                │
│  │  - Complete score data                       │                │
│  │  - Determined winner                         │                │
│  │  - Authorized actor                          │                │
│  │  - Source evidence present                   │                │
│  └────────────────────┬────────────────────────┘                │
│                       │                                          │
│                       ▼                                          │
│  ┌─────────────────────────────────────────────┐                │
│  │         OFFICIAL RECORD CREATED              │                │
│  │                                              │                │
│  │  - Stable (not modified in place)            │                │
│  │  - Source preserved                          │                │
│  │  - Status: official                          │                │
│  └─────────────────────────────────────────────┘                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Validation Rules

### 6.1 Common Validation

| Rule | Description |
|------|-------------|
| Match exists | Match ID must reference valid match |
| Competition exists | Competition ID must reference valid competition |
| Match belongs to competition | Match must be part of the competition |
| No duplicate record | Only one record per match |
| Score format valid | Score must match expected format |
| Winner determinable | Winner must be derivable from score |

### 6.2 Path-Specific Validation

#### Referee Path

| Rule | Description |
|------|-------------|
| Referee assigned | Referee must be assigned to this match |
| Signature present | Signature evidence must exist |
| Match completed | Match must be in completed state |

#### Master Path

| Rule | Description |
|------|-------------|
| Master role | Actor must have Master role |
| Entry reason | Reason for manual entry must be provided |
| Match not already recorded | Cannot create if referee record exists |

---

## 7. Error Handling

### 7.1 Validation Failures

| Failure | Response |
|---------|----------|
| Invalid match | Reject with error |
| Invalid competition | Reject with error |
| Duplicate record | Reject with error |
| Unauthorized actor | Reject with error |
| Missing evidence | Reject with error |

### 7.2 No Partial Creation

Records are created atomically:

- All validation passes → Record created
- Any validation fails → No record created

There is no "partial record" or "pending validation" state.

---

## 8. Explicit Non-Goals

This boundary does NOT define:

| Excluded | Reason |
|----------|--------|
| How matches are scheduled | Scheduling domain |
| How referees are assigned | Resource domain |
| How signatures are created | Match Operations |
| How records are queried | API design (future) |
| How corrections work | Deferred scope |
| How rankings are calculated | External process |

---

*End of Record Creation Boundary*