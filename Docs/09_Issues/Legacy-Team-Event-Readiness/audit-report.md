# Legacy 团体赛赛前审查报告

> 分支：`ops/legacy-team-event-readiness`
> 审查日期：2026-08-24
> 审查人：AI 审查（只读，未修改任何 Legacy 业务代码）

---

## 1. 团体赛完整业务链路

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Phase 0: 赛事初始化（超管/裁判长）                                        │
│  data.php → create_event → 生成赛事码、密码、场地、模式(team)                │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  Phase 1: 导入大名单（master.html → handleImportSignFile）                 │
│  CSV/Excel → 解析"姓名"列 → 提取队名、组别 → 写入 players 表                 │
│  字段要求：姓名(必填)、队名/单位(可选)、组别(可选)                            │
│  输出：players 表（id_code, name, team, group, checked_in=false）          │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  Phase 2: 日程建房（两条路径任选）                                          │
│                                                                         │
│  路径 A: team_import.html → 导入 Excel → 解析 VS 单元格 → 创建房间            │
│          data.php → import_team_event → team_event[room_code]             │
│                                                                         │
│  路径 B: master.html → handleImportTeamFile → 解析 VS 单元格 → 预览 → 确认   │
│          data.php → import_team_event → team_event[room_code]             │
│          同时更新 players 表的 team_code 和 id_code                        │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  Phase 3: 领队排阵（team_lineup.html）                                     │
│  领队输入赛事码+房间号 → 选队伍 → 输入调度密码 → 从 players 表加载本队名单      │
│  编排每盘出场球员 → 提交阵容（含领队签名）                                     │
│  data.php → submit_team_lineup → team_lineups[room_team]                  │
│  状态：room status 保持 team_confirming，直到双方都提交                       │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  Phase 4: 签到（checkin.html / players.html）                              │
│  球员扫码 → 签免责书 → 签名图片存 nhpa_waivers 表                           │
│  data.php → player_checkin → players[].checked_in = true                  │
│                                                                         │
│  裁判长也可在 players.html 手动切换 checked_in                               │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  Phase 5: 核碰下发（master.html → handlePushTeamMatches）                   │
│  遍历 team_event 所有房间：                                                 │
│    - 检查双方 team_lineups 是否都已提交                                      │
│    - 是 → 按盘数生成 tasks（id=room-01, room-02...）                        │
│    - 否 → 该房间不可下发，须通知领队完成排阵                                    │
│  data.php → set_bulk_tasks → tasks 表                                       │
│  同时更新 room status → completed                                          │
│                                                                         │
│  ⚠️ 禁止操作：强行下发空白对阵（球员姓名="待定"）                              │
│  此操作会导致裁判端看到虚假选手名单，无法通过身份校验，严禁使用。                  │
└─────────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────────┐
│  Phase 6: 裁判执裁（referee.html）                                         │
│  裁判登录 → 提取任务（get_personal_tasks）                                   │
│  handleStartSetup → 校验选手身份：                                          │
│    1. 选手必须在 players 表中存在                                            │
│    2. 选手 checked_in 必须为 true                                           │
│    任一不满足 → 阻断开赛，弹窗提示                                            │
│  通过后 → 步骤 2（挑边）→ 步骤 3（计分）→ 步骤 4（签名提交）                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 关键数据模型

### 2.1 数据库表

| 表 | 用途 | 关键字段 |
|---|---|---|
| `nhpa_store` | KV 存储（所有业务数据） | event_code, data_key, data_value |
| `nhpa_waivers` | 免责签名 | event_code, player_name, id_last4, signature |

### 2.2 KV 键值

