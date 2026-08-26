# Legacy 最小团体赛全链路预演包

> 分支：`ops/legacy-team-event-minimal-rehearsal`（Base: main @ d973c76）
> 固定预演赛事码：**`TEAM-REHEARSAL-20260825`**
> 目标：在 nhpa-160 生产环境以隔离赛事码走通团体赛全链路（建房 → 排阵 → 签到 → 核碰下发 → 裁判执裁），**不触碰任何真实赛事数据**。

## 1. 边界声明

| 约束 | 状态 |
|---|---|
| 不修改 Legacy 任何业务代码 | ✅ `git diff --name-only -- Legacy/` 为空 |
| 不修改数据库（本包全部离线） | ✅ 校验器为纯只读 |
| 不使用真实姓名 / 真实赛事码 / 真实队伍 | ✅ 全部虚构（甲一~甲六 / 乙一~乙六，先锋预备队 / 铁壁预备队） |
| 模板字段全部有代码证据 | ✅ 见第 4 节逐字段证据表 |
| 不执行一键全签到 / 不强行下发空白对阵 | ✅ 已写入检查清单禁止项 |

## 2. 包内文件清单（`Tools/legacy-team-event-rehearsal/`）

| 文件 | 说明 |
|---|---|
| `rehearsal-roster.csv` | 虚构大名单：2 队 × 6 人 = 12 人，列头 `姓名,队名,组别` |
| `rehearsal-schedule.xlsx` | 日程：单工作表「预演日程」，单个 VS 单元格（四行：`公开组` / `先锋预备队` / `VS` / `铁壁预备队`） |
| `rehearsal-lineups.json` | 标准三盘排阵 fixture：双方各 3 盘双打，预期任务 `001-01/02/03`（浏览器操作脚本依据） |
| `build-rehearsal-xlsx.js` | 日程 xlsx 生成脚本（可用 `node build-rehearsal-xlsx.js` 重新生成） |
| `lib-xlsx.js` | 零依赖最小 XLSX 读写模块（仅供校验器与生成脚本使用，不参与生产） |
| `validate-rehearsal-package.js` | 离线一致性校验（复刻 Legacy 解析规则，退出码 0/1） |
| `validate-rehearsal-package.test.js` | 专项测试（24 项，`node --test` 运行；T22/T24 缺 xlsx 依赖时由 node:test 原生标记 skip） |

## 3. 实际只读分析过的代码路径

- `Legacy/master.html` — 总控台：建赛事、导入大名单、日程建房、核碰下发
- `Legacy/team_import.html` — 备选日程导入器（仅 .xls/.xlsx，只读第一个 sheet）
- `Legacy/team_lineup.html` — 领队排阵页
- `Legacy/checkin.html` — 签到页
- `Legacy/players.html` — 运动员名单页（预演链路不修改，仅参考）
- `Legacy/referee.html` — 裁判页
- `Legacy/data.php` — 全部后端 action

## 4. 模板格式逐字段代码证据

### 4.1 大名单（rehearsal-roster.csv）

| 字段 | 取值 | 代码证据（`Legacy/master.html`） |
|---|---|---|
| 列头 `姓名` | 必需 | L446 `NAME_REGEX = /姓名\|名单\|参赛搭档\|选手\|运动员/i`；L2333-2421 `handleImportSignFile` 以该正则定位姓名列，找不到则整表跳过 |
| 列头 `队名` | 必需 | L2354 队名列正则 `/队名\|单位\|学校\|队伍/` |
| 列头 `组别` | 必需 | L2355 组别列正则 `/项目名称\|组别\|所在小组\|项目/i` |
| 每行一个姓名 | 单人 | L444 `SPLIT_REGEX = /[\+＋\/／、＆&\|]/` 会把含分隔符的单元格拆成多人（双打搭档格式），团体赛名单应为单人姓名 |
| 队名/组别延续 | 按行继承 | `handleImportSignFile` 内 `currentTeamName` / `currentGroupName` 行级继承逻辑 |
| team_code 分配 | 自动 `T01`/`T02` | 导入时按队名首现顺序分配；同队共享 `team_code`，`id_code = team_code-序号`（已含 #153 冻结修复合并后的行为） |

