# ENG-035 AI Development Workflow

## Status

Superseded by ENG-036.

This document remains as a lightweight historical and principle record. For the current standard workflow, use [ENG-036 AI Task Delivery Workflow](./ENG-036-AI-Task-Delivery-Workflow.md).

## Historical Workflow Principle

```text
ChatGPT
  ↓
Task Definition
  ↓
Push to GitHub
  ↓
Codex
  ↓
Pull Request
  ↓
Qoder Review
  ↓
Architecture Review
  ↓
Merge
```

## Source of Truth

The GitHub repository committed and pushed state is the canonical source of truth. Local repository state, working-directory changes, and conversation history are subordinate to GitHub.

Codex sandbox commits and patch files are temporary execution artifacts. They are not synchronized project history until the developer reviews, commits, and pushes the changes to GitHub.

## Working Rule

Use Codex for focused implementation and documentation changes from a task specification.

Use local review before commit and push. Use ENG-036 for the active delivery workflow and review sequence.
