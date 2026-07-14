# Legacy Architecture

Version: 1.1

Status: Audit

---

# Overview

Legacy represents TOP Generation 1 system.

The purpose of this document is to identify existing business capabilities before migration into TOP Platform.

---

# Core Discovery

legacy/data.php is not only a data access file.

It contains multiple business responsibilities including:

- Event management
- Player management
- Team management
- Competition scheduling
- Referee operation
- Live scoring
- Check-in management
- Result management

Migration must be based on business capability, not source files.

---

# Capability Mapping

| Capability | Description | Target Module |
|---|---|---|
| Event Management | Tournament lifecycle and configuration | Operations Engine |
| Player Management | Player registration and information | Operations Engine |
| Team Management | Team competition management | Competition Engine |
| Scheduling | Match generation and arrangement | Competition Engine |
| Referee Management | Referee assignment and operation | Operations Engine |
| Live Match | Score and court status | Competition Engine |
| Check-in | Player check-in workflow | Operations Engine |
| Results | Ranking and final reports | Competition Engine |

## Audit Principle

Legacy schema interpretation follows evidence-based analysis.

Business meaning must be determined by:

1. Table structure
2. Field definitions
3. Code usage
4. Actual business workflow

Table names alone must not be considered authoritative.



---

## Version History

### v1.1

Changes:

- Added production database audit results.
- Corrected business meaning of several tables.
- Updated table-to-engine mapping.
- Added evidence-based schema interpretation principle.

---

### v1.0

Initial legacy capability mapping.