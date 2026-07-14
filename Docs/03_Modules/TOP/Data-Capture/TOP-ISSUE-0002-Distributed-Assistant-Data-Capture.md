# TOP-ISSUE-00XX: Distributed Assistant Data Capture

## Type

Feature (Future Capability)

## Priority

Low (Future)

---

# Background

TOP will support multi-official tournaments, including:

- Chief Referee
- Assistant Referee (Line Judge)

Traditionally, assistant referees are responsible for:

- In / Out decisions
- Supporting the chief referee

During many amateur tournaments, assistant referees often have available attention outside of active line calls.

TOP aims to utilize this opportunity to collect valuable match intelligence without interfering with officiating duties.

---

# Why This Matters

Modern tournaments generate far more valuable information than a single referee can reasonably capture.

Instead of increasing the workload of one official, TOP distributes lightweight data capture across multiple trusted participants.

Each participant contributes a very small amount of information.

Together, they create a much richer understanding of the match.

---

# Core Philosophy

Assistant referees remain referees first.

Officiating always has higher priority than data collection.

If a conflict occurs:

**Officiating wins.**

Data collection may be skipped.

---

# Goal

Allow assistant referees to participate in lightweight match data collection using their own devices.

Meanwhile, the chief referee remains focused on:

- Match control
- Score management
- Rule enforcement
- Match flow

without additional workload.

---

# Design Principles

### Principle 1

Never interfere with officiating.

---

### Principle 2

Distributed responsibility.

Each participant captures only the information they are naturally positioned to observe.

---

### Principle 3

Minimal interaction.

Every capture should require:

- ≤3 taps
- ≤2 seconds

---

### Principle 4

Optional participation.

No captured event is mandatory.

---

# Observation Scope

Each assistant referee is assigned a predefined observation scope.

Typical examples include:

- One side of the court
- One team
- Two players

This reduces observation complexity and improves capture accuracy.

---

# MVP

Assistant referees may record only critical events.

## Scoring Event

- Winner
- Great Shot

## Error Event

- Unforced Error
- Service Fault

The workflow should remain identical to the referee Quick Critical Event Capture feature.

---

# Data Synchronization

Captured events should be synchronized to the chief referee's device in real time whenever network connectivity is available.

After the match:

- Merge all observations
- Generate match intelligence
- Preserve event sources

---

# Data Ownership

Every captured event should contain:

- Event Type
- Event Source
- Timestamp

Future versions may additionally include:

- Confidence
- Review Status
- Video Reference

The platform should never assume every observation has equal reliability.

---

# UI Requirements

The assistant referee interface should remain extremely simple.

Display only:

- Current score
- Current server
- Assigned players
- Critical event buttons

Avoid:

- Technical statistics
- Complex menus
- Large amounts of interaction

The interface should never distract the official from observing the match.

---

# Out of Scope

Version 1 does NOT include:

- Drop
- Dink
- Reset
- Volley
- ATP
- Erne
- Lob

These belong to:

- Coach Mode
- Professional Statistics
- AI Video Analysis

---

# Future Architecture

Distributed match intelligence may eventually receive observations from:

- Chief Referee
- Assistant Referee
- Certified Coach
- Data Official
- AI Video Analysis
- Player Self Review

All observations become inputs to the future Match Intelligence Engine.

---

# Future Extensions

Possible future capabilities include:

- Dedicated Data Official mode
- Coach Annotation mode
- Video timeline association
- AI recognition with human confirmation
- Offline synchronization
- Voice input
- Gesture shortcuts

---

# Open Questions

- Should assistant referees be allowed to edit records after the match?
- Should voice recording be supported?
- Should offline synchronization be supported?
- How should conflicting observations be resolved?
- Should the chief referee have final approval?
- Should confidence scores be introduced?
- Should multiple sources report the same event independently?

---

# Related Modules

Platform

- TOP Officiating
- Match Data Capture
- Match Intelligence

Related Features

- Quick Critical Event Capture
- Multi-device Match Control
- User Role Management
- Real-time Synchronization

Future Consumers

- OPRE
- OPRS
- Coach Module
- AI Video Analysis
- Tournament Analytics