# AI Workflow Guide

This document defines the collaboration protocol for AI-assisted work in the TOP repository.

This is a process guide only.
It does not modify production code.
It does not define domain boundaries.
It does not introduce architecture decisions.

---

## 1. General Principles

- Evidence before assumption.
- Existing domain boundaries must be preserved.
- Do not invent missing business rules.
- Do not expand scope without explicit instruction.
- Documentation tasks remain documentation-only unless explicitly changed.

---

## 2. PR Review Protocol

Before reviewing any PR, confirm:

- Current local branch.
- Base branch.
- PR remote branch.
- HEAD commit.
- Merge base.
- Actual changed files.

Rules:

- Review only files present in the diff.
- Do not rely only on PR title.
- If review context and repository state disagree, report mismatch.
- Do not review nonexistent files.
- Do not assume renamed or missing files.

---

## 3. File Modification Protocol

Before editing:

- Locate the actual target file.
- Confirm the path exists.
- Do not create replacement files.
- Do not rename files unless instructed.
- Do not modify unrelated files.

After editing:

- Show diff.
- Wait for confirmation before commit.

---

## 4. CHECKPOINT Update Protocol

Rules:

- CHECKPOINT.md records completed project state.
- Keep existing entries unchanged.
- Keep Next Action unchanged unless explicitly instructed.
- Add completion summaries only.
- Do not duplicate task documents.
- Do not introduce new architecture decisions.

---

## 5. Git Branch Protocol

Before work, confirm:

- Current branch.
- Upstream branch.
- Working tree status.

Rules:

- PR work happens on PR branch.
- Post-merge checkpoint updates happen on main.
- Do not push without confirming upstream.
- Prefer explicit push commands when local and remote branch names differ.
- Never force push unless explicitly authorized.

---

## 6. Scope Protection

Avoid:

- Creating unnecessary domains.
- Introducing workflow engines.
- Adding APIs during boundary analysis.
- Changing ownership because of UI concepts.
- Treating legacy implementation objects as future models.

---

## 7. Completion Checklist

Before declaring done:

- [ ] Review completed
- [ ] Diff checked
- [ ] Commit created
- [ ] Push completed
- [ ] Working tree clean
- [ ] CHECKPOINT updated when required