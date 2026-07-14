# TOP Match Data Capture

## Purpose

Match Data Capture is a core platform capability of TOP.

Its purpose is to collect a very small amount of high-value match intelligence during competition while preserving the simplicity and fairness of officiating.

This module belongs to the TOP Platform itself rather than any individual product.

Future consumers include:

- OPRE
- OPRS
- Coach Module
- AI Video Analysis
- Player Reports
- Tournament Analytics

---

## Design Philosophy

TOP follows one simple principle:

> **Minimal Capture, Maximum Insight**

Capture the smallest amount of data that creates the greatest long-term value.

The platform deliberately avoids turning referees into statisticians.

Instead, every participant contributes only the information they are naturally positioned to observe.

---

## Guiding Principles

### Referees remain referees.

Officiating always has higher priority than data collection.

If a conflict occurs:

**Officiating wins.**

---

### Capture only meaningful events.

Not every shot deserves recording.

Only high-value observations should be captured.

---

### Distributed Capture

The platform supports multiple independent observation sources.

Examples include:

- Chief Referee
- Assistant Referee
- Certified Coach
- Data Official
- AI Video Analysis
- Player Self Review

Different sources may carry different confidence levels.

---

### Platform Capability

Match Data Capture provides structured observations.

It does not interpret them.

Future engines such as OPRE and OPRS consume these observations to generate higher-level insights.

---

## Architecture

```text
Chief Referee
    │
    ├── Quick Critical Event Capture
    │
Assistant Referee
    │
    ├── Distributed Assistant Data Capture
    │
Coach
    │
    ├── Coach Annotation (Future)
    │
AI
    │
    ├── Video Recognition (Future)
    │
    ▼

Match Data Capture

    ▼

Match Intelligence Engine (Future)

    ▼

Consumers

├── OPRE
├── OPRS
├── Player Reports
├── Coach Reports
└── Tournament Analytics
```

---

## Current Features

### Planned

- Quick Critical Event Capture
- Distributed Assistant Data Capture

---

### Future

- Coach Annotation
- Video Timeline
- AI Recognition
- Confidence Engine
- Match Intelligence

---

## Related Documents

- TOP-ISSUE-0001 Quick Critical Event Capture
- TOP-ISSUE-0002 Distributed Assistant Data Capture

---

## Long-term Vision

Match Data Capture is designed to become the unified observation layer of the TOP Platform.

Its responsibility is simple:

- Capture facts.
- Preserve sources.
- Record timestamps.
- Leave interpretation to future intelligence engines.

As the platform evolves, additional observation sources may be introduced without changing the overall architecture.

The long-term vision is to enable a complete Match Intelligence ecosystem while maintaining TOP's core philosophy:

> **Minimal Capture, Maximum Insight**