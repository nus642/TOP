# Architecture Decision Summary

## Modern Scoped Schedule Routes

**Task:** TASK-TOP-007C-2
**Status:** Architecture Approved - Ready for Implementation Review

---

# 1. Architecture Decision

### Why Competition-Scoped Routes Are Needed

TOP is migrating from legacy-style APIs toward a Modern architecture. The current implementation obtains competition context through implicit means:

- Request body fields (e.g., `tournamentId`)
- Query parameters
- Legacy hard-coded defaults

This implicit approach creates several problems:

1. **Ambiguity**: Competition ownership is not clear at the API boundary
2. **Security Risk**: Invalid or missing competition context can lead to unintended data access
3. **Maintainability**: Code becomes harder to understand and reason about
4. **Scalability**: As the system grows, implicit context handling becomes increasingly error-prone

### Target Principle

**Competition context must be explicit at the API boundary.**

This means:
- The API route should clearly indicate which competition is being operated on
- Competition ownership is not inferred from request data
- The API layer validates and extracts competition context
- The service layer receives explicit competition context

---

# 2. Route Decision

### Selected Route Approach

**Modern scoped routes:**

```
POST /api/competition/:competitionId/schedule
```

### Design Rationale

1. **competitionId from route parameters**
   - Explicit ownership at the API boundary
   - Clear semantic meaning
   - Easy to validate and reject invalid IDs

2. **API layer extracts and validates context**
   - Extracts `competitionId` from route parameters
   - Validates the competition exists
   - Rejects invalid or missing IDs
   - Passes validated context to service layer

3. **Service layer receives explicit competition context**
   - Service methods receive `competitionId` as a parameter
   - No ambiguity about which competition is being operated on
   - Clear responsibility boundaries

### Route Naming Convention

Route naming should remain consistent with existing TOP conventions:

- Use `:competitionId` for route parameters
- Follow RESTful principles where applicable
- Maintain consistency with other modern routes in the system

---

# 3. Migration Decision

### Migration Strategy

The migration will proceed in four phases:

**Phase 1: Add modern scoped routes**
- Implement new routes like `POST /api/competition/:competitionId/schedule`
- Add validation and context extraction
- Ensure new routes work correctly

**Phase 2: Migrate internal callers**
- Update internal API consumers to use new routes
- Maintain backward compatibility during transition
- Test thoroughly

**Phase 3: Deprecate legacy routes**
- Add deprecation warnings to legacy routes
- Document migration path for external clients
- Monitor usage

**Phase 4: Remove legacy compatibility when safe**
- Remove legacy route handlers
- Remove tournamentId=1 compatibility behavior
- Only after confirming no external clients depend on it

### Key Confirmations

- **Legacy APIs remain functional during migration**
  - No breaking changes in Phase 1
  - Backward compatibility is preserved

- **tournamentId=1 compatibility is not removed in this task**
  - Legacy behavior continues to work
  - This task is migration, not replacement

- **This task is migration, not replacement**
  - New routes are added alongside legacy routes
  - Gradual transition approach
  - No immediate removal of existing functionality

---

# 4. Scope Boundary

### Included

- **New scoped schedule routes**
  - Define route structure
  - Implement route handlers
  - Add validation

- **Context propagation**
  - API layer extracts competitionId
  - Passes to service layer
  - Service layer uses context for repository operations

- **Validation**
  - Validate competitionId exists
  - Reject invalid IDs
  - Handle missing IDs gracefully

- **Regression tests**
  - Ensure existing schedule lifecycle behavior is preserved
  - Test new routes thoroughly
  - Add tests for edge cases

### Excluded

- **Removing legacy APIs**
  - Legacy routes remain functional
  - No immediate removal planned

- **Database schema changes**
  - No schema modifications
  - Existing tables and relationships unchanged

- **Schedule algorithm redesign**
  - Schedule generation logic unchanged
  - Pairing logic unchanged
  - Only route structure changes

- **Pairing logic changes**
  - No changes to pairing algorithms
  - No changes to match generation

- **Frontend migration**
  - Frontend code not modified
  - External clients not updated

- **Large refactoring**
  - No unrelated refactoring
  - Keep changes focused and incremental

---

# 5. Implementation Guidance

### For Codex Implementation

**Preserve existing transaction boundaries**
- Schedule lifecycle operations should maintain existing transaction semantics
- No changes to transaction management logic
- Ensure data consistency is preserved

**Preserve repository competition isolation**
- Repository layer continues to enforce competition isolation
- Competition context is used to filter queries
- No changes to repository isolation logic

**Keep changes incremental**
- Implement one route at a time
- Test after each change
- Avoid large, monolithic changes

**Avoid unrelated refactoring**
- Do not refactor unrelated code
- Do not introduce new features
- Keep changes focused on the task scope

**Follow existing patterns**
- Use existing code patterns and conventions
- Follow existing error handling patterns
- Maintain consistency with existing codebase

---

# 6. Decision Status

**Status: Architecture Approved - Ready for Implementation Review**

**Note:**

Implementation should not start until this architecture decision is accepted.

**Next Steps:**

1. Review this architecture decision
2. Confirm acceptance
3. Proceed with implementation following the guidance provided
4. Deliver through Pull Request following TES Handoff Protocol

---

**Approved By:** [To be filled]
**Date:** [To be filled]