# Resource Management Boundary — Executive Summary

**Task:** TASK-RES-001-A1

**Date:** 2026-07-30

**Status:** Documentation Complete

---

## What This Defines

Resource Management is the authoritative source of facts about TOP's courts and referees. It describes which resources exist, what they are, and whether they are available.

It does not schedule those resources or operate matches.

## Guiding Principle

**TOP is a domain fact system, not a workflow engine.**

Resource Management publishes facts that other domains can use. A consumer may make a decision from those facts, but that decision does not become a Resource Management responsibility.

## Facts Owned by Resource Management

| Resource | Role | Facts owned |
|----------|------|-------------|
| Court | Competition resource | Identity, definition, availability |
| Referee | Operational resource | Identity, qualification information, availability |

Availability is itself a business fact. It answers whether a resource is available for consideration; it does not say that the resource has been assigned.

## The Critical Separation

> **Resource availability does not equal scheduling assignment.**

| Resource Management | Scheduling |
|---------------------|------------|
| Provides resource facts | Consumes resource facts |
| Records availability | Evaluates availability for scheduling needs |
| Describes courts and referees | Selects resources |
| Does not reserve or assign | Creates assignments |

This separation keeps resource data reusable and prevents scheduling decisions from being hidden inside resource status changes.

## Outside the Boundary

Resource Management does not own:

- Scheduling or assignment
- Task queues
- Match execution or match results
- Competition records
- Ranking
- Analytics

These concerns remain in their respective domains. In particular, Match Operations remains the owner of match execution and outcome facts, while Competition Result Recording remains the owner of official competition records.

## Legacy Guidance

The modern design retains the valid legacy understanding that courts are competition resources, referees are operational resources, and availability is a business fact.

It does **not** copy the legacy coupling between referee status and court state. Court and referee facts are independent. Connecting a referee and a court for a match is an assignment or operational concern, not a reason to merge their resource state.

## Intentionally Not Designed

This package does not define automatic scheduling, optimization, notifications, or a workflow engine. It also does not introduce implementation models, APIs, storage, or production code.

## Outcome

The boundary is intentionally narrow:

**Resource Management provides trustworthy resource facts; Scheduling consumes those facts and creates assignments.**

---

*End of Executive Summary*
