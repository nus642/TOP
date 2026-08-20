# M2 比赛日交付审计与执行计划（Issue #142 闭合）

> 审计基准：`main @ 6fd2f29`（2026-08-21）
> 测试基线：**517/517 通过**（`npm test`，2026-08-21 实测）
> 目标：不扩大产品范围，仅闭合 Issue #142 的比赛日可运营能力。
> 本文档不修改任何代码；所有修复以第 7 节任务卡为准，逐项独立执行。

---

## 1. 从赛事导入到归档的完整业务链路

| # | 环节 | 角色 | 入口 |
|---|------|------|------|
| 1 | 创建赛事 | master | `/operator/master.html` → `POST /api/competition` |
| 2 | 导入对阵（JSON 粘贴，幂等重导） | master | `POST /api/competition/:id/schedule/import` |
| 3 | 登记裁判花名册 | master | `POST /api/referee-coordination/:id/referees/roster` |
| 4 | 生命周期推进 draft→registration_open→ready→running | master | `POST /api/competition/:id/lifecycle/transition` |
| 5 | 选手签到（一键全员 / 逐个） | master | `POST /api/master-workflow/:id/check-in-all` |
| 6 | 派单（version + correlationId 并发控制） | master | `POST /api/master-workflow/:id/matches/:mid/dispatch` |
| 7 | 裁判身份入口（赛事编号 + 花名册选名） | referee | `/operator/` |
| 8 | 接单 → 开赛 → 现场执裁（三步流程 + 逐分计分） | referee | `accept` / `start` + 客户端计分状态机 |
| 9 | 比分上报 + 实时快照 | referee | `POST .../score`、`PUT .../score-snapshot`（best-effort） |
| 10 | 主控确认赛果 | master | `POST /api/master-workflow/:id/matches/:mid/confirm-result` |
| 11 | 撤回 / 换派（异常处理） | master | `withdraw` + 重新 `dispatch` |
| 12 | 公开记分屏 + 归档 | public | `/public/`、`GET /api/public/competitions/:id/archive`、`/archive/` |

---

## 2. 每一步可用性、证据位置、缺失点

| # | 环节 | 可用 | 证据位置 | 缺失点 |
|---|------|------|----------|--------|
| 1 | 创建赛事 | ✅ | `api/competition.js`；`test/competition.api.test.js` | — |
| 2 | 导入对阵 | ✅ | `services/schedule-import.service.js`（先全量校验后写入、DELETE+INSERT 幂等重导、仅 master）；`test/schedule-import.test.js` | 仅 JSON，无 CSV/Excel 模板（见 m1） |
| 3 | 裁判花名册 | ✅ | `api/referee-coordination.js`；公开接口 `api/public-referee-roster.js`；`test/public-referee-roster.test.js` | — |
| 4 | 生命周期 | ✅ | `services/competition-lifecycle-eligibility.js`；`test/competition-lifecycle*.test.js`、`test/tournament-lifecycle.integration.test.js` | — |
| 5 | 签到 | ✅ | `api/master-workflow.js`（check-in-all 幂等）；`test/checkin.service.test.js`、`test/deploy-readiness.route.test.js`（401/403 边界） | — |
| 6 | 派单 | ✅ | `services/dispatch.service.js`；`test/dispatch-concurrency.test.js`、`dispatch-idempotency.test.js`、`m2-coordination-concurrency.test.js` | — |
| 7 | 裁判身份入口 | ✅ | `operator/index.html` + `identity-context.js`；`test/operator-referee-ui.test.js` | 无密码认证（已记录为接受风险，`docs/deployment.md` §8.2） |
| 8 | 现场执裁 | ✅ | `operator/referee-scoring.js`（逐分状态机、undo、暂停/换边）、`operator/app.js` 三步流程；`test/referee-scoring.test.js`、`m1-match-completion.test.js` | 本周新修 UI（全屏视图、返回计分、undoEndGame）仅本地人工验证过，需二轮真机复验（见 m5） |
| 9 | 比分/快照 | ✅ | `PUT .../score-snapshot`（仅 playing、仅受派裁判，`test/m2-score-snapshot.test.js`）；快照 best-effort、客户端 localStorage 兜底 | — |
| 10 | 赛果确认 | ✅ | `api/master-workflow.js` confirm-result；`test/match-confirmation.transaction.integration.test.js` | — |
| 11 | 撤回/换派 | ✅ | `rehearsal/full-scale-rehearsal.js` 步骤 11 已覆盖 | — |
| 12 | 公开记分/归档 | ✅ | `api/public-match-scoreboard.js`、`api/competition-archive.js`、`public/index.html`、`archive/index.html`；`test/public-match-scoreboard.test.js`、`competition-archive-ui.test.js` | deployment.md §5 把公开记分屏写成 `/presentation/`，实际为 `/public/`（见 m2） |

