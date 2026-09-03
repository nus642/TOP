<?php
/**
 * Pickle球 赛事数字枢纽 - 核心数据总线 (V9.1 风险告知书管理版)
 */

$db_host = getenv('MYSQL_HOST') ?: '10.30.111.124'; 
$db_port = getenv('MYSQL_PORT') ?: '3306';
$db_name = getenv('MYSQL_DB') ?: 'nhpa';
$db_user = getenv('MYSQL_USER') ?: 'root';
$db_pass = getenv('MYSQL_PASS') ?: 'Bk123456';

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
    global $pdo; $valStr = is_string($value) ? $value : json_encode($value, JSON_UNESCAPED_UNICODE); 
    $stmt = $pdo->prepare("INSERT INTO nhpa_store (event_code, data_key, data_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data_value = ?"); 
    $stmt->execute([$event, $key, $valStr, $valStr]); 
}
function normalizeId($id) { return strtoupper(trim(preg_replace('/\s+/', '', $id))); }

function is_super_admin_authorized($provided) {
    $configured = getenv('SUPER_ADMIN_PWD');
    return is_string($configured) && $configured !== '' && is_string($provided) && hash_equals($configured, $provided);
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
        // 若未配置，返回本地生成内容
        $hour = date('H');
        $timeGreeting = ($hour < 6) ? '夜深了' : (($hour < 12) ? '早上好' : (($hour < 18) ? '下午好' : '晚上好'));
        $greeting = "小P说：{$timeGreeting}！今天是 " . date('Y年n月j日 l') . "，阳光正好，赛场见真章！加油，选手们！🏓";
        echo json_encode(['status' => 'success', 'greeting' => $greeting, 'has_notice' => $hasNotice]);
        break;
    }
    
    $prompt = $hasNotice 
        ? "以下是赛事公告内容：\"$noticeText\"。请根据这些公告内容，生成一段热情洋溢的赛场欢迎语或提示语，语气亲切，以'小P说'开头，不超过60字。"
        : "今天是 " . date('Y年n月j日 l') . "。请生成一段热情洋溢的赛场欢迎语，包含对选手的鼓励，以'小P说'开头，不超过60字。";
    
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
        $greeting = $result['choices'][0]['message']['content'] ?? '';
    } else {
        $greeting = '';
    }
    
    if (empty($greeting)) {
        // 降级
        $hour = date('H');
        $timeGreeting = ($hour < 6) ? '夜深了' : (($hour < 12) ? '早上好' : (($hour < 18) ? '下午好' : '晚上好'));
        $greeting = "小P说：{$timeGreeting}！今天是 " . date('Y年n月j日 l') . "，阳光正好，赛场见真章！加油，选手们！🏓";
    }
    
    echo json_encode(['status' => 'success', 'greeting' => $greeting, 'has_notice' => $hasNotice]);
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
        $existing = kv_get($event_code, 'tasks', []);
        $new_tasks = $req['tasks'] ?? [];
        // 这里的关键是：确保传入的每一场任务都包含 'date' 字段（如果有的话）
        $combined = array_merge(array_values($existing), $new_tasks);
        $final_tasks = [];
        foreach($combined as $t) { 
            // 确保日期戳被持久化存储
            $final_tasks[$t['id']] = $t; 
        }
        kv_set($event_code, 'tasks', $final_tasks);
        echo json_encode(['status' => 'success']); break;
    case 'delete_task': $tasks = kv_get($event_code, 'tasks', []); $normId = normalizeId($req['match_id']); unset($tasks[$normId]); kv_set($event_code, 'tasks', $tasks); echo json_encode(['status' => 'success']); break;
    case 'update_task_court':
        $match_id = normalizeId($req['match_id'] ?? '');
        $new_court = trim($req['court'] ?? '');
        if (!$match_id || !$new_court) { echo json_encode(['status' => 'error', 'message' => '缺少比赛ID或场地号']); break; }
        $tasks = kv_get($event_code, 'tasks', []);
        $found = false;
        foreach ($tasks as $key => &$task) {
            if (normalizeId($key) === $match_id) { $task['court'] = $new_court; $found = true; break; }
        }
        if (!$found) { echo json_encode(['status' => 'error', 'message' => '未找到该比赛']); break; }
        kv_set($event_code, 'tasks', $tasks);
        $live = kv_get($event_code, 'live_scores', []);
        $old_court = null;
        foreach ($live as $court => $info) {
            if (isset($info['match_id']) && normalizeId($info['match_id']) === $match_id) { $old_court = $court; break; }
        }
        if ($old_court && $old_court !== $new_court) { $live[$new_court] = $live[$old_court]; unset($live[$old_court]); kv_set($event_code, 'live_scores', $live); }
        echo json_encode(['status' => 'success']);
        break;
    case 'clear_all_tasks': kv_set($event_code, 'tasks', []); echo json_encode(['status' => 'success']); break;
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
        $refs = kv_get($event_code, 'referees', []); $refs = array_filter($refs, function($r) use ($req) { return $r['name'] !== $req['referee_id']; }); kv_set($event_code, 'referees', array_values($refs)); echo json_encode(['status' => 'success']); break;
    case 'set_referees': kv_set($event_code, 'referees', $req['referees'] ?? []); echo json_encode(['status' => 'success']); break;    
    case 'referee_update_status':
        $refs = kv_get($event_code, 'referees', []); foreach ($refs as &$r) { if ($r['name'] === $req['referee_id']) { $r['status'] = $req['status']; $r['current_court'] = $req['court']; } } kv_set($event_code, 'referees', $refs);
        if ($req['status'] === '空闲' && !empty($req['court'])) { $live = kv_get($event_code, 'live_scores', []); unset($live[$req['court']]); kv_set($event_code, 'live_scores', $live); } echo json_encode(['status' => 'success']); break;
    case 'sync_live_score':
        $courts = kv_get($event_code, 'courts', []); $c = $req['court'] ?? '';
        if($c && isset($courts[$c])) {
            $courts[$c] = array_merge($courts[$c], ['score' => $req['score_text'], 'status' => $req['status'], 'match_name' => $req['match_name']]);
            kv_set($event_code, 'courts', $courts);
        }
        $tasks = kv_get($event_code, 'tasks', []);
        $mid = $req['match_id'] ?? '';
        if ($mid && isset($tasks[$mid])) {
            $tasks[$mid]['live_score'] = $req['score_text'];
            $tasks[$mid]['status'] = $req['status'];
            kv_set($event_code, 'tasks', $tasks);
        }
        echo json_encode(['status' => 'success']); break;
    case 'save_score':
        $records = kv_get($event_code, 'records', []); 
        $records[] = [ 'id' => $req['id'], 'court' => $req['court'], 't1' => $req['t1'], 't2' => $req['t2'], 'score' => $req['score'], 'winner' => $req['winner'], 'details' => $req['details'], 'referee' => $req['referee'], 'signature' => $req['signature'] ?? '', 'is_team' => $req['is_team'] ?? false, 'time' => date('Y-m-d H:i:s') ]; 
        kv_set($event_code, 'records', $records);
        $tasks = kv_get($event_code, 'tasks', []); $normId = normalizeId($req['id']); if (isset($tasks[$normId])) { unset($tasks[$normId]); kv_set($event_code, 'tasks', $tasks); }
        $refs = kv_get($event_code, 'referees', []);
        $refId = $req['referee_id'] ?? $req['referee'] ?? '';
        foreach ($refs as &$r) {
            if ($r['name'] === $refId) {
                $r['match_count'] = ($r['match_count'] ?? 0) + 1;
                break;
            }
        }
        kv_set($event_code, 'referees', $refs); 
        echo json_encode(['status' => 'success']); 
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
