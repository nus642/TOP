# TOP Documentation Portal

Version: 1.0

Status: Active

Last Update: 2026-07-08

Author:
Paul Wu + ChatGPT

---

# Welcome

Welcome to the TOP (Tournament Operations Platform) documentation.

This documentation serves as the single entry point for understanding the project.

Whether you are a developer, product owner, referee, organizer, investor or future AI collaborator, this portal helps you navigate the complete knowledge base of TOP.

---

## Project Structure

The TOP project is organized into several major directories, each with a clearly defined responsibility.

---

# Documentation Hierarchy

Engineering Playbook
        ↓
Developer Guide
		↓
Blueprint
        ↓
Roadmap
        ↓
Design Decisions
        ↓
API Documentation
        ↓
Issues
        ↓
Business Documents
        ↓
User Manuals

---

# Documentation Structure

## Engineering

Purpose:

Defines engineering principles, governance and development standards.

Main Documents:

- Engineering-Playbook.md
- Design-Decisions.md
- Coding-Standards.md (Future)


## Engineering Documentation Map

Use this map before adding or redesigning engineering process documentation.

| Area | Authoritative location | Responsibility |
|---|---|---|
| Engineering principles and operating rules | `11_Engineering/Engineering-Playbook.md` | Project-wide engineering rules, repository source priority, explicit action reporting, analysis-before-implementation, and AI task protocol. |
| Documentation lifecycle governance | `11_Engineering/Documentation-Governance.md` | Document versioning, status, category, and preservation rules. |
| AI development workflow | `11_Engineering/ENG-035-AI-Development-Workflow.md` | High-level ChatGPT → task specification → Codex implementation → local review → Git workflow. |
| AI task delivery workflow | `11_Engineering/ENG-036-AI-Task-Delivery-Workflow.md` | Reviewable delivery artifacts and local application flow for AI-produced changes. |
| Earlier AI collaboration guidance | `11_Engineering/DEV-003-AI-Assisted-Development-Workflow.md` | Role split and patch-oriented AI collaboration guidance; read with ENG-035 and ENG-036 before changing AI workflow semantics. |
| Developer setup and configuration | `11_Engineering/DEV-001-Node-Development-Environment.md`, `11_Engineering/DEV-002-Configuration-Management.md` | Local development environment and configuration practices. |
| Architecture and migration context | `11_Engineering/Database-Architecture.md`, `11_Engineering/Legacy-Architecture.md`, `11_Engineering/Design-Decisions.md` | Database, legacy-system, migration, and decision-record context. |
| Prompt artifacts | `11_Engineering/AI-Prompts/` | Task/prompt support artifacts; not authoritative governance by themselves. |
| Task artifacts | `11_Engineering/Tasks/` and task-specific handoff packages when present | Task scope, execution, review, and status records. |

When repository facts conflict with conversation memory, use the committed repository documentation first.


---

## Blueprint

Purpose:

Defines the long-term vision and core architecture of TOP.

---

## Roadmap

Purpose:

Defines the development stages and priorities.

---

## API

Purpose:

Defines backend interfaces and communication standards.

---

## Issues

Purpose:

Tracks architecture issues, product issues and future improvements.

---

## Business

Purpose:

Business positioning, marketing materials, product introduction and investor documents.

---

## User Manual

Purpose:

Guides different user roles.

Examples:

- Organizer
- Referee Chief
- Referee
- Player
- Administrator

---

## AI

Purpose:

Defines AI collaboration rules.

Main Document:

- AI-Collaboration.md

---

# Development Workflow

All development follows the Engineering Playbook.

Typical workflow:

Idea

↓

Issue

↓

Architecture Review

↓

Roadmap

↓

Task

↓

Development

↓

Testing

↓

Documentation Update

↓

Release

---

# Documentation Principles

The Engineering Playbook is the Constitution of the TOP project.

Other documents reference the Playbook rather than redefining engineering principles.

All official documents should remain consistent, traceable and maintainable.

---

# Documentation Style
以后 README 尽量遵循：

📄 说明性内容 → Table（跨平台显示稳定）
🌳 代码目录 → Tree（放在代码块中）
🔄 流程 → Mermaid（以后可以逐步加入）
🏗️ 架构 → Mermaid 或图片
📊 对比 → Markdown Table

这样我们的文档不仅内容专业，展示效果也会统一。这也是很多成熟开源项目采用的写法。

# Current Status

Current Development Phase:

Foundation Architecture

Focus:

- Documentation
- Backend Refactoring
- Competition Engine
- Operations Engine

---

# Long-term Goal

Build TOP into a reusable Tournament Operations Platform supporting multiple sports, multiple competition formats and multiple organizations.

---

# Project Directory
The project follows a dual-track architecture.

- **legacy/** contains the stable production system and serves as the reference implementation.
- **modern/** is the next-generation architecture where all future development takes place.

- New features should be implemented in `modern/`.
- Existing functionality may be migrated incrementally from `legacy/` after validation.


| Directory             | Purpose                                               |
| --------------------- | ----------------------------------------------------- |
| `/database`           | Database schemas, SQL scripts and initial data        |
| `/deploy`             | Standard deployment resources (Docker / Linux Server) |
| `/deploy-wechatcloud` | WeChat Cloud Hosting deployment resources             |
| `/docs`               | Project documentation and knowledge base              |
| `/legacy`             | Stable reference implementation (Legacy System)       |
| `/modern`             | TOP Platform (Active Development)                     |


## Related Documents

- Engineering Playbook
- AI Collaboration Guide
- Engineering Foundation
- CHANGELOG

# Revision History

| Version | Date | Description |
|----------|------------|------------------------------|
| 1.0 | 2026-07-08 | Initial documentation portal |