**部署与运维证据**：
- `Modern/ecosystem.config.js` — PM2 单实例 fork（会话在进程内存，禁止 cluster），autorestart。
- `Modern/scripts/backup-db.sh` — mysqldump 单事务 + gzip，保留 7 天，读取 `.env` 的 `MYSQL_PASS`/`MYSQL_DB`。
- `Modern/docs/deployment.md` — 部署、备份恢复、回滚、已知限制（变量名正确）。
- `Modern/docs/FIRST-EVENT-RUNBOOK.md` — 首场赛事运行手册（**含 B1 致命错误，见下**）。
- `Modern/rehearsal/full-scale-rehearsal.js` — 25 对/60 场/6 场地/6 裁判全流程 + `--verify` 重启恢复断言。本地彩排记录：`rehearsal/.rehearsal-state.json`（2026-08-17，competitionId=1020）。

---

## 3. 缺口分级（Blocking / Major / Minor）

### Blocking（冻结前必须关闭）

| ID | 缺口 | 证据 | 影响 |
|----|------|------|------|
| **B1** | `FIRST-EVENT-RUNBOOK.md` §2.3 与 §4.3 使用 `MYSQL_PASSWORD`/`MYSQL_DATABASE`，而应用读取 `MYSQL_PASS`/`MYSQL_DB` | `database/db.js` L7-9；`scripts/backup-db.sh` L23-25；`deployment.md` §2（正确） | 按 runbook 部署云端会静默回落 root/123456 默认值，DB 连接失败，整场赛事无法开始 |

### Major（Go 前必须关闭）

| ID | 缺口 | 证据 | 影响 |
|----|------|------|------|
| **M1** | 彩排只跑 1 波 6 场 + 1 次换派；Issue #142 验收要求「至少两轮 turnover」 | `full-scale-rehearsal.js` 步骤 6-11 仅覆盖第一波 | 场地周转（同场地第二场接续）未被验证 |
| **M2** | 云端部署与云端彩排尚未执行；仓库内仅有本地彩排记录 | `.rehearsal-state.json`（本地，2026-08-17） | 验收「Full import-to-public-result works in cloud」未达成 |
| **M3** | 备份恢复演练未执行过（恢复步骤仅有文档，无演练记录） | `deployment.md` §6 只有命令 | 验收「backup and restore」只完成一半 |
| **M4** | 本地回退（local fallback）未作为演练正式演示 | 无记录 | 验收「Local fallback is demonstrated」未达成 |

### Minor（冻结后处理或不阻塞 Go）

| ID | 缺口 | 说明 |
|----|------|------|
| m1 | 导入仅 JSON，无 CSV/Excel 模板 | Issue #142 验收未强制；架构文档将 Excel/CSV 列为未来 File Parser Adapter（`Docs/11_Engineering/TOP-Modern-Tournament-Operations-Architecture.md` L210）。runbook §6.1 已明确「粘贴外部平台 JSON」。冻结后按需立项 |
| m2 | `deployment.md` §5 写公开记分屏为 `/presentation/`，实际入口为 `/public/` | `presentation/` 目录仅 1 个 js、无 index.html |
| m3 | `/dev` 静态挂载在生产也生效（`server.js` L36-37），dev-login.html 公网可达 | 建议 `NODE_ENV !== "production"` 条件挂载 |
| m4 | 彩排脚本赛程日期硬编码 `2026-08-20`（`full-scale-rehearsal.js` L101） | 不影响断言，改为动态日期更耐用 |
| m5 | 本周裁判 UI 修复（全屏视图、返回计分/undoEndGame、暂停/换边控制、发球高亮）仅本地人工验证 | 纳入第二轮演练真机清单 |
| m6 | runbook §4.3 清理脚本缺 `team_rooms`、`player_partners`、`player_opponents` 三张表 | 对照 `db.sql` 全表清单核实 |

