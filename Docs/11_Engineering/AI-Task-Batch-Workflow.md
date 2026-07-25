# AI Task Batch Workflow

Version: 1.0
Status: Draft

---

# 1. Purpose

This document defines the AI-assisted engineering workflow used by TOP.

The goal is to combine human architectural thinking with multiple AI execution agents while maintaining repository governance, traceability, and delivery quality.

The workflow separates:

- Task definition
- AI execution
- Review
- Merge
- Knowledge accumulation

---

# 2. Workflow Overview


Human Intent
|
v
AI Task Queue
|
v
Task Definition
|
+----------------+
| |
v v
ChatGPT Cline
Architecture Local Execution
| |
+----------------+
|
v
Git Repository
|
v
PR
|
v
Review
|
v
Merge


---

# 3. AI Roles

## ChatGPT — Architect

Responsibilities:

- Requirement clarification
- Architecture discussion
- Task decomposition
- Documentation generation
- Design review

ChatGPT defines the problem boundary.

---

## Cline + Local Models — Daytime Executor

Responsibilities:

- Documentation updates
- Low-risk repository changes
- Local experiments
- Small maintenance tasks

Cline provides flexible daytime execution.

---

## Codex — Batch Implementation Worker

Responsibilities:

- Production implementation
- Test development
- Repository changes
- Pull Request creation

Codex executes clearly defined tasks.

---

## Qoder — Reviewer

Responsibilities:

- Scope verification
- Code quality review
- Architecture consistency check
- Merge recommendation

---

# 4. Task Types

| Type | Purpose | Typical Agent |
|---|---|---|
| DOC | Documentation and knowledge assets | ChatGPT / Cline |
| TEST | Regression and quality protection | Codex |
| CODE | Production implementation | Codex |
| REVIEW | Analysis and verification | ChatGPT / Qoder |

---

# 5. Batch Execution Rules

## Independent Tasks

Independent tasks may be processed together.

Example:


TASK-DOC-001
TASK-DOC-002
TASK-TEST-001


---

## Dependent Tasks

Dependent tasks must follow dependency order.

Example:


TASK-A

|

v

TASK-B


---

# 6. PR Principles

Default:


One task = One purpose = One PR


Related tasks may share one PR.

Example:


TASK-DOC-001
TASK-DOC-002

    |
    v

User Manual Documentation PR


---

# 7. Risk Classification

## Low Risk

Examples:

- Documentation
- Test-only changes
- Independent utilities

## Medium Risk

Examples:

- API additions
- Refactoring
- Internal improvements

## High Risk

Examples:

- Database changes
- Architecture changes
- Core workflow changes

---

# 8. Source of Truth

All changes follow TOP Engineering Governance:

1. GitHub committed and pushed state
2. Local repository commits
3. Working tree changes
4. Current task instructions
5. Conversation history

---

# 9. Continuous Improvement

Each completed task contributes:

- Code assets
- Documentation assets
- Workflow improvements

The AI workflow itself evolves through practical usage.