# TASK-REG-001: Modern Competition Participation Foundation

**Type:** CODE  
**Priority:** Medium  
**Dependency:** TASK-TOP-007C-3

**Objective:** Establish the modern competition participation foundation, connecting participants with competitions through explicit ownership and lifecycle management.

**Background:** TOP has completed competition context isolation and modern schedule lifecycle routes. The next step is to establish a modern competition participation domain before schedule generation and match execution. Registration serves as an upstream source of Entries, with external registration platforms supported.

**Scope Included:**  
- Define competition registration domain boundary  
- Establish participant registration ownership  
- Add modern registration API design  
- Preserve legacy behavior where required  
- Add regression tests  

**Scope Excluded:**  
- Ranking calculation  
- Match generation algorithm  
- Pairing algorithm redesign  
- Frontend redesign  
- Database redesign unless required  

**Acceptance Criteria:**  
- Registration ownership is explicit  
- Invalid competition context is rejected  
- Registration lifecycle behavior is defined  
- Existing competition behavior remains functional  
- Tests cover new registration flows