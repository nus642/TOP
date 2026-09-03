<?php
/**
 * Pickle球 赛事数字枢纽 - 核心数据总线 (V9.1 风险告知书管理版)
 */

$db_host = getenv('MYSQL_HOST') ?: 'mysql';   // 容器内用服务名 'mysql'
$db_port = getenv('MYSQL_PORT') ?: '3306';
$db_name = getenv('MYSQL_DB') ?: 'nhpa';       // 你的数据库名，与 docker-compose 中 MYSQL_DATABASE 一致（但你写的是 backup，需确认）
$db_user = getenv('MYSQL_USER') ?: 'root';
$db_pass = getenv('MYSQL_PASS') ?: '';   // 与 docker-compose 里的 root 密码一致

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit(0);

try {
    $pdo = new PDO("mysql:host=$db_host;port=$db_port;charset=utf8mb4", $db_user, $db_pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db_name` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$db_name`");
    $pdo->exec("CREATE TABLE IF NOT EXISTS nhpa_store (id INT AUTO_INCREMENT PRIMARY KEY, event_code VARCHAR(50) NOT NULL, data_key VARCHAR(50) NOT NULL, data_value LONGTEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY unique_event_key (event_code, data_key)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    // 升级 waiver 表添加 waiver_text 字段
    $pdo->exec("CREATE TABLE IF NOT EXISTS nhpa_waivers (id INT AUTO_INCREMENT PRIMARY KEY, event_code VARCHAR(50) NOT NULL, player_name VARCHAR(100) NOT NULL, id_last4 VARCHAR(10) NOT NULL, signature LONGTEXT NOT NULL, waiver_text LONGTEXT DEFAULT NULL, sign_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
    // 兼容已有表添加字段
    try {
        $pdo->exec("ALTER TABLE nhpa_waivers ADD COLUMN waiver_text LONGTEXT DEFAULT NULL");
    } catch(PDOException $e) {
        // 字段可能已存在
    }
} catch (PDOException $e) { echo json_encode(['status' => 'error', 'message' => '数据库连接失败']); exit; }

function kv_get($event, $key, $default = []) {
    global $pdo; $stmt = $pdo->prepare("SELECT data_value FROM nhpa_store WHERE event_code = ? AND data_key = ?");
    $stmt->execute([$event, $key]); $res = $stmt->fetchColumn(); if ($res === false) return $default;
    $decoded = json_decode($res, true); return (json_last_error() === JSON_ERROR_NONE && (is_array($decoded) || is_object($decoded))) ? $decoded : $res;
}
function kv_set($event, $key, $value) {
    global $pdo;
    $valStr = is_string($value) ? $value : json_encode($value, JSON_UNESCAPED_UNICODE);
    $stmt = $pdo->prepare("INSERT INTO nhpa_store (event_code, data_key, data_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data_value = ?");
    $stmt->execute([$event, $key, $valStr, $valStr]);
}
function normalizeId($id) { return strtoupper(trim(preg_replace('/\s+/', '', $id))); }

function is_super_admin_authorized($provided) {
    $configured = getenv('SUPER_ADMIN_PWD');
    return is_string($configured) && $configured !== '' && is_string($provided) && hash_equals($configured, $provided);
}

function lock_event_for_update($pdo, $event_code) {
    $stmt = $pdo->prepare("SELECT data_value FROM nhpa_store WHERE event_code = ? AND data_key = 'config' FOR UPDATE");
    $stmt->execute([$event_code]);
    return $stmt->fetchColumn() !== false;
}

function is_ownership_projection($info) {
    return in_array($info['status'] ?? '', ['待开赛', '比赛中'], true);
}

function projection_for_match($live, $match_id) {
    foreach ($live as $court => $info) {
        if (is_ownership_projection($info) && normalizeId($info['match_id'] ?? '') === $match_id) return $info;
    }
    return null;
}

function referee_owns_projection($live, $referee_id, $status = null) {
    foreach ($live as $info) {
        if (!is_ownership_projection($info) || normalizeId($info['referee'] ?? '') !== $referee_id) continue;
        if ($status === null || ($info['status'] ?? '') === $status) return true;
    }
    return false;
}

function recovery_find_state($tasks, $live, $refs, $records, $match_id) {
    $task_matches = []; $projection_matches = []; $referee_matches = []; $conflicts = [];
    foreach ($tasks as $key => $candidate) if (normalizeId($candidate['id'] ?? $key) === $match_id) $task_matches[] = ['key'=>$key, 'value'=>$candidate];
    foreach ($live as $key => $candidate) if (normalizeId($candidate['match_id'] ?? '') === $match_id) $projection_matches[] = ['court'=>(string)$key, 'value'=>$candidate];
    if (count($task_matches) > 1) $conflicts[] = '同一比赛ID匹配多个 task';
    if (count($projection_matches) > 1) $conflicts[] = '同一比赛存在多个实时投影';
    $task = count($task_matches) === 1 ? $task_matches[0]['value'] : null;
    $task_key = count($task_matches) === 1 ? $task_matches[0]['key'] : null;
    $projection = count($projection_matches) === 1 ? $projection_matches[0]['value'] : null;
    $court = count($projection_matches) === 1 ? $projection_matches[0]['court'] : null;
    if ($court === null && $task !== null) $court = trim((string)($task['court'] ?? ''));
    $owners = [];
    foreach ($projection_matches as $match) { $candidate_owner = normalizeId($match['value']['referee'] ?? ''); if ($candidate_owner !== '') $owners[$candidate_owner] = true; }
    $owner = count($owners) === 1 ? array_key_first($owners) : '';
    foreach ($refs as $key => $candidate) if ($owner !== '' && normalizeId($candidate['name'] ?? '') === $owner) $referee_matches[] = ['key'=>$key, 'value'=>$candidate];
    if (count($owners) > 1) $conflicts[] = '实时投影对应多个 owner/referee';
    if ($projection !== null && $owner === '') $conflicts[] = '实时投影缺少 owner/referee';
    if (count($referee_matches) > 1) $conflicts[] = 'owner 对应多个 referee';
    if ($projection !== null && $owner !== '' && count($referee_matches) === 0) $conflicts[] = 'owner/referee 在赛事中不存在';
    if ($task !== null && $projection !== null && (string)($task['court'] ?? '') !== (string)$court) $conflicts[] = 'task 与实时投影场地不一致';
    $referee = count($referee_matches) === 1 ? $referee_matches[0]['value'] : null;
    $matching_records = [];
    foreach ($records as $record) if (normalizeId($record['id'] ?? '') === $match_id) $matching_records[] = [
        'id' => $record['id'] ?? '', 'court' => $record['court'] ?? '', 'time' => $record['time'] ?? ''
    ];
    return compact('task', 'task_key', 'court', 'projection', 'referee', 'matching_records', 'task_matches', 'projection_matches', 'referee_matches', 'conflicts') + ['corrupted'=>count($conflicts) > 0];
}

function recovery_summary($state) {
    return [
        'task' => $state['task'] === null ? null : [
            'id' => $state['task']['id'] ?? $state['task_key'], 'court' => $state['task']['court'] ?? '',
            'status' => $state['task']['status'] ?? '', 'live_score' => $state['task']['live_score'] ?? null,
        ],
        'projection' => $state['projection'] === null ? null : [
            'match_id' => $state['projection']['match_id'] ?? '', 'court' => $state['court'],
            'status' => $state['projection']['status'] ?? '', 'referee' => $state['projection']['referee'] ?? '',
            'score' => $state['projection']['score'] ?? '',
        ],
        'referee' => $state['referee'] === null ? null : [
            'name' => $state['referee']['name'] ?? '', 'status' => $state['referee']['status'] ?? '',
            'current_court' => $state['referee']['current_court'] ?? '',
        ],
        'records' => $state['matching_records'],
        'corrupted' => $state['corrupted'], 'conflicts' => $state['conflicts'],
        'match_counts' => ['tasks'=>count($state['task_matches']), 'projections'=>count($state['projection_matches']), 'referees'=>count($state['referee_matches'])],
    ];
}

function recovery_expected_error($req, $match_id, $state) {
    if (normalizeId($req['expected_match_id'] ?? '') !== $match_id) return '预期比赛不匹配，请刷新恢复预览';
    if ((string)($req['expected_court'] ?? '') !== (string)($state['court'] ?? '')) return '预期场地已变化，请刷新恢复预览';
    if (normalizeId($req['expected_referee'] ?? '') !== normalizeId($state['projection']['referee'] ?? '')) return '预期裁判已变化，请刷新恢复预览';
    if (($req['expected_status'] ?? '') !== ($state['projection']['status'] ?? '')) return '预期状态已变化，请刷新恢复预览';
    return null;
}

function recovery_audit_existing($audit, $request_id, $action, $match_id) {
    foreach ($audit as $entry) if (($entry['request_id'] ?? '') === $request_id) {
        return (($entry['action'] ?? '') === $action && normalizeId($entry['match_id'] ?? '') === $match_id) ? $entry : false;
    }
    return null;
}

function recovery_audit_entry($event_code, $match_id, $action, $req, $before, $after) {
    return [
        'event_code' => $event_code, 'match_id' => $match_id, 'action' => $action,
        'operator' => 'Master',
        'reason' => trim((string)($req['reason'] ?? '')), 'time' => date('Y-m-d H:i:s'),
        'expected' => [
            'match_id' => $req['expected_match_id'] ?? '', 'court' => $req['expected_court'] ?? '',
            'referee' => $req['expected_referee'] ?? '', 'status' => $req['expected_status'] ?? '',
        ],
        'before' => $before, 'after' => $after, 'request_id' => trim((string)($req['request_id'] ?? '')),
    ];
}

function recovery_password($req) { return $req['password'] ?? $req['pwd'] ?? $_GET['password'] ?? $_GET['pwd'] ?? ''; }

function has_full_recovery_payload($req) {
    foreach (['request_id','reason','expected_match_id','expected_court','expected_referee','expected_status'] as $field) if (!array_key_exists($field, $req)) return false;
    return true;
}

function check_referee_pwd($pdo, $event_code, $pwd) {
    $conf = kv_get($event_code, 'config');
    return isset($conf['referee_password']) && $conf['referee_password'] === $pwd;
}

$req = json_decode(file_get_contents('php://input'), true);
$action = $req['action'] ?? $_GET['action'] ?? '';
$event_code = $req['event_code'] ?? $_GET['event_code'] ?? '';

$global_actions = ['create_event', 'get_sys_data', 'save_sys_data', 'get_all_events_public', 'super_admin_get_events', 'super_admin_delete_event'];

if (!$event_code && !in_array($action, $global_actions)) { echo json_encode(['status' => 'error', 'message' => '缺少赛事验证码']); exit; }

if ($action === 'get_all_events_public') {
    $stmt = $pdo->query("SELECT event_code, data_value FROM nhpa_store WHERE data_key = 'config'");
    $events = [];
    while ($row = $stmt->fetch()) {
        $conf = json_decode($row['data_value'], true);
        if(is_array($conf)) $events[] = ['code' => $row['event_code'], 'name' => $conf['event_name'] ?? '未命名赛事'];
    }
    echo json_encode(['status' => 'success', 'data' => $events]); exit;
}

if ($action === 'super_admin_get_events') {
    if (!is_super_admin_authorized($req['super_pwd'] ?? '')) { echo json_encode(['status' => 'error', 'message' => '超管鉴权失败']); exit; }
    $stmt = $pdo->query("SELECT event_code, data_value, updated_at FROM nhpa_store WHERE data_key = 'config' ORDER BY updated_at DESC");
    $events = [];
    while ($row = $stmt->fetch()) {
        $conf = json_decode($row['data_value'], true);
        if(is_array($conf)) {
            $events[] = ['code' => $row['event_code'], 'name' => $conf['event_name'] ?? '未命名', 'pwd' => $conf['referee_password'] ?? '', 'type' => $conf['event_type'] ?? 'ind','days' => $conf['event_days'] ?? 1,'time' => $row['updated_at']];
        }
    }
    echo json_encode(['status' => 'success', 'data' => $events]); exit;
}

if ($action === 'super_admin_delete_event') {
    if (!is_super_admin_authorized($req['super_pwd'] ?? '')) { echo json_encode(['status' => 'error', 'message' => '超管鉴权失败']); exit; }
    $delCode = $req['target_code'];
    $pdo->prepare("DELETE FROM nhpa_store WHERE event_code = ?")->execute([$delCode]);
    $pdo->prepare("DELETE FROM nhpa_waivers WHERE event_code = ?")->execute([$delCode]);
    echo json_encode(['status' => 'success']); exit;
}

if ($action === 'create_event') {
    if (!is_super_admin_authorized($req['super_pwd'] ?? '')) { echo json_encode(['status' => 'error', 'message' => '无权创建']); exit; }
    $code = $req['custom_code'] ?? 'PICKLE' . rand(1000, 9999);
    $stmt = $pdo->prepare("SELECT 1 FROM nhpa_store WHERE event_code = ? LIMIT 1"); $stmt->execute([$code]);
    if ($stmt->fetchColumn()) { echo json_encode(['status' => 'error', 'message' => "赛事码 {$code} 已存在"]); exit; }

    $config = ['event_name' => $req['event_name'], 'event_type' => $req['event_type'] ?? 'ind', 'courts' => $req['courts'] ?? ['1', '2', '3', '4'], 'referee_password' => $req['referee_password'], 'created_at' => date('Y-m-d H:i:s'), 'waiver_text' => ''];
    kv_set($code, 'config', $config); kv_set($code, 'players', []); kv_set($code, 'tasks', []); kv_set($code, 'records', []); kv_set($code, 'lineups', []); kv_set($code, 'referees', []); kv_set($code, 'team_event', []); kv_set($code, 'team_lineups', []); kv_set($code, 'team_template', []);
    kv_set($code, 'event_notice', [['text' => 'Pickle球-无纸化裁判协作，全面适配网球记', 'image' => '']]);
    echo json_encode(['status' => 'success', 'event_code' => $code]); exit;
}

switch ($action) {
    case 'get_event_config': echo json_encode(['status' => 'success', 'data' => kv_get($event_code, 'config')]); break;

	case 'sync_team_player_ids':
    $room_code = normalizeId($req['room_code'] ?? '');
    $team_name = $req['team_name'] ?? '';
    $team_code = trim($req['team_code'] ?? '');
    if (!$room_code || !$team_name || !$team_code) {
        echo json_encode(['status' => 'error', 'message' => '缺少必要参数']);
        break;
    }

    // 获取队伍在房间中的组别信息
    $team_event = kv_get($event_code, 'team_event', []);
    $group = '未知组别';
    if (isset($team_event[$room_code])) {
        foreach ($team_event[$room_code]['teams'] as $t) {
            if ($t['team_name'] === $team_name) {
                $group = $t['group'] ?? '未知组别';
                break;
            }
        }
    }

    $players = kv_get($event_code, 'players', []);
    $counter = 1;
    $updated = 0;
    foreach ($players as &$p) {
        if ($p['team'] === $team_name && ($p['group'] ?? '未知组别') === $group) {
            $p['id_code'] = $team_code . '-' . str_pad($counter++, 2, '0', STR_PAD_LEFT);
            $updated++;
        }
    }
    if ($updated === 0) {
        // 降级：仅匹配队名
        $counter = 1;
        foreach ($players as &$p) {
            if ($p['team'] === $team_name) {
                $p['id_code'] = $team_code . '-' . str_pad($counter++, 2, '0', STR_PAD_LEFT);
                $updated++;
            }
        }
    }
    kv_set($event_code, 'players', $players);
    echo json_encode(['status' => 'success', 'updated' => $updated]);
    break;

	case 'ai_generate_greeting':
    $notices = kv_get($event_code, 'event_notice', []);
    $customTexts = [];
    foreach ($notices as $n) {
        if (!isset($n['fixed']) && !empty($n['text'])) {
            $customTexts[] = $n['text'];
        }
    }
    $hasNotice = !empty($customTexts);
    $noticeText = $hasNotice ? implode(' | ', $customTexts) : '';

    // 从环境变量读取 DeepSeek API Key
    $apiKey = getenv('DEEPSEEK_API_KEY') ?: 'sk-你的备用Key（仅测试用）';
    if (empty($apiKey) || $apiKey === 'sk-你的备用Key（仅测试用）') {
        // [Checkin FIXUP] 若无 AI Key，仅返回公告聚合文本；日期和时段由前端 JS 按 Asia/Shanghai 计算。
        echo json_encode(['status' => 'success', 'greeting_body' => '', 'notice' => $noticeText, 'timezone' => 'Asia/Shanghai']);
        break;
    }

    // [Checkin FIXUP] AI prompt 不包含具体日期和时段问候——避免跨日过期。
    $prompt = $hasNotice
        ? "以下是赛事公告内容：\"$noticeText\"。请根据这些公告内容，生成一段热情洋溢的赛场欢迎语或提示语，语气亲切，以'小P说'开头，不超过60字。不要包含具体日期或早上/下午/晚上等易过时的时间词。"
        : "请生成一段热情洋溢的赛场欢迎语，包含对选手的鼓励，以'小P说'开头，不超过60字。不要包含具体日期或早上/下午/晚上等易过时的时间词。";

    $ch = curl_init('https://api.deepseek.com/v1/chat/completions');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'model' => 'deepseek-chat',
        'messages' => [
            ['role' => 'system', 'content' => '你是一个体育赛事的热情主持人，擅长用简短有力的语言鼓舞选手。'],
            ['role' => 'user', 'content' => $prompt]
        ],
        'max_tokens' => 100,
        'temperature' => 0.8
    ]));
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 200) {
        $result = json_decode($response, true);
        $greetingBody = $result['choices'][0]['message']['content'] ?? '';
    } else {
        $greetingBody = '';
    }

    // [Checkin FIXUP] AI 失败时返回空正文而非带日期的降级文本。
    if (empty($greetingBody)) {
        $greetingBody = '';
    }

    echo json_encode(['status' => 'success', 'greeting_body' => $greetingBody, 'notice' => $noticeText, 'timezone' => 'Asia/Shanghai']);
    break;

	case 'update_task_date':
    $match_id = normalizeId($req['match_id'] ?? '');
    $new_date = trim($req['date'] ?? '');
    if (!$match_id || !$new_date) {
        echo json_encode(['status' => 'error', 'message' => '缺少比赛ID或日期']);
        break;
    }
    $tasks = kv_get($event_code, 'tasks', []);
    $found = false;
    foreach ($tasks as $key => &$task) {
        if (normalizeId($key) === $match_id) {
            $task['date'] = $new_date;
            $found = true;
            break;
        }
    }
    if (!$found) {
        echo json_encode(['status' => 'error', 'message' => '未找到该比赛']);
        break;
    }
    kv_set($event_code, 'tasks', $tasks);
    echo json_encode(['status' => 'success']);
    break;

	case 'clear_all_team_rooms':
    $conf = kv_get($event_code, 'config');
    if (($req['password'] ?? '') !== ($conf['referee_password'] ?? '')) {
        echo json_encode(['status' => 'error', 'message' => '权限不足']);
        break;
    }
    kv_set($event_code, 'team_event', []);
    kv_set($event_code, 'team_lineups', []);
    echo json_encode(['status' => 'success']);
    break;

	case 'update_event_config':
    // 验证超管密码
    if (!is_super_admin_authorized($req['super_pwd'] ?? '')) {
        echo json_encode(['status' => 'error', 'message' => '超管鉴权失败']);
        break;
    }
    $target_code = $req['target_code'] ?? '';
    if (!$target_code) {
        echo json_encode(['status' => 'error', 'message' => '缺少赛事码']);
        break;
    }
    $config = kv_get($target_code, 'config');
    if (!$config) {
        echo json_encode(['status' => 'error', 'message' => '赛事不存在']);
        break;
    }
    // 允许修改的字段
    if (isset($req['event_name'])) $config['event_name'] = trim($req['event_name']);
    if (isset($req['event_days'])) $config['event_days'] = intval($req['event_days']);
    if (isset($req['referee_password'])) $config['referee_password'] = trim($req['referee_password']);
    // 可选：修改场地（如果需要）
    if (isset($req['courts'])) $config['courts'] = $req['courts']; // 数组
    kv_set($target_code, 'config', $config);
    echo json_encode(['status' => 'success', 'data' => $config]);
    break;

	case 'update_event_code':
    if (!is_super_admin_authorized($req['super_pwd'] ?? '')) {
        echo json_encode(['status' => 'error', 'message' => '超管鉴权失败']);
        break;
    }
    $old_code = $req['old_code'] ?? '';
    $new_code = strtoupper(trim($req['new_code'] ?? ''));
    if (!$old_code || !$new_code) {
        echo json_encode(['status' => 'error', 'message' => '缺少赛事码']);
        break;
    }
    if ($old_code === $new_code) {
        echo json_encode(['status' => 'error', 'message' => '新码与旧码相同']);
        break;
    }
    // 检查新码是否已被占用
    $stmt = $pdo->prepare("SELECT 1 FROM nhpa_store WHERE event_code = ? LIMIT 1");
    $stmt->execute([$new_code]);
    if ($stmt->fetchColumn()) {
        echo json_encode(['status' => 'error', 'message' => '赛事码已存在']);
        break;
    }
    // 迁移所有数据（nhpa_store 和 nhpa_waivers）
    $pdo->beginTransaction();
    try {
        // 复制所有 store 记录
        $stmt = $pdo->prepare("SELECT data_key, data_value FROM nhpa_store WHERE event_code = ?");
        $stmt->execute([$old_code]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $row) {
            $stmt2 = $pdo->prepare("INSERT INTO nhpa_store (event_code, data_key, data_value) VALUES (?, ?, ?)");
            $stmt2->execute([$new_code, $row['data_key'], $row['data_value']]);
        }
        // 复制 waivers
        $stmt = $pdo->prepare("SELECT player_name, id_last4, signature, waiver_text, sign_time FROM nhpa_waivers WHERE event_code = ?");
        $stmt->execute([$old_code]);
        $waivers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($waivers as $w) {
            $stmt2 = $pdo->prepare("INSERT INTO nhpa_waivers (event_code, player_name, id_last4, signature, waiver_text, sign_time) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt2->execute([$new_code, $w['player_name'], $w['id_last4'], $w['signature'], $w['waiver_text'], $w['sign_time']]);
        }
        // 删除旧数据
        $pdo->prepare("DELETE FROM nhpa_store WHERE event_code = ?")->execute([$old_code]);
        $pdo->prepare("DELETE FROM nhpa_waivers WHERE event_code = ?")->execute([$old_code]);
        $pdo->commit();
        echo json_encode(['status' => 'success', 'new_code' => $new_code]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(['status' => 'error', 'message' => '迁移失败：' . $e->getMessage()]);
    }
    break;

	case 'get_live_scoreboard':
    $match_id = $_GET['match_id'] ?? '';
    if (!$match_id) {
        echo json_encode(['status' => 'error', 'message' => '缺少 match_id']);
        break;
    }

    // 从 tasks 中查找该比赛
    $tasks = kv_get($event_code, 'tasks', []);
    $match = null;
    foreach ($tasks as $id => $task) {
        if (normalizeId($id) === normalizeId($match_id)) {
            $match = $task;
            break;
        }
    }

    if (!$match) {
        echo json_encode(['status' => 'success', 'data' => null]);
        break;
    }

    // 解析比分（假设格式为 "21-15" 或 "G2 11-8"）
    $score = $match['live_score'] ?? '0-0';
    $parts = explode('-', preg_replace('/[^0-9-]/', '', $score));
    $t1_score = isset($parts[0]) ? intval($parts[0]) : 0;
    $t2_score = isset($parts[1]) ? intval($parts[1]) : 0;

    // 从 match 中提取局分、盘分（需在 referee.html 保存时一并存储）
    // 如果没有单独存储，可简单返回 0
    $response = [
        't1' => $match['t1'] ?? '左队',
        't2' => $match['t2'] ?? '右队',
        't1_score' => $t1_score,
        't2_score' => $t2_score,
        't1_games' => $match['t1_games'] ?? 0,
        't2_games' => $match['t2_games'] ?? 0,
        't1_sets' => $match['t1_sets'] ?? 0,
        't2_sets' => $match['t2_sets'] ?? 0,
        'serve_team' => $match['serve_team'] ?? 0,
        'serve_num' => $match['serve_num'] ?? 1,
        'status' => $match['status'] ?? '待开始',
        'match_name' => $match['match_name'] ?? ($match['t1'] ?? '') . ' vs ' . ($match['t2'] ?? '')
    ];

    echo json_encode(['status' => 'success', 'data' => $response]);
    break;

    case 'referee_login':
        $conf = kv_get($event_code, 'config'); if (empty($conf) || $conf['referee_password'] !== $req['password']) { echo json_encode(['status' => 'error', 'message' => '密码错误']); exit; }
        $refs = kv_get($event_code, 'referees', []); $name = $req['name']; $found = false;
        foreach ($refs as &$r) { if ($r['name'] === $name) { $r['last_login'] = date('Y-m-d H:i:s'); $found = true; break; } }
        if (!$found) $refs[] = ['name' => $name, 'status' => '空闲', 'current_court' => '', 'match_count' => 0, 'comment' => '', 'last_login' => date('Y-m-d H:i:s')];
        kv_set($event_code, 'referees', $refs); echo json_encode(['status' => 'success', 'referee_id' => $name, 'name' => $name]); break;

    case 'get_full_dashboard':
        $res = ['status' => 'success', 'tasks' => kv_get($event_code, 'tasks', []), 'records' => array_reverse(kv_get($event_code, 'records', [])), 'team_lineups' => kv_get($event_code, 'team_lineups', []), 'team_event' => kv_get($event_code, 'team_event', []), 'courts' => []];
        $conf = kv_get($event_code, 'config', []); $courts = $conf['courts'] ?? []; $refs = kv_get($event_code, 'referees', []); $live = kv_get($event_code, 'live_scores', []);
        foreach ($courts as $c) $res['courts'][$c] = ['status' => '空闲', 'referee' => '', 'score' => '', 'match_name' => '', 'match_id' => ''];
        foreach ($refs as $r) {
            if ($r['status'] === '执裁中' && !empty($r['current_court']) && isset($res['courts'][$r['current_court']])) {
                $res['courts'][$r['current_court']]['status'] = '比赛中'; $res['courts'][$r['current_court']]['referee'] = $r['name'];
                if (isset($live[$r['current_court']])) { $res['courts'][$r['current_court']]['score'] = $live[$r['current_court']]['score']; $res['courts'][$r['current_court']]['match_name'] = $live[$r['current_court']]['match_name']; $res['courts'][$r['current_court']]['match_id'] = $live[$r['current_court']]['match_id']; }
            }
        }
        // P1-2：以 task id/court 为唯一关联，将活动比赛投影到对应场地卡片（不建立第二套状态）。
        // 比分来自 tasks[].live_score（referee sync_live_score 实时写入）；
        // 完赛后 save_score 删除 task，投影自动消失，场地恢复空闲不残留。
        // [P1-2 FIXUP] 扩展 status='待开赛' 覆盖：accept_task 写入 live_scores 后 Master 可提前显示真实队名。
        // 镜像测试：Tools/legacy-live-record-visibility/court-projection-logic.js
        foreach ($res['tasks'] as $t) {
            $tc = trim($t['court'] ?? '');
            if (($t['status'] ?? '') === '比赛中' && $tc !== '' && isset($res['courts'][$tc]) && $res['courts'][$tc]['match_id'] === '') {
                $res['courts'][$tc]['status'] = '比赛中';
                $res['courts'][$tc]['match_id'] = $t['id'] ?? '';
                $res['courts'][$tc]['match_name'] = trim(($t['t1'] ?? '') . ' vs ' . ($t['t2'] ?? ''));
                $res['courts'][$tc]['score'] = $t['live_score'] ?? '';
            }
            // [P1-2 FIXUP] 同理由 live_scores 中的待开赛状态覆盖：如果此 court 已被 accept_task 写入，且尚未被 task 投影占据。
            if (isset($live[$tc]) && ($live[$tc]['status'] ?? '') === '待开赛' && isset($res['courts'][$tc]) && $res['courts'][$tc]['match_id'] === '') {
                $res['courts'][$tc]['status'] = $live[$tc]['status'] ?? '待开赛';
                $res['courts'][$tc]['match_id'] = $live[$tc]['match_id'] ?? '';
                $res['courts'][$tc]['match_name'] = $live[$tc]['match_name'] ?? '';
                $res['courts'][$tc]['score'] = $live[$tc]['score'] ?? '0-0';
                $res['courts'][$tc]['referee'] = $live[$tc]['referee'] ?? '';
            }
        }
        // [PR#155 R8] 返回裁判矩阵数据（不返回密码或不必要内部字段）
        $res['referees'] = array_map(function ($r) {
            return [
                'name' => $r['name'] ?? '',
                'status' => $r['status'] ?? '空闲',
                'current_court' => $r['current_court'] ?? '',
                'match_count' => $r['match_count'] ?? 0,
                'last_login' => $r['last_login'] ?? ''
            ];
        }, $refs);
        echo json_encode($res); break;

    case 'change_event_mode':
        if (!is_super_admin_authorized($req['super_pwd'] ?? '')) { echo json_encode(['status' => 'error', 'message' => 'Auth Failed']); exit; }
        $cfg = kv_get($event_code, 'config', []);
        if(!$cfg) { echo json_encode(['status' => 'error', 'message' => '赛事不存在']); exit; }
        $cfg['event_type'] = $req['new_mode'];
        kv_set($event_code, 'config', $cfg);
        echo json_encode(['status' => 'success']); break;

    case 'get_players': echo json_encode(['status' => 'success', 'data' => kv_get($event_code, 'players', [])]); break;
    case 'set_players': kv_set($event_code, 'players', $req['players']); echo json_encode(['status' => 'success']); break;

    case 'get_waivers':
        $stmt = $pdo->prepare("SELECT player_name, id_last4, signature, sign_time, waiver_text FROM nhpa_waivers WHERE event_code = ? ORDER BY sign_time DESC");
        $stmt->execute([$event_code]);
        echo json_encode(['status' => 'success', 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        break;

    // ========== 风险告知书统一管理 ==========
    case 'set_waiver_text':
        $conf = kv_get($event_code, 'config');
        if (($req['password'] ?? '') !== ($conf['referee_password'] ?? '')) {
            echo json_encode(['status' => 'error', 'message' => '权限不足']);
            break;
        }
        $conf['waiver_text'] = $req['waiver_text'] ?? '';
        kv_set($event_code, 'config', $conf);
        echo json_encode(['status' => 'success']);
        break;

    case 'get_waiver_text':
        $conf = kv_get($event_code, 'config');
        echo json_encode(['status' => 'success', 'data' => $conf['waiver_text'] ?? '']);
        break;

    case 'player_checkin':
        // 插入 waivers 表时包含 waiver_text
        $stmt = $pdo->prepare("INSERT INTO nhpa_waivers (event_code, player_name, id_last4, signature, waiver_text) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $event_code,
            $req['player_name'],
            $req['id_last4'],
            $req['signature'],
            $req['waiver_text'] ?? null
        ]);
        $players = kv_get($event_code, 'players', []); $found = false;
        foreach ($players as &$p) { if ($p['name'] === $req['player_name']) { $p['checked_in'] = true; $p['id_last4'] = $req['id_last4']; $p['sign_time'] = date('Y-m-d H:i:s'); $found = true; break; } }
        if (!$found) $players[] = ['id_code' => 'P'.rand(1000, 9999), 'group' => '现场加报', 'position' => count($players)+1, 'name' => $req['player_name'], 'team' => '', 'checked_in' => true, 'id_last4' => $req['id_last4'], 'sign_time' => date('Y-m-d H:i:s')];
        kv_set($event_code, 'players', $players);
        echo json_encode(['status' => 'success']); break;

		case 'check_waiver':
    $player_name = trim($req['player_name'] ?? $_GET['player_name'] ?? '');
    if (!$player_name) {
        echo json_encode(['status' => 'error', 'message' => '缺少选手姓名']);
        break;
    }
    $stmt = $pdo->prepare("SELECT player_name, id_last4, signature, sign_time, waiver_text FROM nhpa_waivers WHERE event_code = ? AND player_name = ? ORDER BY sign_time DESC LIMIT 1");
    $stmt->execute([$event_code, $player_name]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($row) {
        echo json_encode(['status' => 'success', 'data' => $row]);
    } else {
        echo json_encode(['status' => 'success', 'data' => null]);
    }
    break;

	case 'clear_players':
    $conf = kv_get($event_code, 'config');
    if (($req['password'] ?? '') !== ($conf['referee_password'] ?? '')) {
        echo json_encode(['status' => 'error', 'message' => '密码错误，无权操作']);
        break;
    }
    kv_set($event_code, 'players', []);
    echo json_encode(['status' => 'success']);
    break;

    case 'force_checkin_all':
        $conf = kv_get($event_code, 'config');
        if (($req['password'] ?? '') !== $conf['referee_password']) {
            echo json_encode(['status' => 'error', 'message' => '密码错误']);
            break;
        }
        $players = kv_get($event_code, 'players', []);
        foreach ($players as &$p) $p['checked_in'] = true;
        kv_set($event_code, 'players', $players);
        echo json_encode(['status' => 'success']);
        break;

    case 'set_bulk_tasks':
        try {
            $pdo->beginTransaction();
            if (!lock_event_for_update($pdo, $event_code)) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '赛事不存在']); break; }
            $existing = kv_get($event_code, 'tasks', []);
            $live = kv_get($event_code, 'live_scores', []);
            $incoming = [];
            foreach (($req['tasks'] ?? []) as $task) {
                $id = normalizeId($task['id'] ?? '');
                if (!$id) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '任务缺少比赛ID']); break 2; }
                $incoming[$id] = $task;
            }
            foreach ($existing as $key => $task) {
                $id = normalizeId($task['id'] ?? $key);
                $active = (($task['status'] ?? '') === '比赛中') || projection_for_match($live, $id) !== null;
                if ($active && isset($incoming[$id]) && $incoming[$id] != $task) {
                    $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => "活动任务 {$id} 不得修改"]); break 2;
                }
            }
            $final_tasks = $existing;
            foreach ($incoming as $id => $task) {
                $actual_key = $id;
                foreach ($final_tasks as $key => $old) if (normalizeId($old['id'] ?? $key) === $id) { $actual_key = $key; break; }
                $final_tasks[$actual_key] = $task;
            }
            kv_set($event_code, 'tasks', $final_tasks);
            $pdo->commit(); echo json_encode(['status' => 'success']);
        } catch (Exception $e) { if ($pdo->inTransaction()) $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => $e->getMessage()]); }
        break;
    case 'delete_task':
        $normId = normalizeId($req['match_id'] ?? '');
        try {
            $pdo->beginTransaction();
            if (!lock_event_for_update($pdo, $event_code)) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '赛事不存在']); break; }
            $tasks = kv_get($event_code, 'tasks', []); $live = kv_get($event_code, 'live_scores', []); $task_key = null; $task = null;
            foreach ($tasks as $key => $candidate) if (normalizeId($candidate['id'] ?? $key) === $normId) { $task_key = $key; $task = $candidate; break; }
            if (($task['status'] ?? '') === '比赛中' || projection_for_match($live, $normId) !== null) {
                $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '活动任务不得删除']); break;
            }
            if ($task_key !== null) unset($tasks[$task_key]);
            kv_set($event_code, 'tasks', $tasks); $pdo->commit(); echo json_encode(['status' => 'success']);
        } catch (Exception $e) { if ($pdo->inTransaction()) $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => $e->getMessage()]); }
        break;
    case 'get_match_recovery_preview':
        // Read-only by construction: this route only reads the four authoritative KVs.
        $match_id = normalizeId($req['match_id'] ?? $_GET['match_id'] ?? '');
        if (!$match_id) { echo json_encode(['status'=>'error','message'=>'缺少比赛ID']); break; }
        if (!check_referee_pwd($pdo, $event_code, recovery_password($req))) { echo json_encode(['status'=>'error','message'=>'赛事密码错误，无权查看恢复信息']); break; }
        $tasks = kv_get($event_code, 'tasks', []); $live = kv_get($event_code, 'live_scores', []); $refs = kv_get($event_code, 'referees', []); $records = kv_get($event_code, 'records', []);
        $state = recovery_find_state($tasks, $live, $refs, $records, $match_id); $summary = recovery_summary($state); $actions = [];
        $has_record = count($state['matching_records']) > 0; $projection_status = $state['projection']['status'] ?? '';
        $corrupt_reason = $state['corrupted'] ? '比赛状态存在冲突：' . implode('；', $state['conflicts']) : null;
        $actions['undo_pending_keep_court'] = ['allowed'=>!$state['corrupted'] && $state['task'] !== null && !$has_record && $projection_status === '待开赛', 'changes'=>'删除本场实时投影；task 恢复未开始并保留场地；owner 恢复空闲', 'reason'=>$corrupt_reason ?: ($has_record ? '已有正式赛果，必须进入赛果更正流程' : ($projection_status === '待开赛' ? null : '比赛不是待开赛状态'))];
        $actions['undo_pending_unschedule'] = ['allowed'=>$actions['undo_pending_keep_court']['allowed'], 'changes'=>'删除本场实时投影；task 恢复未开始并清空场地；owner 恢复空闲', 'reason'=>$actions['undo_pending_keep_court']['reason']];
        $actions['return_running_unscheduled'] = ['allowed'=>!$state['corrupted'] && $state['task'] !== null && !$has_record && $projection_status === '比赛中', 'changes'=>'删除本场实时投影；task 恢复未开始、清空场地及临时比分；owner 恢复空闲', 'reason'=>$corrupt_reason ?: ($has_record ? '已有正式赛果，必须进入赛果更正流程' : ($projection_status === '比赛中' ? null : '比赛不是进行中状态'))];
        $actions['move_court'] = ['allowed'=>!$state['corrupted'] && $state['task'] !== null && !$has_record && in_array($projection_status, ['', '待开赛', '比赛中'], true), 'changes'=>'原子更新 task、实时投影及执裁中裁判场地', 'reason'=>$corrupt_reason ?: ($has_record ? '已有正式赛果，不支持改场' : ($state['task'] ? null : '比赛任务不存在'))];
        echo json_encode(['status'=>'success','data'=>$summary,'court_occupied'=>$state['court'] !== null,'actions'=>$actions]);
        break;
    case 'recover_match':
        $match_id = normalizeId($req['match_id'] ?? ''); $recovery_action = $req['recovery_action'] ?? '';
        $request_id = trim((string)($req['request_id'] ?? '')); $reason = trim((string)($req['reason'] ?? ''));
        if (!$match_id || !$request_id || !in_array($recovery_action, ['undo_pending_keep_court','undo_pending_unschedule','return_running_unscheduled'], true)) { echo json_encode(['status'=>'error','message'=>'缺少比赛ID、恢复动作或幂等请求标识']); break; }
        if ($reason === '') { echo json_encode(['status'=>'error','message'=>'恢复原因不能为空']); break; }
        try {
            $pdo->beginTransaction();
            if (!lock_event_for_update($pdo, $event_code)) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'赛事不存在']); break; }
            if (!check_referee_pwd($pdo, $event_code, recovery_password($req))) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'赛事密码错误，无权执行恢复']); break; }
            $tasks = kv_get($event_code, 'tasks', []); $live = kv_get($event_code, 'live_scores', []); $refs = kv_get($event_code, 'referees', []); $records = kv_get($event_code, 'records', []); $audit = kv_get($event_code, 'recovery_audit', []);
            $state = recovery_find_state($tasks, $live, $refs, $records, $match_id);
            if ($state['corrupted']) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'比赛状态存在冲突，拒绝自动恢复：'.implode('；',$state['conflicts'])]); break; }
            $existing = recovery_audit_existing($audit, $request_id, $recovery_action, $match_id);
            if ($existing !== null) { $pdo->rollBack(); echo json_encode($existing === false ? ['status'=>'error','message'=>'幂等请求标识已用于其他恢复动作'] : ['status'=>'success','idempotent'=>true,'changes'=>$existing['after']]); break; }
            if (!$state['task'] || !$state['projection']) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'恢复目标任务或实时投影不存在，请刷新预览']); break; }
            if (count($state['matching_records']) > 0) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'比赛已有正式赛果，不能回退；请进入赛果更正流程']); break; }
            $expected_error = recovery_expected_error($req, $match_id, $state);
            if ($expected_error) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>$expected_error]); break; }
            if ((string)($state['task']['court'] ?? '') !== (string)$state['court']) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'task 与实时投影场地不一致，拒绝部分修复']); break; }
            $wanted_status = $recovery_action === 'return_running_unscheduled' ? '比赛中' : '待开赛';
            if (($state['projection']['status'] ?? '') !== $wanted_status) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'当前比赛状态不支持所选恢复动作']); break; }
            if ($state['referee'] === null) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'当前 owner/referee 不存在，拒绝猜测恢复']); break; }
            foreach ($live as $other) if (normalizeId($other['match_id'] ?? '') !== $match_id && normalizeId($other['referee'] ?? '') === normalizeId($state['referee']['name'] ?? '') && is_ownership_projection($other)) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'当前裁判还拥有其他活动比赛，拒绝释放']); break 2; }
            if ($wanted_status === '比赛中' && (($state['task']['status'] ?? '') !== '比赛中' || ($state['referee']['status'] ?? '') !== '执裁中' || (string)($state['referee']['current_court'] ?? '') !== (string)$state['court'])) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'task、投影和裁判进行态不一致，拒绝部分修复']); break; }
            $before = recovery_summary($state); unset($live[$state['court']]);
            $tasks[$state['task_key']]['status'] = '未开始'; unset($tasks[$state['task_key']]['live_score']);
            if ($recovery_action !== 'undo_pending_keep_court') $tasks[$state['task_key']]['court'] = '';
            foreach ($refs as $idx => $ref) if (normalizeId($ref['name'] ?? '') === normalizeId($state['referee']['name'] ?? '')) { $refs[$idx]['status'] = '空闲'; $refs[$idx]['current_court'] = ''; break; }
            $after = recovery_summary(recovery_find_state($tasks, $live, $refs, $records, $match_id));
            $audit[] = recovery_audit_entry($event_code, $match_id, $recovery_action, $req, $before, $after);
            kv_set($event_code, 'tasks', $tasks); kv_set($event_code, 'live_scores', $live); kv_set($event_code, 'referees', $refs); kv_set($event_code, 'recovery_audit', $audit);
            $pdo->commit(); echo json_encode(['status'=>'success','idempotent'=>false,'changes'=>$after]);
        } catch (Exception $e) { if ($pdo->inTransaction()) $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>$e->getMessage()]); }
        break;
    case 'get_recovery_audit':
        // Minimal operational read model; audit never contains config, credentials, signatures, or full records.
        if (!check_referee_pwd($pdo, $event_code, recovery_password($req))) { echo json_encode(['status'=>'error','message'=>'赛事密码错误，无权查看恢复审计']); break; }
        echo json_encode(['status'=>'success','data'=>kv_get($event_code, 'recovery_audit', [])]); break;
    case 'update_task_court':
        $match_id = normalizeId($req['match_id'] ?? '');
        $new_court = trim($req['court'] ?? '');
        if (!$match_id || !array_key_exists('court', $req)) { echo json_encode(['status'=>'error','message'=>'缺少比赛ID或目标场地']); break; }
        $recovery_requested = false;
        foreach (['request_id','reason','expected_match_id','expected_court','expected_referee','expected_status','password','pwd'] as $field) if (array_key_exists($field, $req)) { $recovery_requested = true; break; }
        try {
            $pdo->beginTransaction();
            if (!lock_event_for_update($pdo, $event_code)) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '赛事不存在']); break; }
            $tasks = kv_get($event_code, 'tasks', []); $live = kv_get($event_code, 'live_scores', []); $refs = kv_get($event_code, 'referees', []); $records = kv_get($event_code, 'records', []); $audit = kv_get($event_code, 'recovery_audit', []);
            $state = recovery_find_state($tasks, $live, $refs, $records, $match_id);
            if ($state['corrupted']) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'比赛状态存在冲突，拒绝自动改场：'.implode('；',$state['conflicts'])]); break; }
            if (!$state['task']) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'未找到该比赛']); break; }
            $config = kv_get($event_code, 'config', []); $valid_courts = array_map('strval', $config['courts'] ?? []);
            if ($new_court !== '' && !in_array($new_court, $valid_courts, true)) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'目标场地不在本赛事场地列表中']); break; }
            foreach ($live as $court => $projection) if ($new_court !== '' && (string)$court === $new_court && normalizeId($projection['match_id'] ?? '') !== $match_id) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>"目标场地 #{$new_court} 存在其他比赛投影，请先处理场地异常"]); break 2; }

            // Compatibility for the exact legacy UI payload {match_id, court}: only a plain,
            // unclaimed, unstarted task may move, still under the event lock and transaction.
            if (!$recovery_requested) {
                if (count($state['projection_matches']) !== 0) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'比赛已有待开赛或比赛中投影，请使用完整恢复流程改场']); break; }
                if (!in_array($state['task']['status'] ?? '', ['', '未开始'], true)) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'只有未开始且未被领取的任务可使用普通改场']); break; }
                if ((string)($state['task']['court'] ?? '') === $new_court) { $pdo->rollBack(); echo json_encode(['status'=>'success','idempotent'=>true,'legacy_compatible'=>true]); break; }
                $tasks[$state['task_key']]['court'] = $new_court;
                kv_set($event_code, 'tasks', $tasks); $pdo->commit();
                echo json_encode(['status'=>'success','idempotent'=>false,'legacy_compatible'=>true]); break;
            }

            if (!has_full_recovery_payload($req) || trim((string)($req['request_id'] ?? '')) === '' || trim((string)($req['reason'] ?? '')) === '') { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'恢复改场必须提供完整 expected 状态、原因和幂等请求标识']); break; }
            if ($new_court === '') { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'恢复改场必须指定目标场地；返回待编排请使用对应恢复动作']); break; }
            if (!check_referee_pwd($pdo, $event_code, recovery_password($req))) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'赛事密码错误，无权执行恢复改场']); break; }
            $request_id = trim((string)$req['request_id']);
            $existing = recovery_audit_existing($audit, $request_id, 'move_court', $match_id);
            if ($existing !== null) { $pdo->rollBack(); echo json_encode($existing === false ? ['status'=>'error','message'=>'幂等请求标识已用于其他恢复动作'] : ['status'=>'success','idempotent'=>true,'changes'=>$existing['after']]); break; }
            $expected_error = recovery_expected_error($req, $match_id, $state);
            if ($expected_error) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>$expected_error]); break; }
            if ($state['projection'] && !in_array($state['projection']['status'] ?? '', ['待开赛','比赛中'], true)) { $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>'当前投影状态不支持改场']); break; }
            $before = recovery_summary($state); $source_court = $state['court'];
            $tasks[$state['task_key']]['court'] = $new_court;
            if ($state['projection']) { $live[$new_court] = $state['projection']; $live[$new_court]['court'] = $new_court; if ((string)$source_court !== $new_court) unset($live[$source_court]); }
            if ($state['referee']) foreach ($refs as $idx => $ref) if (normalizeId($ref['name'] ?? '') === normalizeId($state['referee']['name'] ?? '')) { if (($ref['status'] ?? '') === '执裁中') $refs[$idx]['current_court'] = $new_court; break; }
            $after = recovery_summary(recovery_find_state($tasks, $live, $refs, $records, $match_id));
            $audit[] = recovery_audit_entry($event_code, $match_id, 'move_court', $req, $before, $after);
            kv_set($event_code, 'tasks', $tasks); if ($state['projection']) kv_set($event_code, 'live_scores', $live); if ($state['referee']) kv_set($event_code, 'referees', $refs); kv_set($event_code, 'recovery_audit', $audit);
            $pdo->commit(); echo json_encode(['status'=>'success','idempotent'=>false,'changes'=>$after]);
        } catch (Exception $e) { if ($pdo->inTransaction()) $pdo->rollBack(); echo json_encode(['status'=>'error','message'=>$e->getMessage()]); }
        break;
    case 'accept_task':
        // [PR#155 R2] 原子事务版领取：事件级互斥锁 + 锁内全量校验 + 单事务写入。
        // 消除两个 PHP worker 同时领取成功的竞态窗口；权威数据全部取自服务端 KV。
        $match_id = normalizeId($req['match_id'] ?? '');
        $referee_id = normalizeId($req['referee_id'] ?? trim($req['ref'] ?? ''));
        if (!$match_id) { echo json_encode(['status' => 'error', 'message' => '缺少比赛ID']); break; }
        if (!$referee_id) { echo json_encode(['status' => 'error', 'message' => '缺少裁判ID']); break; }
        try {
            $pdo->beginTransaction();
            $lockStmt = $pdo->prepare("SELECT data_value FROM nhpa_store WHERE event_code = ? AND data_key = 'config' FOR UPDATE");
            $lockStmt->execute([$event_code]);
            if ($lockStmt->fetchColumn() === false) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '赛事不存在']); break; }
            // 1. 锁内读取权威 tasks；按实际 key 查找，不得假设 $tasks[$match_id] 存在
            $tasks = kv_get($event_code, 'tasks', []);
            $task = null;
            foreach ($tasks as $key => $t) { if (normalizeId($key) === $match_id) { $task = $t; break; } }
            if (!$task) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '未找到该比赛任务']); break; }
            // 2. task.court 必须非空（否则说明主控尚未分配场地）
            $assigned_court = trim($task['court'] ?? '');
            if ($assigned_court === '') { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '该任务尚未分配场地，无法接受。请先由主控分配场地。']); break; }
            // 3. referee_id 必须已注册于 referees KV（防止伪造裁判领取）
            $refs = kv_get($event_code, 'referees', []);
            $refRegistered = false;
            foreach ($refs as $r) { if (normalizeId($r['name'] ?? '') === $referee_id) { $refRegistered = true; break; } }
            if (!$refRegistered) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '该裁判未在本赛事注册，无法领取任务']); break; }
            // 4. [PR#155 R5] task.status 仅允许缺省/未开始；比赛中或其他终态一律拒绝
            //    必须在 live_scores 归属/幂等检查之前执行，防止待开赛投影绕过终态校验
            $taskStatus = $task['status'] ?? '';
            if ($taskStatus !== '' && $taskStatus !== '未开始') {
                $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => "该任务状态为「{$taskStatus}」，不可领取"]); break;
            }
            // 5. 归属检查：该 task 若已有任何投影（不限状态）
            //    - 待开赛 + 相同 referee → 幂等 success（零写入）
            //    - 其他情况（不同 referee / 已开赛）→ 拒绝，原归属保持
            $live = kv_get($event_code, 'live_scores', []);
            foreach ($live as $court => $info) {
                if (normalizeId($info['match_id'] ?? '') === $match_id) {
                    if (($info['status'] ?? '') === '待开赛' && normalizeId($info['referee'] ?? '') === $referee_id) {
                        $pdo->rollBack(); echo json_encode(['status' => 'success', 'idempotent' => true]); break 2;
                    }
                    $other = $info['referee'] ?? '未知';
                    $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => "该任务已被裁判 {$other} 接受，不可重复领取"]); break 2;
                }
            }
            // 5a. [PR#155 R3] 同一裁判不得同时拥有两个不同 task/court 的投影（不论待开赛还是比赛中）
            foreach ($live as $court => $info) {
                if (normalizeId($info['referee'] ?? '') === $referee_id && normalizeId($info['match_id'] ?? '') !== $match_id) {
                    $other_match = $info['match_id'];
                    $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => "该裁判已领取其他任务（{$other_match}），不可同时领取两个任务"]); break 2;
                }
            }
            // 6. 同一 court 上存在任何不同 match_id 的投影 → 拒绝，不论待开赛还是比赛中
            foreach ($live as $court => $info) {
                if ((string)$court === (string)$assigned_court && normalizeId($info['match_id'] ?? '') !== $match_id) {
                    $other_match = $info['match_id'];
                    $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => "场地 #{$assigned_court} 已被其他任务（{$other_match}）占用，无法覆盖"]); break 2;
                }
            }
            // 7. 全部校验通过——使用服务端权威数据写入投影（court/t1/t2/is_team 均取自 task，忽略客户端伪造字段）
            $live[$assigned_court] = [
                'match_id' => $match_id,
                'status' => '待开赛',
                'match_name' => ($task['t1'] ?? '') . ' vs ' . ($task['t2'] ?? ''),
                'score' => '0-0',
                'referee' => $referee_id,
                'court' => $assigned_court,
                'is_team' => $task['is_team'] ?? false,
                'accepted_at' => date('Y-m-d H:i:s'),
            ];
            kv_set($event_code, 'live_scores', $live);
            $pdo->commit();
            echo json_encode(['status' => 'success', 'idempotent' => false]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;
    case 'release_task_acceptance':
        // [PR#155 R2] 原子事务版释放：删除待开赛投影 + 裁判重置在同一事务内完成，
        // 避免“先删投影、后写 referees”第二次写入失败形成部分状态。
        $referee_id = normalizeId($req['referee_id'] ?? '');
        if (!$referee_id) { echo json_encode(['status' => 'error', 'message' => '缺少裁判ID']); break; }
        $req_match = normalizeId($req['match_id'] ?? '');
        try {
            $pdo->beginTransaction();
            $lockStmt = $pdo->prepare("SELECT data_value FROM nhpa_store WHERE event_code = ? AND data_key = 'config' FOR UPDATE");
            $lockStmt->execute([$event_code]);
            if ($lockStmt->fetchColumn() === false) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '赛事不存在']); break; }
            $live = kv_get($event_code, 'live_scores', []);
            $target_court = null;
            foreach ($live as $court => $info) {
                $is_mine = normalizeId($info['referee'] ?? '') === $referee_id;
                if ($req_match !== '') {
                    if (normalizeId($info['match_id'] ?? '') !== $req_match) continue;
                    if (($info['status'] ?? '') !== '待开赛') {
                        $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '比赛已开始，禁止普通释放；请使用正式中断或完赛流程']); break 2;
                    }
                    if (!$is_mine) {
                        $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '该任务由其他裁判接受，无权释放']); break 2;
                    }
                    $target_court = $court;
                    break;
                }
                if ($is_mine && ($info['status'] ?? '') === '待开赛') { $target_court = $court; break; }
            }
            if ($target_court === null) {
                $pdo->rollBack();
                echo json_encode(['status' => 'success', 'released' => false]); // 无可释放投影：幂等且零写入
                break;
            }
            // 同一事务内同时完成：删除投影 + 裁判重置；任一步失败整体 rollback
            unset($live[$target_court]);
            kv_set($event_code, 'live_scores', $live);
            $refs = kv_get($event_code, 'referees', []);
            foreach ($refs as $idx => $r) {
                if (normalizeId($r['name'] ?? '') === $referee_id) {
                    $refs[$idx]['status'] = '空闲';
                    $refs[$idx]['current_court'] = '';
                    break;
                }
            }
            kv_set($event_code, 'referees', $refs);
            $pdo->commit();
            echo json_encode(['status' => 'success', 'released' => true, 'court' => (string)$target_court]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;
    case 'clear_all_tasks':
        try {
            $pdo->beginTransaction();
            if (!lock_event_for_update($pdo, $event_code)) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '赛事不存在']); break; }
            $tasks = kv_get($event_code, 'tasks', []); $live = kv_get($event_code, 'live_scores', []); $kept = []; $cleared = []; $skipped = [];
            foreach ($tasks as $key => $task) {
                $id = normalizeId($task['id'] ?? $key);
                if (($task['status'] ?? '') === '比赛中' || projection_for_match($live, $id) !== null) { $kept[$key] = $task; $skipped[] = $id; }
                else $cleared[] = $id;
            }
            kv_set($event_code, 'tasks', $kept); $pdo->commit();
            echo json_encode(['status' => 'success', 'cleared_ids' => $cleared, 'skipped_active_ids' => $skipped]);
        } catch (Exception $e) { if ($pdo->inTransaction()) $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => $e->getMessage()]); }
        break;
    case 'delete_team_room':
        $room_code = normalizeId($req['room_code']); $team_event = kv_get($event_code, 'team_event', []);
        if (isset($team_event[$room_code])) { unset($team_event[$room_code]); kv_set($event_code, 'team_event', $team_event); }
        $team_lineups = kv_get($event_code, 'team_lineups', []); $changed = false; foreach ($team_lineups as $k => $v) { if (strpos($k, $room_code . '_') === 0) { unset($team_lineups[$k]); $changed = true; } }
        if ($changed) kv_set($event_code, 'team_lineups', $team_lineups); echo json_encode(['status' => 'success']); break;
    case 'clear_team_radar': kv_set($event_code, 'team_event', []); kv_set($event_code, 'team_lineups', []); echo json_encode(['status' => 'success']); break;
    case 'set_team_template': kv_set($event_code, 'team_template', $req['template'] ?? []); echo json_encode(['status' => 'success']); break;
    case 'get_team_template': echo json_encode(['status' => 'success', 'data' => kv_get($event_code, 'team_template', [])]); break;
    case 'import_team_event':
        $room_code = normalizeId($req['room_code']);
        $teams_data = $req['teams'];
        $idx = 1;
        foreach ($teams_data as &$team) {
            if (empty($team['team_code'])) { $team['team_code'] = 'T' . str_pad($idx++, 2, '0', STR_PAD_LEFT); }
        }
        $team_event = kv_get($event_code, 'team_event', []);
        $team_event[$room_code] = ['created_at' => date('Y-m-d H:i:s'), 'status' => $req['status'] ?? 'team_confirming', 'teams' => $teams_data];
        kv_set($event_code, 'team_event', $team_event);
        echo json_encode(['status' => 'success']);
        break;
    case 'update_team_code':
        $room_code = normalizeId($req['room_code']);
        $team_name = $req['team_name'];
        $new_code = trim($req['team_code']);
        if (!$new_code) { echo json_encode(['status' => 'error', 'message' => '编号不能为空']); exit; }
        $team_event = kv_get($event_code, 'team_event', []);
        if (!isset($team_event[$room_code])) { echo json_encode(['status' => 'error', 'message' => '房间不存在']); exit; }
        $found = false;
        foreach ($team_event[$room_code]['teams'] as &$team) {
            if ($team['team_name'] === $team_name) { $team['team_code'] = $new_code; $found = true; break; }
        }
        if (!$found) { echo json_encode(['status' => 'error', 'message' => '队伍不存在']); exit; }
        kv_set($event_code, 'team_event', $team_event);
        echo json_encode(['status' => 'success']);
        break;
    case 'add_team_member':
        $room_code = normalizeId($req['room_code']);
        $team_name = $req['team_name'];
        $player_name = trim($req['player_name']);
        if (!$player_name) { echo json_encode(['status' => 'error', 'message' => '队员姓名不能为空']); exit; }
        $team_event = kv_get($event_code, 'team_event', []);
        if (!isset($team_event[$room_code])) { echo json_encode(['status' => 'error', 'message' => '房间不存在']); exit; }
        $found = false; $team_code = '';
        foreach ($team_event[$room_code]['teams'] as &$team) {
            if ($team['team_name'] === $team_name) {
                $team_code = $team['team_code'] ?? 'T' . rand(10, 99);
                foreach ($team['players'] as $p) { if ($p['name'] === $player_name) { echo json_encode(['status' => 'error', 'message' => '队员已存在']); exit; } }
                $new_pos = count($team['players']) + 1;
                $team['players'][] = ['name' => $player_name, 'position' => $new_pos, 'confirmed' => false];
                $found = true; break;
            }
        }
        if (!$found) { echo json_encode(['status' => 'error', 'message' => '队伍不存在']); exit; }
        kv_set($event_code, 'team_event', $team_event);
        $players = kv_get($event_code, 'players', []);
        $id_code = $team_code . '-' . str_pad(count($players) + 1, 2, '0', STR_PAD_LEFT);
        $players[] = ['id_code' => $id_code, 'group' => $team_name, 'position' => count($players) + 1, 'name' => $player_name, 'team' => $team_name, 'checked_in' => false];
        kv_set($event_code, 'players', $players);
        echo json_encode(['status' => 'success', 'id_code' => $id_code]);
        break;
    case 'get_all_teams':
        $team_event = kv_get($event_code, 'team_event', []); $all_teams = []; foreach ($team_event as $room_code => $room_data) { foreach ($room_data['teams'] as $team) { $team['room_code'] = $room_code; $all_teams[] = $team; } } echo json_encode(['status' => 'success', 'data' => $all_teams]); break;
    case 'get_team_room':
        $room_code = normalizeId($_GET['room_code']); $team_event = kv_get($event_code, 'team_event', []);
        if (!isset($team_event[$room_code])) { echo json_encode(['status' => 'not_found']); break; }
        $team_lineups = kv_get($event_code, 'team_lineups', []); $teams = $team_event[$room_code]['teams']; $submitted = [];
        foreach ($teams as $team) { $key = "{$room_code}_{$team['team_name']}"; $submitted[$team['team_name']] = isset($team_lineups[$key]); } echo json_encode(['status' => 'success', 'data' => $team_event[$room_code], 'submitted' => $submitted]); break;
    case 'submit_team_lineup':
    $room_code = normalizeId($req['room_code']);
    $team_name = $req['team_name'];
    $matches = $req['matches'];
    $team_lineups = kv_get($event_code, 'team_lineups', []);
    $key = "{$room_code}_{$team_name}";
    $team_lineups[$key] = [
        'submitted_at' => date('Y-m-d H:i:s'),
        'matches' => $matches,
        'leader_name' => $req['leader_name'] ?? '',
        'signature' => $req['signature'] ?? ''
    ];
    kv_set($event_code, 'team_lineups', $team_lineups);
    echo json_encode(['status' => 'success']);
    break;
    case 'get_personal_task':
        $tasks = kv_get($event_code, 'tasks', []); $match_id = normalizeId($_GET['match_id'] ?? ''); $found = null;
        foreach ($tasks as $key => $task) { if (normalizeId($key) === $match_id) { $found = $task; break; } } echo $found ? json_encode(['status' => 'success', 'data' => $found]) : json_encode(['status' => 'empty']); break;
    case 'get_personal_tasks': echo json_encode(['status' => 'success', 'tasks' => kv_get($event_code, 'tasks', [])]); break;
    case 'get_referees': echo json_encode(['status' => 'success', 'data' => kv_get($event_code, 'referees', [])]); break;
    case 'update_referee_comment':
        $refs = kv_get($event_code, 'referees', []); foreach ($refs as &$r) { if ($r['name'] === $req['referee_id']) { $r['comment'] = $req['comment']; break; } } kv_set($event_code, 'referees', $refs); echo json_encode(['status' => 'success']); break;
    case 'delete_referee':
        $referee_id = normalizeId($req['referee_id'] ?? '');
        try {
            $pdo->beginTransaction();
            if (!lock_event_for_update($pdo, $event_code)) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '赛事不存在']); break; }
            $live = kv_get($event_code, 'live_scores', []);
            if (referee_owns_projection($live, $referee_id)) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '活动任务裁判不得删除']); break; }
            $refs = kv_get($event_code, 'referees', []); $refs = array_filter($refs, function($r) use ($referee_id) { return normalizeId($r['name'] ?? '') !== $referee_id; });
            kv_set($event_code, 'referees', array_values($refs)); $pdo->commit(); echo json_encode(['status' => 'success']);
        } catch (Exception $e) { if ($pdo->inTransaction()) $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => $e->getMessage()]); }
        break;
    case 'set_referees':
        try {
            $pdo->beginTransaction();
            if (!lock_event_for_update($pdo, $event_code)) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '赛事不存在']); break; }
            $refs = kv_get($event_code, 'referees', []); $new_refs = $req['referees'] ?? []; $live = kv_get($event_code, 'live_scores', []);
            // 必须从 live_scores 反向验证每一个 owner；旧 referees 缺失 owner 也是损坏态，禁止借覆盖请求猜测或修复。
            foreach ($live as $court => $projection) {
                if (!is_ownership_projection($projection)) continue;
                $owner_name = $projection['referee'] ?? '';
                $owner_id = normalizeId($owner_name);
                $old_matches = array_values(array_filter($refs, function ($candidate) use ($owner_id) {
                    return normalizeId($candidate['name'] ?? '') === $owner_id;
                }));
                $incoming_matches = array_values(array_filter($new_refs, function ($candidate) use ($owner_id) {
                    return normalizeId($candidate['name'] ?? '') === $owner_id;
                }));
                $old = count($old_matches) === 1 ? $old_matches[0] : null;
                $incoming = count($incoming_matches) === 1 ? $incoming_matches[0] : null;
                $expected_status = ($projection['status'] ?? '') === '比赛中' ? '执裁中' : '空闲';
                $expected_court = ($projection['status'] ?? '') === '比赛中' ? (string)$court : '';
                $old_is_legal = $owner_id !== '' && $old !== null
                    && ($old['name'] ?? '') === $owner_name
                    && ($old['status'] ?? '') === $expected_status
                    && (string)($old['current_court'] ?? '') === $expected_court;
                $incoming_is_legal = $incoming !== null
                    && ($incoming['name'] ?? '') === $owner_name
                    && ($incoming['status'] ?? '') === $expected_status
                    && (string)($incoming['current_court'] ?? '') === $expected_court;
                if (!$old_is_legal || !$incoming_is_legal) {
                    $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '活动任务裁判缺失、状态非法或场地不一致']); break 2;
                }
            }
            kv_set($event_code, 'referees', $new_refs); $pdo->commit(); echo json_encode(['status' => 'success']);
        } catch (Exception $e) { if ($pdo->inTransaction()) $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => $e->getMessage()]); }
        break;
    case 'referee_update_status':
        // [PR#155 REVIEW FIX] referee_update_status 只负责更新裁判状态和场地，不再删除 live_scores 投影。
        // 投影清除只能由 release_task_acceptance（待开赛释放）或 save_score（完赛事务）执行，
        // 防止裁判登录时因 courtNo 默认值误删待开赛/比赛中投影。
        $referee_id = normalizeId($req['referee_id'] ?? ''); $requested_status = $req['status'] ?? '';
        try {
            $pdo->beginTransaction();
            if (!lock_event_for_update($pdo, $event_code)) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '赛事不存在']); break; }
            $live = kv_get($event_code, 'live_scores', []);
            if ($requested_status !== '空闲' || referee_owns_projection($live, $referee_id, '比赛中')) {
                $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '活动状态只能由比赛生命周期接口修改']); break;
            }
            $refs = kv_get($event_code, 'referees', []);
            foreach ($refs as &$r) if (normalizeId($r['name'] ?? '') === $referee_id) { $r['status'] = '空闲'; $r['current_court'] = $req['court'] ?? ''; break; }
            kv_set($event_code, 'referees', $refs); $pdo->commit(); echo json_encode(['status' => 'success']);
        } catch (Exception $e) { if ($pdo->inTransaction()) $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => $e->getMessage()]); }
        break;
    case 'start_task':
        // [PR#155 R2] 原子开赛动作（修正版）：事件锁内全量校验 + 单事务写入。
        // 修正：目标场地存在不同 match_id 投影一律拒绝（不论待开赛/比赛中）；
        // 补充：referee 必须已注册、投影场地与 task 场地一致、裁判已在其他场地执裁时拒绝。
        $match_id = normalizeId($req['match_id'] ?? '');
        $referee_id = $req['referee_id'] ?? '';
        $score_text = $req['score_text'] ?? '0-0';
        if (!$match_id) { echo json_encode(['status' => 'error', 'message' => '缺少比赛ID']); break; }
        if (!$referee_id) { echo json_encode(['status' => 'error', 'message' => '缺少裁判ID']); break; }
        try {
            $pdo->beginTransaction();
            // 事件级互斥锁：锁定 config 行防止并发开赛
            $lockStmt = $pdo->prepare("SELECT data_value FROM nhpa_store WHERE event_code = ? AND data_key = 'config' FOR UPDATE");
            $lockStmt->execute([$event_code]);
            if ($lockStmt->fetchColumn() === false) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '赛事不存在']); break; }
            $tasks = kv_get($event_code, 'tasks', []);
            $live = kv_get($event_code, 'live_scores', []);
            $refs = kv_get($event_code, 'referees', []);
            // 1. task 必须存在且已分配场地；保存实际 task key，不得假设 $tasks[$match_id] 存在
            $task = null; $task_key = null; $taskCourt = '';
            foreach ($tasks as $key => $t) { if (normalizeId($key) === $match_id) { $task = $t; $task_key = $key; $taskCourt = trim($t['court'] ?? ''); break; } }
            if (!$task) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '未找到该比赛任务']); break; }
            if ($taskCourt === '') { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '该任务未分配场地']); break; }
            // 1a. [PR#155 R3] task.status 必须为缺省/未开始；异常的"比赛中 + 待开赛投影"不得再次开赛
            $taskStatus = $task['status'] ?? '';
            if ($taskStatus !== '' && $taskStatus !== '未开始') {
                // [PR#155 R6] 响应丢失幂等恢复：task.status=比赛中时，检查完整权威状态
                if ($taskStatus === '比赛中') {
                    $liveCourt2 = null;
                    foreach ($live as $court => $info) { if (normalizeId($info['match_id'] ?? '') === $match_id) { $liveCourt2 = $court; break; } }
                    if ($liveCourt2 !== null
                        && ($live[$liveCourt2]['status'] ?? '') === '比赛中'
                        && normalizeId($live[$liveCourt2]['referee'] ?? '') === normalizeId($referee_id)
                        && (string)$liveCourt2 === (string)$taskCourt
                    ) {
                        $refIdx2 = null;
                        foreach ($refs as $idx => $r) { if (normalizeId($r['name'] ?? '') === normalizeId($referee_id)) { $refIdx2 = $idx; break; } }
                        if ($refIdx2 !== null
                            && ($refs[$refIdx2]['status'] ?? '') === '执裁中'
                            && (string)($refs[$refIdx2]['current_court'] ?? '') === (string)$taskCourt
                            && ($task['live_score'] ?? '') === ($live[$liveCourt2]['score'] ?? '')
                            && ($task['live_score'] ?? '') === $score_text
                        ) {
                            $pdo->rollBack();
                            echo json_encode(['status' => 'success', 'idempotent' => true, 'court' => $taskCourt]);
                            break;
                        }
                    }
                }
                $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => "该任务状态为「{$taskStatus}」，不可开赛"]); break;
            }
            // 2. live_scores 中必须存在该 task 的待开赛投影，且投影场地与 task 权威场地一致
            $liveCourt = null;
            foreach ($live as $court => $info) { if (normalizeId($info['match_id'] ?? '') === $match_id) { $liveCourt = $court; break; } }
            if ($liveCourt === null) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '无待开赛投影']); break; }
            if ((string)$liveCourt !== (string)$taskCourt) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '投影场地与任务场地不一致，请重新领取']); break; }
            if (($live[$liveCourt]['status'] ?? '') !== '待开赛') { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '投影状态不是待开赛']); break; }
            // 3. 投影 referee 与请求 referee_id 一致
            if (normalizeId($live[$liveCourt]['referee'] ?? '') !== normalizeId($referee_id)) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '裁判归属不匹配']); break; }
            // 4. 目标场地存在任何不同 match_id 的投影 → 一律拒绝，不论待开赛还是比赛中
            foreach ($live as $court => $info) {
                if ((string)$court === (string)$taskCourt && normalizeId($info['match_id'] ?? '') !== $match_id) {
                    $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '场地已被其他比赛占用']); break 2;
                }
            }
            // 5. referee 必须已注册；找不到时 rollback，不得把 task/live 改为比赛中（零部分写入）
            $refIdx = null;
            foreach ($refs as $idx => $r) { if (normalizeId($r['name'] ?? '') === normalizeId($referee_id)) { $refIdx = $idx; break; } }
            if ($refIdx === null) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '裁判未注册，无法开赛']); break; }
            // 6. 裁判当前若已在其他 court 执裁 → 拒绝开赛（同场重复开赛不受此限）
            if (($refs[$refIdx]['status'] ?? '') === '执裁中' && (string)($refs[$refIdx]['current_court'] ?? '') !== (string)$taskCourt) {
                $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '该裁判正在其他场地执裁，无法开赛']); break;
            }
            // 所有校验通过——原子写入（均使用实际 key/场地）
            $tasks[$task_key]['status'] = '比赛中'; $tasks[$task_key]['live_score'] = $score_text;
            kv_set($event_code, 'tasks', $tasks);
            $live[$liveCourt]['status'] = '比赛中'; $live[$liveCourt]['score'] = $score_text;
            if (!empty($req['match_name'])) $live[$liveCourt]['match_name'] = $req['match_name'];
            kv_set($event_code, 'live_scores', $live);
            $refs[$refIdx]['status'] = '执裁中'; $refs[$refIdx]['current_court'] = $taskCourt;
            kv_set($event_code, 'referees', $refs);
            $pdo->commit();
            echo json_encode(['status' => 'success', 'idempotent' => false, 'court' => $taskCourt]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;
    case 'sync_live_score':
        // [PR#155 REVIEW FIX] 加固归属校验：每次比分同步必须验证 referee_id 与投影归属一致。
        $courts = kv_get($event_code, 'courts', []); $c = $req['court'] ?? '';
        $mid = $req['match_id'] ?? '';
        $referee_id = $req['referee_id'] ?? '';
        $norm_mid = normalizeId($mid);
        if (!$mid || !$referee_id) { echo json_encode(['status' => 'error', 'message' => '缺少 match_id 或 referee_id']); break; }
        try {
            $pdo->beginTransaction();
            $lockStmt = $pdo->prepare("SELECT data_value FROM nhpa_store WHERE event_code = ? AND data_key = 'config' FOR UPDATE");
            $lockStmt->execute([$event_code]);
            if ($lockStmt->fetchColumn() === false) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '赛事不存在']); break; }
            $tasks = kv_get($event_code, 'tasks', []);
            $live = kv_get($event_code, 'live_scores', []);
            // 1. task 必须存在
            $taskExists = false;
            foreach ($tasks as $key => $t) { if (normalizeId($key) === $norm_mid) { $taskExists = true; break; } }
            if (!$taskExists) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '任务不存在']); break; }
            // 2. live_scores 投影必须存在
            $liveCourt = null;
            foreach ($live as $court => $info) { if (normalizeId($info['match_id'] ?? '') === $norm_mid) { $liveCourt = $court; break; } }
            if (!$liveCourt) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '无有效投影']); break; }
            // 3. 投影必须为比赛中
            if (($live[$liveCourt]['status'] ?? '') !== '比赛中') { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '比赛未在进行中']); break; }
            // 4. referee 归属一致
            if (normalizeId($live[$liveCourt]['referee'] ?? '') !== normalizeId($referee_id)) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '裁判归属不匹配']); break; }
            // 5. court 与权威投影一致（PHP 数组键 int/string 自动转换，用 == 比较）
            if ($c && (string)$c !== (string)$liveCourt) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '场地不一致']); break; }
            // 校验通过——更新比分
            if (isset($courts[$liveCourt])) {
                $courts[$liveCourt] = array_merge($courts[$liveCourt], ['score' => $req['score_text'], 'status' => '比赛中', 'match_name' => $req['match_name']]);
                kv_set($event_code, 'courts', $courts);
            }
            foreach ($tasks as $key => &$t) {
                if (normalizeId($key) === $norm_mid) { $t['live_score'] = $req['score_text']; $t['status'] = '比赛中'; break; }
            }
            kv_set($event_code, 'tasks', $tasks);
            $live[$liveCourt]['status'] = '比赛中'; $live[$liveCourt]['score'] = $req['score_text'];
            kv_set($event_code, 'live_scores', $live);
            $pdo->commit();
            echo json_encode(['status' => 'success']);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;
    case 'save_score':
        // [PR#155 R2] 原子完赛事务（归属加固版）：写入前完成 task/live/referee 全量权威校验，
        // 任何一项不符即 rollback；record 的队伍/场地/裁判等权威字段全部取自服务端，
        // 客户端只提交比分、详情、签名等比赛结果数据，不信任其展示的 t1/t2/court/referee。
        $match_id = normalizeId($req['id'] ?? '');
        $referee_id = normalizeId($req['referee_id'] ?? $req['referee'] ?? '');
        $req_court = isset($req['court']) ? trim((string)$req['court']) : '';
        if (!$match_id) { echo json_encode(['status' => 'error', 'message' => '缺少比赛ID']); break; }
        if (!$referee_id) { echo json_encode(['status' => 'error', 'message' => '缺少裁判ID']); break; }
        // [PR#155 R7] req.court 必须非空（首次提交和幂等重试均适用）
        if ($req_court === '') { echo json_encode(['status' => 'error', 'message' => '缺少场地信息']); break; }
        try {
            $pdo->beginTransaction();
            $lockStmt = $pdo->prepare("SELECT data_value FROM nhpa_store WHERE event_code = ? AND data_key = 'config' FOR UPDATE");
            $lockStmt->execute([$event_code]);
            if ($lockStmt->fetchColumn() === false) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '赛事不存在']); break; }
            $tasks = kv_get($event_code, 'tasks', []);
            $live = kv_get($event_code, 'live_scores', []);
            $refs = kv_get($event_code, 'referees', []);
            // 0. [PR#155 R6] 响应丢失幂等恢复：在 task 存在性检查之前，先检查是否已有相同比赛的已提交 record
            $records = kv_get($event_code, 'records', []);
            $existingRecord = null;
            foreach ($records as $rec) {
                if (normalizeId($rec['id'] ?? '') === $match_id) { $existingRecord = $rec; break; }
            }
            if ($existingRecord !== null) {
                $reqScore = $req['score'] ?? '';
                $reqWinner = trim($req['winner'] ?? '');
                $reqDetails = $req['details'] ?? '';
                $reqSignature = $req['signature'] ?? '';
                // [PR#155 R7] 严格比较，不使用自匹配回退
                if (normalizeId($existingRecord['referee'] ?? '') === $referee_id
                    && (string)($existingRecord['court'] ?? '') === (string)$req_court
                    && ($existingRecord['score'] ?? '') === $reqScore
                    && ($existingRecord['winner'] ?? '') === $reqWinner
                    && ($existingRecord['details'] ?? '') === $reqDetails
                    && ($existingRecord['signature'] ?? '') === $reqSignature
                ) {
                    $pdo->rollBack();
                    echo json_encode(['status' => 'success', 'idempotent' => true]);
                    break;
                }
                $pdo->rollBack();
                echo json_encode(['status' => 'error', 'message' => '比赛已完赛，但重试内容与已保存记录不一致']);
                break;
            }
            // 1. task 必须存在（保存实际 key，不假设 $tasks[$match_id] 存在）
            $task = null; $task_key = null; $taskCourt = '';
            foreach ($tasks as $key => $t) { if (normalizeId($key) === $match_id) { $task = $t; $task_key = $key; $taskCourt = trim((string)($t['court'] ?? '')); break; } }
            if (!$task) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '任务不存在']); break; }
            // 2. live 投影必须存在且 match_id 一致
            $liveCourt = null;
            foreach ($live as $court => $info) { if (normalizeId($info['match_id'] ?? '') === $match_id) { $liveCourt = $court; break; } }
            if ($liveCourt === null) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '无有效投影']); break; }
            // 3. live.status 必须为比赛中
            if (($live[$liveCourt]['status'] ?? '') !== '比赛中') { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '比赛尚未开始，无法提交成绩']); break; }
            // 4. 投影归属与请求裁判一致（不得用客户端展示的 referee 作为权威）
            if (normalizeId($live[$liveCourt]['referee'] ?? '') !== $referee_id) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '裁判归属不匹配，无权提交该场比赛成绩']); break; }
            // 5. task.court、live court、请求 court 三者一致（请求 court 可省略，省略时以权威场地为准）
            if ((string)$liveCourt !== (string)$taskCourt) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '场地数据不一致']); break; }
            if ($req_court !== '' && (string)$req_court !== (string)$taskCourt) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '请求场地与比赛场地不符']); break; }
            // 6. referee 必须存在、状态为执裁中、且 current_court 与比赛场地一致（防伪造裁判完赛）
            $refIdx = null;
            foreach ($refs as $idx => $r) { if (normalizeId($r['name'] ?? '') === $referee_id) { $refIdx = $idx; break; } }
            if ($refIdx === null) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '裁判不存在']); break; }
            if (($refs[$refIdx]['status'] ?? '') !== '执裁中') { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '裁判当前非执裁状态']); break; }
            if ((string)($refs[$refIdx]['current_court'] ?? '') !== (string)$taskCourt) { $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '裁判当前场地与比赛场地不符']); break; }
            // 7. [PR#155 R3+R4] winner 必须严格等于服务端 task.t1 或 task.t2；空值/缺失队伍一律拒绝
            $winner = trim($req['winner'] ?? '');
            $taskT1 = trim($task['t1'] ?? '');
            $taskT2 = trim($task['t2'] ?? '');
            if ($taskT1 === '' || $taskT2 === '') {
                $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '任务队伍信息不完整，无法完赛']); break;
            }
            if ($winner !== $taskT1 && $winner !== $taskT2) {
                $pdo->rollBack(); echo json_encode(['status' => 'error', 'message' => '胜者必须为参赛队伍之一']); break;
            }
            // 所有校验通过——同一事务内原子写入（权威字段取自服务端 task/live/referee）
            $records[] = [
                'id' => $task_key,
                'court' => $taskCourt,
                't1' => $task['t1'] ?? ($live[$liveCourt]['t1'] ?? ''),
                't2' => $task['t2'] ?? ($live[$liveCourt]['t2'] ?? ''),
                'score' => $req['score'] ?? '',
                'winner' => $winner,
                'details' => $req['details'] ?? '',
                'referee' => $refs[$refIdx]['name'] ?? $referee_id,
                'signature' => $req['signature'] ?? '',
                'is_team' => (bool)($task['is_team'] ?? false),
                'time' => date('Y-m-d H:i:s')
            ];
            kv_set($event_code, 'records', $records);
            unset($tasks[$task_key]); kv_set($event_code, 'tasks', $tasks);
            unset($live[$liveCourt]); kv_set($event_code, 'live_scores', $live);
            $refs[$refIdx]['status'] = '空闲'; $refs[$refIdx]['current_court'] = ''; $refs[$refIdx]['match_count'] = ($refs[$refIdx]['match_count'] ?? 0) + 1;
            kv_set($event_code, 'referees', $refs);
            $pdo->commit();
            echo json_encode(['status' => 'success', 'idempotent' => false]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;
    case 'get_qrcode': echo json_encode(['status' => 'success', 'qrcode' => kv_get($event_code, 'qrcode', '')]); break;

    case 'set_broadcast':
        if (!check_referee_pwd($pdo, $event_code, $req['pwd'] ?? '')) { echo json_encode(['status' => 'error', 'message' => '权限不足']); exit; }
        kv_set($event_code, 'broadcast_msg', $req['message'] ?? '');
        echo json_encode(['status' => 'success']); break;
    case 'get_broadcast':
        echo json_encode(['status' => 'success', 'message' => kv_get($event_code, 'broadcast_msg', '')]); break;

    case 'set_referee_msg':
        if (!check_referee_pwd($pdo, $event_code, $req['pwd'] ?? '')) { echo json_encode(['status' => 'error', 'message' => '权限不足']); exit; }
        kv_set($event_code, 'referee_msg', $req['message'] ?? '');
        echo json_encode(['status' => 'success']); break;
    case 'get_referee_msg':
        echo json_encode(['status' => 'success', 'message' => kv_get($event_code, 'referee_msg', '')]); break;

    case 'set_event_notice': kv_set($event_code, 'event_notice', $req['notices'] ?? []); echo json_encode(['status' => 'success']); break;
    case 'get_event_notice':
        $val = kv_get($event_code, 'event_notice', []);
        if (!is_array($val)) $val = [];
        $brand = ['text' => '🚀 Pickle球赛事管理系统 | 执裁全程无纸化 | 完美适配网球记 | 无限哥团队', 'image' => '', 'fixed' => true];
        $result = [$brand];
        foreach ($val as $item) { if (!isset($item['fixed']) || !$item['fixed']) { $result[] = $item; } }
        echo json_encode(['status' => 'success', 'data' => $result]);
        break;
    case 'reset_event':
        $pdo->prepare("DELETE FROM nhpa_store WHERE event_code = ?")->execute([$event_code]); $pdo->prepare("DELETE FROM nhpa_waivers WHERE event_code = ?")->execute([$event_code]); echo json_encode(['status' => 'success']); break;

    case 'download_all_zip':
        if (!extension_loaded('zip')) { header('Content-Type: text/html; charset=utf-8'); echo "<script>alert('服务器尚未开启 PHP ZipArchive 扩展，无法打包！');window.close();</script>"; exit; }
        $zip = new ZipArchive(); $zipFileName = tempnam(sys_get_temp_dir(), 'nhpa_zip');
        if ($zip->open($zipFileName, ZipArchive::CREATE) !== TRUE) { header('Content-Type: text/html; charset=utf-8'); echo "<script>alert('无法在服务器创建临时压缩包');window.close();</script>"; exit; }

        $matchesCsv = "\xEF\xBB\xBF比赛编号,场地,对阵1,对阵2,比分,胜方,裁判,详情,时间\n";
        $records = kv_get($event_code, 'records', []);
        foreach ($records as $r) {
            $matchesCsv .= sprintf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n", $r['id'] ?? '', $r['court'] ?? '', $r['t1'] ?? '', $r['t2'] ?? '', $r['score'] ?? '', $r['winner'] ?? '', $r['referee'] ?? '', $r['details'] ?? '', $r['time'] ?? '');
            if (!empty($r['signature']) && preg_match('/^data:image\/(\w+);base64,/', $r['signature'], $type)) {
                $imgData = base64_decode(substr($r['signature'], strpos($r['signature'], ',') + 1));
                $safeId = preg_replace('/[\\\\\/:\*\?"<>\|]/', '_', $r['id'] ?? '未知');
                $zip->addFromString("比赛签名凭证/Match_{$safeId}.jpg", $imgData);
            }
        }
        $zip->addFromString("全量比赛成绩单.csv", $matchesCsv);

        $waiversCsv = "\xEF\xBB\xBF赛事码,姓名,身份证后4位,签到时间,告知书内容(前100字)\n";
        $stmt = $pdo->prepare("SELECT * FROM nhpa_waivers WHERE event_code = ? ORDER BY sign_time DESC"); $stmt->execute([$event_code]);
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $waiver_short = $row['waiver_text'] ? mb_substr($row['waiver_text'], 0, 100) . '...' : '';
            $waiversCsv .= sprintf("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n", $row['event_code'], $row['player_name'], $row['id_last4'], $row['sign_time'], $waiver_short);
            if (!empty($row['signature']) && preg_match('/^data:image\/(\w+);base64,/', $row['signature'], $type)) {
                $imgData = base64_decode(substr($row['signature'], strpos($row['signature'], ',') + 1));
                $safeName = preg_replace('/[\\\\\/:\*\?"<>\|]/', '_', $row['player_name']);
                $zip->addFromString("免责声明签名册/{$safeName}_{$row['id_last4']}.jpg", $imgData);
            }
        }
        $zip->addFromString("全员法务免责表.csv", $waiversCsv);

        $zip->close(); header('Content-Type: application/zip'); header('Content-Disposition: attachment; filename="Pickle球赛事资料归档_'.$event_code.'.zip"'); header('Content-Length: ' . filesize($zipFileName)); readfile($zipFileName); unlink($zipFileName); exit;

    case 'download':
        header('Content-Type: text/csv; charset=utf-8'); header('Content-Disposition: attachment; filename="Pickle球_Matches_'.$event_code.'.csv"');
        $out = fopen('php://output', 'w'); fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF)); fputcsv($out, ['比赛编号', '场地', '对阵1', '对阵2', '比分', '胜方', '裁判', '详情', '时间']);
        foreach (kv_get($event_code, 'records', []) as $r) { fputcsv($out, [$r['id'] ?? '', $r['court'] ?? '', $r['t1'] ?? '', $r['t2'] ?? '', $r['score'] ?? '', $r['winner'] ?? '', $r['referee'] ?? '', $r['details'] ?? '', $r['time'] ?? '']); }
        fclose($out); break;
    case 'download_waivers':
        header('Content-Type: text/csv; charset=utf-8'); header('Content-Disposition: attachment; filename="Pickle球_Waivers_'.$event_code.'.csv"');
        $out = fopen('php://output', 'w'); fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF)); fputcsv($out, ['赛事码', '姓名', '身份证后4位', '签到时间']);
        $stmt = $pdo->prepare("SELECT event_code, player_name, id_last4, sign_time FROM nhpa_waivers WHERE event_code = ? ORDER BY sign_time DESC"); $stmt->execute([$event_code]);
        while($row = $stmt->fetch(PDO::FETCH_ASSOC)) { fputcsv($out, [$row['event_code'], $row['player_name'], $row['id_last4'], $row['sign_time']]); }
        fclose($out); break;
    case 'get_sys_data':
        $type = $req['type'] ?? $_GET['type']; echo json_encode(['status' => 'success', 'data' => kv_get('SYSTEM_GLOBAL', $type, [])]); break;
    case 'save_sys_data':
        if (!is_super_admin_authorized($req['pwd'] ?? '')) { echo json_encode(['status' => 'error', 'message' => '鉴权失败']); exit; }
        $type = $req['type']; $list = kv_get('SYSTEM_GLOBAL', $type, []);
        if (isset($req['delete_id'])) { $list = array_filter($list, function($item) use ($req) { return $item['id'] !== $req['delete_id']; }); $list = array_values($list); }
        else { $newItem = $req['item']; $newItem['id'] = uniqid('ID_'); $newItem['date'] = date('Y-m-d H:i'); array_unshift($list, $newItem); }
        kv_set('SYSTEM_GLOBAL', $type, $list); echo json_encode(['status' => 'success']); break;
    default: echo json_encode(['status' => 'error', 'message' => '无效路由指令']);
}
?>
