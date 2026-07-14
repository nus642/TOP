# DEV-003 AI-Assisted Development Workflow

## Purpose

Define the standard workflow for AI-assisted software development in the TOP project.

---

## Workflow

Business Requirement

↓

Architecture Design (ChatGPT)

↓

Implementation (Codex)

↓

Architecture Review (ChatGPT)

↓

Manual Merge (Developer)

↓

Integration Test

↓

Task Complete

---

## Rules

### Rule 1

ChatGPT owns:

- Architecture
- Technical decisions
- Code review

---

### Rule 2

Codex owns:

- Analysis
- Code implementation
- Refactoring

---

### Rule 3

Developer owns:

- Manual merge
- Integration testing
- Final verification

---

### Rule 4

Never overwrite an entire source file.

Only merge the required changes.

---

### Rule 5

Prefer Patch over Full File.

Codex should output:

- Added functions
- Modified exports
- Required insertions

instead of regenerating the entire file.

---

### Rule 6

Do not generate downloadable artifacts with source-code filenames.

Avoid:

- *.js
- *.ts
- *.tsx

Prefer:

- Markdown
- Patch format
- Neutral titles

---

## Guiding Principle

Build for Today.

Design for Tomorrow.