# 1. Implementation Overview

This section outlines the implementation plan for the CODE task, focusing on the migration of the remaining scoped schedule lifecycle, the addition of modern scoped reset and generate routes, and the preservation of existing service behavior.

## 1.1 Migrate Remaining Scoped Schedule Lifecycle

The migration will involve transitioning the remaining scoped schedule lifecycle to the new system, ensuring that all functionalities are preserved and properly integrated.

## 2. Add Modern Scoped Reset and Generate Routes

New routes will be introduced to provide scoped reset and generate capabilities. These routes will be designed to be efficient and maintainable, adhering to the project's coding standards.

## 2.1 Preserve Existing Service Behavior

The existing service behavior will be maintained to ensure that the new implementation is backward compatible and does not disrupt the current functionality.

# 2. API Layer Changes

This section details the changes and additions in the API layer as part of the implementation plan.

## 2.1 New Routes

Two new routes will be added to the API layer:

- DELETE /api/competition/:competitionId/reset
- POST /api/competition/:competitionId/generate

### 2.1.1 Route Parameters

The `competitionId` parameter will be used in both new routes. It represents the ID of the competition for which the reset or generate operation is being performed.

### 2.1.2 Route Requirements

- The `competitionId` must be a positive integer.
- The system will validate the `competitionId` before processing the request.
- Invalid IDs will be rejected before the service execution.
- The API handlers will be kept thin to ensure efficient processing.

### 2.1.3 Affected File

The file `Modern/api/competition.js` will be modified to include the new routes and their respective logic.

# 3. Service Layer Changes

This section describes the expected changes in the service layer.

## 3.1 Expected Behavior

The existing `resetCompetition()` and `generateCompetition()` methods will be reused as they already provide the necessary functionality. There will be no redesign of the lifecycle logic, and transaction boundaries will be preserved.

### 3.1.1 Affected File

The file `Modern/services/competition.service.js` may be modified to include the new routes and their respective logic.

# 4. Repository Layer Impact

This section documents the impact on the repository layer.

## 4.1 Repository Redesign

No redesign of the repository layer is expected. The existing competition isolation will remain in place, and modifications will only be made if the implementation requires it.

# 5. Migration Strategy

This section outlines the migration strategy for the API routes.

## 5.1 Legacy Routes

The legacy routes `/reset` and `/generate` will remain functional.

## 5.2 Modern Routes

The modern routes will be implemented as `/:competitionId/reset` and `/:competitionId/generate`.

## 5.3 Rules

- The legacy routes will remain functional.
- No breaking changes will be made to the existing routes.
- The migration will be performed incrementally.

# 6. Testing Plan

This section details the testing plan for the implementation.

## 6.1 Required Tests

The following tests will be performed to ensure the API and regression tests are functioning as expected:

- scoped reset success
- scoped generate success
- invalid competition ID rejected
- non-existent competition rejected
- service not called on invalid input
- legacy routes remain functional

## 6.2 Regression Tests

Existing lifecycle tests will continue to pass, ensuring that the new changes do not break existing functionality.

# 7. Scope Boundary

This section defines the scope of the implementation.

## 7.1 Included

The following items are included in the implementation scope:

- Two scoped routes
- Validation logic for the routes
- Regression tests for the new routes

## 7.2 Excluded

The following items are excluded from the implementation scope:

- The schedule algorithm
- Pairing logic
- Database schema changes
- Frontend migration
- Removal of legacy code

# 8. Codex Implementation Guidance

This section provides guidance for the Codex implementation.

## 8.1 Read All Handoff Documents First

The Codex implementation should begin by reading all handoff documents to fully understand the project context and requirements.

## 8.2 Preserve Architecture Decisions

The existing architecture decisions should be preserved to maintain consistency and avoid unnecessary refactoring.

## 8.3 Keep Changes Incremental

Changes should be made incrementally to minimize risk and ensure stability.

## 8.4 Avoid Unrelated Refactoring

Unrelated refactoring should be avoided to keep the focus on the specific task at hand.

## 8.5 Create PR Only

Only a pull request should be created for the changes, and the user should merge it manually.

## 8.6 Do Not Merge

The Codex implementation should not perform the merge operation, leaving it to the user to review and finalize.

# End

Status:
Ready for Codex Implementation