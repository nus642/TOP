# TOP Modern — Current Status

Last Updated: 2026-07-17

## Project

TOP Modern

Repository:

https://github.com/nus642/TOP

Main branch:

main


---

# Current Development Phase

## Phase

Modern Architecture Evolution


Current Milestone:

## 035 — Transaction Boundary Foundation

Status:

IN PROGRESS


---

# Completed Milestones

## 033 — Node v1 Migration

Status:

COMPLETED ✅


Summary:

- Migrated Node v1 functionality into Modern architecture.
- Preserved existing API compatibility.
- Added modular competition API routes.

Completed endpoints:

- GET /api/schedule
- POST /api/generate
- POST /api/save
- PUT /api/match/:id
- DELETE /api/reset


---

## 034.1 — Modern Architecture Stabilization

Status:

COMPLETED ✅


Summary:

Reduced server.js responsibility and established clearer architecture boundaries.


Completed:

### API Layer

Added:


Modern/api/legacy.js


Moved legacy compatibility routes out of server.js.


### Server Bootstrap

server.js now responsible for:

- Express initialization
- Middleware
- Router mounting
- Application startup


### Database Layer

Moved:

- MySQL connection ownership
- Database initialization

into:


Modern/database/db.js



Current architecture:


API
|
Service
|
Repository
|
Database



---

# Current Milestone

# 035 — Transaction Boundary Foundation

Objective:

Introduce database transaction boundaries for multi-step competition workflows.


Goal:

Prevent partial database updates while preserving:

- Existing API behavior
- Existing database schema
- Existing frontend behavior


Constraints:

- No schema redesign
- No API changes
- tournamentId remains 1 temporarily


---

# Completed in 035

## 035.1 Database Transaction Helper

Status:

COMPLETED ✅


File:


Modern/database/db.js



Added:


withTransaction()



Responsibilities:

- acquire connection
- begin transaction
- commit
- rollback
- release connection


---

## 035.2.1 Player Repository Transaction Support

Status:

COMPLETED ✅


File:


Modern/repositories/player.repository.js



Updated methods:

- createPlayer()
- resetPlayerRuntimeStatsByTournament()
- deletePlayersByTournament()
- deletePlayerPartnersByTournament()
- deletePlayerOpponentsByTournament()
- getPlayerMap()


Pattern:

Before:


repository
|
db.query()



After:


repository
|
connection.query()

default:
connection = db

transaction:
connection = transaction connection



Compatibility preserved:

Existing calls continue working.


---



## 035.2.2 Match Repository Transaction Support

Status:

COMPLETED ✅

Target:


Modern/repositories/match.repository.js



Tasks:

- Add connection parameter
- Replace write operations:


db.query()
↓
connection.query()


Target methods:

- createMatch()
- deleteMatchesByTournament()
- updateMatchScore()


### 035.2.3 Pairing Repository
Status:

COMPLETED ✅

Prepare pairing operations for transaction support.

File:

Modern/repositories/pairing.repository.js


Updated methods:

- createPairing()
- deletePairingsByTournament()


Pattern:

Before:

repository
|
db.query()


After:

repository
|
connection.query()


Default:

connection = db

Transaction:

connection = transaction connection



### 035.2.4 Tournament Repository

Status:

COMPLETED ✅

File:

Modern/repositories/tournament.repository.js


Updated methods:

- updateTournamentName()


Pattern:

Before:

repository
|
db.query()


After:

repository
|
connection.query()


Default:

connection = db

Transaction:

connection = transaction connection

---



### 035.3 Service Transaction Boundary

Introduce:


db.withTransaction()


at service workflow level.


Target workflows:

- updateMatch()
- resetCompetition()
- generateCompetition()
- saveSchedule()

## 035.3.1 updateMatch Transaction Boundary

Status:

COMPLETED ✅


File:

Modern/services/competition.service.js


Workflow:

updateMatch()

Uses:

db.withTransaction()


Repositories involved:

- matchRepository.updateMatchScore()
- playerRepository.resetPlayerRuntimeStatsByTournament()



## 035.3.2

建立 Service Transaction Boundary

Status:

COMPLETED ✅

# Next Step

## 035.3.3

Generate Competition

---


# Architecture Principles

## Responsibility Separation

server.js:

Application bootstrap only.


API:

HTTP handling only.


Service:

Business workflow orchestration.


Repository:

Database operations only.


Database:

Connection and transaction management.


---

# Development Workflow

Standard workflow:


Review
↓
Action Guide
↓
Small implementation
↓
Syntax check
↓
Verification
↓
Git commit
↓
Push



---

# Current Git Status

Branch:


main



Latest completed: 2026-7-20


035.3.2 建立 Service Transaction Boundary


Working tree:

Clean after commit.


---

# Notes

Legacy API remains intentionally supported.

Legacy decomposition is not part of current milestone.

Future priorities:

1. Transaction consistency
2. Tournament context
3. Competition lifecycle
4. Event foundation
5. Referee / analytics / AI capability