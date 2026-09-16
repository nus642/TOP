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
└── 08-limitations/
```

- `CANDIDATE.md` is the package index and identifies the candidate.
- `01-candidate-identity/` is reserved for evidence that independently records
  or verifies candidate identity.
- `02-scope-boundary/` is reserved for evidence describing what a review did
  and did not examine.
- `08-limitations/` is reserved for observed limitations, qualifications, and
  constraints on interpretation.

Directories being present does not mean that evidence has been collected.
Evidence Records are added only when evidence exists; placeholder or empty
records are not created. A package inventories evidence and does not, by its
existence or structure, make a gate, approval, readiness, or release claim.

## Candidates

- [`806546e0e9e5c7bd22826294ef657746ce32f5c0`](./806546e0e9e5c7bd22826294ef657746ce32f5c0/CANDIDATE.md)
