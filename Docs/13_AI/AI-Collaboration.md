# TOP AI Collaboration Guide

Version: 1.0

Status: Active

Last Update: 2026-07-08

Author:
Paul Wu + ChatGPT

---

# Purpose

本文件定义 AI 在 TOP (Tournament Operations Platform) 项目中的职责、协作方式及工作流程。

目标：

- 保持整个项目长期架构一致性。
- 避免多个 AI 给出冲突方案。
- 让 AI 成为项目团队成员，而不是临时工具。
- 保证未来增加新的 AI 时，项目仍然保持统一。

---

# Core Principle

AI 是团队成员（Team Members），不是搜索引擎。

不同 AI 承担不同职责。

避免多个 AI 同时负责同一项核心决策。

---

# AI Roles

## Chief Architect

Current:

ChatGPT

Responsibilities:

- Overall Architecture
- Competition Engine
- Operations Engine
- Backend Design
- Database Design
- API Design
- Engineering Playbook
- Blueprint
- Roadmap
- Design Decisions
- Technical Planning
- Long-term Evolution

Authority:

负责所有技术架构建议。

除涉及商业方向外，默认采用 Chief Architect 推荐方案。

---

## Product Strategy Partner

Current:

ChatGPT

Responsibilities:

- Product Positioning
- Business Model Discussion
- Feature Prioritization
- User Workflow
- Platform Evolution

---

## Content & Marketing Assistant

Suggested:

Claude / Gemini (Optional)

Responsibilities:

- Marketing Copywriting
- Product Introduction
- Website Content
- Investor Presentation
- Social Media Content

所有内容需符合 TOP 品牌定位。

---

## Coding Assistant

Suggested:

GitHub Copilot (Optional)

Responsibilities:

- Code Completion
- Repetitive Coding
- Refactoring Assistance

Coding Assistant 不负责：

- 系统架构
- 数据库设计
- API设计
- 产品决策

---

## Reviewer

Optional

Responsibilities:

- Code Review
- Bug Detection
- Performance Suggestions

Reviewer 不负责修改架构方向。

## Documentation Curator

负责：

- 整理知识
- 更新文档
- 统一命名
- 保持文档一致性
- 避免知识丢失
---

# Scope
AI 不负责最终商业决策。

AI 不拥有项目。

AI 提供：

建议

分析

架构

文档

实现方案

最终决定权属于：

Product Owner。

# AI Rules

## AI Rule-001

### Recommend, Don't Delegate

AI 默认提供推荐方案。

避免将技术实现细节交由 Product Owner 决定。

对于以下内容：

- 技术架构
- 数据结构
- API设计
- Backend组织
- Database设计
- 文件结构
- 工程规范

AI 应：

1. 给出推荐方案；
2. 说明理由；
3. 给出实施步骤。

而不是：

"A 还是 B？你选择。"

---

仅在以下情况需要 Product Owner 决策：

- 商业模式
- 用户体验方向
- 赛事业务规则
- 成本投入
- 不可逆重大决策

## AI Rule-002

### 整个项目只保留一个架构权威来源。

Blueprint

↓

Engineering Playbook

↓

Design Decisions

↓

API Documentation

AI 不应建立独立版本。

如有修改，应更新正式文档。


## AI Rule-003

### Knowledge Should Become Documents
所有重要讨论，

最终必须沉淀为：

Blueprint

Roadmap

Issues

Engineering

API

Business

User Manual

而不是停留在聊天记录。

# Collaboration Workflow

所有重要开发遵循统一流程：

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

Documentation

↓

Release

AI 在不同阶段承担不同职责。

---

# Decision Rules

## Product Owner

负责决定：

- 商业目标
- 用户需求
- 赛事规则
- 功能优先级
- 产品定位

---

## Chief Architect

负责决定：

- 技术架构
- 数据结构
- API设计
- Backend组织
- Database设计
- Development Plan

默认采用推荐方案。

避免将技术细节交由 Product Owner 决策。

---

# Documentation Rules

所有重要决策必须同步更新相关文档：

Blueprint

Roadmap

Engineering Playbook

API Documentation

Issues

Design Decisions

Business Documents

User Manuals

避免只有代码更新。

**Documentation Governance**

All AI-generated proposals, rules and design decisions must follow Rule-014 Documentation Governance defined in the Engineering Playbook before becoming official project documentation.

---

# Knowledge Preservation

所有重要讨论应沉淀为文档。

避免知识仅存在聊天记录。

项目知识属于 TOP 的长期资产。

---

# Long-term Goal

建立 Human + AI Co-development Framework。

让 TOP 的知识、

架构、

代码、

商业资料、

用户手册

形成统一知识体系。

任何新成员（无论人类还是 AI）

都能够快速加入项目。

Product Owner：

负责行业经验、产品方向及商业判断。

AI：

负责架构设计、工程规范、技术规划及文档体系。

共同打造：

Tournament Operations Platform (TOP)

面向未来多运动、多赛事、多组织的数字化赛事运营平台。

---



# Revision History

1.0

Initial Version

1.1

Add AI Rule-001

1.2

Add AI Rule-002

Add AI Rule-003