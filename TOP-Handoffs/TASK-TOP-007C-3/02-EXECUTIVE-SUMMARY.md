# Architecture Decision Summary for TASK-TOP-007C-3

## Architecture Decision
- Competition context should remain explicit at API boundary to maintain clarity and avoid ambiguity in the API design.
- Modern routes should receive competitionId from URL parameters for better RESTful practices and efficiency.
- Existing service transaction behavior must be reused to ensure consistency and reduce redundancy in the codebase.

## Route Decision
The selected routes are:
- `DELETE /api/competition/:competitionId/reset`
- `POST /api/competition/:competitionId/generate`

**Reasons:**
- Route parameters are preferred over query or body context because they align with REST conventions, simplify URL structure, and are more intuitive for clients.
- Legacy routes remain available during migration to ensure backward compatibility and minimize disruption to existing systems.

## Migration Decision
- This migration is incremental, meaning changes are applied step by step.
- Existing legacy routes continue functioning to support gradual adoption.
- No breaking API removal is enforced to maintain stability and allow for phased implementation.

## Scope Boundary
**Included:**
- Adding scoped reset and generate routes.
- Implementing API validation.
- Conducting regression tests to ensure existing functionality is not affected.

**Excluded:**
- Changes to the schedule algorithm.
- Redesign of match generation.
- Modifications to pairing logic.
- Database schema alterations.
- Frontend migration efforts.

## Implementation Guidance
For development teams using Codex:
- Preserve the existing `resetCompetition` and `generateCompetition` services to leverage current functionality.
- Maintain transaction boundaries to ensure data integrity.
- Keep the API layer thin for better performance and separation of concerns.
- Avoid unrelated refactoring to focus on the migration goals.
- Submit changes as a Pull Request only after thorough testing.

**Status:** Architecture Approved - Ready for Implementation Planning