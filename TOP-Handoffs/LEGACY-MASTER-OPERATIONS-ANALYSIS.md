# Legacy Master Operations Analysis

> 分析目的：在定义 Modern 边界之前，从旧版 Master 操作中提取有效的业务行为。
> 
> 原则：TOP 是领域事实系统，不是工作流引擎。Master 是参与者(Actor)，不自动成为领域所有者。

---

## 1. Master 角色分类

### 1.1 参与者职责 (Actor Responsibilities)

| 职责 | 描述 | 旧版实现 |
|------|------|----------|
| 赛事总控 | 赛事期间的最高操作权限持有者 | `master.html` 密码登录 |
| 裁判长 | 管理裁判团队，手动录入成绩 | 裁判管理面板 |
| 赛程编排员 | 导入日程、创建比赛任务 | Excel 导入功能 |
| 资源调度员 | 分配场地、管理裁判状态 | 场地/裁判面板 |
| 数据管理员 | 导出成绩、归档数据 | 下载/打包功能 |

### 1.2 权限 (Permissions)

| 权限类型 | 旧版实现 | 备注 |
|----------|----------|------|
| 登录认证 | `referee_password` 密码验证 | 单一密码，无角色区分 |
| 超级管理 | `SUPER_ADMIN_PWD` 硬编码 | 赛事创建/删除/配置修改 |
| 操作授权 | 密码确认弹窗 | 如强行下发空白对阵 |

**重要观察**：旧版没有独立的权限系统，权限通过密码验证实现。这是应用层关注点，不是领域事实。

### 1.3 操作行为 (Operational Actions)

| 操作类别 | 具体操作 | API |
|----------|----------|-----|
| 成绩录入 | 手动输入比分 | `save_score` |
| 任务管理 | 创建/删除/更新比赛任务 | `set_bulk_tasks`, `delete_task`, `update_task_court` |
| 裁判管理 | 查看/更新/删除裁判 | `get_referees`, `update_referee_comment`, `delete_referee` |
| 场地管理 | 查看场地状态 | `get_full_dashboard` |
| 选手管理 | 添加/导入/编辑选手 | `set_players`, `clear_players` |
| 团体赛管理 | 建房/排阵/核碰 | `import_team_event`, `submit_team_lineup` |
| 赛程导入 | Excel 解析 | 前端解析 + `set_bulk_tasks` |
| 公告管理 | 发布/下线轮播 | `set_event_notice` |
| 数据导出 | CSV/ZIP 下载 | `download`, `download_all_zip` |
| 赛事配置 | 编辑赛事信息 | `update_event_config`, `update_event_code` |

### 1.4 创建的领域事实 (Domain Facts Created)

| 领域事实 | 触发操作 | 存储位置 |
|----------|----------|----------|
| 比赛结果 (MatchResult) | 手动成绩录入 | `records` |
| 比赛任务 (MatchTask) | 任务分配/赛程导入 | `tasks` |
| 选手注册 (PlayerRegistration) | 添加队员/导入名单 | `players` |
| 团体房间 (TeamRoom) | 团体赛建房 | `team_event` |
| 团体排阵 (TeamLineup) | 领队提交排阵 | `team_lineups` |
| 裁判状态 (RefereeStatus) | 裁判登录/状态更新 | `referees` |
| 赛事公告 (EventNotice) | 发布轮播 | `event_notice` |
| 赛事配置 (EventConfig) | 编辑赛事 | `config` |

---

## 2. Master 操作详细分析

### 2.1 手动成绩录入 (Manual Result Entry)

**旧版实现** (`master.html` line 2313-2327):
```javascript
window.manualScoreTask = async (taskId, t1Name, t2Name) => {
    let score = prompt('请输入比分（格式：左方比分-右方比分，例如 21-15）：');
    // ... 解析比分
    let payload = { 
        action: 'save_score', id: taskId, court: '1', 
        t1: t1Name, t2: t2Name, score: score, winner: winner, 
        details: '裁判长手动录入：' + score, 
        referee: '裁判长手动', referee_id: 'master', is_team: false 
    };
    await apiPost('save_score', payload);
    await apiPost('delete_task', { match_id: taskId });
};
```

**业务行为提取**：
- 裁判长可以手动录入比赛结果
- 录入后创建 MatchResult 领域事实
- 同时删除对应的 MatchTask
- 记录来源为 "裁判长手动"

**领域事实所有者**：Competition Result Recording

---

### 2.2 查看比赛记录 (Viewing Match Records)

