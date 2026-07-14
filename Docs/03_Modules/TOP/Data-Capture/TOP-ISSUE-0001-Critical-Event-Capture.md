# TOP-ISSUE-00XX: Quick Critical Event Capture

## Type

Feature

## Priority

Medium (V2 / V3)

---

# Background

Current TOP officiating focuses on:

- Score recording
- Service management
- Match completion

Future versions aim to collect a very small amount of high-value match intelligence without increasing referee workload.

The collected data will become the foundation for:

- Player development reports
- Coach analysis
- AI training datasets
- Match review
- OPRS Skill Engine
- Future analytics modules

---

# Why This Matters

TOP believes referees should remain referees.

Unlike traditional tournament systems that often require dedicated hardware or dedicated statisticians, TOP aims to collect valuable match intelligence while preserving the simplicity of officiating.

Design philosophy:

> **Minimal Capture, Maximum Insight**

Capture the smallest amount of data that creates the largest long-term value.

---

# Goal

After each rally, the referee may spend **1–2 seconds** recording one meaningful event.

If nothing noteworthy occurred:

**No additional action is required.**

---

# Design Principles

### Principle 1

Never interrupt the officiating process.

---

### Principle 2

Referees are not statisticians.

---

### Principle 3

All event recording is optional.

Nothing is mandatory.

---

### Principle 4

Capture less.

Capture only meaningful events.

---

# Non Goals

This feature is **NOT** intended to:

- Replace professional match statistics.
- Record every technical shot.
- Increase referee workload.
- Affect match flow.

Advanced technical analysis belongs to:

- Coach Mode
- AI Video Analysis

---

# MVP Workflow

After recording the point winner:

```
No Record (Default)

OR

Record Critical Event
```

---

## Step 1

Select Player

```
A1
A2
B1
B2
```

---

## Step 2

Select Event

### Scoring Event

- Winner
- Great Shot

### Error Event

- Unforced Error
- Service Fault

Only four buttons in Version 1.

Return immediately to the next rally.

---

# Not Included (V1)

No technical statistics.

Examples:

- Drop
- Dink
- Reset
- Volley
- ATP
- Erne
- Lob

These belong to future coaching and AI analysis.

---

# Data Value

Captured events may support:

- Player Progress Report
- Coach Review
- Match Replay
- AI Training Dataset
- OPRS Skill Engine
- Tournament Analytics

By default, these observations **do not directly affect player ratings**.

Future engines may consume these events with confidence weighting.

---

# UI Requirements

Target:

- ≤3 taps
- ≤2 seconds

Most rallies require no additional interaction.

---

# Future Architecture

This feature represents the first layer of TOP Match Intelligence.

Future data sources may include:

- Referee Quick Capture
- Certified Coach Annotation
- AI Video Recognition
- Player Self Review

Each source may carry a different confidence level.

---

# Future Extensions

Possible future capabilities:

- Coach Mode
- Technical Statistics Mode
- AI Recognition
- Video Timeline Association
- Voice Input
- Gesture Shortcuts

---

# Open Questions

- Should custom events be supported?
- Should post-match supplementation be allowed?
- Should coach annotations be stored separately?
- Should every event include a confidence score?
- Should events be linked to video timestamps?

---

# Related Modules

Platform

- TOP Officiating
- Match Intelligence
- Data Capture

Consumers

- OPRE
- OPRS
- Coach Module
- AI Video Analysis
- Player Report