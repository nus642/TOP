# RESULT-036.2.5 Legacy Match Migration

Status:
Completed

Milestone:
036 Transaction Consistency & Legacy Unification

---

# Changes

Migrated:

PUT /api/match/:id

from direct SQL operations in legacy.js to:

competitionService.updateMatch()

---

# Architecture Impact

Before:

Legacy API
    |
    SQL
    |
    Database


After:

Legacy API
    |
    Service Layer
    |
    Repository
    |
    Database

---

# Compatibility

- URL unchanged
- Request parameters unchanged
- Success response unchanged
- Error response unchanged
- No active frontend caller affected

---

# Improvements

- Added transaction protection
- Removed duplicated SQL workflow
- Removed unused statistics placeholder query

---

# Additional Finding

The legacy route contained unfinished statistics recalculation code:

- SELECT finished matches
- Empty iteration loop

This was removed during route consolidation.

No behavior change introduced.

---

# Verification

- node --check Modern/api/legacy.js
- git diff --check

---

# Follow-up

Continue:

036.2.6 GET /api/schedule migration
