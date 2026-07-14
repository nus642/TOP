# TOP Blueprint

Version:

2.3

Status:

Active

Last Update:

2026-07-08

Author:

Paul Wu + ChatGPT
---

# Revision History

## V2.0

2026-07-08

建立 TOP Mission。

确定 Platform Position。

确定 Legacy + Modern 架构。

确定 Plugin 思路。



## V2.1

Date:
2026-07-08

### Added

Core Architecture

### Highlights

- TOP = Operations Engine + Competition Engine
- 明确两个 Engine 的职责边界
- Competition 支持插件化
- Operations 与运动项目解耦



## V2.2

Date:2026-07-10

更新了Platform Vison

## v2.3
Date: 2026-07-10

增加了 Operation Philosophy

---
# 1. Mission

TOP（Tournament Operations Platform）是一套以赛事现场运营为核心的数字化平台。

我们的目标不是开发某一个运动项目的软件，而是构建一个支持多项目、多赛制、多角色协同的赛事运营平台。

---

# 2. Platform Vision

TOP (Tournament Operation Platform) is designed as a tournament
operation platform with future extension capability.

The platform consists of:

1. Tournament Operation Core
   - Event management
   - Scheduling
   - Referee operation
   - Live scoring
   - Result management

2. Public Experience Layer (Future)
   - Spectator-facing information
   - Live tournament display
   - Sponsor and commercial communication
   - Event promotion capability

---

# 3. Platform Position

TOP 是 Tournament Operations Platform。

不是报名系统。

不是直播系统。

不是视频系统。

不是赛事官网。

而是：

赛事现场运营中枢。

---

# 4. Core Principles

① Workflow First

所有功能围绕赛事流程。

② API First

所有模块均通过 API 通信。

③ Plugin Architecture

不同运动、不同赛制均采用插件。

④ Cloud Ready

支持 Docker、腾讯云、微信云托管。

⑤ Mobile First

支持手机、平板、电脑。

---

# 5. Current Scope

当前首先实现：

✓ 匹克球

未来扩展：

□ 羽毛球

□ 网球

□ 乒乓球

□ 壁球

……

---

# 6. Product Modules

报名（第三方）

↓

编排

↓

检录

↓

主裁

↓

裁判

↓

比赛

↓

大屏

↓

直播

↓

成绩发布

↓

数据分析

---

# 7. Core Architecture（核心架构）

## 7.1 Overall Architecture

TOP consists of two core engines:

TOP

├── Operations Engine

└── Competition Engine
## 7.2 Operations Engine

负责：

Workflow
Check-in
Officials
Court Management
Match Control
Display
Broadcast
API
User Management

特点：

与运动项目无关。

## 7.3 Competition Engine

负责：

Competition Rules
Schedule Generation
Pairing Algorithms
Ranking
Scoring Rules
Tournament Formats

特点：

与赛制相关。

## 7.4 Why Two Engines

分离的原因：

不同运动共享 Operations。
不同运动拥有自己的 Competition。
便于插件化。
便于维护。
便于未来商业授权。

## 7.5 Future Extension

Competition Engine：

Pickleball

├── Round Robin

├── Fixed Pair

├── Team Chase

└── Two-stage RR

以后：

Badminton

Tennis

Squash

...

全部作为 Plugin。

# 8. Current Architecture

Legacy

+

Modern

↓

TOP

---

# 9. Roadmap

Development Roadmap：详见 Roadmap.md。

---

# 10. Long-term Goal

TOP 成为体育赛事现场运营平台。

---

# 11. Operational Philosophy

TOP is designed to enable tournament operation without dependency on dedicated hardware or specialized technical personnel.

The platform aims to allow a tournament Master to configure and operate an event with minimal setup.
