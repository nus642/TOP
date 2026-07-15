TOP Legacy → Modern Migration Checklist
1. Workspace 确认

每次开始任务前：

pwd
git branch
git status

确认：

当前目录是：
D:\Projects\TOP
当前 branch：
main
没有未提交修改。
2. Codex / AI 修改确认

不要只相信 Summary。

必须确认：

Commit 是否真实存在
git log --oneline -5
修改文件
git show <commit> --stat
本地文件
git diff

原则：

AI 提交 ≠ 本地完成

必须经过：

AI workspace
      ↓
GitHub
      ↓
Local
      ↓
Runtime
3. API Migration Checklist

每迁移一个接口：

例如：

/api/save

必须检查：

Frontend

搜索：

findstr /s "/api/save" Modern\*

确认：

旧 endpoint
↓
新 endpoint
Route

确认：

Modern/api/*.js

存在：

router.post(...)
Service

确认：

service.js

逻辑迁移。

Repository

确认：

数据库操作没有遗漏。

4. 数据验证

不要只看接口返回。

必须查数据库。

例如 fixed-pair：

players
SELECT id,name FROM players;
pairings
SELECT *
FROM pairings;
matches
SELECT team1_name,team2_name
FROM matches;
5. Windows 开发环境

统一：

文件编码

UTF-8

PowerShell

启动：

chcp 65001
Node 输出

避免中文乱码。

6. Commit 规则

推荐：

[FE] xxx
[BE] xxx
[DOC] xxx
[FIX] xxx

例如今天：

[FE] Migrate save API to competition API

[BE] Fix fixed-pair save parity

非常清晰。

今天其实已经完成了一个很典型的 Modern 化闭环：

schedule API
       ↓
match API
       ↓
reset API
       ↓
save API
       ↓
fixed-pair persistence

下一阶段继续迁移时，我们就不要再“猜”。

每个模块按照：

Frontend
 ↓
Route
 ↓
Service
 ↓
Repository
 ↓
Database
 ↓
Test

走。