# TOP Engineering Playbook

Version: 1.4

Status: Active

Last Update: 2026-07-23

Author:
Paul Wu + ChatGPT


---

# Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.4 | 2026-07-23 | Added Rule-020 through Rule-024 for transaction ownership, repository source priority, explicit action, analysis-first implementation, and AI task protocol |
| 1.3 | 2026-07-13 | Added rule-15,-18 |
| 1.2 | 2026-07-08 | Added reference to Documentation Governance framework |
| 1.1 | 2026-07-08 | Added AI collaboration rules |
| 1.0 | 2026-07-08 | Initial engineering constitution |

 ---

# Purpose

The Engineering Playbook is the Constitution of the TOP project.

It defines the engineering principles, governance rules and development standards that guide the long-term evolution of TOP.

All engineering activities, technical decisions and project documentation should align with this Playbook.

Other project documents, including Blueprint, Roadmap, API Documentation, AI Collaboration, Business Documents and User Manuals, should reference this Playbook instead of redefining engineering principles.

Engineering Playbook 是 TOP 项目的工程宪法。

它定义整个项目的工程原则、治理规则和开发标准。

所有工程活动、技术决策和正式文档都应遵循本 Playbook。

其它文档应引用（Reference）Playbook，而不是重复定义工程原则。

# Document Hierarchy

Engineering Playbook
 ↓
Blueprint
 ↓
Roadmap
 ↓
Design Decisions
  ↓
API Documentation
  ↓
Business Documents
  ↓
User Manuals

| 文档                       | 对应角色                |
| ------------------------ | ------------------- |
| **Engineering Playbook** | 📜 宪法（Constitution） |
| **Blueprint**            | 🎯 国家愿景 / 长期战略      |
| **Roadmap**              | 📅 五年发展规划           |
| **Design Decisions**     | ⚖️ 判例（为什么这样决定）      |
| **API Documentation**    | 📘 技术标准             |
| **Business Documents**   | 💼 对外宣传与商业资料        |
| **User Manuals**         | 📖 使用说明             |


# 1. Project Philosophy


## TOP Core Principle

TOP (Tournament Operations Platform)

不是一个单一运动软件。

匹克球是第一个落地场景。

未来支持：

- 网球
- 羽毛球
- 排球
- 篮球
- 其它竞技赛事


核心能力：

Tournament Operations + Competition Management


---


# 2. Development Principles


## Rule-001 System Always Running

系统稳定运行优先。

不为了架构优化而破坏已有功能。


---

## Rule-002 Business Value First

所有开发优先考虑：

- 用户价值
- 商业价值
- 实际使用场景


避免为了技术漂亮而开发。


---

## Rule-003 Blueprint Before Coding

重大功能开发前：

先明确：

- 目标
- 架构
- 影响范围


再进入代码。


---

## Rule-004 Incremental Refactoring

采用渐进式重构。

原则：

旧系统可运行
+
新架构逐步替换


避免一次性重写。

Legacy and Modern may coexist temporarily.

---

## Rule-005 Documentation is Product

文档属于产品资产。

包括：

- Blueprint
- Roadmap
- API
- Issues
- Design Decisions


---


# 3. Architecture Principles


## Rule-006 Engine Separation


TOP 核心：

Competition Engine

负责：

- 赛制
- 编排
- 排名
- 比赛逻辑


Operations Engine

负责：

- 签到
- 裁判
- 现场流程
- 数据记录
- 直播支持


两个 Engine 保持独立。


---


## Rule-007 API First


Frontend 不直接操作业务逻辑。

统一：

Frontend

↓

API

↓

Backend

↓

Database


---


## Rule-008 Issue Driven Development


所有重要想法：

Idea

↓

Issue

↓

Roadmap

↓

Task

↓

Development


---


# 4. Decision Responsibility


## Rule-009 Product vs Engineering


Product Owner 决定：

- 商业方向
- 用户需求
- 赛事规则
- 优先级


Engineering 决定：

- 技术方案
- 数据结构
- API设计
- 文件结构
- 实现方式


---


## Rule-010 Decision Delegation


技术细节不重复让产品负责人选择。

Engineering 默认提供推荐方案。


只有以下情况需要确认：

- 商业模式影响
- 高成本投入
- 不可逆重大决定


---

## Rule-011 Recommend, Don't Delegate



## Rule-012 Product Documentation

产品文档不仅服务开发，也服务销售、培训、合作伙伴和用户。

---

## Rule-013: Think Platform, Build Modules

TOP should not be built as a collection of features.

Each feature should answer:

"Does this become a reusable capability of the platform?"

Examples:

Not:

"Add pickleball referee assignment."

Instead:

"Build Official Management capability."

Not:

"Add pickleball player check-in."

Instead:

"Build Participant Check-in capability."

Not:

"Add pickleball live score."

Instead:

"Build Real-time Competition Data capability."

This mindset is what allows TOP to expand beyond one sport.

---

## Rule-014 Documentation Governance

所有正式文档必须经过：

Discussion

↓

Consensus

↓

Audit

↓

Documentation Update

避免将未验证的想法直接写入正式文档。

---

正式文档包括：

- Blueprint
- Roadmap
- Engineering Playbook
- Design Decisions
- API Documentation
- AI Collaboration
- Business Documentation
- User Manuals