### 4.2 日程（rehearsal-schedule.xlsx）

| 要素 | 取值 | 代码证据（`Legacy/master.html`） |
|---|---|---|
| 文件格式 | `.xlsx`（SheetJS 0.18.5） | L9 `<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js">`；`handleImportTeamFile` L2425-2461 用 `XLSX.read(data,{type:'array'})` + `sheet_to_json(sheet,{header:1,defval:''})` |
| 读取范围 | **只读第一个 sheet** | L2439 `handleImportTeamFile` 仅取首个 sheet |
| VS 单元格位置 | 任意单元格 | L2442-2449 遍历首 sheet 全部单元格，凡含 `VS`（大小写不敏感）即尝试建房 |
| 淘汰字眼过滤 | 单元格不得含 `半决赛\|决赛\|胜方\|负方\|名\|交叉` | L2465（注意含单字「名」——队名/组别文案中不得出现这些字符） |
| 拆行 | 单元格内换行 `\n` | L2467 `cellText.split(/\n\|<br\s*\/?>/i)` |
| 独立 VS 行 | 必须有一整行恰为 `VS` | L2468 `lines.findIndex(l => l.toUpperCase() === 'VS')` |
| 组别行 | 含 `公开/常青/青年/中年/U数字` | L2471 `/(公开\|常青\|青年\|中年\|U\d+)[A-Za-z0-9_]*组?/`；无「组」字时自动补「组」→ 本包写 `公开组` |
| 队名行 | 不含 `紧跟前场\|第N轮\|时间\|场地`，不等于组别行 | L2479/L2489 `parseTeam` 跳行规则 |
| 队伍匹配 | 组别**精确相等** + 队名**互含** | L2500-2506 `matchDb`：`dbInfo.group === t.group && (dbInfo.name.includes(t.name) \|\| t.name.includes(dbInfo.name))` |
| 建房 | 房间号三位 `001`…；编号缺省回退 `T01`/`T02` | L2575 `String(rCounter++).padStart(3,'0')`；L2570-2571；确认后调 `import_team_event`（L2586）并回写队员 `team_code`/`id_code`（L2592-2620） |

> 备选导入器 `Legacy/team_import.html`（L52 仅接受 `.xls,.xlsx`；L96-131 VS 解析；直接调 `import_team_event`）解析规则与主控台一致，但**预演统一走 master.html「2.日程建房」入口**。

### 4.3 标准三盘规则（代码推导结论，本次预演正式验收对象）

| 维度 | 取值 | 代码证据 |
|---|---|---|
| 队伍数 | 2 | 对阵需两方（`matchDb` 双方匹配，`master.html` L2500-2506） |
| 每队人数 | **6** | 3 盘双打 × 每盘 2 人 = 6 个球员位；同一排阵内禁止同一球员重复上场（`team_lineup.html` L432-433 `selectedPlayersSet`） |
| 每队盘数 | **恰好 3 盘双打** | 默认模板即 3 盘双打（`team_lineup.html` L397）；提交前每盘必须排满否则拦截（L520-530） |
| 双方盘数 | **必须一致（各 3 盘）** | 核碰按 `min(双方盘数)` 生成（`master.html` L2283）——标准预演禁止依赖截断，校验器强制双方各 3 盘 |
| 总球员 | 12 | 2 队 × 6 人 |
| 对阵房间 | 1 | `confirmTeamScheduleImport` 每场 1 房（L2575） |
| 核碰后任务 | **严格 3 场：`001-01` / `001-02` / `001-03`** | `master.html` L2283-2287：任务 id `${room}-${pad(i+1,'02')}`，`is_team:true`，选手取自双方排阵对应盘 |
| 后端排阵存储 | 零校验原样入库 | `data.php` L581-595 `submit_team_lineup`——完整性全靠前端拦截（L520-530），这是异常路径的根源（见第 9 节） |

## 5. 真实入口清单（浏览器预演用）

