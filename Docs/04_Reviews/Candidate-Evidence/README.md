# Candidate Evidence Packages

This directory is the documentation home for evidence packages associated with
specific repository candidates. Each package is named with the candidate's full
Git commit SHA so that evidence can be filed against an unambiguous, immutable
repository state.

## Package structure

```text
<full-commit-sha>/
├── CANDIDATE.md
├── 01-candidate-identity/
├── 02-scope-boundary/
├── 06-recovery/
└── 08-limitations/.gitkeep
```

- `CANDIDATE.md` is the package index and identifies the candidate.
- `01-candidate-identity/` contains evidence that independently records
  or verifies candidate identity.
- `02-scope-boundary/` contains evidence describing what a review did
  and did not examine.
- `06-recovery/` contains evidence describing recovery continuity.
- `08-limitations/` is reserved for observed limitations, qualifications, and
  constraints on interpretation.

The current active evidence domains are:

1. **01 Candidate Identity**
2. **02 Scope Boundary**
3. **06 Recovery Continuity**

Category numbers are not contiguous because evidence domains are introduced
incrementally as they mature. Missing numbers represent reserved future
evidence categories. They are not active Evidence Records.

Directories being present does not mean that evidence has been collected.
Evidence Records are added only when evidence exists; placeholder or empty
records are not created. A package inventories evidence and does not, by its
existence or structure, make a gate, approval, readiness, or release claim.

## Governance anchors

A Candidate Evidence Package is an indexing and review layer only. It follows
the parent [TOP Reviews governance and review flow](../README.md), while
[D-03-DR](../../01_Architecture/D-03-DR-Runtime-Ownership-Decision.md) remains
the gate authority. A package does not replace D-03 evidence artifacts, create
gates, grant eligibility, or authorize release.

## Candidates

- [`806546e0e9e5c7bd22826294ef657746ce32f5c0`](./806546e0e9e5c7bd22826294ef657746ce32f5c0/CANDIDATE.md)
