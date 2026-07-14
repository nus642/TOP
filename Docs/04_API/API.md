# TOP API Documentation

Version: 1.0

Status: Draft

Last Update: 2026-07-08

Author:
Paul Wu + ChatGPT

---

# API Index

| ID | Method | Endpoint | Description |
|----|--------|----------|-------------|
| API-001 | POST | /api/save | 保存赛程 |

---

# API-001 Save Schedule API

## Endpoint

POST /api/save

### Purpose

保存赛事赛程。

用于：

- 保存系统生成的比赛安排
- 保存转转赛生成结果
- 保存固定搭档赛程
- 更新当前赛事比赛数据

---

### Request

**Method**

```
POST
```

**URL**

```
/api/save
```

**Content-Type**

```
application/json
```

---

### Request Body

```json
{
  "players": [],
  "rounds": [],
  "mode": "round-robin",
  "target": 4,
  "courtNames": [],
  "tournamentName": "赛事活动"
}
```

---

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| players | Array | 球员信息 |
| rounds | Array | 比赛轮次 |
| mode | String | 比赛模式 |
| target | Number | 每人目标场数 |
| courtNames | Array | 球场名称 |
| tournamentName | String | 赛事名称 |

---

### Response

#### Success

```json
{
  "success": true
}
```

#### Failure

```json
{
  "error": "保存赛程失败"
}
```

---

### Related

**Frontend**

- handleStart()

**Backend**

- server.js
- POST /api/save

**Database**

- tournaments
- matches
- players

---

### Design Notes

该接口一次性保存完整赛程，而不是逐场保存。

原因：

- 保证生成赛程的完整性。
- 避免部分保存导致数据不一致。
- 后续支持更多赛制（如团队追逐赛、双阶段转转赛）时，只需扩展 rounds 数据结构，而无需修改接口。

---

### Revision History

| Version | Date | Description |
|---|---|---|
| 1.0 | 2026-07-08 | Initial API documentation |