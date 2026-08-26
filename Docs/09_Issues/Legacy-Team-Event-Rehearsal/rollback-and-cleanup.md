# 预演后清理与回滚（rollback-and-cleanup）

> 适用范围：仅限隔离赛事 `TEAM-REHEARSAL-20260825` 产生的数据。
> **本文档所有操作均使用系统现有按钮 / API，禁止任何手工 SQL。**
> 原则：先在界面审计确认数据全部为虚构 → 再执行整体删除 → 最后在界面复核。

## 1. 清理能力结论

**✅ 当前系统具备安全删除整个隔离赛事的能力，无需手工 SQL。**

依据：`data.php` 提供两个按赛事码参数化的整体删除 action，均由现有按钮触发：

| 能力 | 代码证据 | 删除范围 |
|---|---|---|
| `reset_event` | `data.php` L664-665：`DELETE FROM nhpa_store WHERE event_code = ?` + `DELETE FROM nhpa_waivers WHERE event_code = ?`（PDO 参数化，仅限当前赛事码） | 该赛事全部 KV 数据 + 全部签到/告知书 |
| `super_admin_delete_event` | `data.php` L83-89：同样两条参数化删除，需超管密码 | 同上（可指定任意 `target_code`） |

两个 action 都以 `event_code` 参数化限定范围，**不会触碰其他赛事**；因此整体删除隔离赛事是安全的。

## 2. 可选清理入口清单（全部为现有按钮 / API）

| 入口 | 位置 | 触发链路 | 鉴权 |
|---|---|---|---|
| 🚨 彻底删除当前赛事（**推荐**） | `master.html` 侧边栏按钮（L432） | `handleResetEvent`（L1951-1962）：confirm → 输入密码与 `config.referee_password` 比对（L1956）→ `GET reset_event`（L1957） | 该赛事裁判/调度密码 |
| 🗑️ 彻底删除（超管面板） | `master.html` 赛事管理列表按钮（L1616） | `deleteEventSA`（L1626-1629）→ `POST super_admin_delete_event { super_pwd, target_code }` | 超管密码 |
| 🗑️ 清空队列 | `master.html` 任务队列按钮（L345） | `handleClearTasks` → `clear_all_tasks`（`data.php` L513） | — |
| 单任务删除 | `master.html` L1901 | `delete_task`（`data.php` L493） | — |
| 删除单个团体房间 | — | `delete_team_room`（`data.php` L514-518，连带删除该房间的排阵） | — |
| 清空所有团体房间 | `master.html` `clearAllTeamRooms`（L854-864） | `clear_all_team_rooms`（`data.php` L237-245） | `referee_password` |
| 清空团体雷达 | — | `clear_team_radar`（`data.php` L519） | — |
| 清空名单 | — | `clear_players`（`data.php` L459-467） | `referee_password` |

> 注：`reset_event` / `super_admin_delete_event` 已覆盖上述所有单项（整体物理删除），预演收尾**只需使用整体删除**，单项入口仅在需要部分返工时使用。

## 3. 预演数据落点（供审计核对，非操作步骤）

预演写入的数据全部以 `event_code = 'TEAM-REHEARSAL-20260825'` 隔离（`data.php` KV 模型）：

| data_key | 写入来源 | 代码证据 |
|---|---|---|
| `config` | create_event | `data.php` L91-100 |
| `players` | 导入名单 / 建房回写 | `master.html` L2624 `set_players` |
| `team_event` | 建房 / 核碰 | `master.html` L2586 / L2289 `import_team_event` |
| `team_lineups` | 排阵提交 | `data.php` L581-595（key 形如 `001_先锋预备队`） |
| `tasks` | 核碰下发 | `master.html` L2303 `set_bulk_tasks` |
| `records` | 裁判计分归档 | `data.php` L623-638 `save_score` |
| 签到 / 告知书 | 逐人签到 | `data.php` L427-441 `player_checkin`（写 `nhpa_waivers`） |

## 4. 清理执行步骤

### 步骤 1 — 界面审计（删除前必做）

- [ ] 在 `master.html` 打开该赛事：团体雷达/房间卡片应只有 1 个房间（`001`），双方为先锋预备队 / 铁壁预备队
- [ ] 在名单视图（`players.html` 或 master 名单面板）核对 12 名球员全部为虚构名（甲一~甲六、乙一~乙六）
- [ ] 在任务队列/成绩记录核对任务与成绩仅涉及 `001-01/02/03`
- [ ] **若发现任何真实姓名、真实队伍或非本包导入的数据 → 立即停止，报告数据混入事故，不得删除**

### 步骤 2 — 归档证据

- [ ] `evidence-<日期>.md` 与截图已归档到 `Docs/09_Issues/Legacy-Team-Event-Rehearsal/`
- [ ] （可选）预演成绩留痕：`master.html` 的「打包下载」（`download_all_zip`，`data.php` L667+）导出成绩与签到存档后再删除

### 步骤 3 — 执行整体删除（二选一）

**方式 A（推荐，赛事上下文内）**：`master.html` → 侧边栏「🚨 彻底删除当前赛事」→ 确认弹窗点「确定」→ 输入该赛事调度密码 → 等待「数据已清空」提示。

**方式 B（超管，跨赛事指定）**：`master.html` 赛事管理面板 → 找到 `TEAM-REHEARSAL-20260825` → 「🗑️ 彻底删除」→ 确认弹窗点「确定」→ 输入超管密码。

### 步骤 4 — 复核

- [ ] 刷新 `master.html` 赛事管理列表：`TEAM-REHEARSAL-20260825` 应不再出现
- [ ] 用该赛事码访问 `checkin.html` / `team_lineup.html`：应提示赛事不存在/房间未建立

## 5. 代码仓库侧回滚

| 情形 | 处理 |
|---|---|
| 分支 `ops/legacy-team-event-minimal-rehearsal` 未提交/未推送 | 本任务要求不提交不推送；复核通过后由负责人决定提交或删除分支 |
| 需要废弃整个预演包 | `git branch -D ops/legacy-team-event-minimal-rehearsal`（仅限复核人） |
| Legacy 业务代码 | 零修改（`git diff --name-only -- Legacy/` 为空），无需回滚 |
| 数据库结构 | 预演不产生任何 DDL，无需回滚 |

## 6. 紧急停止条件（任一满足即中止并报告）

1. 审计发现该赛事下存在真实姓名、真实队伍或非本包导入的数据
2. 删除按钮返回错误（如 `权限不足` / `超管鉴权失败`）时，**不得**改用手工 SQL 绕过
3. 删除后赛事码仍在列表中 → 停止重试，报告排查
4. 任何要求手工 SQL、跨赛事批量操作的提议 —— 永远不允许
