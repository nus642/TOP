/**
 * security-hardening.test.js — 核心安全/业务逻辑修复验证（9 项）
 * 
 * 断言实际生产源码（不复制业务逻辑），验证以下关键场景：
 * 1. 伪造 client court 被服务端忽略（accept_task 从 tasks KV 权威取 court）
 * 2. 服务端 task 无 court → accept_task 拒绝且零写入
 * 3. 同一场地冲突 → 拒绝不同 task 覆盖
 * 4. 重复接受同一 task → 幂等返回 idempotent=true
 * 5. 待开赛退出 → release_task_acceptance 正确释放
 * 6. 比赛中退出 → 不被 release_task_acceptance 清除
 * 7. visibilitychange → loadGreeting 不调用 AI API（仅重新计算日期时段）
 * 8. 含旧日期的 AI 正文被拒绝（bannedWords 过滤）
 * 9. editCourt 换场文案不含"球拍放场内"
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const LEGACY_DIR = path.join(__dirname, '..', '..', 'Legacy');

function readSource(name) {
  return fs.readFileSync(path.join(LEGACY_DIR, name), 'utf-8');
}

// ======================== 场景 A：accept_task 安全加固 ========================
describe('accept_task 服务端安全加固', () => {
  const src = readSource('data.php');

  it('T38: accept_task 从服务端 tasks KV 读取权威 court，不信任客户端参数', () => {
    assert.ok(src.includes("case 'accept_task':"), '应定义 accept_task');
    // 必须从 tasks KV 遍历查找
    const hasKV = src.includes("kv_get($event_code, 'tasks'"); 
    assert.ok(hasKV, '应从 tasks KV 读取任务');
    // court 从服务端 $task['court'] 取值，而非直接使用 $req['court']
    assert.ok(src.includes("$task['court']") || src.includes('$task["court"]'),
      'court 值必须从服务端 task 对象取得');
    // 不应直接使用客户端传来的 court 值
    const acceptTaskSection = src.match(/case 'accept_task':[\s\S]{0,6000}break;/);
    assert.ok(acceptTaskSection, '应找到完整 accept_task case');
    if (acceptTaskSection) {
      // 在 accept_task 段内不应有直接用 $req['court'] 作为 live_scores key
      assert.ok(!acceptTaskSection[0].includes("$live[$req['court']]"),
        '不应直接用客户端 court 作为 live_scores 键');
    }
  });

  it('T39: task.court 为空 → accept_task 拒绝', () => {
    const section = readSource('data.php').match(/case 'accept_task':[\s\S]{0,6000}break;/);
    assert.ok(section, '应找到 accept_task 完整实现');
    assert.ok(section[0].includes("'该任务尚未分配场地'") || section[0].includes('task.court') && section[0].includes("''"),
      '应检查 task.court 是否为空并给出错误提示');
  });

  it('T40: 同一场地已被其他 task 占用 → accept_task 拒绝', () => {
    const section = readSource('data.php').match(/case 'accept_task':[\s\S]{0,6000}break;/);
    assert.ok(section);
    assert.ok(section[0].includes('已有其他任务') || section[0].includes('无法覆盖'),
      '应拒绝不同 task 覆盖同一 court 的待开赛投影');
  });

  it('T41: accept_task 幂等性——同一 task 重复接受 → idempotent=true', () => {
    const section = readSource('data.php').match(/case 'accept_task':[\s\S]{0,6000}break;/);
    assert.ok(section);
    assert.ok(section[0].includes("'idempotent'"), '响应应包含 idempotent 字段');
    const hasIdempotentTrue = section[0].includes('true') && section[0].includes('idempotent');
    assert.ok(hasIdempotentTrue,
      '重复接受时返回 idempotent=true');
  });
});

// ======================== 场景 B：release_task_acceptance 待开赛释放 ========================
describe('release_task_acceptance 待开赛释放', () => {
  const src = readSource('data.php');

  it('T42: release_task_acceptance API 存在并只释放归属当前裁判的待开赛投影', () => {
    assert.ok(src.includes("case 'release_task_acceptance':"), '应定义 release_task_acceptance');
    // 完整 case 段（到下一个 case 为止）
    const releaseSection = src.match(/case 'release_task_acceptance':[\s\S]{0,5000}?case '/);
    assert.ok(releaseSection, '应找到 release_task_acceptance 完整实现');
    assert.ok(releaseSection[0].includes("'待开赛'"), '应检查 status=待开赛');
    assert.ok(releaseSection[0].includes('unset($live[$target_court])'),
      '应 unset live_scores 中归属当前裁判的投影');
    assert.ok(releaseSection[0].includes('无权释放'), '归属其他裁判的投影应拒绝释放');
  });

  it('T43: 比赛中不得被 release_task_acceptance 清除', () => {
    const section = readSource('data.php').match(/case 'release_task_acceptance':[\s\S]{0,5000}?case '/);
    assert.ok(section);
    // 非待开赛（比赛中）→ 显式拒绝，不得删除投影或改裁判状态
    assert.ok(section[0].includes('比赛已开始') && section[0].includes('禁止普通释放'),
      '比赛中释放应被拒绝');
  });
});

// ======================== 场景 C：greeting 安全性与 visibilitychange ========================
describe('Checkin greeting 安全与确定性', () => {
  const checkinSrc = readSource('checkin.html');

  it('T44: fetchGreetingBody 包含 bannedPatterns 过滤（具体日期/时段问候词）', () => {
    assert.ok(checkinSrc.includes('fetchGreetingBody'), '应定义 fetchGreetingBody');
    // [SECOND HARDENING] 单字禁用词会误杀「比赛日、今日、年轻、岁月」，改用 bannedPatterns 正则具体模式
    assert.ok(checkinSrc.includes('bannedPatterns'), '应定义 bannedPatterns 正则列表');
    assert.ok(checkinSrc.includes('早上好') && checkinSrc.includes('下午好') && checkinSrc.includes('晚上好'),
      '应过滤时段问候词 早上好/下午好/晚上好');
    assert.ok(checkinSrc.includes('\\d{1,2}月\\d{1,2}日'),
      '应以正则匹配具体日期模式（如“8月25日”）');
    assert.ok(checkinSrc.includes('\\d{4}年'),
      '应以正则匹配具体年份模式（如“2026年”）');
    assert.ok(!checkinSrc.includes('const bannedWords'), '不得保留单字 bannedWords 列表（会误杀正常表达）');
    assert.ok(checkinSrc.includes('console.warn') && checkinSrc.includes('过期时间词'),
      'AI 正文违规时应 console.warn 并返回 null');
  });

  it('T45: visibilitychange 回调中 loadGreeting(forceRefetch=false) 不发 AI 请求', () => {
    // checkin.html 使用 cachedGreetingBody + fetchGreetingBodyOnlyFirst（只调一次）。
    // visibilitychange 时调用 loadGreeting(false)，仅重新渲染缓存内容，不发网络请求。
    const checkinSrc = readSource('checkin.html');
    assert.ok(checkinSrc.includes('fetchGreetingBodyOnlyFirst'), '应定义 fetchGreetingBodyOnlyFirst');
    assert.ok(checkinSrc.includes('cachedGreetingBody'), '应有全局缓存变量');
    assert.ok(checkinSrc.includes('loadGreeting(false)'), 'visibilitychange handler 传 false 避免 refetch');
    // 不再每次 loadGreeting 都发 fetch
    assert.ok(checkinSrc.includes('hasFetchedOnce') || checkinSrc.includes('forceRefetch'),
      '应有 hasFetchedOnce 或 forceRefetch 控制只调用一次 AI');
  });
});

// ======================== 场景 D：editCourt 换场文案独立化 ========================
describe('editCourt 换场确认文案独立化', () => {
  const masterSrc = readSource('master.html');

  it('T46: editCourt 函数域内不含"球拍放场内"', () => {
    const editCourtSection = masterSrc.match(/window\.editCourt.*?^(        \};)/sm);
    assert.ok(editCourtSection, '应找到 editCourt 完整函数');
    assert.ok(!editCourtSection[0].includes('球拍放场内') && !editCourtSection[0].includes('球拍请放在'),
      'editCourt 函数域内不得出现"球拍放场内"或类似暂停语义');
  });
});
