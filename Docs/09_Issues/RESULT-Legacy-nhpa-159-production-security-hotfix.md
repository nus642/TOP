# Legacy nhpa-159 生产安全修复与版本核验

- 日期：2026-08-24
- 状态：已完成 / 已验收 / 生产运行中
- 当前生产版本：`nhpa-159`
- 回滚版本：`nhpa-156`

## 结果摘要

Legacy 生产环境的构建产物暴露问题已修复。当前线上服务运行正常，核心业务页面保持可用，`code.zip` 与 `Dockerfile` 已不再通过公网访问。

本次修改只收紧镜像构建边界，没有修改赛事核心业务文件或数据库访问方式。下一场团体赛若继续使用 Legacy，应以 `nhpa-159` 为唯一生产基线。

## 事件背景

核对微信云托管线上版本时发现，`nhpa-156` 的 Apache Web 根目录包含并公开暴露：

- `/code.zip`
- `/Dockerfile`

原 Dockerfile 使用 `COPY . /var/www/html/`，构建上下文中又没有 `.dockerignore`，导致代码归档、Dockerfile 及其他临时文件可能随镜像进入 Web 根目录。

线上 `data.php` 通过以下环境变量读取数据库配置：

- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_DB`
- `MYSQL_USER`
- `MYSQL_PASS`

审计中未发现已确认的硬编码数据库密码。本报告不记录任何凭据值。

## 线上版本核验

从 `nhpa-156` 镜像提取实际运行文件后，与仓库候选目录进行比对。以下关键文件与仓库 `Legacy` 版本一致：

- `master.html`
- `referee.html`
- `players.html`
- `team_import.html`
- `data.php`
- `Dockerfile`

结论：仓库 `Legacy` 可作为 `nhpa-156` 线上功能的可信代码基线。

## 根因

1. Dockerfile 使用宽泛的 `COPY . /var/www/html/`。
2. 构建目录包含 `code.zip` 与 Dockerfile。
3. 构建上下文没有 `.dockerignore`。
4. Apache 将进入 Web 根目录的文件作为静态资源公开。

## 修复内容

1. 以 `nhpa-156` 实际运行文件为业务基线。
2. 从候选镜像中移除 `code.zip`。
3. 增加 `Legacy/.dockerignore`，排除构建文件、归档、数据库备份、日志、测试文件及 Git 元数据。
4. 保持核心业务文件内容不变。
5. 本地验证敏感构建文件不存在。
6. 推送安全镜像并发布 `nhpa-159`。
7. 完成公网 200/404 验收。

## 发布证据

| 项目 | 值 |
|---|---|
| 当前生产版本 | `nhpa-159` |
| 发布时间 | `2026-08-24 07:37:27` |
| 发布方式 | 镜像拉取 |
| 服务状态 | 正常 |
| 实例数量 | 1 |
| 回滚版本 | `nhpa-156` |
| 镜像标签 | `security-clean-20260824-v2` |
| 镜像摘要 | `sha256:5ce8c1b03132057194b7153750a29c8b68c4cb0247ebafcc933f6b1a7c1357e3` |

镜像仓库：

```text
ccr.ccs.tencentyun.com/tcb-100049480544-mclo/ca-fledafjv_nhpa
```

## 验收结果

| 路径 | 预期 | 实际 |
|---|---:|---:|
| `/master.html` | 200 | 200 |
| `/referee.html` | 200 | 200 |
| `/code.zip` | 404 | 404 |
| `/Dockerfile` | 404 | 404 |

附加镜像验证：

- `/var/www/html/code.zip` 不存在。
- `/var/www/html/Dockerfile` 不存在。
- 重新拉取远端镜像后得到 `REMOTE_IMAGE_CLEAN_OK`。

## 回滚策略

如 `nhpa-159` 出现影响赛事运行的问题：

1. 在微信云托管历史版本中恢复 `nhpa-156`。
2. 检查实例、数据库连接和关键业务页面。
3. 复验 `master.html`、`referee.html` 及关键 API。
4. 回滚只用于恢复业务，不代表安全风险已经关闭；回滚后必须限制敏感文件访问并尽快重新发布安全镜像。

## 后续工程规则

1. Legacy 后续生产发布以 `nhpa-159` 为基线，`nhpa-156` 仅作紧急回滚。
2. 所有 Legacy 镜像必须使用受控 `.dockerignore`，或改为显式 `COPY` 白名单。
3. 每次发布前必须验证业务页面为 200，`code.zip`、Dockerfile、SQL、备份和测试文件为 404。
4. 不得向 Git 提交镜像 tar、线上提取目录、数据库备份、凭据或临时审计输出。
5. Legacy 继续承担近期比赛稳定交付；Modern 继续完善赛事导入、裁判工作台和比赛日闭环。