---

原则：

聊天记录不是正式文档。

重要知识必须经过审查后沉淀。

保证文档长期一致性和可信度。

## Documentation Governance

Project documentation is a critical engineering asset.

All documentation lifecycle management follows:

Documentation Governance

including:

- document structure
- version control
- revision history
- document maintenance rules

Engineering Playbook defines the principle.

Documentation Governance defines the operational rules.

## Rule-015 Build for Today, Design for Tomorrow

Engineering should solve today's problems.

Architecture should prepare for tomorrow's evolution.

Avoid:

- Under-engineering
- Over-engineering

Deliver only what today's requirements need,
while keeping future expansion natural.

Examples:

- Start with one .env file before introducing multi-environment configuration.
- Migrate legacy modules incrementally instead of rewriting everything.
- Build reusable interfaces before introducing additional implementations.

Today's implementation should never block tomorrow's architecture.

## Rule-016 Single Responsibility for Documentation

Every document should have one primary responsibility.

Examples:

Engineering Playbook

→ Engineering Constitution

Modern Architecture Progress

→ Architecture Evolution

Database Contract

→ Database Agreement

API Documentation

→ API Specification

Avoid mixing multiple document purposes.

A document that tries to serve multiple purposes eventually serves none.

## Rule-017 Platform First

When introducing a new feature,
always ask:

"Is this solving one product,
or building a platform capability?"

Prefer platform capabilities whenever reasonable.

Examples:

Not:

Quick Referee Event

Instead:

Match Data Capture

Not:

Pickleball Check-in

Instead:

Participant Check-in

Platform capabilities can be reused across sports,
products and future modules.

## Rule-018 Engineering Playbook Maintenance

The Engineering Playbook is the constitution of the TOP project.

It should remain stable over time.

Updates should occur only when one of the following applies:

- A new long-term engineering principle is established.
- Project governance changes.
- Platform philosophy changes.
- Existing principles require clarification or correction.

Feature implementations, project progress, temporary decisions and development logs should NOT be added to this document.

The Playbook evolves slowly.

Project knowledge evolves continuously.

# 5. Documentation Standard

## Rule-019 Documentation Standard

所有重要对象编号：

API-xxx

Issue-xxx

Task-xxx

Module-xxx

Decision-xxx


保持长期可追踪。

#

| 文档	| 编号前缀	|示例 |
|Engineering Playbook |	Rule	|Rule-011|
AI Collaboration	AI Rule	AI Rule-001
API	API	API-001
Issues	Issue	Issue-003
Tasks	Task	Task-012
Design Decisions	DD	DD-001
Modules	Module	Module-001


## Rule-020 Service Owns Transaction Boundaries

Services own transaction boundaries.

Application services decide when a business operation begins, commits, or rolls back as one unit.

Repositories should not independently open, commit, or roll back transactions for business workflows unless explicitly designed for an isolated infrastructure operation.

This keeps business consistency rules visible at the service layer and prevents hidden repository-side transaction behavior.

## Rule-021 Repository Source Priority

When repository information conflicts, use the repository itself as the highest-priority source of truth.

Priority order:

1. GitHub committed and pushed state (remote repository).
2. Accepted project documentation in the repository.
3. Local unpushed commits.
4. Local working-tree changes.
5. Current task instructions.
6. Conversation history or AI memory.

Do not override repository facts with memory, assumptions, or outdated conversation history.

## Rule-022 Explicit Action

Engineering work should end with explicit, traceable action.

For every task completion or handoff, report:

- **Status**: current state of the task (complete, blocked, in-progress).
- **Action**: what was changed or performed.
- **Owner**: who performed the action or who owns the next step.
- **Expected Output**: what result was produced or what remains to be delivered.

Avoid ambiguous completion states such as implying implementation was done when only analysis was completed, or implying approval was granted when only a recommendation was provided.

## Rule-023 Analysis Before Implementation

Analyze before implementing.

The engineering lifecycle for any change follows this sequence:

1. Identify the requested outcome.
2. Locate the authoritative source files.
3. Determine the affected scope.
4. Review existing rules or constraints.
5. Define validation steps.
6. Implement the change.
7. Verify the result.

Implementation should follow the analysis instead of replacing it.

Commit and push operations require that the task explicitly authorizes them. If the task scope does not include commit or push, the engineer must not perform these actions.

## Rule-024 AI Task Protocol

AI-assisted work must follow a task protocol aligned with the Engineering Playbook.

Every AI task assignment must specify:

- **Task ID**: unique identifier for traceability.
- **Role**: which AI role performs the work.
- **Objective**: the requested outcome.
- **Scope**: files and areas affected.
- **Constraints**: rules, boundaries, or exclusions.
- **Expected Output**: deliverables and verification criteria.

Minimum protocol:

1. Read the relevant repository files before editing.
2. Respect scoped files and constraints.
3. Apply repository source priority as defined by Rule-021.
4. Perform analysis before implementation as defined by Rule-023.
5. Report explicit actions and verification results as defined by Rule-022.

Commit and push operations require explicit task authorization. If the task does not authorize commit or push, the AI must not perform these actions.

AI collaboration documents may reference this protocol but should not duplicate the full rule text.

---


