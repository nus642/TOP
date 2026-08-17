# 独立审查指令：裁判逐球计分（P0）改动

## 你的角色

你是 TOP 项目的**独立审计员**（不参与本项目日常开发）。你的任务是对一次已完成的功能改动做独立审查，输出审查结论。你与实现者的所有自查结论无关，请基于代码本身独立判断。

## 审查定位（PR / HEAD）

- **仓库**：https://github.com/nus642/TOP
- **分支**：`p0-referee-live-scoring`（base = `main` @ `e9588e0`）
- **HEAD**：`7477a19` — feat(referee): P0 point-by-point live scoring for referee workbench（11 files，+396/-16）
- **PR**：https://github.com/nus642/TOP/pull/147
- **审查范围命令**：`git diff e9588e0..7477a19`（PR 还含 `dfaa680`，仅更新本指令文档，不在代码审查范围内）

请以 HEAD `7477a19` 的代码为准；下文清单若与该 commit 实际内容不一致，以 commit 为准。

## 项目背景（最小必要信息）

- TOP 是 Pickleball 赛事运营平台，`Modern/` 为现行架构（Node.js + Express + MySQL，无前端框架，原生 DOM）。
- 工程原则见 `Docs/01_Architecture/Development-Principles.md`（10 条，审查时请对照）。
- 本次改动背景：Legacy 的 `Legacy/referee.html` 是成熟的裁判执裁终端（逐球计分），Modern 的裁判工作台此前只有"最终比分录入表单"。本次是功能补全路线图的 **P0 阶段**：让裁判能逐球计分执裁一场比赛。
- 后端已有官方记录契约：裁判通过 `POST /api/referee-workflow/:tournamentId/referees/:refereeId/matches/:matchId/score` 提交最终 `{ score1, score2 }`，Master 确认后成为官方记录（M1 Official Record，本次未触碰）。

## 审查范围（改动清单）

相对 `main` 基线 `e9588e0` 的全部改动（`git diff e9588e0..7477a19` 可查看）：

| 文件 | 性质 | 说明 |
|---|---|---|
| `Modern/operator/referee-scoring.js` | 新增 | 计分引擎（纯逻辑）+ 面板控制器（UMD，浏览器/Node 双环境） |
| `Modern/test/referee-scoring.test.js` | 新增 | 8 个单元测试 |
| `Modern/operator/app.js` | 修改 | playing 状态的分录入表单替换为实时计分面板 |
| `Modern/operator/referee-workflow.js` | 修改 | `run()` 返回 `true/false` 成功标志 |
| `Modern/operator/index.html` | 修改 | 加载新模块 |
| `Modern/operator/styles.css` | 修改 | 计分面板样式 |
| `Modern/test/operator-referee-ui.test.js` | 修改 | accept 契约断言更新 |
| `Modern/test/identity-context.test.js` | 修改 | 同上 |
| `Modern/test/public-scoreboard-ui.test.js` | 修改 | 护栏测试对 `dev-login.html` 的排除收紧为显式白名单 |
| `Modern/.gitignore` | 修改 | 忽略 `_check-accounts.js`、`public/dev-login.html`（仅本地开发工具） |

## 审查要点

### 1. 架构与职责边界（原则 #3 兼容优先、#5 职责分离）
- 后端零改动是否属实？`recordScore` 端点契约是否未被改变？
- 逐球过程状态只存于裁判终端（localStorage 容灾备份），仅最终比分提交后端 —— 这一设计是否与"后端是官方记录唯一权威"兼容？
- `public/` 的"无持久化/无后端权威"护栏是否仍然有效？`public-scoreboard-ui.test.js` 中显式白名单只排除 `dev-login.html`，该文件已被 gitignore 且不会部署 —— 这个取舍是否可接受？

### 2. 计分逻辑正确性
- `award` / `undo` / `isGameOver` 的边界：目标分 + 领先 2 分、封顶分直达、比赛结束后拒绝继续得分、撤回到底是否全部正确？
- `serialize` / `restore` 的容错：畸形备份数据是否被安全拒绝？恢复后 `over` 标志是否由分数重算而非直接信任？
- localStorage 备份生命周期：提交失败时备份是否保留？提交成功才清除？

### 3. 前端安全与健壮性
- `panelHtml` 中的字符串插值是否存在 XSS 风险？（提示：调用方 `app.js` 已对 team 名称和 matchId 做 `escapeHtml`，请验证该假设是否在所有插值位置成立，包括 HTML 属性内。）
- `workflow.run()` 返回值语义变化是否向后兼容？（旧调用方忽略返回值。）
- 提交按钮禁用/恢复逻辑在网络失败时是否正确？

### 4. 测试修改的性质判定
- `operator-referee-ui.test.js` 和 `identity-context.test.js` 的修改是**弱化测试**还是**契约修正**？（背景：此前 accept 请求体为空 `{}` 是 bug —— 未传递 `expectedVersion`，导致乐观并发控制失效；修复后测试更新为断言 `expectedVersion` 和 `correlationId` 形状。）
- 新增 8 个测试的覆盖是否充分？有无明显遗漏场景？

### 5. 已知设计决策（请判定为"可接受"或"需要升级为问题"，不要当作未知缺陷）
- **局点规则权威在前端**：目标分/封顶分由裁判在终端本地设置，后端不校验赛制约束。与 Legacy 行为一致；P1 阶段计划改为从赛事配置下发。
- **逐球时间线不持久化到后端**：官方记录只含最终比分（与 M1 契约一致）。

## 验证方法

```powershell
cd d:\Projects\TOP\Modern
npm test    # 预期：482 tests / 471 pass / 0 fail / 11 skipped（11 个为无 MySQL 环境跳过的集成测试）
cd d:\Projects\TOP
git diff e9588e0..7477a19 --stat   # 确认改动范围与清单一致
```

## 输出格式

按严重度分类输出：

1. **阻塞（Blocking）**：必须修复才能提交的问题
2. **警告（Warning）**：不阻塞但建议修复的问题
3. **可接受（Acceptable）**：审查过但判定合理的取舍（含上述已知设计决策的独立判定）

每条结论给出：文件/行号、问题描述、依据（原则条款或代码事实）。若全部通过，明确给出"可提交"结论。
