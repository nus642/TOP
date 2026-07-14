Task 033.X — Modern Migration

Use the existing TOP Modern Architecture established in this conversation.

Architecture

API
↓

Service
↓

Repository
↓

Database

Task

Analyze and implement ONLY the specified Legacy endpoint.

Preserve Behavioral Compatibility.

Do NOT redesign the business logic.

----------------------------------------
Architecture Rules
----------------------------------------

Repository

- Repository contains SQL only.
- No business logic.
- Reuse existing repositories whenever possible.
- Do not create new repositories unless introducing a genuinely new domain.

Service

- Owns the business workflow.
- Calls repositories.
- No SQL.

API

- Owns HTTP request and response only.
- No SQL.
- No business workflow.

----------------------------------------
Implementation Rules
----------------------------------------

- Preserve Behavioral Compatibility.
- Preserve current request and response formats.
- Preserve execution order.
- Preserve existing messages.
- Preserve existing parsing behavior.
- Preserve tournamentId = 1.
- Do not redesign.
- Do not merge endpoints.
- Do not add validation.
- Do not add authorization.
- Do not add transactions.
- Do not introduce multi-tournament support.
- Do not add new features.

Only implement the minimum change required for this task.

Assume previous migration tasks already exist.

Do not regenerate previously migrated functionality.

----------------------------------------
Output Format
----------------------------------------

Do NOT generate complete source files.

Output PATCHES ONLY.

For each changed file provide:

1. File path

2. New functions to add

3. Existing functions to modify

4. Required import changes

5. Required export changes

Only output the changed sections.

Do not regenerate unchanged code.

----------------------------------------
Artifact Rules
----------------------------------------

Do not generate downloadable source-code artifacts.

Do not create files named:

- *.js.*
- *.ts.*
- *.jsx.*
- *.tsx.*

Present all code inside Markdown.

----------------------------------------
Deliverables
----------------------------------------

Provide:

1. Repository changes
2. Service changes
3. API changes
4. Merge Checklist
5. Integration Test commands
6. Expected database result
7. Expected API response
8. Remaining risks

----------------------------------------
Merge Checklist
----------------------------------------

At the end provide a concise checklist.

Example:

player.repository.js

+ add deletePlayerPartnersByTournament()

+ update module.exports

competition.service.js

+ add resetCompetition()

+ update module.exports

competition.js

+ add router.delete("/reset")

----------------------------------------
Coding Style
----------------------------------------

Prefer minimal changes.

Preserve existing formatting.

Follow the current Modern project structure.

Never overwrite existing implementations unnecessarily.

Build for Today.

Design for Tomorrow.

----------------------------------------
Role
----------------------------------------

You are the implementation engineer.

The architecture has already been decided.

Do not redesign the architecture.

Respect the existing project conventions established in previous migration tasks.

Focus on producing production-ready implementation patches only.