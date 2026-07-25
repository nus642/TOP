# TASK-TOP-007C-3: Complete Modern Scoped Schedule Lifecycle

**Type:** CODE  
**Priority:** Medium  
**Dependency:** TASK-TOP-007C-2  

**Objective:** Extend the competition-scoped schedule API migration by adding scoped routes for remaining schedule lifecycle operations.  

**Background:** TASK-TOP-007C-2 introduced explicit competition context at the API boundary through:  
POST /api/competition/:competitionId/schedule  

This task continues the incremental migration for remaining schedule lifecycle operations.  

**Scope Included:**  
- Add scoped reset route  
- Add scoped generate route  
- Preserve existing service transaction behavior  
- Preserve legacy routes  
- Add API regression tests  

**Scope Excluded:**  
- Schedule algorithm changes  
- Match generation redesign  
- Pairing logic changes  
- Database schema changes  
- Frontend changes  
- Legacy route removal  

**Acceptance Criteria:**  
- Competition context is explicit in new scoped lifecycle routes  
- Invalid competition IDs are rejected  
- Non-existent competitions cannot trigger lifecycle writes  
- Existing transaction behavior remains unchanged  
- Existing tests continue passing  
- New API regression tests cover new routes  
- Legacy behavior remains functional