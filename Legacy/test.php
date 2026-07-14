<?php
$db_host = 'mysql';   // 或者用 IP
$db_port = '3306';
$db_name = 'nhpa';
$db_user = 'root';
$db_pass = '123456';

try {
    $pdo = new PDO("mysql:host=$db_host;port=$db_port;charset=utf8mb4", $db_user, $db_pass);
    echo "✅ 数据库连接成功！<br>";
    $pdo->exec("USE $db_name");
    echo "✅ 已切换到数据库 $db_name <br>";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "📋 表列表: " . implode(', ', $tables);
} catch (PDOException $e) {
    echo "❌ 连接失败: " . $e->getMessage();
}
?>