**已记录并接受的风险（不算缺口）**：会话存内存（重启需重建身份）、无密码认证、单实例、无 HTTPS、时区依赖（`deployment.md` §8）。

---

## 4. 两轮真实演练脚本

### 第一轮：云端首次全彩排（对应 2026-08-19 目标，阻塞项修复后执行）

**角色**：主控 1 人（笔记本）、裁判 6 人（手机）、观察员 1 人（记录偏差）。

| 序 | 动作 | 命令 / 操作 | 预期 |
|----|------|-------------|------|
| 1 | 按 runbook 部署云端（先完成 MD-FIX-1 文档修正） | runbook §1-§3 | `pm2 status` online；`curl /api/session/me` → 401 |
| 2 | 赛前备份 | `bash scripts/backup-db.sh` | 生成 `nhpa-<时间戳>.sql.gz` |
| 3 | 机器彩排 | `BASE_URL=http://localhost:3000 node rehearsal/full-scale-rehearsal.js` | 11 步全部通过（含 MD-FIX-2 后的第二轮 turnover） |
| 4 | 真机主控 | 笔记本开 `http://IP:3000/operator/master.html` | 比赛列表、场地状态可见 |
| 5 | 真机裁判 ×6 | 手机开 `http://IP:3000/operator/`，赛事编号 + 选名 | 6 人全部进入工作台 |
| 6 | 第一波执裁 | 6 场并发：接单→开赛→逐分计分→提交 | 主控台显示 6 场 scored |
| 7 | 主控确认 | 逐场 confirm-result | 公开记分屏 `/public/` 出现确认赛果 |
| 8 | 第二波周转 | 同 6 片场地派下一轮 6 场，重复 6-7 | 场地周转无冲突报错 |
| 9 | 异常演练 | 1 场撤回 + 换派；1 场导入错误 JSON 重导 | 换派后 waiting_acceptance；导入错误逐行提示 |
| 10 | 赛后备份 | 再次 `bash scripts/backup-db.sh` | 第二份备份文件 |

**第一轮通过标准**：步骤 3 全绿 + 步骤 4-9 无 P0/P1 偏差。发现问题只修 Blocking/P1（冻结范围约束）。

### 第二轮：完整彩排 + 重启 + 本地回退（对应 2026-08-20 目标）

| 序 | 动作 | 命令 / 操作 | 预期 |
|----|------|-------------|------|
| 1 | 全新数据重跑机器彩排（两轮 turnover） | 清理 → `node rehearsal/full-scale-rehearsal.js` | 全绿 |
| 2 | 重启恢复 | `pm2 restart top-modern` → `node rehearsal/full-scale-rehearsal.js --verify` | 60 场在库、确认数与换派状态完整 |
| 3 | 身份重建 | 主控与 6 裁判重走身份入口 | 各自恢复正常工作 |
| 4 | 裁判 UI 真机复验（m5 清单） | 全屏执裁、暂停/换边倒计时与终止、发球人高亮、结果页「返回计分修改」+ undo | 与本地验证行为一致 |
| 5 | 断网演练 | 裁判手机断网 60s：计分继续、报错提示出现；恢复网络 | 快照自动续传，本地比分不丢 |
| 6 | 备份恢复演练（M3） | 见第 5 节 | 恢复后 `--verify` 通过 |
| 7 | 本地回退演练（M4） | 见第 5 节 | 本地全链路跑通，截图/日志留档 |

---

## 5. 恢复验证（服务重启 / 网络中断 / 错误操作）

### 5.1 服务重启