**旧版实现** (`get_full_dashboard` API):
```php
case 'get_full_dashboard':
    $res = [
        'status' => 'success', 
        'tasks' => kv_get($event_code, 'tasks', []), 
        'records' => array_reverse(kv_get($event_code, 'records', [])), 
        'team_lineups' => kv_get($event_code, 'team_lineups', []), 
        'team_event' => kv_get($event_code, 'team_event', []), 
        'courts' => []
    ];
```

**业务行为提取**：
- 查看待执裁任务列表 (tasks)
- 查看已完成比赛记录 (records)
- 查看场地状态 (courts)
- 查看团体赛状态 (team_event, team_lineups)

**领域事实所有者**：只读查询，不创建领域事实

---

### 2.3 裁判管理 (Referee Management)

**旧版实现** (`master.html` 裁判面板):
- 查看裁判列表：`get_referees`
- 更新裁判备注：`update_referee_comment`
- 删除裁判：`delete_referee`
- 裁判状态更新：`referee_update_status`

**业务行为提取**：
- 裁判登录时创建/更新 RefereeStatus
- 裁判长可以编辑裁判备注
- 裁判长可以移除裁判
- 裁判状态：空闲/执裁中

**领域事实所有者**：Resource Management (裁判资源)

---

### 2.4 场地管理 (Court Management)

**旧版实现**:
- 场地状态从 `config.courts` 读取
- 场地状态通过裁判状态推导
- 更新任务场地：`update_task_court`

**业务行为提取**：
- 场地是赛事配置的一部分
- 场地状态由裁判执裁状态推导
- 可以重新分配比赛的场地

**领域事实所有者**：Resource Management (场地资源)

---

### 2.5 赛程操作 (Scheduling Operations)

**旧版实现** (`master.html` line 2396-2604):
- Excel 日程表导入：`handleImportTeamFile`
- 循环赛/分组赛解析：`parseRoundRobinData`
- 团体房间创建：`import_team_event`
- 批量任务下发：`set_bulk_tasks`

**业务行为提取**：
- 从 Excel 解析赛程安排
- 自动过滤淘汰赛（只处理小组赛）
- 创建团体房间 (TeamRoom)
- 生成比赛任务 (MatchTask)
- 支持日期设置

**领域事实所有者**：Scheduling

---

### 2.6 任务分配 (Task Assignment)

**旧版实现** (`master.html` line 2198-2243):
```javascript
window.handleManualDispatch = async () => {
    // 解析对阵信息
    let newTask = { 
        id: customId, t1: t1Info.team, t1p1: ..., t1p2: ..., 
        t2: t2Info.team, t2p1: ..., t2p2: ..., 
        type: isDbl ? 'doubles' : 'singles', 
        format: 1, meth: 'rally', is_team: false 
    };
    await apiPost('set_bulk_tasks', { tasks: [newTask] });
};
```

**业务行为提取**：
- 手动创建比赛任务
- 解析选手/队伍信息
- 推送到裁判池
- 团体赛核碰下发

**领域事实所有者**：Match Operations / Scheduling

---

## 3. 所有权分类 (Ownership Classification)

### 3.1 领域事实所有者映射

| Master 行为 | 领域事实 | 所有者域 |
|-------------|----------|----------|
| 手动成绩录入 | MatchResult | **Competition Result Recording** |
| 任务分配 | MatchTask | **Match Operations** |
| 赛程导入 | MatchTask, TeamRoom | **Scheduling** |
| 裁判管理 | RefereeStatus | **Resource Management** |
| 场地管理 | CourtAssignment | **Resource Management** |
| 选手管理 | PlayerRegistration | **Registration** |
| 团体赛管理 | TeamRoom, TeamLineup | **Competition Configuration** |
| 赛事配置 | EventConfig | **Event Configuration** |
| 公告管理 | EventNotice | **Announcement** |

### 3.2 参与者/操作分类 (Actor/Action Only)

以下不是领域事实，而是参与者操作或应用层关注点：

| 行为 | 分类 | 说明 |
|------|------|------|
| 密码验证 | 权限 (Permission) | 应用层关注点 |
| 登录查看 | UI 操作 | 不创建领域事实 |
| 数据导出 | 操作命令 | 只读查询 |
| 界面导航 | UI 操作 | 前端关注点 |
| Excel 解析 | 操作命令 | 数据转换，不是领域事实 |

### 3.3 旧版实现细节 (Legacy Implementation Details)

