# Legacy 团体赛赛前准备资料

> 分支：`ops/legacy-team-event-readiness`
> 用途：下一场团体赛的赛前审查、预演和排查

---

## 文件位置

**文档（本目录 `Docs/09_Issues/Legacy-Team-Event-Readiness/`）：**

| 文件 | 用途 |
|------|------|
| `audit-report.md` | 完整审查报告（业务链路、数据模型、风险清单） |
| `pre-match-checklist.md` | 赛前数据检查清单（逐项打勾） |
| `rehearsal-steps.md` | 比赛日前完整预演步骤（Phase 0→6） |
| `troubleshooting.md` | 开赛失败排查表（按症状查） |

**工具与模板（`Tools/legacy-team-event-readiness/`）：**

| 文件 | 用途 |
|------|------|
| `csv-precheck.js` | 离线 CSV 预检工具（Node.js） |
| `team-event-csv-template.csv` | 大名单 CSV 模板（可直接复制使用） |
| `team-event-sample-data.csv` | 示例数据（4 队 × 6 人，用于预演） |

---

## 预检工具使用

```bash
# 基本检查
node Tools/legacy-team-event-readiness/csv-precheck.js your-data.csv

# 交叉比对名单库
node Tools/legacy-team-event-readiness/csv-precheck.js your-data.csv --roster players-export.json

# 交叉比对排阵数据
node Tools/legacy-team-event-readiness/csv-precheck.js your-data.csv --roster players.json --lineups lineups.json
```

**检查内容：**
- CSV 列头是否匹配 Legacy NAME_REGEX
- 空姓名
- 重复人员（同队同名）
- 队名变体检测
- 可选：排阵选手是否在名单库中

**退出码：**
- `0` = 通过（无 P0 错误）
- `1` = 存在 P0 错误，不可导入

---

## 快速参考

### 团体赛 6 Phase 链路

```
Phase 0: 赛事初始化（master.html）
Phase 1: 导入大名单（master.html → CSV/Excel）
Phase 2: 日程建房（team_import.html 或 master.html）
Phase 3: 领队排阵（team_lineup.html）
Phase 4: 签到（checkin.html 或 players.html）
Phase 5: 核碰下发（master.html）
Phase 6: 裁判执裁（referee.html）
```

### 裁判开赛阻断条件

1. 选手必须在 `players` 表中存在
2. 选手 `checked_in` 必须为 `true`

任一不满足 → 弹窗阻断，无法开赛。

### 应急速查

| 紧急情况 | 解决方案 | 注意事项 |
|----------|----------|----------|
| 个别选手未签到 | players.html → 手动切换该选手签到状态 | 必须确认本人到场 |
| 大面积选手未签到 | players.html → 一键全签到 | **仅限主办方已线下核验全部人员实际到场后** |
| 领队未排阵 | 通知领队完成排阵；未排阵的房间不可下发 | **禁止强行下发空白对阵** |
| 姓名不匹配 | players.html → 手动编辑 | 确保与排阵选择完全一致 |
| 裁判看不到任务 | master → 重新核碰下发 | 确认双方排阵已提交 |

---

## 禁止操作

- **禁止强行下发空白对阵**：球员姓名="待定"的下发会导致裁判端身份校验失败，属于严禁操作
- **禁止对未到场人员签到**："一键全签到"仅可在主办方已线下核验全部人员实际到场后使用，不可为绕过系统校验而使用
- **禁止导入含真实个人信息的 CSV 到版本控制**：示例数据仅使用虚构姓名

---

## 约束

- 本分支**未修改任何 Legacy 业务代码**
- 所有文件为只读审查产出物
- 不重构、不改状态机、不改 referee UI、不改数据库
- 发现 P0/P1 阻塞时提出最小修复建议，不自行部署
- 交付物不在 Legacy 构建上下文内，不会被公网访问
