Issue 2：签到

目前：

Player

↓

checked = true

这是：

一次签到。

实际上应该：

Check-in Records

例如：

Player

↓

CheckIn

时间

地点

类型

状态

于是：

一天赛事：

上午签到

↓

下午签到

↓

淘汰赛签到

↓

领奖签到

全部成立。

甚至：

未来：

教练签到

工作人员签到

媒体签到

全部共用。

所以：

这也是：

Architecture Issue

Chatgpt:

⭐ 我认为是 P2（高优先级）。

为什么不是 P1？

因为当前签到流程还能工作。

但是在系统设计时，要避免把签到做成：

player.checked = true

而应该是：

CheckIn Record

这样扩展性会好得多。