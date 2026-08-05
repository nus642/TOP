# TOP Mission Alignment

**Version:** v0.1

**Status:** Draft

**Document type:** Mission / Platform Position / Architecture Decision Context

## 1. Purpose

本文用于对齐 TOP Blueprint 定义的平台使命、Legacy 已验证的现场运营能力，以及 Modern Architecture 当前的设计方向。它为后续产品和架构决策提供共同语境，确保 TOP Modern 始终围绕 **Tournament Operations Platform** 建设，而不是扩展成一个重复已有赛事系统的产品。

本文不替代现有 Blueprint 或 Architecture 文档，也不定义新的业务边界、功能需求或工程实现方案。具体架构与设计仍以对应文档为准。

## 2. TOP Mission

TOP（Tournament Operations Platform）是**以赛事现场运营为核心的数字化平台**。它的使命是帮助现场角色掌握赛事状态、协调人员与场地、可靠执行比赛，并形成可信的现场记录。

TOP 的核心原则是 **Professional Tournament Operation**：平台应服务于专业、可交付、可追溯的赛事运营，而不是只完成单点工具或面向观众的展示体验。该原则要求 TOP 在使命层面持续关注现场责任、角色协作、比赛执行和结果确认，并在架构边界上保持 Operations Engine 与 Competition Engine 的职责清晰。

TOP 不是：

- 报名系统；
- 赛事官网；
- 直播系统；
- 排名系统。

报名、官网和直播等系统可以与 TOP 协作，但不是 TOP 要重新建设的产品边界。排名算法属于 TOP 内部 Competition Engine 的职责；这不意味着 TOP 要成为一个独立的通用排名产品。

## 3. Platform Boundary: Two Engines

TOP 的平台边界由两个相互协作、职责清晰的核心组成：

```text
TOP
├── Operations Engine
└── Competition Engine
```

### 3.1 Competition Engine

Competition Engine 负责与运动项目及赛制相关的比赛逻辑：

- 比赛规则；
- 编排；
- 排名；
- 赛制算法。

### 3.2 Operations Engine

Operations Engine 负责跨运动项目复用的现场运营能力：

- Master 现场管理；
- Referee workflow；
- Court management；
- Check-in；
- Match control；
- Result confirmation。

与 Blueprint 的映射关系：Operations Engine 对应 Blueprint 中的 Tournament Operation Core 与 Operations Engine 方向，承接其中的现场 workflow、check-in、officials/referee operation、court management、match control、display、API 与 user management 等现场运营能力。本文使用更聚焦的命名，是为了在 Modern 语境下突出 Master / Referee / Court / Match / Result 这条现场运营主线，而不是扩大 Blueprint 已定义的平台边界。

两者的分工保证 TOP 可以通过 Competition Engine 表达不同比赛规则，同时以 Operations Engine 保持一致的现场运营主线。本文件不改变两者在现有架构文档中的接口或实现方式。

## 4. Legacy Contribution

Legacy 不是一批等待照搬或丢弃的“旧代码”。Legacy 是 **TOP Operations 能力的真实现场验证**：它记录了赛事角色如何协作、现场信息如何流动，以及哪些能力确实能够降低赛事运营成本。

Legacy 所验证的能力演进为：

```text
单场记分工具
      ↓
Referee 执行工具
      ↓
Master 现场管理工具
      ↓
Tournament Operations System
```

这一演进说明 TOP 的价值不只在单场计分，而在于把比赛执行、角色协作、资源状态和结果确认连接为完整的现场运营闭环。Modern 应继承这些已经验证的业务能力，而不是受 Legacy 技术实现约束。

## 5. Core User Model

### 5.1 Master: Primary Business User

**Master 是 TOP 的第一业务用户。** Master 对赛事现场的整体运行负责，需要通过 TOP 持续管理：

- 当前比赛状态；
- 场地状态；
- Referee 状态；
- Player / Team 状态；
- 时间进度；
- 异常。

因此，TOP 的默认产品视角应优先回答：现场正在发生什么、接下来需要什么资源、哪里出现偏差，以及 Master 应采取什么行动。

### 5.2 Referee: On-site Execution Role

Referee 是现场执行角色，负责：

- 执行单场比赛；
- 记录比分；
- 确认比赛结果。

Referee workflow 是 Master 运营视图的现场数据来源之一，但 Referee 不承担赛事整体协调职责。

## 6. Super Admin: Platform Authorization Role

**Super Admin 不是比赛现场角色。** 它是平台运营与商业授权角色，职责是：

- 管理平台访问权限；
- 授权 Master 使用 TOP；
- 管理组织与赛事运营权限；
- 支撑未来商业模式。

Super Admin 与现场运营的直接关系是授权，而不是替代 Master 执行赛事：

```text
Super Admin
     ↓
  Authorize
     ↓
   Master
     ↓
Operate Tournament
```

