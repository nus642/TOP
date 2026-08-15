# PR #135 运营就绪检视报告

**检视日期**：2026-08-14
**检视目标**：评估 Modern 系统是否能在 1 周内支撑一场 32 签双打赛（6 片场、6 裁判、1 主裁）
**关键前提**：报名、分组、排阵、比分统计、晋级名单、淘汰赛等赛前工作由「网球记」等外部平台完成。TOP 的职责边界是：**导入赛程 → 赋予编号 → 分配裁判 → 执裁运行 → 记录结果**。

---

## 1. TOP 职责边界

TOP **不负责**：选手报名、签到、分组抽签、排阵、赛程生成、比分统计、晋级名单、淘汰赛对阵。

TOP **负责**：

1. 从外部平台（网球记）导入已排定的赛程（选手、对阵、场地、轮次）
2. 为每场比赛赋予系统编号
3. 主控（Master）将比赛分配给裁判
4. 裁判执行执裁流程（接受责任 → 开始 → 记录比分 → 提交）
5. 主控确认赛果
6. 场地运行状态协调
7. 公共记分牌与成绩排名
8. 可信竞赛记录归档

---

## 2. 后端能力逐项评估

### 2.1 已就绪（✅ 可直接使用）

| 能力 | 实现位置 | 说明 |
|---|---|---|
| 赛事创建 | `POST /api/competition/` | 创建 Competition，初始状态 `draft` |
| 选手注册 | `POST /api/competition/:id/players` | 支持批量导入选手 |
| 队伍管理 | `POST /api/competition/:id/teams` + members | 完整 CRUD，支持双打队伍组建 |
| 赛事生命周期 | `POST /:id/lifecycle/transition` | `draft → ready → running → completed → archived` |
| Master 分配裁判 | `POST /api/master-workflow/.../assign` | 将比赛分配给指定裁判 |
| Referee 接受责任 | `POST /api/referee-workflow/.../accept` | 裁判确认接受执裁责任 |
| Referee 开始比赛 | `POST /...start` | 自动联动场地状态（occupied） |
| Referee 提交比分 | `POST /.../score` | 自动释放场地（available） |
| Referee 中断/恢复 | `POST /.../interrupt` + `POST /.../resume` | M2 场地异常处理 |
| Master 确认赛果 | `POST /.../confirm-result` | 写入可信竞赛记录 |
| 场地协调（M2） | `POST /.../courts/:courtId/condition` | 主控报告场地状态 |
| 场地延后协调 | `POST /.../defer` | 主控记录延后处理 |
| 实时运行状态 | `GET /.../live-status` | 多场地 + 多比赛运行视图 |
| 公共记分牌 | `GET /api/public/competitions/:id/matches/scoreboard` | 观众实时比分 |
| 成绩排名 | `GET /api/competition/:id/standings` | 仅计 confirmed 比赛 |
| 可信竞赛记录 | `match_official_records` 表 | 独立持久化 |
| 事务完整性 | `withTransaction()` 全覆盖 | 行锁 + 版本号 + 并发控制 |
| Actor 会话 | `POST /api/session/foundation-establish` | Master/Referee 身份认证 |
| 测试覆盖 | **299 个测试全部通过** | 231 集成 + 68 领域 |

### 2.2 赛程导入路径分析

Modern 已有导入 API：

```
POST /api/competition/:competitionId/schedule
```

`saveSchedule(competitionId, data)` 在一个事务中完成：
- 清空旧数据（matches, pairings, players, partners, opponents）
- 导入选手 `players[]` → `{name, lv, paired}`
- 建立组对 `pairs[]` → `{name: "选手A & 选手B"}`
- 创建比赛 `rounds[][]` → `{court, p1, p2, p3, p4, team1, team2}`
- 每场比赛自动获得系统编号（`match.id`）

Legacy 兼容路径同样可用：`POST /api/generate` → `POST /api/save`

### 2.3 关键后端缺口：`saveSchedule` 不写入 `match_schedules`（P0）

**发现**：`saveSchedule` 将场地写入 `matches.court` 列，但**不创建 `match_schedules` 行**。

而 M2 全部运行链路从 `match_schedules` 读取场地数据：

| 消费方 | 读取位置 | 影响 |
|---|---|---|
| `requiredScheduledCourt()` — 裁判开始/提交/中断/恢复 | `match_schedules.court_id` | ❌ 裁判无法开始比赛，报错 "Match requires a known assigned Court" |
| `isKnownCourt()` — 主控报告场地状态 | `match_schedules` | ❌ 场地不被识别，无法报告状态 |
| `findPlayingMatch()` — 场地占用检查 | `match_schedules JOIN matches` | ❌ 场地占用检查失效 |
| `live-match-status` — Master 运行视图 | `LEFT JOIN match_schedules` | ❌ 运行视图无场地数据 |
| `master_operational_match_overview` VIEW | `LEFT JOIN match_schedules` | ❌ Master 可见性视图缺少场地和时间 |

**结论**：赛程导入 API 存在但**不完整**。导入后 M2 运行链路断裂。修复方案：在 `saveSchedule` 事务中，为每场含 `court` 的比赛同步创建 `match_schedules` 行。这是纯加性修改，不影响现有测试。

