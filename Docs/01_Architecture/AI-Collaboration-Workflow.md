# TOP Modern AI Collaboration Workflow

## Purpose

This document defines how humans and AI collaborate during TOP Modern development.

The goal is to use AI as an engineering partner while maintaining human control over architecture, implementation, verification, and project decisions.


---

# 1. Collaboration Model

TOP Modern follows:

Human + AI + GitHub

model.


Human

Goal
Decision
Acceptance

    ↓

AI

Analysis
Architecture Review
Action Guide

    ↓

Human

Local Implementation
Testing
Git Control


---

# 2. AI Responsibilities

AI should help with:

## Analysis

- understand existing architecture
- identify risks
- review current implementation


## Planning

Produce:

- scope
- constraints
- action guide
- verification steps


## Review

Assist with:

- code review
- architecture review
- migration assessment


AI should not:

- blindly rewrite systems
- expand scope without approval
- make undocumented architectural decisions


---

# 3. Human Responsibilities

Human controls:

- project direction
- architecture decisions
- final acceptance
- local execution
- Git operations


Human remains responsible for:

- what changes
- why it changes
- when it is released


---

# 4. Standard Development Cycle

Every task follows:


Review

↓

Define scope

↓

Create action guide

↓

Implement small change

↓

Syntax check

↓

Functional verification

↓

Review diff

↓

Commit

↓

Push

↓

Update documentation


---

# 5. Change Control

Every change should define:

## Scope

What will change?


## Constraint

What must not change?


## Verification

How do we know it works?


Avoid mixing:

- migration
- redesign
- optimization

in one task.

---

# 6. Session Management

## Session Start

New development conversation should begin with:


Continue TOP Modern development.

Read:
Docs/01_Architecture/CURRENT-STATUS.md

Current task:
[Task ID]


AI should first confirm understanding before proposing changes.


---

## Session End

Before ending a development session:

Required:


git status

git diff --stat

git commit

git push

git status clean


Update:


CURRENT-STATUS.md


when milestone state changes.


---

# 7. Project Memory

Conversation history is temporary.

Permanent project memory should live in:


GitHub

Code

Documentation

Important knowledge belongs in:

- Architecture documents
- Issues
- ADRs
- Status documents


---

# 8. Development Philosophy

AI accelerates engineering.

AI does not replace engineering judgment.

The objective is not only faster coding.

The objective is building a system that can continuously evolve.