面向未来商业模式时，各角色和主体的关系为：

```text
       TOP Platform
            ↑
       Super Admin
            ↑
Organization / Customer
            ↓
          Master
            ↓
 Tournament Operation
```

该关系明确了平台访问与现场操作的责任分离：Organization / Customer 是被服务的商业主体，Super Admin 负责平台层授权，获得授权的 Master 负责具体赛事运营。本文只确立这一角色边界，不在此定义计费、套餐或销售流程。

## 7. Trusted On-site Record

TOP 不只是保存比赛结果。赛事运营过程中，TOP 还应形成可追溯的**可信现场记录（Trusted On-site Record）**，包括：

- Check-in；
- Risk acknowledgement（作为 check-in / participation readiness 流程中的现场确认记录，而不是独立的保险、法务或合规产品能力）；
- Lineup confirmation；
- Referee confirmation；
- Result confirmation。

这些记录共同说明参与者是否到场、必要确认是否完成、谁执行并确认了比赛，以及结果如何在现场产生。Risk acknowledgement 在此仅表示现场运营所需的参与确认事实；其模板、法律效力、保险责任或监管合规边界，应由外部组织政策或专门系统定义。它们构成赛事现场事实链，也是 Master 处理异常与完成赛事交付的重要依据。

在 Competition Engine 与 Operations Engine 协作的边界上，TOP 还应形成**可信竞赛记录（Trusted Competition Record）**：它不是新的功能清单或独立产品，而是由比赛规则、编排、执行、确认与现场记录共同支撑的竞赛事实表达。Trusted Competition Record 用于说明一场比赛或一个赛事结果是在既定赛制与现场确认流程下产生的，从而连接 Competition Engine 的规则一致性与 Operations Engine 的现场可追溯性。

Trusted Competition Record 可以按不同业务目的理解为以下可信记录类别：

- **Participant Protection Record**：用于说明参与者到场、参与准备与必要现场确认的事实，服务于现场责任与参与保护边界。
- **Match Official Record**：用于说明 Referee / official 对比赛执行、比分记录与结果确认的责任链，服务于比赛执行可信度。
- **Competition Data Archive**：用于沉淀赛制、编排、比分、结果与排名等竞赛事实，服务于赛事交付后的复核与归档。
- **Event Timeline**：用于描述 check-in、上场、比赛执行、确认与异常处理等关键现场事件的发生顺序，服务于运营复盘与争议定位。

这些类别表达的是可信记录的不同业务用途，而不是新增产品功能、技术实现或独立系统边界。

## 8. Modern Direction

Modern 不是重新发明 TOP，也不是逐页复制 Legacy。Modern 的方向是：**用新的架构重新实现 Legacy 已验证的现场运营能力**，并保持 Operations Engine 与 Competition Engine 的既定边界。

优先级如下：

### P0 — Core Operation

- Master operation capability；
- Match execution；
- Resource visibility；
- Result flow。

### P1 — On-site Workflow

- Check-in；
- Lineup；
- Display。

### P2 — Future Extension

- AI；
- Multi-sport expansion；
- Plugin。

P0 是验证 Modern 是否仍然服务 Tournament Operations Platform 的首要标准。P1 在核心运营闭环上补充现场协作能力。P2 必须建立在 P0 与 P1 已稳定、且不偏离平台使命的前提之上。

## 9. Cross-reference

本文件应作为阅读以下文档时的使命与边界上下文：

- `Docs/01_Architecture/TOP-Blueprint.md`：平台使命、Blueprint 级边界与 Operations / Competition 双引擎来源。
- `Docs/11_Engineering/TOP-Modern-Tournament-Operations-Architecture.md`：Modern 对赛事现场运营、Match execution、Referee workflow 与 Result collection 的工程化表达。
- `Docs/11_Engineering/TOP-Modern-Domain-Architecture.md`：Modern domain 边界与 Competition / Operations 数据关系。

这些文档定义具体架构、领域模型或工程实现时，应保持与本文的使命、角色授权和平台边界一致。本文不覆盖它们的接口、数据模型或实现决策。

## 10. Architecture Alignment Guardrails

后续 Modern 决策应持续使用以下问题进行校验：

1. 该能力是否帮助 Master 运营赛事，或帮助 Referee 可靠执行比赛？
2. 该能力属于 Operations Engine、Competition Engine，还是应由外部系统提供？
3. 该实现是否保留了 Legacy 已验证的现场能力，而非机械复制 Legacy 代码？
4. 该数据是否有助于形成可信现场记录或可信竞赛记录？
5. 平台管理能力是否保持 Super Admin 授权、Master 现场运营的职责分离？

若一个方向无法通过以上校验，应回到 TOP Blueprint 与现有 Architecture 文档重新评估，而不是通过本文件扩大 TOP 的业务边界。
