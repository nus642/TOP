# TOP Mission Alignment Review

Version: v0.1

Status: Draft

## 1. Purpose

本文用于对齐 TOP Blueprint、Legacy 分析、Modern Architecture 与近期业务访谈结果。

目标不是重新设计 TOP，而是确认：

- TOP 为什么存在；
- Legacy 已经验证了什么；
- Modern 应该优先保留和恢复什么。

---

# 2. TOP Mission

TOP（Tournament Operations Platform）是一套以赛事现场运营为核心的数字化平台。

TOP 的核心不是替代赛事报名、编排、排名系统，而是帮助赛事在现场可靠运行。

核心价值：

让 Master 能够掌握现场状态，协调人员和资源，并产生可信的比赛结果。

---

# 3. TOP Position

TOP = Tournament Operations Platform。

TOP 不是：

- 报名系统
- 排名系统
- 赛事官网
- 直播平台

TOP 是：

赛事现场运营中枢。

---

# 4. Two Engine Understanding

## Competition Engine

负责：

- 比赛规则
- 赛制
- 编排
- 排名
- 计分规则

## Operations Engine

负责：

- Master 工作流
- Check-in
- Referee 管理
- Court 管理
- Match Control
- Display
- 现场状态

TOP 的长期跨运动扩展能力主要来自 Operations Engine。

---

# 5. Legacy Validation

Legacy 并不是旧代码，而是多年现场经验的软件化表达。

Legacy 已验证：

- Referee 可以通过系统完成单场比赛执行；
- Master 可以减少现场沟通成本；
- Display 可以提高现场透明度；
- Lineup 可以减少队长与 Master 的沟通成本；
- Check-in 和签名可以建立现场可信记录。

---

# 6. Modern Direction

Modern 不是复制 Legacy 功能。

Modern 应恢复和强化 Legacy 背后的业务能力：

## 现场状态

Master 需要知道：

- 正在进行的比赛；
- 下一场比赛；
- 空闲场地；
- 空闲裁判；
- 参赛人员状态；
- 比赛进度。

## 现场调度

Master 根据计划和现场状态进行：

- 比赛安排；
- 资源分配；
- 异常处理。

## 可信记录

记录：

- 到场；
- 风险确认；
- Lineup 确认；
- 比赛结果确认。

---

# 7. Modern Priority

第一目标：

让 Legacy 已经做到的能力，在 Modern 中基本可用。

优先恢复：

1. Master 现场管理
2. Match Execution
3. Court / Referee 状态
4. Result Confirmation
5. Check-in 与现场确认流程

---

# 8. Long-term Direction

TOP 应向不同运动项目复制现场运营能力。

不同运动的规则属于 Competition Plugin。

现场运营能力属于 TOP Core。
