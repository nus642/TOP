# 腾讯轻量云部署指南（TOP Modern）

目标：在腾讯轻量应用服务器（VPS）上以 Node.js + MySQL 直装方式运行 TOP Modern，
供赛日通过 `http://服务器IP:3000` 访问（主控、裁判、公开记分屏）。

适用规模：25 对选手 / 60 场比赛 / 6 片场地 / 6 位裁判的第一场赛事。

---

## 1. 服务器初始化

建议配置：2 核 2G 起、Ubuntu 22.04。

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl
```

### Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x
```

### MySQL 8

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

建库与独立账号（不要用 root 运行应用）：

```sql
sudo mysql
CREATE DATABASE nhpa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'top'@'localhost' IDENTIFIED BY '<强密码>';
GRANT ALL PRIVILEGES ON nhpa.* TO 'top'@'localhost';
FLUSH PRIVILEGES;
```

## 2. 代码与环境变量

```bash
sudo mkdir -p /opt/top && sudo chown $USER /opt/top
git clone <仓库地址> /opt/top/TOP
cd /opt/top/TOP/Modern
npm ci --omit=dev
mkdir -p logs
```

创建 `Modern/.env`（勿提交到 git）：

```ini
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=top
MYSQL_PASS=<强密码>
MYSQL_DB=nhpa
```

## 3. 数据库结构初始化

`Modern/db.sql` 包含全部表与 `master_operational_match_overview` 视图，
语句均为 `CREATE TABLE IF NOT EXISTS` / `CREATE OR REPLACE VIEW`，可重复执行：

```bash
mysql -u top -p nhpa < /opt/top/TOP/Modern/db.sql
```

应用启动时 `initDB()` 仅确保存在默认赛事行；表结构与视图以 `db.sql` 为准。
**任何 schema 变更后重新执行上面这条命令即可刷新视图。**

## 4. PM2 进程管理

```bash
sudo npm install -g pm2
cd /opt/top/TOP/Modern
pm2 start ecosystem.config.js
pm2 save
pm2 startup        # 按提示执行输出的 sudo 命令，实现开机自启
```

常用命令：

```bash
pm2 status
pm2 logs top-modern
pm2 restart top-modern
```

**注意：必须保持单实例（fork 模式）。** 会话保存在进程内存 `Map` 中，
cluster 模式或多实例会导致身份会话错乱。

## 5. 网络与安全组

首场方案：安全组放行 TCP `3000`，手机浏览器直接访问 `http://服务器IP:3000`。

- 主控：`/operator/master.html`
- 裁判：`/operator/`（身份入口：赛事编号 + 花名册选名）
- 公开记分屏：`/presentation/`（如有）

可选（微信内置浏览器兼容性问题或需要 80 端口时再加）：

```bash
sudo apt install -y nginx
```

nginx 反代示例（`/etc/nginx/sites-available/top`）：

```nginx
server {
  listen 80;
  server_name _;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/top /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

验证：

```bash
curl -i http://127.0.0.1:3000/api/session/me   # 期望 401（未建立会话）
```

## 6. 备份与恢复

备份脚本 `Modern/scripts/backup-db.sh`：mysqldump 单事务备份 + gzip，保留 7 天。

```bash
chmod +x /opt/top/TOP/Modern/scripts/backup-db.sh
sudo mkdir -p /opt/top/backups && sudo chown $USER /opt/top/backups
/opt/top/TOP/Modern/scripts/backup-db.sh        # 手动跑一次验证
crontab -e
# 每天 03:30 自动备份：
# 30 3 * * * /opt/top/TOP/Modern/scripts/backup-db.sh >> /opt/top/backups/backup.log 2>&1
```

恢复：

```bash
gunzip -c /opt/top/backups/nhpa-<时间戳>.sql.gz | mysql -u top -p nhpa
pm2 restart top-modern
```

**赛日建议**：开赛前一晚与全部成绩确认后各手动执行一次备份；
备份文件可 `scp` 回本地留档。

## 7. 更新与回滚

```bash
cd /opt/top/TOP && git pull
cd Modern && npm ci --omit=dev
mysql -u top -p nhpa < db.sql     # 幂等；顺带刷新视图
pm2 restart top-modern
```

回滚：`git checkout <上一个提交>` 后重复上面步骤；数据问题用最近备份恢复。
**重启前告知所有操作者：重启后需要重新建立身份（见下）。**

## 8. 已知限制（第一场赛事接受的风险）

1. **会话存内存**：进程重启（更新/崩溃/重启服务器）后所有已建立的
   master/裁判身份失效，需各自重新走身份入口。写入赛日当日清单：
   重启后主控先重建身份 → 一键签到可重跑（幂等）→ 通知 6 位裁判重进工作台。
2. **无密码认证**：`foundation-establish` 为开发引导边界，裁判选名字即建立会话；
   花名册姓名经公开接口可见。仅限赛日可信网络场景，赛后按
   `docs/production-identity-integration.md` 加固。
3. **单实例**：不可水平扩展（会话与派单并发控制依赖单进程）。
4. **无 HTTPS**：首场用 IP:3000 明文访问；若微信内置浏览器拦截或
   需要更高安全性，按第 5 节加 nginx（必要时再配证书）。
5. **时区**：确保服务器时区为 Asia/Shanghai（`timedatectl set-timezone Asia/Shanghai`），
   避免赛程时间展示偏差。