### 2.4 尚未就绪（❌ 阻塞赛事运行）

| 缺口 | 严重度 | 说明 |
|---|---|---|
| **`saveSchedule` 不写 `match_schedules`** | **P0 后端** | 见 2.3。导入赛程后裁判无法开始比赛、场地协调失效。修复量小（~10 行），但必须修复。 |
| **赛程导入 UI** | P0 前端 | Master 没有可操作的界面来导入网球记赛程。后端 API 存在但需要一个接受文件/数据的页面。Legacy `master.html` 已有 Excel 导入（`handleImportScheduleFile`），Modern 没有。 |
| **Master 裁判分配 UI** | P0 前端 | `master-app.js` 只有逐场手动输入 refereeId 的表单。32 签、6 裁判需要批量分配能力。 |
| **Referee 移动端执裁 UI** | P0 前端 | `operator/` 下的裁判页面是功能验证级别。裁判需要手机友好的界面来：查看分配 → 接受责任 → 开始 → 输入比分 → 提交。 |
| **生产部署方案** | P1 | Modern（Node.js + MySQL）未见生产 Dockerfile 或部署文档。 |

---

## 3. 实战就绪度总览

| 维度 | 状态 | 备注 |
|---|---|---|
| 裁判分配后端 | ✅ 在正轨 | API 完整 |
| 裁判执裁后端 | ✅ 在正轨 | accept → start → score → confirm 事务链完整 |
| 场地协调后端 | ✅ 在正轨 | M2 condition/disruption/chronology 完整 |
| 排名与归档后端 | ✅ 在正轨 | standings + official records + archive |
| **赛程导入后端** | **⚠️ 有缺口** | **`saveSchedule` 不写 `match_schedules`，导致 M2 链路断裂。修复量小。** |
| 赛程导入 UI | ❌ 不在正轨 | 无可操作界面 |
| 裁判分配 UI | ❌ 不在正轨 | 只能逐场手动分配 |
| 裁判移动端 UI | ❌ 不在正轨 | 功能验证级别 |
| 生产部署 | ⚠️ 未确认 | 需确定方案 |

---

## 4. 一周冲刺建议

### 4.1 可以暂停的工作

- 治理文档产出（Canon 文档已充分）
- Super Admin、签到/waiver（Legacy 可运行，或赛前由网球记完成）
- 团体赛功能、赛制生成器（TOP 不负责排阵）

### 4.2 必须聚焦的工作

**Day 1：修复后端缺口**

1. 修复 `saveSchedule`：为每场含 `court` 的比赛同步创建 `match_schedules` 行
2. 补充测试：验证导入后可被 `requiredScheduledCourt()`、`isKnownCourt()`、`live-match-status` 正确读取
3. 明确网球记导出格式（Excel/CSV 结构），确定字段映射关系

**Day 2-3：赛程导入 + 裁判分配 UI**

4. Master 赛程导入页面：接受文件 → 解析 → 预览 → 确认导入
5. Master 裁判分配页面：按轮次显示比赛、显示可用裁判、支持批量分配

**Day 4：Referee 移动端执裁 UI**

6. 裁判登录后看到被分配的比赛（含场地、轮次、对阵）
7. 操作：接受责任 → 开始比赛 → 输入比分 → 提交
8. 异常：中断比赛（场地受限时）

**Day 5：部署与演练**

9. 部署方案确定与执行
10. 端到端演练：导入 → 分配 → 执裁 → 确认 → 查看排名

### 4.3 技术决策点（需架构师确认）

1. **`saveSchedule` 修复策略**：直接在现有 `saveSchedule` 事务中追加 `match_schedules` 写入？还是新建一个独立的导入入口？建议前者——加性修改，向后兼容。
2. **赛程导入适配层位置**：在 Service 层增加网球记格式解析？还是在 UI 层完成映射后调用现有 API？
3. **Master/Referee UI 策略**：在 Modern operator UI 上扩展？还是复用 Legacy 的成熟 UI（`master.html` 3030 行、`referee.html` 1152 行）对接 Modern API？Legacy UI 已有 Excel 导入、完整的裁判分配和移动端执裁界面，复用可大幅缩短工期。
4. **部署方案**：Modern Node.js 服务如何部署到比赛场地？

---

## 5. 结论

**后端接近完成，有一个关键小缺口需修复；前端和部署是主要瓶颈。**

Modern 后端已具备 TOP 核心职责所需的绝大部分能力。唯一发现的后端缺口是 `saveSchedule` 不写 `match_schedules` 表，导致导入赛程后 M2 运行链路（裁判开始比赛、场地协调、Master 运行视图）全部失效。这是一个**修复量约 10 行的加性修改**，不影响现有测试。

前端缺口集中在三个界面（导入 UI、裁判分配 UI、裁判移动端）。Legacy 系统已有成熟的 Master 和 Referee UI，复用策略是关键决策点。

**建议立即从「架构治理模式」切换到「最小可用产品交付模式」。**

---

*本报告供架构师参考，用于调整下一阶段工作优先级。*
