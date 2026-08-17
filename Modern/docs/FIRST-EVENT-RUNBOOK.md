# 首场赛事部署指引 (First Event Deployment Runbook)

> **Tag**: `v0.1.0-deployment-candidate`
> **赛事规模**: 25 对选手 / 60 场 / 6 片场地 / 6 位裁判
> **部署目标**: 腾讯轻量云服务器 (Node.js + MySQL)

---

## 第 1 部分：服务器初始化（首次部署）

### 1.1 安装 Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # 应显示 v20.x
```

### 1.2 安装 MySQL 8

```bash
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 1.3 创建数据库与用户

```bash
sudo mysql -u root
```

```sql
CREATE DATABASE IF NOT EXISTS nhpa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'top'@'localhost' IDENTIFIED BY '你的密码';
GRANT ALL PRIVILEGES ON nhpa.* TO 'top'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 1.4 安全组放行

在腾讯云控制台 → 轻量应用服务器 → 防火墙，放行：
- **TCP 3000**（应用端口）
- **TCP 22**（SSH，通常已放行）

---

## 第 2 部分：代码部署

### 2.1 拉取代码

```bash
cd /opt
sudo git clone https://github.com/nus642/TOP.git
cd TOP
sudo git checkout v0.1.0-deployment-candidate
```

### 2.2 安装依赖

```bash
cd Modern
sudo npm install --production
```

### 2.3 配置环境变量

```bash
cat > .env << 'EOF'
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=top
MYSQL_PASSWORD=你的密码
MYSQL_DATABASE=nhpa
PORT=3000
TZ=Asia/Shanghai
EOF
```

### 2.4 初始化数据库

```bash
node init-db.js
```

> 此命令幂等：重复执行不会报错，会自动创建表结构和 VIEW。

---

## 第 3 部分：PM2 进程管理

### 3.1 启动应用

```bash
sudo npm install -g pm2
cd /opt/TOP/Modern
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # 按提示执行输出的命令，实现开机自启
```

### 3.2 验证运行

```bash
pm2 status
# 应显示 top-modern 状态为 online

curl http://localhost:3000/api/session/me
# 应返回 401（未认证），说明服务正常
```

### 3.3 常用命令

```bash
pm2 logs top-modern        # 查看日志
pm2 restart top-modern     # 重启
pm2 stop top-modern        # 停止
pm2 monit                  # 实时监控
```

---

## 第 4 部分：服务器轮彩排

> 目的：在真实服务器环境验证完整业务流程。

### 4.1 执行彩排脚本

```bash
cd /opt/TOP/Modern
BASE_URL=http://localhost:3000 node rehearsal/full-scale-rehearsal.js
```

**预期输出**（11 步全部通过）：

```
✓ Step 1: Created competition <ID>
✓ Step 2: Imported 60 matches
✓ Step 3: Added 6 referees to roster
✓ Step 4: Transitioned to running
✓ Step 5: Bulk checked in 50 players
✓ Step 6: Dispatched 6 matches concurrently
✓ Step 7: Accepted and started 6 matches
✓ Step 8: Scored 6 matches (11:7)
✓ Step 9: Confirmed 6 results
✓ Step 10: Withdrew and reassigned 1 match
✓ Step 11: Rehearsal complete
```

### 4.2 重启恢复验证

```bash
pm2 restart top-modern
sleep 3
BASE_URL=http://localhost:3000 node rehearsal/full-scale-rehearsal.js --verify
```

**预期输出**：

```
✓ Restart recovery verified: 6 confirmed + 1 waiting_acceptance
```

### 4.3 清理彩排数据（可选）

如需在正式赛事前清空彩排数据：

```bash
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const c = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'top',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'nhpa'
  });
  const tables = ['referee_dispatch_reservations','match_schedules','matches','players',
    'team_members','teams','competition_referees','court_operating_conditions',
    'court_disruptions','tournament_coordination_chronology','match_official_records',
    'competition_standings','pairings','player_check_ins','waivers','tournaments'];
  for (const t of tables) await c.query('DELETE FROM ' + t);
  console.log('OK - cleared', tables.length, 'tables');
  await c.end();
})()
"
```

---

## 第 5 部分：真机验证

> 目的：确认裁判手机在现场网络环境下可正常使用。

### 5.1 裁判工作台入口

在裁判手机浏览器中打开：

```
http://服务器公网IP:3000/operator/
```

**建议**：添加到主屏幕（iOS Safari → 分享 → 添加到主屏幕；Android Chrome → 菜单 → 添加到主屏幕）。

### 5.2 验证步骤

1. **身份入口**：输入赛事编号 → 从花名册选择本人姓名 → 点击"进入裁判工作台"
2. **查看派单**：确认能看到已分配的比赛卡片
3. **执裁流程**：接受 → 开赛 → 录入比分 → 提交
4. **故障恢复**：关闭浏览器后重新打开，确认能重新进入（服务器重启后需重新选名字）

### 5.3 主控工作台验证

在电脑或平板浏览器中打开：

```
http://服务器公网IP:3000/operator/master.html
```

1. 输入赛事编号 → 打开主控工作台
2. 确认能看到比赛列表、场地状态
3. 执行一键签到
4. 测试派单/撤回/换派

### 5.4 微信兼容性

如果裁判使用微信内置浏览器：
- 打开微信 → 任意聊天框输入网址 → 点击打开
- 确认页面渲染正常、按钮可点击、表单可提交

> **注意**：微信内置浏览器对 `datetime-local` 输入框支持良好，但如遇到兼容问题，可改用 Chrome/Safari。

---

## 第 6 部分：赛日操作流程

### 6.1 赛前（主控）

1. 打开主控工作台 `http://服务器IP:3000/operator/master.html`
2. 导入赛程（粘贴外部平台 JSON）或手动新增比赛
3. 点击"一键签到全部选手"
4. 登记裁判花名册（6 人）
5. 开始派单