| 类别 | 旧版实现 | 现代边界建议 |
|------|----------|--------------|
| 界面 | `master.html` 单页应用 | 不属于领域层 |
| API | `data.php` 单一路由 | 按领域拆分 |
| 存储 | MySQL KV 存储 (`nhpa_store`) | 按领域设计存储 |
| 认证 | 硬编码密码 | 应用层服务 |
| 权限 | 密码验证 | 应用层服务 |

---

## 4. 现代边界建议 (Modern Boundary Proposal)

### 4.1 Master 是什么？

**结论：Master 是操作角色 (Operational Role)，不是领域。**

| 分类 | 是否适用 | 理由 |
|------|----------|------|
| 领域 (Domain) | ❌ 否 | Master 不拥有独立的领域事实 |
| 参与者 (Actor) | ✅ 是 | Master 是执行操作的人 |
| 操作角色 (Operational Role) | ✅ 是 | Master 是赛事运营角色的集合 |
| 应用层关注点 | ✅ 部分 | 权限验证是应用层 |

### 4.2 Master 行为归属

```
Master (Actor/Role)
    │
    ├── 执行 ──→ Competition Result Recording (Domain)
    │              └── 手动成绩录入
    │
    ├── 执行 ──→ Match Operations (Domain)
    │              └── 任务分配、比赛派发
    │
    ├── 执行 ──→ Scheduling (Domain)
    │              └── 赛程导入、日程安排
    │
    ├── 执行 ──→ Resource Management (Domain)
    │              └── 裁判管理、场地管理
    │
    ├── 执行 ──→ Registration (Domain)
    │              └── 选手管理、队伍管理
    │
    └── 使用 ──→ Application Services
                   └── 权限验证、数据导出
```

### 4.3 设计原则

1. **Master 不是领域所有者**
   - Master 执行的每个操作都应该归属于相应的领域
   - 不存在 "Master 域" 拥有所有数据

2. **TOP 是领域事实系统，不是工作流引擎**
   - 不设计 Master 工作流
   - 不设计 Master 状态机
   - Master 只是触发领域事实创建的参与者

3. **权限是应用层关注点**
   - 不在领域层实现权限检查
   - 权限验证在应用服务层完成
   - 领域事实不关心"谁"创建，只关心"什么"被创建

4. **UI 不属于领域**
   - Master 界面是前端关注点
   - 领域层不关心展示逻辑

### 4.4 避免的设计

| 避免 | 原因 |
|------|------|
| Master 领域拥有所有数据 | 违反领域边界，Master 是角色不是领域 |
| Master 工作流引擎 | TOP 是领域事实系统，不是工作流引擎 |
| 权限系统实现 | 权限是应用层关注点，不是领域事实 |
| Master UI 设计 | UI 是前端关注点，不属于领域分析 |

---

## 5. 领域事实清单 (Domain Facts Inventory)

从 Master 操作中提取的领域事实：

| 领域事实 | 所属域 | 创建触发 | 关键字段 |
|----------|--------|----------|----------|
| MatchResult | Competition Result Recording | 手动录入/裁判提交 | id, t1, t2, score, winner, referee, time |
| MatchTask | Match Operations / Scheduling | 任务分配/赛程导入 | id, t1, t2, type, court, date |
| PlayerRegistration | Registration | 添加选手/导入名单 | id_code, name, team, group, checked_in |
| TeamRoom | Competition Configuration | 团体赛建房 | room_code, teams, status |
| TeamLineup | Competition Configuration | 领队提交排阵 | room_code, team_name, matches |
| RefereeStatus | Resource Management | 裁判登录/状态更新 | name, status, current_court, match_count |
| CourtAssignment | Resource Management | 场地分配 | court, match_id, referee |
| EventConfig | Event Configuration | 赛事创建/编辑 | event_name, courts, referee_password |
| EventNotice | Announcement | 发布公告 | text, image |

---

## 6. 总结

### Master 的本质

Master 在旧版系统中是一个"超级用户"角色，拥有赛事运营的所有操作权限。但从领域驱动设计的角度：

1. **Master 不是领域** - 它没有自己独立的领域事实
2. **Master 是参与者** - 它触发其他领域的操作
3. **Master 是操作角色** - 它是一组运营职责的集合
4. **Master 权限是应用层** - 权限验证不属于领域层

### 现代设计方向

- 将 Master 操作分解到各个领域的服务中
- Master 界面调用各领域服务完成操作
- 权限验证在应用服务层统一处理
- 领域层只关心领域事实的创建和查询

---

*文档版本: 1.0*  
*分析日期: 2026-07-31*  
*来源: Legacy/master.html, Legacy/data.php*