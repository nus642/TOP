Task:
TASK-OPS-001-A4.3

Title:
Operational Readiness Query


# Implementation Phases

## Phase 1: Readiness Query Function

**File**: `Modern/engine/operations/domain/readiness-preparation.js`

**Implementation**:

```
const OperationsError = require('./operations-error');
const MatchContext = require('./match-context');

function checkReadinessPreparation(matchContext) {
  // Input validation
  if (!matchContext || !(matchContext instanceof MatchContext)) {
    throw new OperationsError(
      "INVALID_MATCH_CONTEXT",
      "checkReadinessPreparation requires a valid MatchContext instance"
    );
  }

  // Query actor context attachment
  const missing = [];

  if (!matchContext.masterContext) {
    missing.push("masterContext");
  }

  if (!matchContext.refereeContext) {
    missing.push("refereeContext");
  }

  // Return structured result
  if (missing.length === 0) {
    return { ready: true };
  }

  return { ready: false, missing };
}

module.exports = { checkReadinessPreparation };
```

**Behavior**:
- Pure query function — no side effects
- Does NOT modify matchContext
- Does NOT create any domain object
- Does NOT trigger any action
- Does NOT store or maintain activation state
- Does NOT introduce lifecycle transition
- Returns new object on every call (no cached state)

**Validation**:
- Missing matchContext → OperationsError("INVALID_MATCH_CONTEXT", ...)
- Non-MatchContext instance → OperationsError("INVALID_MATCH_CONTEXT", ...)

**Constraints**:
- No class — standalone exported function
- No require of MatchExecutionContext
- No require of DrawInput or DrawInputValidator
- No setter, no internal state, no closure state
- Idempotent: same input always produces same output


## Phase 2: Exports Update

**Files**:
- `Modern/engine/operations/domain/index.js` (modify)
- `Modern/engine/operations/index.js` (modify)

**Add exports**:
- checkReadinessPreparation

**Constraint**: Existing A1/A3/A4.1/A4.2 exports unchanged.


## Phase 3: Tests

**Test file**: `Modern/test/domains/readiness-check.test.js`

**Test cases**:

1. Both actor contexts attached
   - MatchContext with masterContext + refereeContext → { ready: true }
   - Result has no `missing` property (or missing is undefined)

2. Missing masterContext only
   - MatchContext with refereeContext but no masterContext
   - → { ready: false, missing: ["masterContext"] }

3. Missing refereeContext only
   - MatchContext with masterContext but no refereeContext
   - → { ready: false, missing: ["refereeContext"] }

4. Missing both actor contexts
   - MatchContext with neither attached
   - → { ready: false, missing: ["masterContext", "refereeContext"] }

5. Invalid input: null
   - checkReadinessPreparation(null) → throws OperationsError("INVALID_MATCH_CONTEXT")

6. Invalid input: undefined
   - checkReadinessPreparation() → throws OperationsError("INVALID_MATCH_CONTEXT")

7. Invalid input: plain object
   - checkReadinessPreparation({}) → throws OperationsError("INVALID_MATCH_CONTEXT")

8. Purity verification
   - Call twice with same MatchContext → same result
   - MatchContext properties unchanged after call
   - No new properties added to MatchContext

9. No side effects
   - Function does not modify matchContext.masterContext
   - Function does not modify matchContext.refereeContext
   - Return object is a new instance each call

**Test execution**:

```bash
node --test Modern/test/domains/readiness-check.test.js
```


# Expected File Changes

## New Files

- `Modern/engine/operations/domain/readiness-preparation.js`
- `Modern/test/domains/readiness-check.test.js`

## Modified Files

- `Modern/engine/operations/domain/index.js` (add checkReadinessPreparation export)
- `Modern/engine/operations/index.js` (add checkReadinessPreparation export)

## Unchanged Files

- `Modern/engine/operations/domain/match-context.js`
- `Modern/engine/operations/domain/operations-error.js`
- `Modern/engine/operations/domain/match-execution-context.js`
- `Modern/engine/operations/domain/match-result.js`
- `Modern/engine/operations/domain/master-confirmation.js`
- `Modern/engine/operations/domain/competition-update-intent.js`
- `Modern/engine/operations/domain/draw-input.js`
- `Modern/engine/operations/domain/draw-input-validator.js`


# Integration Boundary

This task does NOT modify:

- `Modern/api/`
- `Modern/services/`
- `Modern/repositories/`
- `Modern/db.sql`
- `Modern/engine/competition/`
- Legacy code


# Rollback

**Remove**: `readiness-preparation.js`, `readiness-check.test.js`.
**Restore**: `index.js` files to pre-A4.3 state.
**Safety**: No data changes. MatchContext never touched. No state introduced. Legacy unaffected.

Follow TES Handoff Protocol.
