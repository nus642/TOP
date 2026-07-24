# ENG-036 AI Task Delivery Workflow

## Status

Accepted.

## Purpose

Define the standard AI-assisted development delivery workflow for TOP Modern.

The workflow reduces manual copy/paste between ChatGPT, Codex, and local development while keeping the local Git repository as the final source of truth.

## Context

Previous AI-assisted development work showed:

- Codex sandbox commits are not reliable project history.
- The local Git repository must remain the final source of truth.
- AI implementation output should be easy to review and apply locally.

## Roles

### ChatGPT

ChatGPT is responsible for planning and review support:

- Architecture discussion
- Task specification
- Code review

### Codex

Codex is responsible for producing focused implementation output:

- Implementation
- Documentation update
- Diff generation

### Local Git

Local Git is responsible for final project history:

- Review
- Commit
- Push
- Final source of truth

## Standard Flow

```text
ChatGPT
  ↓
Task Specification
  ↓
Codex Implementation
  ↓
RESULT.md
  ↓
DIFF.patch
  ↓
Local Review
  ↓
Commit
  ↓
Push
```

## Codex Output Standard

Codex output should be concise and reviewable.

### Required Outputs

Codex should provide exactly the following delivery artifacts when requested for local application:

#### RESULT.md

`RESULT.md` should contain:

- Task
- Changed Files
- Summary
- Verification

#### DIFF.patch

`DIFF.patch` should contain:

- Unified diff only

### Avoid

Codex output should avoid:

- Long explanation
- PR description
- Sandbox commit dependency

## Local Workflow

The developer applies and verifies Codex output locally.

```bash
git apply --check DIFF.patch
git apply DIFF.patch
git diff
git diff --check
git commit
git push
```

## Source of Truth Rule

The local Git repository is the final source of truth for TOP Modern.

Codex sandbox commits are temporary execution artifacts only. They are not project history unless the developer reviews, applies, commits, and pushes the changes from the local repository.

## Constraints

This workflow standard does not change:

- Modern runtime code
- Database schema
- API behavior
## Relationship to Handoff Packages

This document owns the AI task-delivery workflow: the expected reviewable outputs and local application flow for AI-produced changes.

A task-specific handoff package may collect the task brief, executive summary, full report, local review notes, status, and patch evidence for a specific assignment. Such a package complements this workflow. It does not replace `ENG-035-AI-Development-Workflow.md`, does not redefine the ChatGPT/Codex/local Git roles, and should not duplicate this document's delivery rules.

If a future `TES-Handoff-Protocol.md` is added, it should define only the durable handoff package structure and should reference this document for AI task-delivery semantics.
