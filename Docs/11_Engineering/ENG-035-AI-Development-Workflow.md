# ENG-035 AI Development Workflow

## Status

Accepted.

## Workflow

```text
ChatGPT
  ↓
Task Specification
  ↓
Codex Implementation
  ↓
Local Review
  ↓
Commit
  ↓
Push
```

## Source of Truth

The local Git repository is the final source of truth.

Codex sandbox commits are temporary execution artifacts. They are not synchronized project history until the developer reviews and applies the changes in the local repository.

## Working Rule

Use Codex for focused implementation and documentation changes from a task specification.

Use local review before commit and push.