| 环节 | 页面 / action | 凭据要求 | 代码证据 |
|---|---|---|---|
| Phase 0 建赛事 | `master.html` → `create_event` | master 口令 | `data.php` L93-100；`event_type` 写入 `config` |
| Phase 1 导入大名单 | `master.html`「1.导入名单」→ `handleImportSignFile` → `set_players` | — | `master.html` L2333 |
| Phase 2 日程建房 | `master.html`「2.日程建房」→ `handleImportTeamFile` → 预览确认 → `confirmTeamScheduleImport` → `import_team_event` | — | `master.html` L2425 / L2537 |
| Phase 3 领队排阵 | `team_lineup.html`：赛事码 + 房间号 + **赛事调度密码** → `get_team_room` / `submit_team_lineup` | 调度密码 = 该赛事 `config.referee_password`（`team_lineup.html` L342、L366-368） | payload：`event_code, room_code, team_name, matches, leader_name, signature`（L299-306） |
| Phase 4 签到 | `checkin.html`：赛事码登录 → 逐人 `player_checkin` | 赛事码即可（L198-221 `doLogin`）；姓名不区分大小写（L495）；名单无 `id_last4` 时跳过后四位校验（L501） | `data.php` L427-441 写 `nhpa_waivers` + `checked_in=true` |
| Phase 5 核碰下发 | `master.html`「⚡ 扫描核碰…」→ `handlePushTeamMatches` → `set_bulk_tasks` | 双方排阵齐备才走正常路径（L2282） | `master.html` L2269-2311 |
| Phase 6 裁判执裁 | `referee.html`：`referee_login`（需 `referee_password`，`data.php` L374-375）→ 任务过滤 `is_team`（L684）→ 开赛校验（L730-748）→ `save_score`（L1128-1133） | 裁判密码 | `data.php` L623-638 归档 `records` 并删除 task |

### 裁判侧硬约束（预演必须满足）

- `referee.html` `handleStartSetup` L741-743：选手**不在名单** → 拦截；L738 校验前会过滤空字符串与「待定」
- `referee.html` `handleStartSetup` L745-748：选手**未签到**（`checked_in !== true`）→ 拦截
- 因此：**必须先完成双方全部 12 人签到，再核碰下发，裁判才能开赛。**

## 6. 离线校验运行方式

```powershell
cd D:\Projects\TOP
node Tools\legacy-team-event-rehearsal\validate-rehearsal-package.js
node --test Tools\legacy-team-event-rehearsal\validate-rehearsal-package.test.js
```

当前结果：校验器 ✅ 通过（2 队 / 12 人 / 1 房间 / 双方各 3 盘 / 任务严格 3 场）；测试 ✅ 24 项（T22/T24 在仓库内无 xlsx 依赖时由 node:test 原生标记 skip，不计入 pass，已由仓库外 SheetJS 0.18.5 独立交叉验证覆盖）。`rehearsal-roster.csv` 固定保存为 UTF-8 BOM（前三字节 EF BB BF，T23 断言）。

兼容性验证：`rehearsal-schedule.xlsx` 已用与 Legacy CDN 同版本的 SheetJS 0.18.5 实际解析，输出与自研读写模块一致（换行保留、组别/队名正确）。

## 7. 配套文档

- `production-rehearsal-checklist.md` — 生产浏览器预演逐步清单
- `evidence-template.md` — 证据记录模板
- `rollback-and-cleanup.md` — 预演后清理回滚

## 8. 尚未验证的风险

1. 生产浏览器首次加载 SheetJS CDN（cdnjs 0.18.5）的网络可达性未验证；离线环境将导致日程建房入口不可用（名单 CSV 导入不受影响）。
2. `checkin.html` 告知书文本来自 `get_waiver_text`（`data.php` L422-425），若赛事 `config` 未配置相关字段，签到页展示内容以实际返回为准。
3. 排阵完整性仅由前端拦截（`team_lineup.html` L520-530），后端 `submit_team_lineup` 零校验（`data.php` L581-595）——绕过前端（直接 API）可写入不完整排阵，预演严禁此类操作。
4. 本包校验器是 Legacy 解析逻辑的复刻实现，非共享代码；若 master.html 正则后续变更需同步更新（各常量处已标注行号）。
5. 核碰下发后房间状态置 `completed`（L2289），同一房间不可二次下发；如需重演需重建房间（见清理文档）。
6. 团体对抗无整场结果汇总：`save_score` 仅逐盘归档 `records`（`data.php` L623-638），无队伍总分/盘分聚合，团体胜负需人工统计。
7. T22/T24（SheetJS 0.18.5 解析）在仓库内依赖不可用时由 node:test 原生标记 skip（不计入 pass），已由仓库外临时目录的独立交叉验证覆盖（验证后已清理）。

