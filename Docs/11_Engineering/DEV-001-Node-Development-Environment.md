# DEV-001 Node Development Environment Setup

## Purpose

Configure a Windows development environment for TOP Modern.

After completing this guide, the developer should be able to:

- Run the backend using `npm run dev`
- Automatically reload Node.js after code changes
- Connect to the local MySQL development database
- Verify backend APIs through PowerShell

---

## Step 0. Synchronize Project

Before starting:

- Ensure OneDrive or Git has finished synchronizing.
- Open the latest Modern project.

Example:

```
D:\OneDrive\TOP\Modern
```

---

## Step 1. Verify Node.js

Open PowerShell.

```powershell
node -v
npm -v
```

Expected:

```
Node v24.x.x
npm 10.x.x
```

---

## Step 2. Enable PowerShell Script Execution (First Time Only)

If PowerShell reports:

```
npm.ps1 cannot be loaded...
```

Run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Choose:

```
Y
```

Close PowerShell.

Open a new PowerShell window.

---

## Step 3. Enter Project

```powershell
cd D:\OneDrive\TOP\Modern
```

---

## Step 4. Install Project Dependencies

First time only.

```powershell
npm install
```

---

## Step 5. Install nodemon

```powershell
npm install --save-dev nodemon
```

---

## Step 6. Verify package.json

Ensure the following scripts exist:

```json
"scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
}
```

---

## Step 7. Start Development Database

Start Docker Desktop.

Check available containers:

```powershell
docker ps
```

Example:

```
CONTAINER ID   IMAGE       NAME
50429ad18272   mysql:5.7   docker-desktop-mysql-1
```

If the MySQL container is stopped:

```powershell
docker start <container-name>
```

Example:

```powershell
docker start docker-desktop-mysql-1
```

> Do **not** assume the container name is always `nhpa`.
> Always verify it with `docker ps`.

---

## Step 8. Start Backend

Open **PowerShell Window #1**.

```powershell
cd D:\OneDrive\TOP\Modern

npm run dev
```

Expected:

```
[nodemon] starting `node server.js`

DB: localhost 3306 nhpa

Server running on http://0.0.0.0:3000
```

Keep this window running.

---

## Step 9. Verify Server

Open **PowerShell Window #2**.

Check the listening port:

```powershell
Test-NetConnection localhost -Port 3000
```

Expected:

```
TcpTestSucceeded : True
```

---

## Step 10. Verify API

Example GET request:

```powershell
Invoke-RestMethod `
-Method GET `
-Uri http://localhost:3000/api/competition/schedule
```

Example POST request:

```powershell
Invoke-RestMethod `
-Method POST `
-Uri http://localhost:3000/api/competition/save `
-ContentType "application/json" `
-Body '{}'
```

---

## Step 11. Verify Auto Reload

Modify any JavaScript file.

Save.

PowerShell Window #1 should display:

```
[nodemon] restarting due to changes...
```

No manual restart should be required.

---

# Development Workflow

During development, always use two PowerShell windows.

## PowerShell Window #1

Purpose:

- Start backend
- Observe Node.js logs
- Keep running throughout development

Command:

```powershell
npm run dev
```

---

## PowerShell Window #2

Purpose:

- Invoke REST APIs
- Execute Docker commands
- Run MySQL commands
- Perform testing

Examples:

```powershell
Invoke-RestMethod ...
```

```powershell
docker ps
```

```powershell
mysql -u root -p
```

---

# Expected Result

The development environment is ready.

- Node.js installed
- npm available
- PowerShell execution policy configured
- Project dependencies installed
- nodemon installed
- MySQL container running
- Backend started with `npm run dev`
- Automatic reload enabled
- API accessible through localhost:3000


# TOP Development Startup Checklist

## 1. Start Docker Desktop

确认 Docker Desktop 已启动。

检查：

```powershell
docker ps
```

应看到类似：

```text
docker-desktop-mysql-1
docker-desktop-php-1
```

如果 MySQL 没启动：

```powershell
docker start docker-desktop-mysql-1
```

如果 PHP 没启动：

```powershell
docker start docker-desktop-php-1
```

---

## 2. Verify MySQL

查看 MySQL 是否正常：

```powershell
docker exec -it docker-desktop-mysql-1 mysql -uroot -p
```

输入密码：

```
123456
```

进入 MySQL 后：

```sql
USE nhpa;

SHOW TABLES;
```

退出：

```sql
exit;
```

---

## 3. Start TOP Backend

进入：

```text
D:\OneDrive\TOP\Modern
```

启动：

```powershell
npm run dev
```

正常输出：

```text
[DB] localhost:3306/nhpa
Server running on http://0.0.0.0:3000
```

---

## 4. Verify Backend

新开一个 PowerShell：

```powershell
Test-NetConnection localhost -Port 3000
```

应看到：

```text
TcpTestSucceeded : True
```

---

## 5. API Test

例如：

获取赛程：

```powershell
Invoke-RestMethod `
-Method GET `
-Uri http://localhost:3000/api/competition/schedule
```

或测试更新比赛：

```powershell
Invoke-RestMethod `
-Method PUT `
-Uri http://localhost:3000/api/competition/match/11 `
-ContentType "application/json" `
-Body '{
    "score1":11,
    "score2":7,
    "status":"finished"
}'
```

---

## 6. Verify Database (Optional)

进入 MySQL：

```powershell
docker exec -it docker-desktop-mysql-1 mysql -uroot -p
```

```sql
USE nhpa;

SELECT * FROM matches;

SELECT * FROM players;
```

---


