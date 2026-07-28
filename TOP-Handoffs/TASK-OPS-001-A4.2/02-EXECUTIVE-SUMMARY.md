Task:
TASK-OPS-001-A4.2

Title:
DrawInput Validation Boundary


Purpose:

Record the rationale for implementing DrawInputValidator as a separate pre-construction validation layer between DrawInput and MatchContext consumption.


# Why a Separate Validator

DrawInput (A4.1) performs constructor-level presence checks: fields must exist. DrawInputValidator adds a deeper validation layer:

- DrawInput constructor: "Are all fields present?" (presence)
- DrawInputValidator: "Are all fields valid instances and values?" (consistency)

This two-layer strategy provides:

1. **Descriptive errors earlier**: Caller gets specific error codes before attempting MatchContext construction
2. **MatchContext unchanged**: A1 constructor validation remains the final guard, untouched
3. **Separation of concerns**: Data carrying (DrawInput) vs data quality (Validator) vs identity construction (MatchContext)


# Validation Responsibility

DrawInputValidator owns:

- Instance type verification (drawInput is DrawInput)
- Entry reference validity (is a real Entry from Competition Core Domain)
- Draw position field validity (round, court, sequence are valid values)
- Shape conversion (toMatchContextOptions produces MatchContext-compatible plain object)

DrawInputValidator does NOT own:

- MatchContext creation
- DrawInput creation or modification
- Entry modification
- Scheduling or draw generation logic
- Execution flow


# Dependency Boundary

DrawInputValidator depends on:

- DrawInput (A4.1) — instance type check
- OperationsError (A1) — error pattern
- Entry (Competition Core Domain) — read-only instance check only

DrawInputValidator does NOT depend on:

- MatchContext (does not require it, does not construct it)
- MatchExecutionContext
- MasterOperationalContext / RefereeOperationalContext
- Readiness preparation


# Relationship with MatchContext Creation

The flow is:

1. External system produces draw data
2. Caller creates DrawInput (A4.1)
3. Caller calls DrawInputValidator.validate(drawInput) — pass or throw
4. Caller calls DrawInputValidator.toMatchContextOptions(drawInput) — returns plain object
5. Caller constructs MatchContext with the plain object

Step 5 is caller responsibility. DrawInputValidator never calls `new MatchContext()`.

This means:
- Validator is optional (caller can skip and rely on MatchContext constructor)
- Validator adds value through descriptive errors and shape conversion
- MatchContext remains the authoritative final guard


# What This Task Does NOT Implement

- MatchContext modification
- MatchExecutionContext
- Readiness preparation
- Actor workflow
- Draw generation / Scheduling
- API / Service / Repository / Database
- Notification / Scoring / Ranking
- Workflow engine / State machine


# Implementation Guidance

Implementation must preserve:

- MatchContext unchanged from A1 (identity boundary only)
- DrawInput unchanged from A4.1 (pure data)
- Entry reference as read-only
- CommonJS style consistent with A1/A3/A4.1
- Legacy compatibility
- Validation as separate concern from construction

No production code outside `Modern/engine/operations/domain/` and `Modern/test/domains/` modified.
Follow TES Handoff Protocol.