- **验证方式**：`pm2 restart top-modern` → `node rehearsal/full-scale-rehearsal.js --verify`。
- **断言**：60 场全部在库；已确认赛果数量不变；换派场仍处 `waiting_acceptance`。
- **已知行为**（`deployment.md` §8.1）：内存会话失效，所有角色需重走身份入口；一键签到幂等可重跑。runbook §7 已有操作指引。
- **状态**：脚本已具备 ✅，需第二轮实际执行并留档。

### 5.2 网络中断

- **裁判端**：逐分计分完全在客户端（`referee-scoring.js` 注释 L7-9），快照为 best-effort PUT 且旧请求被 abort 取代（`test/operator-referee-ui.test.js` 快照测试）；浏览器刷新可从 localStorage 兜底恢复（`operator/app.js` L12-14）。断网时 API 报错已在 UI 展示。
- **主控端**：派单等操作失败时返回明确错误，version + correlationId 保证重试幂等（`test/dispatch-idempotency.test.js`）。
- **验证方式**：第二轮演练步骤 5（真机断网 60s → 恢复 → 快照续传、比分一致）。
- **状态**：机制已具备 ✅，需真机演练留档。

### 5.3 错误操作

| 场景 | 系统行为 | 证据 |
|------|----------|------|
| 导入错误 JSON | 全量校验失败即拒写，逐行报错，修正后幂等重导 | `schedule-import.service.js` Phase 1 校验；`test/schedule-import.test.js` |
| 比分录错（未提交） | 裁判逐分 undo；结果确认页可「返回计分修改」（`undoEndGame` 恢复 history） | `referee-scoring.js`；本周人工验证 |
| 比分录错（已提交未确认） | 主控确认门拦截：未 confirm 前可退回；确认后走官方更正流程 | runbook §7 |
| 派错裁判 | 撤回 + 换派，version 校验防并发错乱 | 彩排步骤 11；`test/dispatch-workflow.test.js` |
| 非授权操作 | referee 调 schedule CRUD → 403；无会话 → 401 | `test/deploy-readiness.route.test.js` |

---

## 6. Go / No-Go 标准

### Go 条件（全部满足才可冻结发布）

1. **B1 关闭**：runbook 环境变量已修正，并按修正后的 runbook 完成一次云端部署。
2. **两轮彩排通过**：第一轮（云端全流程）与第二轮（含两轮 turnover、重启、断网、恢复）均无未解决 P0/P1。
3. **恢复验证留档**：重启 `--verify` 通过、备份恢复演练通过、本地回退演示通过。
4. **测试基线**：冻结 commit 上 `npm test` 517/517（新增任务不得减少覆盖）。
5. **冻结动作完成**：打 tag、冻结前备份、runbook 定稿、本文件第 3 节 Major 全部关闭。
6. **验收对照**：Issue #142 Acceptance 五条逐项签字：
   - Full import-to-public-result works in cloud
   - Six parallel matches and at least two turnover rounds pass
   - Restart preserves assignments, courts, scores, and trusted records
   - Local fallback is demonstrated
   - No P0/P1 remains at freeze

### No-Go 触发条件（任一即停）

- 云端彩排出现数据丢失、状态错乱或派单并发错误（P0）。
- 重启后 `--verify` 失败。
- 备份恢复演练失败且无可用替代恢复路径。
- 冻结前 24 小时内引入了新的功能性改动（违反冻结纪律）。

### 冻结执行序列（Go 决定后）

```bash
# 1. 冻结前备份
bash scripts/backup-db.sh
# 2. 打 tag（在确认通过的 commit 上）
git tag -a v0.2.0-m2-freeze -m "M2 match-day freeze (Issue #142)"
git push origin v0.2.0-m2-freeze
# 3. 云端部署锁定到 tag
git checkout v0.2.0-m2-freeze && npm ci --omit=dev && pm2 restart top-modern
# 4. 归档 Go/No-Go 结论与演练记录到 Docs/09_Issues/
```

---

## 7. 最小修复任务拆分（禁止顺手重构）

> 原则：每任务只改列出的文件；每任务独立提交、独立验收；不触碰其他模块。

