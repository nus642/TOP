# Competition Engine

Version: 1.0

Status: Active

Last Updated: 2026-07-10

Author:
Paul Wu + ChatGPT

---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-10 | Initial Competition Engine definition |

---

# Purpose

Competition Engine is responsible for all competition-related business logic.

It is independent from Operations Engine.

---

# Responsibilities

Competition Engine manages:

- Tournament
- Players
- Teams
- Pairings
- Match Scheduling
- Match Results
- Ranking
- Statistics
- Competition Rules

---

# Out of Scope

The following functions belong to Operations Engine:

- Check-in
- Referee Assignment
- Court Management
- Announcements
- Waivers
- Event Operation
- Volunteer Management

---

# Public Interfaces

Competition Engine provides services for:

- Schedule Generation
- Schedule Saving
- Match Update
- Ranking Calculation
- Statistics Calculation

---

# Future Extensions

- Swiss System
- Round Robin
- Fixed Pair
- Team Event
- MLP
- Ladder
- League
- AI Scheduling