# Implementation Plan

## Modern Scoped Schedule Routes

**Task:** TASK-TOP-007C-2
**Status:** Ready for Codex Implementation

---

# 1. Implementation Overview

### Implementation Goal

The goal is to introduce explicit competition-scoped routes for schedule lifecycle APIs while maintaining backward compatibility. This enables clear competition ownership at the API boundary and provides a foundation for future Modern architecture improvements.

### Relationship to Existing Lifecycle Services

The implementation will:

- Add new competition-scoped routes alongside existing legacy routes
- Preserve existing schedule lifecycle service behavior
- Maintain existing transaction boundaries
- Continue using repository competition isolation
- Ensure no changes to schedule generation or pairing logic

### Principle of Incremental Migration

The implementation follows an incremental migration approach:

1. Add new routes first
2. Test thoroughly
3. Migrate internal callers gradually
4. Deprecate legacy routes later
5. Remove legacy compatibility when safe

This ensures no breaking changes and maintains system stability throughout the migration.

---

# 2. API Layer Changes

### Expected Route Changes

**Modern scoped routes:**

```
POST /api/competition/:competitionId/schedule
```

### Design Details

1. **competitionId from route parameters**
   - Extracted from URL path
   - Passed to service layer
   - Used for validation

2. **API layer validates/extracts context**
   - Extracts `competitionId` from route parameters
   - Validates competition exists
   - Rejects invalid or missing IDs
   - Passes validated context to service layer

3. **Legacy routes remain supported during migration**
   - Existing routes continue to work
   - No immediate removal planned
   - Backward compatibility preserved

### Likely Affected Files

- **Modern/api/competition.js**
  - Add new route handler for `POST /api/competition/:competitionId/schedule`
  - Add validation logic for competitionId
  - Extract competition context from route parameters
  - Pass context to service layer

---

# 3. Service Layer Changes

### Expected Service Behavior

The service layer should:

1. **Preserve existing transaction boundaries**
   - Maintain existing transaction management
   - No changes to transaction semantics
   - Ensure data consistency

2. **Continue using explicit competition context**
   - Receive competitionId as parameter
   - Use context for repository operations
   - No implicit context inference

3. **Do not redesign schedule lifecycle logic**
   - Keep existing schedule creation/update logic
   - Preserve existing validation rules
   - Maintain existing business rules

4. **Do not introduce unrelated refactoring**
   - Only modify what's necessary
   - Avoid refactoring unrelated code
   - Keep changes focused

### Likely Affected Files

- **Modern/services/competition.service.js**
  - Add `competitionId` parameter to schedule-related methods
  - Pass competition context to repository layer
  - Maintain existing transaction handling
  - Preserve existing validation logic

---

# 4. Repository Layer Impact

### Expected Behavior

The repository layer should:

1. **Existing competition isolation should remain**
   - Continue enforcing competition boundaries
   - Use competition context for filtering
   - Maintain existing isolation logic

2. **Repository changes should only be made if required**
   - No schema changes needed
   - No new tables or columns
   - No changes to query patterns

3. **Do not redesign database access patterns**
   - Preserve existing repository interfaces
   - Maintain existing query structure
   - No changes to data access layer

### Likely Affected Files

- **Modern/repositories/***
  - May need minor adjustments to pass competition context
  - No major refactoring expected
  - Existing query patterns should remain

---

# 5. Compatibility Strategy

### Legacy Routes

```
POST /api/competition/save
```

- Request body contains `tournamentId`
- Legacy behavior preserved
- No immediate changes

### Modern Routes

```
POST /api/competition/:competitionId/schedule
```

- competitionId from route parameters
- Explicit competition ownership
- New behavior

### Migration Approach

1. **Keep legacy behavior**
   - Legacy routes continue to work
   - No breaking changes
   - Existing callers unaffected

2. **Avoid breaking existing callers**
   - Gradual migration
   - Internal callers updated first
   - External clients notified

3. **Gradually migrate consumers**
   - Update internal API consumers
   - Test thoroughly after each change
   - Monitor for issues
   - Deprecate legacy routes when safe

---

# 6. Testing Plan

### API Tests

**New scoped route success:**
- Valid competitionId
- Proper request body
- Expected response format

**Invalid competition id:**
- Non-existent competitionId
- Invalid format
- Missing competitionId
- Expected error responses

**Non-existent competition:**
- Attempt to access schedule for non-existent competition
- Expected 404 or appropriate error

**Legacy route compatibility:**
- Existing legacy routes still work
- Request body format preserved
- Response format unchanged

### Service Tests

**Competition context propagation:**
- Service receives correct competitionId
- Context passed to repository layer
- No context leakage or loss

**Transaction behavior preserved:**
- Existing transaction semantics maintained
- Rollback on errors
- Commit on success

---

# 7. Scope Boundary

### Included

- **New scoped schedule routes**
  - Define route structure
  - Implement route handlers
  - Add validation

- **Context propagation**
  - API layer extracts competitionId
  - Passes to service layer
  - Service layer uses context

- **Validation**
  - Validate competitionId exists
  - Reject invalid IDs
  - Handle missing IDs gracefully

- **Regression tests**
  - Ensure existing schedule lifecycle behavior is preserved
  - Test new routes thoroughly
  - Add tests for edge cases

### Excluded

- **Schedule algorithm changes**
  - No changes to schedule generation logic
  - No changes to pairing algorithms
  - No changes to match creation

- **Pairing logic changes**
  - No changes to pairing algorithms
  - No changes to match generation
  - No changes to tournament structure

- **Database schema redesign**
  - No schema modifications
  - No new tables or columns
  - No changes to existing tables

- **Frontend migration**
  - Frontend code not modified
  - External clients not updated
  - No frontend changes

- **Legacy API removal**
  - Legacy routes remain functional
  - No immediate removal planned
  - Backward compatibility preserved

---

# 8. Codex Implementation Guidance

### Before Coding

1. **Read all TASK-TOP-007C-2 handoff documents**
   - 01-TASK.md: Objective and scope
   - 02-EXECUTIVE-SUMMARY.md: Architecture decisions
   - This document: Implementation plan

2. **Understand the architecture**
   - Competition context must be explicit at API boundary
   - Modern routes: POST /api/competition/:competitionId/schedule
   - Legacy routes remain functional
   - Incremental migration approach

### During Implementation

1. **Keep changes incremental**
   - Implement one route at a time
   - Test after each change
   - Avoid large, monolithic changes

2. **Avoid unrelated refactoring**
   - Do not refactor unrelated code
   - Do not introduce new features
   - Keep changes focused on the task scope

3. **Preserve existing behavior**
   - Maintain existing transaction boundaries
   - Preserve repository competition isolation
   - Keep schedule lifecycle logic unchanged

### After Implementation

1. **Create PR only**
   - Do not merge
   - Submit for review
   - Follow TES Handoff Protocol

2. **Do not merge**
   - Wait for review approval
   - Address any feedback
   - Merge only after approval

---

## Status

**Ready for Codex Implementation**

**Note:**

Implementation should follow the guidance provided in this document and all previous handoff documents. Do not modify production code until the architecture decision is accepted and implementation plan is approved.

**Next Steps:**

1. Review this implementation plan
2. Confirm understanding of scope and approach
3. Proceed with implementation
4. Create Pull Request following TES Handoff Protocol