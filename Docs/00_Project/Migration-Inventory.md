# Migration Inventory

Version: 1.0
Status: Active
Last Update: 2026-07-23

Owner: Paul Wu

---

## Purpose

Track the migration status of each Legacy capability into the Modern
architecture. Each entry records the current state, the Sprint that
delivered it, and any notes.

Source: Legacy-Architecture.md Capability Mapping

---

## Inventory

| Capability | Description | Target Module | Status | Sprint | Notes |
|---|---|---|---|---|---|
| Event Management | Tournament lifecycle and configuration | Operations Engine | Completed | 033 | CRUD API via competition service |
| Player Management | Player registration and information | Operations Engine | Completed | 033 | registerPlayer / withdrawPlayer |
| Scheduling | Match generation and arrangement | Competition Engine | Completed | 033 | generate / save / schedule APIs |
| Live Match | Score and court status | Competition Engine | Completed | 033 | updateMatch API |
| Player / Legal Check-in | Player waiver acceptance and check-in workflow | Operations Engine | Completed | 005 | waiver + check-in foundation |
| Team Management | Team competition management | Competition Engine | Not Started | — | |
| Referee Management | Referee assignment and operation | Operations Engine | Not Started | — | |
| Results | Ranking and final reports | Competition Engine | Not Started | — | |

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-23 | Initial inventory. Player / Legal Check-in marked Completed (Sprint 005). |
