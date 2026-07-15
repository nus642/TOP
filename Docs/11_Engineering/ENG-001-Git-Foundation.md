好，这个我建议做。

而且这份文档以后会成为 **TOP Engineering** 的标准文档之一。

所以我不给你一个临时聊天答案，而是给你一份可以直接放进 Docs 的正式版本。

---

# ========================

# ACTION

# ========================

**Decision:** Create

**Priority:** High

**Path:**

```text
Docs/11_Engineering/
```

**Filename:**

```text
ENG-001-Git-Foundation.md
```

**Reason:**

建立家里电脑开发环境，并作为以后所有开发机器的标准配置文档。

# ========================

# END ACTION

# ========================

下面就是文档正文。

---

# ENG-001 Git Foundation

Version 1.0

---

# Purpose

建立 TOP 的标准 Git 开发环境。

目前支持：

* 办公室电脑 A（Primary Development）
* 家里电脑（Secondary Development）

办公室电脑 B 暂时不参与开发，因此无需安装 Git。

---

# Project Location

所有开发电脑统一：

```
D:\Projects\TOP
```

不要直接在：

```
D:\OneDrive\TOP
```

开发。

OneDrive 保留作为：

* 文件同步
* 文档备份

GitHub 负责：

* Source Code
* Version History

---

# Repository

GitHub

```
https://github.com/nus642/TOP
```

Branch

```
main
```

---

# Step 1

安装 Git

下载：

[https://git-scm.com/download/win](https://git-scm.com/download/win)

安装：

全部默认即可。

安装完成：

```
git --version
```

---

# Step 2

配置身份

```
git config --global user.name "Paul Wu"

git config --global user.email "nus642@gmail.com"
```

验证：

```
git config --global --list
```

应看到：

```
user.name=Paul Wu

user.email=nus642@gmail.com
```

---

# Step 3

配置代理

目前 TOP 使用：

v2rayN

Git 配置：

```
git config --global http.proxy http://127.0.0.1:10808

git config --global https.proxy http://127.0.0.1:10808
```

验证：

```
git config --global --get http.proxy
```

返回：

```
http://127.0.0.1:10808
```

> **注意**
>
> 不要使用：
>
> ```
> socks5://127.0.0.1:10808
> ```
>
> Windows Git 某些认证流程不兼容 SOCKS5。

---

# Step 4

Clone Repository

```
cd D:\Projects

git clone https://github.com/nus642/TOP.git
```

得到：

```
D:\Projects\TOP
```

进入：

```
cd TOP
```

验证：

```
git status
```

应看到：

```
On branch main

Your branch is up to date with 'origin/main'.

nothing to commit,
working tree clean
```

---

# Step 5

安装 Node

进入：

```
Modern
```

执行：

```
npm install
```

安装：

```
node_modules
```

不会进入 Git。

---

# Step 6

数据库

启动：

Docker Desktop

启动：

MySQL Container

验证：

```
docker ps
```

---

# Step 7

启动项目

```
cd Modern

node server.js
```

浏览器：

```
http://localhost:3000
```

---

# Daily Workflow

开始工作：

```
git pull
```

查看：

```
git status
```

开发。

完成：

```
git add .

git commit -m "..."

git push
```

---

# Commit Style

工程：

```
[ENG]
```

例如：

```
[ENG] Update Git guide
```

功能：

```
[033.10]
```

例如：

```
[033.10] Complete Schedule parity
```

Bug：

```
[FIX]
```

例如：

```
[FIX] Competition reset bug
```

---

# Repository Policy

进入 Git：

* Modern
* Legacy
* Docs
* Deploy
* Deploy-WechatCloud（源码）
* CHANGELOG.md

不进入 Git：

* `.env`
* `node_modules`
* `*.zip`
* `*.xls`
* `*.xlsx`
* 比赛数据
* 临时导出文件

---

# OneDrive Policy

OneDrive：

保存：

* PDF
* Excel
* 比赛数据
* 资料
* 图片

GitHub：

保存：

* Source Code
* Documentation
* Architecture
* Engineering Assets

---

# Office Computer B

目前：

**无需安装 Git。**

只有：

需要开发：

TOP

时。

再按照本文件配置。

---

# Future

以后增加：

* Feature Branch
* Pull Request
* Release Tag
* GitHub Actions

目前：

**全部不启用。**

保持：

```
main
```

单分支开发。

---



TOP Daily Startup
1. 检查 MySQL 容器
docker ps

应该看到：

docker-desktop-mysql-1

如果没有：

docker start docker-desktop-mysql-1
2. 拉取最新代码
cd D:\Projects\TOP

git pull

git status

预期工作区干净。

3. 启动后端

进入：

cd D:\Projects\TOP\Modern

启动：

npm run dev

保持这个窗口不要关闭。

正常应看到：

DB: localhost 3306 nhpa
Server running on http://0.0.0.0:3000
4. 新开 PowerShell 做端口检查
Test-NetConnection localhost -Port 3000

预期：

TcpTestSucceeded : True
5. API Smoke Test

今天先调用只读接口，不改数据库：

Invoke-RestMethod `
-Method GET `
-Uri http://localhost:3000/api/competition/schedule

只要能正常返回：

tournament
players
matches

就说明：

Docker
→ MySQL
→ Node
→ API

整条链路正常。