# Organizer Manual

Version: 1.0

Status: Draft

Task: TASK-DOC-002

---

## Purpose

This manual helps tournament organizers plan, run, monitor, and close a TOP-supported tournament. It focuses on operational decisions, participant coordination, schedule control, referee coordination, and post-event wrap-up.

---

## Organizer Responsibilities

| Area | Responsibility |
| --- | --- |
| Tournament setup | Define tournament name, format, divisions, schedule expectations, and operational rules. |
| Participant management | Confirm registrations, eligibility, check-in status, and withdrawals. |
| Schedule management | Publish assignments, monitor progress, and adjust matches when operational issues occur. |
| Referee coordination | Assign referees, communicate procedures, and receive escalations. |
| Result control | Confirm score submission procedures and resolve disputed or incorrect results. |
| Event closure | Validate final standings, communicate results, and archive key notes. |

---

## Planning Before the Event

1. Define the competition format and participant categories.
2. Confirm venue capacity, match locations, equipment, and staffing.
3. Publish rules, schedule expectations, and escalation procedures.
4. Prepare referee assignments and score submission instructions.
5. Establish the official communication channel for participants and staff.

---

## Tournament Setup Checklist

- [ ] Tournament format confirmed.
- [ ] Divisions or brackets defined.
- [ ] Player or team list reviewed.
- [ ] Match locations prepared.
- [ ] Referee assignments prepared.
- [ ] Score reporting process communicated.
- [ ] Dispute escalation path communicated.

---

## Running the Tournament

During live operations, organizers should continuously monitor:

| Monitor | What to Check |
| --- | --- |
| Match progress | Matches started, delayed, completed, or blocked. |
| Score flow | Results submitted promptly and accurately. |
| Referee coverage | Referees assigned to active matches and available for escalation. |
| Participant readiness | Players or teams present for upcoming matches. |
| Venue conditions | Equipment, safety, and location availability. |

---

## Schedule Adjustments

When a schedule change is required:

1. Identify the affected match, participants, referee, and location.
2. Confirm whether the change affects downstream matches.
3. Communicate the change to all affected parties.
4. Record the reason for the adjustment.
5. Verify that the updated schedule is visible to staff and participants.

Avoid informal changes that are not recorded, because they can create score, assignment, or participant confusion.

---

## Score and Result Control

Organizers are responsible for maintaining the official result record.

Recommended process:

1. Require referees or authorized staff to confirm final scores before submission.
2. Review flagged, disputed, or corrected scores promptly.
3. Confirm winner and score order before publishing standings or next matches.
4. Keep notes for manual corrections and organizer decisions.

---

## Handling Escalations

| Escalation | Organizer Response |
| --- | --- |
| Player no-show | Apply published no-show policy and document the decision. |
| Score dispute | Review referee notes, player statements, and tournament rules. |
| Venue issue | Move, pause, or reschedule affected matches as needed. |
| Conduct issue | Apply event policy and preserve incident notes. |
| Technical issue | Record the expected correction and verify the official state after correction. |

---

## Closing the Event

Before closing the tournament:

- Confirm all matches are completed or officially resolved.
- Validate final standings and awards.
- Communicate official results.
- Collect referee and staff notes.
- Record operational lessons for future events.

---

## Post-Event Review

After the event, organizers should review:

- Schedule delays and causes.
- Disputes and how they were resolved.
- Score correction frequency.
- Referee coverage gaps.
- Participant communication issues.
- Improvements needed in tournament setup or documentation.

---

## Match-Day Quick Card（赛日快速卡 · 主控）

适用首场赛事：25 对选手 / 60 场 / 6 片场地 / 6 位裁判，访问 `http://服务器IP:3000`。

### 开机流程（Master）

1. 手机/电脑浏览器打开 `http://服务器IP:3000/operator/master.html`，按提示建立主控身份。
2. 输入赛事编号，点击“打开主控工作台”。
3. 赛前：赛程管理面板 → 粘贴外部平台对阵表 JSON 执行导入；需要微调时用“新增单场比赛”或比赛卡片上的“编辑/删除”（仅限未派单的比赛）。
4. 点击“一键签到全部选手”（跳过免责声明，可重复执行，幂等）。
5. 登记裁判花名册（6 人）后开始派单。

### 执裁循环（每场比赛）

派单（选裁判）→ 等待裁判接单 → 裁判开赛/记分 → 赛果提交后点击“确认已提交赛果”。
同时最多 6 场在赛，每片场地一名裁判。

### 故障应对

| 故障 | 处理 |
| --- | --- |
| 派单后裁判迟迟不接单 | 卡片上“撤回”，然后重新“派单”给其他裁判（换派亦可）。 |
| 服务器重启 / 页面提示登录失效 | 重新打开工作台页面重建身份；比赛数据在数据库中不丢失；重跑“一键签到全部选手”；通知 6 位裁判重新进入工作台。 |
| 导入失败 | 按面板中逐行错误提示修正 JSON 后重新导入（导入仅在 draft 且无已执行比赛时允许，整表替换）。 |
| 单场场地/时间需临时调整 | 比赛卡片“编辑”（仅 idle/upcoming 状态），系统自动校验场地-时间冲突。 |

### 赛后

全部确认完成后手动执行一次数据库备份（见 `Modern/docs/deployment.md` 第 6 节），并导出成绩留档。