| data_key | 内容 | 格式 |
|---|---|---|
| `config` | 赛事配置 | `{event_name, event_type, courts, referee_password, ...}` |
| `players` | 选手名单 | `[{id_code, name, team, group, checked_in, ...}]` |
| `team_event` | 对阵房间 | `{room_code: {teams: [{team_name, team_code, players}], status}}` |
| `team_lineups` | 领队排阵 | `{room_team: {matches: [{type, players: [p1, p2]}], leader_name, signature}}` |
| `tasks` | 裁判任务池 | `{match_id: {id, t1, t1p1, t1p2, t2, t2p1, t2p2, court, ...}}` |
| `records` | 赛果归档 | `[{id, court, t1, t2, score, winner, referee, signature, ...}]` |
| `referees` | 裁判列表 | `[{name, status, current_court, match_count}]` |
| `live_scores` | 实时比分 | `{court: {score, status, match_name, match_id}}` |

---

## 3. 状态语义

| 状态 | 含义 | 触发条件 |
|---|---|---|
| **已导入** | players 表有该选手记录 | master 导入 CSV 或 team_import 建房时自动创建 |
| **已签到** | `checked_in = true` + waivers 表有签名 | 选手扫码签免责 / 裁判长手动逐个切换 |
| **已排阵** | `team_lineups[room_team]` 存在 | 领队提交阵容（含签名） |
| **已下发** | `tasks[match_id]` 存在 + room status = completed | 主控台核碰双方排阵后批量下发 |
| **裁判可开赛** | 任务已下发 + 所有出场选手 checked_in=true + 选手在 players 表中 | referee handleStartSetup 校验通过 |

---

## 4. 导入 CSV 字段要求

### 4.1 大名单 CSV（handleImportSignFile）

| 列 | 匹配规则 | 必填 | 说明 |
|---|---|---|---|
| 姓名 | 列头含"姓名/名单/参赛搭档/选手/运动员" | **是** | 支持一个单元格多人（+、/、&、\| 分隔） |
| 队名/单位/学校/队伍 | 列头匹配正则 | 否 | 为空则用前一个非空值（跨行继承） |
| 组别/项目名称 | 列头匹配正则 | 否 | 为空则用"系统池" |

### 4.2 日程表 CSV/Excel（handleImportTeamFile）

无固定列头，解析逻辑：
- 扫描所有单元格，找含 "VS" 的单元格
- 以 VS 为界，上方为左队，下方为右队
- 自动过滤含"半决赛/决赛/胜方/负方/名/交叉"的淘汰赛单元格
- 自动提取组别（公开组/常青组/青年组等）

---

## 5. 裁判开赛的阻断条件（referee.html L730-753）

```javascript
// 联网模式下，handleStartSetup 会：
// 1. 调用 get_players 拉取名单
// 2. 遍历 4 个选手输入框（t1p1, t1p2, t2p1, t2p2）
// 3. 对每个非空选手：
//    a. 在 players 表中按 name 或 id_code 查找
//    b. 找不到 → 阻断："选手不在系统名单中"
//    c. 找到但 checked_in=false → 阻断："未完成免责签到"
```

**阻断意味着：即使任务已下发，只要有一个出场选手未签到，裁判就无法开始比赛。**

---

## 6. P0/P1/P2 风险清单

### P0（阻塞开赛）

| # | 风险 | 根因 | 缓解措施 |
|---|---|---|---|
| P0-1 | CSV 列头不匹配导致名单未导入 | NAME_REGEX 只匹配"姓名/名单/参赛搭档/选手/运动员"，若列头为"Name""运动员姓名"等不匹配则整列跳过 | 赛前用预检工具验证；确保列头含"姓名"二字 |
| P0-2 | 选手姓名在 CSV 与排阵中不一致 | 全角/半角、空格、大小写差异导致 find(p => p.name === pName) 失败 | 预检工具检查；领队排阵时从下拉列表选而非手输 |
| P0-3 | 选手未签到导致裁判被阻断 | checked_in 必须为 true，否则 handleStartSetup 弹窗阻断 | 赛前逐一确认所有出场选手已线下签到；应急操作见下方注释 |
| P0-4 | 领队未排阵导致房间无法下发 | 双方 team_lineups 都提交才自动下发 | 赛前确认所有房间双方都已提交；未排阵的房间只能等待或取消，**禁止强行下发空白对阵** |

