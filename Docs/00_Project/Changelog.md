# CHANGELOG

## [0.1.0] - 2026-07-08

### Added

- Blueprint
- Roadmap
- Engineering Playbook
- AI Collaboration Guide
- Documentation Portal

### Changed

- Established Engineering Governance
- Established Documentation Hierarchy

### Notes

Foundation Architecture Completed.

# Project Development Changelog

## 2026-07-15

### 033.11 Frontend Schedule API Migration

Background:
Legacy frontend was still consuming `/api/schedule`.

Changes:
- Updated Modern/index.html.
- Added state.mode restoration.

Verification:
- GET /api/competition/schedule returns:
  - tournament
  - players
  - matches
  - pairings
  - mode=fixed-pair

Related:
- 033.10-A Backend Competition Schedule API