## 9. 异常路径调查报告（只读代码审查，不作为主验收）

**场景：某队人数不足 / 某一盘无法组成合法双打，主办方仍允许该队参加其余盘次。逐项结论：**

| # | 问题 | 结论 | 代码证据 |
|---|---|---|---|
| 1 | team_lineup 是否允许缺少一盘提交？ | **前端不允许**：提交前逐盘校验，双打任一位空缺即拦截（`❌ 第 N 盘双打没排满`）；无模板模式下可「✕ 裁撤」整盘后提交（盘数变少）。**后端零校验**：`submit_team_lineup` 原样入库，直接调 API 可写入空盘/缺盘 |
| 2 | 空白第三盘如何保存？ | 前端正常流程无法保存（被 L520-530 拦截）；绕过前端则存为 `players: ['', '']` 原样入库（`data.php` L587-593） |
| 3 | Master 核碰会生成几场？ | **双方都有 matches 时按 `min(盘数)` 截断**：3 vs 2 → 生成 2 场（不会生成待定任务）；空位选手在任务中为**空字符串**（`m1.players[0] \|\| ''`，L2287）而非「待定」。「待定」仅出现在强发路径（L2295） |
| 4 | 是否触发「强行下发空白对阵」？ | **仅当某一方排阵整体不存在（`tl1`/`tl2` 缺失或无 `matches` 字段）时弹出**（L2292）；双方都提交过（哪怕缺盘）则不弹，直接走 min 截断 |
| 5 | referee 是否要求弃权盘占位选手签到？ | 空字符串与「待定」在开赛校验前被**过滤**（`referee.html` L738 `.filter(p => p !== '' && p !== '待定')`）——占位选手不参与签到校验；但真实选手未签到仍被拦截（L745-748）。空位开赛时会回退为占位字母 A/B（L758） |
| 6 | 团体结果如何计算缺失盘？ | **无计算**：`save_score` 逐盘归档 `records` 并删除任务（`data.php` L623-638）；缺失盘既无记录也无判负，团体总分无任何聚合逻辑 |
| 7 | 是否已有 forfeit/walkover/弃权语义？ | **无**。全库搜索 `弃权\|forfeit\|walkover\|判负` 于 `Legacy/` 零命中 |

### 结论（按任务要求原文报告）

> **当前 Legacy 不原生支持弃权盘；比赛日只能依据赛事规程，由赛事负责人作出人工决定并另行留痕。**
> 系统层面最接近的可用表达：把缺人盘从排阵中「裁撤」后双方按一致盘数核碰（但语义是取消该盘而非判负）；或用赛事规程允许的技术比分由裁判正常计分归档（需人工决定，系统无弃权标记字段）。
> `master.html` L2283 的 `min` 截断会**静默吞掉**盘数不一致时的多出一盘——既不下发也无留痕，是比赛日需重点监控的行为。

### 候选应急表达（**待赛事负责人批准的应急方案**，不得写入测试数据、不得执行）

```
选手名称：【弃权占位】某队第3盘          ← 不得实际录入系统（裁判校验要求真人在名单且已签到，此表达仅作线下留痕）
结果：仅采用赛事规程明确规定的技术比分   ← 具体比分由赛事规程与负责人决定，不得随意制造
备注：人员不足，经赛事负责人确认弃权   ← 留痕于纸质/赛事记录，系统无对应字段
状态：待赛事负责人批准的应急方案，不能作为默认流程
```

## 10. 清理能力结论（详见 `rollback-and-cleanup.md`）

✅ 系统具备安全删除整个隔离赛事的能力，无需手工 SQL：`master.html`「🚨 彻底删除当前赛事」按钮 → `reset_event`（`data.php` L664-665，按赛事码参数化删除），另有超管入口 `super_admin_delete_event`（L83-89）。预演收尾仅使用整体删除，禁止手工 SQL。
