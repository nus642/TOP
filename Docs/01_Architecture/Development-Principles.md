# TOP Modern Development Principles

## Purpose

This document defines the engineering principles used to evolve TOP Modern.

It describes how we make decisions, how we collaborate with AI, and how we control system complexity during long-term development.

---

# 1. Evolution Over Rewrite

TOP Modern follows gradual evolution instead of complete rewriting.

Principle:


Understand
↓
Extract
↓
Stabilize
↓
Improve


Avoid:


Delete
↓
Rewrite everything


Reasons:

- preserve existing business knowledge
- reduce migration risk
- maintain behavioral compatibility

---

# 2. Architecture Before Feature Expansion

Before adding new capabilities, establish clear architectural boundaries.

Priority:


Architecture
↓
Data integrity
↓
Domain model
↓
New features


Avoid adding features on unstable foundations.

---

# 3. Compatibility First

During migration:

Preserve:

- API behavior
- Database structure
- Existing user workflow

Unless explicitly required:

Do not change:

- endpoint contracts
- response formats
- business behavior

---

# 4. Small Step Engineering

Large refactoring creates hidden risks.

TOP Modern uses incremental changes.

Standard pattern:


Small change

↓

Syntax check

↓

Functional verification

↓

Git commit

↓

Next step


Every change should have:

- clear scope
- clear verification method
- reversible history

---

# 5. Separation of Responsibility

System layers have clear responsibilities.

Architecture:


API

↓

Service

↓

Repository

↓

Database


Responsibilities:

## API

Responsible for:

- HTTP handling
- request/response

Not responsible for:

- business logic
- SQL


## Service

Responsible for:

- business workflow
- transaction boundary
- orchestration


## Repository

Responsible for:

- database operations
- SQL implementation


## Database Layer

Responsible for:

- connection
- transaction infrastructure

---

# 6. Human + AI Collaboration

AI is an engineering partner, not an automatic code generator.

AI responsibilities:

- analyze architecture
- identify risks
- propose solutions
- generate action guides
- review changes


Human responsibilities:

- make final decisions
- execute local changes
- run verification
- control Git history

---

# 7. Behavioral Compatibility Over Clever Improvement

During migration:

Do not improve behavior accidentally.

A migration task should answer:


What changes?

What does not change?

How do we verify?


Avoid mixing:

- migration
- redesign
- optimization

in one step.

---

# 8. Avoid Premature Complexity

Do not introduce complexity before the foundation requires it.

Examples:

Delay until justified:

- event systems
- microservices
- advanced AI layers
- unnecessary abstractions

Prefer:

simple structure that can evolve.

---

# 9. Documentation As System Memory

Code describes:

"what the system does."

Documentation preserves:

"why the system is built this way."

Important decisions should be recorded in:

- Architecture documents
- Issues
- ADRs
- Current status

The project should not depend on conversation history alone.

---

# 10. Fighting Entropy

Software systems naturally become more complex over time.

TOP Modern uses:

- architecture
- documentation
- conventions
- automation

as mechanisms to create order.

The goal is not only to build features.

The goal is to build a system that can continue evolving.