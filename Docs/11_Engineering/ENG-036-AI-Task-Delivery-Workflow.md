# ENG-036 AI Task Delivery Workflow

## Status

Accepted.

## Purpose

Define the standard AI-assisted development delivery workflow for TOP Modern.

The workflow defines the standard TOP AI task delivery lifecycle while keeping the GitHub repository committed and pushed state as the canonical source of truth.

## Context

Previous AI-assisted development work showed:

- Codex sandbox commits are not reliable project history.
- The GitHub repository committed and pushed state must remain the canonical source of truth.
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

### GitHub Repository

GitHub is responsible for canonical project history:

- Committed and pushed state
- Pull Request workflow
- Review record
- Merge history

## Standard Flow

```text
ChatGPT
  ↓
Task Definition
  ↓
Push task to GitHub
  ↓
Codex Implementation
  ↓
Pull Request
  ↓
Qoder Review
  ↓
Architecture Review
  ↓
Merge
```

## Codex Output Standard

Codex output should be concise and reviewable.

### Required Outputs

Codex should provide the following reviewable delivery artifacts when requested. These files are artifacts, not a separate workflow:

#### RESULT.md

`RESULT.md` should contain:

- Task
- Changed Files
- Summary
- Verification

#### Patch artifact

The patch artifact, named `03-PATCH.diff` inside a TES Handoff Package, should contain:

- Unified diff only

### Avoid

Codex output should avoid:

- Long explanation
- PR description
- Sandbox commit dependency

## Local Verification

Local repository work is a verification and staging step beneath the GitHub source of truth. When patch artifacts are used, the developer may verify them locally before pushing and opening or updating the Pull Request.

```bash
git apply --check 03-PATCH.diff
git apply 03-PATCH.diff
git diff
git diff --check
git commit
git push
```

## Source of Truth Rule

The GitHub repository committed and pushed state is the canonical source of truth for TOP Modern.

Priority order:

1. GitHub repository committed and pushed state.
2. Local repository commits.
3. Local working-directory changes.
4. Conversation history or AI memory.

Codex sandbox commits and patch artifacts are temporary execution artifacts only. They are not project history unless the developer reviews, commits, and pushes the changes to GitHub.

## Constraints

This workflow standard does not change:

- Modern runtime code
- Database schema
- API behavior