### MD-FIX-1【Blocking｜文档】修正 runbook 环境变量名
- **文件**：`Modern/docs/FIRST-EVENT-RUNBOOK.md`
- **改动**：§2.3 的 `MYSQL_PASSWORD`→`MYSQL_PASS`、`MYSQL_DATABASE`→`MYSQL_DB`；§4.3 清理脚本内联 node 代码同步修正两处变量名。
- **验收**：grep runbook 无 `MYSQL_PASSWORD`/`MYSQL_DATABASE`；按 §2.3 生成的 .env 与 `database/db.js`、`backup-db.sh` 读取的变量名一致。

### MD-FIX-2【Major｜彩排】彩排脚本补齐第二轮 turnover
- **文件**：`Modern/rehearsal/full-scale-rehearsal.js`
- **改动**：步骤 10 之后新增「第二波」：对第 7-12 场（同 6 片场地第二轮）执行并发派单→接单→开赛→记分→确认，并纳入 `--verify` 断言（confirmed 数 6→12）。
- **验收**：本地对全新库跑 `node rehearsal/full-scale-rehearsal.js` 全绿，`--verify` 通过；不改动第一波与换派逻辑。

### MD-FIX-3【Major｜演练】备份恢复演练脚本
- **文件**：新增 `Modern/rehearsal/restore-drill.sh`（单文件，不改现有代码）
- **改动**：备份 → 删除标记数据（或导入测试赛事）→ 恢复备份 → `--verify` 断言，输出 PASS/FAIL。
- **验收**：在本地 MySQL 与云端各执行一次通过并留档。

### MD-FIX-4【Major｜演练】本地回退演示留档
- **文件**：无代码改动；产出 `Docs/09_Issues/RESULT-m2-local-fallback-demo.md`
- **改动**：在本机 Docker MySQL + `npm start` 跑完整彩排 + `--verify`，记录命令输出与截图清单。
- **验收**：文档含可复现命令序列与实际输出。

### MD-FIX-5【Minor｜文档】修正公开记分屏 URL
- **文件**：`Modern/docs/deployment.md`
- **改动**：§5 中「公开记分屏：`/presentation/`（如有）」改为「`/public/`」。
- **验收**：grep 无 `/presentation/` 误导表述。

### MD-FIX-6【Minor｜安全卫生】生产环境移除 /dev 挂载
- **文件**：`Modern/server.js`
- **改动**：`/dev` 静态挂载包裹 `if (process.env.NODE_ENV !== "production")`（仅此一处，不动其他路由）。
- **验收**：NODE_ENV=production 下 `GET /dev/dev-login.html` → 404；开发模式仍可用；517 测试保持全绿。

### MD-FIX-7【Minor｜脚本】清理脚本补三张表 + 日期动态化
- **文件**：`Modern/docs/FIRST-EVENT-RUNBOOK.md`（§4.3 表清单加 `team_rooms`、`player_partners`、`player_opponents`）；`Modern/rehearsal/full-scale-rehearsal.js`（L101 日期改为执行当日）
- **验收**：清理后 19 张业务表全空；彩排赛程时间为执行当日。

### MD-FIX-8【流程】冻结与 Go/No-Go 记录
- **文件**：新增 `Docs/09_Issues/RESULT-m2-matchday-gonogo.md`
- **改动**：记录两轮演练结果、验收五条对照、Go/No-Go 结论、tag 号。
- **验收**：与第 6 节标准逐项对应。

**执行顺序**：MD-FIX-1 → MD-FIX-2 → MD-FIX-3 →（云端）第一轮演练 → MD-FIX-6/7（随下一部署）→ 第二轮演练 → MD-FIX-4/5/8 → 冻结。
MD-FIX-5、MD-FIX-6、MD-FIX-7 若时间不足可降级为冻结后处理，不影响 Go 判定。

---

## 附：审计方法与局限

- 全部结论基于当前 main 代码、测试实际运行结果（517/517）与仓库内文档；未凭 PR 描述推断。
- 云端实际部署状态无法从仓库验证，列为 M2 执行任务。
- 本周新增的裁判三步执裁 UI 已通过自动化测试与本地人工验证，真机复验列入第二轮演练（m5）。
