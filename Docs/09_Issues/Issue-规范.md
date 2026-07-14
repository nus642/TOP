# Issue-001

## Title

Multiple Officials per Match

## Category

Architecture

## Priority

High

## Status

Open

## Background

目前系统默认一场比赛只有一名主裁判。

实际赛事可能包括：

- 主裁判
- 副裁判
- 边裁
- 计时员
- 技术官员

因此，一场比赛需要支持多个裁判角色。

## Proposed Solution

建立 Match Officials 模型：

Match
    ↓
Match Officials
    ↓
Official
    ↓
Role

## Affected Modules

- Competition Engine
- Operations Engine
- Database
- Backend API
- Frontend

## Notes

暂不实施，等待裁判员管理模块开发时统一设计。

Chatgpt:

我建议我们再增加两个字段

每个 Issue 增加：

Priority

P1
P2
P3

以及：

Target Sprint

Sprint 3

Sprint 5

Backlog

例如：

Issue-001：

Priority

P1

Target Sprint

Sprint 6

因为目前不会立即开发裁判管理。