**关于 P0-3 应急操作的严格限制：**
> "一键全签到"功能**仅在主办方已线下核验全部人员实际到场后**，才可作为应急操作使用。
> 绝不可为了绕过系统校验而对未到场人员使用，否则将导致免责签署缺失的法律风险。

### P1（影响流程但不阻塞）

| # | 风险 | 根因 | 缓解措施 |
|---|---|---|---|
| P1-1 | 日程表解析遗漏对阵 | VS 单元格格式不标准（如用"vs""ＶＳ"） | 预检工具检查房间数 vs 预期对阵数 |
| P1-2 | 队伍编号（team_code）未同步 | 日程建房后未执行 sync_team_player_ids | 在 players.html 手动检查队伍编号列 |
| P1-3 | 领队排阵时名单为空 | players 表中该队无记录 | 先导入大名单再让领队排阵 |
| P1-4 | 裁判提取任务时任务池为空 | 核碰下发未执行或执行失败 | 主控台确认"扫描核碰"按钮已点击且提示成功 |

### P2（体验问题）

| # | 风险 | 根因 | 缓解措施 |
|---|---|---|---|
| P2-1 | 浏览器缓存旧 JS | 无 cache-control 头 | 强制刷新 Ctrl+F5 |
| P2-2 | 签名图片过大导致上传慢 | base64 编码直接存 DB | 无缓解，属已知限制 |
| P2-3 | 裁判恢复中断比赛时数据丢失 | localStorage 被清除 | 提醒裁判不要清除浏览器数据 |

---

## 7. 变更文件清单

本次分支**未修改任何 Legacy 业务代码**，新增文件如下：

**文档（`Docs/09_Issues/Legacy-Team-Event-Readiness/`）：**

| 文件 | 说明 |
|---|---|
| `audit-report.md` | 本审查报告 |
| `pre-match-checklist.md` | 赛前数据检查清单 |
| `rehearsal-steps.md` | 比赛日前完整预演步骤 |
| `troubleshooting.md` | 开赛失败排查表 |
| `README.md` | 目录说明与快速参考 |

**工具与模板（`Tools/legacy-team-event-readiness/`）：**

| 文件 | 说明 |
|---|---|
| `csv-precheck.js` | 离线 CSV 预检工具（Node.js） |
| `team-event-csv-template.csv` | 团体赛大名单 CSV 模板 |
| `team-event-sample-data.csv` | 示例数据（4 队 × 6 人） |

---

## 8. 验证证据

- [x] 分支 `ops/legacy-team-event-readiness` 已从最新 main 创建
- [x] 所有 Legacy 文件只读审查完成（team_import.html, players.html, master.html, referee.html, data.php, team_lineup.html）
- [x] 业务链路图已绘制（6 个 Phase）
- [x] P0/P1/P2 风险清单已识别（4 P0 + 4 P1 + 3 P2）
- [x] CSV 模板和示例数据已生成
- [x] 离线预检工具已实现（不写库，只报告错误）
- [x] 检查清单、预演步骤、排查表已生成
- [x] 交付物已移出 Legacy 构建上下文，不存在公网暴露风险
- [ ] **待用户确认：是否进入真实数据预演**

---

## 9. 结论

**可以进入真实数据预演。** 理由：

1. Legacy 团体赛链路完整：导入→建房→排阵→签到→下发→执裁，6 个 Phase 均可走通
2. 上一场单项赛暴露的问题（CSV 不适配、名单脱节、未签到阻断）在本次审查中已识别根因并给出缓解措施
3. 新增的离线预检工具可在导入前发现 CSV 格式问题
4. 未修改任何 Legacy 业务代码，风险可控

**预演前必须完成的 3 件事：**
1. 用预检工具验证真实 CSV
2. 用示例数据走一遍完整流程（Phase 0 → Phase 6）
3. 确认所有出场选手已完成线下签到核验