### 6.2 赛中（裁判）

1. 打开裁判工作台 `http://服务器IP:3000/operator/`
2. 输入赛事编号 → 选择本人姓名 → 进入
3. 看到派单卡片后：
   - 点击"接受执裁任务"
   - 确认双方选手到场后点击"开始比赛"
   - 录入最终比分（让分在场下处理）→ 提交
4. 等待主控确认赛果

### 6.3 赛后（主控）

1. 确认所有赛果已确认
2. 执行数据库备份：

```bash
cd /opt/TOP/Modern
bash scripts/backup-db.sh
# 备份文件保存在 /opt/top/backups/
```

---

## 第 7 部分：故障应对

| 故障 | 处理 |
|---|---|
| 派单后裁判迟迟不接单 | 卡片上"撤回"，重新"派单"给其他裁判（或"换派"） |
| 服务器重启 / 页面提示登录失效 | 重新打开工作台重建身份；数据不丢失；重跑"一键签到"；通知裁判重新进入 |
| 导入失败 | 按面板逐行错误提示修正 JSON 后重新导入 |
| 单场场地/时间需调整 | 比赛卡片"编辑"（仅 idle/upcoming 状态），系统自动校验冲突 |
| 比分录错 | 裁判联系主控，由主控按官方更正流程处理 |
| PM2 进程崩溃 | `pm2 restart top-modern`；如自动重启失败，查看 `pm2 logs` |

---

## 第 8 部分：回滚方案

如需回滚到上一版本：

```bash
cd /opt/TOP
git checkout <上一个稳定 commit>
cd Modern
npm install --production
pm2 restart top-modern
```

---

## 附录：关键文件位置

| 文件 | 路径 | 说明 |
|---|---|---|
| 应用入口 | `Modern/server.js` | Express 服务器 |
| 数据库初始化 | `Modern/init-db.js` | 执行 db.sql |
| PM2 配置 | `Modern/ecosystem.config.js` | 进程管理 |
| 备份脚本 | `Modern/scripts/backup-db.sh` | mysqldump |
| 彩排脚本 | `Modern/rehearsal/full-scale-rehearsal.js` | 全流程验证 |
| 部署指南 | `Modern/docs/deployment.md` | 详细技术文档 |

---

## 快速检查清单

部署完成后，逐项确认：

- [ ] `node -v` 显示 v20.x
- [ ] `pm2 status` 显示 top-modern 为 online
- [ ] `curl http://localhost:3000/api/session/me` 返回 401
- [ ] 服务器轮彩排 11 步全部通过
- [ ] 重启恢复验证通过
- [ ] 裁判手机能打开工作台并选名字
- [ ] 主控电脑能打开工作台并看到比赛
- [ ] 微信内置浏览器兼容性确认
- [ ] 备份脚本可执行

全部通过后，可正式用于首场赛事。
