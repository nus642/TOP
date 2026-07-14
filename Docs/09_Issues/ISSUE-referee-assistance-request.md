# TOP-ISSUE-00XX: Referee Assistance Request

## Type

Feature

## Priority

Medium (Future)

---

# Background

During live tournaments, referees occasionally encounter situations where they require assistance.

Examples include:

- Rule clarification
- Player disputes
- Equipment issues
- Medical incidents
- Court problems
- Tournament director intervention

Currently, referees usually leave the court, wave for assistance, or rely on verbal communication.

This is inefficient and may interrupt the match.

---

# Goal

Allow referees to request assistance with a single action while remaining at the court.

The request should immediately notify tournament officials without affecting the ongoing match.

---

# Design Philosophy

The referee should never need to search for help.

Help should come to the referee.

---

# MVP

A persistent "Assistance" button is available during every match.

When pressed:

The referee selects the request type.

Examples:

- Rules
- Tournament Director
- Medical
- Equipment
- Court Maintenance
- Other

The request is immediately delivered to tournament officials.

---

# Notification

The notification should include:

- Tournament
- Court Number
- Match
- Request Type
- Timestamp

Optionally:

- Short remark

---

# Request Status

Officials may update the request status.

Typical states:

- Requested
- Acknowledged
- On the Way
- Resolved

The referee can immediately see that help is coming.

---

# UI Requirements

The workflow should require no more than:

- 2 taps
- 3 seconds

The button should always remain accessible but should not interfere with score recording.

---

# Future Extensions

Possible future capabilities include:

- Broadcast to all available officials
- Priority levels
- Emergency requests
- Voice request
- Location tracking
- Smart routing to the nearest official

---

# Related Modules

Platform

- Tournament Operations
- Match Control
- User Role Management
- Notification System

Future Consumers

- Tournament Director Console
- Official Management
- Event Timeline